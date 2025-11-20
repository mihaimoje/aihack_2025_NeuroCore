import express from 'express';
import Task from '../models/task.js';
import User from '../models/user.js';
import Team from '../models/team.js';
import Project from '../models/project.js';
import Notification from '../models/notification.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Octokit } from '@octokit/rest';

const router = express.Router();

// Helper function to parse GitHub URL
const parseGithubUrl = (url) => {
    if (!url) return null;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace('.git', '') };
};

// Helper function to create GitHub issue
const createGithubIssue = async (project, task, assignedUser, creatorUser) => {
    try {
        if (!project.githubLink) {
            console.log('No GitHub link for project');
            return null;
        }

        const githubInfo = parseGithubUrl(project.githubLink);
        if (!githubInfo) {
            console.log('Invalid GitHub URL format');
            return null;
        }

        // Use creator's GitHub token from database (usually the manager)
        const githubToken = creatorUser?.githubToken || process.env.GITHUB_TOKEN;
        if (!githubToken) {
            console.log('No GitHub token configured for user or in environment');
            return null;
        }

        console.log(`Using GitHub token from ${creatorUser?.githubToken ? 'user database' : 'environment'}`);
        const octokit = new Octokit({ auth: githubToken });

        const issueData = {
            owner: githubInfo.owner,
            repo: githubInfo.repo,
            title: task.title,
            body: `${task.description || 'No description provided'}\n\n---\n**Priority:** ${task.priority}\n**Estimated Hours:** ${task.estimateHours || 'Not set'}\n**Created from TeamManager**`,
            labels: [task.priority]
        };

        // Add assignee if user has GitHub username
        if (assignedUser?.githubUsername) {
            issueData.assignees = [assignedUser.githubUsername];
        }

        const response = await octokit.rest.issues.create(issueData);
        
        console.log(`GitHub issue created: #${response.data.number}`);
        
        return {
            issueNumber: response.data.number,
            issueUrl: response.data.html_url
        };
    } catch (error) {
        console.error('Error creating GitHub issue:', error.message);
        return null;
    }
};

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const GEMINI_MODELS = ['gemini-2.5-pro'];

// Helper to wait before retry
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getGeminiResponse(prompt, modelIndex = 0, retryCount = 0) {
    if (modelIndex >= GEMINI_MODELS.length) {
        throw new Error('All Gemini models failed');
    }

    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODELS[modelIndex] });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error(`Model ${GEMINI_MODELS[modelIndex]} failed (attempt ${retryCount + 1}):`, error.message);
        
        // If quota exceeded and we haven't retried yet, wait and retry same model
        if (error.message.includes('quota') && retryCount < 2) {
            const waitTime = 2000 * (retryCount + 1); // 2s, 4s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await delay(waitTime);
            return getGeminiResponse(prompt, modelIndex, retryCount + 1);
        }
        
        // Try next model
        return getGeminiResponse(prompt, modelIndex + 1, 0);
    }
}

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const { projectId, assignedTo, status } = req.query;
        const filter = {};

        if (projectId) filter.projectId = projectId;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (status) filter.status = status;

        const tasks = await Task.find(filter)
            .populate('projectId')
            .populate('assignedTo', '-password')
            .populate('createdBy', '-password');

        res.json(tasks.map(task => ({
            id: task._id,
            title: task.title,
            description: task.description,
            status: task.status === 'to-do' ? 'todo' : task.status,
            priority: task.priority,
            assigneeId: task.assignedTo?._id.toString(),
            projectId: task.projectId._id.toString(),
            estimatedHours: task.estimateHours || 0,
            actualHours: task.realHours || 0,
            startedAt: task.startedAt,
            completedAt: task.completedAt,
            createdAt: task.createdAt,
            dueDate: task.dueDate || task.createdAt
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get task by ID
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('projectId')
            .populate('assignedTo', '-password')
            .populate('createdBy', '-password');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({
            id: task._id,
            title: task.title,
            description: task.description,
            status: task.status === 'to-do' ? 'todo' : task.status,
            priority: task.priority,
            assigneeId: task.assignedTo?._id.toString(),
            assignee: task.assignedTo,
            projectId: task.projectId._id.toString(),
            project: task.projectId,
            estimatedHours: task.estimateHours || 0,
            actualHours: task.realHours || 0,
            startedAt: task.startedAt,
            completedAt: task.completedAt,
            createdAt: task.createdAt,
            createdBy: task.createdBy,
            dueDate: task.dueDate || task.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create task
router.post('/', async (req, res) => {
    try {
        const { projectId, title, description, assignedTo, createdBy, status, priority, estimateHours, realHours, dueDate } = req.body;

        const task = new Task({
            projectId,
            title,
            description,
            assignedTo,
            createdBy,
            status: status === 'todo' ? 'to-do' : status,
            priority,
            estimateHours,
            realHours,
            dueDate
        });

        await task.save();
        await task.populate('projectId');
        await task.populate('assignedTo', '-password');

        // Create GitHub issue automatically
        const project = await Project.findById(projectId);
        const assignedUser = assignedTo ? await User.findById(assignedTo) : null;
        const creatorUser = createdBy ? await User.findById(createdBy) : null;
        
        const githubIssue = await createGithubIssue(project, task, assignedUser, creatorUser);
        
        if (githubIssue) {
            task.githubIssueNumber = githubIssue.issueNumber;
            task.githubIssueUrl = githubIssue.issueUrl;
            await task.save();
            console.log(`Task linked to GitHub issue #${githubIssue.issueNumber}`);
        }

        res.status(201).json({
            id: task._id,
            title: task.title,
            description: task.description,
            status: task.status === 'to-do' ? 'todo' : task.status,
            priority: task.priority,
            assigneeId: task.assignedTo?._id.toString(),
            projectId: task.projectId._id.toString(),
            estimatedHours: task.estimateHours || 0,
            actualHours: task.realHours || 0,
            startedAt: task.startedAt,
            completedAt: task.completedAt,
            createdAt: task.createdAt,
            dueDate: task.dueDate || task.createdAt,
            githubIssueNumber: task.githubIssueNumber,
            githubIssueUrl: task.githubIssueUrl
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !['to-do', 'in-progress', 'done', 'todo'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const normalizedStatus = status === 'todo' ? 'to-do' : status;
        const updateData = { status: normalizedStatus };

        // Set timestamps based on status change
        if (normalizedStatus === 'in-progress') {
            updateData.startedAt = new Date();
        } else if (normalizedStatus === 'done') {
            updateData.completedAt = new Date();

            // Calculate actual hours if task has startedAt
            const existingTask = await Task.findById(req.params.id);
            if (existingTask && existingTask.startedAt) {
                const durationMs = updateData.completedAt - existingTask.startedAt;
                const durationHours = durationMs / (1000 * 60 * 60);
                updateData.realHours = Math.round(durationHours * 10) / 10; // Round to 1 decimal
            }
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        )
            .populate('projectId')
            .populate('assignedTo', '-password')
            .populate('createdBy', '-password');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Create notification for manager when task is completed
        if (normalizedStatus === 'done' && task.assignedTo) {
            try {
                // Find the team where this user belongs
                const team = await Team.findOne({ members: task.assignedTo._id });
                
                if (team && team.managerId) {
                    // Check if manager is different from the person completing the task
                    if (team.managerId.toString() !== task.assignedTo._id.toString()) {
                        await Notification.create({
                            userId: team.managerId,
                            type: 'task_completed',
                            title: 'Task Completed',
                            message: `${task.assignedTo.name} completed task: "${task.title}"`,
                            taskId: task._id,
                            projectId: task.projectId._id
                        });
                        console.log(`Notification created for manager ${team.managerId}`);
                    }
                }
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
                // Don't fail the request if notification creation fails
            }
        }

        res.json({
            id: task._id,
            title: task.title,
            description: task.description,
            status: task.status === 'to-do' ? 'todo' : task.status,
            priority: task.priority,
            assigneeId: task.assignedTo?._id.toString(),
            assignee: task.assignedTo,
            projectId: task.projectId._id.toString(),
            project: task.projectId,
            estimatedHours: task.estimateHours || 0,
            actualHours: task.realHours || 0,
            startedAt: task.startedAt,
            completedAt: task.completedAt,
            createdAt: task.createdAt,
            createdBy: task.createdBy,
            dueDate: task.dueDate || task.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const { title, description, status, priority, assignedTo, estimateHours, realHours, dueDate } = req.body;

        const updateData = { title, description, priority, assignedTo, estimateHours, realHours, dueDate };
        if (status) {
            updateData.status = status === 'todo' ? 'to-do' : status;
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        )
            .populate('projectId')
            .populate('assignedTo', '-password')
            .populate('createdBy', '-password');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({
            id: task._id,
            title: task.title,
            description: task.description,
            status: task.status === 'to-do' ? 'todo' : task.status,
            priority: task.priority,
            assigneeId: task.assignedTo?._id.toString(),
            assignee: task.assignedTo,
            projectId: task.projectId._id.toString(),
            project: task.projectId,
            estimatedHours: task.estimateHours || 0,
            actualHours: task.realHours || 0,
            startedAt: task.startedAt,
            completedAt: task.completedAt,
            createdAt: task.createdAt,
            createdBy: task.createdBy,
            dueDate: task.dueDate || task.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Smart sort tasks using Gemini AI
router.post('/smart-sort', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Get all incomplete tasks for the user
        const tasks = await Task.find({
            assignedTo: userId,
            status: { $in: ['to-do', 'in-progress'] }
        })
            .populate('projectId')
            .populate('assignedTo', '-password')
            .sort({ createdAt: 1 });

        if (tasks.length === 0) {
            return res.json({ sortedTaskIds: [], message: 'No incomplete tasks to sort' });
        }

        // Prepare task data for AI analysis
        const tasksForAI = tasks.map((task, index) => {
            const now = new Date();
            const dueDate = new Date(task.dueDate || task.createdAt);
            const hoursUntilDue = Math.max(0, (dueDate - now) / (1000 * 60 * 60));
            const daysUntilDue = (hoursUntilDue / 24).toFixed(1);
            const isOverdue = dueDate < now;
            
            const startedAt = task.startedAt ? new Date(task.startedAt) : null;
            const hoursInProgress = startedAt ? ((now - startedAt) / (1000 * 60 * 60)).toFixed(1) : null;

            return {
                index: index,
                id: task._id.toString(),
                title: task.title,
                description: task.description,
                status: task.status === 'to-do' ? 'todo' : task.status,
                priority: task.priority,
                estimatedHours: task.estimateHours || 0,
                dueDate: task.dueDate || task.createdAt,
                hoursUntilDue: hoursUntilDue.toFixed(1),
                daysUntilDue: daysUntilDue,
                isOverdue: isOverdue,
                startedAt: task.startedAt,
                hoursInProgress: hoursInProgress,
                projectName: task.projectId?.name || 'Unknown'
            };
        });

        // Create AI prompt
        const prompt = `You are a task management AI assistant. Analyze the following tasks and provide an optimal order for completing them.

Consider these factors in your analysis:
1. Priority level (high, medium, low)
2. Time until deadline (hours/days remaining)
3. Whether the task is already in progress
4. Whether the task is overdue
5. Estimated hours to complete
6. Project context

Tasks to analyze:
${JSON.stringify(tasksForAI, null, 2)}

IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format, with no additional text before or after:
{
  "sortedIndices": [array of task indices in recommended order],
  "reasoning": "Brief explanation of the sorting logic"
}

The sortedIndices array should contain the index numbers (0-${tasks.length - 1}) of the tasks in the recommended order.
Example: {"sortedIndices": [2, 0, 5, 1, 3, 4], "reasoning": "Prioritized overdue high-priority tasks first, then in-progress tasks, then by deadline"}`;

        console.log('Sending prompt to Gemini for task sorting...');
        const aiResponse = await getGeminiResponse(prompt);
        console.log('Raw AI response:', aiResponse);

        // Parse AI response
        let sortedIndices;
        let reasoning = '';
        
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanResponse = aiResponse.trim();
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            const parsed = JSON.parse(cleanResponse);
            sortedIndices = parsed.sortedIndices;
            reasoning = parsed.reasoning || 'AI-optimized task order';

            // Validate that we have all indices
            if (!Array.isArray(sortedIndices) || sortedIndices.length !== tasks.length) {
                throw new Error('Invalid sorted indices from AI');
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.error('AI response was:', aiResponse);
            
            // Fallback: sort by priority and deadline
            sortedIndices = tasksForAI
                .map((_, idx) => idx)
                .sort((a, b) => {
                    const taskA = tasksForAI[a];
                    const taskB = tasksForAI[b];
                    
                    // Overdue tasks first
                    if (taskA.isOverdue !== taskB.isOverdue) return taskA.isOverdue ? -1 : 1;
                    
                    // In progress tasks next
                    if ((taskA.status === 'in-progress') !== (taskB.status === 'in-progress')) {
                        return taskA.status === 'in-progress' ? -1 : 1;
                    }
                    
                    // Then by priority
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    const priorityDiff = priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    
                    // Finally by deadline
                    return parseFloat(taskA.hoursUntilDue) - parseFloat(taskB.hoursUntilDue);
                });
            
            reasoning = 'Fallback sorting: overdue tasks first, then in-progress, then by priority and deadline';
        }

        // Convert indices to task IDs
        const sortedTaskIds = sortedIndices.map(idx => tasks[idx]._id.toString());

        res.json({
            sortedTaskIds,
            reasoning,
            tasksAnalyzed: tasks.length
        });

    } catch (error) {
        console.error('Error in smart-sort:', error);
        res.status(500).json({ message: 'Failed to sort tasks', error: error.message });
    }
});

export default router;

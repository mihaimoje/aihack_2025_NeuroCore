import express from 'express';
import BurnoutScore from '../models/burnoutScore.js';
import GithubActivity from '../models/githubActivity.js';
import Task from '../models/task.js';
import User from '../models/user.js';
import Project from '../models/project.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Available models in order of preference
const AVAILABLE_MODELS = [
    'gemini-2.0-flash-exp',
    'gemini-exp-1206',
    'gemini-2.0-flash-thinking-exp-1219',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
];

// Calculate burnout score using Gemini AI
async function calculateBurnoutWithAI(userId, projectId = null) {
    try {
        // Fetch GitHub activity
        const githubFilter = { userId };
        if (projectId) githubFilter.projectId = projectId;
        
        const githubActivity = await GithubActivity.findOne(githubFilter)
            .sort({ lastSynced: -1 });
        
        // Fetch tasks
        const taskFilter = { assignedTo: userId };
        if (projectId) taskFilter.projectId = projectId;
        
        const allTasks = await Task.find(taskFilter);
        const tasksInProgress = allTasks.filter(t => ['to-do', 'in-progress'].includes(t.status));
        const completedTasks = allTasks.filter(t => t.status === 'done');
        const overdueTasks = allTasks.filter(t => 
            new Date(t.dueDate) < new Date() && t.status !== 'done'
        );
        
        // Get user info
        const user = await User.findById(userId).select('name email');
        
        // Prepare data for AI analysis
        const commitsCount = githubActivity?.commits?.length || 0;
        const recentCommits = githubActivity?.commits?.slice(0, 20) || [];
        const commitMessages = recentCommits.map(c => c.message).join('\n- ');
        
        const pullRequestsCount = githubActivity?.pullRequests?.length || 0;
        const issuesCount = githubActivity?.issues?.length || 0;
        
        // Create prompt for Gemini
        const prompt = `You are an expert in workplace burnout analysis. Analyze the following data and calculate a burnout risk score from 0-100.

**Developer Information:**
- Name: ${user?.name || 'Unknown'}
- User ID: ${userId}

**GitHub Activity (last 30 days):**
- Total Commits: ${commitsCount}
- Pull Requests: ${pullRequestsCount}
- Issues: ${issuesCount}
- Recent Commit Messages:
${commitMessages || 'No commits found'}

**Task Statistics:**
- Tasks In Progress: ${tasksInProgress.length}
- Completed Tasks: ${completedTasks.length}
- Overdue Tasks: ${overdueTasks.length}
- Total Tasks: ${allTasks.length}

**Analysis Instructions:**
1. Consider commit frequency and patterns (too many or too few can indicate stress)
2. Analyze commit messages for signs of stress, urgency, or frustration
3. Evaluate workload balance (tasks in progress vs completed)
4. Consider overdue tasks as a stress indicator
5. Look for patterns suggesting overwork or disengagement

**Response Format (MUST BE VALID JSON):**
{
  "score": <number 0-100>,
  "riskLevel": "<low|medium|high>",
  "factors": {
    "commitsCount": ${commitsCount},
    "tasksInProgress": ${tasksInProgress.length},
    "completedTasks": ${completedTasks.length},
    "overdueTasks": ${overdueTasks.length},
    "pullRequestsCount": ${pullRequestsCount}
  },
  "analysis": "<brief explanation>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}

Respond ONLY with valid JSON, no additional text.`;

        // Try models in order
        for (const modelName of AVAILABLE_MODELS) {
            try {
                console.log(`Trying burnout analysis with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text();
                
                // Clean up response
                text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                
                const aiResponse = JSON.parse(text);
                
                console.log(`✓ Burnout analysis successful with ${modelName}`);
                return {
                    score: aiResponse.score,
                    riskLevel: aiResponse.riskLevel,
                    factors: aiResponse.factors,
                    analysis: aiResponse.analysis,
                    recommendations: aiResponse.recommendations,
                    modelUsed: modelName
                };
            } catch (error) {
                console.log(`Model ${modelName} failed:`, error.message);
                continue;
            }
        }
        
        throw new Error('All AI models failed');
    } catch (error) {
        console.error('Error calculating burnout with AI:', error);
        
        // Fallback: simple calculation
        const githubActivity = await GithubActivity.findOne({ userId }).sort({ lastSynced: -1 });
        const tasks = await Task.find({ assignedTo: userId });
        const tasksInProgress = tasks.filter(t => ['to-do', 'in-progress'].includes(t.status));
        const completedTasks = tasks.filter(t => t.status === 'done');
        const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'done');
        
        const commitsCount = githubActivity?.commits?.length || 0;
        
        let score = 0;
        if (commitsCount > 50) score += 30;
        else if (commitsCount > 30) score += 20;
        else if (commitsCount > 15) score += 10;
        
        if (tasksInProgress.length > 8) score += 35;
        else if (tasksInProgress.length > 5) score += 25;
        else if (tasksInProgress.length > 3) score += 15;
        
        if (overdueTasks.length > 5) score += 25;
        else if (overdueTasks.length > 2) score += 15;
        
        if (completedTasks.length > 20) score += 10;
        
        score = Math.min(score, 100);
        
        let riskLevel = 'low';
        if (score >= 70) riskLevel = 'high';
        else if (score >= 40) riskLevel = 'medium';
        
        return {
            score,
            riskLevel,
            factors: {
                commitsCount,
                tasksInProgress: tasksInProgress.length,
                completedTasks: completedTasks.length,
                overdueTasks: overdueTasks.length,
                pullRequestsCount: 0
            },
            analysis: 'Fallback calculation used due to AI error',
            recommendations: ['Take regular breaks', 'Prioritize tasks', 'Communicate with team'],
            modelUsed: 'fallback'
        };
    }
}

// Get burnout scores (with AI generation on-the-fly)
router.get('/', async (req, res) => {
    try {
        const { userId, projectId, forceRefresh } = req.query;
        
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }
        
        // Check if we have a recent score (less than 1 hour old)
        const recentScore = await BurnoutScore.findOne({ 
            userId, 
            ...(projectId && { projectId }),
            createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        }).sort({ createdAt: -1 });
        
        if (recentScore && forceRefresh !== 'true') {
            console.log('Using cached burnout score');
            await recentScore.populate('userId', '-password');
            return res.json(recentScore);
        }
        
        // Generate new score with AI
        console.log(`Generating new burnout score for user ${userId}`);
        const aiResult = await calculateBurnoutWithAI(userId, projectId);
        
        // Get current week and year
        const now = new Date();
        const week = Math.ceil((now.getDate() + now.getDay()) / 7);
        const year = now.getFullYear();
        
        // Save to database
        const burnoutScore = new BurnoutScore({
            userId,
            ...(projectId && { projectId }),
            score: aiResult.score,
            riskLevel: aiResult.riskLevel,
            week,
            year,
            factors: aiResult.factors,
            analysis: aiResult.analysis,
            recommendations: aiResult.recommendations,
            modelUsed: aiResult.modelUsed
        });
        
        await burnoutScore.save();
        await burnoutScore.populate('userId', '-password');
        
        res.json(burnoutScore);
    } catch (error) {
        console.error('Error fetching burnout score:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get burnout score by ID
router.get('/:id', async (req, res) => {
    try {
        const burnoutScore = await BurnoutScore.findById(req.params.id).populate('userId', '-password');
        if (!burnoutScore) {
            return res.status(404).json({ message: 'Burnout score not found' });
        }
        res.json(burnoutScore);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create burnout score
router.post('/', async (req, res) => {
    try {
        const { userId, score, week, year, factors } = req.body;
        const burnoutScore = new BurnoutScore({ userId, score, week, year, factors });
        await burnoutScore.save();
        await burnoutScore.populate('userId', '-password');
        res.status(201).json(burnoutScore);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update burnout score
router.put('/:id', async (req, res) => {
    try {
        const { score, week, year, factors } = req.body;
        const burnoutScore = await BurnoutScore.findByIdAndUpdate(
            req.params.id,
            { score, week, year, factors },
            { new: true }
        ).populate('userId', '-password');
        
        if (!burnoutScore) {
            return res.status(404).json({ message: 'Burnout score not found' });
        }
        res.json(burnoutScore);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete burnout score
router.delete('/:id', async (req, res) => {
    try {
        const burnoutScore = await BurnoutScore.findByIdAndDelete(req.params.id);
        if (!burnoutScore) {
            return res.status(404).json({ message: 'Burnout score not found' });
        }
        res.json({ message: 'Burnout score deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get team burnout scores for a manager
router.get('/team/:managerId', async (req, res) => {
    try {
        const { managerId } = req.params;
        const { forceRefresh } = req.query;
        
        // Find all teams where user is manager
        const Team = (await import('../models/team.js')).default;
        const teams = await Team.find({ managerId }).populate('members', 'name email role githubUsername');
        
        if (!teams || teams.length === 0) {
            return res.status(404).json({ message: 'No teams found for this manager' });
        }
        
        // Get all team members
        const allMembers = teams.flatMap(team => team.members);
        const uniqueMembers = [...new Map(allMembers.map(m => [m._id.toString(), m])).values()];
        
        // Calculate burnout for each member
        const teamBurnout = [];
        for (const member of uniqueMembers) {
            try {
                // Check for recent score
                let burnoutData;
                const recentScore = await BurnoutScore.findOne({ 
                    userId: member._id,
                    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
                }).sort({ createdAt: -1 });
                
                if (recentScore && forceRefresh !== 'true') {
                    burnoutData = recentScore;
                } else {
                    // Generate new score
                    const aiResult = await calculateBurnoutWithAI(member._id);
                    
                    const now = new Date();
                    const week = Math.ceil((now.getDate() + now.getDay()) / 7);
                    const year = now.getFullYear();
                    
                    const burnoutScore = new BurnoutScore({
                        userId: member._id,
                        score: aiResult.score,
                        riskLevel: aiResult.riskLevel,
                        week,
                        year,
                        factors: aiResult.factors,
                        analysis: aiResult.analysis,
                        recommendations: aiResult.recommendations,
                        modelUsed: aiResult.modelUsed
                    });
                    
                    await burnoutScore.save();
                    burnoutData = burnoutScore;
                }
                
                teamBurnout.push({
                    userId: member._id,
                    name: member.name,
                    email: member.email,
                    role: member.role,
                    githubUsername: member.githubUsername,
                    score: burnoutData.score,
                    riskLevel: burnoutData.riskLevel,
                    factors: burnoutData.factors,
                    analysis: burnoutData.analysis,
                    recommendations: burnoutData.recommendations,
                    lastUpdated: burnoutData.createdAt
                });
            } catch (error) {
                console.error(`Error calculating burnout for ${member.name}:`, error);
                teamBurnout.push({
                    userId: member._id,
                    name: member.name,
                    email: member.email,
                    role: member.role,
                    score: 0,
                    riskLevel: 'low',
                    error: 'Failed to calculate'
                });
            }
        }
        
        // Calculate team averages
        const avgScore = teamBurnout.reduce((sum, m) => sum + (m.score || 0), 0) / teamBurnout.length;
        const highRiskCount = teamBurnout.filter(m => m.riskLevel === 'high').length;
        const mediumRiskCount = teamBurnout.filter(m => m.riskLevel === 'medium').length;
        const lowRiskCount = teamBurnout.filter(m => m.riskLevel === 'low').length;
        
        res.json({
            managerId,
            teamSize: teamBurnout.length,
            averageScore: Math.round(avgScore),
            riskDistribution: {
                high: highRiskCount,
                medium: mediumRiskCount,
                low: lowRiskCount
            },
            members: teamBurnout.sort((a, b) => (b.score || 0) - (a.score || 0))
        });
    } catch (error) {
        console.error('Error fetching team burnout:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get team activity hours (for heatmap)
router.get('/team/:managerId/hours', async (req, res) => {
    try {
        const { managerId } = req.params;
        
        // Find all teams where user is manager
        const Team = (await import('../models/team.js')).default;
        const teams = await Team.find({ managerId }).populate('members');
        
        if (!teams || teams.length === 0) {
            return res.status(404).json({ message: 'No teams found for this manager' });
        }
        
        // Get all team member IDs
        const memberIds = teams.flatMap(team => team.members.map(m => m._id));
        
        // Get all completed tasks for team members in the last 4 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        
        const tasks = await Task.find({
            assignedTo: { $in: memberIds },
            status: 'done',
            completedAt: { $gte: fourWeeksAgo }
        }).select('startedAt completedAt assignedTo');
        
        // Calculate daily hours for the last 28 days
        const dailyHours = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Initialize all days with 0 hours
        for (let i = 0; i < 28; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailyHours[dateKey] = 0;
        }
        
        // Calculate hours from tasks
        tasks.forEach(task => {
            if (task.startedAt && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                completedDate.setHours(0, 0, 0, 0);
                const dateKey = completedDate.toISOString().split('T')[0];
                
                if (dailyHours.hasOwnProperty(dateKey)) {
                    const durationMs = new Date(task.completedAt) - new Date(task.startedAt);
                    const durationHours = durationMs / (1000 * 60 * 60);
                    dailyHours[dateKey] += durationHours;
                }
            }
        });
        
        // Convert to array format for frontend
        const hoursArray = Object.entries(dailyHours)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, hours]) => ({
                date,
                hours: Math.round(hours * 10) / 10,
                dayOfWeek: new Date(date).toLocaleString('en-US', { weekday: 'short' })
            }));
        
        res.json({
            managerId,
            period: {
                start: fourWeeksAgo.toISOString().split('T')[0],
                end: today.toISOString().split('T')[0]
            },
            dailyHours: hoursArray
        });
    } catch (error) {
        console.error('Error fetching team hours:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;

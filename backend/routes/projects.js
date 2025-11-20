import express from 'express';
import Project from '../models/project.js';
import Task from '../models/task.js';
import User from '../models/user.js';

const router = express.Router();

// Get projects for current user (based on userId query param)
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Both managers and developers see only projects where they are members
        const projects = await Project.find({ members: userId })
            .populate('teamId')
            .populate('members', '-password');

        res.json(projects.map(project => ({
            id: project._id,
            name: project.name,
            description: project.description,
            githubUrl: project.githubLink,
            members: project.members.map(m => m._id.toString()),
            teamId: project.teamId,
            status: project.status,
            createdAt: project.createdAt
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('teamId')
            .populate('members', '-password');

        res.json(projects.map(project => ({
            id: project._id,
            name: project.name,
            description: project.description,
            githubUrl: project.githubLink,
            members: project.members.map(m => m._id.toString()),
            teamId: project.teamId,
            status: project.status,
            createdAt: project.createdAt
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get project by ID
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('teamId')
            .populate('members', '-password');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({
            id: project._id,
            name: project.name,
            description: project.description,
            githubUrl: project.githubLink,
            members: project.members,
            teamId: project.teamId,
            status: project.status,
            createdAt: project.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create project
router.post('/', async (req, res) => {
    try {
        const { name, description, githubLink, userId } = req.body;

        // Get user to set teamId and add manager as member
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only managers can create projects
        if (user.role !== 'manager') {
            return res.status(403).json({ message: 'Only managers can create projects' });
        }

        const project = new Project({
            name,
            description,
            githubLink,
            teamId: user.teamId,
            members: [userId] // Add manager as first member
        });

        await project.save();

        res.status(201).json({
            id: project._id,
            name: project.name,
            description: project.description,
            githubUrl: project.githubLink,
            members: project.members,
            teamId: project.teamId,
            status: project.status,
            createdAt: project.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update project
router.put('/:id', async (req, res) => {
    try {
        const { name, description, githubLink, teamId, members, status } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { name, description, githubLink, teamId, members, status },
            { new: true }
        ).populate('members', '-password');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({
            id: project._id,
            name: project.name,
            description: project.description,
            githubUrl: project.githubLink,
            members: project.members,
            teamId: project.teamId,
            status: project.status,
            createdAt: project.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add member to project
router.post('/:id/members', async (req, res) => {
    try {
        const { userId } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is already a member
        if (project.members.includes(userId)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        // Add user to members
        project.members.push(userId);
        await project.save();

        const updatedProject = await Project.findById(req.params.id)
            .populate('members', '-password');

        res.json({
            id: updatedProject._id,
            name: updatedProject.name,
            description: updatedProject.description,
            githubUrl: updatedProject.githubLink,
            members: updatedProject.members,
            teamId: updatedProject.teamId,
            status: updatedProject.status,
            createdAt: updatedProject.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove member from project
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Remove user from members
        project.members = project.members.filter(
            memberId => memberId.toString() !== req.params.userId
        );
        await project.save();

        const updatedProject = await Project.findById(req.params.id)
            .populate('members', '-password');

        res.json({
            id: updatedProject._id,
            name: updatedProject.name,
            description: updatedProject.description,
            githubUrl: updatedProject.githubLink,
            members: updatedProject.members,
            teamId: updatedProject.teamId,
            status: updatedProject.status,
            createdAt: updatedProject.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Also delete all tasks associated with this project
        await Task.deleteMany({ projectId: req.params.id });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

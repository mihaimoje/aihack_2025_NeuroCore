import express from 'express';
import User from '../models/user.js';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').populate('teamId');
        res.json(users.map(user => ({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            teamId: user.teamId,
            githubUsername: user.githubUsername,
            createdAt: user.createdAt
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user by ID with full team details
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -githubToken')
            .populate({
                path: 'teamId',
                populate: {
                    path: 'managerId members',
                    select: 'name username email role'
                }
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            team: user.teamId,
            githubUsername: user.githubUsername,
            githubRepos: user.githubRepos,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { name, email, role, teamId, githubUsername, githubToken } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, teamId, githubUsername, githubToken },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            teamId: user.teamId,
            githubUsername: user.githubUsername
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

import express from 'express';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import Invitation from '../models/invitation.js';
import User from '../models/user.js';
import Team from '../models/team.js';

const router = express.Router();

// Configure SendGrid only if API key is provided
const sendGridConfigured = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.');
if (sendGridConfigured) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Send invitation
router.post('/send', async (req, res) => {
    try {
        const { email, role, managerId } = req.body;

        // Validate role
        if (!['developer', 'tester'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be developer or tester' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Get manager and their team
        const manager = await User.findById(managerId).populate('teamId');
        if (!manager || manager.role !== 'manager') {
            return res.status(403).json({ message: 'Only managers can send invitations' });
        }

        if (!manager.teamId) {
            return res.status(400).json({ message: 'Manager must be part of a team' });
        }

        // Check if invitation already exists and is pending
        const existingInvitation = await Invitation.findOne({ 
            email, 
            status: 'pending',
            expiresAt: { $gt: new Date() }
        });

        if (existingInvitation) {
            return res.status(400).json({ message: 'An active invitation already exists for this email' });
        }

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');

        // Create invitation
        const invitation = new Invitation({
            email,
            role,
            teamId: manager.teamId._id,
            invitedBy: managerId,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        await invitation.save();

        // Send email
        const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/accept-invitation/${token}`;
        
        if (sendGridConfigured) {
            const msg = {
                to: email,
                from: process.env.SENDGRID_FROM_EMAIL || 'noreply@neurocore.com',
                subject: 'You have been invited to join NeuroCore',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Welcome to NeuroCore!</h2>
                        <p>You have been invited by ${manager.name} to join their team as a ${role}.</p>
                        <p>Click the button below to accept the invitation and complete your registration:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${invitationLink}" 
                               style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Accept Invitation
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            This invitation will expire in 7 days.
                        </p>
                        <p style="color: #666; font-size: 14px;">
                            If you didn't expect this invitation, you can safely ignore this email.
                        </p>
                    </div>
                `
            };

            await sgMail.send(msg);
            console.log(`✅ Invitation email sent to ${email}`);
        } else {
            console.log(`⚠️ SendGrid not configured. Invitation created but email not sent.`);
            console.log(`Invitation link: ${invitationLink}`);
        }

        res.status(201).json({
            message: sendGridConfigured ? 'Invitation sent successfully' : 'Invitation created (email not configured)',
            invitation: {
                id: invitation._id,
                email: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expiresAt
            },
            ...(sendGridConfigured ? {} : { invitationLink }) // Include link in response if email not sent
        });
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ message: 'Failed to send invitation', error: error.message });
    }
});

// Verify invitation token
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const invitation = await Invitation.findOne({ token })
            .populate('teamId')
            .populate('invitedBy', 'name email');

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: 'Invitation has already been used' });
        }

        if (new Date() > invitation.expiresAt) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(400).json({ message: 'Invitation has expired' });
        }

        res.json({
            email: invitation.email,
            role: invitation.role,
            teamName: invitation.teamId.name,
            invitedBy: invitation.invitedBy.name
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Accept invitation and create user
router.post('/accept/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { name, username, password } = req.body;

        // Validate input
        if (!name || !username || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Find invitation
        const invitation = await Invitation.findOne({ token });

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: 'Invitation has already been used' });
        }

        if (new Date() > invitation.expiresAt) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(400).json({ message: 'Invitation has expired' });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: invitation.email });
        if (existingEmail) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const bcrypt = (await import('bcryptjs')).default;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            name,
            username,
            email: invitation.email,
            password: hashedPassword,
            role: invitation.role,
            teamId: invitation.teamId
        });

        await user.save();

        // Add user to team members
        await Team.findByIdAndUpdate(
            invitation.teamId,
            { $addToSet: { members: user._id } }
        );

        // Mark invitation as accepted
        invitation.status = 'accepted';
        await invitation.save();

        // Generate JWT token
        const jwt = (await import('jsonwebtoken')).default;
        const jwtToken = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Account created successfully',
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                teamId: user.teamId
            }
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ message: 'Failed to create account', error: error.message });
    }
});

// Get all invitations (for managers)
router.get('/', async (req, res) => {
    try {
        const { managerId } = req.query;

        const filter = managerId ? { invitedBy: managerId } : {};
        
        const invitations = await Invitation.find(filter)
            .populate('teamId', 'name')
            .populate('invitedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

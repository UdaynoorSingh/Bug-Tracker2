// routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const ProjectInvitation = require('../models/ProjectInvitation');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create project
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, status, teamMembers } = req.body;

        // Validate input
        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        const project = new Project({
            name,
            description,
            status: status || 'Active',
            owner: req.user.userId,
            teamMembers: teamMembers || [] // Use teamMembers from request body or empty array
        });

        await project.save();

        // Populate owner
        await project.populate('owner', 'name email');

        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error creating project' });
    }
});

// Get all projects for user
router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        })
            .populate('owner', 'name email')
            .sort({ updatedAt: -1 });

        res.json(projects);
    } catch (error) {
        console.error('Fetch projects error:', error);
        res.status(500).json({ message: 'Error fetching projects' });
    }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        })
            .populate('owner', 'name email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Fetch project error:', error);
        res.status(500).json({ message: 'Error fetching project' });
    }
});

// Update project
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, status } = req.body;
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.name = name;
        project.description = description;
        project.status = status;

        await project.save();
        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Error updating project' });
    }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        // Find all tickets in this project
        const tickets = await Ticket.find({ project: project._id });
        // Delete all comments for these tickets
        const ticketIds = tickets.map(t => t._id);
        await Comment.deleteMany({ ticketId: { $in: ticketIds } });
        // Delete all tickets
        await Ticket.deleteMany({ project: project._id });
        // Delete the project
        await project.deleteOne();
        res.json({ message: 'Project, tickets, and related comments deleted' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Error deleting project' });
    }
});

// Add team member
router.post('/:id/members', auth, async (req, res) => {
    try {
        const { email } = req.body;

        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Already a team member?
        const isMember = project.teamMembers.some(m => m.email === email);
        if (isMember) {
            return res.status(400).json({ message: 'User is already a team member.' });
        }

        // Check for existing pending invitation
        let invite = await ProjectInvitation.findOne({ projectId: project._id, email, accepted: false });
        if (invite) {
            return res.status(400).json({ message: 'Invitation already sent.' });
        }

        // Create new invitation
        const token = crypto.randomBytes(24).toString('hex');
        invite = new ProjectInvitation({
            projectId: project._id,
            email,
            token
        });
        await invite.save();

        // Send invite email
        await sendInvitationEmail(email, project, token);

        res.json({ message: 'Invitation email sent successfully.' });
    } catch (error) {
        console.error('Add member via invitation error:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
    }
});


// Remove team member
router.delete('/:id/members/:email', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.teamMembers = project.teamMembers.filter(
            member => member.email !== req.params.email
        );

        await project.save();
        res.json(project);
    } catch (error) {
        console.error('Remove team member error:', error);
        res.status(500).json({ message: 'Error removing team member' });
    }
});

// Helper: send invitation email
async function sendInvitationEmail(email, project, token) {
    // Configure your email service here (Gmail example)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // set in .env
            pass: process.env.EMAIL_PASS  // set in .env
        }
    });
    const acceptUrl = `http://localhost:3000/accept-invite/${token}`;
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Invitation to join project: ${project.name}`,
        text: `You have been invited to join the project "${project.name}".\nDescription: ${project.description}\n\nClick here to accept: ${acceptUrl}`
    });
}

// Invite member (admin only)
router.post('/:id/invite', auth, async (req, res) => {
    try {
        const { email } = req.body;
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });
        if (!project) {
            return res.status(403).json({ message: 'Only the project owner can invite members.' });
        }
        // Check if already a member
        if (project.teamMembers.some(m => m.email === email)) {
            return res.status(400).json({ message: 'User is already a team member.' });
        }
        // Check for existing pending invite
        let invite = await ProjectInvitation.findOne({ projectId: project._id, email, accepted: false });
        if (invite) {
            return res.status(400).json({ message: 'Invitation already sent.' });
        }
        // Create invite
        const token = crypto.randomBytes(24).toString('hex');
        invite = new ProjectInvitation({ projectId: project._id, email, token });
        await invite.save();
        // Send email
        await sendInvitationEmail(email, project, token);
        res.json({ message: 'Invitation sent.' });
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
    }
});

// Accept invite (user must be logged in and email must match)
router.post('/accept-invite/:token', auth, async (req, res) => {
    try {
        const invite = await ProjectInvitation.findOne({ token: req.params.token, accepted: false });
        if (!invite) {
            return res.status(400).json({ message: 'Invalid or expired invitation.' });
        }
        // Only allow if logged in user email matches invite email
        const user = await User.findById(req.user.userId);
        if (!user || user.email !== invite.email) {
            return res.status(403).json({ message: 'You must be logged in with the invited email to accept.' });
        }
        // Add to project teamMembers if not already
        const project = await Project.findById(invite.projectId);
        if (!project.teamMembers.some(m => m.email === user.email)) {
            project.teamMembers.push({ name: user.name, email: user.email });
            await project.save();
        }
        invite.accepted = true;
        await invite.save();
        res.json({ message: 'You have joined the project.' });
    } catch (error) {
        console.error('Accept invite error:', error);
        res.status(500).json({ message: 'Error accepting invitation.' });
    }
});

module.exports = router; 
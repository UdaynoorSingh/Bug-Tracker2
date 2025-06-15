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

// Helper: send invitation email
async function sendInvitationEmail(email, project, token) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    const acceptUrl = `https://bug-tracker2-1.onrender.com/accept-invite/${token}`;
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Invitation to join project: ${project.name}`,
        text: `You have been invited to join the project "${project.name}".\nDescription: ${project.description}\n\nClick here to accept: ${acceptUrl}`
    });
}

// Shared: handle new team member invitations
async function handleTeamInvitations(project, newMembers = []) {
    for (const member of newMembers) {
        const alreadyInTeam = project.teamMembers.some(m => m.email === member.email);

        // Delete any stale pending invitations
        await ProjectInvitation.deleteMany({
            projectId: project._id,
            email: member.email,
            accepted: false
        });

        if (!alreadyInTeam) {
            const token = crypto.randomBytes(24).toString('hex');
            const invite = new ProjectInvitation({
                projectId: project._id,
                email: member.email,
                token
            });
            await invite.save();
            await sendInvitationEmail(member.email, project, token);

            project.teamMembers.push({
                name: member.name || '',
                email: member.email
            });

            console.log(`Inviting new member: ${member.email}`);
        }
    }
}

// Create project
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, status, teamMembers } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        // 🔒 Check for duplicate project name (by owner or team member)
        const existingProject = await Project.findOne({
            name,
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        });

        if (existingProject) {
            return res.status(409).json({ message: 'A project with this name already exists.' });
        }

        const project = new Project({
            name,
            description,
            status: status || 'Active',
            owner: req.user.userId,
            teamMembers: []
        });

        await handleTeamInvitations(project, teamMembers || []);
        await project.save();
        await project.populate('owner', 'name email');
        res.status(201).json(project);

    } catch (error) {
        console.error('Create project error:', error);
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
        }).populate('owner', 'name email').sort({ updatedAt: -1 });
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
        }).populate('owner', 'name email');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        console.error('Fetch project error:', error);
        res.status(500).json({ message: 'Error fetching project' });
    }
});

// Update project
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description, status, teamMembers } = req.body;

        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user.userId
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (name) project.name = name;
        if (description) project.description = description;
        if (status) project.status = status;

        const existingEmails = project.teamMembers.map(m => m.email.toLowerCase());
        const newMembers = (teamMembers || []).filter(
            m => !existingEmails.includes(m.email.toLowerCase())
        );

        await handleTeamInvitations(project, newMembers);
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
        const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        const tickets = await Ticket.find({ project: project._id });
        const ticketIds = tickets.map(t => t._id);
        await Comment.deleteMany({ ticketId: { $in: ticketIds } });
        await Ticket.deleteMany({ project: project._id });
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
        const { email, name } = req.body;
        if (!email || !name) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }
        const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        await handleTeamInvitations(project, [{ name, email }]);
        await project.save();

        res.json({ message: 'Invitation email sent successfully.' });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: 'Error sending invitation.' });
    }
});

// Remove team member
router.delete('/:id/members/:email', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        project.teamMembers = project.teamMembers.filter(m => m.email !== req.params.email);
        await project.save();
        res.json(project);
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ message: 'Error removing team member' });
    }
});

// Accept invite
router.post('/accept-invite/:token', auth, async (req, res) => {
    try {
        const invite = await ProjectInvitation.findOne({ token: req.params.token, accepted: false });
        if (!invite) return res.status(400).json({ message: 'Invalid or expired invitation.' });
        const user = await User.findById(req.user.userId);
        if (!user || user.email !== invite.email) {
            return res.status(403).json({ message: 'You must be logged in with the invited email to accept.' });
        }
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

const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');

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
        const project = await Project.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ['name', 'description', 'status'];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        updates.forEach(update => project[update] = req.body[update]);
        await project.save();

        await project.populate('owner', 'name email');

        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
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
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required' });
        }

        const project = await Project.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already a member
        const isMember = project.teamMembers.some(
            member => member.user.toString() === user._id.toString()
        );

        if (isMember) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        project.teamMembers.push({ user: user._id, role });
        await project.save();

        await project.populate('owner', 'name email');

        res.json(project);
    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({ message: 'Error adding team member' });
    }
});

// Remove team member
router.delete('/:id/members/:userId', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.teamMembers = project.teamMembers.filter(
            member => member.user.toString() !== req.params.userId
        );

        await project.save();

        await project.populate('owner', 'name email');

        res.json(project);
    } catch (error) {
        console.error('Remove team member error:', error);
        res.status(500).json({ message: 'Error removing team member' });
    }
});

module.exports = router; 
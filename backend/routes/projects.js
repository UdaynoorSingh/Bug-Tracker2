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
        const { name, email } = req.body;
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

        // Check if member already exists
        const isMember = project.teamMembers.some(member => member.email === email);
        if (isMember) {
            return res.status(400).json({ message: 'Team member already exists' });
        }

        project.teamMembers.push({ name, email });
        await project.save();

        res.json(project);
    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({ message: 'Error adding team member' });
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

module.exports = router; 
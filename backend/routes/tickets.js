const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Create ticket
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, project, priority, type } = req.body;

        // Check if user has access to the project
        const projectDoc = await Project.findOne({
            _id: project,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id }
            ]
        });

        if (!projectDoc) {
            return res.status(403).json({ message: 'Access denied to project' });
        }

        const ticket = new Ticket({
            title,
            description,
            project,
            priority,
            type,
            reporter: req.user._id
        });

        await ticket.save();
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error creating ticket' });
    }
});

// Get tickets for a project
router.get('/project/:projectId', auth, async (req, res) => {
    try {
        // Check if user has access to the project
        const project = await Project.findOne({
            _id: req.params.projectId,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id }
            ]
        });

        if (!project) {
            return res.status(403).json({ message: 'Access denied to project' });
        }

        const tickets = await Ticket.find({ project: req.params.projectId })
            .populate('reporter', 'name email')
            .populate('assignee', 'name email');

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tickets' });
    }
});

// Get single ticket
router.get('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('reporter', 'name email')
            .populate('assignee', 'name email')
            .populate('comments.user', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user has access to the project
        const project = await Project.findOne({
            _id: ticket.project,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id }
            ]
        });

        if (!project) {
            return res.status(403).json({ message: 'Access denied to ticket' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ticket' });
    }
});

// Update ticket
router.put('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user has access to the project
        const project = await Project.findOne({
            _id: ticket.project,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id }
            ]
        });

        if (!project) {
            return res.status(403).json({ message: 'Access denied to ticket' });
        }

        const updates = Object.keys(req.body);
        updates.forEach(update => ticket[update] = req.body[update]);
        await ticket.save();

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error updating ticket' });
    }
});

// Delete ticket
router.delete('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user has access to the project
        const project = await Project.findOne({
            _id: ticket.project,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id, 'teamMembers.role': 'manager' }
            ]
        });

        if (!project) {
            return res.status(403).json({ message: 'Access denied to ticket' });
        }

        await ticket.remove();
        res.json({ message: 'Ticket deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting ticket' });
    }
});

// Add comment to ticket
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user has access to the project
        const project = await Project.findOne({
            _id: ticket.project,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id }
            ]
        });

        if (!project) {
            return res.status(403).json({ message: 'Access denied to ticket' });
        }

        ticket.comments.push({
            user: req.user._id,
            text: req.body.text
        });

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment' });
    }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Create ticket
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, project, priority, assignee, comment } = req.body;

        // Check if user has access to the project
        const projectDoc = await Project.findOne({
            _id: project,
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        });

        if (!projectDoc) {
            return res.status(403).json({ message: 'Access denied to project' });
        }

        // Validate assignee is a team member
        const isTeamMember = projectDoc.teamMembers.some(
            (tm) => tm.email === assignee?.email && tm.name === assignee?.name
        );
        if (!isTeamMember) {
            return res.status(400).json({ message: 'Assignee must be a project team member' });
        }

        const ticketData = {
            title,
            description,
            project,
            priority,
            assignee,
            reporter: req.user.userId,
            status: req.body.status || 'todo'
        };
        if (comment && comment.trim()) {
            ticketData.comments = [{ user: req.user.userId, text: comment.trim() }];
        }
        const ticket = new Ticket(ticketData);
        await ticket.save();
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error creating ticket' });
    }
});

// Get tickets for a project with AND filters and OR for keyword
router.get('/project/:projectId', auth, async (req, res) => {
    try {
        const { status, priority, assignee, q } = req.query;
        // Check if user has access to the project
        const project = await Project.findOne({
            _id: req.params.projectId,
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        });
        if (!project) {
            return res.status(403).json({ message: 'Access denied to project' });
        }
        // Build AND filter
        const filter = { project: req.params.projectId };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignee) filter['assignee.name'] = assignee;
        if (q) filter.$or = [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
        ];
        const tickets = await Ticket.find(filter);
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tickets' });
    }
});

// Get single ticket
router.get('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user has access to the project
        const project = await Project.findOne({
            _id: ticket.project,
            $or: [
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
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
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
            ]
        });

        if (!project) {
            return res.status(403).json({ message: 'Access denied to ticket' });
        }

        // Only allow specific fields to be updated
        const allowedUpdates = ['title', 'description', 'status', 'priority', 'assignee'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                ticket[field] = req.body[field];
            }
        });

        // If updating assignee, validate
        if (req.body.assignee) {
            const isTeamMember = project.teamMembers.some(
                (tm) => tm.email === req.body.assignee.email && tm.name === req.body.assignee.name
            );
            if (!isTeamMember) {
                return res.status(400).json({ message: 'Assignee must be a project team member' });
            }
        }

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error updating ticket', error: error.message });
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
                { owner: req.user.userId },
                { 'teamMembers.email': req.user.email }
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
        if (!req.body.text || !req.body.text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }
        // Log user info for debugging
        console.log('Adding comment as user:', req.user);
        ticket.comments.push({
            user: {
                name: req.user.name,
                email: req.user.email
            },
            text: req.body.text.trim()
        });
        await ticket.save();
        res.json(ticket.comments);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
});

// Get all comments for a ticket
router.get('/:id/comments', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.json(ticket.comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments' });
    }
});

module.exports = router; 
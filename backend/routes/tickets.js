// routes/tickets.js
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');

router.post('/', auth, async (req, res)=>{
    try{
        const{ title, description, project, priority, assignee, comment} = req.body;

        const projectDoc = await Project.findOne({
            _id: project,
            $or: [{owner: req.user.userId},{'teamMembers.email': req.user.email}
            ]
        });

        if(!projectDoc){
            return res.status(403).json({ message: 'Access denied to project' });
        }

        const existingTicket = await Ticket.findOne({
            title,
            project
        });

        if(existingTicket){
            return res.status(409).json({ message: 'A ticket with this title already exists in this project.' });
        }

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

router.get('/project/:projectId', auth, async (req, res) => {
    try {
        const {status, priority, assignee, q} = req.query;
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

router.get('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

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

router.put('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

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

        const allowedUpdates = ['title', 'description', 'status', 'priority', 'assignee'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                ticket[field] = req.body[field];
            }
        });

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

router.delete('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
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
        await Comment.deleteMany({ ticketId: ticket._id });
        await ticket.deleteOne();
        res.json({ message: 'Ticket and related comments deleted' });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ message: 'Error deleting ticket', error: error.message });
    }
});

router.post('/:id/comments', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        if (!req.body.text || !req.body.text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }
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
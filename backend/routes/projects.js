const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create project
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, teamMembers } = req.body;

        const project = new Project({
            title,
            description,
            owner: req.user._id,
            teamMembers: [
                { user: req.user._id, role: 'manager' },
                ...(teamMembers || [])
            ]
        });

        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project' });
    }
});

// Get all projects for user
router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id }
            ]
        }).populate('owner', 'name email')
            .populate('teamMembers.user', 'name email');

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects' });
    }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id }
            ]
        }).populate('owner', 'name email')
            .populate('teamMembers.user', 'name email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project' });
    }
});

// Update project
router.put('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id, 'teamMembers.role': 'manager' }
            ]
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const updates = Object.keys(req.body);
        updates.forEach(update => project[update] = req.body[update]);
        await project.save();

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error updating project' });
    }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await project.remove();
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project' });
    }
});

// Add team member
router.post('/:id/members', auth, async (req, res) => {
    try {
        const { email, role } = req.body;
        const project = await Project.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id, 'teamMembers.role': 'manager' }
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

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error adding team member' });
    }
});

// Remove team member
router.delete('/:id/members/:userId', auth, async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            $or: [
                { owner: req.user._id },
                { 'teamMembers.user': req.user._id, 'teamMembers.role': 'manager' }
            ]
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.teamMembers = project.teamMembers.filter(
            member => member.user.toString() !== req.params.userId
        );

        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error removing team member' });
    }
});

module.exports = router; 
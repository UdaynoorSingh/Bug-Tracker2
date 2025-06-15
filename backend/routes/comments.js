// routes/comments.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// Add a comment
router.post('/', auth, async (req, res) => {
    try {
        const { ticketId, text, parentId } = req.body;
        const comment = new Comment({
            ticketId,
            userId: req.user.userId,
            text,
            parentId: parentId || null
        });
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        res.status(400).json({ message: 'Failed to add comment', error: error.message });
    }
});

// Get all comments for a ticket (threaded)
router.get('/ticket/:ticketId', auth, async (req, res) => {
    const comments = await Comment.find({ ticketId: req.params.ticketId }).sort({ createdAt: 1 });
    res.json(comments);
});

module.exports = router; 
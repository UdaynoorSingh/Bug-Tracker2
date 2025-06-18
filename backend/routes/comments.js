const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
const upload = require('../config/multer'); 
router.post('/', auth, async (req, res) => {
    try {
        const {ticketId, text, parentId, attachments} = req.body;
        
        if (!text && (!attachments || attachments.length === 0)) {
            return res.status(400).json({ 
                message: 'Comment must have either text or attachments' 
            });
        }
        const comment = new Comment({
            ticketId,
            userId: req.user.userId,
            text,
            parentId: parentId || null,
            attachments: attachments || [] 
        });
        
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        res.status(400).json({ 
            message: 'Failed to add comment', 
            error: error.message 
        });
    }
});
router.post('/upload', auth, upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                message: 'No files were uploaded' 
            });
        }
        const fileUrls = req.files.map(file => `uploads/${file.filename}`);
        
        res.status(200).json({ 
            message: 'Files uploaded successfully',
            fileUrls 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'File upload failed',
            error: error.message 
        });
    }
});
router.get('/ticket/:ticketId', auth, async (req, res) => {
    try {
        const comments = await Comment.find({ ticketId: req.params.ticketId })
            .sort({ createdAt: 1 })
            .populate('userId', 'name email'); 
        
        res.json(comments);
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to fetch comments',
            error: error.message 
        });
    }
});

module.exports = router;
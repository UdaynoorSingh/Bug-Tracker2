// models/ProjectInvitation.js
const mongoose = require('mongoose');

const projectInvitationSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true },
    accepted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProjectInvitation', projectInvitationSchema); 
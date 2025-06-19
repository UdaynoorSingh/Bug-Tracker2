// models/Ticket.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        trim: true
    },
    description:{
        type: String,
        required: true
    },
    project:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    status:{
        type:String,
        enum: ['todo', 'in-progress', 'done'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    type: {
        type: String,
        enum: ['bug', 'feature', 'task'],
        default: 'bug'
    },
    assignee: {
        name:{type: String, required: true},
        email:{type: String, required: true}
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [{
        user: {type: String, required: true },
        text: {type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
});

ticketSchema.pre('save', function (next){
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Ticket', ticketSchema); 
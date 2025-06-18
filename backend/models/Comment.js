const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
  text:{
    type: String,
    required: false 
  },
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  parentId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: false
  },
  attachments:[{
    type: String,
    required: false
  }],
  createdAt:{
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema);
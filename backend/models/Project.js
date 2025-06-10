const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Project description is required']
    },
    status: {
        type: String,
        enum: ['Active', 'On Hold', 'Completed', 'Cancelled'],
        default: 'Active'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamMembers: [
        {
            name: {
                type: String,
                required: [true, 'Team member name is required']
            },
            email: {
                type: String,
                required: [true, 'Team member email is required'],
                trim: true,
                lowercase: true
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Remove sensitive data when converting to JSON
projectSchema.methods.toJSON = function () {
    const project = this.toObject();
    return project;
};

module.exports = mongoose.model('Project', projectSchema); 
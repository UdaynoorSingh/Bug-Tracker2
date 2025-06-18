// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, 'Name is required'],
        trim: true
    },
    email:{
        type: String,
        required:[true, 'Email is required'],
        unique:true,
        trim:true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    password:{
        type: String,
        required:[true, 'Password is required'],
        minlength:[4, 'Password must be at least 4 characters long']
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'developer', 'viewer'],
        default: 'developer'
    },
   verified: {
    type: Boolean,
    default: false,
},
verificationToken: {
    type: String,
},
verificationTokenExpires: {
    type: Date,
},
    createdAt: {
        type: Date,
        default: Date.now
    },

});

userSchema.pre('save', async function (next) {
    try {
        if(!this.isModified('password')){
            return next();
        }

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } 
    catch (error){
        console.error('Password hashing error:', error);
        next(error);
    }
});

userSchema.methods.comparePassword =async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } 
    catch (error){
        console.error('Password comparison error:', error);
        throw error;
    }
};

userSchema.methods.toJSON = function(){
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema); 
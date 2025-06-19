// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser){
            return res.status(400).json({ message: 'User already exists' });
        }

       // In auth.js registration route
         const verificationToken = crypto.randomBytes(32).toString('hex');
         const user = new User({
           name,
           email,
           password,
           verificationToken,
           verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
         });

        await user.save();
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.'
        });
    } catch (error) {
        if (error.name === 'ValidationError'){
            return res.status(400).json({
                message: 'Validation error',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        res.status(500).json({ message: 'Error creating user' });
    }
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        code: 'MISSING_TOKEN',
        message: 'Verification token is required' 
      });
    }

    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return res.status(400).json({ 
        code: 'INVALID_TOKEN',
        message: 'Invalid verification token' 
      });
    }

    if (user.verificationTokenExpires < Date.now()) {
      return res.status(400).json({ 
        code: 'EXPIRED_TOKEN',
        message: 'Verification link has expired',
        solution: 'Please request a new verification email'
      });
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    
    // Return JSON response instead of redirect
    res.json({ 
      success: true,
      message: 'Email verified successfully',
      redirectUrl: `${process.env.FRONTEND_URL}/verify-success`
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      code: 'SERVER_ERROR',
      message: 'Failed to verify email'
    });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        code: 'MISSING_EMAIL',
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        code: 'USER_NOT_FOUND',
        message: 'No account found with this email' 
      });
    }
    
    if (user.verified) {
      return res.json({ 
        code: 'ALREADY_VERIFIED',
        message: 'Email is already verified' 
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(email, verificationToken);
    
    res.json({ 
      success: true,
      code: 'RESEND_SUCCESS',
      message: 'New verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({
      code: 'SERVER_ERROR', 
      message: 'Failed to resend verification email'
    });
  }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({ token, user: user.toJSON() });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json({ user: user.toJSON() });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data' });
    }
});

module.exports = router;
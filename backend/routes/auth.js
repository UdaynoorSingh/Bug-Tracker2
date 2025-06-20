// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sendVerificationEmail = require('../utils/sendVerificationEmail');
const { URL } = require('url');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const user = new User({
            name,
            email,
            password,
            verificationToken,
            verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, 
        });

        await user.save();
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.'
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
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
            return res.redirect(`https://bug-tracker2.vercel.app/verify-error?error=missing_token`);
        }

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.redirect(`https://bug-tracker2.vercel.app/verify-error?error=invalid_token`);
        }

        if (user.verificationTokenExpires < Date.now()) {
            return res.redirect(`https://bug-tracker2.vercel.app/verify-error?error=expired_token`);
        }

        user.verified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        console.log('User before save:', user);
        try {
            await user.save();
            console.log('User saved successfully');
        } catch (err) {
            console.error('Error saving user:', err);
        }

        const authToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const redirectUrl = new URL(`https://bug-tracker2.vercel.app/verify-success`);
        redirectUrl.searchParams.set('token', authToken);
        res.redirect(redirectUrl.toString());

    } catch (error) {
        console.error('Verification error:', error);
        res.redirect(`https://bug-tracker2.vercel.app/verify-error?error=server_error`);
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
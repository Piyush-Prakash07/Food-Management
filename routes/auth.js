const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, city } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            phone,
            city
        });

        res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Google Sign-In
router.post('/google', async (req, res) => {
    try {
        const { credential, role, phone, city } = req.body; // Add explicit phone and city arguments 

        // Verify the ID token using the official Google library
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, sub } = payload; // sub is the unique Google user ID (optional to store)

        // Find existing user or create a new one
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Auto register if user doesn't exist
            // Provide a random secure password as they login via Google
            const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
            user = await User.create({
                name,
                email,
                password: randomPassword,
                role: role || 'Donor', // default role
                phone: phone || 'N/A',
                city: city || 'N/A'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Google Sign-In Error:', error);
        res.status(401).json({ message: 'Invalid or expired Google Token' });
    }
});

module.exports = router;

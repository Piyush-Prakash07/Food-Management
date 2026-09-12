const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Check if an Admin already exists
router.get('/admin-status', async (req, res) => {
    try {
        const adminCount = await User.count({ where: { role: 'Admin' } });
        res.json({ adminExists: adminCount > 0 });
    } catch (error) {
        console.error('Admin Status Check Error:', error);
        res.status(500).json({ message: 'Server error checking admin status' });
    }
});

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, city } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Strictly forbid registering as Admin
        if (role === 'Admin') {
            return res.status(403).json({ 
                message: 'Admin accounts cannot be registered publicly. Only one master administrator is permitted.' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || 'Donor',
            phone: phone ? phone.trim() : 'N/A',
            city: city ? city.trim() : 'N/A'
        });

        // Auto-generate JWT for seamless registration
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role, name: newUser.name },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '1d' }
        );

        res.status(201).json({ 
            message: 'User registered successfully', 
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone,
                city: newUser.city
            }
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user case-insensitively
        const user = await User.findOne({ where: { email: normalizedEmail } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
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
                role: user.role,
                phone: user.phone,
                city: user.city
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Google Sign-In
// Google Sign-In
router.post('/google', async (req, res) => {
    try {
        const { credential, role, phone, city } = req.body;

        // Check whether credential was received
        if (!credential) {
            return res.status(400).json({
                message: 'Google credential is missing'
            });
        }

        console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
        console.log('Credential received:', !!credential);

        // Verify Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        console.log('Google token verified successfully');
        console.log('Google user email:', payload.email);

        const { email, name } = payload;

        // Find existing user
        let user = await User.findOne({
            where: { email }
        });

        // Create user if not found
        if (!user) {
            let assignedRole = role || 'Donor';
            if (assignedRole === 'Admin') {
                const existingAdmin = await User.findOne({ where: { role: 'Admin' } });
                if (existingAdmin) {
                    assignedRole = 'Donor'; // Default to Donor if an Admin already exists
                }
            }

            const randomPassword = await bcrypt.hash(
                Math.random().toString(36).slice(-12),
                10
            );

            user = await User.create({
                name: name || 'Google User',
                email,
                password: randomPassword,
                role: assignedRole,
                phone: phone || 'N/A',
                city: city || 'N/A'
            });

            console.log('New Google user created:', user.email, 'Role:', user.role);
        } else {
            console.log('Existing Google user logged in:', user.email);
        }

        // Generate JWT
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET || 'secretkey123',
            {
                expiresIn: '1d'
            }
        );

        return res.status(200).json({
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

        return res.status(401).json({
            message: 'Google authentication failed',
            error: error.message
        });
    }
});

module.exports = router;

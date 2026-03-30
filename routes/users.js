const express = require('express');
const { User } = require('../models');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get directory of all active Donors, NGOs, and Volunteers
router.get('/directory', authenticateToken, async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                role: ['Donor', 'NGO', 'Volunteer']
            },
            attributes: ['id', 'name', 'email', 'phone', 'city', 'role', 'createdAt'] // Excluding password and sensitive fields
        });

        // Group by role for easier frontend rendering
        const directory = {
            donors: users.filter(u => u.role === 'Donor'),
            ngos: users.filter(u => u.role === 'NGO'),
            volunteers: users.filter(u => u.role === 'Volunteer')
        };

        res.json(directory);
    } catch (error) {
        console.error('Fetch Directory Error:', error);
        res.status(500).json({ message: 'Error fetching user directory' });
    }
});

module.exports = router;

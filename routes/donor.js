const express = require('express');
const { FoodDonation, User, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const authenticateToken = require('../middleware/auth');
const verifyRole = require('../middleware/rbac');

const router = express.Router();

// Get past donations for a specific donor
router.get('/', authenticateToken, verifyRole(['Donor']), async (req, res) => {
    try {
        const { food_type, status } = req.query;

        let sqlQuery = `SELECT d.id, d.donor_id, d.food_type, d.quantity, d.status, d.createdAt, d.updatedAt, u.name as donor_name 
                        FROM Food_Donations d 
                        JOIN Users u ON d.donor_id = u.id 
                        WHERE d.donor_id = :donorId`;
        let replacements = { donorId: req.user.id };

        if (food_type) {
            sqlQuery += ` AND d.food_type LIKE :foodType`;
            replacements.foodType = `%${food_type}%`;
        }
        if (status) {
            sqlQuery += ` AND d.status = :status`;
            replacements.status = status;
        }

        sqlQuery += ` ORDER BY d.createdAt DESC`;

        const rawDonations = await sequelize.query(sqlQuery, {
            replacements,
            type: QueryTypes.SELECT
        });

        // Map back to the structure the frontend expects
        const donations = rawDonations.map(don => ({
            id: don.id,
            donor_id: don.donor_id,
            food_type: don.food_type,
            quantity: don.quantity,
            status: don.status,
            createdAt: don.createdAt,
            updatedAt: don.updatedAt,
            Donor: {
                name: don.donor_name
            }
        }));

        res.json(donations);
    } catch (error) {
        console.error('Fetch Donations Error:', error);
        res.status(500).json({ message: 'Error fetching donations' });
    }
});

// Get donor dashboard stats
router.get('/dashboard-stats', authenticateToken, verifyRole(['Donor']), async (req, res) => {
    try {
        const totalDonations = await FoodDonation.count({ where: { donor_id: req.user.id } });
        const pendingDonations = await FoodDonation.count({ where: { donor_id: req.user.id, status: 'Available' } });
        const assignedDonations = await FoodDonation.count({ where: { donor_id: req.user.id, status: 'Assigned' } });
        const deliveredDonations = await FoodDonation.count({ where: { donor_id: req.user.id, status: 'Completed' } });

        res.json({ totalDonations, pendingDonations, assignedDonations, deliveredDonations });
    } catch (error) {
        console.error('Fetch Donor Stats Error:', error);
        res.status(500).json({ message: 'Error fetching donor stats' });
    }
});

// Post a new donation
router.post('/', authenticateToken, verifyRole(['Donor']), async (req, res) => {
    try {
        const { food_type, quantity } = req.body;

        const newDonation = await FoodDonation.create({
            donor_id: req.user.id,
            food_type,
            quantity,
            status: 'Available'
        });

        res.status(201).json(newDonation);
    } catch (error) {
        console.error('Post Donation Error:', error);
        res.status(500).json({ message: 'Error posting donation' });
    }
});

// Update a donation
router.put('/:id', authenticateToken, verifyRole(['Donor']), async (req, res) => {
    try {
        const { food_type, quantity } = req.body;
        const donation_id = req.params.id;

        const [updatedRows] = await FoodDonation.update(
            { food_type, quantity },
            { where: { id: donation_id, donor_id: req.user.id, status: 'Available' } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Donation not found or cannot be modified.' });
        }
        res.json({ message: 'Donation updated successfully' });
    } catch (error) {
        console.error('Update Donation Error:', error);
        res.status(500).json({ message: 'Error updating donation' });
    }
});

// Delete a donation
router.delete('/:id', authenticateToken, verifyRole(['Donor']), async (req, res) => {
    try {
        const donation_id = req.params.id;

        const deletedRows = await FoodDonation.destroy({
            where: { id: donation_id, donor_id: req.user.id, status: 'Available' }
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Donation not found or cannot be deleted.' });
        }
        res.json({ message: 'Donation deleted successfully' });
    } catch (error) {
        console.error('Delete Donation Error:', error);
        res.status(500).json({ message: 'Error deleting donation' });
    }
});

module.exports = router;

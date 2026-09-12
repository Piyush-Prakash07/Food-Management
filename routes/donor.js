const express = require('express');
const { FoodDonation, User, DonationAssignment, FoodRequest, PickupDelivery, sequelize } = require('../models');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/auth');
const verifyRole = require('../middleware/rbac');

const router = express.Router();

// Get past donations for a specific donor with full assignment details
router.get('/', authenticateToken, verifyRole(['Donor']), async (req, res) => {
    try {
        const { food_type, status } = req.query;
        let whereClause = { donor_id: req.user.id };

        if (food_type) {
            whereClause.food_type = { [Op.like]: `%${food_type}%` };
        }
        if (status) {
            whereClause.status = status;
        }

        const donations = await FoodDonation.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'Donor', attributes: ['id', 'name', 'phone', 'city'] },
                {
                    model: DonationAssignment,
                    include: [
                        {
                            model: FoodRequest,
                            include: [{ model: User, as: 'NGO', attributes: ['id', 'name', 'phone', 'city', 'email'] }]
                        },
                        {
                            model: PickupDelivery,
                            include: [{ model: User, as: 'Volunteer', attributes: ['id', 'name', 'phone', 'city', 'email'] }]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

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

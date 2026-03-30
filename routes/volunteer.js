const express = require('express');
const { PickupDelivery, DonationAssignment, FoodDonation, FoodRequest, User } = require('../models');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/auth');
const verifyRole = require('../middleware/rbac');

const router = express.Router();

// Get active tasks for specific volunteer
router.get('/', authenticateToken, verifyRole(['Volunteer']), async (req, res) => {
    try {
        const { status } = req.query;
        let whereClause = { volunteer_id: req.user.id };

        if (status) {
            if (status === 'Pending Pickup') {
                whereClause.pickup_status = 'Pending';
            } else if (status === 'Picked_up') {
                whereClause.pickup_status = 'Picked Up';
                whereClause.delivery_status = { [Op.ne]: 'Delivered' };
            } else if (status === 'Delivered') {
                whereClause.delivery_status = 'Delivered';
            }
        }

        const tasks = await PickupDelivery.findAll({
            where: whereClause,
            include: [{
                model: DonationAssignment,
                include: [
                    {
                        model: FoodDonation,
                        include: [{ model: User, as: 'Donor', attributes: ['name', 'phone', 'city'] }]
                    },
                    {
                        model: FoodRequest,
                        include: [{ model: User, as: 'NGO', attributes: ['name', 'phone', 'city'] }]
                    }
                ]
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json(tasks);
    } catch (error) {
        console.error('Fetch Volunteer Tasks Error:', error);
        res.status(500).json({ message: 'Error fetching volunteer tasks' });
    }
});

// Get volunteer dashboard stats
router.get('/dashboard-stats', authenticateToken, verifyRole(['Volunteer']), async (req, res) => {
    try {
        const activeDeliveries = await PickupDelivery.count({ where: { volunteer_id: req.user.id, delivery_status: { [Op.ne]: 'Delivered' } } });
        const pendingPickup = await PickupDelivery.count({ where: { volunteer_id: req.user.id, pickup_status: 'Pending' } });
        const inTransit = await PickupDelivery.count({ where: { volunteer_id: req.user.id, pickup_status: 'Picked Up', delivery_status: { [Op.ne]: 'Delivered' } } });
        const completed = await PickupDelivery.count({ where: { volunteer_id: req.user.id, delivery_status: 'Delivered' } });

        res.json({ activeDeliveries, pendingPickup, inTransit, completed });
    } catch (error) {
        console.error('Fetch Volunteer Stats Error:', error);
        res.status(500).json({ message: 'Error fetching volunteer stats' });
    }
});

// Update pickup/delivery status
router.put('/:id/status', authenticateToken, verifyRole(['Volunteer']), async (req, res) => {
    try {
        const deliveryId = req.params.id;
        const { statusType, newStatus } = req.body;
        // e.g., { statusType: 'pickup_status', newStatus: 'Picked Up' }

        const updateData = {};
        updateData[statusType] = newStatus;

        await PickupDelivery.update(updateData, { where: { id: deliveryId } });

        // If delivered, update the main food donation, request, and assignment status
        if (newStatus === 'Delivered') {
            const delivery = await PickupDelivery.findByPk(deliveryId);
            const assignment = await DonationAssignment.findByPk(delivery.assignment_id);
            if (assignment) {
                await FoodDonation.update({ status: 'Completed' }, { where: { id: assignment.donation_id } });
                await DonationAssignment.update({ status: 'Completed' }, { where: { id: assignment.id } });
                if (assignment.request_id) {
                    await FoodRequest.update({ status: 'Fulfilled' }, { where: { id: assignment.request_id } });
                }
            }
        }

        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ message: 'Error updating status' });
    }
});

module.exports = router;

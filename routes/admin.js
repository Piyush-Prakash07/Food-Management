const express = require('express');
const { FoodDonation, FoodRequest, User, DonationAssignment, PickupDelivery, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const authenticateToken = require('../middleware/auth');
const verifyRole = require('../middleware/rbac');

const router = express.Router();

// Dashboard overview data
router.get('/dashboard', authenticateToken, verifyRole(['Admin']), async (req, res) => {
    try {
        const {
            don_food_type, don_status, don_name,
            req_food_type, req_status, req_name,
            del_status
        } = req.query;

        let donSqlQuery = `SELECT d.*, u.name as donor_name, u.phone as donor_phone, u.city as donor_city 
                           FROM Food_Donations d 
                           JOIN Users u ON d.donor_id = u.id 
                           WHERE 1=1`;
        let donReplacements = {};

        if (don_food_type) {
            donSqlQuery += ` AND d.food_type LIKE :donFoodType`;
            donReplacements.donFoodType = `%${don_food_type}%`;
        }
        if (don_status) {
            donSqlQuery += ` AND d.status = :donStatus`;
            donReplacements.donStatus = don_status;
        }
        if (don_name) {
            donSqlQuery += ` AND u.name LIKE :donName`;
            donReplacements.donName = `%${don_name}%`;
        }
        donSqlQuery += ` ORDER BY d.createdAt DESC`;

        const rawDonations = await sequelize.query(donSqlQuery, {
            replacements: donReplacements,
            type: QueryTypes.SELECT
        });

        const donations = rawDonations.map(don => ({
            ...don,
            Donor: {
                name: don.donor_name,
                phone: don.donor_phone,
                city: don.donor_city
            }
        }));

        let reqSqlQuery = `SELECT r.*, u.name as ngo_name, u.phone as ngo_phone, u.city as ngo_city 
                           FROM Food_Requests r 
                           JOIN Users u ON r.ngo_id = u.id 
                           WHERE 1=1`;
        let reqReplacements = {};

        if (req_food_type) {
            reqSqlQuery += ` AND r.request_food_type LIKE :reqFoodType`;
            reqReplacements.reqFoodType = `%${req_food_type}%`;
        }
        if (req_status) {
            reqSqlQuery += ` AND r.status = :reqStatus`;
            reqReplacements.reqStatus = req_status;
        }
        if (req_name) {
            reqSqlQuery += ` AND u.name LIKE :reqName`;
            reqReplacements.reqName = `%${req_name}%`;
        }
        reqSqlQuery += ` ORDER BY r.createdAt DESC`;

        const rawRequests = await sequelize.query(reqSqlQuery, {
            replacements: reqReplacements,
            type: QueryTypes.SELECT
        });

        const requests = rawRequests.map(req => ({
            ...req,
            NGO: {
                name: req.ngo_name,
                phone: req.ngo_phone,
                city: req.ngo_city
            }
        }));

        const volunteers = await User.findAll({ 
            where: { role: 'Volunteer' }, 
            attributes: ['id', 'name', 'phone', 'city', 'email'] 
        });
        const donorsCount = await User.count({ where: { role: 'Donor' } });
        const ngosCount = await User.count({ where: { role: 'NGO' } });
        const volunteersCount = volunteers.length;

        let deliveryWhere = {};
        if (del_status) {
            if (del_status === 'Pending Pickup') {
                deliveryWhere.pickup_status = 'Pending';
            } else if (del_status === 'Picked_up') {
                deliveryWhere.pickup_status = 'Picked Up';
                deliveryWhere.delivery_status = { [Op.ne]: 'Delivered' };
            } else if (del_status === 'Delivered') {
                deliveryWhere.delivery_status = 'Delivered';
            }
        }

        const activeDeliveries = await PickupDelivery.findAll({
            where: deliveryWhere,
            include: [
                { model: User, as: 'Volunteer', attributes: ['id', 'name', 'phone', 'city'] },
                { 
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
                }
            ]
        });

        const pendingDonations = await FoodDonation.findAll({
            where: { status: { [Op.in]: ['Available', 'Pending'] } },
            include: [{ model: User, as: 'Donor', attributes: ['name', 'phone', 'city', 'email'] }]
        });

        const pendingRequests = await FoodRequest.findAll({
            where: { status: 'Pending' },
            include: [{ model: User, as: 'NGO', attributes: ['name', 'phone', 'city', 'email'] }]
        });

        res.json({
            donations,
            requests,
            volunteers,
            pendingDonations,
            pendingRequests,
            stats: { donorsCount, ngosCount, volunteersCount },
            activeDeliveries
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({ message: 'Error fetching admin data' });
    }
});

// Get all users grouped by role
router.get('/users', authenticateToken, verifyRole(['Admin']), async (req, res) => {
    try {
        const donors = await User.findAll({ where: { role: 'Donor' }, attributes: ['id', 'name', 'email', 'phone', 'city', 'role', 'createdAt'] });
        const ngos = await User.findAll({ where: { role: 'NGO' }, attributes: ['id', 'name', 'email', 'phone', 'city', 'role', 'createdAt'] });
        const volunteers = await User.findAll({ where: { role: 'Volunteer' }, attributes: ['id', 'name', 'email', 'phone', 'city', 'role', 'createdAt'] });

        res.json({
            donors,
            ngos,
            volunteers
        });
    } catch (error) {
        console.error('Admin Users List Error:', error);
        res.status(500).json({ message: 'Error fetching users list' });
    }
});

// Assign Volunteer
router.post('/assign', authenticateToken, verifyRole(['Admin']), async (req, res) => {
    try {
        const { donation_id, volunteer_id, request_id } = req.body;

        // 1. Create Assignment
        const assignment = await DonationAssignment.create({
            donation_id,
            request_id: request_id || null, // Optional match
            status: 'Assigned'
        });

        // 2. Update Donation Status
        await FoodDonation.update({ status: 'Assigned' }, { where: { id: donation_id } });

        // 2b. Update Request Status if matched (now assigned, not fulfilled yet)
        if (request_id) {
            await FoodRequest.update({ status: 'Assigned' }, { where: { id: request_id } });
        }

        // 3. Create Pickup/Delivery Record
        await PickupDelivery.create({
            assignment_id: assignment.id,
            volunteer_id,
        });

        res.json({ message: 'Assigned successfully' });
    } catch (error) {
        console.error('Assignment Error:', error);
        res.status(500).json({ message: 'Error assigning volunteer' });
    }
});

module.exports = router;

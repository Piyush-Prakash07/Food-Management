const express = require('express');
const { FoodRequest, User, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const authenticateToken = require('../middleware/auth');
const verifyRole = require('../middleware/rbac');

const router = express.Router();

// Get active requests for a specific NGO
router.get('/', authenticateToken, verifyRole(['NGO']), async (req, res) => {
    try {
        const { request_food_type, status } = req.query;

        let sqlQuery = `SELECT r.id, r.ngo_id, r.request_food_type, r.required_quantity, r.status, r.createdAt, r.updatedAt, u.name as ngo_name 
                        FROM Food_Requests r 
                        JOIN Users u ON r.ngo_id = u.id 
                        WHERE r.ngo_id = :ngoId`;
        let replacements = { ngoId: req.user.id };

        if (request_food_type) {
            sqlQuery += ` AND r.request_food_type LIKE :foodType`;
            replacements.foodType = `%${request_food_type}%`;
        }
        if (status) {
            sqlQuery += ` AND r.status = :status`;
            replacements.status = status;
        }

        sqlQuery += ` ORDER BY r.createdAt DESC`;

        const rawRequests = await sequelize.query(sqlQuery, {
            replacements,
            type: QueryTypes.SELECT
        });

        const requests = rawRequests.map(req => ({
            id: req.id,
            ngo_id: req.ngo_id,
            request_food_type: req.request_food_type,
            required_quantity: req.required_quantity,
            status: req.status,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            NGO: {
                name: req.ngo_name
            }
        }));

        res.json(requests);
    } catch (error) {
        console.error('Fetch Requests Error:', error);
        res.status(500).json({ message: 'Error fetching requests' });
    }
});

// Get ngo dashboard stats
router.get('/dashboard-stats', authenticateToken, verifyRole(['NGO']), async (req, res) => {
    try {
        const totalRequests = await FoodRequest.count({ where: { ngo_id: req.user.id } });
        const pendingRequests = await FoodRequest.count({ where: { ngo_id: req.user.id, status: { [Op.in]: ['Pending', 'Assigned'] } } });
        const fulfilledRequests = await FoodRequest.count({ where: { ngo_id: req.user.id, status: 'Fulfilled' } });

        res.json({ totalRequests, pendingRequests, fulfilledRequests });
    } catch (error) {
        console.error('Fetch NGO Stats Error:', error);
        res.status(500).json({ message: 'Error fetching NGO stats' });
    }
});

// Post a new request
router.post('/', authenticateToken, verifyRole(['NGO']), async (req, res) => {
    try {
        const { request_food_type, required_quantity } = req.body;

        const newReq = await FoodRequest.create({
            ngo_id: req.user.id,
            request_food_type,
            required_quantity,
            status: 'Pending'
        });

        res.status(201).json(newReq);
    } catch (error) {
        console.error('Post Request Error:', error);
        res.status(500).json({ message: 'Error posting food request' });
    }
});

// Get assignments linked to this NGO's requests
router.get('/assignments', authenticateToken, verifyRole(['NGO']), async (req, res) => {
    try {
        const { DonationAssignment, FoodDonation, User } = require('../models');
        const assignments = await DonationAssignment.findAll({
            include: [
                {
                    model: FoodRequest,
                    where: { ngo_id: req.user.id }
                },
                {
                    model: FoodDonation,
                    include: [{ model: User, as: 'Donor', attributes: ['name', 'phone', 'city'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(assignments);
    } catch (error) {
        console.error('Fetch Assignments Error:', error);
        res.status(500).json({ message: 'Error fetching NGO assignments' });
    }
});

// Update a request
router.put('/:id', authenticateToken, verifyRole(['NGO']), async (req, res) => {
    try {
        const { request_food_type, required_quantity } = req.body;
        const request_id = req.params.id;

        const [updatedRows] = await FoodRequest.update(
            { request_food_type, required_quantity },
            { where: { id: request_id, ngo_id: req.user.id, status: 'Pending' } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Request not found or cannot be modified.' });
        }
        res.json({ message: 'Request updated successfully' });
    } catch (error) {
        console.error('Update Request Error:', error);
        res.status(500).json({ message: 'Error updating request' });
    }
});

// Delete a request
router.delete('/:id', authenticateToken, verifyRole(['NGO']), async (req, res) => {
    try {
        const request_id = req.params.id;

        const deletedRows = await FoodRequest.destroy({
            where: { id: request_id, ngo_id: req.user.id, status: 'Pending' }
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Request not found or cannot be deleted.' });
        }
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('Delete Request Error:', error);
        res.status(500).json({ message: 'Error deleting request' });
    }
});

module.exports = router;

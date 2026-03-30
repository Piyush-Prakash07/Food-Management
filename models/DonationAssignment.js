const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DonationAssignment = sequelize.define('DonationAssignment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    donation_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    request_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Might not always have a request
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Assigned', 'In Progress', 'Completed'),
        defaultValue: 'Pending'
    }
}, {
    tableName: 'Donation_Assignments',
    timestamps: true
});

module.exports = DonationAssignment;

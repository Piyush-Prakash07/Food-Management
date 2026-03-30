const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PickupDelivery = sequelize.define('PickupDelivery', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    volunteer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pickup_status: {
        type: DataTypes.ENUM('Pending', 'Picked Up'),
        defaultValue: 'Pending'
    },
    delivery_status: {
        type: DataTypes.ENUM('Pending', 'In Transit', 'Delivered'),
        defaultValue: 'Pending'
    }
}, {
    tableName: 'Pickup_Deliveries',
    timestamps: true
});

module.exports = PickupDelivery;

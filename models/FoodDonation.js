const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FoodDonation = sequelize.define('FoodDonation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    donor_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    food_type: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Available', 'Assigned', 'Completed'),
        defaultValue: 'Available'
    }
}, {
    tableName: 'Food_Donations',
    timestamps: true
});

module.exports = FoodDonation;

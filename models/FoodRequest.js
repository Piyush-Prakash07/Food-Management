const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FoodRequest = sequelize.define('FoodRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ngo_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    required_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    request_food_type: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Assigned', 'Fulfilled'),
        defaultValue: 'Pending'
    }
}, {
    tableName: 'Food_Requests',
    timestamps: true
});

module.exports = FoodRequest;

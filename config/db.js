const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Assuming MySQL is running locally with typical defaults. 
// Can be customized via a .env file later.
const sequelize = new Sequelize(
    process.env.DB_NAME || 'food_management',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false, // Disables logging SQL queries to the console
    }
);

module.exports = sequelize;

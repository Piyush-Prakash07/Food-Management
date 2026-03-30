const sequelize = require('../config/db');
const User = require('./User');
const FoodDonation = require('./FoodDonation');
const FoodRequest = require('./FoodRequest');
const DonationAssignment = require('./DonationAssignment');
const PickupDelivery = require('./PickupDelivery');

// Define Associations

// 1. User -> FoodDonation (Donor)
User.hasMany(FoodDonation, { foreignKey: 'donor_id', onDelete: 'CASCADE' });
FoodDonation.belongsTo(User, { foreignKey: 'donor_id', as: 'Donor' });

// 2. User -> FoodRequest (NGO)
User.hasMany(FoodRequest, { foreignKey: 'ngo_id', onDelete: 'CASCADE' });
FoodRequest.belongsTo(User, { foreignKey: 'ngo_id', as: 'NGO' });

// 3. FoodDonation & FoodRequest -> DonationAssignment
FoodDonation.hasMany(DonationAssignment, { foreignKey: 'donation_id', onDelete: 'CASCADE' });
DonationAssignment.belongsTo(FoodDonation, { foreignKey: 'donation_id' });

FoodRequest.hasMany(DonationAssignment, { foreignKey: 'request_id', onDelete: 'SET NULL' });
DonationAssignment.belongsTo(FoodRequest, { foreignKey: 'request_id' });

// 4. DonationAssignment & User -> PickupDelivery (Volunteer)
DonationAssignment.hasOne(PickupDelivery, { foreignKey: 'assignment_id', onDelete: 'CASCADE' });
PickupDelivery.belongsTo(DonationAssignment, { foreignKey: 'assignment_id' });

User.hasMany(PickupDelivery, { foreignKey: 'volunteer_id', onDelete: 'CASCADE' });
PickupDelivery.belongsTo(User, { foreignKey: 'volunteer_id', as: 'Volunteer' });

const db = {
    sequelize,
    User,
    FoodDonation,
    FoodRequest,
    DonationAssignment,
    PickupDelivery
};

module.exports = db;

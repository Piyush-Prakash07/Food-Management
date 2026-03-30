const db = require('../models');

async function run() {
    try {
        await db.sequelize.query("ALTER TABLE Donation_Assignments MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Completed', 'Assigned') DEFAULT 'Pending'");
        console.log("Success");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}
run();

const mysql = require('mysql2/promise');

async function fixIndexes() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'password',
        database: process.env.DB_NAME || 'food_management'
    });

    try {
        const [rows] = await connection.query("SHOW INDEX FROM Users WHERE Key_name LIKE 'email%'");
        const keyNames = [...new Set(rows.map(r => r.Key_name))];
        
        console.log(`Found ${keyNames.length} indexes related to 'email'.`);
        
        for (const key of keyNames) {
            try {
                await connection.query(`ALTER TABLE Users DROP INDEX \`${key}\``);
                console.log(`Dropped index: ${key}`);
            } catch (err) {
                console.error(`Error dropping index ${key}:`, err.message);
            }
        }
        console.log("Finished dropping indexes.");
    } catch (err) {
        console.error("Database error:", err);
    } finally {
        await connection.end();
    }
}

fixIndexes();

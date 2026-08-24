const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import DB Connection and Models
const db = require('./models');

// Import Middlewares
const authenticateToken = require('./middleware/auth');
const verifyRole = require('./middleware/rbac');

dotenv.config();

const app = express();

const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : 'http://localhost:5173',
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Import route files
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donor');
const ngoRoutes = require('./routes/ngo');
const adminRoutes = require('./routes/admin');
const volunteerRoutes = require('./routes/volunteer');
const userRoutes = require('./routes/users');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/users', userRoutes);

// Sync Database logic
const PORT = process.env.PORT || 5000;

// Safe DB sync: do not run alter: true in production unless explicitly requested.
const isProd = process.env.NODE_ENV === 'production';
const shouldAlter = process.env.DB_SYNC_ALTER === 'true' || !isProd;

db.sequelize.sync({ alter: shouldAlter }).then(() => {
    console.log('Database connected and models synced.');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});

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

// ================= CORS CONFIGURATION =================

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://food-management-iota-lilac.vercel.app'
];

if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(
        ...process.env.ALLOWED_ORIGINS
            .split(',')
            .map(origin => origin.trim())
            .filter(Boolean)
    );
}

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests without origin (Postman, mobile apps) or matching origins/localhost
        if (!origin || 
            allowedOrigins.includes(origin) || 
            /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
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

// Server Port
const PORT = process.env.PORT || 5000;

// Safe DB sync without alter loops
db.sequelize.sync()
    .then(() => {
        console.log('Database connected and models synced.');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
    });
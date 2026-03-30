const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // Usually sent as "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey123');
        req.user = decoded; // { id, role, etc. }
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = authenticateToken;

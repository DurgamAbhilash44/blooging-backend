import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const key = process.env.secret || 'default_secret_key'; // Fallback for dev environments

const AuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Invalid token format" });
    }

    try {
        const decoded = jwt.verify(token, key);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

const generateToken = (userData) => {
    return jwt.sign(userData, key, { expiresIn: '1h' }); // 1 hour expiry
};

export { AuthMiddleware, generateToken };

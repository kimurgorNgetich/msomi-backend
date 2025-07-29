import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log('Auth middleware - Token:', token ? token : 'Missing');
    console.log('Auth middleware - Cookies:', req.cookies);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded JWT:', decoded);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('Auth middleware - User not found for ID:', decoded.id);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = { id: user._id, role: user.role };
    console.log('Auth middleware - User set:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

export const adminMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};
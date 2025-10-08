import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

/**
 * Middleware to verify the JWT from the Authorization header.
 * If the token is valid, it attaches the full user object (without password) to the request.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token is required.' });
    }
    
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database to ensure they still exist and have current permissions.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, matricNo: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token: user not found.' });
    }

    // Attach the user object to the request for use in subsequent handlers.
    req.user = user;
    next();
  } catch (err) {
    // Catches errors like expired or malformed tokens.
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
};

/**
 * Middleware factory to restrict access to a route based on user roles.
 * @param {string[]} roles - An array of roles that are allowed to access the route.
 * @returns {Function} Express middleware function.
 */
export const requireRole = (roles = []) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: You do not have the required permissions.' });
  }
  next();
};
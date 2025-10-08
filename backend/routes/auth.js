import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../src/prismaClient.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user. Public registration is locked to the STUDENT role.
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, matricNo } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        // For security, public registration is always set to STUDENT.
        // Admins must be created via the Super Admin user management panel.
        role: 'STUDENT', 
        matricNo: matricNo || null
      }
    });

    // Automatically log the user in by providing a token upon registration.
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _p, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and return a JWT.
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _p, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
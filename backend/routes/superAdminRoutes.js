import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../src/prismaClient.js';
import { authMiddleware, requireRole } from '../src/middleware/auth.js';

const router = express.Router();

// This middleware ensures that only users with the SUPER_ADMIN role can access any route in this file.
router.use(authMiddleware, requireRole(['SUPER_ADMIN']));

/**
 * @route   GET /api/superadmin/users
 * @desc    Get a list of all users in the system.
 * @access  Private (Super Admin only)
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { // Select specific fields to avoid sending the password hash.
        id: true,
        name: true,
        email: true,
        matricNo: true,
        role: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   PUT /api/superadmin/users/:id/role
 * @desc    Update a specific user's role.
 * @access  Private (Super Admin only)
 */
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['STUDENT', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/superadmin/users
 * @desc    Create a new user (typically for creating Admins or other special roles).
 * @access  Private (Super Admin only)
 */
router.post('/users', async (req, res) => {
    try {
        const { name, email, password, role, matricNo } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already in use' });

        const hashed = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                role: role || 'STUDENT',
                matricNo: matricNo || null
            },
            select: { id: true, name: true, email: true, role: true },
        });

        res.status(201).json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Blackout Date Management Routes ---

/**
 * @route   GET /api/superadmin/blackout-dates
 * @desc    Get all configured blackout dates.
 * @access  Private (Super Admin only)
 */
router.get('/blackout-dates', async (req, res) => {
  try {
    const dates = await prisma.blackoutDate.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        createdBy: {
            select: { name: true }
        }
      }
    });
    res.json(dates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/superadmin/blackout-dates
 * @desc    Create a new blackout date period.
 * @access  Private (Super Admin only)
 */
router.post('/blackout-dates', async (req, res) => {
  try {
    const { reason, startDate, endDate } = req.body;
    const adminId = req.user.id;

    if (!reason || !startDate || !endDate) {
      return res.status(400).json({ error: 'Reason, start date, and end date are required.' });
    }
    if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ error: 'End date cannot be before start date.' });
    }

    const newBlackoutDate = await prisma.blackoutDate.create({
      data: {
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdById: adminId,
      },
    });
    res.status(201).json(newBlackoutDate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   DELETE /api/superadmin/blackout-dates/:id
 * @desc    Delete a blackout date period.
 * @access  Private (Super Admin only)
 */
router.delete('/blackout-dates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.blackoutDate.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
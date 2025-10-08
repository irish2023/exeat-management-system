import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../src/prismaClient.js';
import { authMiddleware } from '../src/middleware/auth.js';

const router = express.Router();

// This middleware ensures a user is logged in for all routes in this file.
router.use(authMiddleware);

/**
 * @route   PUT /api/users/profile/name
 * @desc    Update the logged-in user's name.
 * @access  Private (Any authenticated user)
 */
router.put('/profile/name', async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true, email: true, matricNo: true, role: true },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   PUT /api/users/profile/password
 * @desc    Change the logged-in user's password after verifying their current one.
 * @access  Private (Any authenticated user)
 */
router.put('/profile/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Verify the user's current password before allowing a change.
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/users/blackout-dates
 * @desc    Get a list of all active (i.e., not yet ended) blackout dates.
 * @access  Private (Any authenticated user)
 */
router.get('/blackout-dates', async (req, res) => {
  try {
    const today = new Date();
    // Only fetch blackout periods that haven't ended yet to avoid cluttering the UI.
    const dates = await prisma.blackoutDate.findMany({
      where: {
        endDate: {
          gte: today,
        }
      },
      orderBy: { startDate: 'asc' },
    });
    res.json(dates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
import express from 'express';
import prisma from '../src/prismaClient.js';
import { authMiddleware } from '../src/middleware/auth.js';

const router = express.Router();

// This middleware ensures a user is logged in for all routes in this file.
router.use(authMiddleware);

/**
 * @route   POST /api/requests
 * @desc    Create a new exeat request.
 * @access  Private (Any authenticated user, assumed to be a student)
 */
router.post('/', async (req, res) => {
  try {
    const { reason, destination, startDate, endDate, type } = req.body;

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date cannot be before the start date.' });
    }

    const newReq = await prisma.exeatRequest.create({
      data: {
        reason,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        studentId: req.user.id,
        type: type 
      },
    });

    await prisma.notification.create({ 
      data: { 
        userId: req.user.id, 
        message: `Your exeat request for "${newReq.reason}" has been submitted.` 
      } 
    });
    res.status(201).json(newReq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/requests/my
 * @desc    Get a list of the logged-in user's own exeat requests.
 * @access  Private (Any authenticated user)
 */
router.get('/my', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

    const rows = await prisma.exeatRequest.findMany({ 
      where: { studentId: req.user.id }, 
      orderBy: { createdAt: 'desc' },
      take: limit, 
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   DELETE /api/requests/:id/cancel
 * @desc    Cancel one of the user's own pending exeat requests.
 * @access  Private (Any authenticated user)
 */
router.delete('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const requestToCancel = await prisma.exeatRequest.findUnique({
      where: { id: Number(id) },
    });

    if (!requestToCancel) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // Security check: Ensure the request belongs to the student trying to cancel it.
    if (requestToCancel.studentId !== studentId) {
      return res.status(403).json({ error: 'Forbidden. You can only cancel your own requests.' });
    }

    // Business logic check: Only allow cancellation if the request is still pending.
    if (requestToCancel.status !== 'PENDING') {
      return res.status(400).json({ error: 'This request has already been processed and can no longer be canceled.' });
    }

    const canceledRequest = await prisma.exeatRequest.update({
      where: { id: Number(id) },
      data: { status: 'CANCELED' },
    });

    res.json(canceledRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/requests/notifications
 * @desc    Get all notifications for the logged-in user.
 * @access  Private (Any authenticated user)
 */
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({ 
      where: { userId: req.user.id }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/requests/notifications/:id/read
 * @desc    Mark a specific notification as read.
 * @access  Private (Any authenticated user)
 */
router.post('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    // We could add a check here to ensure the notification belongs to the user.
    const notification = await prisma.notification.update({
      where: { id: Number(id) },
      data: { read: true },
    });
    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/requests/notifications/read-all
 * @desc    Mark all of the user's unread notifications as read.
 * @access  Private (Any authenticated user)
 */
router.post('/notifications/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
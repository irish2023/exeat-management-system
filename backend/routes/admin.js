import express from 'express';
import { Parser } from 'json2csv';
import prisma from '../src/prismaClient.js';
import { authMiddleware, requireRole } from '../src/middleware/auth.js';
import { Status } from '@prisma/client';
import { sendNotificationEmail } from '../src/emailService.js';

const router = express.Router();

/**
 * @route   GET /api/admin/analytics
 * @desc    Get analytics data for the reports page, such as requests per month.
 * @access  Private (Admin, Super Admin)
 */
router.get('/analytics', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // Get total requests per month for the last 12 months using a raw SQL query for efficiency.
    const requestsByMonth = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        CAST(COUNT(id) AS INTEGER) as count
      FROM "ExeatRequest"
      WHERE "createdAt" > NOW() - INTERVAL '12 month'
      GROUP BY month
      ORDER BY month;
    `;

    // Get the top 5 most frequent destinations for exeat requests.
    const topDestinations = await prisma.exeatRequest.groupBy({
      by: ['destination'],
      _count: { destination: true },
      orderBy: { _count: { destination: 'desc' } },
      take: 5,
      where: { destination: { not: null } }
    });

    res.json({ requestsByMonth, topDestinations });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get key performance indicators (KPIs) for the admin dashboard.
 * @access  Private (Admin, Super Admin)
 */
router.get('/stats', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const pendingCount = await prisma.exeatRequest.count({ where: { status: 'PENDING' } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of the day
    const approvedTodayCount = await prisma.exeatRequest.count({
      where: {
        status: 'APPROVED',
        actionedAt: { gte: today },
      },
    });

    const flaggedEmergencyCount = await prisma.exeatRequest.count({
      where: {
        status: 'PENDING',
        type: 'EMERGENCY',
      },
    });

    res.json({
      pending: pendingCount,
      approvedToday: approvedTodayCount,
      flaggedEmergency: flaggedEmergencyCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/admin/requests
 * @desc    Get a list of all exeat requests with filtering, search, and CSV export capabilities.
 * @access  Private (Admin, Super Admin)
 */
router.get('/requests', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { status, type, search, format } = req.query;

    // Build a dynamic query based on the filter parameters provided.
    const whereClause = {};
    if (status && Object.values(Status).includes(status.toUpperCase())) {
        whereClause.status = status.toUpperCase();
    }
    if (type) {
        whereClause.type = type.toUpperCase();
    }
    if (search) {
      whereClause.student = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { matricNo: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const requests = await prisma.exeatRequest.findMany({
      where: whereClause,
      include: {
        student: { select: { name: true, email: true, matricNo: true } },
        actionedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // If the 'format' query parameter is 'csv', generate and return a CSV file.
    if (format === 'csv') {
      const fields = [
        { label: 'Student Name', value: 'student.name' },
        { label: 'Matric No', value: 'student.matricNo' },
        'reason', 'destination', 'status', 'type', 'startDate', 'endDate',
        'createdAt', { label: 'Actioned By', value: 'actionedBy.name' },
        'actionedAt', 'adminComment',
      ];
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(requests);
      
      res.header('Content-Type', 'text/csv');
      res.attachment(`exeat-requests-${Date.now()}.csv`);
      return res.send(csv);
    }
    
    // By default, return the data as JSON.
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/admin/requests/:id/decision
 * @desc    Process a decision (approve, reject) for a pending exeat request.
 *          Sends both an in-app notification and an email to the student.
 * @access  Private (Admin, Super Admin)
 */
router.post('/requests/:id/decision', authMiddleware, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    const adminId = req.user.id;

    // Fetch the request and include the student's details for notifications.
    const reqRow = await prisma.exeatRequest.findUnique({ 
        where: { id: Number(id) },
        include: { student: { select: { email: true, name: true } } } 
    });

    if (!reqRow) return res.status(404).json({ error: 'Request not found' });
    if (reqRow.status !== 'PENDING') return res.status(400).json({ error: 'This request has already been actioned.' });

    let status;
    let notificationMessage;
    let emailSubject;
    let emailBody;

    switch (action) {
      case 'approve':
        status = Status.APPROVED;
        notificationMessage = `Your exeat request for "${reqRow.reason}" has been APPROVED.`;
        emailSubject = "Your Exeat Request has been Approved";
        emailBody = `<h2>Request Approved</h2><p>Hello ${reqRow.student.name},</p><p>Your exeat request for the reason "<strong>${reqRow.reason}</strong>" has been approved.</p><p>You can view the details by logging into the portal.</p><p>Thank you,<br><strong>ClearPath Exeat Management</strong></p>`;
        break;
      case 'reject':
        status = Status.REJECTED;
        notificationMessage = `Your exeat request for "${reqRow.reason}" has been REJECTED.`;
        emailSubject = "Update on Your Exeat Request";
        emailBody = `<h2>Request Rejected</h2><p>Hello ${reqRow.student.name},</p><p>Unfortunately, your exeat request for the reason "<strong>${reqRow.reason}</strong>" has been rejected.</p><p><strong>Admin's Comment:</strong> ${comment || 'No comment provided.'}</p><p>Please log in to the portal if you need to submit a new request.</p><p>Thank you,<br><strong>ClearPath Exeat Management</strong></p>`;
        break;
      case 'request_info':
        status = Status.AWAITING_INFO;
        notificationMessage = `An admin has requested more information on your exeat request for "${reqRow.reason}".`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action type' });
    }

    const updated = await prisma.exeatRequest.update({
      where: { id: Number(id) },
      data: {
        status,
        adminComment: comment,
        actionedById: adminId,
        actionedAt: new Date(),
      }
    });

    // Create an in-app notification for the student.
    await prisma.notification.create({
      data: {
        userId: updated.studentId,
        message: notificationMessage
      }
    });
    
    // If the action was an approval or rejection, send a corresponding email.
    if (emailSubject && emailBody) {
        sendNotificationEmail(reqRow.student.email, emailSubject, emailBody);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
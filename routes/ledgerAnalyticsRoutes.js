const express = require('express');
const router = express.Router();
const { getLedgerAnalytics, getLeadLedgerAnalytics } = require('../controllers/ledgerAnalyticsController');
const { auth } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Ledger Analytics
 *   description: Endpoints for payment ledger analytics
 */

/**
 * @swagger
 * /api/v1/ledger/analytics:
 *   get:
 *     summary: Get overall ledger analytics
 *     description: Returns aggregated data such as total collected amount, total due, overdue payments, payment mode breakdown, monthly trends, and recent payments.
 *     tags: [Ledger Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ledger analytics data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCollected:
 *                       type: string
 *                       example: "₹10 Lakhs"
 *                     totalDue:
 *                       type: string
 *                       example: "₹2 Lakhs"
 *                     overdueCount:
 *                       type: integer
 *                       example: 5
 *                     paymentModeBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mode:
 *                             type: string
 *                             example: "Cash"
 *                           count:
 *                             type: integer
 *                             example: 12
 *                           totalAmount:
 *                             type: string
 *                             example: "₹5 Lakhs"
 *                     monthlyTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: "Jan"
 *                           year:
 *                             type: integer
 *                             example: 2025
 *                           totalAmount:
 *                             type: string
 *                             example: "₹50,000"
 *                           count:
 *                             type: integer
 *                             example: 3
 *                     recentPayments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           leadName:
 *                             type: string
 *                             example: "John Doe"
 *                           phone:
 *                             type: string
 *                             example: "9876543210"
 *                           amount:
 *                             type: string
 *                             example: "₹25,000"
 *                           paymentMode:
 *                             type: string
 *                             example: "UPI"
 *                           paymentDate:
 *                             type: string
 *                             format: date-time
 *                           outstandingBalance:
 *                             type: string
 *                             example: "₹5,000"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/', auth, getLedgerAnalytics);

/**
 * @swagger
 * /api/v1/ledger/analytics/{leadId}:
 *   get:
 *     summary: Get detailed ledger analytics for a specific lead
 *     description: Returns collected amount, due amount, overdue count, and all payments for the given lead.
 *     tags: [Ledger Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the lead
 *     responses:
 *       200:
 *         description: Ledger analytics for the lead retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCollected:
 *                       type: string
 *                       example: "₹1,00,000"
 *                     totalDue:
 *                       type: string
 *                       example: "₹25,000"
 *                     overdueCount:
 *                       type: integer
 *                       example: 2
 *                     payments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           amount:
 *                             type: string
 *                             example: "₹20,000"
 *                           paymentMode:
 *                             type: string
 *                             example: "Cheque"
 *                           paymentDate:
 *                             type: string
 *                             format: date-time
 *                           outstandingBalance:
 *                             type: string
 *                             example: "₹5,000"
 *                           paymentType:
 *                             type: string
 *                             example: "Installment"
 *                           installmentPlan:
 *                             type: string
 *                             example: "Plan A"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Lead not found
 *       500:
 *         description: Server error
 */
router.get('/:leadId', auth, getLeadLedgerAnalytics);

module.exports = router;

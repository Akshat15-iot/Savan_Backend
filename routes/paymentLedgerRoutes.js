const express = require('express');
const router = express.Router();
const { addPayment, getPayments, updatePayment, getPaymentById } = require('../controllers/paymentLedgerController');
const { auth } = require('../middlewares/auth');
/**
 * @swagger
 * tags:
 *   name: PaymentLedger
 *   description: API for managing payment ledger entries (token amount, installment plan, payment mode, etc.)
 */

/**
 * @swagger
 * /api/v1/payment-ledger:
 *   post:
 *     summary: Add a new payment ledger entry
 *     tags: [PaymentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadId
 *               - projectId
 *               - propertyId
 *               - paymentType
 *               - paymentMode
 *             properties:
 *               leadId:
 *                 type: string
 *                 description: Lead ID (must reference an accepted lead)
 *               projectId:
 *                 type: string
 *                 description: Project ID
 *               propertyId:
 *                 type: string
 *                 description: Property ID
 *               paymentType:
 *                 type: string
 *                 enum: [token, emi, full_payment]
 *                 description: Type of payment (token, emi, or full_payment)
 *               tokenAmount:
 *                 type: number
 *                 description: Token amount (required for token payments, optional for others)
 *               amount:
 *                 type: number
 *                 description: Payment amount (required for emi/full_payment)
 *               installmentPlan:
 *                 type: string
 *                 enum: [Yes, No]
 *                 description: Installment plan (required for emi/full_payment)
 *               transactionId:
 *                 type: string
 *                 description: Transaction ID (optional)
 *               paymentMode:
 *                 type: string
 *                 enum: [Cash, UPI, Cheque, Bank Transfer, Card, Others]
 *                 description: Payment mode
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Date of payment (defaults to current date)
 *               outstandingBalance:
 *                 type: number
 *                 description: Outstanding balance after this payment
 *     responses:
 *       201:
 *         description: Payment recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PaymentLedger'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Lead not found or not interested
 */

/** 
 * @swagger
 * /api/v1/payment-ledger
 * put
 * update payment ledger entry
 * security:
 *   - bearerAuth: []
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     schema:
 *       type: string
 *     description: Payment ID (MongoDB ObjectId)
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           amount:
 *             type: number
 *           tokenAmount:
 *             type: number
 *           paymentDate:
 *             type: string
 *             format: date
 *           paymentMode:
 *             type: string
 *             enum: [Cash, UPI, Cheque, Bank Transfer, Card, Others]
 *           transactionId:
 *             type: string
 *           outstandingBalance:
 *             type: number
 * responses:
 *   200:
 *     description: Payment updated
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             message:
 *               type: string
 *             data:
 *               $ref: '#/components/schemas/PaymentLedger'
 *   400:
 *     description: Invalid input
 *   401:
 *     description: Unauthorized
 *   404:
 *     description: Payment not found
 */
/**
 * @swagger
 * /api/v1/payment-ledger:
 *   get:
 *     summary: Get all payment ledger entries (optionally filter by lead)
 *     tags: [PaymentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: Filter by Lead ID
 *     responses:
 *       200:
 *         description: List of payment ledger entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentLedger'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentLedger:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         leadId:
 *           type: string
 *         tokenAmount:
 *           type: number
 *         installmentPlan:
 *           type: string
 *           enum: [Yes, No]
 *         paymentMode:
 *           type: string
 *           enum: [Cash, UPI, Cheque, Bank Transfer]
 *         paymentDate:
 *           type: string
 *           format: date
 *         outstandingBalance:
 *           type: number
 *         createdBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// POST /api/v1/payment-ledger
router.post('/', auth, addPayment);

// GET /api/v1/payment-ledger
router.get('/', auth, getPayments);

// GET /api/v1/payment-ledger/:id - Get payment by ID
router.get('/:id', auth, getPaymentById);

// PUT /api/v1/payment-ledger/:id - Update payment
router.put('/:id', auth, updatePayment);

module.exports = router;

// Get all payments with optional filters
/**
 * @swagger
 * /api/v1/payment-ledger:
 *   get:
 *     summary: Get payment ledger entries with optional filters
 *     tags: [PaymentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: Filter by lead ID
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by property ID
 *       - in: query
 *         name: paymentType
 *         schema:
 *           type: string
 *           enum: [token, emi, full_payment]
 *         description: Filter by payment type
 *     responses:
 *       200:
 *         description: List of payment ledger entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentLedger'
 *       500:
 *         description: Server error
 */
router.get('/', auth, getPayments);

// Get single payment
router.get('/:id', (req, res) => {
  res.json({ message: 'Get single payment - to be implemented' });
});

// Create new payment
router.post('/', (req, res) => {
  res.json({ message: 'Create payment - to be implemented' });
});

// Update payment
router.put('/:id', (req, res) => {
  res.json({ message: 'Update payment - to be implemented' });
});

// Delete payment
router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete payment - to be implemented' });
});

module.exports = router; 
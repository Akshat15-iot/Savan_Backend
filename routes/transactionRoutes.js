const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // multipart form-data parser
const { auth } = require("../middlewares/auth");
const transactionController = require("../controllers/transactionController");

// Apply auth middleware to all routes
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management APIs
 */

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     summary: Get transactions with pagination and date filter
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *         description: Items per page
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Transaction list
 */
router.get("/", transactionController.getTransactions);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       200:
 *         description: Transaction detail
 */
router.get("/:id", transactionController.getTransactionById);

/**
 * @swagger
 * /api/v1/transactions:
 *   post:
 *     summary: Create a transaction
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               date: { type: string }
 *               time: { type: string }
 *               type: { type: string, enum: [incoming, outgoing] }
 *               amount: { type: number }
 *               description: { type: string }
 *               mode: { type: string }
 *     responses:
 *       201:
 *         description: Transaction created
 */
router.post("/", upload.none(), transactionController.createTransaction);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               date: { type: string }
 *               time: { type: string }
 *               type: { type: string, enum: [incoming, outgoing] }
 *               amount: { type: number }
 *               description: { type: string }
 *               mode: { type: string }
 *     responses:
 *       200:
 *         description: Transaction updated
 */
router.put("/:id", upload.none(), transactionController.updateTransaction);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       200:
 *         description: Transaction deleted
 */
router.delete("/:id", transactionController.deleteTransaction);

module.exports = router;

// routes/stockRoutes.js
const express = require("express");
const router = express.Router();
const {
  createStock,
  getStocks,
  getStockById,
  updateStock,
  deleteStock,
} = require("../controllers/stockController");

// IMPORTANT: match your existing middleware export shape
// If your auth is: module.exports = { auth }, then:
const { auth } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Stocks
 *   description: Stock management APIs
 */

/**
 * @swagger
 * /api/v1/stocks:
 *   post:
 *     summary: Create a new stock record
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - usedIn
 *               - location
 *               - quantity
 *               - unit
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: Reference to Item _id
 *               usedIn:
 *                 type: string
 *                 example: "Tower Construction"
 *               location:
 *                 type: string
 *                 example: "Warehouse A"
 *               quantity:
 *                 type: number
 *                 example: 20
 *               unit:
 *                 type: string
 *                 enum: [Ton, quintal, Pieces]
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-01"
 *     responses:
 *       201:
 *         description: Stock created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: Get stock list with pagination and filters
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         description: Filter by Item ID
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (partial match)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start of date range (inclusive)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End of date range (inclusive)
 *     responses:
 *       200:
 *         description: Paginated stock list
 *       500:
 *         description: Server error
 */

// Create & List
router.post("/", auth, createStock);
router.get("/", auth, getStocks);

/**
 * @swagger
 * /api/v1/stocks/{id}:
 *   get:
 *     summary: Get a single stock by ID
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock details
 *       404:
 *         description: Not found
 *
 *   put:
 *     summary: Update a stock record
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *               usedIn:
 *                 type: string
 *               location:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *                 enum: [Ton, quintal, Pieces]
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Stock updated
 *       404:
 *         description: Not found
 *
 *   delete:
 *     summary: Delete a stock record
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock deleted
 *       404:
 *         description: Not found
 */

router.get("/:id", auth, getStockById);
router.put("/:id", auth, updateStock);
router.delete("/:id", auth, deleteStock);

module.exports = router;

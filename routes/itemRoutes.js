const express = require("express");
const router = express.Router();
const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");
const { auth } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Site item management APIs
 */

/**
 * @swagger
 * /api/v1/items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siteId
 *               - itemName
 *               - quantity
 *               - minQuantity
 *               - unit
 *               - carNo
 *               - receivingPerson
 *             properties:
 *               siteId:
 *                 type: string
 *                 example: "SITE-123"
 *               itemName:
 *                 type: string
 *                 example: "Cement"
 *               quantity:
 *                 type: number
 *                 example: 100
 *               minQuantity:
 *                 type: number
 *                 example: 10
 *               unit:
 *                 type: string
 *                 enum: [ton, quintal, pieces]
 *                 example: "ton"
 *               carNo:
 *                 type: string
 *                 example: "UP16AB1234"
 *               receivingPerson:
 *                 type: string
 *                 example: "Rajesh Kumar"
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: Get all items (optionally filtered by site)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: siteId
 *         schema:
 *           type: string
 *         description: Filter items by site ID
 *     responses:
 *       200:
 *         description: List of items
 *       500:
 *         description: Server error
 */
router.post("/", auth, createItem);
router.get("/", auth, getItems);

/**
 * @swagger
 * /api/v1/items/{id}:
 *   get:
 *     summary: Get an item by ID
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Item not found
 *
 *   put:
 *     summary: Update an item by ID
 *     tags: [Items]
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
 *               itemName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               minQuantity:
 *                 type: number
 *               unit:
 *                 type: string
 *                 enum: [ton, quintal, pieces]
 *               carNo:
 *                 type: string
 *               receivingPerson:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       404:
 *         description: Item not found
 *
 *   delete:
 *     summary: Delete an item by ID
 *     tags: [Items]
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
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 */
router.get("/:id", auth, getItemById);
router.put("/:id", auth, updateItem);
router.delete("/:id", auth, deleteItem);

module.exports = router;

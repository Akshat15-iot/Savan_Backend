const express = require("express");
const router = express.Router();
const { createContact, getAllContacts, updateContactStatus } = require("../controllers/contactController");

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact Us form management
 */

/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     summary: Submit a new contact request (public API)
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "+91-9876543210"
 *               message:
 *                 type: string
 *                 example: I am interested in your project
 *               budget:
 *                 type: number
 *                 example: 5000000
 *               location:
 *                 type: string
 *                 example: New Delhi
 *     responses:
 *       201:
 *         description: Contact created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/", createContact);

/**
 * @swagger
 * /api/v1/contact:
 *   get:
 *     summary: Get all contact submissions (public API) with pagination and status filter
 *     tags: [Contact]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Converted, Rejected]
 *     responses:
 *       200:
 *         description: Paginated list of contacts
 *       500:
 *         description: Server error
 */
router.get("/", getAllContacts);
/**
 * @swagger
 * /api/v1/contact/{id}/status:
 *   put:
 *     summary: Update contact status (Admin Only)
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Converted, Rejected]
 *                 example: Converted
 *     responses:
 *       200: { description: Contact status updated successfully }
 *       400: { description: Invalid status value }
 *       404: { description: Contact not found }
 *       500: { description: Server error }
 */
router.put("/:contactId/status", updateContactStatus);


module.exports = router;

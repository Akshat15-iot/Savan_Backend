const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const reminderController = require('../controllers/reminderController');

/**
 * @swagger
 * tags:
 *   name: Reminder
 *   description: Manage reminders for salespersons
 */

/**
 * @swagger
 * /api/v1/reminders/reminders:
 *   post:
 *     summary: Create a new reminder
 *     tags: [Reminder]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadName
 *               - leadId
 *               - type
 *               - date
 *               - time
 *               - notificationType
 *             properties:
 *               leadName:
 *                 type: string
 *                 example: John Doe
 *               leadId:
 *                 type: string
 *                 example: 652f2b3c4d5e6f7a8b9c0d1e
 *               type:
 *                 type: string
 *                 example: followup
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2025-08-07
 *               time:
 *                 type: string
 *                 example: "14:30"
 *               notificationType:
 *                 type: string
 *                 example: email
 *     responses:
 *       201:
 *         description: Reminder created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/reminders', auth, reminderController.createReminder);

/**
 * @swagger
 * /api/v1/reminders/reminders:
 *   get:
 *     summary: Get all reminders for the logged-in salesperson
 *     tags: [Reminder]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reminders
 *       401:
 *         description: Unauthorized
 */
router.get('/reminders', auth, reminderController.getMyReminders);
// POST - create a reminder
router.post('/reminders', auth, reminderController.createReminder);

// GET - list of all reminders for that salesperson
router.get('/reminders', auth, reminderController.getMyReminders);

module.exports = router;

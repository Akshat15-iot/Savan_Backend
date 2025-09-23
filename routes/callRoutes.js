const express = require('express');
const { createCall, getCallsByLead, getCallById } = require('../controllers/callController');
const { uploadAudio } = require('../middlewares/upload');
const { auth } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Calls
 *   description: API endpoints for call recordings
 */

/**
 * @swagger
 * /api/v1/calls:
 *   post:
 *     summary: Upload a new call recording for a lead
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - leadId
 *               
 *             properties:
 *               leadId:
 *                 type: string
 *                 description: ID of the lead
 *               description:
 *                 type: string
 *                 description: Optional description of the call
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (MP3 format)
 *     responses:
 *       201:
 *         description: Call recorded successfully
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
 *                   $ref: '#/components/schemas/Call'
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.post("/", auth, uploadAudio, createCall);

/**
 * @swagger
 * /api/v1/calls/lead/{leadId}:
 *   get:
 *     summary: Get all calls for a specific lead
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lead
 *     responses:
 *       200:
 *         description: List of calls for the lead
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
 *                     $ref: '#/components/schemas/Call'
 */
router.get("/lead/:leadId", auth, getCallsByLead);

/**
 * @swagger
 * /api/v1/calls/{callId}:
 *   get:
 *     summary: Get details of a specific call
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the call
 *     responses:
 *       200:
 *         description: Call details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Call'
 */
router.get("/:callId", auth, getCallById);

module.exports = router;

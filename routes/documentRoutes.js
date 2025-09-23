const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { uploadDocumentFile } = require('../middlewares/upload');
const documentController = require('../controllers/documentController');

/**
 * @swagger
 * tags:
 *   name: Document
 *   description: Manage document uploads and retrieval for leads
 */

/**
 * @swagger
 * /api/v1/documents/upload:
 *   post:
 *     summary: Upload a document (PDF, JPG, PNG) for a lead
 *     tags: [Document]
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
 *               - docType
 *               - document
 *             properties:
 *               leadId:
 *                 type: string
 *                 example: 60d1b2c3d4e5f6g7h8i9j0k1
 *               docType:
 *                 type: string
 *                 enum: [kyc, loan, payment, sales]
 *                 example: kyc
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: The document file (PDF, JPG, or PNG)
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: File is required or invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/upload', auth, uploadDocumentFile, documentController.uploadDocument);

/**
/**
 * @swagger
 * /api/v1/documents/{id}:
 *   get:
 *     summary: Get all documents for a specific lead
 *     tags: [Document]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lead to get documents for
 *     responses:
 *       200:
 *         description: List of documents for the lead
 *       400:
 *         description: Invalid lead ID format
 *       404:
 *         description: Lead not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', auth, documentController.getDocuments);
module.exports = router;

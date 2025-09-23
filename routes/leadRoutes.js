// routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

const {
  createLead,
  importCsv,
  getLeads,
  getMyLeads,
  updateLead,
  updateLeadStatus,
  getLeadStats,
  metaWebhook,
  googleWebhook,
  assignProjectAndProperty,
  getAllCompanyLeads
} = require('../controllers/leadController');

const upload = multer({
  dest: path.join(__dirname, '..', 'tmp'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedExt = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExt.includes(ext)) return cb(null, true);

    cb(new Error('Only CSV, XLSX, or XLS files are allowed'));
  }
});


/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: Lead management and assignment
 */

/**
 * @swagger
 * /api/v1/leads:
 *   post:
 *     summary: Create a new lead manually
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeadInput'
 *     responses:
 *       201:
 *         description: Lead created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate lead
 */
router.post('/', auth, authorize('admin', 'subadmin-lms', 'salesperson'), createLead);

/**
 * @swagger
 * /api/v1/leads/my-leads:
 *   get:
 *     summary: Get leads assigned to the logged-in salesperson
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of leads assigned to the salesperson
 *       401:
 *         description: Unauthorized
 */
router.get('/my-leads', auth, authorize('salesperson'), getMyLeads);

/**
 * @swagger
 * /api/v1/leads/bulk-upload:
 *   post:
 *     summary: Import leads from CSV/XLS/XLSX and assign them to a selected company
 *     description: |
 *       - Admin must select a company before uploading the file.  
 *       - `companyId` is required in form-data (not inside the file).  
 *       - Supported formats: CSV, XLS, XLSX.  
 *       - Each lead will automatically be assigned to the company and a salesperson (round-robin).  
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - companyId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV/XLS/XLSX file containing leads
 *               companyId:
 *                 type: string
 *                 description: The ID of the company to which all leads will be assigned
 *     responses:
 *       200:
 *         description: File processed with summary of created, skipped, and errors
 *       400:
 *         description: Missing file or companyId
 *       404:
 *         description: Company not found
 */
router.post(
  '/bulk-upload',
  auth,
  authorize('admin', 'subadmin-lms'),
  upload.single('file'),
  importCsv
);

/**
 * @swagger
 * /api/v1/leads:
 *   get:
 *     summary: Get leads list
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: source
 *         schema: { type: string }
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string }
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of leads with pagination
 */
router.get('/', auth, getLeads);

/**
 * @swagger
 * /api/v1/leads/stats:
 *   get:
 *     summary: Get lead status counts
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status breakdown
 */
router.get('/stats', auth, getLeadStats);

/**
 * @swagger
 * /api/v1/leads/{id}:
 *   put:
 *     summary: Update lead details
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Updated lead
 *       404:
 *         description: Lead not found
 */
router.put('/:id', auth, authorize('admin', 'subadmin-lms'), updateLead);

/**
 * @swagger
 * /api/v1/leads/{id}/status:
 *   patch:
 *     summary: Update lead status
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, contacted, site_visit, booking_done, dropped]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Lead not found
 */
router.patch('/:id/status', auth, authorize('admin', 'subadmin-lms', 'salesperson'), updateLeadStatus);

/**
 * @swagger
 * /api/v1/leads/webhooks/meta:
 *   get:
 *     summary: Verify Meta webhook
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: hub.verify_token
 *         schema: { type: string }
 *       - in: query
 *         name: hub.challenge
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Returns hub.challenge if token matches
 *   post:
 *     summary: Receive leads from Meta (Facebook/Instagram Lead Ads)
 *     tags: [Leads]
 *     responses:
 *       200:
 *         description: Lead received
 */
router.get('/webhooks/meta', metaWebhook);
router.post('/webhooks/meta', metaWebhook);

/**
 * @swagger
 * /api/v1/leads/webhooks/google:
 *   post:
 *     summary: Receive leads from Google Ads Lead Form
 *     tags: [Leads]
 *     responses:
 *       200:
 *         description: Lead received
 */
router.post('/webhooks/google', googleWebhook);

/**
 * @swagger
 * /api/v1/leads/assign-project-property:
 *   post:
 *     summary: Assign project and property to a lead and mark as accepted
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeadAssignment'
 *     responses:
 *       200:
 *         description: Lead updated
 *       400:
 *         description: Missing or invalid parameters
 *       404:
 *         description: Lead not found
 */
router.post('/assign-project-property', auth, assignProjectAndProperty);
/**
 * @swagger
 * /api/v1/leads/all-company:
 *   get:
 *     summary: Get all leads across companies (paginated, filterable by status)
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - new
 *             - contacted
 *             - site_visit
 *             - accepted
 *             - not accepted
 *             - paid
 *             - unpaid
 *             - booking_done
 *             - document_uploaded
 *             - document_not_uploaded
 *             - dropped
 *         description: Filter by lead status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of all leads across companies
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/all-company', auth, authorize('admin', 'subadmin-lms'), getAllCompanyLeads);

module.exports = router;

const express = require('express');
const router = express.Router();
const punchController = require('../controllers/punchController');
const { auth } = require('../middlewares/auth');
const { uploadImageIn, uploadImageOut } = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: Punch
 *   description: Salesperson attendance (punch in/out) management
 */

// Apply auth middleware to all routes in this router
router.use(auth);

/**
 * @swagger
 * /api/v1/punch/projects:
 *   get:
 *     summary: Get all projects for punch in/out
 *     tags: [Punch]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *       401:
 *         description: Unauthorized
 */
router.get('/projects', punchController.getProjectForPunch);

/**
 * @swagger
 * /api/v1/punch/punch-in:
 *   post:
 *     summary: Punch in for the day (with optional photo)
 *     tags: [Punch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - project
 *               - leadId
 *               - property
 *             properties:
 *               project:
 *                 type: string
 *                 description: Project ID to punch in for
 *               leadId:
 *                 type: string
 *                 description: Lead ID to punch in for
 *               property:
 *                 type: string
 *                 description: Property ID to punch in for
 *               lat:
 *                 type: number
 *                 description: Latitude from device GPS
 *               lng:
 *                 type: number
 *                 description: Longitude from device GPS
 *               imageIn:
 *                 type: string
 *                 format: binary
 *                 description: Optional photo for punch in
 *     responses:
 *       200:
 *         description: Punch in recorded
 *       400:
 *         description: Bad request (e.g., missing fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/punch-in', uploadImageIn, punchController.punchIn);

/**
 * @swagger
 * /api/v1/punch/punch-out:
 *   put:
 *     summary: Punch out for the day (with optional photo)
 *     tags: [Punch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - project
 *               - leadId
 *               - property
 *             properties:
 *               project:
 *                 type: string
 *                 description: Project ID to punch out from
 *               leadId:
 *                 type: string
 *                 description: Lead ID to punch out from
 *               property:
 *                 type: string
 *                 description: Property ID to punch out from
 *               lat:
 *                 type: number
 *                 description: Latitude from device GPS
 *               lng:
 *                 type: number
 *                 description: Longitude from device GPS
 *               imageOut:
 *                 type: string
 *                 format: binary
 *                 description: Optional photo for punch out
 *     responses:
 *       200:
 *         description: Punch out recorded
 *       400:
 *         description: Bad request (e.g., missing fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/punch-out', uploadImageOut, punchController.punchOut);

/**
 * @swagger
 * /api/v1/punch/today:
 *   get:
 *     summary: Get today's punch record for the logged-in salesperson
 *     tags: [Punch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID to get today's punch for
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         required: true
 *         description: Lead ID to get today's punch for
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         required: true
 *         description: Property ID to get today's punch for
 *     responses:
 *       200:
 *         description: Today's punch data
 *       400:
 *         description: Bad request (e.g., missing query parameters)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/today', punchController.getTodayPunch);

/**
 * @swagger
 * /api/v1/punch/all:
 *   get:
 *     summary: Get all punch records for the logged-in salesperson
 *     tags: [Punch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         required: false
 *         description: Project ID to get all punches for
 *     responses:
 *       200:
 *         description: All punch records
 *       400:
 *         description: Bad request (e.g., missing query parameters)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/all', punchController.getAllPunches);
/**
 * @swagger
 * /api/v1/punch/property-for-punch:
 *   get:
 *     summary: Get properties for punch in/out
 *     tags: [Punch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID to get properties for
 *     responses:
 *       200:
 *         description: List of properties
 *       400:
 *         description: Bad request (e.g., missing query parameters)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/property-for-punch', punchController.getPropertyForPunch);
/**
 * @swagger
 * /api/v1/punch/salesperson-punches:
 *   get:
 *     summary: Get all punch records for the logged-in salesperson
 *     tags: [Punch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: All punch records
 *       400:
 *         description: Bad request (e.g., missing query parameters)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/salesperson-punches', punchController.getSalesPersonPunches);
 /**
 * @swagger
 * /api/v1/punch/total-site-visits:
 *   get:
 *     summary: Get total site visits (admin/subadmin only)
 *     description: Fetch paginated site visit records with optional date range and lead filter. Accessible only by admin or subadmin.
 *     tags: [Punch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter visits starting from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter visits up to this date (YYYY-MM-DD)
 *       - in: query
 *         name: leadId
 *         schema:
 *           type: string
 *         description: Filter visits by a specific lead ID
 *     responses:
 *       200:
 *         description: Paginated list of site visits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 totalVisits:
 *                   type: integer
 *                   description: Total number of site visits matching filter
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
 *                       punchIn:
 *                         type: string
 *                         format: date-time
 *                       punchOut:
 *                         type: string
 *                         format: date-time
 *                       salespersonId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                       project:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           projectName:
 *                             type: string
 *                       propertyId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           propertyName:
 *                             type: string
 *                           propertyAddress:
 *                             type: string
 *                       leadId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           email:
 *                             type: string
 *       403:
 *         description: Access denied (non-admin)
 *       500:
 *         description: Internal server error
 */
router.get('/total-site-visits', punchController.getTotalSiteVisits);


module.exports = router;

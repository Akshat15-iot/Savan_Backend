const express = require('express');
const { 
  createCompany, 
  getCompanies, 
  getCompany, 
  updateCompany, 
  deleteCompany,
  getFacebookPages
} = require('../controllers/companyController');
const { auth } = require('../middlewares/auth');
const multer = require('multer');
const upload = multer();

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: API for managing companies
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - companyName
 *         - companyType
 *         - city
 *         - contactNumber
 *         - emailId
 *         - ownerDirectorName
 *         - gstNumber
 *         - panNumber
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the company
 *         companyName:
 *           type: string
 *           description: Name of the company
 *         companyType:
 *           type: string
 *           enum: [Residential, Commercial, Industrial, Other]
 *           description: Type of the company
 *         city:
 *           type: string
 *           description: City where the company is located
 *         contactNumber:
 *           type: string
 *           description: Contact number of the company
 *         emailId:
 *           type: string
 *           format: email
 *           description: Email address of the company
 *         ownerDirectorName:
 *           type: string
 *           description: Name of the owner or director
 *         gstNumber:
 *           type: string
 *           description: GST number of the company
 *         panNumber:
 *           type: string
 *           description: PAN number of the company
 *         pageId:
 *           type: string
 *           description: Page ID of the company
 *         createdBy:
 *           type: string
 *           description: ID of the user who created the company
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64dcd123456789abcdef123"
 *         companyName: "Saajra Realty"
 *         companyType: "Commercial"
 *         city: "Mumbai"
 *         contactNumber: "9876543210"
 *         emailId: "info@saajrarealty.com"
 *         ownerDirectorName: "John Doe"
 *         gstNumber: "22AAAAA0000A1Z5"
 *         panNumber: "AAAAA0000A"
 *         pageId: ""
 *         createdBy: "64dbcd0987654321abcd1234"
 *         createdAt: "2025-08-29T12:34:56.789Z"
 *         updatedAt: "2025-08-29T12:34:56.789Z"
 */

/**
 * @swagger
 * /api/v1/companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company created successfully"
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Missing or invalid fields
 *       403:
 *         description: Forbidden - User role not authorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, createCompany);

/**
 * @swagger
 * /api/v1/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 companies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *       403:
 *         description: Forbidden - User role not authorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, getCompanies);

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   get:
 *     summary: Get a single company by ID
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found
 *       403:
 *         description: Forbidden - User role not authorized
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, getCompany);

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   put:
 *     summary: Update a company by ID
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company updated successfully"
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found
 *       403:
 *         description: Forbidden - User role not authorized
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, updateCompany);

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   delete:
 *     summary: Delete a company by ID
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Company deleted successfully"
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       404:
 *         description: Company not found
 *       403:
 *         description: Forbidden - User role not authorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, deleteCompany);

/**
 * 
 */
router.get("/meta/facebook-pages", auth, getFacebookPages);

// Accept POST as well, so token can be sent in JSON body or multipart/form-data
router.post('/meta/facebook-pages', auth, upload.none(), getFacebookPages);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  getProjectsByCompany,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { auth } = require('../middlewares/auth'); // JWT Auth Middleware
const { uploadProjectFile } = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management APIs
 */

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all projects (Public)
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: minBudget
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxBudget
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', getProjects);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get a single project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b7e82e9d1e2f3a4b5c6789
 *         description: Project ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/:id', auth, getProject);

/**
 * @swagger
 * /api/v1/projects/company/{companyId}:
 *   get:
 *     summary: Get all projects for a specific company
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b7e82e9d1e2f3a4b5c6789
 *     responses:
 *       200:
 *         description: List of projects for the given company
 */
router.get('/company/:companyId', auth, getProjectsByCompany);

/**
 * @swagger
 * /api/v1/projects/company/{companyId}:
 *   post:
 *     summary: Create a new project for a company
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b7e82e9d1e2f3a4b5c6789
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - budget
 *               - city
 *               - category
 *               - startDate
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "Luxury Apartments"
 *               budget:
 *                 type: number
 *                 example: 5000000
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *               category:
 *                 type: string
 *                 enum: ['Residential', 'Commercial', 'Industrial', 'Other']
 *                 example: "Residential"
 *               subType:
 *                 type: string
 *                 example: "Apartment"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request - Missing or invalid fields
 *       403:
 *         description: Forbidden - Only admin can create projects
 */
router.post('/company/:companyId', auth, uploadProjectFile, createProject);
/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   put:
 *     summary: Update a project for a company
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b7e82e9d1e2f3a4b5c6789
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - budget
 *               - city
 *               - category
 *               - startDate
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "Luxury Apartments"
 *               budget:
 *                 type: number
 *                 example: 5000000
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *               category:
 *                 type: string
 *                 enum: ['Residential', 'Commercial', 'Industrial', 'Other']
 *                 example: "Residential"
 *               subType:
 *                 type: string
 *                 example: "Apartment"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request - Missing or invalid fields
 *       403:
 *         description: Forbidden - Only admin can create projects
 */
router.put('/:projectId', auth, uploadProjectFile, updateProject);
/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   delete:
 *     summary: Delete a project for a company
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b7e82e9d1e2f3a4b5c6789
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request - Missing or invalid fields
 *       403:
 *         description: Forbidden - Only admin can create projects
 */
router.delete('/:projectId', auth, deleteProject);


module.exports = router;

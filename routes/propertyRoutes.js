const express = require("express");
const router = express.Router();
const {
  createProperty,
  getPropertiesByProject,
  getProperty,
  getAllProperties,
  updateProperty,
  deleteProperty,
} = require("../controllers/propertyController");
const { auth } = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/properties/"); // folder for property images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: APIs for managing properties within projects (Admin restrictions apply)
 */

/**
 * @swagger
 * /api/v1/properties/project/{projectId}:
 *   post:
 *     summary: Create a new property for a project (Admin Only)
 *     tags: [Properties]
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
 *               - propertyName
 *               - budget
 *               - location
 *               - category
 *               - propertyArea
 *             properties:
 *               propertyName:
 *                 type: string
 *                 example: "ABC Apartments"
 *               budget:
 *                 type: number
 *                 example: 600000
 *               location:
 *                 type: string
 *                 example: "Sector 45, Noida"
 *               category:
 *                 type: string
 *                 enum: [Residential, Commercial, Industrial, Other]
 *                 example: "Residential"
 *               propertyArea:
 *                 type: string
 *                 example: "1500 sqft"
 *               measurementUnit:
 *                 type: string
 *                 enum: [sqft, sqm, acre, hectare]
 *                 example: "sqft"
 *               image:
 *                 type: file
 *                 example: "property-image.jpg"
 *     responses:
 *       201:
 *         description: Property created successfully
 *       403:
 *         description: Forbidden - Only admin can create properties
 */
// Public routes (no authentication required)
router.get('/all', getAllProperties);
router.get("/:id", getProperty);

// Protected routes (require authentication)
router.post("/project/:projectId", auth,upload.single("image"), createProperty);
router.get("/project/:projectId", auth, getPropertiesByProject);
router.put("/:id", auth,upload.single("image"), updateProperty);
router.delete("/:id", auth, deleteProperty);

/**
 * @swagger
 * /api/v1/properties/all:
 *   get:
 *     summary: Get all properties across all projects (Public)
 *     description: |
 *       Returns a list of all active properties with pagination and filtering.  
 *       - Pagination: Use `page` and `limit` query params.  
 *       - Filter by category: Use `category` query param.  
 *     tags: [Properties]
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
 *         description: Number of results per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Residential, Commercial, Industrial, Agricultural]
 *         description: Filter properties by category
 *     responses:
 *       200:
 *         description: List of active properties with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of matching properties
 *                 page:
 *                   type: integer
 *                   description: Current page
 *                 limit:
 *                   type: integer
 *                   description: Number of results per page
 *                 count:
 *                   type: integer
 *                   description: Number of properties in current response
 *                 properties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *       500:
 *         description: Server error
 */
router.get('/all', getAllProperties);

/**
 * @swagger
 * /api/v1/properties/{propertyId}:
 *   get:
 *     summary: Get details of a single property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 */
router.get("/:id", auth, getProperty);

/**
 * @swagger
 * /api/v1/properties/{propertyId}:
 *   put:
 *     summary: Update a property (Admin Only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       403:
 *         description: Forbidden - Only admin can update properties
 *       404:
 *         description: Property not found
 */
router.put("/:id", auth, updateProperty);

/**
 * @swagger
 * /api/v1/properties/{propertyId}:
 *   delete:
 *     summary: Delete a property (Admin Only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       403:
 *         description: Forbidden - Only admin can delete properties
 *       404:
 *         description: Property not found
 */
router.delete("/:id", auth, deleteProperty);

module.exports = router;

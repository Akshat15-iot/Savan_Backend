const express = require("express");
const router = express.Router();
const {
  createSite,
  getSiteById,
  getSites,
  updateSite,
  deleteSite,
} = require("../controllers/siteController");
const { auth } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Sites
 *   description: Site management APIs
 */

/**
 * @swagger
 * /api/v1/sites:
 *   post:
 *     summary: Create a new site
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - siteName
 *               - location
 *               - startDate
 *             properties:
 *               siteName:
 *                 type: string
 *                 example: "Delhi Metro Project"
 *               location:
 *                 type: string
 *                 example: "Delhi"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-01"
 *     responses:
 *       201:
 *         description: Site created successfully
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Forbidden - no permission
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: Get list of sites with pagination and filter by location
 *     tags: [Sites]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           example: Delhi
 *     responses:
 *       200:
 *         description: List of sites
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/sites/{id}:
 *   put:
 *     summary: Update an existing site
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteName:
 *                 type: string
 *                 example: "Updated Metro Project"
 *               location:
 *                 type: string
 *                 example: "Noida"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-10-01"
 *     responses:
 *       200:
 *         description: Site updated successfully
 *       400:
 *         description: Invalid data
 *       403:
 *         description: Forbidden - no permission
 *       404:
 *         description: Site not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a site
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site deleted successfully
 *       403:
 *         description: Forbidden - no permission
 *       404:
 *         description: Site not found
 *       500:
 *         description: Server error
 */

// Create site (Admin or SubAdmin with permission)
router.post("/", auth, createSite);

// Get all sites (with pagination and location filter)
router.get("/", auth, getSites);

// Get single site by ID
router.get("/:id", auth, getSiteById);

// Update site
router.put("/:id", auth, updateSite);

// Delete site
router.delete("/:id", auth, deleteSite);

module.exports = router;

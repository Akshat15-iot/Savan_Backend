const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/upload');
const { 
  login, 
  clientLogin,
  register, 
  getMe, 
  updateProfile,
  getSalespersons,
  updatePassword
} = require('../controllers/authController');
const { auth } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and user registration
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login as any user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/client-login:
 *   post:
 *     summary: Login as a client (non-admin)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       400:
 *         description: Invalid credentials
 *       403:
 *         description: Admin roles not allowed
 */
router.post('/client-login', clientLogin);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user (admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [salesperson, user, project_manager, lead_manager, account_manager, sales_manager, site_manager]
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               designation:
 *                 type: string
 *               location:
 *                 type: string
 *               employeeId:   # ✅ fixed lowercase
 *                 type: string
 *               companyId:
 *                 type: string
 *                 description: MongoDB ObjectId of company (required for salesperson)
 *               projects:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Project IDs (optional for salesperson)
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing required fields or invalid role
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/register',
  auth,
  upload.single('profilePhoto'),
  (req, res, next) => {
    if (!['salesperson', 'user'].includes(req.body.role)) {
      return res.status(400).json({ message: 'Role must be salesperson or user' });
    }
    register(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current logged-in user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', auth, getMe);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', auth, updateProfile);

/**
 * @swagger
 * /api/v1/auth/salespersons:
 *   get:
 *     summary: Get salespersons (filter by companyId, projectId optional)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         required: true
 *         description: Company ID to filter salespersons
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: (Optional) Project ID to filter salespersons
 *     responses:
 *       200:
 *         description: List of salespersons
 *       404:
 *         description: No salespersons found
 */
router.get('/salespersons', auth, getSalespersons);

/**
 * @swagger
 * /api/v1/auth/update-password:
 *   put:
 *     summary: Update user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or current password is incorrect
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.put('/update-password', auth, updatePassword);

module.exports = router;

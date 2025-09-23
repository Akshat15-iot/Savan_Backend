const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  getOwnProfile,
  updateOwnProfile
} = require('../controllers/userController');
const { auth, authorize } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management and profile endpoints
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get your own user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', auth, getOwnProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update your own user profile (supports profile photo upload)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               designation:
 *                 type: string
 *               location:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo image file
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/profile', auth, upload.single('profilePhoto'), updateOwnProfile);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter users by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter users by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Users per page
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', auth, authorize('admin'), getUsers);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/stats', auth, authorize('admin'), getUserStats);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get a user by ID (admin or self)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', auth, getUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update a user by ID (admin or self, supports profile photo upload)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.put('/:id', auth, upload.single('profilePhoto'), updateUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Deactivate a user (admin only)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
 *       404:
 *         description: User not found
 */
router.delete('/:id', auth, authorize('admin'), deleteUser);

module.exports = router;

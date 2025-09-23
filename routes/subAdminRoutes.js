const express = require('express');
const router = express.Router();
const {
  getSubAdmins,
  getSubAdmin,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  updateSubAdminPermissions
} = require('../controllers/subAdminController');
const { auth, authorize } = require('../middlewares/auth');

// All routes require authentication and admin role
router.use(auth);
router.use(authorize('admin'));

// @route   GET /api/v1/subadmins
// @desc    Get all subadmins
// @access  Private (Admin only)
router.get('/', getSubAdmins);

// @route   GET /api/v1/subadmins/:id
// @desc    Get single subadmin
// @access  Private (Admin only)
router.get('/:id', getSubAdmin);

// @route   POST /api/v1/subadmins
// @desc    Create new subadmin
// @access  Private (Admin only)
router.post('/', createSubAdmin);

// @route   PUT /api/v1/subadmins/:id
// @desc    Update subadmin
// @access  Private (Admin only)
router.put('/:id', updateSubAdmin);

// @route   DELETE /api/v1/subadmins/:id
// @desc    Delete subadmin
// @access  Private (Admin only)
router.delete('/:id', deleteSubAdmin);

// @route   PUT /api/v1/subadmins/:id/permissions
// @desc    Update subadmin permissions
// @access  Private (Admin only)
router.put('/:id/permissions', updateSubAdminPermissions);

module.exports = router;

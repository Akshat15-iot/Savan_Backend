const express = require('express');
const router = express.Router();
const { getUserPermissions } = require('../middlewares/permissions');
const { auth } = require('../middlewares/auth');

// @route   GET /api/v1/permissions/me
// @desc    Get current user permissions
// @access  Private
router.get('/me', auth, getUserPermissions);

module.exports = router;

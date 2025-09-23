const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all subadmins
// @route   GET /api/v1/subadmins
// @access  Private (Admin only)
const getSubAdmins = async (req, res) => {
  try {
    const subadmins = await User.find({ 
      role: { $in: ['subadmin', 'project_manager', 'lead_manager', 'account_manager', 'sales_manager', 'site_manager'] }
    }).select('-password');

    res.json({
      success: true,
      count: subadmins.length,
      data: subadmins
    });
  } catch (error) {
    console.error('Get subadmins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single subadmin
// @route   GET /api/v1/subadmins/:id
// @access  Private (Admin only)
const getSubAdmin = async (req, res) => {
  try {
    const subadmin = await User.findById(req.params.id).select('-password');

    if (!subadmin) {
      return res.status(404).json({ message: 'SubAdmin not found' });
    }

    res.json({
      success: true,
      data: subadmin
    });
  } catch (error) {
    console.error('Get subadmin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create subadmin
// @route   POST /api/v1/subadmins
// @access  Private (Admin only)
const createSubAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate role
    const allowedRoles = ['subadmin', 'project_manager', 'lead_manager', 'account_manager', 'sales_manager', 'site_manager'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Set default permissions based on role if not provided
    let userPermissions = permissions || getDefaultPermissions(role);

    // Create user
    const user = new User({
      name,
      email,
      password,
      phone,
      role,
      permissions: userPermissions,
      isActive: true
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'SubAdmin created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create subadmin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update subadmin
// @route   PUT /api/v1/subadmins/:id
// @access  Private (Admin only)
const updateSubAdmin = async (req, res) => {
  try {
    const { name, email, phone, role, permissions, isActive, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'SubAdmin not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    if (typeof isActive !== 'undefined') user.isActive = isActive;
    
    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'SubAdmin updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update subadmin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete subadmin
// @route   DELETE /api/v1/subadmins/:id
// @access  Private (Admin only)
const deleteSubAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'SubAdmin not found' });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'SubAdmin deleted successfully'
    });
  } catch (error) {
    console.error('Delete subadmin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update subadmin permissions
// @route   PUT /api/v1/subadmins/:id/permissions
// @access  Private (Admin only)
const updateSubAdminPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'SubAdmin not found' });
    }

    // Update permissions
    user.permissions = { ...user.permissions, ...permissions };
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get default permissions based on role
function getDefaultPermissions(role) {
  const defaultPermissions = {
    leads: { view: false, manage: false },
    projects: { view: false, manage: false },
    payments: { view: false, manage: false },
    reports: { view: false, manage: false },
    users: { view: false, manage: false },
    companies: { view: false, manage: false },
    properties: { view: false, manage: false },
    sites: { view: false, manage: false },
    inventory: { view: false, manage: false },
    dashboard: { view: false }
  };

  switch (role) {
    case 'subadmin':
      return {
        leads: { view: true, manage: true },
        projects: { view: true, manage: true },
        payments: { view: true, manage: true },
        reports: { view: true, manage: false },
        users: { view: true, manage: false },
        companies: { view: true, manage: true },
        properties: { view: true, manage: true },
        sites: { view: true, manage: true },
        inventory: { view: true, manage: true },
        dashboard: { view: true }
      };
    case 'project_manager':
      return {
        ...defaultPermissions,
        projects: { view: true, manage: true },
        properties: { view: true, manage: true },
        reports: { view: true, manage: false },
        dashboard: { view: true }
      };
    case 'lead_manager':
      return {
        ...defaultPermissions,
        leads: { view: true, manage: true },
        reports: { view: true, manage: false },
        dashboard: { view: true }
      };
    case 'account_manager':
      return {
        ...defaultPermissions,
        payments: { view: true, manage: true },
        reports: { view: true, manage: false },
        dashboard: { view: true }
      };
    case 'sales_manager':
      return {
        ...defaultPermissions,
        leads: { view: true, manage: true },
        users: { view: true, manage: false },
        reports: { view: true, manage: false },
        dashboard: { view: true }
      };
    case 'site_manager':
      return {
        ...defaultPermissions,
        sites: { view: true, manage: true },
        inventory: { view: true, manage: true },
        reports: { view: true, manage: false },
        dashboard: { view: true }
      };
    default:
      return defaultPermissions;
  }
}

module.exports = {
  getSubAdmins,
  getSubAdmin,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  updateSubAdminPermissions
};

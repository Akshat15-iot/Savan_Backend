const User = require('../models/User');
const Company = require('../models/Company');
const Project = require('../models/Project');
const { generateToken } = require('../utils/tokenGenerator');

// @desc    Register user (admin only)
// @route   POST /api/v1/auth/register
// @access  Private
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      designation,
      location,
      EmployeeId,
      companyId,
      projects // ✅ array of projectIds (optional)
    } = req.body;
     // ✅ Allowed roles
     const allowedRoles = [
      'salesperson',
      'user',
      'project_manager',
      'lead_manager',
      'account_manager',
      'sales_manager',
      'site_manager'
    ];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }


    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // ✅ Assign default permissions based on role
    let defaultPermissions = {};
    switch (role) {
      case 'project_manager':
        defaultPermissions = { projects: ['view', 'manage'] };
        break;
      case 'site_manager':
        defaultPermissions = { site: ['view', 'manage'] };
        break;
      case 'lead_manager':          
        defaultPermissions = { leads: ['view', 'manage'] };
        break;
      case 'account_manager':
        defaultPermissions = { accounts: ['view', 'manage'] };
        break;
      case 'sales_manager':
        defaultPermissions = { sales: ['view', 'manage'] };
        break;
      default:
        defaultPermissions = {};
    }

    // ✅ Validate company for salesperson
    if (role === 'salesperson') {
      if (!companyId) {
        return res.status(400).json({ message: 'Salesperson must belong to a company' });
      }

      const companyExists = await Company.findById(companyId);
      if (!companyExists) return res.status(404).json({ message: 'Invalid companyId' });

      // ✅ If projects are provided, validate them
      if (projects && projects.length > 0) {
        const projectExists = await Project.find({ _id: { $in: projects }, companyId });
        if (!projectExists.length) {
          return res.status(404).json({ message: 'Invalid projectIds' });
        }
      }
    }

    let profilePhoto = '';
    if (req.file) {
      profilePhoto = `/uploads/${req.file.filename}`;
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'salesperson',
      phone,
      address,
      designation,
      location,
      profilePhoto,
      EmployeeId,
      companyId,
      projects, // ✅ assign array instead of single project
      permissions: defaultPermissions,
    });

    await user.save();

    // ✅ Populate response
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('companyId', 'name companyName')
      .populate('projects', 'projectName');

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: populatedUser
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    user.deviceToken = req.body.deviceToken;
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(400).json({ message: 'Account is deactivated' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('companyId', 'name companyName')
      .populate('projects', 'projectName');

    res.json({
      success: true,
      token,
      deviceToken: user.deviceToken,
      user: populatedUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login client (non-admin roles)
// @route   POST /api/v1/auth/client-login
// @access  Public
const clientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (['admin', 'subadmin-lms', 'subadmin-accountant'].includes(user.role)) {
      return res.status(403).json({ message: 'Please use the admin portal to login' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('companyId', 'name companyName')
      .populate('projects', 'projectName');

    res.json({
      success: true,
      token,
      user: populatedUser
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('companyId', 'name companyName')
      .populate('projects', 'projectName');
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.phone = phone || user.phone;

    await user.save();

    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('companyId', 'name companyName')
      .populate('projects', 'projectName');

    res.json({
      success: true,
      user: populatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Fetch salespersons by company (project optional)
// @route   GET /api/v1/auth/salespersons?companyId=xxx&projectId=yyy
// @access  Private
const getSalespersons = async (req, res) => {
  try {

     // Convert page and limit to numbers
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 10;
     const skip = (page - 1) * limit;
    let { companyId, projectId } = req.query;

    // Base filter: only role = salesperson
    const filter = { role: 'salesperson' };

    // ✅ If companyId is not "all", then apply filter
    if (companyId && companyId !== "all") {
      filter.companyId = companyId;
    }

    // ✅ If projectId provided, filter by that project
    if (projectId && projectId !== "all") {
      filter.projects = projectId;
    }

    const salespersons = await User.find(filter)
      .select('-password')
      .populate('companyId', 'name companyName')
      .populate('projects', 'projectName')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      salespersons,
      count: salespersons.length,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching salespersons:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Get user from the token (already verified by auth middleware)
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password (the pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      user
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  clientLogin,
  getMe,
  updateProfile,
  getSalespersons,
  updatePassword
};

const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10, name } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (name) query.name = { $regex: new RegExp(name, 'i') }; // Case-insensitive search

    const users = await User.find(query)
      .select('-password')
      .populate('companyId', 'name')         // 
      .populate('projects', 'projectName')  // 
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get self profile
// @route   GET /api/users/profile
// @access  Private
const getOwnProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('companyId', 'name')
      .populate('projects', 'projectName');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get own profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update self profile
// @route   PUT /api/users/profile
// @access  Private
const updateOwnProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, address, designation, location } = req.body;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.designation = designation || user.designation;
    user.location = location || user.location;

    if (req.file) {
      user.profilePhoto = `/uploads/${req.file.filename}`;
    }

    await user.save();

    const response = await User.findById(user._id)
      .select('-password')
      .populate('companyId', 'name')
      .populate('projects', 'projectName');

    res.json({ success: true, user: response });
  } catch (error) {
    console.error('Update own profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }

};

// @desc    Get single user (Admin or Self)
// @route   GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('companyId', 'name')
      .populate('projects', 'projectName');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user (Admin or Self)
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // Only admin or the user themselves can update
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (password) user.password = password;
    Object.keys(updateData).forEach(key => user[key] = updateData[key]);
    if (req.file) user.profilePhoto = `/uploads/${req.file.filename}`;

    await user.save();

    const response = await User.findById(user._id)
      .select('-password')
      .populate('companyId', 'name')
      .populate('projects', 'projectName');

    res.json({ success: true, user: response });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
      .select('-password')
      .populate('companyId', 'name')
      .populate('projects', 'projectName');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats, 
  getOwnProfile,
  updateOwnProfile
};

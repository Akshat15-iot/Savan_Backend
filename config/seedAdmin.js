const User = require('../models/User');

async function seedAdmin() {
  const defaultUsers = [
    {
      name: 'Admin',
      email: 'admin@admin.com',
      password: 'admin123',
      role: 'admin'
    },
    
  ];

  for (const userData of defaultUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      const user = new User(userData);
      await user.save();
      console.log(`Default ${userData.role} user created:`, userData.email);
    } else {
      console.log(`Default ${userData.role} user already exists:`, userData.email);
    }
  }
}

module.exports = seedAdmin; 
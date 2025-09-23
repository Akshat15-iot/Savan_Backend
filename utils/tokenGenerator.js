const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 
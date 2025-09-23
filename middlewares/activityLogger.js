// middlewares/activityLogger.js
const ActivityLog = require("../models/ActivityLog");

const activityLogger = async (req, res, next) => {
  try {
    console.log('Activity logger middleware loaded');

    if (req.user) {
      await ActivityLog.create({
        userId: req.user._id, // ensure this is an ObjectId in your Auth middleware
        role: req.user.role?.toLowerCase(), // normalize role
        method: req.method,
        endpoint: req.originalUrl,
        action: `${req.method} ${req.originalUrl}`,
        description: `User ${req.user.fullName} (${req.user.role}) performed ${req.method} on ${req.originalUrl}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
    }
  } catch (err) {
    console.error("Activity log error:", err.message);
  }

  next();
};

module.exports = activityLogger;

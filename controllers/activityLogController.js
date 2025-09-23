// controllers/activitylogController.js
const ActivityLog = require("../models/ActivityLog");
const mongoose = require("mongoose");


const getActivityLogs = async (req, res) => {
 try {
   console.log('User making request:', {
     userId: req.user._id,
     role: req.user.role
   });

   // Pagination parameters (default: page=1, limit=10)
   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 10;
   const skip = (page - 1) * limit;

   let query = {};
   
   // normalize role comparison
   const role = req.user.role?.toLowerCase();

   if (role === "salesperson") {
     // ensure we use ObjectId
     query.userId = new mongoose.Types.ObjectId(req.user._id);
   }

   console.log('Query being used:', query);

   // Get total count of logs for pagination
   const totalLogs = await ActivityLog.countDocuments(query);
   const totalPages = Math.ceil(totalLogs / limit);

   const logs = await ActivityLog.find(query)
     .populate("userId", "fullName email role")
     .sort({ createdAt: -1 })
     .skip(skip)
     .limit(limit);

   console.log('Found logs count:', logs.length);
   console.log('Sample log (if any):', logs[0] || 'No logs found');

   return res.json({ 
     success: true, 
     data: logs,
     pagination: {
       total: totalLogs,
       page,
       limit,
       totalPages,
       hasNextPage: page < totalPages,
       hasPrevPage: page > 1
     }
   });
 } catch (err) {
   console.error("Error in getActivityLogs:", err);
   return res.status(500).json({
     success: false,
     message: "Server error"
   });
 }
};


const getUserActivityLogs = async (req, res) => {
 try {
   const userId = req.params.userId || req.query.userId;
   if (!userId) {
     return res.status(400).json({ success: false, message: 'userId is required' });
   }
   const logs = await ActivityLog.find({ userId }).populate("userId", "fullName email role").sort({ createdAt: -1 });
   return res.json({ success: true, logs });
 } catch (err) {
   console.error("Error in getUserActivityLogs:", err);
   return res.status(500).json({ success: false, message: "Server error" });
 }
};


module.exports = {
 getActivityLogs,
 getUserActivityLogs
};



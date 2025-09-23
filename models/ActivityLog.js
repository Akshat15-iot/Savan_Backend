// models/ActivityLog.js
const mongoose = require("mongoose");


const activityLogSchema = new mongoose.Schema({
 userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
 role: { type: String, enum: ["admin", "subadmin", "salesperson", "user"], required: true },
 method: { type: String },
 endpoint: { type: String },
 action: { type: String },
 description: { type: String },
 ipAddress: { type: String },
 userAgent: { type: String },
 createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("ActivityLog", activityLogSchema);

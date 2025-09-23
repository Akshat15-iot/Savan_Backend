const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyType: {
    type: String,
    enum: ['Residential', 'Commercial', 'Industrial', 'Other'],
    required: true
  },
  city: { type: String, required: true },
  contactNumber: { type: String, required: true },
  emailId: { type: String, required: true },
  ownerDirectorName: { type: String, required: true },
  gstNumber: { type: String, required: true },
  panNumber: { type: String, required: true },

  // 🔹 New field for storing connected Facebook Page
  pageId: { type: String, required: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);

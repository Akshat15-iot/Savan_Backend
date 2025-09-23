const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company', // make sure you have a Company model
    required: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  budget: {
    type: Number,
    required: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Residential', 'Commercial', 'Industrial', 'Agricultural','Other']
  },
  subType: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  images: [
    {
      url: { type: String },
      caption: { type: String }
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);

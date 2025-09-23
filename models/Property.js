const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  propertyName: { type: String, required: true },
  budget: { type: Number, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['Residential', 'Commercial', 'Industrial', 'Agricultural'], required: true },
  propertyArea: { type: String, required: true },
  measurementUnit: { type: String, enum: ['sqft', 'sqm', 'acre', 'hectare'], required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image: { type: String }, // <-- NEW field for property image
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);

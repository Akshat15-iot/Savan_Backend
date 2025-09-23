const mongoose = require('mongoose');

const PunchSchema = new mongoose.Schema({
  salespersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },

  status: { type: String, enum: ['Pending','Accepted','Rejected'], default: 'Pending' },
  date: { type: String, required: true }, // YYYY-MM-DD

  punchIn: String,
  dateTime_in: Date,
  latIn: Number,
  lngIn: Number,
  addressIn: String,

  punchOut: String,
  dateTime_out: Date,
  latOut: Number,
  lngOut: Number,
  addressOut: String,

  duration: String,
  imageIn: { type: String },
  imageOut: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Punch', PunchSchema);

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  docType: {
    type: String,
    enum: ['kyc', 'loan', 'payment', 'sales'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', documentSchema);

const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  salespersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  leadName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'Call'
  },
  reminderAt: {
    type: Date, // ⏰ single field for both date + time
    required: true
  },
  notificationType: {
    type: String,
    enum: ['Push'],
    default: 'Push'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reminder', reminderSchema);

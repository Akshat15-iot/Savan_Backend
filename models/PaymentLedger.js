const mongoose = require('mongoose');

const paymentLedgerSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  tokenAmount: {
    type: Number,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  amount: {
    type: Number,
    required: false
  },
  paymentType: {
    type: String,
    enum: ['token', 'emi', 'full_payment'],
    required: true
  },
  installmentPlan: {
    type: String, // or Boolean if using true/false
    enum: ['Yes', 'No'],
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Cheque', 'Bank Transfer'], // extend as needed
    required: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentLedger', paymentLedgerSchema);


/*const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['booking_amount', 'down_payment', 'emi', 'full_payment', 'other'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'cheque', 'bank_transfer', 'card', 'upi', 'other'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
paymentSchema.index({ lead: 1, project: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema); */
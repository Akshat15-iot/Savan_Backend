const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    salesperson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    recording: {
      type: String,
      default: null
    },
    recordingUrl: {
      type: String,
      default: ""
    },
    duration: {
      type: Number,
      default: 0,
      min: 0
    },
    callDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['completed', 'missed', 'scheduled'],
      default: 'completed'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
CallSchema.index({ lead: 1 });
CallSchema.index({ salesperson: 1 });
CallSchema.index({ callDate: -1 });

module.exports = mongoose.model("Call", CallSchema);

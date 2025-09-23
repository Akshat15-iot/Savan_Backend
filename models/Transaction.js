const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["incoming", "outgoing"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    mode: {
      type: String,
      required: true,
    },
    wallet: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);

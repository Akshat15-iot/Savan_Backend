// models/Stock.js
const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    usedIn: {
      type: String,
      trim: true,
      required: true,
    },
    location: {
      type: String,
      trim: true,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["Ton", "quintal", "Pieces"], // exactly as requested
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stock", StockSchema);

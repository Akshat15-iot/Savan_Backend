// models/Item.js
const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    minQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["ton", "quintal", "pieces"],
      required: true,
    },
    carNo: {
      type: String,
      trim: true,
    },
    receivingPerson: {
      type: String,
      trim: true,
    },
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", ItemSchema);

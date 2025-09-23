const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Site", siteSchema);

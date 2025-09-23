// controllers/stockController.js
const Stock = require("../models/Stock");
const Item = require("../models/Item");
const mongoose = require("mongoose");

// OPTIONAL: same permission rule you used for sites/items
// admin OR subadmin with 'site-management' permission
function canManageStock(user) {
  return (
    user?.role === "admin" ||
    (user?.role === "subadmin" && user?.permissions?.includes("site-management"))
  );
}

/**
 * Create Stock
 * Body: { itemId, usedIn, location, quantity, unit, date }
 */
exports.createStock = async (req, res) => {
  try {
    // If you want to restrict: uncomment next 4 lines
    // if (!canManageStock(req.user)) {
    //   return res.status(403).json({ message: "Access denied." });
    // }

    const { itemId, usedIn, location, quantity, unit, date } = req.body;

    if (!itemId || !usedIn || !location || quantity == null || !unit) {
      return res.status(400).json({
        message:
          "itemId, usedIn, location, quantity and unit are required fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Referenced Item not found" });
    }

    const stock = await Stock.create({
      itemId,
      usedIn: String(usedIn).trim(),
      location: String(location).trim(),
      quantity: Number(quantity),
      unit,
      date: date ? new Date(date) : Date.now(),
    });

    res.status(201).json({ success: true, message: "Stock created", data: stock });
  } catch (err) {
    console.error("createStock error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get Stocks (list) with pagination & filters
 * Query: page=1&limit=10&itemId=&location=&from=&to=
 */
exports.getStocks = async (req, res) => {
  try {
    let { page = 1, limit = 10, itemId, location, from, to } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    if (itemId) {
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: "Invalid itemId" });
      }
      filter.itemId = itemId;
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      Stock.find(filter)
        .populate("itemId", "itemName unit")
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Stock.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getStocks error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get single Stock by ID
 */
exports.getStockById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid stock id" });
    }

    const stock = await Stock.findById(id).populate("itemId", "itemName unit");
    if (!stock) return res.status(404).json({ message: "Stock not found" });

    res.json({ success: true, data: stock });
  } catch (err) {
    console.error("getStockById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update Stock
 * Body: { usedIn, location, quantity, unit, date, itemId? }
 */
exports.updateStock = async (req, res) => {
  try {
    // If you want to restrict: uncomment next 4 lines
    // if (!canManageStock(req.user)) {
    //   return res.status(403).json({ message: "Access denied." });
    // }

    const { id } = req.params;
    const { itemId, usedIn, location, quantity, unit, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid stock id" });
    }

    const payload = {};
    if (itemId) {
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: "Invalid itemId" });
      }
      const item = await Item.findById(itemId);
      if (!item) return res.status(404).json({ message: "Referenced Item not found" });
      payload.itemId = itemId;
    }

    if (usedIn !== undefined) payload.usedIn = String(usedIn).trim();
    if (location !== undefined) payload.location = String(location).trim();
    if (quantity !== undefined) payload.quantity = Number(quantity);
    if (unit !== undefined) payload.unit = unit;
    if (date !== undefined) payload.date = new Date(date);

    const updated = await Stock.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: "Stock not found" });

    res.json({ success: true, message: "Stock updated", data: updated });
  } catch (err) {
    console.error("updateStock error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete Stock
 */
exports.deleteStock = async (req, res) => {
  try {
    // If you want to restrict: uncomment next 4 lines
    // if (!canManageStock(req.user)) {
    //   return res.status(403).json({ message: "Access denied." });
    // }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid stock id" });
    }

    const deleted = await Stock.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Stock not found" });

    res.json({ success: true, message: "Stock deleted" });
  } catch (err) {
    console.error("deleteStock error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

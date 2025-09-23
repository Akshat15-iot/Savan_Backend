// controllers/itemController.js
const Item = require("../models/Item");
const Site=require("../models/Site");
const mongoose = require("mongoose");

// Utility: check permissions
function canManageSite(user) {
  return (
    user.role === "admin" ||
    (user.role === "subadmin" && user.permissions?.includes("site-management"))
  );
}

// Create new item
exports.createItem = async (req, res) => {
  try {
    if (!canManageSite(req.user)) {
      return res.status(403).json({ message: "Access denied. No permission to manage site items." });
    }

    const { siteId, itemName, quantity, minQuantity, unit, carNo, receivingPerson } = req.body;

    // Validate required fields
    if (!siteId) {
      return res.status(400).json({ message: "Site ID is required" });
    }

    // Verify site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    const item = new Item({
      siteId: site._id,  // Ensure proper ObjectId
      itemName,
      quantity: Number(quantity),       // ✅ Force number
      minQuantity: Number(minQuantity),
      unit,
      carNo,
      receivingPerson,
    });

    await item.save();
    res.status(201).json({ message: "Item created successfully", item });
  } catch (error) {
    res.status(500).json({ message: "Error creating item", error: error.message });
  }
};

// Get all items with pagination & optional site filter
exports.getItems = async (req, res) => {
  try {
    const { siteId, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (siteId) {
      // Validate siteId format and add to filter
      if (!mongoose.Types.ObjectId.isValid(siteId)) {
        return res.status(400).json({ message: 'Invalid site ID format' });
      }
      filter.siteId = siteId;
    }

    let items = await Item.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("siteId", "siteName location")
      .lean();

    // Add status based on quantity and minQuantity
    items = items.map(item => {
      const quantity = Number(item.quantity);
      const minQuantity = Number(item.minQuantity);
      return {
        ...item,
        status: quantity <= 0 ? 'Out of Stock' : 
                quantity < minQuantity ? 'Low Stock' : 'Available'
      };
    });

    const total = await Item.countDocuments(filter);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      items,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching items", error: error.message });
  }
};

// Get single item
exports.getItemById = async (req, res) => {
  try {
    let item = await Item.findById(req.params.id).populate("siteId", "siteName").lean();
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Add status based on quantity and minQuantity
    const quantity = Number(item.quantity);
    const minQuantity = Number(item.minQuantity);
    item = {
      ...item,
      status: quantity <= 0 ? 'Out of Stock' : 
              quantity < minQuantity ? 'Low Stock' : 'Available'
    };

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Error fetching item", error: error.message });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    if (!canManageSite(req.user)) {
      return res.status(403).json({ message: "Access denied. No permission to update site items." });
    }

    const { itemName, quantity, minQuantity, unit, carNo, receivingPerson } = req.body;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { itemName,
        quantity: Number(quantity),
        minQuantity: Number(minQuantity),
        unit,
        carNo,
        receivingPerson,
        lastUpdate: Date.now() },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item updated successfully", item });
  } catch (error) {
    res.status(500).json({ message: "Error updating item", error: error.message });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    if (!canManageSite(req.user)) {
      return res.status(403).json({ message: "Access denied. No permission to delete site items." });
    }

    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error: error.message });
  }
};

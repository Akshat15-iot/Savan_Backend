// controllers/siteController.js
const Site = require("../models/Site");

// Utility: Check permissions for site management
const hasSitePermission = (user) => {
  return (
    user.role === "admin" ||
    (user.role === "subadmin" && user.permissions?.includes("siteManagement"))
  );
};

// Create new site
const createSite = async (req, res) => {
  try {
    const user = req.user;

    if (!hasSitePermission(user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create a site",
      });
    }

    const { siteName, location, startDate } = req.body;

    if (!siteName || !location || !startDate) {
      return res.status(400).json({
        success: false,
        message: "siteName, location and startDate are required",
      });
    }

    const newSite = await Site.create({
      siteName,
      location,
      startDate,
    });

    return res.status(201).json({
      success: true,
      message: "Site created successfully",
      data: newSite,
    });
  } catch (error) {
    console.error("Error creating site:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get single site by ID
const getSiteById = async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get site list with pagination and location filter
const getSites = async (req, res) => {
  try {
    const { page = 1, limit = 10, location } = req.query;

    const filter = {};
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    const sites = await Site.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Site.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: sites,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sites:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update site
const updateSite = async (req, res) => {
  try {
    const user = req.user;

    if (!hasSitePermission(user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update a site",
      });
    }

    const { id } = req.params;
    const { siteName, location, startDate } = req.body;

    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    site.siteName = siteName || site.siteName;
    site.location = location || site.location;
    site.startDate = startDate || site.startDate;

    const updatedSite = await site.save();

    return res.status(200).json({
      success: true,
      message: "Site updated successfully",
      data: updatedSite,
    });
  } catch (error) {
    console.error("Error updating site:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete site
const deleteSite = async (req, res) => {
  try {
    const user = req.user;

    if (!hasSitePermission(user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete a site",
      });
    }

    const { id } = req.params;

    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    await Site.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Site deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting site:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { 
  createSite, 
  getSiteById, 
  getSites, 
  updateSite, 
  deleteSite 
};

const Property = require("../models/Property");
const Project = require("../models/Project");
const allowedRoles = [
  'admin',
  'subadmin',
  'project_manager',
  'lead_manager',
  'account_manager',
  'sales_manager',
  'site_manager'
];

// Create Property (Admin Only)
const createProperty = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only admin can create properties" });
    }

    const { projectId } = req.params;
    const { propertyName, budget, location, category, propertyArea, measurementUnit } = req.body;

    // Ensure project exists
    const project = await Project.findById(projectId);
    if (!project)
      return res.status(404).json({ message: "Project not found" });
    const image = req.file ? req.file.filename : null;



    const property = new Property({
      propertyName,
      budget,
      location,
      category,
      propertyArea,
      measurementUnit,
      projectId,
      createdBy: req.user._id,
      image,
    });

    await property.save();
    
    // Populate the project name and add image URL
    const populatedProperty = await Property.findById(property._id)
      .populate('projectId', 'projectName');
      
    const propertyWithImageUrl = {
      ...populatedProperty.toObject(),
      imageUrl: populatedProperty.image ? `/uploads/properties/${populatedProperty.image}` : null
    };
    
    res.status(201).json({ 
      message: "Property created successfully", 
      property: propertyWithImageUrl 
    });
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all properties of a project
const getPropertiesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const properties = await Property.find({ projectId, isActive: true })
      .populate('projectId', 'projectName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Add full image URLs to each property
    const propertiesWithImageUrls = properties.map(property => ({
      ...property.toObject(),
      imageUrl: property.image ? `/uploads/properties/${property.image}` : null
    }));

    res.json({ properties: propertiesWithImageUrls });
  } catch (error) {
    console.error("Get properties error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single property
const getProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findOne({ _id: id, isActive: true })
      .populate('projectId', 'projectName')
      .populate('createdBy', 'name email');

    if (!property)
      return res.status(404).json({ message: "Property not found" });

    // Add full image URL to the response
    const propertyWithImageUrl = {
      ...property.toObject(),
      imageUrl: property.image ? `/uploads/properties/${property.image}` : null
    };

    res.json({ property: propertyWithImageUrl });
  } catch (error) {
    console.error("Get property error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update property (Admin Only)
const updateProperty = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Only admin can update properties" });
    }

    const { propertyId } = req.params;
    const updateData = { ...req.body };
    
    // If there's a new image, update it
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      updateData,
      { new: true }
    ).populate('projectId', 'projectName');
    
    if (!updatedProperty) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Add full image URL to the response
    const propertyWithImageUrl = {
      ...updatedProperty.toObject(),
      imageUrl: updatedProperty.image ? `/uploads/properties/${updatedProperty.image}` : null
    };

    res.json({
      message: "Property updated successfully",
      property: propertyWithImageUrl,
    });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete property (Admin Only)
const deleteProperty = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only admin can delete properties" });
    }

    const { propertyId } = req.params;
    const deleted = await Property.findByIdAndDelete(propertyId);
    if (!deleted)
      return res.status(404).json({ message: "Property not found" });

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Get all properties (across all projects)
const getAllProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;

    // Build query
    let query = { isActive: true };
    if (category && ['Residential', 'Commercial', 'Industrial', 'Agricultural'].includes(category)) {
      query.category = category;
    }

    const skip = (page - 1) * limit;

    // Fetch properties with pagination & filtering
    const properties = await Property.find(query)
      .populate("projectId", "projectName")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Total count for pagination
    const total = await Property.countDocuments(query);

    // Add full image URLs
    const propertiesWithImageUrls = properties.map(property => ({
      ...property.toObject(),
      imageUrl: property.image ? `/uploads/properties/${property.image}` : null
    }));

    res.json({
      total,                          // total matching documents
      page: parseInt(page),
      limit: parseInt(limit),
      count: propertiesWithImageUrls.length,
      properties: propertiesWithImageUrls
    });
  } catch (error) {
    console.error("Get all properties error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  createProperty,
  getPropertiesByProject,
  getProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
};

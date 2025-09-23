// controllers/punchController.js
const mongoose = require('mongoose');
const Punch = require('../models/Punch');
const Project = require('../models/Project');
const Property = require('../models/Property');
const Lead = require('../models/Lead');
const moment = require('moment');
const { reverseGeocode } = require('../utils/olaMaps');

exports.getProjectForPunch=async(req,res)=>{
    try {
      
        const projects = await Project.find({
          company:req.user.company
        });
        return res.status(200).json({ success: true, data: projects });
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
      }
}
exports.getPropertyForPunch=async(req,res)=>{
    try {
        const properties = await Property.find({
          projectId:req.query.project
        });
        return res.status(200).json({ success: true, data: properties });
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
      }
}

exports.punchIn = async (req, res) => {
  try {
    const salespersonId = req.user._id;
    const { project, leadId, property, lat, lng } = req.body;
    const today = moment().format('YYYY-MM-DD');
    const timeNow = moment().format('HH:mm:ss');

    if (!project || !leadId || !property || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'Project, Lead, Property, lat & lng are required' });
    }

    const propertyExists = await Property.findOne({ _id: property, projectId: project });
    if (!propertyExists) {
      return res.status(404).json({ success: false, message: 'Property not found or not linked to project' });
    }

    const existingPunch = await Punch.findOne({ salespersonId, project, leadId, propertyId: property, date: today, punchOut: { $exists: false } });
    if (existingPunch) {
      return res.status(400).json({ success: false, message: 'Already punched in for this lead today' });
    }

    const formattedAddress = await reverseGeocode(lat, lng);
    
    // Log the address for debugging
    console.log('Formatted address from Ola Maps:', formattedAddress);

    const punch = new Punch({
      salespersonId,
      project,
      leadId,
      propertyId: property,
      date: today,
      punchIn: timeNow,
      dateTime_in: new Date(),
      imageIn: req.file?.path,
      latIn: lat,
      lngIn: lng,
      addressIn: formattedAddress,
      olaMapsResponse: {
        formattedAddress: formattedAddress,
        coordinates: { lat, lng },
        timestamp: new Date()
      }
    });

    await punch.save();
    res.status(201).json({ success: true, data: punch });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Punch Out
exports.punchOut = async (req, res) => {
  try {
    const salespersonId = req.user._id;
    const { project, leadId, property, lat, lng } = req.body;
    const today = moment().format('YYYY-MM-DD');
    const timeNow = moment().format('HH:mm:ss');

    if (!project || !leadId || !property || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'Project, Lead, Property, lat & lng are required' });
    }

    const punch = await Punch.findOne({ salespersonId, project, leadId, propertyId: property, date: today, punchOut: { $exists: false } });
    if (!punch) {
      return res.status(404).json({ success: false, message: 'No active punch found' });
    }

    const formattedAddress = await reverseGeocode(lat, lng);
    
    // Log the address for debugging
    console.log('Formatted address from Ola Maps (punch-out):', formattedAddress);

    punch.punchOut = timeNow;
    punch.dateTime_out = new Date();
    punch.imageOut = req.file?.path;
    punch.latOut = lat;
    punch.lngOut = lng;
    punch.addressOut = formattedAddress;
    punch.olaMapsResponse = punch.olaMapsResponse || {};
    punch.olaMapsResponse.punchOut = {
      formattedAddress: formattedAddress,
      coordinates: { lat, lng },
      timestamp: new Date()
    };
    punch.duration = moment.duration(moment().diff(moment(punch.dateTime_in))).asHours().toFixed(2);

    await punch.save();
    res.status(200).json({ success: true, data: punch });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getTodayPunch = async (req, res) => {
  try {
    const salespersonId = req.user._id;
    const { project, leadId, propertyId } = req.query;  // Changed to use destructuring
    const today = require('moment')().format('YYYY-MM-DD');
    
    console.log('Searching for punch with:', { 
      salespersonId, 
      project, 
      leadId,  // Fixed variable name
      today 
    });

    if (!project || !leadId) {  // Check both project and leadId
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID and Lead ID are required' 
      });
    }

    const projectIdObject = new mongoose.Types.ObjectId(project);
    const leadObjectId = new mongoose.Types.ObjectId(leadId);  // Convert leadId to ObjectId

    const Punch = require('../models/Punch');
    const punch = await Punch.findOne({ 
      salespersonId,
      project: projectIdObject,
      leadId: leadObjectId,
      propertyId: propertyId ? new mongoose.Types.ObjectId(propertyId) : { $exists: true },
      date: today 
    })
    .populate('project')
    .populate('propertyId');

    console.log('Found punch:', punch);
    return res.status(200).json({ success: true, data: punch });
  } catch (err) {
    console.error('Error in getTodayPunch:', err);  // Added error logging
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};
  exports.getAllPunches = async (req, res) => {
    try {
      const salespersonId = req.user._id;
      const {project} = req.query;
      const punches = await require('../models/Punch').find({ salespersonId, project }).populate('project').sort({date:-1,punchIn:-1});
      return res.status(200).json({ success: true, data: punches });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  };
  exports.getSalesPersonPunches = async (req, res) => {
    try {
      const salespersonId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await require('../models/Punch').countDocuments({ salespersonId });
      
      const punches = await require('../models/Punch')
        .find({ salespersonId })
        .populate('project', 'projectName')
        .populate('leadId', 'firstName lastName phone email')
        .populate('propertyId', 'propertyName propertyAddress')
        .sort({ date: -1, punchIn: -1 })
        .skip(skip)
        .limit(limit);
      
      return res.status(200).json({ 
        success: true, 
        data: punches,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit
        }
      });
    } catch (err) {
      console.error('Error in getSalesPersonPunches:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: err.message 
      });
    }
  };
  exports.getTotalSiteVisits = async (req, res) => {
    try {
      // ✅ Restrict to admin and subadmin only
      if (!['admin', 'subadmin'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
  
      // ✅ Pagination params
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      // ✅ Query filters
      const { startDate, endDate, leadId } = req.query;
      const filter = {
        punchIn: { $exists: true },
        punchOut: { $exists: true }
      };
  
      // ✅ Date filter
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = moment(startDate, "YYYY-MM-DD").startOf("day").toDate();
        if (endDate) filter.date.$lte = moment(endDate, "YYYY-MM-DD").endOf("day").toDate();
      }
  
      // ✅ Lead filter
      if (leadId) {
        filter.leadId = leadId;
      }
  
      // ✅ Count total visits
      const totalVisits = await Punch.countDocuments(filter);
  
      // ✅ Paginated results
      const visits = await Punch.find(filter)
        .populate('salespersonId', 'name email phone') 
        .populate('project', 'projectName')
        .populate('propertyId', 'propertyName propertyAddress')
        .populate('leadId', 'firstName lastName phone email')
        .sort({ date: -1, punchIn: -1 })
        .skip(skip)
        .limit(limit);
  
      return res.status(200).json({
        success: true,
        totalVisits,
        page,
        totalPages: Math.ceil(totalVisits / limit),
        limit,
        data: visits
      });
  
    } catch (err) {
      console.error('Error in getTotalSiteVisits:', err);
      return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  };
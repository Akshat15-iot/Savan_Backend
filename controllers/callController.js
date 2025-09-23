const Call = require("../models/Call");
const Lead = require("../models/Lead");


// Create a new call log with recording
exports.createCall = async (req, res) => {
 try {
   console.log(req.body);
   console.log(req.file);
   const { leadId, description } = req.body;
  
   // Check if file exists in the request
   if (!req.file) {
     return res.status(400).json({
       success: false,
       message: "Audio file is required"
     });
   }


   // Validate lead
   const lead = await Lead.findById(leadId);
   if (!lead) {
     return res.status(404).json({
       success: false,
       message: "Lead not found"
     });
   }
    // Get the file URL
    let recordingUrl = null;
    if (req.file) {
      // For local file storage
      recordingUrl = `${req.protocol}://${req.get('host')}/uploads/call-recordings/${req.file.filename}`;
     
      // For cloud storage (if you're using it)
      // recordingUrl = req.file.location; // For AWS S3
      recordingUrl = req.file.path; // For local storage
    }


   // Create new call record
   const call = new Call({
     lead: leadId,
     salesperson: req.user._id,
     description: description || '',
     recordingUrl: recordingUrl,
     duration: req.body.duration || 0, // You can calculate this from the audio file if needed
     callDate: req.body.callDate || Date.now()
   });


   await call.save();


   // Populate the response with user and lead details
   const savedCall = await Call.findById(call._id)
     .populate('lead', 'name phone email')
     .populate('salesperson', 'name email');


   res.status(201).json({
     success: true,
     message: "Call recorded successfully",
     data: savedCall
   });


 } catch (error) {
   console.error("Error creating call:", error);
   res.status(500).json({
     success: false,
     message: "Failed to record call",
     error: error.message
   });
 }
};


// Get all calls for a lead
exports.getCallsByLead = async (req, res) => {
 try {
   const { leadId } = req.params;


   const calls = await Call.find({ lead: leadId })
     .populate("lead", "name phone propertyInterest")
     .populate("salesperson", "name email");


   res.json({ calls });
 } catch (error) {
   console.error("Error fetching calls:", error);
   res.status(500).json({ message: "Server error", error: error.message });
 }
};


// Upload call recording
exports.uploadCallRecording = async (req, res) => {
 try {
   if (!req.file) {
     return res.status(400).json({ success: false, message: 'No audio file uploaded' });
   }
   const call = new Call({
     salesperson: req.user._id,
     lead: req.body.leadId,
     recordingUrl: req.file.filename,
     duration: req.body.duration
   });
   await call.save();


   // Log activity
   await ActivityLog.create({
     userId: req.user._id,
     role: req.user.role,
     method: req.method,
     endpoint: req.originalUrl,
     action: 'Upload Call Recording',
     description: `User ${req.user.fullName || req.user.email} uploaded a call recording for lead ${req.body.leadId}`,
     ipAddress: req.ip,
     userAgent: req.headers['user-agent']
   });


   res.status(201).json({ success: true, message: 'Call recording uploaded', data: call });
 } catch (err) {
   res.status(500).json({ success: false, message: 'Server error', error: err.message });
 }
};


// Get details of a single call
exports.getCallById = async (req, res) => {
 try {
   const { callId } = req.params;


   const call = await Call.findById(callId)
     .populate("lead", "name phone propertyInterest")
     .populate("salesperson", "name email");


   if (!call) {
     return res.status(404).json({ message: "Call not found" });
   }


   res.json({ call });
 } catch (error) {
   console.error("Error fetching call:", error);
   res.status(500).json({ message: "Server error", error: error.message });
 }
};

const Document = require('../models/Document');
const path = require('path');
const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');


// Upload document
exports.uploadDocument = async (req, res) => {
 try {
   const { leadId } = req.body;
   const { docType } = req.body;
   if (!req.file) {
     return res.status(400).json({ success: false, message: 'No document uploaded' });
   }


   const document = new Document({
     uploadedBy: req.user._id,
     fileName: req.file.filename,
     originalName: req.file.originalname,
     leadId: req.body.leadId,
     docType: req.body.docType,
     filePath: req.file.path
   });


   await document.save();


   // Log activity
   await ActivityLog.create({
     userId: req.user._id,
     role: req.user.role,
     method: req.method,
     endpoint: req.originalUrl,
     action: 'Upload Document',
     description: `User ${req.user.fullName || req.user.email} uploaded a document (${req.file.originalname}) for lead ${req.body.leadId}`,
     ipAddress: req.ip,
     userAgent: req.headers['user-agent']
   });


   res.status(201).json({ success: true, message: 'Document uploaded', data: document });
 } catch (err) {
   res.status(500).json({ success: false, message: 'Server error', error: err.message });
 }


};


// Get all documents of a user
exports.getDocuments = async (req, res) => {
 try {
   const leadId = req.params.id;
  
   if (!leadId) {
     return res.status(400).json({
       success: false,
       message: 'Lead ID is required'
     });
   }


   console.log('Fetching documents for lead ID:', leadId);


   // Validate if it's a valid ObjectId
   if (!mongoose.Types.ObjectId.isValid(leadId)) {
     return res.status(400).json({
       success: false,
       message: 'Invalid lead ID format'
     });
   }


   const leadObjectId = new mongoose.Types.ObjectId(leadId);
  
   // Check if lead exists
   const leadExists = await mongoose.model('Lead').findById(leadObjectId).lean();
   console.log('Lead exists:', leadExists ? 'Yes' : 'No');
  
   if (!leadExists) {
     return res.status(404).json({
       success: false,
       message: 'Lead not found'
     });
   }


   // Find documents for this lead
   const docs = await Document.find({ leadId: leadObjectId }).sort({ uploadedAt: -1 });
   console.log(`Found ${docs.length} documents for lead ${leadId}`);


   return res.status(200).json({
     success: true,
     data: docs,
     count: docs.length
   });
  
 } catch (err) {
   console.error('Error in getDocuments:', {
     error: err.message,
     stack: err.stack,
     params: req.params
   });
   return res.status(500).json({
     success: false,
     message: 'Server Error',
     error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
   });
 }
};

const PaymentLedger = require('../models/PaymentLedger');
const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const Property = require('../models/Property');
const mongoose = require('mongoose');


// POST: Add payment entry
exports.addPayment = async (req, res) => {
 try {
   // Clean the leadId in case it has query parameters attached
   let { leadId } = req.body;
   leadId = leadId.split('?')[0]; // Remove any query parameters
   
   const { 
     tokenAmount, 
     projectId, 
     propertyId, 
     paymentType, 
     amount, 
     installmentPlan, 
     transactionId,
     paymentMode, 
     paymentDate, 
     outstandingBalance 
   } = req.body;

   // Validate payment type
   if (!['token', 'emi', 'full_payment'].includes(paymentType)) {
     return res.status(400).json({ message: 'Invalid payment type' });
   }

   // Validate IDs
   if (!mongoose.Types.ObjectId.isValid(leadId) || 
       !mongoose.Types.ObjectId.isValid(projectId) || 
       !mongoose.Types.ObjectId.isValid(propertyId)) {
     return res.status(400).json({ message: 'Invalid ID format' });
   }

   // Find lead and validate
   const lead = await Lead.findOne({ _id: leadId, status: 'accepted' });
   if (!lead) {
     return res.status(404).json({ message: 'Lead not found or property not accepted yet' });
   }

   // Find project, property and validate relationships
   const [project, property] = await Promise.all([
     Project.findById(projectId),
     Property.findOne({ _id: propertyId, projectId: projectId })
   ]);
   
   // Store the IDs for the payment creation
   const projectIdForPayment = project?._id;
   const propertyIdForPayment = property?._id;

   if (!project) {
     return res.status(404).json({ message: 'Project not found' });
   }
   
   if (!property) {
     return res.status(404).json({ message: 'Property not found or does not belong to the specified project' });
   }

   // Verify lead is associated with the property
   if (!lead.propertyId || lead.propertyId.toString() !== propertyId) {
     return res.status(400).json({ 
       message: 'Lead is not associated with the specified property',
       details: 'The lead does not have an associated property or the property ID does not match',
       leadProperty: lead.propertyId ? lead.propertyId.toString() : 'undefined',
       providedProperty: propertyId
     });
   }

   // Validate payment type specific requirements and amounts
   if (paymentType === 'token' && !tokenAmount && !amount) {
     return res.status(400).json({ message: 'Token amount is required for token payments' });
   }
   
   if ((paymentType === 'emi' || paymentType === 'full_payment') && !amount) {
     return res.status(400).json({ message: `Amount is required for ${paymentType} payments` });
   }

   // Validate outstanding balance is provided
   if (outstandingBalance === undefined || outstandingBalance === null) {
     return res.status(400).json({ message: 'Outstanding balance is required' });
   }

   // Set final amounts
   const finalTokenAmount = paymentType === 'token' ? (tokenAmount || amount) : tokenAmount;
   const finalAmount = paymentType === 'token' ? 0 : (amount || 0);

   // Create payment entry
   const payment = await PaymentLedger.create({
     leadId,
     tokenAmount: finalTokenAmount,
     project: projectIdForPayment,
     property: propertyIdForPayment,
     paymentType,
     amount: finalAmount,
     installmentPlan,
     paymentMode,
     transactionId,
     paymentDate: paymentDate || new Date(),
     outstandingBalance,
     createdBy: req.user._id
   });

   // Log activity
   await ActivityLog.create({
     userId: req.user._id,
     role: req.user.role,
     method: req.method,
     endpoint: req.originalUrl,
     action: 'Create Payment Ledger',
     description: `User ${req.user.fullName || req.user.email} created payment ledger entry for lead ${leadId} of amount ${tokenAmount}`,
     ipAddress: req.ip,
     userAgent: req.headers['user-agent']
   });


   res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
 } catch (err) {
   console.error('Error in addPayment:', err);
   res.status(500).json({ success: false, message: 'Server error' });
 }
};


// GET: List all payments (optionally filter by leadId or createdBy)
exports.getPayments = async (req, res) => {
 try {
   const { leadId } = req.query;
   const filter = {};


   if (leadId) filter.leadId = leadId;


   const payments = await PaymentLedger.find(filter)
     .populate('leadId', 'firstName lastName')
     .populate('project', 'projectName ')
     .populate('property', 'propertyName budget location category propertyArea measurementUnit')
     .sort({ createdAt: -1 });


   res.json({ success: true, data: payments });
 } catch (err) {
   console.error('Error in getPayments:', err);
   res.status(500).json({ success: false, message: 'Server error' });
 }
};
// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await PaymentLedger.findById(id)
      .populate('leadId', 'firstName lastName')
      .populate('projectId', 'projectName')
      .populate('propertyId', 'propertyName');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    console.error('Error in getPaymentById:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      amount, 
      tokenAmount, 
      paymentDate, 
      paymentMode, 
      paymentType, 
      transactionId,
      outstandingBalance
    } = req.body;

    // Input validation
    if (!amount || !paymentDate || !paymentMode || outstandingBalance === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount, payment date, payment mode, and outstanding balance are required' 
      });
    }

    const payment = await PaymentLedger.findByIdAndUpdate(
      id,
      {
        amount,
        tokenAmount: tokenAmount || 0,
        paymentDate,
        paymentMode,
        paymentType: paymentType || 'emi',
        transactionId,
        outstandingBalance
      },
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({ 
      success: true, 
      message: 'Payment updated successfully',
      data: payment 
    });
  } catch (err) {
    console.error('Error in updatePayment:', err);
    
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already exists',
        field: 'transactionId'
      });
    }
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

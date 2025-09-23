// models/Lead.js
const mongoose = require('mongoose');


const LeadSchema = new mongoose.Schema(
 {
   // Who the lead belongs to
   companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
   assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // salesperson


   // Basic details
   firstName: { type: String, trim: true, required: true },
   lastName: { type: String, trim: true },
   phone: { type: String, trim: true, required: true },
   email: { type: String, trim: true },
   location: { type: String, trim: true },


   // Interest & budget
   propertyInterest: { type: String, trim: true },    // e.g. "2BHK", "Plot", "category"
   budgetMin: { type: Number },
   budgetMax: { type: Number },
   currency: { type: String, default: 'INR' },


   // Source & meta
   source: {
     type: String,
     enum: ['facebook', 'google', 'website', 'manual', 'csv','referral', 'other'],
     default: 'manual'
   },
   campaign: { type: String, trim: true },
   adset: { type: String, trim: true },
   adId: { type: String, trim: true },


   // Broker info
   isBroker: { type: Boolean, default: false },
   brokerName: { type: String, trim: true },
   brokerCutPct: { type: Number, min: 0, max: 100 },


   // Status pipeline
   status: {
     type: String,
     enum: ['new', 'contacted', 'site_visit','accepted','not accepted','paid','unpaid','booking_done','document_uploaded','document_not_uploaded' ,'dropped'],
     default: 'new'
   },
   projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
   propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },


   // Admin & audit
   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
   notes: { type: String, trim: true },


   // De-dup helpers from ad platforms
   externalRef: { type: String, index: true }, // e.g. meta leadgen ID / google form submission ID
 },
 { timestamps: true }
);


// Prevent exact duplicates per company (same phone)
LeadSchema.index({ companyId: 1, phone: 1 }, { unique: true, sparse: true });


// Useful query index
LeadSchema.index({ companyId: 1, status: 1 });
LeadSchema.index({ assignedTo: 1, status: 1 });


module.exports = mongoose.model('Lead', LeadSchema);




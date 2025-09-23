// controllers/leadController.js
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Company = require('../models/Company');
const { assignLeadToSalesperson } = require('../services/leadAssignment');
const axios = require('axios');

/** ================== Utilities ================== **/

function parseBudgetRange(input) {
  if (!input && input !== 0) return { min: undefined, max: undefined };
  const cleaned = String(input).replace(/[₹,]/g, '').trim().toLowerCase();

  const toNumber = (val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const s = String(val).trim().toLowerCase();
    const numeric = parseFloat(s.replace(/[^\d.]/g, '')) || 0;
    if (s.includes('lakh')) return numeric * 100000;
    if (s.includes('cr') || s.includes('crore')) return numeric * 10000000;
    return numeric;
  };

  const parts = cleaned.split(/(?:-|–|\bto\b)/i).map(p => p.trim()).filter(Boolean);
  if (parts.length === 2) return { min: toNumber(parts[0]), max: toNumber(parts[1]) };
  const n = toNumber(cleaned);
  return { min: n || undefined, max: n || undefined };
}

const normalizeSource = (s) => {
  const x = String(s || '').toLowerCase();
  if (x.includes('facebook') || x.includes('meta')) return 'facebook';
  if (x.includes('google')) return 'google';
  if (x.includes('walk')) return 'walk_in';
  if (x.includes('agent') || x.includes('broker')) return 'agent';
  if (x.includes('csv')) return 'csv';
  return 'manual';
};

function safeUnlink(path) {
  if (!path) return;
  fs.unlink(path, (err) => { if (err) console.warn('unlink error', err); });
}

/** ================== Controllers ================== **/

// ✅ Manual create
const createLead = async (req, res) => {
  try {
    const {
      firstName, lastName, phone, email, location,
      propertyInterest, budget, budgetMin, budgetMax,
      isBroker, brokerName, brokerCutPct,
      source, campaign, adset, adId, notes, companyId: bodyCompanyId
    } = req.body;

    const companyId = bodyCompanyId || req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: 'companyId is required' });
    if (!firstName || !phone) return res.status(400).json({ message: 'firstName and phone are required' });

    const phoneStr = String(phone).trim();
    const { min, max } = budget ? parseBudgetRange(budget) : { min: budgetMin, max: budgetMax };

    let assignedTo = null;
    try {
      assignedTo = await assignLeadToSalesperson(companyId);
    } catch (errAssign) {
      console.warn('assignLeadToSalesperson failed', errAssign);
    }

    const lead = await Lead.create({
      companyId,
      assignedTo,
      firstName: String(firstName).trim(),
      lastName: lastName ? String(lastName).trim() : '',
      phone: phoneStr,
      email: email ? String(email).trim().toLowerCase() : '',
      location: location || '',
      propertyInterest: propertyInterest || '',
      budgetMin: (min ?? budgetMin) || undefined,
      budgetMax: (max ?? budgetMax) || undefined,
      isBroker: !!isBroker,
      brokerName: brokerName || '',
      brokerCutPct: brokerCutPct ? Number(brokerCutPct) : undefined,
      source: normalizeSource(source),
      campaign: campaign || '',
      adset: adset || '',
      adId: adId || '',
      notes: notes || '',
      createdBy: req.user?._id
    });

    res.status(201).json({ success: true, lead });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: 'Duplicate lead (phone already exists for company)' });
    }
    console.error('createLead error', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ CSV import (with company selection required)
const importCsv = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const companyId = req.body.companyId;
  if (!companyId) {
    safeUnlink(req.file.path);
    return res.status(400).json({ message: 'companyId is required (select a company first)' });
  }

  // Validate company exists
  const company = await Company.findById(companyId);
  if (!company) {
    safeUnlink(req.file.path);
    return res.status(404).json({ message: 'Company not found' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  let results = [];

  try {
    if (ext === '.csv') {
      // ✅ Parse CSV
      results = await new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', () => resolve(rows))
          .on('error', (err) => reject(err));
      });
    } else if (ext === '.xlsx' || ext === '.xls') {
      // ✅ Parse Excel
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      results = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      safeUnlink(req.file.path);
      return res.status(400).json({ message: 'Unsupported file type. Use CSV/XLS/XLSX' });
    }
  } catch (err) {
    safeUnlink(req.file.path);
    console.error('File parse error:', err);
    return res.status(500).json({ message: 'File parsing failed' });
  }

  // ✅ Process leads
  let created = 0, skipped = 0, errors = 0;
  const skippedRows = [];

  try {
    for (const [index, r] of results.entries()) {
      try {
        const { min, max } = parseBudgetRange(r.Budget || r.budget || r['Budget Range'] || '');
        const phoneRaw = r['Phone No'] || r.phone || r.Phone || r.mobile || '';
        const phone = String(phoneRaw || '').trim();

        const payload = {
          companyId,
          firstName: (r['Customer First Name'] || r['First Name'] || r.firstName || '—').trim(),
          lastName: (r['Last Name'] || r.lastName || '').trim(),
          phone,
          email: (r.email || r.Email || '').trim().toLowerCase(),
          location: (r.Location || r.location || '').trim(),
          propertyInterest: (r['Property Interest'] || r.propertyInterest || '').trim(),
          budgetMin: min || 0,
          budgetMax: max || 0,
          isBroker: /yes/i.test(String(r.Broker || r.isBroker || '')),
          brokerName: (r["Broker's Name"] || r.brokerName || '').trim(),
          brokerCutPct: r["Broker's Cut"]
            ? parseFloat(String(r["Broker's Cut"]).replace('%', '').trim())
            : undefined,
          source: normalizeSource(r.Source || 'upload'),
          notes: r.Notes || ''
        };

        if (!payload.phone) {
          skipped++;
          skippedRows.push({ row: index + 1, reason: "Missing phone", data: r });
          continue;
        }

        try {
          payload.assignedTo = await assignLeadToSalesperson(companyId);
        } catch (errAssign) {
          console.warn('assignLeadToSalesperson failed', errAssign);
          payload.assignedTo = undefined;
        }

        await Lead.create(payload);
        created++;
      } catch (err) {
        if (err?.code === 11000) {
          skipped++;
          skippedRows.push({ row: index + 1, reason: "Duplicate phone/email", data: r });
          continue;
        }
        errors++;
        console.error(`Row ${index + 1} error:`, err);
        skippedRows.push({ row: index + 1, reason: "Unexpected error", data: r });
      }
    }

    safeUnlink(req.file.path);

    res.json({
      success: true,
      message: `Import completed for company ${company.companyName}`,
      summary: { created, skipped, errors, total: results.length },
      skippedRows
    });
  } catch (err) {
    safeUnlink(req.file.path);
    console.error('importCsv error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List leads (filters)
const getLeads = async (req, res) => {
try {
  console.log('getLeads called with query:', req.query);
  let { status, source, assignedTo, companyId: qCompanyId, search, page = 1, limit = 20 } = req.query;
  const companyId = qCompanyId || req.user?.companyId;
  
  console.log('Company ID from query/user:', companyId);
  
  // Initialize filter as empty object
  const filter = {};

  // Only add companyId to filter if provided
  if (companyId) {
    try {
      filter.companyId = new mongoose.Types.ObjectId(companyId);
    } catch (err) {
      console.error('Invalid companyId format:', companyId, err);
      return res.status(400).json({ message: 'Invalid companyId' });
    }
  }

  console.log('Base filter:', filter);
  
  // Normalize status to lowercase for consistent matching
  if (status) {
    filter.status = status.toLowerCase();
  }
  
  if (source) filter.source = source.toLowerCase();
  if (assignedTo) filter.assignedTo = assignedTo;
  
  if (search) {
    const reg = new RegExp(String(search), 'i');
    filter.$or = [
      { firstName: reg },
      { lastName: reg },
      { phone: reg },
      { email: reg },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  console.log('Final filter before query:', JSON.stringify(filter, null, 2));

  // Updated query to include company population
  const query = Lead.find(filter)
    .populate('assignedTo', 'name email phone')
    .populate('projectId', 'projectName')
    .populate('propertyId', 'propertyName')
    .populate('companyId', 'companyName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
    
  console.log('MongoDB Query:', query.getFilter());
  
  const [items, total] = await Promise.all([
    query.lean(),
    Lead.countDocuments(filter)
  ]);

  // Transform the items to include company name at the root level
  const transformedItems = items.map(item => ({
    ...item,
    companyName: item.companyId?.companyName || null,
    // Remove the nested companyId object to avoid duplication
    companyId: item.companyId?._id || item.companyId
  }));

  console.log('Query results - items:', transformedItems.length, 'total:', total);

  res.json({
    items: transformedItems,
    total,
    page: Number(page),
    pages: Math.ceil(total / Math.max(1, Number(limit)))
  });
} catch (err) {
  console.error('getLeads error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
}
};




// Update lead fields
const updateLead = async (req, res) => {
try {
  // NOTE: Keep existing behavior; caller should not change restricted fields if not allowed
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true }
  ).populate('assignedTo', 'name email phone');
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.json({ success: true, lead });
} catch (e) {
  console.error('updateLead error', e);
  res.status(500).json({ message: 'Server error' });
}
};




// Update status only
const ActivityLog = require('../models/ActivityLog');
const updateLeadStatus = async (req, res) => {
try {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'status is required' });
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!lead) return res.status(404).json({ message: 'Lead not found' });




  // Log activity
  await ActivityLog.create({
    userId: req.user._id,
    role: req.user.role,
    method: req.method,
    endpoint: req.originalUrl,
    action: 'Change Lead Status',
    description: `User ${req.user.fullName || req.user.email} changed status of lead ${lead._id} to ${status}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });




  res.json({ success: true, lead });
} catch (err) {
  console.error('updateLeadStatus error', err);
  res.status(500).json({ message: 'Server error' });
}
};




// Quick stats (for board counters)
const getLeadStats = async (req, res) => {
try {
  const companyId = req.query.companyId || req.user?.companyId;
  if (!companyId) return res.status(400).json({ message: 'companyId is required' });




  // Ensure valid ObjectId
  let compOid;
  try {
    compOid = mongoose.Types.ObjectId(String(companyId));
  } catch (err) {
    return res.status(400).json({ message: 'Invalid companyId' });
  }




  const stats = await Lead.aggregate([
    { $match: { companyId: compOid } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);




  const base = { new: 0, contacted: 0, site_visit: 0, booking_done: 0, dropped: 0 };
  for (const s of stats) base[s._id] = s.count;
  res.json(base);
} catch (err) {
  console.error('getLeadStats error', err);
  res.status(500).json({ message: 'Server error' });
}
};






/* ================= Webhooks (stubs - ready to wire) ================= */




// Meta (Facebook/Instagram) Leadgen webhook receiver
// GET for verification (hub.challenge) and POST for lead payloads
const metaWebhook = async (req, res) => {
  // ✅ Step 1: Verification (Facebook GET request)
  if (req.method === 'GET') {
    const VERIFY_TOKEN = 'realestatesavanraval';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log("✅ Meta Webhook Verified");
      return res.status(200).send(challenge);  // must return plain hub.challenge
    } else {
      return res.sendStatus(403);
    }
  }

  // ✅ Step 2: Handle POST requests (actual leads)
  try {
    if (!Array.isArray(req.body.entry)) return res.sendStatus(200);

    for (const entry of req.body.entry) {
      const pageId = entry?.id;
      if (!pageId) continue;

      const company = await Company.findOne({ pageId });
      if (!company) {
        console.warn(`⚠️ No company found for pageId ${pageId}`);
        continue;
      }

      for (const change of entry.changes || []) {
        const leadgenId = change?.value?.leadgen_id;
        if (!leadgenId) continue;

        try {
          // ✅ Use hardcoded token if company doesn’t have one
          const token = company.pageAccessToken ||
            "EAAqZCmUQiuSYBPRmlAXdSZAV6G8T9aNdgjOSblbq9SX7YuOgXijDIBXvLN01BK9kBE61O3590Cin6pOPZAZBVkOJ0EjmhAWcNaZAeOTwd6Y33DaGQdUrNQ0jopTUtTYW5wMlKO5Lmkp5KKJ2ou73VBOdCnIBkwWe02xxFTzX0FkqCHZBhGKwwCnzsZAwliV5owruDc0fsrp9UhiHlnJ";

          const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${token}`;
          const { data: leadData } = await axios.get(url);

          // ✅ Extract fields
          let firstName = '—', lastName = '', phone = '', email = '';
          leadData.field_data.forEach(field => {
            if (field.name === 'full_name') {
              const parts = (field.values[0] || '').split(' ');
              firstName = parts[0] || '—';
              lastName = parts.slice(1).join(' ') || '';
            }
            if (field.name === 'first_name') firstName = field.values[0] || firstName;
            if (field.name === 'last_name') lastName = field.values[0] || lastName;
            if (field.name === 'phone_number') phone = field.values[0] || phone;
            if (field.name === 'email') email = field.values[0] || email;
          });

          // ✅ Assign to salesperson (optional)
          let assignedTo = null;
          try {
            assignedTo = await assignLeadToSalesperson(company._id);
          } catch {}

          // ✅ Save Lead
          await Lead.create({
            companyId: company._id,
            assignedTo,
            firstName,
            lastName,
            phone,
            email,
            source: 'facebook',
            externalRef: leadgenId
          });

          // ✅ Log activity
          await ActivityLog.create({
            companyId: company._id,
            action: 'webhook:lead_received',
            details: { pageId, leadgenId, source: 'facebook' }
          });

        } catch (err) {
          console.error('❌ Meta lead fetch failed:', err.response?.data || err.message);
          await ActivityLog.create({
            companyId: company._id,
            action: 'webhook:error',
            details: { pageId, leadgenId, error: err.message }
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('❌ metaWebhook error', e);
    res.sendStatus(200);
  }
};


//get lead of particular salesperson
const getMyLeads = async (req, res) => {
  try {
    const salespersonId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status } = req.query;
    const skip = (page - 1) * limit;

    const query = { assignedTo: salespersonId };
    if (status) {
      query.status = status;
    }

    // First, get the leads with basic population
    let queryBuilder = Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email');

    // Add project and property population if they exist
    queryBuilder = queryBuilder.lean(); // Convert to plain JavaScript objects
    
    const [leads, total] = await Promise.all([
      queryBuilder,
      Lead.countDocuments(query)
    ]);

    // Process each lead to populate project and property details
    const populatedLeads = await Promise.all(leads.map(async (lead) => {
      const populatedLead = { ...lead };
      
      // Populate project details if projectId exists
      if (lead.projectId) {
        try {
          const Project = mongoose.model('Project');
          const project = await Project.findById(lead.projectId)
            .select('projectName city category budget')
            .lean();
          populatedLead.project = project;
        } catch (err) {
          console.error(`Error populating project for lead ${lead._id}:`, err);
          populatedLead.project = { error: 'Failed to load project details' };
        }
      }

      // Populate property details if propertyId exists
      if (lead.propertyId) {
        try {
          const Property = mongoose.model('Property');
          const property = await Property.findById(lead.propertyId)
            .select('propertyName location category budget propertyArea measurementUnit')
            .lean();
          populatedLead.property = property;
        } catch (err) {
          console.error(`Error populating property for lead ${lead._id}:`, err);
          populatedLead.property = { error: 'Failed to load property details' };
        }
      }

      return populatedLead;
    }));

    res.json({
      success: true,
      count: populatedLeads.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: populatedLeads
    });
  } catch (err) {
    console.error('Get my leads error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};




// Google Ads lead form webhook (reverse proxy or direct)
const googleWebhook = async (req, res) => {
  try {
    const pageId = req.query.pageId;
    if (!pageId) return res.status(400).json({ message: 'pageId is required' });

    const company = await Company.findOne({ pageId });
    if (!company) return res.status(404).json({ message: 'Company not found for pageId' });

    const data = req.body || {};
    let assignedTo = null;
    try { assignedTo = await assignLeadToSalesperson(company._id); } catch {}

    await Lead.create({
      companyId: company._id,
      assignedTo,
      firstName: data.first_name || '—',
      lastName: data.last_name || '',
      phone: data.phone || '',
      email: data.email || '',
      source: 'google',
      campaign: data.campaignName,
      externalRef: data.submissionId
    });

    res.sendStatus(200);
  } catch (e) {
    console.error('googleWebhook error', e);
    res.sendStatus(200);
  }
};



// Assign projectId/propertyId to a lead and update status as per user input
const assignProjectAndProperty = async (req, res) => {
 try {
   const { leadId, projectId, propertyId, status } = req.body;
   if (!leadId) {
     return res.status(400).json({ message: 'leadId is required' });
   }


   // If status is provided and is 'dropped', only update status to dropped
   if (status && status === 'dropped') {
     const lead = await Lead.findByIdAndUpdate(
       leadId,
       { status: 'dropped' },
       { new: true }
     ).populate('projectId').populate('propertyId');
     if (!lead) return res.status(404).json({ message: 'Lead not found' });
     return res.json({ success: true, lead });
   }


   // If status is 'accepted', require projectId and propertyId
   if (status === 'accepted') {
     if (!projectId || !propertyId) {
       return res.status(400).json({ message: 'projectId and propertyId are required when status is accepted' });
     }
     const lead = await Lead.findByIdAndUpdate(
       leadId,
       { projectId, propertyId, status: 'accepted' },
       { new: true }
     ).populate('projectId').populate('propertyId');
     if (!lead) return res.status(404).json({ message: 'Lead not found' });
     return res.json({ success: true, lead });
   }


   // If only status is provided (not 'accepted' or 'dropped'), just update status
   if (status) {
     const lead = await Lead.findByIdAndUpdate(
       leadId,
       { status },
       { new: true }
     ).populate('projectId').populate('propertyId');
     if (!lead) return res.status(404).json({ message: 'Lead not found' });
     return res.json({ success: true, lead });
   }


   // If status not provided, require projectId and propertyId, set status to accepted
   if (!projectId || !propertyId) {
     return res.status(400).json({ message: 'projectId and propertyId are required if status is not provided' });
   }
   const lead = await Lead.findByIdAndUpdate(
     leadId,
     { projectId, propertyId, status: 'accepted' },
     { new: true }
   ).populate('projectId').populate('propertyId');
   if (!lead) return res.status(404).json({ message: 'Lead not found' });
   return res.json({ success: true, lead });
 } catch (err) {
   console.error('assignProjectAndProperty error:', err);
   res.status(500).json({ message: 'Server error' });
 }
};
const getAllCompanyLeads = async (req, res) => {
  try {
    let { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      const allowedStatuses = [
        'new', 'contacted', 'site_visit', 'accepted', 'not accepted',
        'paid', 'unpaid', 'booking_done', 'document_uploaded',
        'document_not_uploaded', 'dropped'
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      filter.status = status;
    }

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const query = Lead.find(filter)
      .populate('assignedTo', 'name email phone')
      .populate('projectId', 'projectName')
      .populate('propertyId', 'propertyName')
      .populate('companyId', 'companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [items, total] = await Promise.all([
      query.lean(),
      Lead.countDocuments(filter)
    ]);

    // ✅ Transform to include companyName directly
    const transformedItems = items.map(item => ({
      ...item,
      companyName: item.companyId?.companyName || null,
      companyId: item.companyId?._id || item.companyId
    }));

    res.json({
      success: true,
      total,
      count: transformedItems.length,
      page,
      pages: Math.ceil(total / limit),
      items: transformedItems
    });
  } catch (err) {
    console.error('getAllCompanyLeads error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};


module.exports = {
createLead,
importCsv,
getLeads,
getMyLeads,
updateLead,
updateLeadStatus,
getLeadStats,
metaWebhook,
googleWebhook,
assignProjectAndProperty,
getAllCompanyLeads
};




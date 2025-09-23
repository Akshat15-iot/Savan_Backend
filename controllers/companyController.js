const Company = require('../models/Company');
const axios = require('axios');

const allowedRoles = [
  'admin',
  'subadmin',
  'project_manager',
  'lead_manager',
  'account_manager',
  'sales_manager',
  'site_manager'
];

// Create Company
exports.createCompany = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create companies' });
    }

    const {
      companyName, companyType, city, contactNumber,
      emailId, ownerDirectorName, gstNumber, panNumber, pageId
    } = req.body;

    if (!companyName || !companyType || !city || !contactNumber ||
        !emailId || !ownerDirectorName || !gstNumber || !panNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newCompany = await Company.create({
      companyName,
      companyType,
      city,
      contactNumber,
      emailId,
      ownerDirectorName,
      gstNumber,
      panNumber,
      pageId: pageId || null, // Optional
      createdBy: req.user._id
    });

    res.status(201).json({ message: 'Company created successfully', company: newCompany });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Companies
exports.getCompanies = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view companies' });
    }

    const companies = await Company.find().sort({ createdAt: -1 });

    res.json({ total: companies.length, companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fetch Facebook Pages
exports.getFacebookPages = async (req, res) => {
  try {
    // Accept token from query, body (JSON/form-data), or header
    const userAccessToken =
      req.query.token ||
      req.query.userAccessToken ||
      (req.body && (req.body.token || req.body.userAccessToken)) ||
      req.headers['x-fb-user-access-token'];

    if (!userAccessToken) {
      return res.status(400).json({ message: "Access token is required" });
    }

    const response = await axios.get(
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,name&access_token=${userAccessToken}`
    );

    const pages = response.data.data.map((page) => ({
      id: page.id,
      name: page.name,
    }));

    res.json({ success: true, data: pages });
  } catch (error) {
    console.error("Error fetching Facebook pages:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to fetch Facebook pages" });
  }
};

// Update Company
exports.updateCompany = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update companies' });
    }

    const { id } = req.params;
    const {
      companyName, companyType, city, contactNumber,
      emailId, ownerDirectorName, gstNumber, panNumber, pageId
    } = req.body;

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      {
        companyName,
        companyType,
        city,
        contactNumber,
        emailId,
        ownerDirectorName,
        gstNumber,
        panNumber,
        pageId: pageId || null
      },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company updated successfully', company: updatedCompany });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Company
exports.deleteCompany = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete companies' });
    }

    const { id } = req.params;
    const deletedCompany = await Company.findByIdAndDelete(id);

    if (!deletedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully', company: deletedCompany });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Single Company
exports.getCompany = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view this company' });
    }

    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

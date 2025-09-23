const Contact = require("../models/Contact");

// @desc Create new contact (public)
const createContact = async (req, res) => {
  try {
    const { name, email, phone, message, budget, location } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const contact = new Contact({
      name,
      email,
      phone,
      message,
      budget,
      location,
    });

    await contact.save();

    res.status(201).json({
      message: "Contact submitted successfully",
      contact,
    });
  } catch (error) {
    console.error("Create contact error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get all contact submissions (public)
const getAllContacts = async (req, res) => {
    try {
      let { page = 1, limit = 10, status } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);
  
      const filter = {};
      if (status && ['Pending', 'Converted', 'Rejected'].includes(status)) {
        filter.status = status;
      }
  
      const contacts = await Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
  
      const total = await Contact.countDocuments(filter);
  
      res.json({
        total,
        page,
        totalPages: Math.ceil(total / limit),
        contacts,
      });
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  const updateContactStatus = async (req, res) => {
    try {
      const { contactId } = req.params;
      const { status } = req.body;
  
      if (!['Pending', 'Converted', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
  
      const contact = await Contact.findByIdAndUpdate(
        contactId,
        { status },
        { new: true }
      );
  
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
  
      res.json({
        message: "Contact status updated successfully",
        contact,
      });
    } catch (error) {
      console.error("Update contact status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  
  module.exports = {
    createContact,
    getAllContacts,
    updateContactStatus,
  };
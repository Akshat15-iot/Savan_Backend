const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: true },
    message: { type: String, required: false },
    budget: { type: Number, required: false },
    location: { type: String, required: false },
    status: { type: String, enum: ['Pending', 'Converted', 'Rejected'], default: 'Pending' },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Contact', contactSchema);

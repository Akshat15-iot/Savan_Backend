const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: [
        'admin',
        'subadmin',
        'project_manager',
        'lead_manager',
        'account_manager',
        'sales_manager',
        'site_manager',
        'salesperson',
        'user',
      ],
      default: 'user',
    },
    permissions: {
      leads: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      projects: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      payments: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      reports: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      users: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      companies: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      properties: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      sites: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      inventory: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false }
      },
      dashboard: {
        view: { type: Boolean, default: false }
      }
    },
    phone: { type: String, trim: true },
    profilePhoto: { type: String, trim: true },
    address: { type: String, trim: true },
    designation: { type: String, trim: true },
    location: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    EmployeeId: { type: String, trim: true },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: function () {
        return this.role === 'salesperson';
      },
    },

    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],

    lastLogin: { type: Date },
    deviceToken: { type: String, trim: true },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔑 Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

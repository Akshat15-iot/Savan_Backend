const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const moment = require('moment');
const { requestLogger, errorLogger } = require('./utils/logger');
const activityLogger = require('./middlewares/activityLogger');
const { getFacebookPages } = require('./controllers/companyController');



// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

// Load environment variables
dotenv.config();

const app = express();

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const propertiesDir = path.join(uploadsDir, 'properties');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(propertiesDir)) {
  fs.mkdirSync(propertiesDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Normalize URL: remove encoded newlines and trailing whitespace that can break routing
app.use((req, res, next) => {
  if (req.url) {
    req.url = req.url.replace(/%0A|%0D|\s+$/g, '');
  }
  next();
});

// Custom logging middleware (should be before other middlewares)
app.use(requestLogger);
app.use(activityLogger);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Database connection
const connectDB = require('./config/db');
const seedAdmin = require('./config/seedAdmin');
connectDB().then(seedAdmin);

// Import route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const projectRoutes = require('./routes/projectRoutes');
const paymentRoutes = require('./routes/paymentLedgerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const punchRoutes = require('./routes/punchRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const documentRoutes = require('./routes/documentRoutes');
const companyRoutes = require('./routes/companyRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const callRoutes = require('./routes/callRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const siteRoutes = require('./routes/siteRoutes');
const itemRoutes = require('./routes/itemRoutes');
const stockRoutes = require('./routes/stockRoutes');
const subAdminRoutes = require('./routes/subAdminRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const ledgerAnalyticsRoutes = require('./routes/ledgerAnalyticsRoutes');
const siteAnalyticsRoutes = require('./routes/siteAnalyticsRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const contactRoutes = require('./routes/contactRoutes');

// Import auth middleware
const { auth, authorize } = require('./middlewares/auth');

// Register routes with appropriate middleware
app.use('/api/v1/auth', authRoutes); // Versioned auth routes
app.use('/api/v1/users', auth, userRoutes);
app.use('/api/v1/leads', auth, leadRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/payment-ledger', auth, paymentRoutes);
app.use('/api/v1/reports', auth, reportRoutes);
app.use('/api/v1/punch', auth, punchRoutes);
app.use('/api/v1/reminders', auth, reminderRoutes);
app.use('/api/v1/documents', auth, documentRoutes);
app.use('/api/v1/companies', auth, companyRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/calls', auth, callRoutes);
app.use('/api/v1/activity-logs', activityLogRoutes);
// Site analytics routes must come before site routes to avoid conflict
app.use('/api/v1/sites/analytics', auth, siteAnalyticsRoutes);
app.use('/api/v1/sites', auth, siteRoutes);
app.use('/api/v1/items', auth, itemRoutes);
app.use('/api/v1/stocks', auth, stockRoutes);
app.use('/api/v1/subadmins', auth, subAdminRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/ledger/analytics', auth, ledgerAnalyticsRoutes);
app.use('/api/v1/transactions', auth, transactionRoutes);
app.use('/api/v1/contact', contactRoutes);
// Alias route for Meta Facebook Pages (same handler as companies route)
app.get('/api/v1/meta/facebook-pages', auth, getFacebookPages);

// Welcome route for root
app.get('/', (req, res) => {
  res.send('Welcome to the Real Estate LMS + CRM API! Visit <a href="/api-docs">/api-docs</a> for documentation.');
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware (should be after all other app.use() and routes)
app.use(errorLogger);


const PORT = process.env.PORT || 5002;
const ip = require('ip').address();
console.log(`🚀 Server is running at http://${ip}:${PORT}`);
console.log(`📘 Swagger docs available at http://${ip}:${PORT}/api-docs`);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
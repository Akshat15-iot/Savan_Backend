const Lead = require('../models/Lead');
const PaymentLedger = require('../models/PaymentLedger');
const Project = require('../models/Project');
const User = require('../models/User');
const Call = require('../models/Call');
const Company = require('../models/Company');
const Property = require('../models/Property');

// @desc    Get sales performance report
// @route   GET /api/reports/sales-performance
// @access  Private
const getSalesPerformance = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    if (userId) dateFilter.assignedTo = userId;

    // Lead conversion rates
    const totalLeads = await Lead.countDocuments({ isActive: true, ...dateFilter });
    const convertedLeads = await Lead.countDocuments({ 
      isActive: true, 
      status: 'closed_won',
      ...dateFilter 
    });
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Sales by status
    const leadsByStatus = await Lead.aggregate([
      { $match: { isActive: true, ...dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Sales by source
    const leadsBySource = await Lead.aggregate([
      { $match: { isActive: true, ...dateFilter } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    // Monthly sales trend
    const monthlyTrend = await Lead.aggregate([
      { $match: { isActive: true, status: 'closed_won', ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      leadsByStatus,
      leadsBySource,
      monthlyTrend
    });
  } catch (error) {
    console.error('Get sales performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get source summary report
// @route   GET /api/reports/source-summary
// @access  Private
const getSourceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const sourceSummary = await Lead.aggregate([
      { $match: { isActive: true, ...dateFilter } },
      {
        $group: {
          _id: '$source',
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: {
              $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0]
            }
          },
          totalValue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'closed_won'] },
                { $add: ['$budget.min', '$budget.max'] },
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $multiply: [
              { $divide: ['$convertedLeads', '$totalLeads'] },
              100
            ]
          }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    res.json(sourceSummary);
  } catch (error) {
    console.error('Get source summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user performance report
// @route   GET /api/reports/user-performance
// @access  Private
const getUserPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const userPerformance = await Lead.aggregate([
      { $match: { isActive: true, ...dateFilter } },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$assignedTo',
          userName: { $first: '$user.name' },
          userEmail: { $first: '$user.email' },
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: {
              $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0]
            }
          },
          totalValue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'closed_won'] },
                { $add: ['$budget.min', '$budget.max'] },
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $multiply: [
              { $divide: ['$convertedLeads', '$totalLeads'] },
              100
            ]
          }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    res.json(userPerformance);
  } catch (error) {
    console.error('Get user performance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Stat Cards Data
    const totalLeads = await Lead.countDocuments();
    const newLeadsThisWeek = await Lead.countDocuments({
      createdAt: { $gte: startOfWeek }
    });
    const bookingsDone = await Lead.countDocuments({ status: 'booking_done' });
    const droppedLeads = await Lead.countDocuments({ status: 'dropped' });
    const siteVisits = await Lead.countDocuments({ status: 'site_visit' });

    // Lead source breakdown for pie chart
    const leadsBySource = await Lead.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly trends for area chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrends = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          leads: { $sum: 1 },
          conversions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'booking_done'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Recent call recordings
    const recentCalls = await Call.find()
      .populate('lead', 'firstName lastName')
      .populate('salesperson', 'name')
      .sort({ createdAt: -1 })
      .limit(4);

    // Ledger snapshot
    const totalCollected = await PaymentLedger.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const dueThisWeek = await PaymentLedger.aggregate([
      {
        $match: {
          paymentDate: { 
            $gte: today,
            $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$outstandingBalance' }
        }
      }
    ]);

    const overdue = await PaymentLedger.aggregate([
      {
        $match: {
          paymentDate: { $lt: today },
          outstandingBalance: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$outstandingBalance' }
        }
      }
    ]);

    // Source performance for table
    const sourcePerformance = await Lead.aggregate([
      {
        $group: {
          _id: '$source',
          totalLeads: { $sum: 1 },
          conversions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'booking_done'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          source: '$_id',
          leads: '$totalLeads',
          conversions: '$conversions',
          conversionRate: {
            $multiply: [
              { $divide: ['$conversions', '$totalLeads'] },
              100
            ]
          }
        }
      },
      {
        $sort: { leads: -1 }
      }
    ]);

    // Salesperson performance
    const salespersonPerformance = await Lead.aggregate([
      {
        $match: {
          assignedTo: { $ne: null }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'salesperson'
        }
      },
      {
        $unwind: '$salesperson'
      },
      {
        $group: {
          _id: '$assignedTo',
          name: { $first: '$salesperson.name' },
          totalLeads: { $sum: 1 },
          conversions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'booking_done'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          totalLeads: 1,
          conversions: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$conversions', '$totalLeads'] },
              100
            ]
          }
        }
      },
      {
        $sort: { totalLeads: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Project snapshot
    const projectSnapshot = await Project.find()
      .select('name status isActive')
      .limit(5);

    res.json({
      // Stat cards
      statCards: {
        totalLeads,
        newLeadsThisWeek,
        newLeadsPercentage: totalLeads > 0 ? Math.round((newLeadsThisWeek / totalLeads) * 100) : 0,
        bookingsDone,
        droppedLeads,
        siteVisits,
        siteVisitPercentage: totalLeads > 0 ? Math.round((siteVisits / totalLeads) * 100) : 0
      },
      
      // Charts data
      leadsBySource: leadsBySource.map(item => ({
        name: item._id || 'Unknown',
        value: item.count,
        color: getSourceColor(item._id)
      })),
      
      monthlyTrends: monthlyTrends.map(item => ({
        name: getMonthName(item._id.month),
        Lead: item.leads,
        Conversion: item.conversions
      })),
      
      // Call recordings
      callRecordings: recentCalls.map(call => ({
        name: `Call with ${call.lead?.firstName || 'Unknown'} ${call.lead?.lastName || ''}`,
        time: `${call.salesperson?.name || 'Unknown'} • ${new Date(call.createdAt).toLocaleDateString()} • ${new Date(call.createdAt).toLocaleTimeString()} • ${Math.floor(call.duration / 60)}m ${call.duration % 60}s`,
        recordingUrl: call.recordingUrl,
        id: call._id
      })),
      
      // Ledger snapshot
      ledgerSnapshot: [
        {
          label: 'Total Collected',
          value: `₹${formatCurrency(totalCollected[0]?.total || 0)}`,
          color: '#1976d2'
        },
        {
          label: 'Due This Week',
          value: `₹${formatCurrency(dueThisWeek[0]?.total || 0)}`,
          color: '#fbc02d'
        },
        {
          label: 'Overdue',
          value: `₹${formatCurrency(overdue[0]?.total || 0)}`,
          color: '#e53935'
        }
      ],
      
      // Source performance table
      sourcePerformance: sourcePerformance.map(item => ({
        source: formatSourceName(item.source),
        leads: `${item.leads} leads`,
        conversions: item.conversions,
        conversionRate: `${Math.round(item.conversionRate || 0)}%`
      })),
      
      // Salesperson performance
      salespersonPerformance,
      
      // Project snapshot
      projectSnapshot: projectSnapshot.map(project => ({
        name: project.name,
        status: project.isActive ? 'Active' : 'Inactive'
      }))
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper functions
function getSourceColor(source) {
  const colors = {
    'facebook': '#1976d2',
    'google': '#e53935',
    'walk_in': '#fbc02d',
    'manual': '#8e24aa',
    'referral': '#43a047',
    'csv': '#ff9800'
  };
  return colors[source] || '#757575';
}

function getMonthName(monthNumber) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNumber - 1] || 'Unknown';
}

function formatCurrency(amount) {
  if (amount >= 10000000) { // 1 Crore
    return `${(amount / 10000000).toFixed(1)} Cr`;
  } else if (amount >= 100000) { // 1 Lakh
    return `${(amount / 100000).toFixed(1)} L`;
  } else if (amount >= 1000) { // 1 Thousand
    return `${(amount / 1000).toFixed(1)} K`;
  }
  return amount.toString();
}

function formatSourceName(source) {
  const sourceNames = {
    'facebook': 'Facebook Ads',
    'google': 'Google Ads',
    'walk_in': 'Walk-ins',
    'manual': 'Manual Entry',
    'referral': 'Referrals',
    'csv': 'CSV Upload'
  };
  return sourceNames[source] || source;
}

module.exports = {
  getSalesPerformance,
  getSourceSummary,
  getUserPerformance,
  getDashboardStats
}; 
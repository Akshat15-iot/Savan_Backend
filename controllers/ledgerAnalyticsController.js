const PaymentLedger = require('../models/PaymentLedger');
const Lead = require('../models/Lead');

// @desc    Get ledger analytics
// @route   GET /api/v1/ledger/analytics
// @access  Private
exports.getLedgerAnalytics = async (req, res) => {
  try {
    // Get total collected amount
    const totalCollectedResult = await PaymentLedger.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' }
        }
      }
    ]);

    // Get total due amount (outstanding balances)
    const totalDueResult = await PaymentLedger.aggregate([
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$outstandingBalance' }
        }
      }
    ]);

    // Get overdue payments (payments with outstanding balance > 0)
    const overdueCount = await PaymentLedger.countDocuments({
      outstandingBalance: { $gt: 0 }
    });

    // Get payment mode breakdown
    const paymentModeBreakdown = await PaymentLedger.aggregate([
      {
        $group: {
          _id: '$paymentMode',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    // Get monthly collection trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await PaymentLedger.aggregate([
      {
        $match: {
          paymentDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get recent payments
    const recentPayments = await PaymentLedger.find()
      .populate('leadId', 'firstName lastName phone')
      .sort({ paymentDate: -1 })
      .limit(5);

    // Format currency
    const formatCurrency = (amount) => {
      if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
      } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)} Lakhs`;
      } else {
        return `₹${amount.toLocaleString('en-IN')}`;
      }
    };

    // Format month names
    const getMonthName = (month) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[month - 1];
    };

    res.json({
      success: true,
      data: {
        totalCollected: formatCurrency(totalCollectedResult[0]?.totalCollected || 0),
        totalDue: formatCurrency(totalDueResult[0]?.totalDue || 0),
        overdueCount: overdueCount,
        paymentModeBreakdown: paymentModeBreakdown.map(item => ({
          mode: item._id || 'Unknown',
          count: item.count,
          totalAmount: formatCurrency(item.totalAmount)
        })),
        monthlyTrends: monthlyTrends.map(item => ({
          month: getMonthName(item._id.month),
          year: item._id.year,
          totalAmount: formatCurrency(item.totalAmount),
          count: item.count
        })),
        recentPayments: recentPayments.map(payment => ({
          id: payment._id,
          leadName: payment.leadId ? `${payment.leadId.firstName} ${payment.leadId.lastName}` : 'Unknown',
          phone: payment.leadId?.phone || 'N/A',
          amount: formatCurrency(payment.amount),
          paymentMode: payment.paymentMode,
          paymentDate: payment.paymentDate,
          outstandingBalance: formatCurrency(payment.outstandingBalance)
        }))
      }
    });
  } catch (error) {
    console.error('Get ledger analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get detailed ledger analytics for a specific lead
// @route   GET /api/v1/ledger/analytics/:leadId
// @access  Private
exports.getLeadLedgerAnalytics = async (req, res) => {
  try {
    const { leadId } = req.params;

    // Get all payments for this lead
    const payments = await PaymentLedger.find({ leadId })
      .sort({ paymentDate: -1 });

    if (payments.length === 0) {
      return res.json({
        success: true,
        data: {
          totalCollected: '₹0',
          totalDue: '₹0',
          overdueCount: 0,
          payments: []
        }
      });
    }

    // Calculate analytics
    const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalDue = payments.reduce((sum, payment) => sum + payment.outstandingBalance, 0);
    const overdueCount = payments.filter(payment => payment.outstandingBalance > 0).length;

    // Format currency
    const formatCurrency = (amount) => {
      if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
      } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)} Lakhs`;
      } else {
        return `₹${amount.toLocaleString('en-IN')}`;
      }
    };

    res.json({
      success: true,
      data: {
        totalCollected: formatCurrency(totalCollected),
        totalDue: formatCurrency(totalDue),
        overdueCount: overdueCount,
        payments: payments.map(payment => ({
          id: payment._id,
          amount: formatCurrency(payment.amount),
          paymentMode: payment.paymentMode,
          paymentDate: payment.paymentDate,
          outstandingBalance: formatCurrency(payment.outstandingBalance),
          paymentType: payment.paymentType,
          installmentPlan: payment.installmentPlan
        }))
      }
    });
  } catch (error) {
    console.error('Get lead ledger analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

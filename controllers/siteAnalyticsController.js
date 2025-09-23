const Site = require('../models/Site');
const Item = require('../models/Item');
const Stock = require('../models/Stock');

// @desc    Get site analytics
// @route   GET /api/v1/sites/analytics
// @access  Private
exports.getSiteAnalytics = async (req, res) => {
  try {
    // Get total sites count
    const totalSites = await Site.countDocuments();

    // Get total items count
    const totalItems = await Item.countDocuments();

    // Get total stock count
    const totalStock = await Stock.countDocuments();

    // Get sites by status
    const sitesByStatus = await Site.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get items by category
    const itemsByCategory = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get stock levels (low stock items)
    const lowStockItems = await Stock.aggregate([
      {
        $lookup: {
          from: 'items',
          localField: 'itemId',
          foreignField: '_id',
          as: 'item'
        }
      },
      {
        $unwind: '$item'
      },
      {
        $match: {
          $expr: {
            $lt: ['$quantity', '$item.minStockLevel']
          }
        }
      },
      {
        $count: 'lowStockCount'
      }
    ]);

    // Get recent site activities (last 5 sites created)
    const recentSites = await Site.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('siteName location startDate status createdAt');

    // Get site performance metrics
    const sitePerformance = await Site.aggregate([
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: 'siteId',
          as: 'items'
        }
      },
      {
        $lookup: {
          from: 'stocks',
          localField: '_id',
          foreignField: 'siteId',
          as: 'stocks'
        }
      },
      {
        $project: {
          siteName: 1,
          location: 1,
          status: 1,
          itemCount: { $size: '$items' },
          stockCount: { $size: '$stocks' },
          totalStockValue: {
            $sum: {
              $map: {
                input: '$stocks',
                as: 'stock',
                in: { $multiply: ['$$stock.quantity', '$$stock.unitPrice'] }
              }
            }
          }
        }
      },
      {
        $sort: { totalStockValue: -1 }
      },
      {
        $limit: 5
      }
    ]);

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
        totalSites: totalSites,
        totalItems: totalItems,
        totalStock: totalStock,
        lowStockCount: lowStockItems[0]?.lowStockCount || 0,
        sitesByStatus: sitesByStatus.map(item => ({
          status: item._id || 'Unknown',
          count: item.count
        })),
        itemsByCategory: itemsByCategory.map(item => ({
          category: item._id || 'Unknown',
          count: item.count
        })),
        recentSites: recentSites.map(site => ({
          id: site._id,
          siteName: site.siteName,
          location: site.location,
          startDate: site.startDate,
          status: site.status,
          createdAt: site.createdAt
        })),
        sitePerformance: sitePerformance.map(site => ({
          siteName: site.siteName,
          location: site.location,
          status: site.status,
          itemCount: site.itemCount,
          stockCount: site.stockCount,
          totalStockValue: formatCurrency(site.totalStockValue)
        }))
      }
    });
  } catch (error) {
    console.error('Get site analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get analytics for a specific site
// @route   GET /api/v1/sites/analytics/:siteId
// @access  Private
exports.getSiteSpecificAnalytics = async (req, res) => {
  try {
    const { siteId } = req.params;

    // Get site details
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    // Get items for this site
    const items = await Item.find({ siteId });
    const totalItems = items.length;

    // Get stock for this site
    const stocks = await Stock.find({ siteId });
    const totalStock = stocks.length;

    // Calculate total stock value
    const totalStockValue = stocks.reduce((sum, stock) => {
      return sum + (stock.quantity * stock.unitPrice);
    }, 0);

    // Get low stock items for this site
    const lowStockItems = stocks.filter(stock => {
      const item = items.find(i => i._id.toString() === stock.itemId.toString());
      return item && stock.quantity < item.minStockLevel;
    });

    // Get items by category for this site
    const itemsByCategory = await Item.aggregate([
      { $match: { siteId: site._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

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
        site: {
          id: site._id,
          siteName: site.siteName,
          location: site.location,
          startDate: site.startDate,
          status: site.status
        },
        totalItems: totalItems,
        totalStock: totalStock,
        totalStockValue: formatCurrency(totalStockValue),
        lowStockCount: lowStockItems.length,
        itemsByCategory: itemsByCategory.map(item => ({
          category: item._id || 'Unknown',
          count: item.count
        })),
        lowStockItems: lowStockItems.map(stock => {
          const item = items.find(i => i._id.toString() === stock.itemId.toString());
          return {
            itemName: item?.name || 'Unknown',
            currentStock: stock.quantity,
            minRequired: item?.minStockLevel || 0,
            unitPrice: stock.unitPrice
          };
        })
      }
    });
  } catch (error) {
    console.error('Get site specific analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

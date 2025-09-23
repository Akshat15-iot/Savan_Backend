const express = require('express');
const router = express.Router();
const { getSiteAnalytics, getSiteSpecificAnalytics } = require('../controllers/siteAnalyticsController');
const { auth } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: SiteAnalytics
 *   description: API for managing site analytics
 */

/**
 * @swagger
 * /api/v1/sites/analytics:
 *   get:
 *     summary: Get overall site analytics
 *     description: Returns total sites, items, stocks, low stock items, site performance, and recent activities.
 *     tags: [SiteAnalytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched site analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSites:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 150
 *                     totalStock:
 *                       type: integer
 *                       example: 500
 *                     lowStockCount:
 *                       type: integer
 *                       example: 7
 *                     sitesByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             example: Active
 *                           count:
 *                             type: integer
 *                             example: 5
 *                     itemsByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: Cement
 *                           count:
 *                             type: integer
 *                             example: 40
 *                     recentSites:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           siteName:
 *                             type: string
 *                             example: Site A
 *                           location:
 *                             type: string
 *                             example: New Delhi
 *                           startDate:
 *                             type: string
 *                             format: date
 *                           status:
 *                             type: string
 *                             example: Active
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     sitePerformance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           siteName:
 *                             type: string
 *                             example: Site A
 *                           location:
 *                             type: string
 *                             example: Delhi
 *                           status:
 *                             type: string
 *                             example: Active
 *                           itemCount:
 *                             type: integer
 *                             example: 15
 *                           stockCount:
 *                             type: integer
 *                             example: 50
 *                           totalStockValue:
 *                             type: string
 *                             example: ₹2 Lakhs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, getSiteAnalytics);

/**
 * @swagger
 * /api/v1/sites/analytics/{siteId}:
 *   get:
 *     summary: Get analytics for a specific site
 *     description: Returns detailed analytics for a given site including items, stock, and low stock items.
 *     tags: [SiteAnalytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: siteId
 *         in: path
 *         required: true
 *         description: ID of the site
 *         schema:
 *           type: string
 *           example: 64a8b0f1c3a9c20012e45678
 *     responses:
 *       200:
 *         description: Successfully fetched site-specific analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     site:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         siteName:
 *                           type: string
 *                           example: Site A
 *                         location:
 *                           type: string
 *                           example: Mumbai
 *                         startDate:
 *                           type: string
 *                           format: date
 *                         status:
 *                           type: string
 *                           example: Active
 *                     totalItems:
 *                       type: integer
 *                       example: 20
 *                     totalStock:
 *                       type: integer
 *                       example: 80
 *                     totalStockValue:
 *                       type: string
 *                       example: ₹1.5 Lakhs
 *                     lowStockCount:
 *                       type: integer
 *                       example: 3
 *                     itemsByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: Steel
 *                           count:
 *                             type: integer
 *                             example: 10
 *                     lowStockItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           itemName:
 *                             type: string
 *                             example: Cement Bag
 *                           currentStock:
 *                             type: integer
 *                             example: 5
 *                           minRequired:
 *                             type: integer
 *                             example: 10
 *                           unitPrice:
 *                             type: number
 *                             example: 350.5
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Site not found
 *       500:
 *         description: Server error
 */
router.get('/:siteId', auth, getSiteSpecificAnalytics);

module.exports = router;

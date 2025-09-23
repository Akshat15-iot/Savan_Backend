// routes/activityLogRoutes.js
const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLogController");
const { auth } = require("../middlewares/auth");


/**
* @swagger
* /api/v1/activity-logs:
*   get:
*     summary: Get activity logs
*     description: Admin can see all logs. Salesperson can see only their own logs.
*     tags:
*       - Activity Logs
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: Activity logs fetched successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 logs:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/ActivityLog'
*/
router.get("/", auth, (req, res) => activityLogController.getActivityLogs(req, res));


/**
* @swagger
* /api/v1/activity-logs/user/{userId}:
*   get:
*     summary: Get activity logs for a specific user
*     description: Returns all activity logs performed by the given user.
*     tags:
*       - Activity Logs
*     security:
*       - bearerAuth: []
*     parameters:
*       - in: path
*         name: userId
*         required: true
*         schema:
*           type: string
*         description: User ID to filter logs
*     responses:
*       200:
*         description: Activity logs fetched successfully
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 success:
*                   type: boolean
*                 logs:
*                   type: array
*                   items:
*                     $ref: '#/components/schemas/ActivityLog'
*/
router.get("/user/:userId", auth, activityLogController.getUserActivityLogs);


module.exports = router;

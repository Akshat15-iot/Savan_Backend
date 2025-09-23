const Reminder = require('../models/Reminder');
const ActivityLog = require('../models/ActivityLog');
const Salesperson = require('../models/User');
const sendPushNotification = require('../utils/sendNotification');
const cron = require('node-cron');
const moment = require('moment-timezone'); // timezone-aware

// Create a reminder (POST)
exports.createReminder = async (req, res) => {
  try {
    const { leadName, leadId, type, reminderAt, date, time, notificationType } = req.body;

    // 🔹 Handle reminder datetime (accept either reminderAt or date+time)
    let reminderDateTime;
    if (reminderAt) {
      reminderDateTime = moment.tz(reminderAt, "Asia/Kolkata");
    } else if (date && time) {
      reminderDateTime = moment.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", "Asia/Kolkata");
    } else {
      return res.status(400).json({ success: false, message: 'Missing reminder datetime' });
    }

    if (!reminderDateTime.isValid()) {
      return res.status(400).json({ success: false, message: 'Invalid reminder datetime format' });
    }

    // Save reminder in DB (Mongo stores in UTC automatically)
    const reminder = new Reminder({
      salespersonId: req.user._id,
      leadName,
      leadId,
      type,
      reminderAt: reminderDateTime.toDate(),
      notificationType
    });

    await reminder.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      role: req.user.role,
      method: req.method,
      endpoint: req.originalUrl,
      action: 'Set Reminder',
      description: `User ${req.user.fullName || req.user.email} set a reminder for lead ${leadId} (${leadName}) on ${reminderDateTime.format('YYYY-MM-DD HH:mm')}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 🚀 Schedule push notification if type = Push
    if (notificationType && notificationType.toLowerCase() === 'push') {
      if (reminderDateTime.isAfter(moment.tz("Asia/Kolkata"))) {
        const cronExp = `${reminderDateTime.minutes()} ${reminderDateTime.hours()} ${reminderDateTime.date()} ${reminderDateTime.month() + 1} *`;

        cron.schedule(cronExp, async () => {
          try {
            const salesperson = await Salesperson.findById(req.user._id);
            if (salesperson && salesperson.deviceToken) {
              const title = '⏰ Reminder Alert';
              const body = `Reminder for lead ${leadName} is due now!`;
              const data = {
                leadId: String(leadId),
                notificationType,
                reminderAt: reminderDateTime.toISOString()
              };

              await sendPushNotification(salesperson.deviceToken, title, body, data);
              console.log(`✅ Push notification sent for reminder ${reminder._id}`);
            } else {
              console.warn(`⚠️ No deviceToken found for salesperson ${req.user._id}`);
            }
          } catch (err) {
            console.error('❌ Error while sending scheduled push notification:', err.message);
          }
        });

        console.log(`📅 Push notification scheduled for ${reminderDateTime.format('YYYY-MM-DD HH:mm')} IST`);
      } else {
        console.warn(`⚠️ Reminder time is in the past (IST: ${reminderDateTime.format()}). Push not scheduled.`);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Reminder created and scheduled successfully',
      data: reminder
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Get all reminders for logged-in salesperson (GET)
exports.getMyReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ salespersonId: req.user._id })
      .sort({ reminderAt: 1 })
      .populate('leadId', 'firstName lastName phone email');

    // Return reminders formatted in IST
    const formatted = reminders.map(r => ({
      ...r.toObject(),
      reminderAtIST: moment(r.reminderAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm")
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

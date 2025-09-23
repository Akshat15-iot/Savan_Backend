const admin = require('../firebase');
const Salesperson = require('../models/User');

const sendPushNotification = async (deviceToken, title, body, data = {}) => {
  const message = {
    notification: {
      title,
      body,
    },
    token: deviceToken,
    data: data
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    return response;
  } catch (error) {
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    ) {
      // Remove the invalid deviceToken from any salesperson
      await Salesperson.updateMany({ deviceToken }, { $unset: { deviceToken: '' } });
      console.warn('Removed invalid deviceToken from Salesperson:', deviceToken);
    }
    console.error('Error sending notification:', error);
    throw error;
  }
};

module.exports = sendPushNotification;
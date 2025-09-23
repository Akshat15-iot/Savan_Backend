const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json'); // Place your downloaded service account key here

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
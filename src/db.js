const admin = require("firebase-admin");

// Load the service account key file
const serviceAccount = require("../serviceAccountKey.json");

// Initialize Firebase only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// db = our Firestore database
const db = admin.firestore();

module.exports = { db, admin };

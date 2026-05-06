// Firebase Admin SDK initialization
// Used to verify Firebase ID tokens on the backend
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '..', '..', 'firebase-service-account.json');

let firebaseApp;

try {
  // eslint-disable-next-line import/no-dynamic-require
  const serviceAccount = require(path.resolve(serviceAccountPath));
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (err) {
  console.warn(`⚠️  Firebase Admin SDK failed to init: ${err.message}`);
  console.warn('   Phone OTP verification via Firebase will not work.');
  console.warn(`   Expected service account at: ${serviceAccountPath}`);
}

/**
 * Verify a Firebase ID token and return the decoded token payload.
 * @param {string} idToken  The ID token from the Firebase client SDK
 * @returns {Promise<admin.auth.DecodedIdToken>}
 */
async function verifyIdToken(idToken) {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK is not initialized');
  }
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { verifyIdToken, admin };

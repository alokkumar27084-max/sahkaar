// Firebase Admin SDK initialization.
// Used to verify Firebase ID tokens from the client SDK.
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  || path.join(__dirname, '..', '..', 'firebase-service-account.json');

let firebaseApp;

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    return JSON.parse(json);
  }

  // eslint-disable-next-line import/no-dynamic-require
  return require(path.resolve(serviceAccountPath));
}

try {
  const serviceAccount = loadServiceAccount();
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK initialized');
} catch (err) {
  console.warn(`Firebase Admin SDK failed to init: ${err.message}`);
  console.warn('   Phone OTP and Firebase email-link verification will not work.');
  console.warn('   Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64, or FIREBASE_SERVICE_ACCOUNT_PATH.');
  console.warn(`   Current service account path: ${serviceAccountPath}`);
}

/**
 * Verify a Firebase ID token and return the decoded token payload.
 * @param {string} idToken The ID token from the Firebase client SDK.
 * @returns {Promise<admin.auth.DecodedIdToken>}
 */
async function verifyIdToken(idToken) {
  if (!firebaseApp) {
    const err = new Error('Firebase Admin SDK is not initialized. Configure the backend Firebase service account.');
    err.status = 503;
    throw err;
  }
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { verifyIdToken, admin, isFirebaseAdminReady: () => !!firebaseApp };

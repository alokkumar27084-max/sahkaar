// Firebase client SDK initialization
// Used for Phone Auth (OTP via SMS) and Email Link Auth (passwordless)
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set language to user's browser language
auth.useDeviceLanguage();

export {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
};

export default app;

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheckService } from './appCheck';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize App Check in non-development environments for security
if (!import.meta.env.DEV) {
  initializeAppCheckService(false);
} else {
  // In development, initialize with debug token
  initializeAppCheckService(true);
  // Use the provided debug token
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = '14983A33-5BDE-455F-93F1-9389A930DC6E';
  console.log('Firebase App Check initialized in debug mode with token');
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize analytics only if supported by the browser
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export const FIREBASE_APPCHECK_DEBUG_TOKEN = '14983A33-5BDE-455F-93F1-9389A930DC6E'; // Debug token for App Check

export default app;
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeAppCheckService } from './appCheck';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9_7pVlqoACiviMRNi74LIP4M9DFyxbaQ",
  authDomain: "guardianai-455109.firebaseapp.com",
  projectId: "guardianai-455109",
  storageBucket: "guardianai-455109.firebasestorage.app",
  messagingSenderId: "891154200436",
  appId: "1:891154200436:web:f707da198d835705591e21",
  measurementId: "G-ZQT44LD0X9"
};

console.log('Firebase Config:', firebaseConfig); // Log for debugging

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize App Check in non-development environments for security
if (!import.meta.env.DEV) {
  initializeAppCheckService(app, false);
} else {
  // In development, initialize with debug token
  initializeAppCheckService(app, true);
  // Use the provided debug token - use type assertion to avoid TypeScript error
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = '14983A33-5BDE-455F-93F1-9389A930DC6E';
  console.log('Firebase App Check initialized in debug mode with token');
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize analytics only if supported by the browser
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

// Export debug token for App Check as a constant
export const FIREBASE_APPCHECK_DEBUG_TOKEN = '14983A33-5BDE-455F-93F1-9389A930DC6E';

export default app;
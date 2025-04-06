import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { app } from './config';

/**
 * Initialize Firebase App Check with reCAPTCHA v3
 * This adds an additional layer of security to prevent abuse of your Firebase resources
 */
export const initializeAppCheckService = (isDevelopment = false) => {
  // In development mode, register the debug token
  if (isDevelopment && typeof window !== 'undefined') {
    // Use the specific debug token provided
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = '14983A33-5BDE-455F-93F1-9389A930DC6E';
    console.log('[AppCheck] Initialized with debug token for development');
  }

  try {
    // Initialize AppCheck with reCAPTCHA v3
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        isDevelopment 
          ? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Test key that always passes validation
          : import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Use env variable in production
      ),
      isTokenAutoRefreshEnabled: true
    });

    // Use debug token if in development
    if (import.meta.env.DEV) {
      // No need to set the token again as it's already set above
      console.log('[AppCheck] Using debug token from environment in development mode');
    }

    return appCheck;
  } catch (error) {
    console.error('Failed to initialize App Check:', error);
    // Return null instead of throwing, allowing the app to continue functioning
    return null;
  }
};

/**
 * Get the App Check instance for the app
 * Call this when you need to use App Check for a specific operation
 */
export const getAppCheck = () => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  return initializeAppCheckService(isDevelopment);
};
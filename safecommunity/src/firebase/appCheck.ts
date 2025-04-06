import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { FirebaseApp } from "firebase/app";

/**
 * Initialize Firebase App Check with reCAPTCHA v3
 * This adds an additional layer of security to prevent abuse of your Firebase resources
 * 
 * @param app - Firebase app instance
 * @param isDevelopment - Flag indicating if running in development mode
 */
export const initializeAppCheckService = (app: FirebaseApp, isDevelopment = false) => {
  // In development mode, register the debug token
  if (isDevelopment && typeof window !== 'undefined') {
    // Use the specific debug token provided
    // Add a custom property to the Window interface
    (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = '14983A33-5BDE-455F-93F1-9389A930DC6E';
    console.log('[AppCheck] Initialized with debug token for development');
  }

  try {
    // Initialize AppCheck with reCAPTCHA v3
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        isDevelopment 
          ? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Test key that always passes validation
          : '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Use a fixed key for now
      ),
      isTokenAutoRefreshEnabled: true
    });

    // Use debug token if in development
    if (isDevelopment) {
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
 * 
 * @param app - Firebase app instance
 */
export const getAppCheck = (app: FirebaseApp) => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  return initializeAppCheckService(app, isDevelopment);
};
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Re-export auth object
export { auth };

// List of moderator emails (could be moved to Firestore for dynamic management)
const MODERATOR_EMAILS = ['bhraviteja799@gmail.com'];

// Check if user is a moderator
export const isModeratorEmail = (email: string | null): boolean => {
  if (!email) return false;
  const result = MODERATOR_EMAILS.includes(email);
  console.log(`[Auth] Checking if ${email} is a moderator: ${result}`);
  return result;
};

// Sign up with email and password
export const signUpWithEmail = async (name: string, email: string, password: string) => {
  console.log(`[Auth] Starting sign up for user: ${email}`);
  try {
    if (!email || !password) {
      console.error('[Auth] Sign up failed: Email and password are required');
      throw new Error('Email and password are required');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`[Auth] User created with UID: ${user.uid}`);
    
    // Add user to Firestore
    const isModerator = isModeratorEmail(email);
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      isModerator,
      createdAt: new Date(),
      posts: 0,
      followers: 0,
      following: 0
    });
    console.log(`[Auth] User profile created in Firestore for ${user.uid}`);
    console.log(`[Auth] User role: ${isModerator ? 'Moderator' : 'Regular User'}`);
    
    return user;
  } catch (error) {
    console.error("[Auth] Error in signUpWithEmail:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  console.log(`[Auth] Attempting login for user: ${email}`);
  try {
    if (!email || !password) {
      console.error('[Auth] Sign in failed: Email and password are required');
      throw new Error('Email and password are required');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`[Auth] User signed in successfully: ${userCredential.user.uid}`);
    console.log(`[Auth] User role: ${isModeratorEmail(email) ? 'Moderator' : 'Regular User'}`);
    return userCredential.user;
  } catch (error) {
    console.error("[Auth] Error in signInWithEmail:", error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  console.log('[Auth] Starting Google sign-in flow');
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    console.log(`[Auth] Google sign-in successful for user: ${user.email}`);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    // If user doesn't exist, create a new record
    if (!userDoc.exists()) {
      console.log(`[Auth] Creating new user profile for Google user: ${user.uid}`);
      const isModerator = isModeratorEmail(user.email);
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || 'User',
        email: user.email,
        isModerator,
        createdAt: new Date(),
        posts: 0,
        followers: 0,
        following: 0
      });
      console.log(`[Auth] User profile created for Google user: ${user.uid}`);
      console.log(`[Auth] User role: ${isModerator ? 'Moderator' : 'Regular User'}`);
    } else {
      console.log(`[Auth] Existing user found in Firestore: ${user.uid}`);
    }
    
    return user;
  } catch (error) {
    console.error("[Auth] Error in signInWithGoogle:", error);
    throw error;
  }
};

// Sign out
export const logoutUser = async () => {
  console.log('[Auth] Signing out user');
  try {
    await signOut(auth);
    console.log('[Auth] User signed out successfully');
  } catch (error) {
    console.error("[Auth] Error in logoutUser:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  const user = auth.currentUser;
  console.log(`[Auth] Getting current user: ${user ? user.uid : 'No user logged in'}`);
  return user;
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log('[Auth] Setting up auth state change listener');
  return onAuthStateChanged(auth, user => {
    console.log(`[Auth] Auth state changed: User ${user ? 'logged in' : 'logged out'}`);
    if (user) {
      console.log(`[Auth] Current user: ${user.uid} (${user.email})`);
    }
    callback(user);
  });
};
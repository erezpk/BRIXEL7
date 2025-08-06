// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import './firebase-types';

// Firebase configuration - corrected values (environment variables are swapped)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "brixel7-ed00e.firebaseapp.com",
  projectId: "brixel7-ed00e", // Fixed: was using swapped env var
  storageBucket: "brixel7-ed00e.firebasestorage.app",
  messagingSenderId: "483318017359",
  appId: "1:483318017359:web:3a28590b65f9aeaa8d293a", // Fixed: was using swapped env var
  measurementId: "G-10K9Y627RN"
};

// Debug: Log configuration (remove in production)
console.log('Firebase config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***configured***' : 'missing'
});

// Validate configuration
if (!firebaseConfig.apiKey) {
  console.error('Firebase API key is missing');
}

// Initialize Firebase (prevent duplicate app error)
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    // App already initialized, get the existing instance
    app = initializeApp(firebaseConfig, 'secondary');
  } else {
    throw error;
  }
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Google Sign-In function
export const signInWithGoogle = async (): Promise<any> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get the ID token
    const idToken = await user.getIdToken();
    
    // Send the ID token to your backend
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('Backend authentication failed');
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Sign out function
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Auth state observer
export const observeAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export default app;
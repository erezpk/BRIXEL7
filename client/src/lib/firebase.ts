import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "brixel7-ed00e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: "brixel7-ed00e.firebasestorage.app",
  messagingSenderId: "483318017359",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-10K9Y627RN"
};

// Initialize Firebase - check if already initialized to prevent duplicate app error
import { getApp, getApps } from 'firebase/app';

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Google sign in function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get the ID token
    const idToken = await user.getIdToken();
    
    // Send the ID token to your backend for verification
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with backend');
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { User };
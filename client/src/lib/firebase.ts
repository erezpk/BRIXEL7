import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { auth, googleProvider };

// Sign in with Google
export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

// Handle redirect result
export const handleGoogleRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      const token = await user.getIdToken();
      
      // Send token to backend for verification and user creation/login
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken: token,
          email: user.email,
          name: user.displayName,
          avatar: user.photoURL
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to authenticate with backend');
      }
    }
    return null;
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = () => {
  return signOut(auth);
};

// Auth state observer
export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};
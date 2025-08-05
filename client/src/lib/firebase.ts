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
    console.log('Checking for Google redirect result...');
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log('Google redirect result found:', result.user.email);
      const user = result.user;
      const token = await user.getIdToken();
      
      console.log('Got ID token, sending to backend...');
      
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

      const data = await response.json();
      console.log('Backend response:', data);

      if (response.ok) {
        return data;
      } else {
        console.error('Backend authentication failed:', data);
        throw new Error(data.message || 'Failed to authenticate with backend');
      }
    } else {
      console.log('No Google redirect result found');
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
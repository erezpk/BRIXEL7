
import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDGoJLBzYEsWm3tqDZHXKYvuuDZqJgVEXg",
  authDomain: "brixel7-ed00e.firebaseapp.com",
  projectId: "brixel7-ed00e",
  storageBucket: "brixel7-ed00e.firebasestorage.app",
  messagingSenderId: "483318017359",
  appId: "1:483318017359:web:3a28590b65f9aeaa8d293a",
  measurementId: "G-10K9Y627RN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('email');
provider.addScope('profile');

// Call this function when the user clicks on the "Login" button
export function loginWithGoogle() {
  console.log("Starting Google sign in...");
  return signInWithRedirect(auth, provider);
}

// Call this function on page load when the user is redirected back to your site
export function handleGoogleRedirect() {
  console.log("Checking for Google redirect result...");
  return getRedirectResult(auth)
    .then(async (result) => {
      if (result) {
        const user = result.user;

        console.log("Google redirect result received:", { 
          userEmail: user.email, 
          userName: user.displayName 
        });

        // Send user data to backend for sync
        if (user) {
          try {
            const idToken = await user.getIdToken();
            console.log("Got ID token, sending to backend...");

            const response = await fetch('/api/auth/google', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ 
                idToken,
                email: user.email,
                name: user.displayName,
                picture: user.photoURL
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log("Backend authentication successful:", data);
              return { success: true, user: data.user };
            } else {
              const errorData = await response.json();
              console.error('Backend authentication failed:', errorData);
              throw new Error(errorData.message || 'Authentication failed');
            }
          } catch (fetchError) {
            console.error('Error communicating with backend:', fetchError);
            throw fetchError;
          }
        }
      } else {
        console.log("No Google redirect result found");
        return null;
      }
    })
    .catch((error) => {
      console.error("Google redirect error:", error);
      throw error;
    });
}

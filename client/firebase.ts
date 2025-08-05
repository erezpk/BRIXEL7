import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// Call this function when the user clicks on the "Login" button
export function loginWithGoogle() {
  console.log("Google login button clicked");
  console.log("Starting Google sign in...");
  signInWithRedirect(auth, provider).catch((error) => {
    console.error("Google sign in error:", error);
    console.error("Google authentication failed:", error);
  });
}

// Call this function on page load when the user is redirected back to your site
export function handleGoogleRedirect() {
  console.log("Checking for Google redirect result...");
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        // This gives you a Google Access Token. You can use it to access Google APIs.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;

        // The signed-in user info.
        const user = result.user;
        console.log("Google login successful:", user);
        
        // Send the ID token to your backend
        if (user) {
          user.getIdToken().then((idToken) => {
            // Send this token to your backend
            fetch('/api/auth/google', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ idToken }),
            }).then(response => {
              if (response.ok) {
                // Redirect to dashboard
                window.location.href = '/dashboard';
              } else {
                console.error('Backend authentication failed');
              }
            });
          });
        }
      } else {
        console.log("No Google redirect result found");
      }
    })
    .catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData?.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Google redirect error:", error);
    });
}
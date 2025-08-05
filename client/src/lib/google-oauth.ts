// Simple Google OAuth without Firebase
declare global {
  interface Window {
    google: any;
  }
}

// Load Google OAuth script
export const loadGoogleOAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google OAuth'));
    document.head.appendChild(script);
  });
};

// Initialize Google OAuth
export const initializeGoogleOAuth = async () => {
  await loadGoogleOAuth();
  
  window.google.accounts.id.initialize({
    client_id: "176530780857-crhjjri5cqa1cbcafd8ul795347n22s2.apps.googleusercontent.com",
    callback: handleCredentialResponse,
  });
};

// Handle Google OAuth response
const handleCredentialResponse = async (response: any) => {
  try {
    const { credential } = response;
    
    // Send credential to backend for verification
    const backendResponse = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ idToken: credential }),
    });

    if (!backendResponse.ok) {
      throw new Error('Failed to authenticate with backend');
    }

    const userData = await backendResponse.json();
    
    // Reload page to update authentication state
    window.location.reload();
    
    return userData;
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  await initializeGoogleOAuth();
  
  return new Promise((resolve, reject) => {
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // If popup is blocked, try the popup method
        window.google.accounts.oauth2.initTokenClient({
          client_id: "176530780857-crhjjri5cqa1cbcafd8ul795347n22s2.apps.googleusercontent.com",
          scope: 'email profile',
          callback: async (response: any) => {
            try {
              // Get user info using the access token
              const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
              const userInfo = await userInfoResponse.json();
              
              // Create a simple ID token structure for backend
              const simpleToken = btoa(JSON.stringify({
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                email_verified: userInfo.verified_email
              }));
              
              // Send to backend
              const backendResponse = await fetch('/api/auth/google-simple', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ userInfo, token: simpleToken }),
              });

              if (!backendResponse.ok) {
                throw new Error('Failed to authenticate with backend');
              }

              const userData = await backendResponse.json();
              resolve(userData);
              
              // Reload page to update authentication state
              setTimeout(() => window.location.reload(), 100);
              
            } catch (error) {
              reject(error);
            }
          }
        }).requestAccessToken();
      }
    });
  });
};
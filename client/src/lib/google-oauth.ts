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

// Get client ID from environment - using a generic one for localhost/dev
const getClientId = () => {
  // Generic Google Client ID that works with localhost and common dev domains
  return "1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com";
};

// Initialize Google OAuth
export const initializeGoogleOAuth = async () => {
  await loadGoogleOAuth();
  
  window.google.accounts.id.initialize({
    client_id: getClientId(),
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

// Sign in with Google - simple popup method
export const signInWithGoogle = async () => {
  await loadGoogleOAuth();
  
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: getClientId(),
      scope: 'email profile',
      callback: async (response: any) => {
        try {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          // Get user info using the access token
          const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
          const userInfo = await userInfoResponse.json();
          
          // Send to backend
          const backendResponse = await fetch('/api/auth/google-simple', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ userInfo }),
          });

          if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error(errorText || 'Failed to authenticate with backend');
          }

          const userData = await backendResponse.json();
          resolve(userData);
          
        } catch (error) {
          console.error('Google OAuth error:', error);
          reject(error);
        }
      }
    });
    
    // Request access token - this will open Google popup
    client.requestAccessToken();
  });
};
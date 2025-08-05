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
  // Replace this with your actual Google OAuth Client ID from Google Cloud Console
  return "YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com";
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
export const signInWithGoogle = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Mock successful Google authentication for development
    const mockUserInfo = {
      email: "test@example.com",
      name: "משתמש דוגמה",
      picture: "https://via.placeholder.com/150"
    };

    // Send to our backend
    fetch('/api/auth/google-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userInfo: mockUserInfo }),
    })
    .then(async (backendResponse) => {
      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Authentication failed: ${errorText}`);
      }
      return backendResponse.json();
    })
    .then((result) => {
      resolve(result);
    })
    .catch((error) => {
      reject(error);
    });
  });
};
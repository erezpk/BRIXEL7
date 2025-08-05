import { OAuth2Client } from 'google-auth-library';

// Use the correct Google Client ID for OAuth2Client
const client = new OAuth2Client(process.env.VITE_FIREBASE_API_KEY);

export async function verifyGoogleToken(idToken: string) {
  try {
    if (!process.env.VITE_FIREBASE_API_KEY) {
      console.error('VITE_FIREBASE_API_KEY is not configured');
      return null;
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.VITE_FIREBASE_API_KEY
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      console.error('No payload in Google token');
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified: payload.email_verified
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}
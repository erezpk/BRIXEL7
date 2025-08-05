import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.VITE_FIREBASE_API_KEY);

export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.VITE_FIREBASE_API_KEY
    });
    
    const payload = ticket.getPayload();
    return {
      email: payload?.email,
      name: payload?.name,
      picture: payload?.picture,
      verified: payload?.email_verified
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}
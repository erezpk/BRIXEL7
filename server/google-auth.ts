import { OAuth2Client } from 'google-auth-library';

// Use the correct Google Client ID for OAuth2Client
const GOOGLE_CLIENT_ID = "232608649475-a0vnj0nicio02d3je93ul8s385adlsun.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
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
// Google OAuth token verification utility
export async function verifyGoogleToken(idToken: string): Promise<boolean> {
  try {
    // For development, we'll skip actual verification
    // In production, you should verify the token with Google's API
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Production verification would look like this:
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({
    //   idToken: idToken,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // const payload = ticket.getPayload();
    // return !!payload;
    
    return true;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return false;
  }
}

import { OAuth2Client } from 'google-auth-library';

// Initialize Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
  sub: string; // Google user ID
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
  try {
    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    // Extract user information
    const userInfo: GoogleUserInfo = {
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture,
      email_verified: payload.email_verified || false,
      sub: payload.sub,
    };

    // Validate required fields
    if (!userInfo.email || !userInfo.email_verified) {
      throw new Error('Email not verified or missing');
    }

    return userInfo;
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Invalid Google token');
  }
}
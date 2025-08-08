import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { insertChatConversationSchema, insertChatMessageSchema, insertChatSettingsSchema } from "@shared/schema";
import { insertUserSchema, insertAgencySchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertTaskCommentSchema, insertDigitalAssetSchema, insertClientCardTemplateSchema, insertClientSettingsSchema, insertProductSchema, insertQuoteSchema, insertContractSchema, insertInvoiceSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import express from "express";
import { emailService } from "./email-service.js";
import crypto from 'crypto';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
import { ObjectPermission } from './objectAcl';
import { generateQuotePDF } from './pdf-generator';
import { google } from 'googleapis';
import { setupAuth, isAuthenticated } from "./replitAuth";
import subscriptionsRouter from "./routes/subscriptions";
import facebookAdsRouter from "./routes/facebook-ads";

// Placeholder for generateId function
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Extend Express types for Replit Auth
declare global {
  namespace Express {
    interface User {
      claims?: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
      };
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

const router = express.Router();

// Helper middleware functions
function requireAuth(req: any, res: any, next: any) {
  if (!req.user?.claims) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

function requireUserWithAgency(req: any, res: any, next: any) {
  // For now, just check if user is authenticated
  // We'll add agency association later
  if (!req.user?.claims) {
    return res.status(403).json({ message: 'Agency access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes for both systems
  router.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  router.get('/api/auth/me', async (req: any, res) => {
    try {
      // console.log('Auth check - Session:', !!req.session?.user, 'Replit:', !!req.user, 'isAuthenticated:', req.isAuthenticated?.());
      
      // Check traditional session first
      if (req.session?.user?.id) {
        const user = await storage.getUser(req.session.user.id);
        if (user) {
          // console.log('Found user via session:', user.email);
          return res.json({ user });
        }
      }
      
      // Check Replit Auth
      if (req.isAuthenticated?.() && req.user?.id) {
        const user = await storage.getUser(req.user.id);
        if (user) {
          // console.log('Found user via Replit:', user.email);
          return res.json({ user });
        }
      }
      
      // Check claims-based auth
      const userClaims = req.user?.claims || req.session?.user?.claims;
      if (userClaims?.sub) {
        const user = await storage.getUser(userClaims.sub);
        if (user) {
          // console.log('Found user via claims:', user.email);
          return res.json({ user });
        }
      }
      
      // console.log('No authenticated user found');
      return res.status(401).json({ message: 'Unauthorized' });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Traditional login/signup (for password users)
  router.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'אימייל וסיסמה נדרשים' });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }
      
      const isValidPassword = await storage.validatePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }
      
      // Save to session for traditional login
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        agencyId: user.agencyId
      };
      
      // Also set req.user for compatibility
      (req as any).user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        agencyId: user.agencyId
      };
      
      // Save session
      await new Promise((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
      
      // console.log('Login successful for:', user.email);
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          agencyId: user.agencyId
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'שגיאה בהתחברות' });
    }
  });

  // Logout endpoint
  router.post('/api/auth/logout', async (req: any, res) => {
    try {
      // Clear session
      if (req.session?.user) {
        req.session.user = null;
      }
      
      // Clear req.user
      req.user = null;
      
      // Destroy session
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });
      
      res.json({ success: true, message: 'התנתק בהצלחה' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'שגיאה בהתנתקות' });
    }
  });

  // Password reset request
  router.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'אימייל נדרש' });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({ message: 'אם האימייל קיים, נשלח לינק לאיפוס סיסמה' });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      await storage.createPasswordResetToken(user.id, resetToken);
      
      // Send email
      const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`;
      const emailSent = await emailService.sendEmail({
        to: email,
        subject: 'איפוס סיסמה - AgencyCRM',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>איפוס סיסמה</h2>
            <p>קיבלנו בקשה לאיפוס סיסמה עבור החשבון שלך.</p>
            <p>אם ביקשת את איפוס הסיסמה, לחץ על הקישור הבא:</p>
            <a href="${resetUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
              איפוס סיסמה
            </a>
            <p>הקישור תקף ל-24 שעות.</p>
            <p>אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו.</p>
          </div>
        `
      });
      
      if (emailSent) {
        res.json({ message: 'אם האימייל קיים, נשלח לינק לאיפוס סיסמה' });
      } else {
        res.status(500).json({ message: 'שגיאה בשליחת האימייל' });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'שגיאה בבקשת איפוס סיסמה' });
    }
  });

  // Password reset completion
  router.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: 'טוקן וסיסמה נדרשים' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
      }
      
      // Validate token
      const userId = await storage.validatePasswordResetToken(token);
      if (!userId) {
        return res.status(400).json({ message: 'טוקן לא תקין או פג תוקף' });
      }
      
      // Hash new password
      const hashedPassword = await storage.hashPassword(password);
      
      // Update password
      await storage.updateUserPassword(userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);
      
      res.json({ message: 'הסיסמה שונתה בהצלחה' });
    } catch (error) {
      console.error('Password reset completion error:', error);
      res.status(500).json({ message: 'שגיאה בשינוי הסיסמה' });
    }
  });

  // Google OAuth routes
  router.get('/api/auth/google', (req, res) => {
    const authUrl = `https://accounts.google.com/oauth2v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback')}&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `response_type=code&` +
      `access_type=offline`;
    
    res.redirect(authUrl);
  });

  router.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.redirect('/login?error=no_code');
      }
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
        }),
      });
      
      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        return res.redirect('/login?error=token_error');
      }
      
      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
      
      const googleUser = await userResponse.json();
      
      // Find or create user
      let user = await storage.getUserByEmail(googleUser.email);
      
      if (!user) {
        // Create new user without password (OAuth user)
        user = await storage.upsertUser({
          id: crypto.randomUUID(),
          email: googleUser.email,
          fullName: googleUser.name,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          profileImageUrl: googleUser.picture
        });
      }
      
      // Create session
      (req as any).user = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl
        }
      };
      
      res.redirect('/');
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/login?error=callback_error');
    }
  });

  // Agency routes
  router.get('/api/agencies', requireAuth, async (req, res) => {
    try {
      // For now, return empty array or implement agency listing
      res.json([]);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      res.status(500).json({ message: 'שגיאה בטעינת סוכנויות' });
    }
  });

  // Client routes
  router.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
      // For now, return empty array since we're transitioning auth
      res.json([]);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ message: 'שגיאה בטעינת לקוחות' });
    }
  });

  router.post('/api/clients', isAuthenticated, async (req, res) => {
    try {
      // For testing, use a dummy agency ID
      const clientData = insertClientSchema.parse({
        ...req.body,
        agencyId: "407ab060-c765-4347-8233-0e7311a7adde" // Use existing agency ID
      });
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ message: 'שגיאה ביצירת לקוח' });
    }
  });

  router.get('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const { id } = req.params;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }
      res.json(client);
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({ message: 'שגיאה בטעינת לקוח' });
    }
  });

  router.put('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const client = await storage.updateClient(id, updates);
      res.json(client);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ message: 'שגיאה בעדכון לקוח' });
    }
  });

  router.delete('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ message: 'שגיאה במחיקת לקוח' });
    }
  });

  // Users routes
  router.get('/api/users', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const users = await storage.getUsersByAgency(user.agencyId!);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'שגיאה בטעינת משתמשים' });
    }
  });

  // Mount the router to the app - auth routes must come first
  app.use('/', router);
  app.use("/api/subscriptions", subscriptionsRouter);
  app.use("/api/ads/facebook", facebookAdsRouter);

  const httpServer = createServer(app);

  // Setup WebSocket server
  setupWebSocketServer(httpServer, storage);

  return httpServer;
}
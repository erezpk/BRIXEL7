import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifyGoogleToken } from "./google-auth";
import { db } from "./db";
import { users } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {

  // Google OAuth route
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken, email, name, picture } = req.body;

      if (!email || !name) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      console.log('Google auth attempt for:', email);

      // Verify Google token
      let verified = null;
      if (idToken) {
        verified = await verifyGoogleToken(idToken);
      }
      
      // In development, allow bypassing verification
      if (!verified && process.env.NODE_ENV !== 'development') {
        return res.status(401).json({ message: 'טוקן Google לא תקין' });
      }

      // Create or update user in local database
      const user = await storage.createOrUpdateUserFromGoogle(email, name, picture);

      console.log('Google auth successful for user:', email);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar
        }
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({ message: 'שגיאה בהתחברות Google' });
    }
  });

  // Sync users endpoint
  app.post('/api/dev/sync-users', async (req, res) => {
    try {
      const result = await storage.syncAllUsersWithFirebase();
      res.json(result);
    } catch (error) {
      console.error('Error syncing users:', error);
      res.status(500).json({ message: 'שגיאה בסנכרון משתמשים' });
    }
  });

  // Regular login route (for users with password)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'אימייל וסיסמה נדרשים' });
      }

      console.log('Login attempt for email:', email);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found for email:', email);
        return res.status(401).json({ message: 'פרטי התחברות שגויים' });
      }

      console.log('User found:', user.email, 'has password:', !!user.password);

      // Check if user has a password (regular signup) or was created via Google
      if (!user.password) {
        console.log('User has no password (Google sign-in user):', email);
        return res.status(401).json({
          message: 'משתמש זה נרשם דרך Google. אנא התחבר דרך Google.',
          requiresGoogleAuth: true
        });
      }

      // Verify password with bcrypt
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.default.compare(password, user.password);

      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ message: 'פרטי התחברות שגויים' });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      console.log('Login successful for user:', email);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'שגיאה בהתחברות' });
    }
  });

  // Create test user endpoint (development only)
  app.post('/api/create-test-user', async (req, res) => {
    try {
      const { email, fullName, password, role } = req.body;

      if (!email || !fullName || !password) {
        return res.status(400).json({ message: 'כל השדות נדרשים' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'משתמש עם האימייל הזה כבר קיים' });
      }

      const user = await storage.createUserWithPassword(email, fullName, password, role || 'client');

      res.json({
        success: true,
        message: 'משתמש נוצר בהצלחה',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('Error creating test user:', error);
      if (error.code === '23505') {
        return res.status(400).json({ message: 'משתמש עם האימייל הזה כבר קיים' });
      }
      res.status(500).json({ message: 'שגיאה ביצירת משתמש' });
    }
  });

  // Debug endpoints (development only)
  app.get('/api/dev/users', async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      console.log('All users in database:', allUsers.length);
      res.json({
        success: true,
        count: allUsers.length,
        users: allUsers.map(user => ({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          hasPassword: !!user.password,
          createdAt: user.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'שגיאה בקבלת משתמשים' });
    }
  });

  app.post('/api/dev/create-user', async (req, res) => {
    try {
      console.log('Development user creation request received');

      // Check if user already exists
      const existingUser = await storage.getUserByEmail('errz190@gmail.com');
      if (existingUser) {
        console.log('User already exists:', existingUser.email);
        return res.json({
          success: true,
          message: 'משתמש כבר קיים',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            fullName: existingUser.fullName,
            role: existingUser.role
          }
        });
      }

      const user = await storage.createUserWithPassword(
        'errz190@gmail.com',
        'Test User',
        '123456',
        'team_member'
      );

      console.log('User created successfully in route');

      res.json({
        success: true,
        message: 'משתמש נוצר בהצלחה',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('Detailed error creating test user:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });

      if (error.code === '23505' || error.message?.includes('unique')) {
        return res.status(400).json({ message: 'משתמש כבר קיים' });
      }

      res.status(500).json({
        message: 'שגיאה ביצירת משתמש',
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
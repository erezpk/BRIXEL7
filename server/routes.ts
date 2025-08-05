import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { firebaseSync } from "./firebase-sync";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {

  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for:', email);

      if (!email || !password) {
        return res.status(400).json({ message: 'אנא הזן אימייל וסיסמה' });
      }

      // Check if user exists in local database
      const user = await storage.getUserByEmail(email);

      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }

      console.log('User found:', user.email, 'Has password:', !!user.password);

      // Check if user has a password (not a Google-only user)
      if (!user.password) {
        return res.status(401).json({ message: 'משתמש זה נדרש להתחבר דרך Google' });
      }

      // Verify password
      console.log('Comparing password for user:', email);
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isValidPassword);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }

      // Remove password from user object before sending
      const { password: _, ...userWithoutPassword } = user;

      res.json({ 
        success: true, 
        message: 'התחברות בוצעה בהצלחה',
        user: userWithoutPassword 
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'שגיאה פנימית בשרת' });
    }
  });

  // Firebase sync route (admin only)
  app.post('/api/admin/firebase-sync', async (req, res) => {
    try {
      console.log('Starting Firebase sync...');
      await firebaseSync.syncAllData();
      res.json({ 
        success: true, 
        message: 'All data synced to Firebase successfully' 
      });
    } catch (error) {
      console.error('Firebase sync error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to sync data to Firebase',
        error: error.message 
      });
    }
  });

  // Create user route (for testing)
  app.post('/api/auth/create-user', async (req, res) => {
    try {
      const { email, fullName, password, role = 'admin' } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'חסרים פרטים נדרשים' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'משתמש עם האימייל הזה כבר קיים' });
      }

      // Create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        fullName,
        password: hashedPassword,
        role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json({ 
        success: true,
        message: 'משתמש נוצר בהצלחה',
        user: userWithoutPassword 
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'שגיאה ביצירת משתמש' });
    }
  });

  // Check users route (for debugging)
  app.get('/api/users/check', async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
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
      console.error('Check users error:', error);
      res.status(500).json({ message: 'שגיאה בבדיקת משתמשים' });
    }
  });

  // Delete user route (for debugging)
  app.delete('/api/users/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const result = await storage.deleteUserByEmail(email);
      res.json({ 
        success: true,
        message: 'משתמש נמחק בהצלחה',
        result 
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'שגיאה במחיקת משתמש' });
    }
  });

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all users (development endpoint)
  app.get('/api/dev/users', async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
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

  // Create test user
  app.post('/api/dev/create-user', async (req, res) => {
    try {
      // Delete existing user first
      await storage.deleteUserByEmail('test@example.com');

      const user = await storage.createUserWithPassword(
        'test@example.com',
        'Test User',
        '123456',
        'team_member'
      );

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
      res.status(500).json({
        message: 'שגיאה ביצירת משתמש',
        error: error.message
      });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'אימייל וסיסמה נדרשים' });
      }

      console.log('Login attempt for:', email);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found for email:', email);
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }

      console.log('User found:', user.email, 'Has password:', !!user.password);

      if (!user.password) {
        console.log('User has no password:', email);
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }

      // Verify password
      console.log('Comparing password for user:', email);
      const isValidPassword = await storage.validatePassword(password, user.password);
      console.log('Password valid:', isValidPassword);

      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }

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

  // Register endpoint  
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, fullName, password } = req.body;

      if (!email || !fullName || !password) {
        return res.status(400).json({ message: 'כל השדות נדרשים' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'משתמש עם האימייל הזה כבר קיים' });
      }

      const user = await storage.createUserWithPassword(email, fullName, password, 'team_member');

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
      console.error('Register error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ message: 'משתמש עם האימייל הזה כבר קיים' });
      }
      res.status(500).json({ message: 'שגיאה ביצירת משתמש' });
    }
  });

  // Google authentication endpoint
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken, email, name, picture } = req.body;

      console.log('Google auth request:', { email, name, hasToken: !!idToken });

      if (!email || !name) {
        console.error('Missing required fields:', { hasEmail: !!email, hasName: !!name });
        return res.status(400).json({ message: 'נתונים חסרים' });
      }

      // Check if user exists, if not create them
      let user = await storage.getUserByEmail(email);

      if (!user) {
        console.log('Creating new user from Google auth');
        // Create new user from Google auth
        const newUserData = {
          email,
          fullName: name,
          password: '', // No password for Google users
          role: 'team_member' as const,
          agencyId: null,
          avatar: picture,
          isActive: true
        };

        user = await storage.createUser(newUserData);
      } else {
        console.log('Existing user found, updating last login');
        // Update existing user's last login and avatar if provided
        await storage.updateUser(user.id, { 
          lastLogin: new Date(),
          ...(picture && { avatar: picture })
        });
      }

      console.log('User created/updated:', { userId: user.id, email: user.email });

      res.json({ 
        success: true, 
        message: 'התחברת בהצלחה עם Google',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar || picture
        }
      });

    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({ message: 'שגיאה בהתחברות עם Google' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
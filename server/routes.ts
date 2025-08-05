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

  const httpServer = createServer(app);
  return httpServer;
}
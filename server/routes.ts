import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { firebaseSync } from "./firebase-sync";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {

  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'אנא הזן אימייל וסיסמה' });
      }

      // Check if user exists in local database
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }

      // Check if user has a password (not a Google-only user)
      if (!user.password) {
        return res.status(401).json({ message: 'משתמש זה נדרש להתחבר דרך Google' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
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

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
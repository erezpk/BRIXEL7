import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { verifyGoogleToken } from "./google-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Google OAuth route
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken, email, name, avatar } = req.body;
      
      if (!idToken || !email || !name) {
        return res.status(400).json({ message: 'נתונים חסרים' });
      }

      // Verify Google token (for production - currently bypassed for development)
      const verified = await verifyGoogleToken(idToken);
      if (!verified && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ message: 'טוקן Google לא תקין' });
      }

      // Create or get user
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.createOrUpdateUserFromGoogle(email, name, avatar);
      } else {
        // Update existing user
        user = await storage.createOrUpdateUserFromGoogle(email, name, avatar);
      }

      // Create session or token for the user
      req.login = req.login || ((user: any, callback: any) => callback(null));
      
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Login route for regular auth
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'אימייל וסיסמה נדרשים' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'פרטי התחברות שגויים' });
      }

      // Verify password (you'll need to implement password hashing)
      const bcrypt = require('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password || '');
      
      if (!isValidPassword) {
        return res.status(401).json({ message: 'פרטי התחברות שגויים' });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

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

  // Protected routes
  app.get("/api/protected", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    res.json({ message: "Protected route", userId });
  });

  const httpServer = createServer(app);
  return httpServer;
}
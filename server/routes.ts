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

      console.log('Login attempt for email:', email);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found for email:', email);
        return res.status(401).json({ message: 'פרטי התחברות שגויים' });
      }

      console.log('User found:', user.email, 'has password:', !!user.password);

      // For development - if no password is set, allow any password
      if (!user.password && process.env.NODE_ENV === 'development') {
        console.log('Development mode: allowing login without password verification');
      } else {
        // Verify password with bcrypt
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password || '');
        
        if (!isValidPassword) {
          console.log('Invalid password for user:', email);
          return res.status(401).json({ message: 'פרטי התחברות שגויים' });
        }
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

  // Route to create test user (development only)
  app.post('/api/create-test-user', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Not allowed in production' });
    }

    try {
      const { email, fullName, password, role } = req.body;
      
      if (!email || !fullName || !password) {
        return res.status(400).json({ message: 'כל השדות נדרשים' });
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
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: 'משתמש עם האימייל הזה כבר קיים' });
      }
      res.status(500).json({ message: 'שגיאה ביצירת משתמש' });
    }
  });

  // Quick endpoint to create the specific user from the error
  app.post('/api/dev/create-user', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Not allowed in production' });
    }

    try {
      const user = await storage.createUserWithPassword(
        'errz190@gmail.com', 
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
      if (error.code === '23505') {
        return res.status(400).json({ message: 'משתמש כבר קיים' });
      }
      res.status(500).json({ message: 'שגיאה ביצירת משתמש' });
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
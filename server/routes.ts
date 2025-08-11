import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { insertChatConversationSchema, insertChatMessageSchema, insertChatSettingsSchema } from "@shared/schema";
import { insertUserSchema, insertAgencySchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertTaskCommentSchema, insertDigitalAssetSchema, insertClientCardTemplateSchema, insertClientSettingsSchema, insertProductSchema, insertQuoteSchema, insertContractSchema, insertInvoiceSchema, insertPaymentSchema, insertLeadSchema } from "@shared/schema";
import { z } from "zod";
import express from "express";
import session from "express-session";
import { emailService } from "./email-service.js";
import crypto from 'crypto';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
import { ObjectPermission } from './objectAcl';
import { generateQuotePDF } from './pdf-generator';
import { google } from 'googleapis';
import { setupAuth, isAuthenticated } from "./replitAuth";
import subscriptionsRouter from "./routes/subscriptions";
import facebookAdsRouter from "./routes/facebook-ads";
import { requireAuth as authMiddleware, requireAgencyAccess, requireUserWithAgency as requireAgency, requireRole } from "./middleware/auth";

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

// Helper middleware functions (keeping for compatibility)
function requireAuthOld(req: any, res: any, next: any) {
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
  // Configure session middleware with simple in-memory store for now
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-' + Math.random().toString(36),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Traditional session-only auth - no Replit/Google auth
  
  // Simple auth check endpoint
  router.get('/api/auth/me', async (req: any, res) => {
    try {
      // Only check traditional session
      if (req.session?.user?.id) {
        const user = await storage.getUser(req.session.user.id);
        if (user) {
          return res.json({ user });
        }
      }
      
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
      
      console.log('Attempting login for email:', email);
      const user = await storage.getUserByEmail(email);
      console.log('User found:', !!user);
      console.log('User has password:', !!user?.password);
      if (!user || !user.password) {
        return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
      }
      
      console.log('Validating password for:', user.email);
      console.log('Password hash exists:', !!user.password);
      const isValidPassword = await storage.validatePassword(password, user.password);
      console.log('Password valid:', isValidPassword);
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
  router.get('/api/agencies', authMiddleware, async (req, res) => {
    try {
      // For now, return empty array or implement agency listing
      res.json([]);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      res.status(500).json({ message: 'שגיאה בטעינת סוכנויות' });
    }
  });

  // Client routes
  router.get('/api/clients', authMiddleware, async (req: any, res) => {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        return res.status(400).json({ message: 'לא נמצא מזהה סוכנות' });
      }

      const clients = await storage.getClientsByAgency(agencyId);
      res.json(clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ message: 'שגיאה בטעינת לקוחות' });
    }
  });

  router.post('/api/clients', authMiddleware, async (req: any, res) => {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        return res.status(400).json({ message: 'לא נמצא מזהה סוכנות' });
      }

      const clientData = insertClientSchema.parse({
        ...req.body,
        agencyId: agencyId
      });
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ message: 'שגיאה ביצירת לקוח' });
    }
  });

  router.get('/api/clients/:id', authMiddleware, requireAgency, async (req, res) => {
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

  router.put('/api/clients/:id', authMiddleware, requireAgency, async (req, res) => {
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

  router.delete('/api/clients/:id', authMiddleware, requireAgency, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ message: 'שגיאה במחיקת לקוח' });
    }
  });

  // Leads routes
  router.get('/api/leads', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde"; // Fallback to test agency
      const leads = await storage.getLeadsByAgency(agencyId);
      res.json(leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: 'שגיאה בטעינת לידים' });
    }
  });

  router.post('/api/leads', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const leadData = insertLeadSchema.parse({
        ...req.body,
        agencyId: agencyId
      });
      const lead = await storage.createLead(leadData);
      res.json(lead);
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ message: 'שגיאה ביצירת ליד' });
    }
  });

  router.get('/api/leads/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ message: 'ליד לא נמצא' });
      }
      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ message: 'שגיאה בטעינת ליד' });
    }
  });

  router.put('/api/leads/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const lead = await storage.updateLead(id, updates);
      res.json(lead);
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ message: 'שגיאה בעדכון ליד' });
    }
  });

  router.delete('/api/leads/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLead(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ message: 'שגיאה במחיקת ליד' });
    }
  });

  // Projects routes
  router.get('/api/projects', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const projects = await storage.getProjectsByAgency(agencyId);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: 'שגיאה בטעינת פרויקטים' });
    }
  });

  router.post('/api/projects', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const projectData = insertProjectSchema.parse({
        ...req.body,
        agencyId: agencyId
      });
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ message: 'שגיאה ביצירת פרויקט' });
    }
  });

  router.get('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: 'פרויקט לא נמצא' });
      }
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ message: 'שגיאה בטעינת פרויקט' });
    }
  });

  router.put('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: 'שגיאה בעדכון פרויקט' });
    }
  });

  router.delete('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProject(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ message: 'שגיאה במחיקת פרויקט' });
    }
  });

  // Tasks routes
  router.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const tasks = await storage.getTasksByAgency(agencyId);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ message: 'שגיאה בטעינת משימות' });
    }
  });

  router.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const taskData = insertTaskSchema.parse({
        ...req.body,
        agencyId: agencyId
      });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'שגיאה ביצירת משימה' });
    }
  });

  router.get('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: 'משימה לא נמצאה' });
      }
      res.json(task);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ message: 'שגיאה בטעינת משימה' });
    }
  });

  router.put('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const task = await storage.updateTask(id, updates);
      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'שגיאה בעדכון משימה' });
    }
  });

  router.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTask(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'שגיאה במחיקת משימה' });
    }
  });

  // Dashboard stats routes
  router.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      
      // Get counts for dashboard
      const leads = await storage.getLeadsByAgency(agencyId);
      const clients = await storage.getClientsByAgency(agencyId);
      const projects = await storage.getProjectsByAgency(agencyId);
      const tasks = await storage.getTasksByAgency(agencyId);

      const stats = {
        leads: leads.length,
        clients: clients.length,
        projects: projects.length,
        tasks: tasks.length,
        activeTasks: tasks.filter(t => t.status !== 'completed').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        activeProjects: projects.filter(p => p.status !== 'completed').length
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'שגיאה בטעינת נתוני דשבורד' });
    }
  });

  // Activity log route
  router.get('/api/dashboard/activity', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const activities = await storage.getActivityLogByUser(user.id, 20);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activity log:', error);
      res.status(500).json({ message: 'שגיאה בטעינת יומן פעילות' });
    }
  });

  // Products routes  
  router.get('/api/products', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const products = await storage.getProductsByAgency(agencyId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'שגיאה בטעינת מוצרים' });
    }
  });

  router.post('/api/products', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const productData = insertProductSchema.parse({
        ...req.body,
        agencyId: agencyId,
        createdBy: user.id
      });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'שגיאה ביצירת מוצר' });
    }
  });

  router.get('/api/products/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: 'מוצר לא נמצא' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'שגיאה בטעינת מוצר' });
    }
  });

  router.put('/api/products/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'שגיאה בעדכון מוצר' });
    }
  });

  router.delete('/api/products/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'שגיאה במחיקת מוצר' });
    }
  });

  // Quotes routes
  router.get('/api/quotes', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const quotes = await storage.getQuotesByAgency(agencyId);
      res.json(quotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      res.status(500).json({ message: 'שגיאה בטעינת הצעות מחיר' });
    }
  });

  router.post('/api/quotes', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      const quoteData = insertQuoteSchema.parse({
        ...req.body,
        agencyId: agencyId,
        createdBy: user.id,
        quoteNumber: `QT-${Date.now()}`
      });
      const quote = await storage.createQuote(quoteData);
      res.json(quote);
    } catch (error) {
      console.error('Error creating quote:', error);
      res.status(500).json({ message: 'שגיאה ביצירת הצעת מחיר' });
    }
  });

  router.get('/api/quotes/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: 'הצעת מחיר לא נמצאה' });
      }
      res.json(quote);
    } catch (error) {
      console.error('Error fetching quote:', error);
      res.status(500).json({ message: 'שגיאה בטעינת הצעת מחיר' });
    }
  });

  router.put('/api/quotes/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const quote = await storage.updateQuote(id, updates);
      res.json(quote);
    } catch (error) {
      console.error('Error updating quote:', error);
      res.status(500).json({ message: 'שגיאה בעדכון הצעת מחיר' });
    }
  });

  router.delete('/api/quotes/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQuote(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting quote:', error);
      res.status(500).json({ message: 'שגיאה במחיקת הצעת מחיר' });
    }
  });

  // Digital signature for quotes
  router.post('/api/quotes/:id/sign', async (req, res) => {
    try {
      const { id } = req.params;
      const { signature, ipAddress, userAgent } = req.body;
      
      const signatureData = {
        signature,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
        timestamp: new Date().toISOString()
      };

      const quote = await storage.updateQuote(id, {
        signedAt: new Date(),
        signatureData,
        status: 'approved'
      });

      res.json({ success: true, quote });
    } catch (error) {
      console.error('Error signing quote:', error);
      res.status(500).json({ message: 'שגיאה בחתימת הצעת המחיר' });
    }
  });

  // Financial dashboard routes
  router.get('/api/finance/dashboard', authMiddleware, async (req, res) => {
    try {
      const user = req.user!;
      const agencyId = user.agencyId || "407ab060-c765-4347-8233-0e7311a7adde";
      
      // Get all financial data
      const quotes = await storage.getQuotesByAgency(agencyId);
      const invoices = await storage.getInvoicesByAgency(agencyId);
      const payments = await storage.getPaymentsByAgency(agencyId);

      // Calculate stats
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const pendingQuotes = quotes.filter(q => q.status === 'sent').length;
      const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
      const totalQuoteValue = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);
      const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
      const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount - invoice.paidAmount), 0);

      const dashboard = {
        totalRevenue,
        pendingQuotes,
        approvedQuotes,
        totalQuoteValue,
        unpaidInvoicesCount: unpaidInvoices.length,
        totalUnpaid,
        recentPayments: payments.slice(-10),
        recentQuotes: quotes.slice(-10),
        cashFlow: {
          income: totalRevenue,
          expenses: 0, // TODO: Add expenses tracking
          balance: totalRevenue
        }
      };

      res.json(dashboard);
    } catch (error) {
      console.error('Error fetching finance dashboard:', error);
      res.status(500).json({ message: 'שגיאה בטעינת דשבורד פיננסי' });
    }
  });

  // Products routes
  router.get('/api/products', authMiddleware, async (req: any, res) => {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        return res.status(400).json({ message: 'לא נמצא מזהה סוכנות' });
      }

      const products = await storage.getProductsByAgency(agencyId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'שגיאה בטעינת מוצרים' });
    }
  });

  router.post('/api/products', authMiddleware, async (req: any, res) => {
    try {
      const agencyId = req.user?.agencyId;
      if (!agencyId) {
        return res.status(400).json({ message: 'לא נמצא מזהה סוכנות' });
      }

      const productData = insertProductSchema.parse({
        ...req.body,
        agencyId: agencyId,
        createdBy: req.user.id
      });
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'שגיאה ביצירת מוצר' });
    }
  });

  router.put('/api/products/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'שגיאה בעדכון מוצר' });
    }
  });

  router.delete('/api/products/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'שגיאה במחיקת מוצר' });
    }
  });

  // Users routes
  router.get('/api/users', authMiddleware, requireAgency, async (req, res) => {
    try {
      const user = req.user!;
      const users = await storage.getUsersByAgency(user.agencyId!);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'שגיאה בטעינת משתמשים' });
    }
  });

  // Signup endpoint
  router.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, fullName, agencyName, industry } = req.body;
      
      if (!email || !password || !fullName || !agencyName) {
        return res.status(400).json({ message: 'כל השדות נדרשים' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'משתמש עם אימייל זה כבר קיים' });
      }
      
      // Create agency first with unique slug
      const baseSlug = agencyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now()}`;
      const agency = await storage.createAgency({
        name: agencyName,
        slug: uniqueSlug,
        industry: industry || ''
      });
      
      // Hash password and create user
      const hashedPassword = await storage.hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
        role: 'agency_admin',
        agencyId: agency.id
      });
      
      // Create session
      if (req.session) {
        (req.session as any).user = {
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
      }
      
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
      console.error('Signup error:', error);
      res.status(500).json({ message: 'שגיאה ביצירת החשבון' });
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
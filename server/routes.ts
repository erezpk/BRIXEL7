import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { insertUserSchema, insertAgencySchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertTaskCommentSchema, insertDigitalAssetSchema, insertClientCardTemplateSchema, insertClientSettingsSchema, insertProductSchema, insertQuoteSchema, insertContractSchema, insertInvoiceSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import express from "express"; // Import express to use its Router
import { emailService } from "./email-service.js"; // Import from email-service.ts
import crypto from 'crypto'; // Import crypto for token generation
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
// Removed Firebase/Google auth library import - using simple OAuth now

// Extend Express types
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      fullName: string;
      role: string;
      agencyId: string | null;
      avatar?: string | null;
    }
  }
}

const router = express.Router();

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'crm-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'משתמש לא נמצא' });
        }

        const isValid = await storage.validatePassword(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'סיסמה שגויה' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      agencyId: user.agencyId
    });
  });

  passport.deserializeUser(async (user: any, done) => {
    done(null, user);
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user) {
      return next();
    }
    res.status(401).json({ message: 'נדרשת התחברות' });
  };

  // Middleware to ensure user and agency exist
  const requireUserWithAgency = (req: any, res: any, next: any) => {
    if (!req.user || !req.user.agencyId) {
      return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
    }
    next();
  };

  // Middleware to check agency access
  const requireAgencyAccess = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'נדרשת התחברות' });
    }

    const userAgencyId = req.user.agencyId;
    const requestedAgencyId = req.params.agencyId || req.body.agencyId;

    if (req.user.role === 'super_admin' || userAgencyId === requestedAgencyId) {
      return next();
    }
    res.status(403).json({ message: 'אין הרשאה לגשת לנתונים אלה' });
  };

  // Middleware to check if user is client
  const requireClientRole = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'client') {
      return next();
    }
    res.status(403).json({ message: 'גישה מוגבלת ללקוחות בלבד' });
  };

  // Auth routes
  router.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user, message: 'התחברות הצליחה' });
  });

  router.post('/api/auth/signup', async (req, res) => {
    try {
      const signupSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(2),
        agencyName: z.string().min(2),
        industry: z.string().optional(),
      });

      const data = signupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: 'משתמש כבר קיים עם אימייל זה' });
      }

      // Create agency
      const agencySlug = data.agencyName.toLowerCase()
        .replace(/[^a-z0-9\u0590-\u05FF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      const agency = await storage.createAgency({
        name: data.agencyName,
        slug: agencySlug,
        industry: data.industry || 'general',
      });

      // Create admin user
      const user = await storage.createUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: 'agency_admin',
        agencyId: agency.id,
        isActive: true,
      });

      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'שגיאה בהתחברות' });
        }
        res.json({ user: req.user, message: 'הרשמה והתחברות הצליחו' });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאת שרת' });
    }
  });

  router.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'שגיאה ביציאה' });
      }
      res.json({ message: 'יציאה הצליחה' });
    });
  });

  router.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: 'לא מחובר' });
    }
  });

  // Simple Google OAuth route (without Firebase)
  router.post('/api/auth/google-simple', async (req, res) => {
    try {
      console.log('Google OAuth request received:', req.body);
      const { userInfo } = req.body;

      if (!userInfo || !userInfo.email) {
        console.error('Missing user info in Google OAuth request');
        return res.status(400).json({ message: 'חסרים נתוני משתמש' });
      }

      // Check if user already exists
      let user = await storage.getUserByEmail(userInfo.email);

      if (user) {
        console.log('Existing user found:', user.email);
        // User exists, log them in
        req.login(user, (err) => {
          if (err) {
            console.error('Login error for existing user:', err);
            return res.status(500).json({ message: 'שגיאה בהתחברות' });
          }
          console.log('User logged in successfully:', req.user);
          res.json({ user: req.user, message: 'התחברות עם Google הצליחה' });
        });
      } else {
        console.log('Creating new user for:', userInfo.email);
        try {
          // New user - create account
          const newUser = await storage.createUser({
            email: userInfo.email,
            password: 'google-oauth-user', // Placeholder password for OAuth users
            fullName: userInfo.name || userInfo.email,
            role: 'client', // Default role, can be changed later
            agencyId: null, // Will need to be assigned later
            isActive: true,
            avatar: userInfo.picture,
          });

          console.log('New user created:', newUser.email);

          req.login(newUser, (err) => {
            if (err) {
              console.error('Login error for new user:', err);
              return res.status(500).json({ message: 'שגיאה בהתחברות' });
            }
            console.log('New user logged in successfully:', req.user);
            res.json({ 
              user: req.user, 
              message: 'הרשמה והתחברות עם Google הצליחו',
              isNewUser: true 
            });
          });
        } catch (createError) {
          console.error('Error creating new user:', createError);
          return res.status(500).json({ message: 'שגיאה ביצירת משתמש חדש' });
        }
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.status(500).json({ message: 'שגיאה באימות Google' });
    }
  });

  // Password reset routes
  router.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'כתובת אימייל לא תקינה' });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal that user doesn't exist for security
        return res.json({ message: 'אם המשתמש קיים, אימייל איפוס סיסמה נשלח' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Save token to database
      await storage.createPasswordResetToken(user.id, resetToken);

      // Create reset URL
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

      // Get agency info if user belongs to one
      let agencyName = 'מערכת CRM';
      if (user.agencyId) {
        try {
          const agency = await storage.getAgencyById(user.agencyId);
          if (agency) {
            agencyName = agency.name;
          }
        } catch (error) {
          console.error('Error fetching agency:', error);
        }
      }

      // Send email
      const emailSent = await emailService.sendPasswordReset(email, resetToken);

      if (emailSent) {
        res.json({ message: 'קישור איפוס סיסמה נשלח לאימייל שלך' });
      } else {
        res.status(500).json({ message: 'שגיאה בשליחת האימייל. אנא נסה שוב מאוחר יותר' });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'שגיאת שרת' });
    }
  });

  router.post('/api/auth/reset-password/confirm', async (req, res) => {
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
        return res.status(400).json({ message: 'טוקן איפוס סיסמה לא תקין או פג תוקפו' });
      }

      // Hash new password
      const hashedPassword = await storage.hashPassword(password);

      // Update user password
      await storage.updateUserPassword(userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: 'הסיסמה שונתה בהצלחה' });
    } catch (error) {
      console.error('Password reset confirm error:', error);
      res.status(500).json({ message: 'שגיאת שרת' });
    }
  });

  router.put('/api/auth/profile', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const updateData = {
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        company: req.body.company,
        bio: req.body.bio,
        avatar: req.body.avatar
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const updatedUser = await storage.updateUser(user.id, updateData);

      // Update session with proper typing
      req.user = {
        id: user.id,
        email: updateData.email || user.email,
        fullName: updateData.fullName || user.fullName,
        role: user.role,
        agencyId: user.agencyId,
        avatar: updateData.avatar || user.avatar
      };

      const { password, ...safeUser } = updatedUser;
      res.json({ user: safeUser, message: 'פרופיל עודכן בהצלחה' });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'שגיאה בעדכון פרופיל' });
    }
  });

  // Dashboard routes
  router.get('/api/dashboard/stats', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const stats = await storage.getDashboardStats(user.agencyId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת סטטיסטיקות' });
    }
  });

  router.get('/api/dashboard/activity', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await storage.getActivityLog(user.agencyId!, limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פעילות' });
    }
  });

  // Client Portal routes
  router.get('/api/client/stats', requireAuth, requireClientRole, async (req, res) => {
    try {
      const user = req.user!;
      // Get client's projects and tasks stats
      const projects = await storage.getProjectsByClient(user.id);
      const tasks = await storage.getTasksByUser(user.id);

      const activeProjects = projects.filter(p => p.status === 'active').length;
      const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;

      res.json({
        activeProjects,
        tasksInProgress,
        completedTasks,
      });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת סטטיסטיקות לקוח' });
    }
  });

  router.get('/api/client/projects', requireAuth, requireClientRole, async (req, res) => {
    try {
      const user = req.user!;
      const projects = await storage.getProjectsByClient(user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פרויקטים של הלקוח' });
    }
  });

  router.get('/api/client/activity', requireAuth, requireClientRole, async (req, res) => {
    try {
      // Get activity related to client's projects and tasks
      const limit = parseInt(req.query.limit as string) || 10;
      // For now, return empty array - this would need more complex query logic
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פעילות לקוח' });
    }
  });

  router.get('/api/client/files', requireAuth, requireClientRole, async (req, res) => {
    try {
      // Return empty array for now - file management would be implemented later
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת קבצי לקוח' });
    }
  });

  // Client Portal - Create lead
  // This route was replaced with more detailed lead management routes below
  // router.post('/api/client/leads', requireAuth, requireClientRole, async (req, res) => {
  //   try {
  //     const user = req.user!;

  //     const leadData = insertLeadSchema.parse({
  //       ...req.body,
  //       agencyId: user.agencyId!,
  //     });

  //     const lead = await storage.createLead(leadData);

  //     await storage.logActivity({
  //       agencyId: user.agencyId!,
  //       userId: user.id,
  //       action: 'created',
  //       entityType: 'lead',
  //       entityId: lead.id,
  //       details: { leadName: lead.name, source: 'client_portal' },
  //     });

  //     res.json(lead);
  //   } catch (error) {
  //     console.error('Lead save error:', error);
  //     if (error instanceof z.ZodError) {
  //       return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
  //     }
  //     res.status(500).json({ message: 'שגיאה ביצירת ליד' });
  //   }
  // });

  // Client Portal - Create client 
  router.post('/api/client/clients', requireAuth, requireClientRole, async (req, res) => {
    try {
      const user = req.user!;

      const clientData = insertClientSchema.parse({
        ...req.body,
        agencyId: user.agencyId!,
      });

      const client = await storage.createClient(clientData);

      await storage.logActivity({
        agencyId: user.agencyId!,
        userId: user.id,
        action: 'created',
        entityType: 'client',
        entityId: client.id,
        details: { clientName: client.name, source: 'client_portal' },
      });

      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה ביצירת לקוח' });
    }
  });

  // Clients routes
  router.get('/api/clients', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const clients = await storage.getClientsByAgency(user.agencyId!);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לקוחות' });
    }
  });

  router.post('/api/clients', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;

      const clientData = insertClientSchema.parse({
        ...req.body,
        agencyId: user.agencyId!,
      });

      const client = await storage.createClient(clientData);

      // Log activity
      await storage.logActivity({
        agencyId: user.agencyId!,
        userId: user.id,
        action: 'created',
        entityType: 'client',
        entityId: client.id,
        details: { clientName: client.name },
      });

      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה ביצירת לקוח' });
    }
  });

  router.get('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client || client.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לקוח' });
    }
  });

  router.put('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client || client.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      const updateData = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(req.params.id, updateData);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'updated',
        entityType: 'client',
        entityId: updatedClient.id,
        details: { clientName: updatedClient.name },
      });

      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה בעדכון לקוח' });
    }
  });

  router.delete('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client || client.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      await storage.deleteClient(req.params.id);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'deleted',
        entityType: 'client',
        entityId: req.params.id,
        details: { clientName: client.name },
      });

      res.json({ message: 'לקוח נמחק בהצלחה' });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה במחיקת לקוח' });
    }
  });

  // Projects routes
  router.get('/api/projects', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      let projects;

      if (clientId) {
        projects = await storage.getProjectsByClient(clientId);
        // Verify client belongs to user's agency
        const client = await storage.getClient(clientId);
        if (!client || client.agencyId !== req.user!.agencyId) {
          return res.status(403).json({ message: 'אין הרשאה' });
        }
      } else {
        projects = await storage.getProjectsByAgency(req.user!.agencyId!);
      }

      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פרויקטים' });
    }
  });

  router.post('/api/projects', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse({
        ...req.body,
        agencyId: req.user!.agencyId!,
        createdBy: req.user!.id,
      });

      const project = await storage.createProject(projectData);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'created',
        entityType: 'project',
        entityId: project.id,
        details: { projectName: project.name },
      });

      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה ביצירת פרויקט' });
    }
  });

  // Get specific project
  router.get('/api/projects/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project || project.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'פרויקט לא נמצא' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פרויקט' });
    }
  });

  // Update project
  router.put('/api/projects/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project || project.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'פרויקט לא נמצא' });
      }

      const updatedProject = await storage.updateProject(req.params.id, req.body);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'updated',
        entityType: 'project',
        entityId: req.params.id,
        details: { projectName: updatedProject.name },
      });

      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בעדכון פרויקט' });
    }
  });

  // Get project tasks
  router.get('/api/projects/:id/tasks', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project || project.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'פרויקט לא נמצא' });
      }

      const tasks = await storage.getTasksByProject(req.params.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת משימות פרויקט' });
    }
  });

  // Get project assets
  router.get('/api/projects/:id/assets', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project || project.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'פרויקט לא נמצא' });
      }

      // Since digital assets are linked to clients, not projects directly,
      // we need to get assets by client if the project has a client
      if (project.clientId) {
        const assets = await storage.getDigitalAssetsByClient(project.clientId);
        res.json(assets);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת נכסי פרויקט' });
    }
  });

  // Tasks routes
  router.get('/api/tasks', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        assignedTo: req.query.assignedTo as string,
        clientId: req.query.clientId as string,
        projectId: req.query.projectId as string,
      };

      const tasks = await storage.getTasksByAgency(req.user!.agencyId!, filters);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת משימות' });
    }
  });

  router.post('/api/tasks', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        agencyId: req.user!.agencyId!,
        createdBy: req.user!.id,
      });

      const task = await storage.createTask(taskData);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'created',
        entityType: 'task',
        entityId: task.id,
        details: { taskTitle: task.title },
      });

      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה ביצירת משימה' });
    }
  });

  router.put('/api/tasks/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'משימה לא נמצאה' });
      }

      const updateData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(req.params.id, updateData);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'updated',
        entityType: 'task',
        entityId: updatedTask.id,
        details: { taskTitle: updatedTask.title },
      });

      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה בעדכון משימה' });
    }
  });

  // Task Comments routes
  router.get('/api/tasks/:id/comments', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'משימה לא נמצאה' });
      }

      const comments = await storage.getTaskComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת תגובות' });
    }
  });

  router.post('/api/tasks/:id/comments', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'משימה לא נמצאה' });
      }

      const commentData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: req.params.id,
        userId: req.user!.id,
      });

      const comment = await storage.createTaskComment(commentData);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'commented',
        entityType: 'task',
        entityId: task.id,
        details: { taskTitle: task.title },
      });

      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה בהוספת תגובה' });
    }
  });

  // Digital Assets routes
  router.get('/api/assets', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const clientId = req.query.clientId as string;
      let assets;

      if (clientId) {
        assets = await storage.getDigitalAssetsByClient(clientId);
        // Verify client belongs to user's agency
        const client = await storage.getClient(clientId);
        if (!client || client.agencyId !== req.user!.agencyId) {
          return res.status(403).json({ message: 'אין הרשאה' });
        }
      } else {
        assets = await storage.getDigitalAssetsByAgency(req.user!.agencyId!);
      }

      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת נכסים דיגיטליים' });
    }
  });

  router.post('/api/assets', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const assetData = insertDigitalAssetSchema.parse({
        ...req.body,
        agencyId: req.user!.agencyId!,
      });

      const asset = await storage.createDigitalAsset(assetData);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'created',
        entityType: 'asset',
        entityId: asset.id,
        details: { assetName: asset.name, assetType: asset.type },
      });

      res.json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה ביצירת נכס דיגיטלי' });
    }
  });

  // Leads routes
  router.get('/api/client/leads/:clientId', requireAuth, async (req, res) => {
    try {
      // Mock data for now - replace with actual database query
      const mockLeads = [
        {
          id: '1',
          name: 'דני כהן',
          email: 'danny@example.com',
          phone: '054-1234567',
          source: 'google',
          status: 'new',
          value: 15000,
          notes: 'מעוניין באתר אינטרנט',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'שרה לוי',
          email: 'sara@example.com',
          phone: '052-9876543',
          source: 'facebook',
          status: 'contacted',
          value: 25000,
          notes: 'פגישה קבועה לשבוע הבא',
          createdAt: new Date().toISOString()
        }
      ];
      res.json(mockLeads);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לידים' });
    }
  });

  // New Lead Management Routes
  router.post('/api/client/leads', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const leadData = req.body;

      // Validate required fields
      if (!leadData.name?.trim()) {
        return res.status(400).json({ message: 'שם הליד נדרש' });
      }
      if (!leadData.email?.trim()) {
        return res.status(400).json({ message: 'כתובת אימייל נדרשת' });
      }
      if (!leadData.email.includes('@')) {
        return res.status(400).json({ message: 'כתובת אימייל לא תקינה' });
      }

      // Create new lead (simulated)
      const newLead = {
        id: Math.random().toString(36).substr(2, 9),
        name: leadData.name.trim(),
        email: leadData.email.trim(),
        phone: leadData.phone || '',
        source: leadData.source || 'manual',
        status: leadData.status || 'new',
        value: Number(leadData.value) || 0,
        notes: leadData.notes || '',
        clientId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.json(newLead);
    } catch (error) {
      console.error('Error creating lead:', error);
      res.status(500).json({ message: 'שגיאה ביצירת הליד' });
    }
  });

  router.put('/api/client/leads/:id', requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const leadId = req.params.id;
      const leadData = req.body;

      // Validate required fields
      if (!leadData.name?.trim()) {
        return res.status(400).json({ message: 'שם הליד נדרש' });
      }
      if (!leadData.email?.trim()) {
        return res.status(400).json({ message: 'כתובת אימייל נדרשת' });
      }
      if (!leadData.email.includes('@')) {
        return res.status(400).json({ message: 'כתובת אימייל לא תקינה' });
      }

      // Update lead (simulated)
      const updatedLead = {
        id: leadId,
        name: leadData.name.trim(),
        email: leadData.email.trim(),
        phone: leadData.phone || '',
        source: leadData.source || 'manual',
        status: leadData.status || 'new',
        value: Number(leadData.value) || 0,
        notes: leadData.notes || '',
        clientId: user.id,
        updatedAt: new Date().toISOString()
      };

      res.json(updatedLead);
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ message: 'שגיאה בעדכון הליד' });
    }
  });

  router.delete('/api/client/leads/:id', requireAuth, async (req, res) => {
    try {
      const leadId = req.params.id;

      // Delete lead (simulated)
      res.json({ message: 'הליד נמחק בהצלחה', leadId });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ message: 'שגיאה במחיקת הליד' });
    }
  });


  router.get('/api/client/clients/:clientId', requireAuth, async (req, res) => {
    try {
      // Mock data for now - replace with actual database query
      const mockClients = [
        {
          id: '1',
          name: 'חברת הטכנולוגיה בע"מ',
          contactName: 'יוסי כהן',
          email: 'yossi@techcompany.com',
          phone: '03-1234567',
          industry: 'טכנולוגיה',
          status: 'active',
          totalValue: 150000,
          projectsCount: 3,
          lastContact: new Date().toISOString()
        },
        {
          id: '2',
          name: 'סטודיו עיצוב',
          contactName: 'מיכל לוי',
          email: 'michal@design.com',
          phone: '054-9876543',
          industry: 'עיצוב',
          status: 'active',
          totalValue: 85000,
          projectsCount: 2,
          lastContact: new Date().toISOString()
        }
      ];
      res.json(mockClients);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לקוחות' });
    }
  });

  // Team member dashboard APIs
  router.get('/api/team-member/stats', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;

      // Get tasks assigned to this team member
      const tasks = await storage.getTasksByUser(user.id);
      const projects = await storage.getProjectsByAssignedUser(user.id);

      // Calculate statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
      const pendingTasks = tasks.filter((task: any) => task.status === 'pending').length;
      const overdueTasks = tasks.filter((task: any) => {
        if (!task.dueDate) return false;
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        return dueDate < today && task.status !== 'completed';
      }).length;

      res.json({
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        activeProjects: projects.length,
      });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת סטטיסטיקות חבר צוות' });
    }
  });

  router.get('/api/team-member/my-tasks', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const tasks = await storage.getTasksByUser(user.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת משימות חבר צוות' });
    }
  });

  router.get('/api/team-member/my-projects', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const projects = await storage.getProjectsByAssignedUser(user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פרויקטים של חבר צוות' });
    }
  });

  router.get('/api/team-member/my-activity', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const limit = parseInt(req.query.limit as string) || 10;

      // Get activity related to user's tasks and projects
      const activity = await storage.getActivityLogByUser(user.id, limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פעילות חבר צוות' });
    }
  });

  // Legacy team member stats (for backwards compatibility)
  router.get('/api/team/stats', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;

      // Get projects where user is assigned
      const projects = await storage.getProjectsByAssignedUser(user.id);

      res.json({
        projectsCount: projects.length,
      });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת סטטיסטיקות חבר צוות' });
    }
  });

  router.get('/api/team/activity', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const limit = parseInt(req.query.limit as string) || 10;

      // Get activity related to user's tasks and projects
      const activity = await storage.getActivityLogByUser(user.id, limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פעילות חבר צוות' });
    }
  });

  // Team routes
  router.get('/api/team', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const teamMembers = await storage.getUsersByAgency(req.user!.agencyId!);
      // Remove password from response
      const safeTeamMembers = teamMembers.map(({ password, ...member }) => member);
      res.json(safeTeamMembers);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת חברי צוות' });
    }
  });

  router.post('/api/team/invite', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;

      // Only agency admins can invite team members
      if (user.role !== 'agency_admin') {
        return res.status(403).json({ message: 'רק מנהלי סוכנות יכולים להזמין חברי צוות' });
      }

      const userData = insertUserSchema.parse({
        ...req.body,
        agencyId: user.agencyId!,
        isActive: true,
      });

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'משתמש כבר קיים עם אימייל זה' });
      }

      const newUser = await storage.createUser(userData);

      // Get agency details for email
      const agency = await storage.getAgencyById(user.agencyId!);
      if (!agency) {
        return res.status(404).json({ message: 'סוכנות לא נמצאה' });
      }

      // Send invitation email
      let emailSent = false;
      if (emailService.isConfigured()) {
        try {
          const loginUrl = `${req.protocol}://${req.get('host')}/login`;

          // Determine dashboard URL based on role
          let dashboardUrl = `${req.protocol}://${req.get('host')}/dashboard`;
          let dashboardType = 'דאשבורד מנהל';

          if (newUser.role === 'team_member') {
            dashboardUrl = `${req.protocol}://${req.get('host')}/team-member-dashboard`;
            dashboardType = 'דאשבורד חבר צוות';
          } else if (newUser.role === 'client') {
            dashboardUrl = `${req.protocol}://${req.get('host')}/client-dashboard`;
            dashboardType = 'דאשבורד לקוח';
          }

          emailSent = await emailService.sendEmail({
            to: newUser.email,
            subject: `הזמנה להצטרף ל-${agency.name}`,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2>🎉 הזמנה להצטרף כחבר צוות</h2>
                <p>שלום ${newUser.fullName},</p>
                <p>הוזמנת להצטרף כ<strong>${newUser.role === 'team_member' ? 'חבר צוות' : newUser.role === 'agency_admin' ? 'מנהל סוכנות' : 'לקוח'}</strong> ב-${agency.name}.</p>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #007bff;">
                  <p><strong>🔑 פרטי ההתחברות:</strong></p>
                  <p><strong>📧 אימייל:</strong> ${newUser.email}</p>
                  <p><strong>🔐 סיסמה זמנית:</strong> ${userData.password}</p>
                  <p><strong>🌐 קישור להתחברות:</strong> <a href="${loginUrl}" style="color: #007bff; text-decoration: none;">${loginUrl}</a></p>
                </div>

                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #28a745;">
                  <p><strong>📊 ${dashboardType} שלך:</strong></p>
                  <p>לאחר ההתחברות, תועבר אוטומטית ל${dashboardType} שלך:</p>
                  <p><a href="${dashboardUrl}" style="color: #28a745; text-decoration: none; font-weight: bold;">${dashboardUrl}</a></p>
                </div>

                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #ffc107;">
                  <p><strong>⚠️ הנחיות חשובות:</strong></p>
                  <ul style="margin: 10px 0; padding-right: 20px;">
                    <li>מומלץ לשנות את הסיסמה בכניסה הראשונה</li>
                    <li>שמור על פרטי ההתחברות במקום בטוח</li>
                    <li>במקרה של בעיה, פנה למנהל הסוכנות</li>
                  </ul>
                </div>

                <p style="margin-top: 30px;">ברוך הבא למשפחת ${agency.name}! אנחנו מצפים לעבוד איתך.</p>
                <p>בברכה,<br><strong>צוות ${agency.name}</strong></p>
              </div>
            `,
            text: `שלום ${newUser.fullName}, הוזמנת להצטרף כ${newUser.role === 'team_member' ? 'חבר צוות' : 'מנהל'} ב-${agency.name}. פרטי התחברות: ${newUser.email} / ${userData.password}. קישור התחברות: ${loginUrl}. ${dashboardType}: ${dashboardUrl}`
          });

          console.log(`Team invitation email sent to ${newUser.email}: ${emailSent ? 'Success' : 'Failed'}`);
        } catch (emailError) {
          console.error('Error sending invitation email:', emailError);
        }
      }

      // Log activity
      await storage.logActivity({
        agencyId: user.agencyId!,
        userId: user.id,
        action: 'invited',
        entityType: 'user',
        entityId: newUser.id,
        details: { userName: newUser.fullName, userEmail: newUser.email, invitedBy: user.fullName },
      });

      // Remove password from response
      const { password, ...safeUser } = newUser;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה בהזמנת חבר צוות' });
    }
  });

  router.put('/api/team/:id/toggle-active', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const memberId = req.params.id;

      // Only agency admins can deactivate team members
      if (user.role !== 'agency_admin') {
        return res.status(403).json({ message: 'רק מנהלי סוכנות יכולים לשנות סטטוס חברי צוות' });
      }

      // Get the member to toggle
      const member = await storage.getUserById(memberId);
      if (!member || member.agencyId !== user.agencyId) {
        return res.status(404).json({ message: 'חבר צוות לא נמצא' });
      }

      // Can't deactivate yourself
      if (member.id === user.id) {
        return res.status(400).json({ message: 'לא ניתן לשנות את הסטטוס של עצמך' });
      }

      const updatedMember = await storage.updateUser(memberId, { isActive: !member.isActive });

      // Log activity
      await storage.logActivity({
        agencyId: user.agencyId!,
        userId: user.id,
        action: updatedMember.isActive ? 'activated' : 'deactivated',
        entityType: 'user',
        entityId: memberId,
        details: { userName: member.fullName },
      });

      const { password, ...safeUser } = updatedMember;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בשינוי סטטוס חבר הצוות' });
    }
  });

  router.put('/api/team/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const memberId = req.params.id;

      // Only agency admins can edit team members
      if (user.role !== 'agency_admin') {
        return res.status(403).json({ message: 'רק מנהלי סוכנות יכולים לערוך פרטי חברי צוות' });
      }

      // Get the member to edit
      const member = await storage.getUserById(memberId);
      if (!member || member.agencyId !== user.agencyId) {
        return res.status(404).json({ message: 'חבר צוות לא נמצא' });
      }

      const { fullName, email, role } = req.body;

      // Validate input
      if (!fullName?.trim() || !email?.trim() || !role) {
        return res.status(400).json({ message: 'יש למלא את כל השדות הנדרשים' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ message: 'כתובת אימייל לא תקינה' });
      }

      // Check if email is already taken by another user
      if (email !== member.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== memberId) {
          return res.status(400).json({ message: 'משתמש אחר כבר רשום עם אימייל זה' });
        }
      }

      // Update the member
      const updatedMember = await storage.updateUser(memberId, {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
      });

      // Log activity
      await storage.logActivity({
        agencyId: user.agencyId!,
        userId: user.id,
        action: 'updated',
        entityType: 'user',
        entityId: memberId,
        details: { userName: updatedMember.fullName },
      });

      const { password, ...safeUser } = updatedMember;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בעדכון פרטי חבר צוות' });
    }
  });

  router.post('/api/team/:id/resend-invite', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const memberId = req.params.id;

      // Only agency admins can resend invitations
      if (user.role !== 'agency_admin') {
        return res.status(403).json({ message: 'רק מנהלי סוכנות יכולים לשלוח הזמנות מחדש' });
      }

      // Get the member
      const member = await storage.getUserById(memberId);
      if (!member || member.agencyId !== user.agencyId) {
        return res.status(404).json({ message: 'חבר צוות לא נמצא' });
      }

      // Get agency details
      const agency = await storage.getAgencyById(user.agencyId!);
      if (!agency) {
        return res.status(404).json({ message: 'סוכנות לא נמצאה' });
      }

      // Send reminder/invitation email
      if (emailService.isConfigured()) {
        const loginUrl = `${req.protocol}://${req.get('host')}/login`;

        // Determine dashboard URL based on role
        let dashboardUrl = `${req.protocol}://${req.get('host')}/dashboard`;
        let dashboardType = 'דאשבורד מנהל';

        if (member.role === 'team_member') {
          dashboardUrl = `${req.protocol}://${req.get('host')}/team-member-dashboard`;
          dashboardType = 'דאשבורד חבר צוות';
        } else if (member.role === 'client') {
          dashboardUrl = `${req.protocol}://${req.get('host')}/client-dashboard`;
          dashboardType = 'דאשבורד לקוח';
        }

        const emailSent = await emailService.sendEmail({
          to: member.email,
          subject: `תזכורת - גישה למערכת ${agency.name}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
              <h2>🔔 תזכורת - גישה למערכת</h2>
              <p>שלום ${member.fullName},</p>
              <p>זוהי תזכורת לגישה שלך למערכת ${agency.name} כ<strong>${member.role === 'team_member' ? 'חבר צוות' : member.role === 'agency_admin' ? 'מנהל סוכנות' : 'לקוח'}</strong>.</p>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #007bff;">
                <p><strong>🔑 פרטי ההתחברות:</strong></p>
                <p><strong>📧 אימייל:</strong> ${member.email}</p>
                <p><strong>🌐 קישור להתחברות:</strong> <a href="${loginUrl}" style="color: #007bff; text-decoration: none;">${loginUrl}</a></p>
              </div>

              <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #28a745;">
                <p><strong>📊 ${dashboardType} שלך:</strong></p>
                <p>לאחר ההתחברות, גש ישירות ל${dashboardType} שלך:</p>
                <p><a href="${dashboardUrl}" style="color: #28a745; text-decoration: none; font-weight: bold;">${dashboardUrl}</a></p>
              </div>

              <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #ffc107;">
                <p><strong>🔐 שכחת את הסיסמה?</strong></p>
                <p>ניתן לאפס אותה דרך הקישור "שכחתי סיסמה" בעמוד ההתחברות, או לפנות למנהל הסוכנות.</p>
              </div>

              <p style="margin-top: 30px;">אנחנו מחכים לראותך במערכת!</p>
              <p>בברכה,<br><strong>צוות ${agency.name}</strong></p>
            </div>
          `,
          text: `שלום ${member.fullName}, תזכורת לגישה למערכת ${agency.name}. קישור התחברות: ${loginUrl}. ${dashboardType}: ${dashboardUrl}`
        });

        console.log(`Team reminder email sent to ${member.email}: ${emailSent ? 'Success' : 'Failed'}`);
      }

      // Log activity
      await storage.logActivity({
        agencyId: user.agencyId!,
        userId: user.id,
        action: 'resent_invitation',
        entityType: 'user',
        entityId: memberId,
        details: { 
          userName: member.fullName,
          userEmail: member.email,
          sentBy: user.fullName 
        },
      });

      res.json({ 
        message: 'הזמנה נשלחה מחדש בהצלחה',
        details: {
          sentTo: member.email,
          memberName: member.fullName
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בשליחת הזמנה מחדש' });
    }
  });

  // Email routes
  router.post('/api/clients/:id/send-credentials', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const clientId = req.params.id;

      // Get the client
      const client = await storage.getClient(clientId);
      if (!client || client.agencyId !== user.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      if (!client.email) {
        return res.status(400).json({ message: 'ללקוח אין כתובת אימייל' });
      }

      // Get agency details
      const agency = await storage.getAgencyById(user.agencyId!);
      if (!agency) {
        return res.status(404).json({ message: 'סוכנות לא נמצאה' });
      }

      // Generate credentials (or use existing ones from request)
      const { username, password } = req.body;
      const defaultUsername = username || client.email;
      const defaultPassword = password || `${client.name.toLowerCase().replace(/\s+/g, '')}_${client.id.slice(0, 8)}`;

      const loginUrl = `${req.protocol}://${req.get('host')}/client-portal?clientId=${client.id}`;

      const emailData = {
        to: client.email,
        clientName: client.name,
        username: defaultUsername,
        password: defaultPassword,
        loginUrl: loginUrl,
        agencyName: agency.name
      };

      // Send the email
      const emailSent = await emailService.sendClientCredentials(emailData);

      if (emailSent) {
        // Log activity
        await storage.logActivity({
          agencyId: user.agencyId!,
          userId: user.id,
          action: 'sent_credentials',
          entityType: 'client',
          entityId: client.id,
          details: { 
            clientName: client.name,
            clientEmail: client.email,
            sentBy: user.fullName 
          },
        });

        res.json({ 
          message: 'פרטי ההתחברות נשלחו בהצלחה',
          details: {
            sentTo: client.email,
            clientName: client.name
          }
        });
      } else {
        res.status(500).json({ message: 'שגיאה בשליחת האימייל. אנא בדוק את הגדרות האימייל' });
      }
    } catch (error) {
      console.error('Error sending credentials email:', error);
      res.status(500).json({ message: 'שגיאה בשליחת פרטי ההתחברות' });
    }
  });

  // Test email configuration
  router.get('/api/email/test', requireAuth, async (req, res) => {
    try {
      const isConnected = await emailService.testConnection();
      if (isConnected) {
        res.json({ message: 'חיבור האימייל תקין', status: 'success' });
      } else {
        res.json({ message: 'חיבור האימייל לא מוגדר או לא תקין', status: 'error' });
      }
    } catch (error) {
      console.error('Error testing email connection:', error);
      res.status(500).json({ message: 'שגיאה בבדיקת חיבור האימייל' });
    }
  });

  // Debug route to create test user with agency
  router.post('/api/debug/create-test-user', async (req, res) => {
    try {
      const { email, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'משתמש כבר קיים עם אימייל זה' });
      }

      // Create agency
      const agency = await storage.createAgency({
        name: 'סוכנות בדיקה',
        slug: 'test-agency',
        industry: 'general',
      });

      // Create user with agency
      const user = await storage.createUser({
        email,
        password,
        fullName,
        role: 'agency_admin',
        agencyId: agency.id,
        isActive: true,
      });

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, agency, message: 'משתמש וסוכנות נוצרו בהצלחה' });
    } catch (error) {
      console.error('Error creating test user:', error);
      res.status(500).json({ message: 'שגיאה ביצירת משתמש בדיקה' });
    }
  });

  // Email routes
  router.post('/api/email/test', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const { to, subject, message } = req.body;
      const user = req.user!;

      if (!emailService.isConfigured()) {
        return res.status(400).json({ 
          message: 'שירות האימייל לא מוגדר. אנא הגדר את פרטי ה-SMTP במשתני הסביבה.' 
        });
      }

      const success = await emailService.sendEmail({
        to,
        subject: subject || 'בדיקת שירות אימייל',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
            <h2>בדיקת שירות אימייל</h2>
            <p>שלום,</p>
            <p>${message || 'זהו אימייל בדיקה ממערכת AgencyCRM.'}</p>
            <p>שלח על ידי: ${user.fullName} (${user.email})</p>
            <p>בברכה,<br>צוות AgencyCRM</p>
          </div>
        `,
        text: message || 'זהו אימייל בדיקה ממערכת AgencyCRM.'
      });

      if (success) {
        res.json({ message: 'האימייל נשלח בהצלחה!' });
      } else {
        res.status(500).json({ message: 'שגיאה בשליחת האימייל' });
      }
    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({ message: 'שגיאה בשליחת האימייל' });
    }
  });

  router.get('/api/email/status', requireAuth, async (req, res) => {
    try {
      const isConfigured = emailService.isConfigured();
      res.json({ 
        configured: isConfigured,
        message: isConfigured ? 'שירות האימייל פעיל' : 'שירות האימייל לא מוגדר'
      });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בבדיקת סטטוס האימייל' });
    }
  });

  // Email test connection endpoint (for email setup page)
  router.post('/api/email/test-connection', async (req, res) => {
    try {
      const isConnected = await emailService.testConnection();
      if (isConnected) {
        res.json({ 
          success: true, 
          message: 'Email service is configured and ready',
          provider: 'Gmail SMTP'
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Email service not configured or connection failed' 
        });
      }
    } catch (error) {
      console.error('Email test connection error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Connection test failed' 
      });
    }
  });

  // Send test email endpoint (for email setup page)
  router.post('/api/email/send-test', async (req, res) => {
    try {
      if (!emailService.isConfigured()) {
        return res.status(500).json({ success: false, message: 'Email service not configured' });
      }

      const { to, subject, body } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const success = await emailService.sendEmail({
        to,
        subject,
        text: body,
        html: `<div dir="rtl" style="font-family: Arial, sans-serif;">${body.replace(/\n/g, '<br>')}</div>`
      });

      if (success) {
        res.json({ success: true, message: `Test email sent to ${to}` });
      } else {
        res.status(500).json({ success: false, message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Send test email error:', error);
      res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
  });

  // Client Card Templates routes
  router.get('/api/client-card-templates', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const templates = await storage.getClientCardTemplatesByAgency(req.user!.agencyId!);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת תבניות כרטיסי לקוח' });
    }
  });

  router.post('/api/client-card-templates', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const templateData = insertClientCardTemplateSchema.parse({
        ...req.body,
        agencyId: req.user!.agencyId!,
        createdBy: req.user!.id,
      });

      const template = await storage.createClientCardTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error('Error creating client card template:', error);
      res.status(500).json({ message: 'שגיאה ביצירת תבנית כרטיס לקוח' });
    }
  });

  router.put('/api/client-card-templates/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const template = await storage.updateClientCardTemplate(id, updateData);
      res.json(template);
    } catch (error) {
      console.error('Error updating client card template:', error);
      res.status(500).json({ message: 'שגיאה בעדכון תבנית כרטיס לקוח' });
    }
  });

  router.delete('/api/client-card-templates/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const template = await storage.getClientCardTemplate(req.params.id);
      if (!template || template.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'תבנית לא נמצאה' });
      }

      await storage.deleteClientCardTemplate(req.params.id);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'deleted',
        entityType: 'client_template',
        entityId: req.params.id,
        details: { templateName: template.name },
      });

      res.json({ message: 'תבנית נמחקה בהצלחה' });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה במחיקת תבנית כרטיס לקוח' });
    }
  });

  // Enhanced Digital Assets routes with client-specific endpoints
  router.get('/api/clients/:clientId/digital-assets', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.clientId);
      if (!client || client.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      const assets = await storage.getDigitalAssetsByClient(req.params.clientId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת נכסים דיגיטליים' });
    }
  });

  router.post('/api/clients/:clientId/digital-assets', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.clientId);
      if (!client || client.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      const assetData = insertDigitalAssetSchema.parse({
        ...req.body,
        clientId: req.params.clientId,
        agencyId: req.user!.agencyId!,
      });

      const asset = await storage.createDigitalAsset(assetData);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'created',
        entityType: 'digital_asset',
        entityId: asset.id,
        details: { assetName: asset.name, assetType: asset.type, clientName: client.name },
      });

      res.json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה ביצירת נכס דיגיטלי' });
    }
  });

  router.put('/api/clients/:clientId/digital-assets/:assetId', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const asset = await storage.getDigitalAsset(req.params.assetId);
      if (!asset || asset.agencyId !== req.user!.agencyId || asset.clientId !== req.params.clientId) {
        return res.status(404).json({ message: 'נכס לא נמצא' });
      }

      const updateData = insertDigitalAssetSchema.partial().parse(req.body);
      const updatedAsset = await storage.updateDigitalAsset(req.params.assetId, updateData);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'updated',
        entityType: 'digital_asset',
        entityId: updatedAsset.id,
        details: { assetName: updatedAsset.name, assetType: updatedAsset.type },
      });

      res.json(updatedAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה בעדכון נכס דיגיטלי' });
    }
  });

  router.delete('/api/clients/:clientId/digital-assets/:assetId', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const asset = await storage.getDigitalAsset(req.params.assetId);
      if (!asset || asset.agencyId !== req.user!.agencyId || asset.clientId !== req.params.clientId) {
        return res.status(404).json({ message: 'נכס לא נמצא' });
      }

      await storage.deleteDigitalAsset(req.params.assetId);

      await storage.logActivity({
        agencyId: req.user!.agencyId!,
        userId: req.user!.id,
        action: 'deleted',
        entityType: 'digital_asset',
        entityId: req.params.assetId,
        details: { assetName: asset.name, assetType: asset.type },
      });

      res.json({ message: 'נכס נמחק בהצלחה' });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה במחיקת נכס דיגיטלי' });
    }
  });

  // =================
  // FINANCIAL MANAGEMENT ROUTES
  // =================

  // Client Settings Routes
  router.get('/api/client-settings/:clientId', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const settings = await storage.getClientSettings(req.params.clientId);
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = await storage.createClientSettings({
          clientId: req.params.clientId,
          vatPercentage: 18,
          currency: 'ILS',
          paymentTerms: 30,
          settings: {}
        });
        return res.json(defaultSettings);
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת הגדרות לקוח' });
    }
  });

  router.put('/api/client-settings/:clientId', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const settings = await storage.updateClientSettings(req.params.clientId, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בעדכון הגדרות לקוח' });
    }
  });

  // Products Routes
  router.get('/api/products', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const products = await storage.getProductsByAgency(user.agencyId!);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת מוצרים ושירותים' });
    }
  });

  router.post('/api/products', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      console.log('Creating product with data:', req.body);
      
      const productData = insertProductSchema.parse({
        ...req.body,
        agencyId: user.agencyId!,
        createdBy: user.id
      });
      
      const product = await storage.createProduct(productData);
      console.log('Product created:', product);
      res.json(product);
    } catch (error) {
      console.error('Product creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה ביצירת מוצר/שירות' });
    }
  });

  router.put('/api/products/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בעדכון מוצר/שירות' });
    }
  });

  router.delete('/api/products/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה במחיקת מוצר/שירות' });
    }
  });

  // Quotes Routes
  router.get('/api/quotes', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const quotes = await storage.getQuotesByAgency(user.agencyId!);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת הצעות מחיר' });
    }
  });

  router.post('/api/quotes', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const timestamp = Date.now().toString().slice(-6);
      const quoteNumber = `QU-${timestamp}`;
      
      const quoteData = {
        ...req.body,
        agencyId: user.agencyId!,
        createdBy: user.id,
        quoteNumber
      };
      const quote = await storage.createQuote(quoteData);
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה ביצירת הצעת מחיר' });
    }
  });

  router.put('/api/quotes/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const quote = await storage.updateQuote(req.params.id, req.body);
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בעדכון הצעת מחיר' });
    }
  });

  // Send quote via email
  router.post('/api/quotes/:id/send-email', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote || quote.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'הצעת מחיר לא נמצאה' });
      }

      const client = await storage.getClient(quote.clientId);
      if (!client) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      const agency = await storage.getAgency(req.user!.agencyId!);
      if (!agency) {
        return res.status(404).json({ message: 'סוכנות לא נמצאה' });
      }

      // Get sender info from request body
      const { senderName, senderEmail } = req.body;

      // Create quote approval link
      const approvalLink = `${process.env.REPLIT_DEV_DOMAIN || 'https://your-domain.com'}/quote-approval/${quote.id}`;

      // Format quote items for email
      const formattedItems = quote.items?.map((item: any) => 
        `${item.description} - כמות: ${item.quantity} × ${(item.unitPrice / 100).toLocaleString('he-IL')}₪ = ${(item.total / 100).toLocaleString('he-IL')}₪`
      ).join('\n') || 'אין פריטים';

      const emailBody = `
שלום ${client.name},

בצוות ${agency.name} שמחים להציג לכם הצעת מחיר עבור: ${quote.title}

פרטי ההצעה:
${quote.description ? `תיאור: ${quote.description}\n` : ''}
פריטים:
${formattedItems}

סיכום פיננסי:
סה"כ לתשלום: ${(quote.totalAmount / 100).toLocaleString('he-IL')}₪

תוקף ההצעה: עד ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('he-IL') : 'לא הוגדר'}

לאישור ההצעה, לחצו על הקישור הבא:
${approvalLink}

${quote.notes || ''}
בברכה,
צוות ${agency.name}
      `.trim();

      if (!client.email) {
        return res.status(400).json({ message: 'לא נמצא כתובת מייל ללקוח' });
      }

      const success = await emailService.sendEmail({
        to: client.email,
        subject: `הצעת מחיר - ${quote.title} מאת ${senderName || agency.name}`,
        text: emailBody,
        html: emailBody.replace(/\n/g, '<br>'),
        from: senderEmail || undefined
      });

      if (success) {
        // Update quote status to indicate it was sent
        await storage.updateQuote(req.params.id, {
          status: 'sent',
          sentAt: new Date()
        });

        await storage.logActivity({
          agencyId: req.user!.agencyId!,
          userId: req.user!.id,
          action: 'sent_email',
          entityType: 'quote',
          entityId: quote.id,
          details: { 
            clientEmail: client.email,
            quoteTitle: quote.title,
            totalAmount: quote.totalAmount 
          },
        });

        res.json({ message: 'הצעת המחיר נשלחה בהצלחה למייל הלקוח', success: true });
      } else {
        res.status(500).json({ message: 'שגיאה בשליחת המייל', success: false });
      }
    } catch (error) {
      console.error('Error sending quote email:', error);
      res.status(500).json({ message: 'שגיאה בשליחת הצעת מחיר במייל' });
    }
  });

  // Get quote for public approval (no auth required)
  router.get('/api/quotes/:id/public', async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: 'הצעת מחיר לא נמצאה' });
      }

      const client = await storage.getClient(quote.clientId);
      const agency = await storage.getAgency(quote.agencyId);

      // Return quote with client and agency info for public view
      res.json({
        ...quote,
        client,
        agency
      });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת הצעת מחיר' });
    }
  });

  // Track quote view
  router.post('/api/quotes/:id/track-view', async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: 'הצעת מחיר לא נמצאה' });
      }

      // Update view tracking
      const updatedQuote = await storage.updateQuote(req.params.id, {
        viewedAt: new Date(),
        viewCount: (quote.viewCount || 0) + 1,
        status: quote.status === 'sent' ? 'viewed' : quote.status
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה במעקב צפייה' });
    }
  });

  // Quote approval (for client portal)
  router.post('/api/quotes/:id/approve', async (req, res) => {
    try {
      const { signature, ipAddress, userAgent } = req.body;
      const quote = await storage.updateQuote(req.params.id, {
        status: 'approved',
        approvedAt: new Date(),
        signedAt: new Date(),
        signatureData: {
          signature,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString()
        }
      });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה באישור הצעת מחיר' });
    }
  });

  // Quote rejection
  router.post('/api/quotes/:id/reject', async (req, res) => {
    try {
      const quote = await storage.updateQuote(req.params.id, {
        status: 'rejected',
        rejectedAt: new Date()
      });
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בדחיית הצעת מחיר' });
    }
  });

  // Contracts Routes
  router.get('/api/contracts', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const contracts = await storage.getContractsByAgency(user.agencyId!);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת חוזים' });
    }
  });

  router.post('/api/contracts', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const timestamp = Date.now().toString().slice(-6);
      const contractNumber = `CT-${timestamp}`;
      
      const contractData = {
        ...req.body,
        agencyId: user.agencyId!,
        createdBy: user.id,
        contractNumber
      };
      const contract = await storage.createContract(contractData);
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה ביצירת חוזה' });
    }
  });

  // Contract signing
  router.post('/api/contracts/:id/sign', async (req, res) => {
    try {
      const { signature, role, ipAddress, userAgent } = req.body;
      const signatureData = {
        signature,
        signedAt: new Date().toISOString(),
        ipAddress,
        userAgent
      };
      
      const updateData = role === 'client' 
        ? { clientSignature: signatureData }
        : { agencySignature: { ...signatureData, signedBy: req.user?.id } };
        
      const contract = await storage.updateContract(req.params.id, updateData);
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בחתימה על חוזה' });
    }
  });

  // Invoices Routes
  router.get('/api/invoices', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const invoices = await storage.getInvoicesByAgency(user.agencyId!);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת חשבוניות' });
    }
  });

  router.post('/api/invoices', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const timestamp = Date.now().toString().slice(-6);
      const invoiceNumber = `INV-${timestamp}`;
      
      const invoiceData = {
        ...req.body,
        agencyId: user.agencyId!,
        createdBy: user.id,
        invoiceNumber
      };
      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה ביצירת חשבונית' });
    }
  });

  // Payments Routes
  router.get('/api/payments', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const payments = await storage.getPaymentsByAgency(user.agencyId!);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת תשלומים' });
    }
  });

  router.post('/api/payments', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const paymentData = {
        ...req.body,
        agencyId: user.agencyId!,
        createdBy: user.id
      };
      const payment = await storage.createPayment(paymentData);
      
      // Update invoice paid amount if invoiceId is provided
      if (payment.invoiceId) {
        const invoice = await storage.getInvoice(payment.invoiceId);
        if (invoice) {
          const newPaidAmount = invoice.paidAmount + payment.amount;
          const newStatus = newPaidAmount >= invoice.totalAmount ? 'paid' : 'partially_paid';
          await storage.updateInvoice(payment.invoiceId, {
            paidAmount: newPaidAmount,
            status: newStatus,
            paidAt: newStatus === 'paid' ? new Date() : undefined
          });
        }
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה ביצירת תשלום' });
    }
  });

  // Financial Dashboard Stats
  router.get('/api/financial/stats', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      
      const [invoices, payments, quotes, contracts] = await Promise.all([
        storage.getInvoicesByAgency(user.agencyId!),
        storage.getPaymentsByAgency(user.agencyId!),
        storage.getQuotesByAgency(user.agencyId!),
        storage.getContractsByAgency(user.agencyId!)
      ]);

      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const pendingInvoices = invoices.filter(inv => inv.status !== 'paid').length;
      const overdueInvoices = invoices.filter(inv => 
        inv.status !== 'paid' && new Date(inv.dueDate) < new Date()
      ).length;

      res.json({
        totalRevenue: totalRevenue / 100, // Convert from agorot
        pendingInvoices,
        overdueInvoices,
        activeQuotes: quotes.filter(q => q.status === 'sent').length,
        signedContracts: contracts.filter(c => c.status === 'signed').length
      });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת נתונים פיננסיים' });
    }
  });

  // Object Storage Routes
  // Public object serving
  router.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload logo endpoint
  router.post('/api/agencies/:id/upload-logo', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  });

  // Update agency logo
  router.put('/api/agencies/:id/logo', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const { logoURL } = req.body;
      const agencyId = req.params.id;
      
      if (agencyId !== req.user!.agencyId) {
        return res.status(403).json({ message: 'אין הרשאה לעדכן סוכנות אחרת' });
      }

      const agency = await storage.updateAgency(agencyId, {
        logo: logoURL
      });

      res.json(agency);
    } catch (error) {
      console.error('Error updating agency logo:', error);
      res.status(500).json({ message: 'שגיאה בעדכון לוגו' });
    }
  });

  // Get current agency details
  router.get('/api/agencies/current', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const agency = await storage.getAgencyById(user.agencyId!);
      res.json(agency);
    } catch (error) {
      console.error('Error getting agency:', error);
      res.status(500).json({ message: 'שגיאה בטעינת פרטי סוכנות' });
    }
  });

  // Update agency logo for current user
  router.put('/api/agencies/current/logo', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const { logoURL } = req.body;
      const user = req.user!;

      const agency = await storage.updateAgency(user.agencyId!, {
        logo: logoURL
      });

      res.json(agency);
    } catch (error) {
      console.error('Error updating agency logo:', error);
      res.status(500).json({ message: 'שגיאה בעדכון לוגו' });
    }
  });

  // Upload URL for current agency logo
  router.post('/api/agencies/current/upload-logo', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: 'Failed to get upload URL' });
    }
  });

  // Mount the router to the app
  app.use('/', router);

  const httpServer = createServer(app);
  return httpServer;
}
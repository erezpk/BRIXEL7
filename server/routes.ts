import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { insertUserSchema, insertAgencySchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertTaskCommentSchema, insertDigitalAssetSchema, insertChatConversationSchema, insertChatMessageSchema, insertTeamInvitationSchema } from "@shared/schema";
import { z } from "zod";
import express from "express"; // Import express to use its Router
import { emailService } from "./email-service"; // Import from email-service.ts
import crypto from 'crypto'; // Import crypto for token generation
import { verifyGoogleToken } from "./google-auth";
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing

// Import necessary modules for profile update endpoint (if they were intended to be used)
// import { db } from './db'; // Assuming you have a database connection setup
// import { users, projects, tasks } from './schema'; // Assuming schema definitions exist
// import { eq } from 'drizzle-orm';

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
      isActive: boolean; // Added isActive to User interface
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
        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, {
          id: user.id,
          email: user.email,
          fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role,
          agencyId: user.agencyId,
          isActive: user.isActive,
          avatar: user.avatar || user.profileImageUrl
        });
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: Express.User, done) => {
    done(null, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      agencyId: user.agencyId,
      isActive: user.isActive,
      avatar: user.avatar
    });
  });

  passport.deserializeUser(async (user: Express.User, done) => {
    // Fetch the user from storage to ensure they are active and up-to-date
    try {
      const foundUser = await storage.getUserById(user.id);
      if (foundUser) {
        // Reconstruct the user object with the correct structure for Express.User
        const userProfile = {
          id: foundUser.id,
          email: foundUser.email,
          fullName: foundUser.fullName,
          role: foundUser.role,
          agencyId: foundUser.agencyId,
          isActive: foundUser.isActive,
          avatar: foundUser.avatar
        };
        done(null, userProfile);
      } else {
        done(null, false); // User not found or inactive
      }
    } catch (error) {
      done(error);
    }
  });


  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user && req.user.isActive) { // Check if user is active
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

  // Continue with other routes...

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

      // Try to send email, handle if service is not configured
      const emailSent = await emailService.sendPasswordReset({
        to: email,
        userName: user.fullName,
        resetUrl,
        agencyName
      });

      // If email wasn't sent (service not configured), provide alternative for development
      if (!emailSent) {
        console.log('Email service not available. Reset URL:', resetUrl);
        return res.json({
          message: 'שירות האימייל לא זמין כרגע. עבור סביבת פיתוח, ניתן לגשת לקישור הבא:',
          resetUrl: resetUrl,
          development: true
        });
      }

      // If we get here, email was sent successfully
      res.json({ message: 'קישור איפוס סיסמה נשלח לאימייל שלך' });
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
      res.status(500).json({ message: 'שגיאה שרת' });
    }
  });

  // Google OAuth route
  router.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken, email, name, avatar } = req.body;

      console.log('Google auth request:', { email, name, hasToken: !!idToken });

      if (!idToken || !email || !name) {
        console.error('Missing required fields:', { hasToken: !!idToken, hasEmail: !!email, hasName: !!name });
        return res.status(400).json({ message: 'נתונים חסרים' });
      }

      // Verify Google token
      const googleUser = await verifyGoogleToken(idToken);
      if (!googleUser || !googleUser.verified) {
        console.error('Google token verification failed');
        return res.status(401).json({ message: 'אימות Google נכשל' });
      }

      console.log('Google token verified successfully');

      // Create or update user
      const user = await storage.createOrUpdateUserFromGoogle(email, name, avatar);
      console.log('User created/updated:', { userId: user.id, email: user.email });

      // Log user in
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'שגיאה בהתחברות' });
        }

        const { password, ...safeUser } = user;
        console.log('User logged in successfully:', { userId: safeUser.id });
        res.json({ user: safeUser, message: 'התחברות מוצלחת' });
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({ 
        message: 'שגיאה באימות Google',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
        avatar: updateData.avatar || user.avatar,
        isActive: user.isActive // Make sure isActive is included
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

      // Log activity
      await storage.logActivity({
        agencyId: user.agencyId!,
        userId: user.id,
        action: 'invited',
        entityType: 'user',
        entityId: newUser.id,
        details: { userName: newUser.fullName, userEmail: newUser.email },
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

      // Here you would typically send an actual email
      // For now, we'll just simulate the process and log it
      console.log(`Sending invitation email to: ${member.email}`);
      console.log(`Member details: ${member.fullName} (${member.role})`);
      console.log(`Agency: ${user.agencyId}`);

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

  // Mount the router to the app
  // Chat routes
  router.get('/api/chat/conversations', requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getChatConversationsByUser(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת שיחות' });
    }
  });

  router.post('/api/chat/conversations', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const conversationData = insertChatConversationSchema.parse({
        ...req.body,
        agencyId: req.user!.agencyId!,
        createdBy: req.user!.id
      });

      const conversation = await storage.createChatConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה ביצירת שיחה' });
    }
  });

  router.get('/api/chat/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getChatConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: 'שיחה לא נמצאה' });
      }

      const messages = await storage.getChatMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת הודעות' });
    }
  });

  router.post('/api/chat/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getChatConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: 'שיחה לא נמצאה' });
      }

      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        conversationId: req.params.id,
        senderId: req.user!.id
      });

      const message = await storage.createChatMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה בשליחת הודעה' });
    }
  });

  router.put('/api/chat/conversations/:id/read', requireAuth, async (req, res) => {
    try {
      await storage.markMessagesAsRead(req.params.id, req.user!.id);
      res.json({ message: 'הודעות סומנו כנקראו' });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בעדכון סטטוס קריאה' });
    }
  });

  // Leads routes
  router.get('/api/leads', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const leads = await storage.getLeadsByAgency(req.user!.agencyId!);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לידים' });
    }
  });

  router.get('/api/leads/client/:clientId', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const client = await storage.getClient(req.params.clientId);
      if (!client || client.agencyId !== req.user!.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      const leads = await storage.getLeadsByClient(req.params.clientId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לידים של לקוח' });
    }
  });

  // Team invitation routes
  router.post('/api/team/invite', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;

      if (user.role !== 'agency_admin') {
        return res.status(403).json({ message: 'רק מנהלי סוכנות יכולים להזמין חברי צוות' });
      }

      const { email, role, clientId } = req.body;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const invitationData = insertTeamInvitationSchema.parse({
        agencyId: user.agencyId!,
        email,
        role,
        token,
        invitedBy: user.id,
        clientId: clientId || null,
        expiresAt
      });

      const invitation = await storage.createTeamInvitation(invitationData);

      // Send invitation email (placeholder for now)
      const inviteUrl = `${req.protocol}://${req.get('host')}/invite?token=${token}`;

      res.json({
        invitation,
        inviteUrl,
        message: 'הזמנה נשלחה בהצלחה'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'נתונים לא תקינים', errors: error.errors });
      }
      res.status(500).json({ message: 'שגיאה בשליחת הזמנה' });
    }
  });

  router.get('/api/notifications', requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת התראות' });
    }
  });

  router.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: 'התראה סומנה כנקראה' });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בעדכון התראה' });
    }
  });

  app.use('/', router);

  const httpServer = createServer(app);
  return httpServer;
}
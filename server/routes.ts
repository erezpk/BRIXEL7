import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { insertUserSchema, insertAgencySchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertTaskCommentSchema, insertDigitalAssetSchema } from "@shared/schema";
import { z } from "zod";

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
  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user, message: 'התחברות הצליחה' });
  });

  app.post('/api/auth/signup', async (req, res) => {
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

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'שגיאה ביציאה' });
      }
      res.json({ message: 'יציאה הצליחה' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: 'לא מחובר' });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const stats = await storage.getDashboardStats(user.agencyId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת סטטיסטיקות' });
    }
  });

  app.get('/api/dashboard/activity', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/client/stats', requireAuth, requireClientRole, async (req, res) => {
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

  app.get('/api/client/projects', requireAuth, requireClientRole, async (req, res) => {
    try {
      const user = req.user!;
      const projects = await storage.getProjectsByClient(user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פרויקטים של הלקוח' });
    }
  });

  app.get('/api/client/activity', requireAuth, requireClientRole, async (req, res) => {
    try {
      // Get activity related to client's projects and tasks
      const limit = parseInt(req.query.limit as string) || 10;
      // For now, return empty array - this would need more complex query logic
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פעילות לקוח' });
    }
  });

  app.get('/api/client/files', requireAuth, requireClientRole, async (req, res) => {
    try {
      // Return empty array for now - file management would be implemented later
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת קבצי לקוח' });
    }
  });

  // Clients routes
  app.get('/api/clients', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const clients = await storage.getClientsByAgency(user.agencyId!);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לקוחות' });
    }
  });

  app.post('/api/clients', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.get('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.put('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.delete('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/projects', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.post('/api/projects', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/projects/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.put('/api/projects/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/projects/:id/tasks', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/projects/:id/assets', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/tasks', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.post('/api/tasks', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.put('/api/tasks/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/tasks/:id/comments', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.post('/api/tasks/:id/comments', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/assets', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.post('/api/assets', requireAuth, requireUserWithAgency, async (req, res) => {
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
  app.get('/api/client/leads/:clientId', requireAuth, async (req, res) => {
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

  app.get('/api/client/clients/:clientId', requireAuth, async (req, res) => {
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
  app.get('/api/team', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const teamMembers = await storage.getUsersByAgency(req.user!.agencyId!);
      // Remove password from response
      const safeTeamMembers = teamMembers.map(({ password, ...member }) => member);
      res.json(safeTeamMembers);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת חברי צוות' });
    }
  });

  app.post('/api/team/invite', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.put('/api/team/:id/toggle-active', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.put('/api/team/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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

  app.post('/api/team/:id/resend-invite', requireAuth, requireUserWithAgency, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
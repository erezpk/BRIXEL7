import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertClientSchema, insertProjectSchema, insertTaskSchema, insertTaskCommentSchema, insertDigitalAssetSchema, insertChatConversationSchema, insertChatMessageSchema, insertTeamInvitationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

  // Middleware for checking agency access (simplified)
  const requireAuth = isAuthenticated;

  // Dashboard routes
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }
      const stats = await storage.getDashboardStats(user.agencyId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת סטטיסטיקות' });
    }
  });

  app.get('/api/dashboard/activity', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await storage.getActivityLog(user.agencyId, limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פעילות' });
    }
  });

  // Clients routes
  app.get('/api/clients', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }
      const clients = await storage.getClientsByAgency(user.agencyId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לקוחות' });
    }
  });

  app.post('/api/clients', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }

      const clientData = insertClientSchema.parse({
        ...req.body,
        agencyId: user.agencyId,
      });

      const client = await storage.createClient(clientData);

      // Log activity
      await storage.logActivity({
        agencyId: user.agencyId,
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

  app.get('/api/clients/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }
      const client = await storage.getClient(req.params.id);
      if (!client || client.agencyId !== user.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת לקוח' });
    }
  });

  app.put('/api/clients/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }
      const client = await storage.getClient(req.params.id);
      if (!client || client.agencyId !== user.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      const updateData = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(req.params.id, updateData);

      await storage.logActivity({
        agencyId: user.agencyId,
        userId: user.id,
        action: 'updated',
        entityType: 'client',
        entityId: client.id,
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

  app.delete('/api/clients/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }
      const client = await storage.getClient(req.params.id);
      if (!client || client.agencyId !== user.agencyId) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }

      await storage.deleteClient(req.params.id);

      await storage.logActivity({
        agencyId: user.agencyId,
        userId: user.id,
        action: 'deleted',
        entityType: 'client',
        entityId: client.id,
        details: { clientName: client.name },
      });

      res.json({ message: 'לקוח נמחק בהצלחה' });
    } catch (error) {
      res.status(500).json({ message: 'שגיאה במחיקת לקוח' });
    }
  });

  // Projects routes
  app.get('/api/projects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }
      const projects = await storage.getProjectsByAgency(user.agencyId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת פרויקטים' });
    }
  });

  app.post('/api/projects', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }

      const projectData = insertProjectSchema.parse({
        ...req.body,
        agencyId: user.agencyId,
        createdBy: user.id,
      });

      const project = await storage.createProject(projectData);

      await storage.logActivity({
        agencyId: user.agencyId,
        userId: user.id,
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

  // Tasks routes
  app.get('/api/tasks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }
      const tasks = await storage.getTasksByAgency(user.agencyId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'שגיאה בטעינת משימות' });
    }
  });

  app.post('/api/tasks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.agencyId) {
        return res.status(400).json({ message: 'משתמש לא שויך לסוכנות' });
      }

      const taskData = insertTaskSchema.parse({
        ...req.body,
        agencyId: user.agencyId,
        createdBy: user.id,
      });

      const task = await storage.createTask(taskData);

      await storage.logActivity({
        agencyId: user.agencyId,
        userId: user.id,
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

  const httpServer = createServer(app);
  return httpServer;
}
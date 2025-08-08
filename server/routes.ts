import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { insertChatConversationSchema, insertChatMessageSchema, insertChatSettingsSchema } from "@shared/schema";
import { insertUserSchema, insertAgencySchema, insertClientSchema, insertProjectSchema, insertTaskSchema, insertTaskCommentSchema, insertDigitalAssetSchema, insertClientCardTemplateSchema, insertClientSettingsSchema, insertProductSchema, insertQuoteSchema, insertContractSchema, insertInvoiceSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import express from "express";
import { emailService } from "./email-service.js";
import crypto from 'crypto';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
import { ObjectPermission } from './objectAcl';
import { generateQuotePDF } from './pdf-generator';
import { google } from 'googleapis';
import { setupAuth, isAuthenticated } from "./replitAuth";

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

// Helper middleware functions
function requireAuth(req: any, res: any, next: any) {
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

  app.get('/api/auth/me', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({ user: user.claims });
    } catch (error) {
      console.error("Error in auth/me:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Agency routes
  router.get('/api/agencies', requireAuth, async (req, res) => {
    try {
      // For now, return empty array or implement agency listing
      res.json([]);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      res.status(500).json({ message: 'שגיאה בטעינת סוכנויות' });
    }
  });

  // Client routes
  router.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
      // For now, return empty array since we're transitioning auth
      res.json([]);
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ message: 'שגיאה בטעינת לקוחות' });
    }
  });

  router.post('/api/clients', isAuthenticated, async (req, res) => {
    try {
      // For testing, use a dummy agency ID
      const clientData = insertClientSchema.parse({
        ...req.body,
        agencyId: "407ab060-c765-4347-8233-0e7311a7adde" // Use existing agency ID
      });
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({ message: 'שגיאה ביצירת לקוח' });
    }
  });

  router.get('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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

  router.put('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
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

  router.delete('/api/clients/:id', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ message: 'שגיאה במחיקת לקוח' });
    }
  });

  // Users routes
  router.get('/api/users', requireAuth, requireUserWithAgency, async (req, res) => {
    try {
      const user = req.user!;
      const users = await storage.getUsersByAgency(user.agencyId!);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'שגיאה בטעינת משתמשים' });
    }
  });

  // Mount the router to the app
  app.use('/', router);

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebSocketServer(httpServer, storage);
  
  return httpServer;
}
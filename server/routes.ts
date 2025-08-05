import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { firebaseSync } from "./firebase-sync";

export async function registerRoutes(app: Express): Promise<Server> {

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
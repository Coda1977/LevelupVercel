/**
 * User progress tracking routes
 */

import type { Express } from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';

export function registerProgressRoutes(app: Express) {
  // Get user progress
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Mark chapter complete
  app.post('/api/progress/:chapterId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chapterId } = req.params;
      
      await storage.markChapterComplete(userId, parseInt(chapterId));
      
      const updatedProgress = await storage.getUserProgress(userId);
      res.json(updatedProgress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });
}
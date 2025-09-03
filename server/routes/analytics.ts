/**
 * Analytics routes
 */

import type { Express } from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';

export function registerAnalyticsRoutes(app: Express) {
  // Get general analytics
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await storage.getAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get content analytics
  app.get('/api/analytics/content', isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await storage.getContentAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching content analytics:", error);
      res.status(500).json({ message: "Failed to fetch content analytics" });
    }
  });
}
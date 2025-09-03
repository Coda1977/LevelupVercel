/**
 * Main routes file - imports and registers all route modules
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";

// Import route modules
import { registerAuthRoutes } from "./routes/auth";
import { registerCategoryRoutes } from "./routes/categories";
import { registerChapterRoutes } from "./routes/chapters";
import { registerChatRoutes } from "./routes/chat";
import { registerProgressRoutes } from "./routes/progress";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerTeamRoutes } from "./routes/team";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Register all route modules
  registerAuthRoutes(app);
  registerCategoryRoutes(app);
  registerChapterRoutes(app);
  registerChatRoutes(app);
  registerProgressRoutes(app);
  registerAnalyticsRoutes(app);
  registerTeamRoutes(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
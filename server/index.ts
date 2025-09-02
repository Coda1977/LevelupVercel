import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static assets with optimized caching headers
const staticAssetOptions = {
  maxAge: '1y', // 1 year for static assets with hashes
  etag: true,
  lastModified: true,
  setHeaders: (res: Response, path: string) => {
    // Different cache strategies for different asset types
    if (path.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
      // Long cache for JS, CSS, fonts (usually have hashes)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    } else if (path.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) {
      // Medium cache for images
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
    } else if (path.match(/\.(mp3|wav|ogg|mp4|webm)$/)) {
      // Medium cache for media files
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
    } else {
      // Short cache for other files
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    }
    
    // Add compression hint
    res.setHeader('Vary', 'Accept-Encoding');
  }
};

// Serve audio files with caching
app.use('/audio', express.static('public/audio', staticAssetOptions));

// Add compression middleware for better performance
import compression from 'compression';
app.use(compression({
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Fallback to standard filter function
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression ratio and CPU usage
  threshold: 1024 // Only compress responses larger than 1KB
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Enhanced error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || "Internal Server Error";

    // Only send response if not already sent
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    
    // Don't re-throw the error - let the process continue
  });

  // Handle uncaught exceptions and unhandled promise rejections
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log but don't crash the process for unhandled rejections
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

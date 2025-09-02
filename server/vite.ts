import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Enhanced static file serving with caching
  app.use(express.static(distPath, {
    maxAge: '1y', // Default to 1 year for hashed assets
    etag: true,
    lastModified: true,
    immutable: true,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      
      // Immutable assets with hashes get longer cache
      if (filePath.includes('assets/') || filePath.match(/-[a-f0-9]{8,}\./)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      }
      // JS and CSS files (may have hashes)
      else if (['.js', '.css', '.mjs'].includes(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      }
      // Images and media
      else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.mp3', '.mp4', '.webm'].includes(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
      }
      // Fonts
      else if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      }
      // HTML files should not be cached aggressively
      else if (ext === '.html') {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      // Default for other files
      else {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      }
      
      // Security headers for production
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Enable compression for text-based files
      if (['.html', '.css', '.js', '.json', '.xml', '.svg', '.mjs'].includes(ext)) {
        res.setHeader('Vary', 'Accept-Encoding');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

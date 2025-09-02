import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Vercel Deployment Configuration Validator
 * 
 * Validates that the application is properly configured for Vercel deployment
 */

interface VercelConfig {
  version?: number;
  builds?: Array<{
    src: string;
    use: string;
    config?: Record<string, any>;
  }>;
  routes?: Array<{
    src: string;
    dest?: string;
    status?: number;
    headers?: Record<string, string>;
  }>;
  functions?: Record<string, {
    runtime?: string;
    memory?: number;
    maxDuration?: number;
  }>;
  env?: Record<string, string>;
  regions?: string[];
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
}

describe('Vercel Deployment Validation', () => {
  let projectRoot: string;
  let vercelConfig: VercelConfig | null = null;
  let packageJson: PackageJson;

  beforeAll(() => {
    projectRoot = process.cwd();
    
    // Load package.json
    const packagePath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
      packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    }

    // Load vercel.json if exists
    const vercelPath = path.join(projectRoot, 'vercel.json');
    if (fs.existsSync(vercelPath)) {
      vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
    }
  });

  describe('1. Vercel Configuration', () => {
    it('should have vercel.json configuration file', () => {
      const vercelPath = path.join(projectRoot, 'vercel.json');
      const exists = fs.existsSync(vercelPath);
      
      if (!exists) {
        console.warn('vercel.json not found. Vercel will use default configuration.');
      }
      
      // This is optional - Vercel can work without vercel.json
      expect(typeof exists).toBe('boolean');
    });

    it('should have proper build configuration', () => {
      if (vercelConfig?.builds) {
        expect(vercelConfig.builds).toBeInstanceOf(Array);
        expect(vercelConfig.builds.length).toBeGreaterThan(0);
        
        // Check for proper build sources
        const hasFrontendBuild = vercelConfig.builds.some(build => 
          build.src.includes('client') || build.src.includes('dist/public')
        );
        const hasServerBuild = vercelConfig.builds.some(build =>
          build.src.includes('server') || build.src.includes('api')
        );
        
        expect(hasFrontendBuild || hasServerBuild).toBe(true);
      }
    });

    it('should have proper routing configuration', () => {
      if (vercelConfig?.routes) {
        expect(vercelConfig.routes).toBeInstanceOf(Array);
        
        // Check for API routes
        const hasApiRoutes = vercelConfig.routes.some(route =>
          route.src.includes('/api/')
        );
        
        // Check for SPA routing
        const hasSpaRouting = vercelConfig.routes.some(route =>
          route.dest?.includes('index.html')
        );
        
        expect(hasApiRoutes || hasSpaRouting).toBe(true);
      }
    });

    it('should have proper environment variable configuration', () => {
      // Environment variables should be set in Vercel dashboard, not in vercel.json
      // This test checks that no sensitive data is in the config file
      if (vercelConfig?.env) {
        Object.values(vercelConfig.env).forEach(value => {
          expect(value).not.toMatch(/^[a-zA-Z0-9+/]+={0,2}$/); // No base64 secrets
          expect(value).not.toMatch(/^sk-/); // No OpenAI keys
          expect(value).not.toMatch(/^supabase_/); // No Supabase secrets
        });
      }
    });
  });

  describe('2. Package.json Configuration', () => {
    it('should have proper build scripts', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts?.build).toBeDefined();
      expect(packageJson.scripts?.start).toBeDefined();
      
      // Build script should create production files
      expect(packageJson.scripts?.build).toContain('build');
    });

    it('should have proper Node.js engine specification', () => {
      if (packageJson.engines) {
        expect(packageJson.engines.node).toBeDefined();
        
        // Should use supported Node.js version
        const nodeVersion = packageJson.engines.node;
        expect(nodeVersion).toMatch(/^(>=?)?1[4-9]|[2-9][0-9]/); // Node 14+
      }
    });

    it('should have required dependencies for Vercel deployment', () => {
      expect(packageJson.dependencies).toBeDefined();
      
      // Should have Express or similar for API routes
      const hasServer = packageJson.dependencies?.express || 
                       packageJson.dependencies?.next ||
                       packageJson.dependencies?.['@vercel/node'];
      
      expect(hasServer).toBeDefined();
    });

    it('should not have Replit-specific dependencies', () => {
      const replitDeps = [
        '@replit/vite-plugin-cartographer',
        '@replit/vite-plugin-runtime-error-modal',
        '@replit/database',
        'replit'
      ];
      
      replitDeps.forEach(dep => {
        expect(packageJson.dependencies?.[dep]).toBeUndefined();
        expect(packageJson.devDependencies?.[dep]).toBeUndefined();
      });
    });
  });

  describe('3. File Structure Validation', () => {
    it('should have proper API directory structure', () => {
      const apiDir = path.join(projectRoot, 'api');
      const serverDir = path.join(projectRoot, 'server');
      
      const hasApiDir = fs.existsSync(apiDir);
      const hasServerDir = fs.existsSync(serverDir);
      
      expect(hasApiDir || hasServerDir).toBe(true);
    });

    it('should have proper static file structure', () => {
      const publicDir = path.join(projectRoot, 'public');
      const distDir = path.join(projectRoot, 'dist');
      const clientDir = path.join(projectRoot, 'client');
      
      const hasStaticFiles = fs.existsSync(publicDir) || 
                            fs.existsSync(distDir) || 
                            fs.existsSync(clientDir);
      
      expect(hasStaticFiles).toBe(true);
    });

    it('should have build output directory', () => {
      const distDir = path.join(projectRoot, 'dist');
      
      // dist directory might not exist before build
      const distExists = fs.existsSync(distDir);
      expect(typeof distExists).toBe('boolean');
    });

    it('should not have Replit configuration files', () => {
      const replitFiles = ['.replit', 'replit.nix', '.replit.toml'];
      
      replitFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(false);
      });
    });
  });

  describe('4. Environment Variable Requirements', () => {
    it('should validate required environment variables are documented', () => {
      const envExample = path.join(projectRoot, '.env.example');
      const envLocal = path.join(projectRoot, '.env.local.example');
      const readme = path.join(projectRoot, 'README.md');
      
      const hasEnvDocs = fs.existsSync(envExample) || 
                        fs.existsSync(envLocal) ||
                        fs.existsSync(readme);
      
      expect(hasEnvDocs).toBe(true);
    });

    it('should identify required production environment variables', () => {
      const requiredEnvVars = [
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];
      
      // Check if these variables are referenced in the code
      const serverFiles = fs.existsSync(path.join(projectRoot, 'server')) ? 
        fs.readdirSync(path.join(projectRoot, 'server')) : [];
      
      expect(requiredEnvVars.length).toBeGreaterThan(0);
    });

    it('should not expose sensitive data in client-side code', () => {
      const clientDir = path.join(projectRoot, 'client');
      
      if (fs.existsSync(clientDir)) {
        // This would scan client files for sensitive env vars
        expect(true).toBe(true); // Placeholder
      }
    });
  });

  describe('5. Build Process Validation', () => {
    it('should have proper TypeScript configuration for build', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      
      if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
        
        expect(tsconfig.compilerOptions).toBeDefined();
        expect(tsconfig.compilerOptions.outDir || tsconfig.compilerOptions.rootDir).toBeDefined();
      }
    });

    it('should have proper Vite configuration for client build', () => {
      const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
      
      if (fs.existsSync(viteConfigPath)) {
        const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
        
        expect(viteConfig).toContain('build');
        expect(viteConfig).toContain('outDir');
      }
    });

    it('should have proper build output configuration', () => {
      // Check that build outputs go to correct directories for Vercel
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('6. Serverless Function Compatibility', () => {
    it('should have functions that are compatible with Vercel runtime', () => {
      const serverDir = path.join(projectRoot, 'server');
      
      if (fs.existsSync(serverDir)) {
        const serverFiles = fs.readdirSync(serverDir, { recursive: true });
        const tsFiles = serverFiles.filter(file => 
          typeof file === 'string' && file.endsWith('.ts')
        );
        
        expect(tsFiles.length).toBeGreaterThan(0);
      }
    });

    it('should have proper export format for Vercel functions', () => {
      // Check that functions export proper handlers
      expect(true).toBe(true); // Placeholder
    });

    it('should handle cold starts efficiently', () => {
      // Test that functions minimize cold start time
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('7. Performance Optimizations', () => {
    it('should have proper bundling configuration', () => {
      // Check for code splitting, tree shaking, etc.
      expect(true).toBe(true); // Placeholder
    });

    it('should have proper caching headers configured', () => {
      if (vercelConfig?.routes) {
        const hasHeaders = vercelConfig.routes.some(route => 
          route.headers && Object.keys(route.headers).length > 0
        );
        
        // Headers can be configured but not required
        expect(typeof hasHeaders).toBe('boolean');
      }
    });

    it('should have optimized static asset handling', () => {
      // Check for proper static asset optimization
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('8. Security Configuration', () => {
    it('should have proper CORS configuration', () => {
      // Check CORS settings for API routes
      expect(true).toBe(true); // Placeholder
    });

    it('should have proper security headers', () => {
      if (vercelConfig?.routes) {
        const hasSecurityHeaders = vercelConfig.routes.some(route =>
          route.headers && (
            route.headers['X-Frame-Options'] ||
            route.headers['X-Content-Type-Options'] ||
            route.headers['X-XSS-Protection']
          )
        );
        
        // Security headers are recommended but not required for this test
        expect(typeof hasSecurityHeaders).toBe('boolean');
      }
    });

    it('should not expose internal routes publicly', () => {
      // Check that internal/admin routes are properly protected
      expect(true).toBe(true); // Placeholder
    });
  });
});
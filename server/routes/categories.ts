/**
 * Category management routes
 */

import type { Express } from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';

export function registerCategoryRoutes(app: Express) {
  // Get all categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create category
  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const { title, description, sortOrder } = req.body;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      const category = await storage.createCategory({
        slug,
        title,
        description,
        sortOrder: sortOrder || 0,
      });
      
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Reorder categories
  app.post('/api/categories/reorder', isAuthenticated, async (req, res) => {
    try {
      const { categories } = req.body;
      
      for (const cat of categories) {
        await storage.updateCategorySortOrder(cat.id, cat.sortOrder);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering categories:", error);
      res.status(500).json({ message: "Failed to reorder categories" });
    }
  });

  // Get category progress
  app.get('/api/categories/:categoryId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { categoryId } = req.params;
      const progress = await storage.getCategoryProgress(userId, parseInt(categoryId));
      res.json(progress);
    } catch (error) {
      console.error("Error fetching category progress:", error);
      res.status(500).json({ message: "Failed to fetch category progress" });
    }
  });
}
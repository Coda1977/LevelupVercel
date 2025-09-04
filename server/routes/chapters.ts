/**
 * Chapter management routes
 */

import type { Express } from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';
import { generateAudio, deleteAudioFile } from '../audio';
import { nanoid } from 'nanoid';

export function registerChapterRoutes(app: Express) {
  // Get all chapters
  app.get('/api/chapters', async (req, res) => {
    try {
      const { categoryId } = req.query;
      const chapters = categoryId 
        ? await storage.getChaptersByCategory(parseInt(categoryId as string))
        : await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  // Get single chapter
  app.get('/api/chapters/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const chapter = await storage.getChapterBySlug(slug);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      console.error("Error fetching chapter:", error);
      res.status(500).json({ message: "Failed to fetch chapter" });
    }
  });

  // Create chapter
  app.post('/api/chapters', isAuthenticated, async (req, res) => {
    try {
      const { 
        title, 
        content, 
        summary, 
        categoryId, 
        sortOrder,
        publishedAt,
        author,
        bookTitle,
        bookAuthor,
        keyTakeaways,
        isBookSummary
      } = req.body;

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      const chapter = await storage.createChapter({
        slug,
        title,
        content,
        summary,
        categoryId: parseInt(categoryId),
        sortOrder: sortOrder || 0,
        publishedAt: publishedAt || new Date().toISOString(),
        author,
        bookTitle,
        bookAuthor,
        keyTakeaways,
        isBookSummary: isBookSummary || false
      });
      
      res.json(chapter);
    } catch (error) {
      console.error("Error creating chapter:", error);
      res.status(500).json({ message: "Failed to create chapter" });
    }
  });

  // Update chapter
  app.put('/api/chapters/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (updates.title && !updates.slug) {
        updates.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }
      
      const chapter = await storage.updateChapter(parseInt(id), updates);
      res.json(chapter);
    } catch (error) {
      console.error("Error updating chapter:", error);
      res.status(500).json({ message: "Failed to update chapter" });
    }
  });

  // Delete chapter
  app.delete('/api/chapters/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteChapter(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      res.status(500).json({ message: "Failed to delete chapter" });
    }
  });

  // Reorder chapters
  app.post('/api/chapters/reorder', isAuthenticated, async (req, res) => {
    try {
      const { chapters } = req.body;
      
      for (const chapter of chapters) {
        await storage.updateChapterSortOrder(chapter.id, chapter.sortOrder);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering chapters:", error);
      res.status(500).json({ message: "Failed to reorder chapters" });
    }
  });

  // Generate audio for chapter
  app.post('/api/chapters/:id/generate-audio', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const chapter = await storage.getChapterById(parseInt(id));
      
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      const audioFileName = `chapter-${id}-${Date.now()}.mp3`;
      const audioUrl = await generateAudio(chapter.content, audioFileName);
      
      await storage.updateChapter(parseInt(id), { audioUrl });
      
      res.json({ audioUrl });
    } catch (error) {
      console.error("Error generating audio:", error);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });

  // Delete audio for chapter
  app.delete('/api/chapters/:id/audio', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const chapter = await storage.getChapterById(parseInt(id));
      
      if (!chapter || !chapter.audioUrl) {
        return res.status(404).json({ message: "Audio not found" });
      }

      await deleteAudioFile(chapter.audioUrl);
      await storage.updateChapter(parseInt(id), { audioUrl: null });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting audio:", error);
      res.status(500).json({ message: "Failed to delete audio" });
    }
  });

  // Share chapter
  app.post('/api/chapters/:chapterId/share', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { chapterId } = req.params;
      
      const shareId = nanoid(10);
      await storage.createSharedChapter({
        shareId,
        chapterId: parseInt(chapterId),
        sharedBy: userId,
      });
      
      res.json({ shareId });
    } catch (error) {
      console.error("Error sharing chapter:", error);
      res.status(500).json({ message: "Failed to share chapter" });
    }
  });

  // Get shared chapter
  app.get('/api/shared/:shareId', async (req, res) => {
    try {
      const { shareId } = req.params;
      const sharedChapter = await storage.getSharedChapter(shareId);
      
      if (!sharedChapter) {
        return res.status(404).json({ message: "Shared chapter not found" });
      }
      
      const chapter = await storage.getChapterById(sharedChapter.chapterId);
      res.json(chapter);
    } catch (error) {
      console.error("Error fetching shared chapter:", error);
      res.status(500).json({ message: "Failed to fetch shared chapter" });
    }
  });
}
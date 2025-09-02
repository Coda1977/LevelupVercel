import express, { Request, Response, NextFunction } from 'express';
import { storage } from '@server/storage';

// Create a test-specific Express app without the static file serving
const createTestApp = () => {
  const app = express();

  // Basic middleware
  app.use(express.json());

  // Simple session mock for testing
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      (req as any).session = {};
    }
    next();
  });

  // Mock isAuthenticated middleware for testing
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && (req.session as any).user) {
      (req as any).user = (req.session as any).user;
      next();
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  };

  // Use the storage instance

  // Auth routes
  app.post('/api/auth/session', (req: Request, res: Response) => {
    (req.session as any).user = req.body.user;
    res.json({ success: true });
  });

  app.get('/api/auth/user', isAuthenticated, (req: Request, res: Response) => {
    res.json((req as any).user);
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    (req.session as any).user = null;
    res.json({ success: true });
  });

  app.get('/api/auth/login', (req: Request, res: Response) => {
    res.redirect(302, 'https://replit.com/oauth/authorize');
  });

  app.get('/api/auth/callback', (req: Request, res: Response) => {
    const { code } = req.query;
    if (code === 'mock-code') {
      (req.session as any).user = {
        id: 'test-user-id',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com'
      };
      res.redirect(302, '/dashboard');
    } else {
      res.redirect(302, '/login?error=auth_failed');
    }
  });

  // Public content routes
  app.get('/api/chapters', async (req: Request, res: Response) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      res.status(500).json({ message: 'Failed to fetch chapters' });
    }
  });

  app.get('/api/chapters/:id', async (req: Request, res: Response) => {
    try {
      const chapter = await storage.getChapterById(parseInt(req.params.id));
      if (chapter) {
        res.json(chapter);
      } else {
        res.status(404).json({ message: 'Chapter not found' });
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
      res.status(500).json({ message: 'Failed to fetch chapter' });
    }
  });

  app.get('/api/categories', async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Admin routes
  app.get('/api/admin/chapters', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      console.error('Error fetching admin chapters:', error);
      res.status(500).json({ message: 'Failed to fetch chapters' });
    }
  });

  app.post('/api/admin/chapters', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const chapter = await storage.createChapter(req.body);
      res.status(201).json(chapter);
    } catch (error) {
      console.error('Error creating chapter:', error);
      res.status(400).json({ message: 'Failed to create chapter' });
    }
  });

  app.get('/api/admin/chapters/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const chapter = await storage.getChapterById(parseInt(req.params.id));
      if (chapter) {
        res.json(chapter);
      } else {
        res.status(404).json({ message: 'Chapter not found' });
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
      res.status(500).json({ message: 'Failed to fetch chapter' });
    }
  });

  app.put('/api/admin/chapters/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const chapter = await storage.updateChapter(parseInt(req.params.id), req.body);
      res.json(chapter);
    } catch (error) {
      console.error('Error updating chapter:', error);
      res.status(500).json({ message: 'Failed to update chapter' });
    }
  });

  app.delete('/api/admin/chapters/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteChapter(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      res.status(500).json({ message: 'Failed to delete chapter' });
    }
  });

  // Categories admin routes
  app.get('/api/admin/categories', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.post('/api/admin/categories', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(400).json({ message: 'Failed to create category' });
    }
  });

  app.put('/api/admin/categories/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const category = await storage.updateCategory(parseInt(req.params.id), req.body);
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });

  app.delete('/api/admin/categories/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteCategory(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  // Bulk operations
  app.post('/api/admin/chapters/bulk-delete', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!ids || ids.length === 0) {
        return res.status(400).json({ message: 'No chapter IDs provided' });
      }
      
      let deletedCount = 0;
      for (const id of ids) {
        try {
          await storage.deleteChapter(id);
          deletedCount++;
        } catch (error) {
          // Continue with other deletions
        }
      }
      
      res.json({ deletedCount });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      res.status(500).json({ message: 'Failed to delete chapters' });
    }
  });

  app.post('/api/admin/chapters/bulk-update', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { ids, updates } = req.body;
      if (!ids || ids.length === 0) {
        return res.status(400).json({ message: 'No chapter IDs provided' });
      }
      
      let updatedCount = 0;
      for (const id of ids) {
        try {
          await storage.updateChapter(id, updates);
          updatedCount++;
        } catch (error) {
          // Continue with other updates
        }
      }
      
      res.json({ updatedCount });
    } catch (error) {
      console.error('Error in bulk update:', error);
      res.status(500).json({ message: 'Failed to update chapters' });
    }
  });

  // Analytics routes
  app.get('/api/admin/analytics', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const analytics = await storage.getContentAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Chat routes
  app.get('/api/chat/sessions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessions = await storage.getChatSessions((req as any).user.id);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({ message: 'Failed to fetch chat sessions' });
    }
  });

  app.post('/api/chat/sessions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const session = await storage.createChatSession({
        userId: (req as any).user.id,
        name: req.body.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(400).json({ message: 'Failed to create chat session' });
    }
  });

  app.get('/api/chat/sessions/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (session && session.userId === (req as any).user.id) {
        res.json(session);
      } else if (session) {
        res.status(403).json({ message: 'Access denied' });
      } else {
        res.status(404).json({ message: 'Session not found' });
      }
    } catch (error) {
      console.error('Error fetching chat session:', error);
      res.status(500).json({ message: 'Failed to fetch chat session' });
    }
  });

  app.put('/api/chat/sessions/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const session = await storage.updateChatSessionName(req.params.id, req.body.name);
      res.json(session);
    } catch (error) {
      console.error('Error updating chat session:', error);
      res.status(500).json({ message: 'Failed to update chat session' });
    }
  });

  app.delete('/api/chat/sessions/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteChatSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({ message: 'Failed to delete chat session' });
    }
  });

  // Chat messages and AI routes
  app.post('/api/chat/sessions/:id/messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.body.message || req.body.message.trim() === '') {
        return res.status(400).json({ message: 'Message cannot be empty' });
      }

      const session = await storage.getChatSession(req.params.id);
      if (!session || session.userId !== (req as any).user.id) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Mock AI response
      const response = 'Mocked AI response';
      
      // In real implementation, save messages to database
      res.json({ response });
    } catch (error) {
      console.error('Error processing chat message:', error);
      res.status(500).json({ message: 'Failed to process message' });
    }
  });

  app.get('/api/chat/sessions/:id/messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const session = await storage.getChatSession(req.params.id);
      if (!session || session.userId !== (req as any).user.id) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Mock messages - in real implementation, fetch from database
      const messages = [
        { role: 'user', content: 'Test message', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Mocked AI response', timestamp: new Date().toISOString() }
      ];
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chat/sessions/:id/stream', isAuthenticated, (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    res.write('data: Mocked streaming response\n\n');
    res.end();
  });

  app.post('/api/chat/sessions/:id/generate-name', isAuthenticated, (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      if (!messages || messages.length === 0) {
        return res.status(400).json({ message: 'No messages provided' });
      }

      // Mock AI-generated name
      const name = 'AI Generated Session Name';
      res.json({ name });
    } catch (error) {
      console.error('Error generating session name:', error);
      res.status(500).json({ message: 'Failed to generate session name' });
    }
  });

  // Progress routes
  app.get('/api/progress', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const progress = await storage.getUserProgress((req as any).user.id);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      res.status(500).json({ message: 'Failed to fetch progress' });
    }
  });

  app.post('/api/progress', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { chapterId, completed } = req.body;
      
      if (!chapterId || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'Invalid progress data' });
      }

      // Check if chapter exists
      const chapter = await storage.getChapterById(chapterId);
      if (!chapter) {
        return res.status(400).json({ message: 'Chapter not found' });
      }

      const progress = await storage.updateUserProgress({
        userId: (req as any).user.id,
        chapterId,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      if (progress.id) {
        res.json(progress);
      } else {
        res.status(201).json(progress);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      res.status(500).json({ message: 'Failed to update progress' });
    }
  });

  app.get('/api/progress/chapter/:chapterId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const progress = await storage.getUserProgressForChapter(
        (req as any).user.id, 
        parseInt(req.params.chapterId)
      );
      res.json(progress);
    } catch (error) {
      console.error('Error fetching chapter progress:', error);
      res.status(500).json({ message: 'Failed to fetch chapter progress' });
    }
  });

  app.get('/api/progress/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getUserProgressStats((req as any).user.id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
      res.status(500).json({ message: 'Failed to fetch progress stats' });
    }
  });

  app.get('/api/progress/category-stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getCategoryProgressStats((req as any).user.id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching category progress stats:', error);
      res.status(500).json({ message: 'Failed to fetch category progress stats' });
    }
  });

  app.get('/api/progress/chapter/:chapterId/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const history = await storage.getUserProgressHistory(
        (req as any).user.id, 
        parseInt(req.params.chapterId)
      );
      res.json(history);
    } catch (error) {
      console.error('Error fetching progress history:', error);
      res.status(500).json({ message: 'Failed to fetch progress history' });
    }
  });

  app.get('/api/progress/activity', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const activity = await storage.getUserProgressActivity((req as any).user.id);
      res.json(activity);
    } catch (error) {
      console.error('Error fetching progress activity:', error);
      res.status(500).json({ message: 'Failed to fetch progress activity' });
    }
  });

  app.delete('/api/progress/reset', isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.resetUserProgress((req as any).user.id);
      res.json({ message: 'Progress reset successfully' });
    } catch (error) {
      console.error('Error resetting progress:', error);
      res.status(500).json({ message: 'Failed to reset progress' });
    }
  });

  app.post('/api/progress/bulk-complete', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { chapterIds } = req.body;
      if (!chapterIds || !Array.isArray(chapterIds)) {
        return res.status(400).json({ message: 'Invalid chapter IDs' });
      }

      let completedCount = 0;
      for (const chapterId of chapterIds) {
        try {
          await storage.updateUserProgress({
            userId: (req as any).user.id,
            chapterId,
            completed: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          completedCount++;
        } catch (error) {
          // Continue with other chapters
        }
      }

      res.json({ completedCount });
    } catch (error) {
      console.error('Error in bulk complete:', error);
      res.status(500).json({ message: 'Failed to complete chapters' });
    }
  });

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Server error:', err);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  return app;
};

export default createTestApp;
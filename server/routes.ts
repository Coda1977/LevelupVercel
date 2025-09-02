import type { Express } from "express";
import { createServer, type Server } from "http";

// Always use real implementations
const storageModule = await import("./storage");
const storage = storageModule.storage;

const authModule = await import("./replitAuth");

const { setupAuth, isAuthenticated } = authModule;
import { getChatResponse, getOpenAIChatResponse, getChatResponseStream } from "./openai";
import { generateAudio, generateHighQualityAudio, deleteAudioFile } from "./audio";
import { QueryOptimizer } from "./query-optimizations";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const { title, description, sortOrder } = req.body;
      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      const category = await storage.createCategory({
        slug,
        title,
        description,
        sortOrder: sortOrder || 1,
      });
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.post('/api/categories/reorder', isAuthenticated, async (req, res) => {
    try {
      const { order } = req.body; // order: [{id, sortOrder}]
      if (!Array.isArray(order)) return res.status(400).json({ message: 'Invalid order array' });
      for (const { id, sortOrder } of order) {
        await storage.updateCategory(id, { sortOrder });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error reordering categories:', error);
      res.status(500).json({ message: 'Failed to reorder categories' });
    }
  });

  // Chapters routes
  app.get('/api/chapters', async (req, res) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.get('/api/chapters/:slug', async (req, res) => {
    try {
      const chapter = await storage.getChapterBySlug(req.params.slug);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      console.error("Error fetching chapter:", error);
      res.status(500).json({ message: "Failed to fetch chapter" });
    }
  });

  app.post('/api/chapters', isAuthenticated, async (req, res) => {
    try {
      const { 
        title, 
        slug, 
        preview, 
        content, 
        categoryId, 
        chapterNumber, 
        duration, 
        youtubeUrl, 
        spotifyUrl,
        // Book summary fields
        contentType,
        author,
        readingTime,
        keyTakeaways,
        audioUrl
      } = req.body;
      // Generate slug from title if not provided
      const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      const chapter = await storage.createChapter({
        title,
        slug: finalSlug,
        preview,
        content,
        categoryId,
        chapterNumber: chapterNumber || 1,
        duration: duration || "5 min",
        youtubeUrl: youtubeUrl || null,
        spotifyUrl: spotifyUrl || null,
        // Book summary fields
        contentType: contentType || 'lesson',
        author: author || null,
        readingTime: readingTime || null,
        keyTakeaways: keyTakeaways || null,
        audioUrl: audioUrl || null,
      });
      res.json(chapter);
    } catch (error) {
      console.error("Error creating chapter:", error);
      res.status(500).json({ message: "Failed to create chapter" });
    }
  });

  app.put('/api/chapters/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { 
        title, 
        slug, 
        description, 
        content, 
        categoryId, 
        chapterNumber, 
        estimatedMinutes, 
        podcastUrl, 
        podcastHeader, 
        videoUrl, 
        videoHeader,
        // Book summary fields
        contentType,
        author,
        readingTime,
        keyTakeaways,
        audioUrl
      } = req.body;
      
      const chapter = await storage.updateChapter(id, {
        title,
        slug,
        description,
        content,
        categoryId,
        chapterNumber,
        estimatedMinutes,
        podcastUrl: podcastUrl || null,
        podcastHeader: podcastHeader || "Podcast",
        videoUrl: videoUrl || null,
        videoHeader: videoHeader || "Video",
        // Book summary fields
        contentType: contentType || 'lesson',
        author: author || null,
        readingTime: readingTime || null,
        keyTakeaways: keyTakeaways || null,
        audioUrl: audioUrl || null,
      });
      res.json(chapter);
    } catch (error) {
      console.error("Error updating chapter:", error);
      res.status(500).json({ message: "Failed to update chapter" });
    }
  });

  app.delete('/api/chapters/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChapter(id);
      res.json({ message: "Chapter deleted successfully" });
    } catch (error) {
      console.error("Error deleting chapter:", error);
      res.status(500).json({ message: "Failed to delete chapter" });
    }
  });

  app.post('/api/chapters/reorder', isAuthenticated, async (req, res) => {
    try {
      const { order } = req.body; // order: [{id, chapterNumber}]
      if (!Array.isArray(order)) return res.status(400).json({ message: 'Invalid order array' });
      for (const { id, chapterNumber } of order) {
        await storage.updateChapter(id, { chapterNumber });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error reordering chapters:', error);
      res.status(500).json({ message: 'Failed to reorder chapters' });
    }
  });

  // Audio generation routes
  app.post('/api/chapters/:id/generate-audio', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { voice = "alloy", quality = "standard" } = req.body;
      
      const chapter = await storage.getChapterById(id);
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      // Delete old audio file if exists
      if (chapter.audioUrl) {
        deleteAudioFile(chapter.audioUrl);
      }

      // Generate text for audio (combine title, description, and content)
      const textContent = `${chapter.title}. ${chapter.description || ''}. ${chapter.content || ''}`;
      
      // Generate audio based on quality preference
      const audioUrl = quality === "hd" 
        ? await generateHighQualityAudio(textContent, id, voice)
        : await generateAudio(textContent, id, voice);

      // Update chapter with new audio URL
      await storage.updateChapter(id, { audioUrl });

      res.json({ audioUrl, message: "Audio generated successfully" });
    } catch (error) {
      console.error("Error generating audio:", error);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });

  app.delete('/api/chapters/:id/audio', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const chapter = await storage.getChapterById(id);
      
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }

      if (chapter.audioUrl) {
        deleteAudioFile(chapter.audioUrl);
        await storage.updateChapter(id, { audioUrl: null });
      }

      res.json({ message: "Audio deleted successfully" });
    } catch (error) {
      console.error("Error deleting audio:", error);
      res.status(500).json({ message: "Failed to delete audio" });
    }
  });

  // Progress routes
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

  app.post('/api/progress/:chapterId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chapterId = parseInt(req.params.chapterId);
      const { completed } = req.body;

      const progress = await storage.updateUserProgress({
        userId,
        chapterId,
        completed: Boolean(completed),
      });

      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Category progress routes
  app.get('/api/categories/:categoryId/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryId = parseInt(req.params.categoryId);
      const progress = await storage.getCategoryProgress(userId, categoryId);
      res.json({ progress });
    } catch (error) {
      console.error("Error fetching category progress:", error);
      res.status(500).json({ message: "Failed to fetch category progress" });
    }
  });

  // Sharing routes
  app.post('/api/chapters/:chapterId/share', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chapterId = parseInt(req.params.chapterId);
      const shareId = nanoid(12);
      const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days

      const shared = await storage.createSharedChapter({
        shareId,
        chapterId,
        sharedBy: userId,
        expiresAt,
      });

      res.json({ shareId, expiresAt });
    } catch (error) {
      console.error("Error creating share:", error);
      res.status(500).json({ message: "Failed to create share" });
    }
  });

  app.get('/api/shared/:shareId', async (req, res) => {
    try {
      const shared = await storage.getSharedChapter(req.params.shareId);
      if (!shared || new Date() > shared.expiresAt) {
        return res.status(404).json({ message: "Shared chapter not found or expired" });
      }

      const chapter = await storage.getChapterBySlug(shared.chapterId?.toString() || '');
      if (!chapter) {
        return res.status(404).json({ message: "Chapter not found" });
      }
      res.json({ chapter, shared });
    } catch (error) {
      console.error("Error fetching shared chapter:", error);
      res.status(500).json({ message: "Failed to fetch shared chapter" });
    }
  });

  // Chat routes
  app.get('/api/chat/history/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = req.params.sessionId;
      const session = await storage.getUserChatSession(userId, sessionId);
      res.json(session?.messages || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  app.post('/api/chat/session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = nanoid(12);
      const name = req.body.name || 'New Chat';
      const summary = req.body.summary || '';
      const messages = [];
      const newSession = await storage.createChatSession({
        userId,
        sessionId,
        name,
        summary,
        messages,
      });
      res.json({ id: newSession.sessionId, name: newSession.name, summary: newSession.summary });
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({ message: 'Failed to create chat session' });
    }
  });

  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserChatSessions(userId);
      res.json(sessions.map(s => ({ id: s.sessionId, name: s.name, summary: s.summary })));
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({ message: 'Failed to fetch chat sessions' });
    }
  });

  app.delete('/api/chat/session/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      await storage.deleteChatSession(userId, sessionId);
      res.json({ message: "Chat session deleted successfully" });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({ message: 'Failed to delete chat session' });
    }
  });

  // Generate intelligent session name
  app.post('/api/chat/session/:sessionId/generate-name', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;
      const { messages } = req.body;
      
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Messages array is required" });
      }

      // Get the conversation content (first few messages)
      const conversationContent = messages
        .slice(0, 6) // Take first 6 messages for name generation
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      // Generate a smart session name using AI
      const namePrompt = `Based on this conversation excerpt, generate a concise, descriptive title (3-5 words max) that captures the main management topic discussed:

${conversationContent}

Focus on the key management challenge, skill, or topic. Examples:
- "Giving Difficult Feedback"
- "Team Motivation Strategies"
- "Delegation Best Practices"
- "New Manager Questions"
- "Meeting Effectiveness"

Return only the title, no quotes or extra text:`;

      const generatedName = await getOpenAIChatResponse('You are a helpful assistant that generates concise, descriptive titles for management coaching conversations.', namePrompt);
      
      // Clean the name and fallback if needed
      const cleanName = generatedName.trim().replace(/['"]/g, '').slice(0, 50) || `Management Chat ${Date.now()}`;
      
      // Update the session with the new name
      const session = await storage.getUserChatSession(userId, sessionId);
      if (session) {
        await storage.updateChatSessionName(userId, sessionId, cleanName);
      }

      res.json({ name: cleanName });
    } catch (error) {
      console.error('Error generating session name:', error);
      // Return a fallback name if AI fails
      const fallbackName = `Management Chat ${Date.now()}`;
      res.json({ name: fallbackName });
    }
  });

  // Helper: Find relevant chapters by keyword match
  function findRelevantChapters(query: string, chapters: any[]) {
    const q = query.toLowerCase();
    return chapters
      .map(ch => ({
        ...ch,
        score: (ch.title + ' ' + ch.content).toLowerCase().includes(q) ? 1 : 0
      }))
      .filter(ch => ch.score > 0)
      .slice(0, 2); // top 2 matches
  }

  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, sessionId } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Get ALL chapters and categories
      const chapters = await storage.getAllChapters();
      const categories = await storage.getCategories();
      const userProgress = await storage.getUserProgress(userId);
      
      // Build comprehensive context from all lessons
      const allChaptersContext = chapters.map(ch => {
        const category = categories.find(cat => cat.id === ch.categoryId);
        const progress = userProgress.find(p => p.chapterId === ch.id);
        const status = progress?.completed ? 'COMPLETED' : 'NOT_STARTED';
        
        return `${ch.title} (${category?.title || 'Uncategorized'}) - ${status}:\n${ch.content.slice(0, 800)}...`;
      }).join('\n\n');

      // Get user's learning journey info
      const completedChapters = userProgress.filter(p => p.completed);
      const totalChapters = chapters.length;
      const completionRate = Math.round((completedChapters.length / totalChapters) * 100);
      
      // Find what user has completed vs not completed
      const completedTitles = completedChapters.map(p => {
        const chapter = chapters.find(ch => ch.id === p.chapterId);
        return chapter?.title;
      }).filter(Boolean);
      
      const notCompletedChapters = chapters.filter(ch => 
        !userProgress.some(p => p.chapterId === ch.id && p.completed)
      );

      // Also include specific relevant chapters for immediate context
      const relevantChapters = findRelevantChapters(message, chapters);
      const references = chapters.map(ch => `[${ch.title}](\/chapter\/${ch.slug})`).join(', ');

      // Build enhanced system prompt with full context and personalization
      const systemPrompt = `You are the AI Mentor for Level Up, a management development app that transforms leadership learning into bite-sized, actionable insights. Your role is to help managers apply what they learn to real workplace situations with practical, supportive guidance.

## User's Learning Context

**Progress:** ${completionRate}% complete (${completedChapters.length}/${totalChapters} chapters)

**Completed Chapters:** ${completedTitles.length > 0 ? completedTitles.join(', ') : 'None yet'}

**Recommended Next:** ${notCompletedChapters.length > 0 ? notCompletedChapters.slice(0, 3).map(ch => ch.title).join(', ') : 'All chapters completed!'}

## Your Identity

You are a knowledgeable, experienced management coach who is:
- **Supportive but direct** - You provide honest, actionable advice without being preachy
- **Practical-focused** - Every response should help the user take concrete action
- **Framework-oriented** - You use proven management frameworks and reference specific Level Up content
- **Conversational** - Professional but approachable, like talking to a trusted mentor
- **Context-aware** - You know what users have learned and can connect concepts across chapters
- **Personalized** - You tailor advice based on their learning progress and completed chapters

## Response Guidelines

### Structure Your Responses
1. **Lead with practical advice** - Start with what they can do, not theory
2. **Use specific frameworks** - Reference RACI, SBI, Total Motivation factors, etc.
3. **Provide concrete examples** - Give specific scenarios when possible
4. **Include chapter references** - Link to relevant Level Up content they've read or should read
5. **End with a next step** - Always give them something actionable to try
6. **Build on their progress** - Reference what they've already learned when relevant

### Personalization Tips
- If they've completed foundational chapters, build on those concepts
- If they haven't started certain areas, gently suggest relevant chapters
- Connect their question to chapters they've already completed when possible
- Acknowledge their learning progress when encouraging them

### Tone and Style
- Use **bold text** for key frameworks and important points
- Write in short, scannable paragraphs (2-3 sentences max)
- Ask follow-up questions to understand their specific situation
- Avoid jargon - use simple, clear language
- Be encouraging but realistic about challenges

## ALL Available Learning Content:
${allChaptersContext}

## All Chapter References:
${references}`;

      const userMessage = message;

      // Get existing chat session
      const session = await storage.getUserChatSession(userId, sessionId);
      const existingMessages = Array.isArray(session?.messages) ? session.messages : [];

      // Add user message
      const messages = [
        ...existingMessages,
        { role: 'user', content: message, timestamp: new Date().toISOString() }
      ];

      // Get AI response (OpenAI)
      const aiResponse = await getOpenAIChatResponse(systemPrompt, userMessage);

      // Add AI response
      const updatedMessages = [
        ...messages,
        { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
      ];

      // Save to database
      await storage.updateChatSession(userId, sessionId, updatedMessages);

      res.json({ message: aiResponse });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.post('/api/chat/stream', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      const { messages, sessionId } = req.body;
      const userId = req.user.claims.sub;

      // Get ALL chapters, categories, and user progress for full context
      const chapters = await storage.getAllChapters();
      const categories = await storage.getCategories();
      const userProgress = await storage.getUserProgress(userId);
      
      // Build comprehensive context from all lessons
      const allChaptersContext = chapters.map(ch => {
        const category = categories.find(cat => cat.id === ch.categoryId);
        const progress = userProgress.find(p => p.chapterId === ch.id);
        const status = progress?.completed ? 'COMPLETED' : 'NOT_STARTED';
        
        return `${ch.title} (${category?.title || 'Uncategorized'}) - ${status}:\n${ch.content.slice(0, 800)}...`;
      }).join('\n\n');

      // Get user's learning journey info
      const completedChapters = userProgress.filter(p => p.completed);
      const totalChapters = chapters.length;
      const completionRate = Math.round((completedChapters.length / totalChapters) * 100);
      
      // Find what user has completed vs not completed
      const completedTitles = completedChapters.map(p => {
        const chapter = chapters.find(ch => ch.id === p.chapterId);
        return chapter?.title;
      }).filter(Boolean);
      
      const notCompletedChapters = chapters.filter(ch => 
        !userProgress.some(p => p.chapterId === ch.id && p.completed)
      );

      const references = chapters.map(ch => `[${ch.title}](\/chapter\/${ch.slug})`).join(', ');

      // Build enhanced system prompt with full context and personalization
      const systemPrompt = `You are the AI Mentor for Level Up, a management development app that transforms leadership learning into bite-sized, actionable insights. Your role is to help managers apply what they learn to real workplace situations with practical, supportive guidance.

## User's Learning Context

**Progress:** ${completionRate}% complete (${completedChapters.length}/${totalChapters} chapters)

**Completed Chapters:** ${completedTitles.length > 0 ? completedTitles.join(', ') : 'None yet'}

**Recommended Next:** ${notCompletedChapters.length > 0 ? notCompletedChapters.slice(0, 3).map(ch => ch.title).join(', ') : 'All chapters completed!'}

## Your Identity

You are a knowledgeable, experienced management coach who is:
- **Supportive but direct** - You provide honest, actionable advice without being preachy
- **Practical-focused** - Every response should help the user take concrete action
- **Framework-oriented** - You use proven management frameworks and reference specific Level Up content
- **Conversational** - Professional but approachable, like talking to a trusted mentor
- **Context-aware** - You know what users have learned and can connect concepts across chapters
- **Personalized** - You tailor advice based on their learning progress and completed chapters

## Response Guidelines

### Structure Your Responses
1. **Lead with practical advice** - Start with what they can do, not theory
2. **Use specific frameworks** - Reference RACI, SBI, Total Motivation factors, etc.
3. **Provide concrete examples** - Give specific scenarios when possible
4. **Include chapter references** - Link to relevant Level Up content they've read or should read
5. **End with a next step** - Always give them something actionable to try
6. **Build on their progress** - Reference what they've already learned when relevant

### Personalization Tips
- If they've completed foundational chapters, build on those concepts
- If they haven't started certain areas, gently suggest relevant chapters
- Connect their question to chapters they've already completed when possible
- Acknowledge their learning progress when encouraging them

### Tone and Style
- Use **bold text** for key frameworks and important points
- Write in short, scannable paragraphs (2-3 sentences max)
- Ask follow-up questions to understand their specific situation
- Avoid jargon - use simple, clear language
- Be encouraging but realistic about challenges

## ALL Available Learning Content:
${allChaptersContext}

## All Chapter References:
${references}`;
      let aiResponse = '';
      for await (const token of getChatResponseStream(messages, systemPrompt)) {
        aiResponse += token;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
      // Persist the full AI response to the session's message history
      if (sessionId && Array.isArray(messages)) {
        const userId = req.user.claims.sub;
        const session = await storage.getUserChatSession(userId, sessionId);
        const updatedMessages = [
          ...messages,
          { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
        ];
        if (session) {
          await storage.updateChatSession(userId, sessionId, updatedMessages);
        }
      }
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
      res.end();
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Content analytics - chapter popularity and engagement
  app.get('/api/analytics/content', isAuthenticated, async (req: any, res) => {
    try {
      const contentAnalytics = await storage.getContentAnalytics();
      res.json(contentAnalytics);
    } catch (error) {
      console.error("Error fetching content analytics:", error);
      res.status(500).json({ message: "Failed to fetch content analytics" });
    }
  });

  // Team management routes
  app.get('/api/team/members', isAuthenticated, async (req: any, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get('/api/team/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getTeamStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching team stats:", error);
      res.status(500).json({ message: "Failed to fetch team stats" });
    }
  });

  app.post('/api/team/invite', isAuthenticated, async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      await storage.inviteTeamMember(email);
      res.json({ message: "Invitation sent successfully" });
    } catch (error) {
      console.error("Error inviting team member:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  app.delete('/api/team/members/:memberId', isAuthenticated, async (req: any, res) => {
    try {
      const { memberId } = req.params;
      await storage.removeTeamMember(memberId);
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // Performance monitoring routes (admin only)
  app.get('/api/admin/performance/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const metrics = QueryOptimizer.getMetrics();
      const slowQueries = QueryOptimizer.getSlowQueries();
      
      res.json({
        totalQueries: metrics.length,
        averageExecutionTime: metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length || 0,
        slowQueries: slowQueries.length,
        slowQueriesDetails: slowQueries.slice(-10), // Last 10 slow queries
        recentMetrics: metrics.slice(-20) // Last 20 queries
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  app.get('/api/admin/performance/database', isAuthenticated, async (req: any, res) => {
    try {
      const [tableStats, unusedIndexes] = await Promise.all([
        QueryOptimizer.getTableStats(),
        QueryOptimizer.getUnusedIndexes()
      ]);
      
      res.json({
        tableStats,
        unusedIndexes,
        recommendations: {
          largestTables: tableStats.slice(0, 5),
          potentialOptimizations: unusedIndexes.length > 0 
            ? ["Consider removing unused indexes to improve write performance"] 
            : ["Database indexes appear to be well optimized"]
        }
      });
    } catch (error) {
      console.error("Error fetching database performance:", error);
      res.status(500).json({ message: "Failed to fetch database performance data" });
    }
  });

  app.post('/api/admin/performance/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "SQL query is required" });
      }

      const explanation = await QueryOptimizer.explainQuery(query);
      res.json({ explanation });
    } catch (error) {
      console.error("Error analyzing query:", error);
      res.status(500).json({ message: "Failed to analyze query" });
    }
  });

  app.delete('/api/admin/performance/metrics', isAuthenticated, async (req: any, res) => {
    try {
      QueryOptimizer.clearMetrics();
      res.json({ message: "Performance metrics cleared successfully" });
    } catch (error) {
      console.error("Error clearing metrics:", error);
      res.status(500).json({ message: "Failed to clear metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

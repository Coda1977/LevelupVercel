/**
 * AI Chat routes
 */

import type { Express } from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';
import { getChatResponse, getOpenAIChatResponse, getChatResponseStream } from '../openai';
import { nanoid } from 'nanoid';

export function registerChatRoutes(app: Express) {
  // Get chat history
  app.get('/api/chat/history/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getChatHistory(sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Create chat session
  app.post('/api/chat/session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = nanoid(10);
      
      await storage.createChatSession({
        sessionId,
        userId,
        sessionName: "New Chat"
      });
      
      res.json({ sessionId });
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Get user's chat sessions
  app.get('/api/chat/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      res.status(500).json({ message: "Failed to fetch chat sessions" });
    }
  });

  // Delete chat session
  app.delete('/api/chat/session/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.params;
      
      await storage.deleteChatSession(sessionId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // Generate session name
  app.post('/api/chat/session/:sessionId/generate-name', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.claims.sub;
      
      const history = await storage.getChatHistory(sessionId);
      
      if (history.length === 0) {
        return res.json({ sessionName: "New Chat" });
      }
      
      const firstMessage = history[0];
      const prompt = `Generate a very short (2-4 words) title for a chat that starts with: "${firstMessage.message}". 
        Return only the title, no quotes, no punctuation.`;
      
      const sessionName = await getOpenAIChatResponse(prompt);
      
      await storage.updateChatSessionName(sessionId, sessionName.trim());
      
      res.json({ sessionName: sessionName.trim() });
    } catch (error) {
      console.error("Error generating session name:", error);
      res.status(500).json({ message: "Failed to generate session name" });
    }
  });

  // Chat endpoint (non-streaming)
  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, sessionId } = req.body;
      
      // Get user progress and chapters for context
      const [progress, chapters] = await Promise.all([
        storage.getUserProgress(userId),
        storage.getChapters()
      ]);
      
      // Save user message
      await storage.saveChatMessage({
        sessionId,
        role: 'user',
        message
      });
      
      const response = await getChatResponse(message, progress, chapters);
      
      // Save assistant response
      await storage.saveChatMessage({
        sessionId,
        role: 'assistant',
        message: response
      });
      
      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to get chat response" });
    }
  });

  // Streaming chat endpoint
  app.post('/api/chat/stream', isAuthenticated, async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      const userId = (req as any).user.claims.sub;
      
      // Set up SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Get context
      const [progress, chapters] = await Promise.all([
        storage.getUserProgress(userId),
        storage.getChapters()
      ]);
      
      // Save user message
      await storage.saveChatMessage({
        sessionId,
        role: 'user',
        message
      });
      
      let fullResponse = '';
      
      // Stream the response
      await getChatResponseStream(
        message,
        progress,
        chapters,
        (chunk: string) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      );
      
      // Save the complete response
      await storage.saveChatMessage({
        sessionId,
        role: 'assistant',
        message: fullResponse
      });
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error("Error in streaming chat:", error);
      res.write(`data: ${JSON.stringify({ error: 'Failed to get response' })}\n\n`);
      res.end();
    }
  });
}
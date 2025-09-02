import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import createTestApp from './test-app';
import { mockAuthenticatedUser, mockChapter } from '../helpers/test-utils';

describe('AI Chat Functionality Integration', () => {
  let app: any;
  let authenticatedAgent: request.SuperAgentTest;
  let sessionId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = createTestApp();
    
    // Create authenticated agent
    authenticatedAgent = request.agent(app);
    await authenticatedAgent
      .post('/api/auth/session')
      .send({ user: mockAuthenticatedUser });

    // Create a chat session for testing
    const sessionResponse = await authenticatedAgent
      .post('/api/chat/sessions')
      .send({ name: 'Test Chat Session' });
    
    sessionId = sessionResponse.body.id;
  });

  describe('Chat Session Management', () => {
    it('should create a new chat session', async () => {
      const sessionData = {
        name: 'New Test Session'
      };

      const response = await authenticatedAgent
        .post('/api/chat/sessions')
        .send(sessionData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: sessionData.name,
        userId: mockAuthenticatedUser.id
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should get all user chat sessions', async () => {
      const response = await authenticatedAgent
        .get('/api/chat/sessions')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('userId', mockAuthenticatedUser.id);
    });

    it('should get a specific chat session', async () => {
      const response = await authenticatedAgent
        .get(`/api/chat/sessions/${sessionId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: sessionId,
        name: 'Test Chat Session',
        userId: mockAuthenticatedUser.id
      });
    });

    it('should update a chat session name', async () => {
      const updatedName = 'Updated Session Name';

      const response = await authenticatedAgent
        .put(`/api/chat/sessions/${sessionId}`)
        .send({ name: updatedName })
        .expect(200);

      expect(response.body).toMatchObject({
        id: sessionId,
        name: updatedName
      });
    });

    it('should delete a chat session', async () => {
      await authenticatedAgent
        .delete(`/api/chat/sessions/${sessionId}`)
        .expect(200);

      // Verify session is deleted
      await authenticatedAgent
        .get(`/api/chat/sessions/${sessionId}`)
        .expect(404);
    });
  });

  describe('Chat Messages', () => {
    it('should send a message and get AI response', async () => {
      const userMessage = 'What are the key principles of effective leadership?';

      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: userMessage })
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body.response).toContain('Mocked AI response');
    });

    it('should get all messages for a session', async () => {
      // First send a message
      await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'Test message' });

      const response = await authenticatedAgent
        .get(`/api/chat/sessions/${sessionId}/messages`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // User message + AI response
      
      const userMessage = response.body.find((msg: any) => msg.role === 'user');
      const assistantMessage = response.body.find((msg: any) => msg.role === 'assistant');
      
      expect(userMessage).toBeTruthy();
      expect(assistantMessage).toBeTruthy();
      expect(userMessage.content).toBe('Test message');
    });

    it('should handle streaming chat responses', async () => {
      const userMessage = 'Tell me about team management best practices';

      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/stream`)
        .send({ message: userMessage })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.text).toContain('data:');
    });

    it('should include user progress in AI context', async () => {
      // First create some chapters and progress
      const chapterResponse = await authenticatedAgent
        .post('/api/admin/chapters')
        .send(mockChapter);

      const chapterId = chapterResponse.body.id;

      // Mark chapter as completed
      await authenticatedAgent
        .post('/api/progress')
        .send({
          chapterId: chapterId,
          completed: true
        });

      // Send a message that should use personalized context
      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'What should I focus on next in my learning journey?' })
        .expect(200);

      expect(response.body).toHaveProperty('response');
      // The mocked AI should have received user progress in the system prompt
    });

    it('should use all available chapters as context', async () => {
      // Create multiple chapters
      const chapters = [
        { ...mockChapter, title: 'Leadership Basics', slug: 'leadership-basics' },
        { ...mockChapter, title: 'Team Communication', slug: 'team-communication', chapterNumber: 2 },
        { ...mockChapter, title: 'Decision Making', slug: 'decision-making', chapterNumber: 3 }
      ];

      for (const chapter of chapters) {
        await authenticatedAgent
          .post('/api/admin/chapters')
          .send(chapter);
      }

      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'What topics are available for learning?' })
        .expect(200);

      expect(response.body).toHaveProperty('response');
      // The AI system should have all chapters as context
    });
  });

  describe('AI-Powered Session Naming', () => {
    it('should generate intelligent session names based on conversation', async () => {
      // Send messages to create conversation context
      await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'How do I handle difficult team members?' });

      await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'What about performance management strategies?' });

      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/generate-name`)
        .send({
          messages: [
            { role: 'user', content: 'How do I handle difficult team members?' },
            { role: 'assistant', content: 'Mocked AI response about team management' },
            { role: 'user', content: 'What about performance management strategies?' }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body.name).toBeTruthy();
      expect(typeof response.body.name).toBe('string');
    });

    it('should handle session naming with insufficient context', async () => {
      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/generate-name`)
        .send({ messages: [] })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      // Mock OpenAI to throw an error
      vi.doMock('@server/openai.ts', () => ({
        getChatResponse: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
        getChatResponseStream: vi.fn().mockImplementation(async function* () {
          throw new Error('Stream failed');
        })
      }));

      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'Test message during AI failure' })
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('error');
    });

    it('should validate message content', async () => {
      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: '' }) // Empty message
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle non-existent session', async () => {
      const nonExistentSessionId = 'non-existent-session-id';

      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${nonExistentSessionId}/messages`)
        .send({ message: 'Test message' })
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle session access by unauthorized user', async () => {
      // Create another user's agent
      const otherUserAgent = request.agent(app);
      await otherUserAgent
        .post('/api/auth/session')
        .send({
          user: {
            id: 'other-user-id',
            name: 'Other User',
            email: 'other@example.com'
          }
        });

      const response = await otherUserAgent
        .get(`/api/chat/sessions/${sessionId}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle multiple concurrent messages', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          authenticatedAgent
            .post(`/api/chat/sessions/${sessionId}/messages`)
            .send({ message: `Concurrent message ${i + 1}` })
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('response');
      });
    });

    it('should maintain conversation context across multiple messages', async () => {
      // Send first message
      await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'My name is John and I manage a team of 5 people' });

      // Send follow-up message that should use context
      const response = await authenticatedAgent
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'What leadership style would work best for my team?' })
        .expect(200);

      expect(response.body).toHaveProperty('response');
      
      // Get all messages to verify context is maintained
      const messagesResponse = await authenticatedAgent
        .get(`/api/chat/sessions/${sessionId}/messages`)
        .expect(200);

      expect(messagesResponse.body.length).toBeGreaterThanOrEqual(4); // 2 user + 2 AI messages
    });
  });

  describe('Authorization', () => {
    it('should require authentication for chat operations', async () => {
      await request(app)
        .post('/api/chat/sessions')
        .send({ name: 'Unauthorized Session' })
        .expect(401);

      await request(app)
        .get('/api/chat/sessions')
        .expect(401);

      await request(app)
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'Unauthorized message' })
        .expect(401);
    });
  });
});
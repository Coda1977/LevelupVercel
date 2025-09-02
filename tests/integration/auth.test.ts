import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import createTestApp from './test-app';

describe('Authentication Flow', () => {
  let app: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('Login Flow', () => {
    it('should redirect to Replit OAuth when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/login')
        .expect(302);
      
      expect(response.headers.location).toContain('replit.com');
    });

    it('should handle OAuth callback successfully', async () => {
      // Mock Replit OAuth response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'mock-token',
          user: {
            id: 'test-user-id',
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com'
          }
        })
      } as Response);

      const response = await request(app)
        .get('/api/auth/callback?code=mock-code')
        .expect(302);

      expect(response.headers.location).toBe('/dashboard');
    });

    it('should handle OAuth errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('OAuth failed'));

      const response = await request(app)
        .get('/api/auth/callback?code=invalid-code')
        .expect(302);

      expect(response.headers.location).toBe('/login?error=auth_failed');
    });
  });

  describe('Session Management', () => {
    it('should return user data when authenticated', async () => {
      // Mock authenticated session
      const mockSession = {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com'
        }
      };

      const agent = request.agent(app);
      
      // Simulate login session
      await agent
        .post('/api/auth/session')
        .send(mockSession)
        .expect(200);

      const response = await agent
        .get('/api/auth/user')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Not authenticated');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout authenticated user', async () => {
      const agent = request.agent(app);
      
      // Simulate authenticated session
      await agent
        .post('/api/auth/session')
        .send({ user: { id: 'test-user-id' } });

      const response = await agent
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify session is destroyed
      await agent
        .get('/api/auth/user')
        .expect(401);
    });
  });

  describe('Route Protection', () => {
    it('should protect admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/chapters')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Not authenticated');
    });

    it('should allow access to admin routes when authenticated', async () => {
      const agent = request.agent(app);
      
      // Simulate admin user session
      await agent
        .post('/api/auth/session')
        .send({
          user: {
            id: 'admin-user-id',
            name: 'Admin User',
            email: 'admin@example.com'
          }
        });

      const response = await agent
        .get('/api/admin/chapters')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should protect user-specific routes', async () => {
      const response = await request(app)
        .get('/api/progress/user/test-user-id')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Not authenticated');
    });
  });

  describe('Authentication Middleware', () => {
    it('should add user to request when session exists', async () => {
      const agent = request.agent(app);
      
      const mockUser = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Simulate login
      await agent
        .post('/api/auth/session')
        .send({ user: mockUser });

      // Test protected endpoint that uses req.user
      const response = await agent
        .get('/api/auth/user')
        .expect(200);

      expect(response.body).toMatchObject(mockUser);
    });

    it('should handle missing session gracefully', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Not authenticated');
    });
  });
});
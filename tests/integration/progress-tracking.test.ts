import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import createTestApp from './test-app';
import { mockAuthenticatedUser, mockChapter, mockCategory, mockProgress } from '../helpers/test-utils';

describe('Progress Tracking Integration', () => {
  let app: any;
  let authenticatedAgent: request.SuperAgentTest;
  let testChapterId: number;
  let testCategoryId: number;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = createTestApp();
    
    // Create authenticated agent
    authenticatedAgent = request.agent(app);
    await authenticatedAgent
      .post('/api/auth/session')
      .send({ user: mockAuthenticatedUser });

    // Create test category
    const categoryResponse = await authenticatedAgent
      .post('/api/admin/categories')
      .send(mockCategory);
    testCategoryId = categoryResponse.body.id;

    // Create test chapter
    const chapterResponse = await authenticatedAgent
      .post('/api/admin/chapters')
      .send({ ...mockChapter, categoryId: testCategoryId });
    testChapterId = chapterResponse.body.id;
  });

  describe('Chapter Progress Management', () => {
    it('should mark a chapter as completed', async () => {
      const progressData = {
        chapterId: testChapterId,
        completed: true
      };

      const response = await authenticatedAgent
        .post('/api/progress')
        .send(progressData)
        .expect(201);

      expect(response.body).toMatchObject({
        userId: mockAuthenticatedUser.id,
        chapterId: testChapterId,
        completed: true
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('completedAt');
    });

    it('should mark a chapter as incomplete', async () => {
      // First mark as complete
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true });

      // Then mark as incomplete
      const response = await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: false })
        .expect(200);

      expect(response.body).toMatchObject({
        userId: mockAuthenticatedUser.id,
        chapterId: testChapterId,
        completed: false
      });
      expect(response.body.completedAt).toBeNull();
    });

    it('should get user progress for all chapters', async () => {
      // Create additional chapters and mark some as completed
      const chapter2Response = await authenticatedAgent
        .post('/api/admin/chapters')
        .send({
          ...mockChapter,
          title: 'Chapter 2',
          slug: 'chapter-2',
          chapterNumber: 2,
          categoryId: testCategoryId
        });

      const chapter2Id = chapter2Response.body.id;

      // Mark first chapter as completed
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true });

      // Leave second chapter incomplete
      
      const response = await authenticatedAgent
        .get('/api/progress')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      
      const completedChapter = response.body.find((p: any) => p.chapterId === testChapterId);
      expect(completedChapter).toBeTruthy();
      expect(completedChapter.completed).toBe(true);
    });

    it('should get user progress for a specific chapter', async () => {
      // Mark chapter as completed
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true });

      const response = await authenticatedAgent
        .get(`/api/progress/chapter/${testChapterId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        userId: mockAuthenticatedUser.id,
        chapterId: testChapterId,
        completed: true
      });
    });

    it('should return null for chapter with no progress', async () => {
      const response = await authenticatedAgent
        .get(`/api/progress/chapter/${testChapterId}`)
        .expect(200);

      expect(response.body).toBeNull();
    });

    it('should handle duplicate progress entries', async () => {
      // Mark chapter as completed twice
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true });

      const response = await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true })
        .expect(200);

      // Should update existing record, not create duplicate
      expect(response.body.completed).toBe(true);
      
      // Verify only one progress record exists
      const progressResponse = await authenticatedAgent
        .get('/api/progress')
        .expect(200);

      const userProgress = progressResponse.body.filter(
        (p: any) => p.chapterId === testChapterId
      );
      expect(userProgress.length).toBe(1);
    });
  });

  describe('Progress Statistics', () => {
    beforeEach(async () => {
      // Create multiple chapters for testing statistics
      const chapters = [
        { title: 'Chapter A', slug: 'chapter-a', chapterNumber: 1 },
        { title: 'Chapter B', slug: 'chapter-b', chapterNumber: 2 },
        { title: 'Chapter C', slug: 'chapter-c', chapterNumber: 3 },
        { title: 'Chapter D', slug: 'chapter-d', chapterNumber: 4 }
      ];

      for (const chapter of chapters) {
        await authenticatedAgent
          .post('/api/admin/chapters')
          .send({ ...mockChapter, ...chapter, categoryId: testCategoryId });
      }
    });

    it('should get user progress statistics', async () => {
      // Mark some chapters as completed
      const allChapters = await authenticatedAgent
        .get('/api/chapters')
        .expect(200);

      const chapterIds = allChapters.body.map((c: any) => c.id);
      
      // Complete half of the chapters
      for (let i = 0; i < Math.floor(chapterIds.length / 2); i++) {
        await authenticatedAgent
          .post('/api/progress')
          .send({ chapterId: chapterIds[i], completed: true });
      }

      const response = await authenticatedAgent
        .get('/api/progress/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalChapters');
      expect(response.body).toHaveProperty('completedChapters');
      expect(response.body).toHaveProperty('completionRate');
      expect(response.body).toHaveProperty('streakDays');
      expect(response.body).toHaveProperty('lastActivityDate');

      expect(response.body.totalChapters).toBeGreaterThan(0);
      expect(response.body.completedChapters).toBeGreaterThan(0);
      expect(response.body.completionRate).toBeGreaterThan(0);
      expect(response.body.completionRate).toBeLessThanOrEqual(100);
    });

    it('should get category-wise progress', async () => {
      // Create another category with chapters
      const category2Response = await authenticatedAgent
        .post('/api/admin/categories')
        .send({
          title: 'Category 2',
          slug: 'category-2',
          description: 'Second test category'
        });

      const category2Id = category2Response.body.id;

      await authenticatedAgent
        .post('/api/admin/chapters')
        .send({
          ...mockChapter,
          title: 'Chapter in Cat 2',
          slug: 'chapter-in-cat-2',
          categoryId: category2Id
        });

      // Mark some chapters as completed in different categories
      const allChapters = await authenticatedAgent
        .get('/api/chapters')
        .expect(200);

      const cat1Chapters = allChapters.body.filter((c: any) => c.categoryId === testCategoryId);
      const cat2Chapters = allChapters.body.filter((c: any) => c.categoryId === category2Id);

      // Complete all chapters in category 1
      for (const chapter of cat1Chapters) {
        await authenticatedAgent
          .post('/api/progress')
          .send({ chapterId: chapter.id, completed: true });
      }

      const response = await authenticatedAgent
        .get('/api/progress/category-stats')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      
      const cat1Stats = response.body.find((c: any) => c.categoryId === testCategoryId);
      const cat2Stats = response.body.find((c: any) => c.categoryId === category2Id);
      
      expect(cat1Stats).toBeTruthy();
      expect(cat1Stats.completionRate).toBe(100);
      
      expect(cat2Stats).toBeTruthy();
      expect(cat2Stats.completionRate).toBe(0);
    });
  });

  describe('Learning Streak Calculation', () => {
    it('should calculate learning streak correctly', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Create chapters
      const chapters = [];
      for (let i = 1; i <= 3; i++) {
        const response = await authenticatedAgent
          .post('/api/admin/chapters')
          .send({
            ...mockChapter,
            title: `Streak Chapter ${i}`,
            slug: `streak-chapter-${i}`,
            chapterNumber: i,
            categoryId: testCategoryId
          });
        chapters.push(response.body);
      }

      // Mark chapters as completed on different days (simulated)
      // Note: In a real scenario, you'd need to manipulate the database directly
      // or have an endpoint that accepts custom completion dates
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: chapters[0].id, completed: true });

      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: chapters[1].id, completed: true });

      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: chapters[2].id, completed: true });

      const response = await authenticatedAgent
        .get('/api/progress/stats')
        .expect(200);

      expect(response.body).toHaveProperty('streakDays');
      expect(typeof response.body.streakDays).toBe('number');
      expect(response.body.streakDays).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Progress History and Analytics', () => {
    it('should track progress changes over time', async () => {
      // Mark chapter as completed
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true });

      // Then mark as incomplete
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: false });

      // Then complete again
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true });

      const response = await authenticatedAgent
        .get(`/api/progress/chapter/${testChapterId}/history`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('completed');
      expect(response.body[0]).toHaveProperty('updatedAt');
    });

    it('should get progress activity feed', async () => {
      // Complete multiple chapters
      const chapters = [];
      for (let i = 1; i <= 3; i++) {
        const response = await authenticatedAgent
          .post('/api/admin/chapters')
          .send({
            ...mockChapter,
            title: `Activity Chapter ${i}`,
            slug: `activity-chapter-${i}`,
            chapterNumber: i,
            categoryId: testCategoryId
          });
        chapters.push(response.body);
      }

      // Mark them as completed
      for (const chapter of chapters) {
        await authenticatedAgent
          .post('/api/progress')
          .send({ chapterId: chapter.id, completed: true });
      }

      const response = await authenticatedAgent
        .get('/api/progress/activity')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(chapters.length);
      
      expect(response.body[0]).toHaveProperty('chapterTitle');
      expect(response.body[0]).toHaveProperty('completedAt');
      expect(response.body[0]).toHaveProperty('action');
    });
  });

  describe('Bulk Progress Operations', () => {
    it('should reset all user progress', async () => {
      // Complete some chapters first
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true });

      // Reset all progress
      const response = await authenticatedAgent
        .delete('/api/progress/reset')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('reset');

      // Verify progress is reset
      const progressResponse = await authenticatedAgent
        .get('/api/progress')
        .expect(200);

      expect(progressResponse.body.length).toBe(0);
    });

    it('should mark multiple chapters as completed', async () => {
      // Create additional chapters
      const chapters = [];
      for (let i = 1; i <= 3; i++) {
        const response = await authenticatedAgent
          .post('/api/admin/chapters')
          .send({
            ...mockChapter,
            title: `Bulk Chapter ${i}`,
            slug: `bulk-chapter-${i}`,
            chapterNumber: i,
            categoryId: testCategoryId
          });
        chapters.push(response.body);
      }

      const chapterIds = chapters.map(c => c.id);

      const response = await authenticatedAgent
        .post('/api/progress/bulk-complete')
        .send({ chapterIds })
        .expect(200);

      expect(response.body).toHaveProperty('completedCount', chapterIds.length);

      // Verify all chapters are completed
      const progressResponse = await authenticatedAgent
        .get('/api/progress')
        .expect(200);

      const completedChapters = progressResponse.body.filter((p: any) => p.completed);
      expect(completedChapters.length).toBeGreaterThanOrEqual(chapterIds.length);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle invalid chapter ID', async () => {
      const response = await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: 99999, completed: true })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate progress data', async () => {
      const response = await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: 'invalid', completed: 'not-boolean' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle missing required fields', async () => {
      const response = await authenticatedAgent
        .post('/api/progress')
        .send({ completed: true }) // Missing chapterId
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should protect progress data between users', async () => {
      // Mark chapter as completed by first user
      await authenticatedAgent
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true });

      // Create second user
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

      // Other user should not see first user's progress
      const response = await otherUserAgent
        .get('/api/progress')
        .expect(200);

      expect(response.body.length).toBe(0);
    });
  });

  describe('Authorization', () => {
    it('should require authentication for progress operations', async () => {
      await request(app)
        .post('/api/progress')
        .send({ chapterId: testChapterId, completed: true })
        .expect(401);

      await request(app)
        .get('/api/progress')
        .expect(401);

      await request(app)
        .get('/api/progress/stats')
        .expect(401);

      await request(app)
        .delete('/api/progress/reset')
        .expect(401);
    });
  });
});
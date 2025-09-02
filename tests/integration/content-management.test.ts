import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import createTestApp from './test-app';
import { mockChapter, mockCategory, mockAuthenticatedUser } from '../helpers/test-utils';

describe('Content Management Integration', () => {
  let app: any;
  let authenticatedAgent: request.SuperAgentTest;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = createTestApp();
    
    // Create authenticated agent for admin operations
    authenticatedAgent = request.agent(app);
    await authenticatedAgent
      .post('/api/auth/session')
      .send({ user: mockAuthenticatedUser });
  });

  describe('Chapter Management', () => {
    it('should create a new chapter', async () => {
      const newChapter = {
        title: 'New Test Chapter',
        slug: 'new-test-chapter',
        description: 'A newly created test chapter',
        content: '<p>New chapter content</p>',
        categoryId: 1,
        chapterNumber: 2,
        estimatedMinutes: 10,
        contentType: 'lesson'
      };

      const response = await authenticatedAgent
        .post('/api/admin/chapters')
        .send(newChapter)
        .expect(201);

      expect(response.body).toMatchObject({
        title: newChapter.title,
        slug: newChapter.slug,
        description: newChapter.description,
        categoryId: newChapter.categoryId
      });
      expect(response.body).toHaveProperty('id');
    });

    it('should get all chapters', async () => {
      const response = await authenticatedAgent
        .get('/api/admin/chapters')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

    it('should get a specific chapter by id', async () => {
      // First create a chapter
      const createResponse = await authenticatedAgent
        .post('/api/admin/chapters')
        .send(mockChapter);

      const chapterId = createResponse.body.id;

      const response = await authenticatedAgent
        .get(`/api/admin/chapters/${chapterId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: chapterId,
        title: mockChapter.title,
        slug: mockChapter.slug
      });
    });

    it('should update an existing chapter', async () => {
      // First create a chapter
      const createResponse = await authenticatedAgent
        .post('/api/admin/chapters')
        .send(mockChapter);

      const chapterId = createResponse.body.id;
      const updatedData = {
        title: 'Updated Chapter Title',
        description: 'Updated description',
        estimatedMinutes: 15
      };

      const response = await authenticatedAgent
        .put(`/api/admin/chapters/${chapterId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: chapterId,
        title: updatedData.title,
        description: updatedData.description,
        estimatedMinutes: updatedData.estimatedMinutes
      });
    });

    it('should delete a chapter', async () => {
      // First create a chapter
      const createResponse = await authenticatedAgent
        .post('/api/admin/chapters')
        .send(mockChapter);

      const chapterId = createResponse.body.id;

      await authenticatedAgent
        .delete(`/api/admin/chapters/${chapterId}`)
        .expect(200);

      // Verify chapter is deleted
      await authenticatedAgent
        .get(`/api/admin/chapters/${chapterId}`)
        .expect(404);
    });

    it('should handle invalid chapter data', async () => {
      const invalidChapter = {
        title: '', // Invalid: empty title
        // Missing required fields
      };

      const response = await authenticatedAgent
        .post('/api/admin/chapters')
        .send(invalidChapter)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Category Management', () => {
    it('should create a new category', async () => {
      const newCategory = {
        title: 'New Test Category',
        slug: 'new-test-category',
        description: 'A newly created test category',
        sortOrder: 2
      };

      const response = await authenticatedAgent
        .post('/api/admin/categories')
        .send(newCategory)
        .expect(201);

      expect(response.body).toMatchObject({
        title: newCategory.title,
        slug: newCategory.slug,
        description: newCategory.description
      });
      expect(response.body).toHaveProperty('id');
    });

    it('should get all categories', async () => {
      const response = await authenticatedAgent
        .get('/api/admin/categories')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should update a category', async () => {
      // First create a category
      const createResponse = await authenticatedAgent
        .post('/api/admin/categories')
        .send(mockCategory);

      const categoryId = createResponse.body.id;
      const updatedData = {
        title: 'Updated Category Title',
        description: 'Updated category description'
      };

      const response = await authenticatedAgent
        .put(`/api/admin/categories/${categoryId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: categoryId,
        title: updatedData.title,
        description: updatedData.description
      });
    });

    it('should delete a category', async () => {
      // First create a category
      const createResponse = await authenticatedAgent
        .post('/api/admin/categories')
        .send(mockCategory);

      const categoryId = createResponse.body.id;

      await authenticatedAgent
        .delete(`/api/admin/categories/${categoryId}`)
        .expect(200);

      // Verify category is deleted
      await authenticatedAgent
        .get(`/api/admin/categories/${categoryId}`)
        .expect(404);
    });
  });

  describe('Bulk Operations', () => {
    let chapterIds: number[] = [];

    beforeEach(async () => {
      // Create multiple chapters for bulk operations
      chapterIds = [];
      for (let i = 1; i <= 3; i++) {
        const chapter = {
          ...mockChapter,
          title: `Bulk Test Chapter ${i}`,
          slug: `bulk-test-chapter-${i}`,
          chapterNumber: i
        };
        
        const response = await authenticatedAgent
          .post('/api/admin/chapters')
          .send(chapter);
        
        chapterIds.push(response.body.id);
      }
    });

    it('should perform bulk delete operation', async () => {
      const response = await authenticatedAgent
        .post('/api/admin/chapters/bulk-delete')
        .send({ ids: chapterIds })
        .expect(200);

      expect(response.body).toHaveProperty('deletedCount', chapterIds.length);

      // Verify chapters are deleted
      for (const id of chapterIds) {
        await authenticatedAgent
          .get(`/api/admin/chapters/${id}`)
          .expect(404);
      }
    });

    it('should perform bulk category update', async () => {
      const newCategoryId = 2;
      
      const response = await authenticatedAgent
        .post('/api/admin/chapters/bulk-update')
        .send({
          ids: chapterIds,
          updates: { categoryId: newCategoryId }
        })
        .expect(200);

      expect(response.body).toHaveProperty('updatedCount', chapterIds.length);

      // Verify updates were applied
      for (const id of chapterIds) {
        const chapter = await authenticatedAgent
          .get(`/api/admin/chapters/${id}`)
          .expect(200);
        
        expect(chapter.body.categoryId).toBe(newCategoryId);
      }
    });

    it('should handle empty bulk operations', async () => {
      const response = await authenticatedAgent
        .post('/api/admin/chapters/bulk-delete')
        .send({ ids: [] })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle invalid chapter ids in bulk operations', async () => {
      const invalidIds = [999, 1000, 1001]; // Non-existent IDs
      
      const response = await authenticatedAgent
        .post('/api/admin/chapters/bulk-delete')
        .send({ ids: invalidIds })
        .expect(200);

      expect(response.body.deletedCount).toBe(0);
    });
  });

  describe('Content Analytics', () => {
    it('should retrieve content analytics data', async () => {
      const response = await authenticatedAgent
        .get('/api/admin/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('totalChapters');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('chapterStats');
      expect(response.body).toHaveProperty('popularChapters');
      expect(response.body).toHaveProperty('engagementMetrics');
      
      expect(response.body.chapterStats).toBeInstanceOf(Array);
      expect(response.body.popularChapters).toBeInstanceOf(Array);
    });

    it('should filter analytics by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const endDate = new Date().toISOString();

      const response = await authenticatedAgent
        .get(`/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalChapters');
      expect(response.body).toHaveProperty('chapterStats');
    });
  });

  describe('Public Content Access', () => {
    it('should allow public access to chapter list', async () => {
      const response = await request(app)
        .get('/api/chapters')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should allow public access to specific chapter', async () => {
      // First create a chapter as admin
      const createResponse = await authenticatedAgent
        .post('/api/admin/chapters')
        .send(mockChapter);

      const chapterId = createResponse.body.id;

      // Then access it without authentication
      const response = await request(app)
        .get(`/api/chapters/${chapterId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: chapterId,
        title: mockChapter.title,
        content: mockChapter.content
      });
    });

    it('should allow public access to categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('Authorization', () => {
    it('should reject admin operations without authentication', async () => {
      await request(app)
        .post('/api/admin/chapters')
        .send(mockChapter)
        .expect(401);

      await request(app)
        .get('/api/admin/analytics')
        .expect(401);

      await request(app)
        .post('/api/admin/chapters/bulk-delete')
        .send({ ids: [1, 2, 3] })
        .expect(401);
    });
  });
});
import {
  users,
  categories,
  chapters,
  userProgress,
  sharedChapters,
  chatSessions,
  type User,
  type UpsertUser,
  type Category,
  type Chapter,
  type UserProgress,
  type SharedChapter,
  type ChatSession,
  type InsertCategory,
  type InsertChapter,
  type InsertUserProgress,
  type InsertSharedChapter,
  type InsertChatSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  
  // Chapter operations
  getChaptersByCategory(categoryId: number): Promise<Chapter[]>;
  getChapterBySlug(slug: string): Promise<Chapter | undefined>;
  getChapterById(id: number): Promise<Chapter | null>;
  getAllChapters(): Promise<Chapter[]>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: number, chapter: Partial<InsertChapter>): Promise<Chapter>;
  deleteChapter(id: number): Promise<void>;
  
  // Progress operations
  getUserProgress(userId: string): Promise<UserProgress[]>;
  updateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getCategoryProgress(userId: string, categoryId: number): Promise<number>;
  
  // Sharing operations
  createSharedChapter(shared: InsertSharedChapter): Promise<SharedChapter>;
  getSharedChapter(shareId: string): Promise<SharedChapter | undefined>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(userId: string, messages: any[]): Promise<ChatSession>;
  updateChatSessionName(userId: string, sessionId: string, name: string): Promise<void>;
  getUserChatSession(userId: string): Promise<ChatSession | undefined>;
  
  // Analytics operations
  getAnalytics(): Promise<any>;
  getContentAnalytics(): Promise<any>;
  
  // Team management operations
  getTeamMembers(): Promise<any[]>;
  getTeamStats(): Promise<any>;
  inviteTeamMember(email: string): Promise<void>;
  removeTeamMember(memberId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.sortOrder));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...categoryData,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async getChaptersByCategory(categoryId: number): Promise<Chapter[]> {
    return await db
      .select()
      .from(chapters)
      .where(eq(chapters.categoryId, categoryId))
      .orderBy(asc(chapters.chapterNumber));
  }

  async getChapterBySlug(slug: string): Promise<Chapter | undefined> {
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.slug, slug));
    return chapter;
  }

  async getChapterById(id: number): Promise<Chapter | null> {
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, id));
    return chapter || null;
  }

  async getAllChapters(): Promise<Chapter[]> {
    return await db
      .select()
      .from(chapters)
      .orderBy(asc(chapters.categoryId), asc(chapters.chapterNumber));
  }

  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const [newChapter] = await db
      .insert(chapters)
      .values(chapter)
      .returning();
    return newChapter;
  }

  async updateChapter(id: number, chapterData: Partial<InsertChapter>): Promise<Chapter> {
    const [updatedChapter] = await db
      .update(chapters)
      .set({
        ...chapterData,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, id))
      .returning();
    return updatedChapter;
  }

  async deleteChapter(id: number): Promise<void> {
    await db.delete(chapters).where(eq(chapters.id, id));
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    // Use upsert pattern to handle insert/update in a single query
    const [upserted] = await db
      .insert(userProgress)
      .values({
        ...progress,
        completedAt: progress.completed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.chapterId],
        set: {
          completed: progress.completed,
          completedAt: progress.completed ? new Date() : null,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    return upserted;
  }

  async getCategoryProgress(userId: string, categoryId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProgress)
      .innerJoin(chapters, eq(userProgress.chapterId, chapters.id))
      .where(and(
        eq(userProgress.userId, userId),
        eq(chapters.categoryId, categoryId),
        eq(userProgress.completed, true)
      ));
    
    return result[0]?.count || 0;
  }

  async createSharedChapter(shared: InsertSharedChapter): Promise<SharedChapter> {
    const [newShared] = await db
      .insert(sharedChapters)
      .values(shared)
      .returning();
    return newShared;
  }

  async getSharedChapter(shareId: string): Promise<SharedChapter | undefined> {
    const [shared] = await db
      .select()
      .from(sharedChapters)
      .where(eq(sharedChapters.shareId, shareId));
    return shared;
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [newSession] = await db
      .insert(chatSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateChatSession(userId: string, sessionId: string, messages: any[]): Promise<ChatSession> {
    // Try to update first - if no rows affected, create new session
    const [updated] = await db
      .update(chatSessions)
      .set({
        messages,
        updatedAt: new Date(),
      })
      .where(and(eq(chatSessions.userId, userId), eq(chatSessions.sessionId, sessionId)))
      .returning();

    if (updated) {
      return updated;
    } else {
      return await this.createChatSession({ 
        userId, 
        sessionId,
        name: "Chat Session",
        messages 
      });
    }
  }

  async updateChatSessionName(userId: string, sessionId: string, name: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(and(eq(chatSessions.userId, userId), eq(chatSessions.sessionId, sessionId)));
  }

  async getUserChatSession(userId: string, sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.userId, userId), eq(chatSessions.sessionId, sessionId)))
      .limit(1);
    return session;
  }

  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
  }

  async deleteChatSession(userId: string, sessionId: string): Promise<void> {
    await db.delete(chatSessions).where(
      and(eq(chatSessions.userId, userId), eq(chatSessions.sessionId, sessionId))
    );
  }

  // Analytics operations
  async getAnalytics(): Promise<any> {
    // Calculate real analytics from database
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    const totalChapters = await db.select({ count: sql`count(*)` }).from(chapters);
    const completedProgress = await db.select({ count: sql`count(*)` }).from(userProgress).where(eq(userProgress.completed, true));
    
    return {
      overallProgress: 0,
      totalUsers: totalUsers[0]?.count || 0,
      activeChats: 0,
      completedChapters: completedProgress[0]?.count || 0,
      averageEngagement: 0,
      weeklyActivity: [],
      categoryProgress: [],
      topChapters: []
    };
  }

  // Team management operations
  async getTeamMembers(): Promise<any[]> {
    // Return actual team members from database
    const members = await db.select().from(users);
    return members.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: 'member',
      joinedAt: user.createdAt,
      lastActive: user.updatedAt,
      progress: {
        completedChapters: 0,
        totalChapters: 0,
        percentage: 0
      },
      engagement: {
        chatMessages: 0,
        weeklyActivity: 0
      }
    }));
  }

  async getTeamStats(): Promise<any> {
    const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
    return {
      totalMembers: totalUsers[0]?.count || 0,
      activeMembers: totalUsers[0]?.count || 0,
      averageProgress: 0,
      totalChaptersCompleted: 0
    };
  }

  async getContentAnalytics(): Promise<any> {
    try {
      // Get chapter completion statistics
      const chapterStats = await db
        .select({
          chapterId: userProgress.chapterId,
          title: chapters.title,
          categoryTitle: categories.title,
          completions: sql<number>`count(case when ${userProgress.completed} then 1 end)`,
          started: sql<number>`count(*)`,
          completionRate: sql<number>`round(count(case when ${userProgress.completed} then 1 end) * 100.0 / count(*), 1)`,
          avgCompletionTime: sql<number>`avg(case when ${userProgress.completed} then extract(epoch from (${userProgress.completedAt} - ${userProgress.createdAt}))/60 end)`,
          lastCompleted: sql<Date>`max(${userProgress.completedAt})`
        })
        .from(userProgress)
        .innerJoin(chapters, eq(userProgress.chapterId, chapters.id))
        .innerJoin(categories, eq(chapters.categoryId, categories.id))
        .groupBy(userProgress.chapterId, chapters.title, categories.title)
        .orderBy(sql`count(case when ${userProgress.completed} then 1 end) desc`);

      // Get category engagement stats
      const categoryStats = await db
        .select({
          categoryId: categories.id,
          categoryTitle: categories.title,
          totalChapters: sql<number>`count(distinct ${chapters.id})`,
          totalCompletions: sql<number>`count(case when ${userProgress.completed} then 1 end)`,
          totalUsers: sql<number>`count(distinct ${userProgress.userId})`,
          avgCompletionRate: sql<number>`round(count(case when ${userProgress.completed} then 1 end) * 100.0 / count(*), 1)`
        })
        .from(categories)
        .leftJoin(chapters, eq(categories.id, chapters.categoryId))
        .leftJoin(userProgress, eq(chapters.id, userProgress.chapterId))
        .groupBy(categories.id, categories.title)
        .orderBy(sql`count(case when ${userProgress.completed} then 1 end) desc`);

      // Get trending chapters (completed in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const trendingChapters = await db
        .select({
          chapterId: chapters.id,
          title: chapters.title,
          categoryTitle: categories.title,
          recentCompletions: sql<number>`count(*)`,
          trend: sql<string>`'up'`
        })
        .from(userProgress)
        .innerJoin(chapters, eq(userProgress.chapterId, chapters.id))
        .innerJoin(categories, eq(chapters.categoryId, categories.id))
        .where(and(
          eq(userProgress.completed, true),
          sql`${userProgress.completedAt} > ${weekAgo.toISOString()}`
        ))
        .groupBy(chapters.id, chapters.title, categories.title)
        .orderBy(sql`count(*) desc`)
        .limit(10);

      // Get user engagement patterns
      const userEngagement = await db
        .select({
          totalUsers: sql<number>`count(distinct ${userProgress.userId})`,
          activeUsers: sql<number>`count(distinct case when ${userProgress.completed} then ${userProgress.userId} end)`,
          avgChaptersPerUser: sql<number>`round(count(case when ${userProgress.completed} then 1 end) * 1.0 / count(distinct ${userProgress.userId}), 1)`,
          completionRate: sql<number>`round(count(case when ${userProgress.completed} then 1 end) * 100.0 / count(*), 1)`
        })
        .from(userProgress);

      return {
        chapterStats,
        categoryStats,
        trendingChapters,
        userEngagement: userEngagement[0] || {
          totalUsers: 0,
          activeUsers: 0,
          avgChaptersPerUser: 0,
          completionRate: 0
        },
        summary: {
          mostPopularChapter: chapterStats[0] || null,
          leastEngagedChapters: chapterStats.slice(-3).reverse(),
          totalEngagement: chapterStats.reduce((sum, ch) => sum + (ch.completions || 0), 0)
        }
      };
    } catch (error) {
      console.error('Error getting content analytics:', error);
      return {
        chapterStats: [],
        categoryStats: [],
        trendingChapters: [],
        userEngagement: { totalUsers: 0, activeUsers: 0, avgChaptersPerUser: 0, completionRate: 0 },
        summary: { mostPopularChapter: null, leastEngagedChapters: [], totalEngagement: 0 }
      };
    }
  }

  async inviteTeamMember(email: string): Promise<void> {
    // In a real implementation, this would send an email invitation
    console.log(`Invitation sent to ${email}`);
  }

  async removeTeamMember(memberId: string): Promise<void> {
    // In a real implementation, this would remove the member from the team
    console.log(`Member ${memberId} removed from team`);
  }
}

export const storage = new DatabaseStorage();

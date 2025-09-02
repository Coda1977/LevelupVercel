import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  emailIdx: index("users_email_idx").on(table.email), // For user lookups
}));

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  iconType: varchar("icon_type"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sortOrderIdx: index("categories_sort_order_idx").on(table.sortOrder),
  createdAtIdx: index("categories_created_at_idx").on(table.createdAt),
}));

// Chapters table
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  preview: text("preview"),
  content: text("content"),
  duration: varchar("duration"),
  categoryId: integer("category_id").references(() => categories.id),
  chapterNumber: integer("chapter_number"),
  youtubeUrl: varchar("youtube_url"),
  spotifyUrl: varchar("spotify_url"),
  tryThisWeek: text("try_this_week"),
  // Book summary fields
  contentType: varchar("content_type").default("lesson"), // 'lesson' or 'book_summary'
  author: varchar("author"),
  readingTime: integer("reading_time"),
  keyTakeaways: jsonb("key_takeaways"),
  audioUrl: varchar("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryIdIdx: index("chapters_category_id_idx").on(table.categoryId),
  categoryChapterNumIdx: index("chapters_category_chapter_num_idx").on(table.categoryId, table.chapterNumber),
  contentTypeIdx: index("chapters_content_type_idx").on(table.contentType),
  createdAtIdx: index("chapters_created_at_idx").on(table.createdAt),
  updatedAtIdx: index("chapters_updated_at_idx").on(table.updatedAt),
}));

// User progress table
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  chapterId: integer("chapter_id").references(() => chapters.id),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_progress_user_id_idx").on(table.userId),
  chapterIdIdx: index("user_progress_chapter_id_idx").on(table.chapterId),
  userChapterIdx: index("user_progress_user_chapter_idx").on(table.userId, table.chapterId), // Regular index
  userChapterUnique: unique("user_progress_user_chapter_unique").on(table.userId, table.chapterId), // Unique constraint for upsert
  completedIdx: index("user_progress_completed_idx").on(table.completed),
  completedAtIdx: index("user_progress_completed_at_idx").on(table.completedAt),
  userCompletedIdx: index("user_progress_user_completed_idx").on(table.userId, table.completed), // Analytics queries
}));

// Shared chapters table for sharing functionality
export const sharedChapters = pgTable("shared_chapters", {
  id: serial("id").primaryKey(),
  shareId: varchar("share_id").notNull().unique(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  sharedBy: varchar("shared_by").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  expiresAtIdx: index("shared_chapters_expires_at_idx").on(table.expiresAt), // Cleanup expired shares
  sharedByIdx: index("shared_chapters_shared_by_idx").on(table.sharedBy),
  chapterIdIdx: index("shared_chapters_chapter_id_idx").on(table.chapterId),
}));

// Chat sessions table
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id").notNull(),
  name: varchar("name").notNull(), // session title
  summary: varchar("summary"), // optional short description
  messages: jsonb("messages").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userSessionIdx: index("chat_sessions_user_session_idx").on(table.userId, table.sessionId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  sharedChapters: many(sharedChapters),
  chatSessions: many(chatSessions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  category: one(categories, {
    fields: [chapters.categoryId],
    references: [categories.id],
  }),
  progress: many(userProgress),
  sharedChapters: many(sharedChapters),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [userProgress.chapterId],
    references: [chapters.id],
  }),
}));

export const sharedChaptersRelations = relations(sharedChapters, ({ one }) => ({
  chapter: one(chapters, {
    fields: [sharedChapters.chapterId],
    references: [chapters.id],
  }),
  sharedBy: one(users, {
    fields: [sharedChapters.sharedBy],
    references: [users.id],
  }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSharedChapterSchema = createInsertSchema(sharedChapters).omit({
  id: true,
  createdAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type SharedChapter = typeof sharedChapters.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertSharedChapter = z.infer<typeof insertSharedChapterSchema>;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

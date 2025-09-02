-- Performance Optimization: Add database indexes for common queries
-- Generated on 2024-12-21

-- Users table indexes
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Categories table indexes  
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON categories (sort_order);
CREATE INDEX IF NOT EXISTS categories_created_at_idx ON categories (created_at);

-- Chapters table indexes
CREATE INDEX IF NOT EXISTS chapters_category_id_idx ON chapters (category_id);
CREATE INDEX IF NOT EXISTS chapters_category_chapter_num_idx ON chapters (category_id, chapter_number);
CREATE INDEX IF NOT EXISTS chapters_content_type_idx ON chapters (content_type);
CREATE INDEX IF NOT EXISTS chapters_created_at_idx ON chapters (created_at);
CREATE INDEX IF NOT EXISTS chapters_updated_at_idx ON chapters (updated_at);

-- User progress table indexes (most critical for performance)
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress (user_id);
CREATE INDEX IF NOT EXISTS user_progress_chapter_id_idx ON user_progress (chapter_id);
CREATE INDEX IF NOT EXISTS user_progress_user_chapter_idx ON user_progress (user_id, chapter_id);
CREATE INDEX IF NOT EXISTS user_progress_completed_idx ON user_progress (completed);
CREATE INDEX IF NOT EXISTS user_progress_completed_at_idx ON user_progress (completed_at);
CREATE INDEX IF NOT EXISTS user_progress_user_completed_idx ON user_progress (user_id, completed);

-- Shared chapters table indexes
CREATE INDEX IF NOT EXISTS shared_chapters_expires_at_idx ON shared_chapters (expires_at);
CREATE INDEX IF NOT EXISTS shared_chapters_shared_by_idx ON shared_chapters (shared_by);
CREATE INDEX IF NOT EXISTS shared_chapters_chapter_id_idx ON shared_chapters (chapter_id);

-- Analyze tables to update statistics after creating indexes
ANALYZE users;
ANALYZE categories;
ANALYZE chapters;
ANALYZE user_progress;
ANALYZE shared_chapters;
ANALYZE chat_sessions;
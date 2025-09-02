-- Level Up Management Development Platform Database Schema
-- Migration: Initial schema with all 7 tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS shared_chapters CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Session storage table (for Supabase Auth compatibility)
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_session_expire ON sessions(expire);

-- Users table
CREATE TABLE users (
  id VARCHAR PRIMARY KEY NOT NULL,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX users_created_at_idx ON users(created_at);
CREATE INDEX users_email_idx ON users(email);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  description TEXT,
  icon_type VARCHAR,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX categories_sort_order_idx ON categories(sort_order);
CREATE INDEX categories_created_at_idx ON categories(created_at);

-- Chapters table
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  slug VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  preview TEXT,
  content TEXT,
  duration VARCHAR,
  category_id INTEGER REFERENCES categories(id),
  chapter_number INTEGER,
  youtube_url VARCHAR,
  spotify_url VARCHAR,
  try_this_week TEXT,
  content_type VARCHAR DEFAULT 'lesson',
  author VARCHAR,
  reading_time INTEGER,
  key_takeaways JSONB,
  audio_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX chapters_category_id_idx ON chapters(category_id);
CREATE INDEX chapters_category_chapter_num_idx ON chapters(category_id, chapter_number);
CREATE INDEX chapters_content_type_idx ON chapters(content_type);
CREATE INDEX chapters_created_at_idx ON chapters(created_at);
CREATE INDEX chapters_updated_at_idx ON chapters(updated_at);

-- User progress table
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  chapter_id INTEGER REFERENCES chapters(id),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX user_progress_chapter_id_idx ON user_progress(chapter_id);
CREATE INDEX user_progress_user_chapter_idx ON user_progress(user_id, chapter_id);
CREATE INDEX user_progress_completed_idx ON user_progress(completed);
CREATE INDEX user_progress_completed_at_idx ON user_progress(completed_at);
CREATE INDEX user_progress_user_completed_idx ON user_progress(user_id, completed);

-- Shared chapters table
CREATE TABLE shared_chapters (
  id SERIAL PRIMARY KEY,
  share_id VARCHAR NOT NULL UNIQUE,
  chapter_id INTEGER REFERENCES chapters(id),
  shared_by VARCHAR REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX shared_chapters_expires_at_idx ON shared_chapters(expires_at);
CREATE INDEX shared_chapters_shared_by_idx ON shared_chapters(shared_by);
CREATE INDEX shared_chapters_chapter_id_idx ON shared_chapters(chapter_id);

-- Chat sessions table
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  session_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  summary VARCHAR,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX chat_sessions_user_session_idx ON chat_sessions(user_id, session_id);
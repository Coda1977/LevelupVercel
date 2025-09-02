-- Level Up Database Setup for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR NOT NULL UNIQUE,
  title VARCHAR NOT NULL,
  description TEXT,
  icon_type VARCHAR,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
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

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  chapter_id INTEGER REFERENCES chapters(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Create shared_chapters table
CREATE TABLE IF NOT EXISTS public.shared_chapters (
  id SERIAL PRIMARY KEY,
  share_id VARCHAR NOT NULL UNIQUE,
  chapter_id INTEGER REFERENCES chapters(id),
  shared_by UUID REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  summary VARCHAR,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON categories(sort_order);
CREATE INDEX IF NOT EXISTS chapters_category_id_idx ON chapters(category_id);
CREATE INDEX IF NOT EXISTS chapters_content_type_idx ON chapters(content_type);
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS user_progress_chapter_id_idx ON user_progress(chapter_id);
CREATE INDEX IF NOT EXISTS shared_chapters_expires_at_idx ON shared_chapters(expires_at);
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

-- Chapters policies (public read)
CREATE POLICY "Anyone can view chapters" ON chapters FOR SELECT USING (true);

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Shared chapters policies
CREATE POLICY "Users can view shared chapters" ON shared_chapters FOR SELECT USING (true);
CREATE POLICY "Users can create shared chapters" ON shared_chapters FOR INSERT WITH CHECK (auth.uid() = shared_by);

-- Chat sessions policies
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
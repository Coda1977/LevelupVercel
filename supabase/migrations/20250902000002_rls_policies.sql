-- Row Level Security Policies for Level Up Management Platform
-- This ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_chapters ENABLE ROW LEVEL SECURITY;

-- Categories and chapters are public (can be read by all authenticated users)
-- But only admins can modify them (we'll handle this in the application logic)

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::varchar = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::varchar = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::varchar = id);

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid()::varchar = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid()::varchar = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid()::varchar = user_id);

CREATE POLICY "Users can delete own progress" ON user_progress
  FOR DELETE USING (auth.uid()::varchar = user_id);

-- Chat sessions policies
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid()::varchar = user_id);

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid()::varchar = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid()::varchar = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
  FOR DELETE USING (auth.uid()::varchar = user_id);

-- Shared chapters policies
CREATE POLICY "Users can view shared chapters they created" ON shared_chapters
  FOR SELECT USING (auth.uid()::varchar = shared_by);

CREATE POLICY "Users can create shared chapters" ON shared_chapters
  FOR INSERT WITH CHECK (auth.uid()::varchar = shared_by);

CREATE POLICY "Users can delete own shared chapters" ON shared_chapters
  FOR DELETE USING (auth.uid()::varchar = shared_by);

-- Allow public read access to shared chapters (for the sharing functionality)
CREATE POLICY "Anyone can view non-expired shared chapters" ON shared_chapters
  FOR SELECT USING (expires_at > NOW());

-- Categories and chapters: Allow authenticated users to read
CREATE POLICY "Authenticated users can view categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view chapters" ON chapters
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies for categories and chapters (we'll implement admin role checking in app logic)
-- For now, we'll just allow authenticated users to modify, but we'll control this via API
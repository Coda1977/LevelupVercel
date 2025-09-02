-- ========================================
-- COMPLETE AUTHENTICATION FIX FOR LEVELUP
-- Migration: Add triggers and functions
-- ========================================

-- 1. Add admin column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Update the handle_new_user function to properly sync users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, is_admin, created_at, updated_at)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    CASE WHEN new.email = 'tinymanagerai@gmail.com' THEN true ELSE false END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    first_name = CASE 
      WHEN EXCLUDED.first_name != '' THEN EXCLUDED.first_name 
      ELSE users.first_name 
    END,
    last_name = CASE 
      WHEN EXCLUDED.last_name != '' THEN EXCLUDED.last_name 
      ELSE users.last_name 
    END,
    is_admin = CASE 
      WHEN EXCLUDED.email = 'tinymanagerai@gmail.com' THEN true 
      ELSE users.is_admin 
    END,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop and recreate triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data OR OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Sync any existing auth users to public.users
-- Skipping automatic sync due to UUID type issues
-- Users will be synced on first login via trigger

-- 5. Update any existing user with tinymanagerai@gmail.com to be admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'tinymanagerai@gmail.com';

-- 6. Create helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fix RLS policies for proper access control
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- User policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Public read for categories and chapters
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view chapters" ON chapters;
CREATE POLICY "Anyone can view chapters" ON chapters 
  FOR SELECT USING (true);

-- Admin write access for content
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can manage chapters" ON chapters;
CREATE POLICY "Admins can manage chapters" ON chapters 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- User progress policies
DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;
CREATE POLICY "Users can manage own progress" ON user_progress 
  FOR ALL USING (auth.uid() = user_id);

-- Shared chapters policies
DROP POLICY IF EXISTS "Anyone can view shared chapters" ON shared_chapters;
CREATE POLICY "Anyone can view shared chapters" ON shared_chapters 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create shared chapters" ON shared_chapters;
CREATE POLICY "Users can create shared chapters" ON shared_chapters 
  FOR INSERT WITH CHECK (auth.uid() = shared_by);

-- Chat sessions policies
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON chat_sessions;
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions 
  FOR ALL USING (auth.uid() = user_id);

-- 8. Insert sample categories if none exist
INSERT INTO public.categories (slug, title, description, sort_order)
SELECT * FROM (VALUES
  ('leadership', 'Leadership', 'Develop your leadership skills', 1),
  ('communication', 'Communication', 'Master effective communication', 2),
  ('productivity', 'Productivity', 'Boost your productivity', 3),
  ('team-building', 'Team Building', 'Build stronger teams', 4)
) AS v(slug, title, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories);

-- 9. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO anon, authenticated;
-- Fix UUID type issues first
-- This migration converts VARCHAR id columns to UUID type

-- 1. Drop ALL policies on affected tables
DO $$ 
DECLARE
    pol record;
BEGIN
    -- Drop all policies on users table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
    
    -- Drop all policies on user_progress table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_progress'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_progress', pol.policyname);
    END LOOP;
    
    -- Drop all policies on chat_sessions table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chat_sessions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON chat_sessions', pol.policyname);
    END LOOP;
    
    -- Drop all policies on shared_chapters table
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'shared_chapters'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON shared_chapters', pol.policyname);
    END LOOP;
END $$;

-- 2. Drop foreign key constraints temporarily
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;
ALTER TABLE shared_chapters DROP CONSTRAINT IF EXISTS shared_chapters_shared_by_fkey;

-- 3. Convert users.id from VARCHAR to UUID
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;

-- 4. Convert foreign key columns to UUID
ALTER TABLE user_progress ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE chat_sessions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
ALTER TABLE shared_chapters ALTER COLUMN shared_by TYPE UUID USING shared_by::UUID;

-- 5. Re-add foreign key constraints
ALTER TABLE user_progress 
  ADD CONSTRAINT user_progress_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chat_sessions 
  ADD CONSTRAINT chat_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE shared_chapters 
  ADD CONSTRAINT shared_chapters_shared_by_fkey 
  FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE;
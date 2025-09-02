-- Fix authentication issues for LevelUp

-- First, ensure the users table uses UUID properly
ALTER TABLE public.users ALTER COLUMN id TYPE UUID USING id::UUID;

-- Update the handle_new_user function to work properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, is_admin)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    CASE WHEN new.email = 'tinymanagerai@gmail.com' THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also handle updates (for OAuth providers that might update user info)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure email auth settings are configured
UPDATE auth.config 
SET 
  email_confirm = false,  -- Disable email confirmation for testing
  email_change_confirm = false
WHERE id = 1;

-- Fix any existing users that might have wrong ID format
-- This will sync any auth.users with public.users
INSERT INTO public.users (id, email, first_name, last_name, is_admin)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name',
  CASE WHEN au.email = 'tinymanagerai@gmail.com' THEN true ELSE false END
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  is_admin = CASE WHEN EXCLUDED.email = 'tinymanagerai@gmail.com' THEN true ELSE users.is_admin END;
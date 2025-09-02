-- Add admin role to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set tinymanagerai@gmail.com as admin
-- This will work after they sign in with Google
UPDATE public.users 
SET is_admin = true 
WHERE email = 'tinymanagerai@gmail.com';

-- If user doesn't exist yet, create trigger to auto-set admin on first login
CREATE OR REPLACE FUNCTION public.check_admin_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.email = 'tinymanagerai@gmail.com' THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to auto-set admin status
DROP TRIGGER IF EXISTS check_admin_on_user_create ON public.users;
CREATE TRIGGER check_admin_on_user_create
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.check_admin_email();

-- Update RLS policies for admin access
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users FOR SELECT 
  USING (auth.uid() = id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users" ON users FOR UPDATE 
  USING (auth.uid() = id OR is_admin(auth.uid()));

-- Admin policies for categories (admin can insert/update/delete)
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE 
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE 
  USING (is_admin(auth.uid()));

-- Admin policies for chapters (admin can insert/update/delete)
DROP POLICY IF EXISTS "Admins can insert chapters" ON chapters;
CREATE POLICY "Admins can insert chapters" ON chapters FOR INSERT 
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update chapters" ON chapters;
CREATE POLICY "Admins can update chapters" ON chapters FOR UPDATE 
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete chapters" ON chapters;
CREATE POLICY "Admins can delete chapters" ON chapters FOR DELETE 
  USING (is_admin(auth.uid()));
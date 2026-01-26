-- Create user_roles table and admin user
-- Execute this ENTIRE script in Supabase SQL Editor

-- Step 1: Create app_role enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Step 3: Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS 'SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_uid AND role = ''admin'')';

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Allow authenticated users to read their own role
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Allow admins to manage roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Step 6: Create user_trust_scores table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier TEXT,
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  total_tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_tasks_rejected INTEGER NOT NULL DEFAULT 0,
  total_capsules_earned INTEGER NOT NULL DEFAULT 0,
  total_capsules_slashed INTEGER NOT NULL DEFAULT 0,
  last_task_at TIMESTAMP WITH TIME ZONE,
  cooldown_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 6: Enable RLS on user_trust_scores
ALTER TABLE public.user_trust_scores ENABLE ROW LEVEL SECURITY;

-- Step 7: Insert admin role for the user
INSERT INTO public.user_roles (user_id, role)
VALUES ('d45558e1-2462-4de8-bf2f-f0e83b403131', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 8: Verify the role was created
SELECT user_id, role, created_at 
FROM public.user_roles 
WHERE user_id = 'd45558e1-2462-4de8-bf2f-f0e83b403131';

-- ✅ Done! The user should now have admin access.

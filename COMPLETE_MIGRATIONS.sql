-- Combined Migrations for Engage Capsule Flow
-- Created: 2026-01-13
-- Run this script in Supabase SQL Editor to initialize your database

-- ============================================================================
-- Migration 1: Create task_submissions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT,
  platform TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  engagement_type TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submissions" ON public.task_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON public.task_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" ON public.task_submissions
  FOR UPDATE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_submissions;

CREATE INDEX idx_task_submissions_user_id ON public.task_submissions(user_id);
CREATE INDEX idx_task_submissions_status ON public.task_submissions(status);
CREATE INDEX idx_task_submissions_platform_username ON public.task_submissions(platform, platform_username);

-- ============================================================================
-- Migration 2: Enable REPLICA IDENTITY for realtime
-- ============================================================================
ALTER TABLE public.task_submissions REPLICA IDENTITY FULL;

-- ============================================================================
-- Migration 3: Create wallet_transactions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'earned', 'spent')),
  description TEXT,
  reference_id TEXT,
  balance_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);

-- ============================================================================
-- Migration 4: Create user_profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT false,
  trust_score INTEGER DEFAULT 0,
  total_capsules_earned INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- Migration 5: Create app_settings table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings" ON public.app_settings
  FOR SELECT USING (true);

-- ============================================================================
-- Migration 6: Create user_platform_links table  
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_platform_links (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  platform_user_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_platform_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own platform links" ON public.user_platform_links
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- Migration 7: Create admin_tasks table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  task_type TEXT NOT NULL,
  target_url TEXT,
  capsule_reward INTEGER NOT NULL DEFAULT 5,
  max_completions INTEGER,
  current_completions INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  is_promoted BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active admin tasks" ON public.admin_tasks
  FOR SELECT TO public USING (is_active = true);

-- ============================================================================
-- Migration 8: Add task_submissions indexes and policies
-- ============================================================================
ALTER TABLE public.task_submissions REPLICA IDENTITY FULL;

CREATE POLICY "Admin can manage all submissions" ON public.task_submissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

ALTER TABLE public.task_submissions REPLICA IDENTITY FULL;

CREATE INDEX idx_task_submissions_status_created ON public.task_submissions(status, created_at DESC);

-- ============================================================================
-- Migration 9: Policy updates
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active admin tasks" ON public.admin_tasks;

CREATE POLICY "Anyone can view active admin tasks" 
ON public.admin_tasks 
FOR SELECT 
TO public
USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;

CREATE POLICY "Anyone can read app settings" 
ON public.app_settings 
FOR SELECT 
TO public
USING (true);

-- ============================================================================
-- Migration 10: Create subscription_plans table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('freemium', 'premium')),
  monthly_allowance INTEGER DEFAULT 1500,
  daily_limit INTEGER,
  current_spent INTEGER DEFAULT 0,
  period_start_date TIMESTAMP WITH TIME ZONE,
  period_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON public.subscription_plans
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- Migration 11: Add indexes to wallet_transactions
-- ============================================================================
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- ============================================================================
-- Migration 12: Add more policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;

CREATE POLICY "Users can insert own transactions" 
ON public.wallet_transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Migration 13: Create badges and trust score system
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- Migration 14: Create final policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all active tasks" ON public.admin_tasks;

CREATE POLICY "Users can view all active tasks" 
ON public.admin_tasks 
FOR SELECT 
USING (is_active = true);

-- ============================================================================
-- Migration 15: Create user_tasks (promotion tasks) table - MOST IMPORTANT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  task_type TEXT NOT NULL,
  target_url TEXT NOT NULL,
  capsule_budget INTEGER NOT NULL DEFAULT 0,
  capsule_reward INTEGER NOT NULL DEFAULT 5,
  target_quantity INTEGER NOT NULL DEFAULT 10,
  completed_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active tasks" ON public.tasks
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_platform ON public.tasks(platform);

-- ============================================================================
-- Done! All migrations applied successfully
-- ============================================================================

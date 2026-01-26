-- Add system branding settings
INSERT INTO app_settings (key, value, description)
VALUES (
  'branding',
  '{"app_name": "EngageLoop", "logo_url": null, "favicon_url": null, "primary_color": "#7c3aed", "hero_title": "Turn Your Engagement Into Digital Currency", "hero_subtitle": "Earn Capsules by completing simple social tasks. Spend them to boost your content.", "footer_text": "© 2024 EngageLoop. All rights reserved."}',
  'System branding and UI customization'
)
ON CONFLICT (key) DO NOTHING;

-- Add capsule packages settings
INSERT INTO app_settings (key, value, description)
VALUES (
  'capsule_packages',
  '[{"id": "starter", "capsules": 100, "price": 500, "label": "Starter"}, {"id": "popular", "capsules": 500, "price": 2000, "label": "Popular"}, {"id": "best_value", "capsules": 1500, "price": 5000, "label": "Best Value", "featured": true}]',
  'Capsule top-up packages'
)
ON CONFLICT (key) DO NOTHING;

-- Create admin_tasks table for admin-created tasks with highest privileges
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,
  task_type TEXT NOT NULL,
  target_url TEXT,
  capsule_reward INTEGER NOT NULL DEFAULT 20,
  priority INTEGER NOT NULL DEFAULT 1,
  is_promoted BOOLEAN NOT NULL DEFAULT true,
  max_completions INTEGER,
  current_completions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_tasks
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

-- Admin can manage tasks
CREATE POLICY "Admins can manage admin tasks"
ON public.admin_tasks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active admin tasks
CREATE POLICY "Anyone can view active admin tasks"
ON public.admin_tasks
FOR SELECT
USING (is_active = true);

-- Enable realtime for admin_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_tasks;

-- Create user_access_tokens table for temporary login links
CREATE TABLE IF NOT EXISTS public.user_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_access_tokens ENABLE ROW LEVEL SECURITY;

-- Admin can manage access tokens
CREATE POLICY "Admins can manage access tokens"
ON public.user_access_tokens
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_access_tokens;
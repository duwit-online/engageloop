-- Create a simple admin_config table for storing pricing and settings
CREATE TABLE IF NOT EXISTS public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL DEFAULT 'pricing',
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(config_type)
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage config
CREATE POLICY "Admin manage config" ON public.admin_config FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Public can read config
CREATE POLICY "Public read config" ON public.admin_config FOR SELECT USING (true);

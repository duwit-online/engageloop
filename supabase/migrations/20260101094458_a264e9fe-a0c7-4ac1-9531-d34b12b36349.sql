-- Create app_settings table for configurable system settings
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage app settings" ON public.app_settings
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Anyone can read settings (for economy values display)
CREATE POLICY "Anyone can read app settings" ON public.app_settings
FOR SELECT USING (true);

-- Create ad_zones table for ad management
CREATE TABLE public.ad_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  placement text NOT NULL CHECK (placement IN ('header', 'sidebar', 'footer', 'inline', 'interstitial')),
  type text NOT NULL CHECK (type IN ('script', 'link', 'banner')),
  content text NOT NULL,
  provider text,
  enabled boolean NOT NULL DEFAULT true,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  revenue numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_zones ENABLE ROW LEVEL SECURITY;

-- Only admins can manage ads
CREATE POLICY "Admins can manage ad zones" ON public.ad_zones
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Anyone can view enabled ads (for display)
CREATE POLICY "Anyone can view enabled ads" ON public.ad_zones
FOR SELECT USING (enabled = true);

-- Add status column to profiles for suspension/ban
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'restricted', 'suspended', 'banned'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'freemium' CHECK (plan IN ('freemium', 'premium'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cooldown_until timestamp with time zone;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_zones;

-- Set replica identity for realtime
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;
ALTER TABLE public.ad_zones REPLICA IDENTITY FULL;

-- Insert default app settings
INSERT INTO public.app_settings (key, value, description) VALUES
('task_rewards', '{"like": 5, "comment": 10, "follow": 15, "stream": 15, "combo_bonus": 15}', 'Capsule rewards per task type'),
('trust_thresholds', '{"suspended": 20, "restricted": 50, "normal": 80, "trusted": 100}', 'Trust score tier thresholds'),
('cooldown_settings', '{"default_hours": 24, "max_hours": 168}', 'Cooldown period settings'),
('economy_settings', '{"daily_limit_free": 100, "monthly_allowance_free": 1500, "monthly_allowance_premium": 6000, "premium_multiplier": 1.5}', 'Economy and plan settings'),
('premium_pricing', '{"monthly": 3000, "quarterly_discount": 0.1, "biannual_discount": 0.15, "annual_discount": 0.25}', 'Premium subscription pricing in NGN')
ON CONFLICT (key) DO NOTHING;
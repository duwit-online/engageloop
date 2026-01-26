-- Add plan column to profiles table for admin user creation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'freemium';
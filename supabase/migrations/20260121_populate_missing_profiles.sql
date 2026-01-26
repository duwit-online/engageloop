-- Populate missing profiles for existing auth users
-- This ensures all users have corresponding profiles and trust scores

INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Also ensure trust scores exist
INSERT INTO public.user_trust_scores (user_id, trust_score, created_at, updated_at)
SELECT
  au.id,
  50,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.user_trust_scores ts ON au.id = ts.user_id
WHERE ts.user_id IS NULL;

-- Update existing trust scores to have proper created_at if missing
UPDATE public.user_trust_scores
SET created_at = au.created_at, updated_at = au.created_at
FROM auth.users au
WHERE user_trust_scores.user_id = au.id
  AND user_trust_scores.created_at IS NULL;
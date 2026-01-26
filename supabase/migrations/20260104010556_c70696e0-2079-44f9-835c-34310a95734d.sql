-- Fix: handle_new_user_definer - Add input validation and sanitization to the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  display_name_val TEXT;
BEGIN
  -- Validate and sanitize display name
  display_name_val := COALESCE(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );
  
  -- Limit to 100 characters
  display_name_val := SUBSTRING(display_name_val, 1, 100);
  
  -- Remove potential XSS/injection characters (basic sanitization)
  display_name_val := REGEXP_REPLACE(display_name_val, '[<>"''`\\;]', '', 'g');
  
  -- Trim whitespace
  display_name_val := TRIM(display_name_val);
  
  -- Ensure non-empty fallback
  IF display_name_val IS NULL OR display_name_val = '' THEN
    display_name_val := 'User';
  END IF;
  
  -- Insert profile with sanitized display name
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, display_name_val);
  
  -- Insert initial trust score
  INSERT INTO public.user_trust_scores (user_id, trust_score)
  VALUES (new.id, 50);
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to initialize user %: %', new.id, SQLERRM;
    -- Still return new to not block auth user creation
    RETURN new;
END;
$$;

-- Add display_name length constraint to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_display_name_length'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT check_display_name_length 
    CHECK (LENGTH(display_name) <= 100);
  END IF;
END $$;
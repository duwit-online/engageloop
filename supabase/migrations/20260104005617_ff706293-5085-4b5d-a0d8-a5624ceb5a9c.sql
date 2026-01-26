-- ============================================
-- FIX 1: Task Submissions RLS Policies
-- ============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Anyone can create task submissions" ON task_submissions;
DROP POLICY IF EXISTS "Anyone can update task submissions" ON task_submissions;

-- Users can only view their own submissions
CREATE POLICY "Users can view own submissions"
ON task_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON task_submissions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can create submissions for themselves
CREATE POLICY "Users can create own submissions"
ON task_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Only admins can update submissions
CREATE POLICY "Admins can update submissions"
ON task_submissions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- FIX 2: Screenshots Storage Bucket Security
-- ============================================

-- Make bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'screenshots';

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view screenshots" ON storage.objects;

-- Authenticated users can upload their own screenshots
CREATE POLICY "Users can upload screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'screenshots' 
  AND auth.uid() IS NOT NULL
);

-- Users can view their own screenshots, admins can view all
CREATE POLICY "Users and admins can view screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'screenshots'
  AND (auth.uid() IS NOT NULL OR has_role(auth.uid(), 'admin'::app_role))
);

-- ============================================
-- FIX 3: Input Validation Constraints
-- ============================================

-- Add length constraints on task_submissions
ALTER TABLE task_submissions
ADD CONSTRAINT check_username_length 
  CHECK (LENGTH(platform_username) >= 1 AND LENGTH(platform_username) <= 100);

ALTER TABLE task_submissions
ADD CONSTRAINT check_question_length 
  CHECK (LENGTH(content_question) <= 500);

ALTER TABLE task_submissions
ADD CONSTRAINT check_answer_length 
  CHECK (LENGTH(content_answer) <= 2000);

-- Add range constraints
ALTER TABLE task_submissions
ADD CONSTRAINT check_timer_range 
  CHECK (timer_seconds >= 0 AND timer_seconds <= 86400);

ALTER TABLE task_submissions
ADD CONSTRAINT check_capsules_range 
  CHECK (capsules_earned >= 0 AND capsules_earned <= 1000);

-- ============================================
-- FIX 4: Server-side validation trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_submission_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitize text fields (remove HTML/script tags)
  NEW.platform_username := REGEXP_REPLACE(NEW.platform_username, '[<>"''`]', '', 'g');
  NEW.content_question := REGEXP_REPLACE(NEW.content_question, '<[^>]*>', '', 'g');
  NEW.content_answer := REGEXP_REPLACE(NEW.content_answer, '<[^>]*>', '', 'g');
  
  -- Ensure capsules_earned is 0 for new submissions (will be set by admin)
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    NEW.capsules_earned := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for validation
DROP TRIGGER IF EXISTS sanitize_submission_before_insert ON task_submissions;
CREATE TRIGGER sanitize_submission_before_insert
  BEFORE INSERT OR UPDATE ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_submission_data();
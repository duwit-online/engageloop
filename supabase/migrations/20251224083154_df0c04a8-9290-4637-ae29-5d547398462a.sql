-- Create task_submissions table to store all task verification data
CREATE TABLE public.task_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  task_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  task_type TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  content_question TEXT NOT NULL,
  content_answer TEXT NOT NULL,
  screenshot_url TEXT,
  timer_seconds INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'released')),
  capsules_earned INTEGER NOT NULL DEFAULT 0,
  verification_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE
);

-- Create username_verifications table to cache verification results
CREATE TABLE public.username_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT false,
  profile_data JSONB,
  last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(platform, username)
);

-- Enable Row Level Security
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.username_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_submissions (public insert for now, can be restricted later with auth)
CREATE POLICY "Anyone can create task submissions" 
ON public.task_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view task submissions" 
ON public.task_submissions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update task submissions" 
ON public.task_submissions 
FOR UPDATE 
USING (true);

-- RLS policies for username_verifications (public for caching)
CREATE POLICY "Anyone can view username verifications" 
ON public.username_verifications 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create username verifications" 
ON public.username_verifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update username verifications" 
ON public.username_verifications 
FOR UPDATE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_task_submissions_status ON public.task_submissions(status);
CREATE INDEX idx_task_submissions_platform_username ON public.task_submissions(platform, platform_username);
CREATE INDEX idx_username_verifications_lookup ON public.username_verifications(platform, username);
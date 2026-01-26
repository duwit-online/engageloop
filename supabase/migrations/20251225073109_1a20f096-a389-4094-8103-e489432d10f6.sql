-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create user_trust_scores table for tracking trust
CREATE TABLE public.user_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  identifier TEXT, -- For non-authenticated users (device id, etc)
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

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trust_scores ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for user_trust_scores  
CREATE POLICY "Anyone can view trust scores" ON public.user_trust_scores
FOR SELECT USING (true);

CREATE POLICY "Admins can manage trust scores" ON public.user_trust_scores
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own trust score" ON public.user_trust_scores
FOR SELECT USING (auth.uid() = user_id);

-- Add reviewer fields to task_submissions
ALTER TABLE public.task_submissions 
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN review_notes TEXT;

-- Create index for faster admin queries
CREATE INDEX idx_task_submissions_status_created ON public.task_submissions(status, created_at DESC);
CREATE INDEX idx_user_trust_scores_user ON public.user_trust_scores(user_id);

-- Update timestamp trigger for trust scores
CREATE OR REPLACE FUNCTION public.update_trust_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_trust_scores_updated_at
BEFORE UPDATE ON public.user_trust_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_trust_scores_updated_at();
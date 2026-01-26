-- Create user_tasks table for user-created promotion tasks
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

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all active tasks" ON public.tasks
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Create index for performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_platform ON public.tasks(platform);
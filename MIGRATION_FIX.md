# Fix for "Could not find the table public_task" Error

## Issue
Users cannot launch new campaigns from `/dashboard/promote` with error: "could not find the table public_task in the schema cache"

## Root Cause
The latest migration file (`20260112000000_create_user_tasks.sql`) that creates the `public.tasks` table has not been applied to the Supabase remote database.

## Solution

### Option 1: Using Supabase CLI (Recommended)

```bash
cd c:\Users\USER\Desktop\my projects\engage-capsule-flow-main
supabase db push
```

This will apply all pending migrations from the `supabase/migrations/` directory to your remote Supabase database.

### Option 2: Manual SQL Execution (If CLI doesn't work)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query and run the SQL from `supabase/migrations/20260112000000_create_user_tasks.sql`:

```sql
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
```

4. Execute the query
5. Refresh the page and test the campaign launch functionality

### Option 3: Update Types (After Applying Migration)

Once the migration is applied, regenerate the TypeScript types:

```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

## Verification

After applying the migration, you should be able to:
1. Navigate to `/dashboard/promote`
2. Enter a URL and select engagement types
3. Click "Launch Promotion" to create a new campaign

The `tasks` table will store all user-created promotion campaigns.

## Related Files
- [PromoteLinkPage.tsx](src/pages/dashboard/PromoteLinkPage.tsx) - Frontend component for launching campaigns
- [20260112000000_create_user_tasks.sql](supabase/migrations/20260112000000_create_user_tasks.sql) - Migration file
- [Database Types](src/integrations/supabase/types.ts) - TypeScript type definitions

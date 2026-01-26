-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view active admin tasks" ON public.admin_tasks;

-- Create a permissive policy instead
CREATE POLICY "Anyone can view active admin tasks" 
ON public.admin_tasks 
FOR SELECT 
TO public
USING (is_active = true);

-- Also let's ensure app_settings SELECT is permissive
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;

CREATE POLICY "Anyone can read app settings" 
ON public.app_settings 
FOR SELECT 
TO public
USING (true);
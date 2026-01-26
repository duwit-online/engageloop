-- Enable realtime for additional tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_trust_scores;

-- Enable full row data for updates
ALTER TABLE public.task_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_trust_scores REPLICA IDENTITY FULL;

-- Add DELETE policy for task_submissions for admin CRUD
CREATE POLICY "Admins can delete task submissions"
ON public.task_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
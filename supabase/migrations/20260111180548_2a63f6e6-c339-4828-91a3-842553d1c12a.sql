-- Allow authenticated users to insert their own wallet transactions (for task completion flow)
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;

CREATE POLICY "Users can insert own transactions" 
ON public.wallet_transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
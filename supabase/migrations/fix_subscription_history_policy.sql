-- Fix subscription_history table policies
-- This migration adds a policy to allow authenticated users to insert their own history records

-- Drop existing policy if it exists (in case we need to re-run this)
DROP POLICY IF EXISTS "Allow authenticated users to insert own history" ON public.subscription_history;

-- Add policy to allow authenticated users to insert their own records
CREATE POLICY "Allow authenticated users to insert own history"
  ON public.subscription_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Verify the table has RLS enabled (should already be enabled)
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

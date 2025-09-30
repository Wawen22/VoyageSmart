-- Migration: Fix participant visibility for invited users
-- Date: 2024-05-28
-- Description: Updates the RLS policy on trip_participants to allow all accepted participants
--              to see all other participants of the same trip, not just themselves.
-- Status: APPLIED TO DATABASE ON 2025-09-30
-- Fix: Updated to use SECURITY DEFINER function to avoid infinite recursion

-- Drop the existing restrictive policy (old name: trip_participants_access)
DROP POLICY IF EXISTS "trip_participants_access" ON public.trip_participants;

-- Create the fixed policy that allows all trip participants to see each other
-- IMPORTANT: Uses is_trip_participant() SECURITY DEFINER function to avoid infinite recursion
CREATE POLICY "trip_participants_access"
  ON public.trip_participants FOR ALL
  USING (
    -- User is the owner of the trip (can see and manage all participants)
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.trip_participants.trip_id AND t.owner_id = auth.uid()
    ) OR
    -- User is an accepted participant of the trip (uses SECURITY DEFINER function)
    -- This function bypasses RLS to avoid infinite recursion
    is_trip_participant(trip_participants.trip_id, auth.uid())
  );

-- Verify the policy was created successfully
DO $$
BEGIN
  RAISE NOTICE 'RLS policy "trip_participants_access" has been updated successfully';
  RAISE NOTICE 'All accepted participants can now see each other';
  RAISE NOTICE 'Using SECURITY DEFINER function to avoid recursion';
END $$;


DROP POLICY IF EXISTS \
Users
can
view
participants
of
trips
they
are
involved
in\ ON public.trip_participants;

CREATE POLICY \Users
can
view
participants
of
trips
they
are
involved
in\ ON public.trip_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.trip_participants tp 
    WHERE tp.trip_id = public.trip_participants.trip_id 
    AND tp.user_id = auth.uid()
  )
);

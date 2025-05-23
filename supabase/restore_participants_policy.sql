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
in\
ON public.trip_participants FOR SELECT
USING (
  -- User is the owner of the trip
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = public.trip_participants.trip_id AND t.owner_id = auth.uid()
  ) OR
  -- User is the participant being viewed
  public.trip_participants.user_id = auth.uid()
);

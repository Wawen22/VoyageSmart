-- Enable RLS on activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere le activities dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can view activities of their trips" ON public.activities;
CREATE POLICY "Users can view activities of their trips"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.activities.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono inserire activities solo nei viaggi a cui partecipano
DROP POLICY IF EXISTS "Trip participants can insert activities" ON public.activities;
CREATE POLICY "Trip participants can insert activities"
  ON public.activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_participants tp
      WHERE tp.trip_id = public.activities.trip_id
        AND tp.user_id = auth.uid()
        AND tp.invitation_status = 'accepted'
    )
  );

-- Policy: Gli utenti possono aggiornare activities solo dei viaggi a cui partecipano con ruolo editor o admin
DROP POLICY IF EXISTS "Trip participants can update activities" ON public.activities;
CREATE POLICY "Trip participants can update activities"
  ON public.activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_participants tp
      WHERE tp.trip_id = public.activities.trip_id
        AND tp.user_id = auth.uid()
        AND tp.role = ANY (ARRAY['editor', 'admin'])
    )
  );

-- Policy: I proprietari del viaggio possono gestire tutte le activities
DROP POLICY IF EXISTS "Trip owners can manage activities" ON public.activities;
CREATE POLICY "Trip owners can manage activities"
  ON public.activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.activities.trip_id
        AND t.owner_id = auth.uid()
    )
  );

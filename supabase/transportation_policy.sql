-- Enable RLS on transportation
ALTER TABLE public.transportation ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere le transportation dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can view transportation of their trips" ON public.transportation;
CREATE POLICY "Users can view transportation of their trips"
  ON public.transportation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.transportation.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono inserire transportation solo nei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can insert transportation for their trips" ON public.transportation;
CREATE POLICY "Users can insert transportation for their trips"
  ON public.transportation FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.transportation.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono aggiornare transportation solo dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can update transportation of their trips" ON public.transportation;
CREATE POLICY "Users can update transportation of their trips"
  ON public.transportation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.transportation.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono cancellare transportation solo dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can delete transportation of their trips" ON public.transportation;
CREATE POLICY "Users can delete transportation of their trips"
  ON public.transportation FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.transportation.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );


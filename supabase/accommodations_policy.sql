-- Enable RLS on accommodations
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere le accommodations dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can view accommodations of their trips" ON public.accommodations;
CREATE POLICY "Users can view accommodations of their trips"
  ON public.accommodations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.accommodations.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono inserire accommodations solo nei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can insert accommodations for their trips" ON public.accommodations;
CREATE POLICY "Users can insert accommodations for their trips"
  ON public.accommodations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.accommodations.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono aggiornare accommodations solo dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can update accommodations of their trips" ON public.accommodations;
CREATE POLICY "Users can update accommodations of their trips"
  ON public.accommodations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.accommodations.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono cancellare accommodations solo dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can delete accommodations of their trips" ON public.accommodations;
CREATE POLICY "Users can delete accommodations of their trips"
  ON public.accommodations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.accommodations.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

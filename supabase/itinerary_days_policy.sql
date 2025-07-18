-- Enable RLS on itinerary_days
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere i giorni dell'itinerario dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can view itinerary days of their trips" ON public.itinerary_days;
CREATE POLICY "Users can view itinerary days of their trips"
  ON public.itinerary_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.itinerary_days.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono inserire giorni dell'itinerario solo nei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can insert itinerary days for their trips" ON public.itinerary_days;
CREATE POLICY "Users can insert itinerary days for their trips"
  ON public.itinerary_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.itinerary_days.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono aggiornare giorni dell'itinerario solo dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can update itinerary days of their trips" ON public.itinerary_days;
CREATE POLICY "Users can update itinerary days of their trips"
  ON public.itinerary_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.itinerary_days.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

-- Policy: Gli utenti possono cancellare giorni dell'itinerario solo dei viaggi a cui partecipano
DROP POLICY IF EXISTS "Users can delete itinerary days of their trips" ON public.itinerary_days;
CREATE POLICY "Users can delete itinerary days of their trips"
  ON public.itinerary_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.itinerary_days.trip_id
        AND (t.owner_id = auth.uid() OR is_trip_participant(t.id, auth.uid()))
    )
  );

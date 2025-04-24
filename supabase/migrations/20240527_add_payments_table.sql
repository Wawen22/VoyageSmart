-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'completed',
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for trips they are involved in
CREATE POLICY "Users can view payments for their trips"
  ON public.payments FOR SELECT
  USING (
    -- User is involved in the trip
    EXISTS (
      SELECT 1 FROM public.trip_participants tp
      WHERE tp.trip_id = public.payments.trip_id 
      AND tp.user_id = auth.uid()
      AND tp.invitation_status = 'accepted'
    ) OR
    -- User is the owner of the trip
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.payments.trip_id AND t.owner_id = auth.uid()
    )
  );

-- Users can create payments for trips they are involved in
CREATE POLICY "Users can create payments for their trips"
  ON public.payments FOR INSERT
  WITH CHECK (
    -- User is involved in the trip
    EXISTS (
      SELECT 1 FROM public.trip_participants tp
      WHERE tp.trip_id = public.payments.trip_id 
      AND tp.user_id = auth.uid()
      AND tp.invitation_status = 'accepted'
    ) OR
    -- User is the owner of the trip
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.payments.trip_id AND t.owner_id = auth.uid()
    )
  );

-- Only the users involved in the payment can update it
CREATE POLICY "Users can update their own payments"
  ON public.payments FOR UPDATE
  USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

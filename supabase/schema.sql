-- Create schema for VoyageSmart app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  destination TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  is_private BOOLEAN DEFAULT true,
  budget_total DECIMAL(10, 2),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trip participants table
CREATE TABLE IF NOT EXISTS public.trip_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'member',
  share_ratio DECIMAL(5, 2) DEFAULT 1.0,
  invited_email TEXT,
  invitation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (trip_id, user_id),
  UNIQUE (trip_id, invited_email)
);

-- Itinerary days table
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  notes TEXT,
  weather_forecast JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (trip_id, day_date)
);

-- Transportation table
CREATE TABLE IF NOT EXISTS public.transportation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.itinerary_days(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  provider TEXT,
  booking_reference TEXT,
  departure_time TIMESTAMP WITH TIME ZONE,
  departure_location TEXT,
  arrival_time TIMESTAMP WITH TIME ZONE,
  arrival_location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Accommodations table
CREATE TABLE IF NOT EXISTS public.accommodations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  check_in_date DATE,
  check_out_date DATE,
  address TEXT,
  coordinates POINT,
  booking_reference TEXT,
  contact_info TEXT,
  cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.itinerary_days(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  coordinates POINT,
  booking_reference TEXT,
  priority INTEGER DEFAULT 3,
  cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  paid_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  split_type TEXT DEFAULT 'equal',
  receipt_url TEXT,
  status TEXT DEFAULT 'settled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Expense participants table
CREATE TABLE IF NOT EXISTS public.expense_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trip media table
CREATE TABLE IF NOT EXISTS public.trip_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.itinerary_days(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'photo',
  url TEXT NOT NULL,
  caption TEXT,
  location TEXT,
  coordinates POINT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Proactive AI suggestions table
CREATE TABLE IF NOT EXISTS public.ai_proactive_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('upcoming_trip', 'in_trip_activity')),
  trigger_event TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'read', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS ai_proactive_suggestions_user_idx
  ON public.ai_proactive_suggestions (user_id, status);

CREATE INDEX IF NOT EXISTS ai_proactive_suggestions_trip_idx
  ON public.ai_proactive_suggestions (trip_id);

-- Helper function to check trip participation (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_trip_participant(trip_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
-- Set a secure search_path:
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_participants
    WHERE trip_id = trip_uuid
      AND user_id = user_uuid
      AND invitation_status = 'accepted'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_trip_participant(UUID, UUID) TO authenticated;


-- Create RLS policies

-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Trips table policies
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trips" ON public.trips;
-- Modified Policy: Uses the security definer function to check participation
CREATE POLICY "Users can view their own trips"
  ON public.trips FOR SELECT
  USING (
    owner_id = auth.uid() OR
    is_trip_participant(trips.id, auth.uid()) -- Use the helper function
  );

DROP POLICY IF EXISTS "Users can create their own trips" ON public.trips;
CREATE POLICY "Users can create their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Trip owners can update their trips" ON public.trips;
CREATE POLICY "Trip owners can update their trips"
  ON public.trips FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Trip owners can delete their trips" ON public.trips;
CREATE POLICY "Trip owners can delete their trips"
  ON public.trips FOR DELETE
  USING (owner_id = auth.uid());

-- Trip participants policies
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trip_participants_access" ON public.trip_participants;
-- Fixed Policy: Allows ALL accepted participants to see each other and perform operations
-- Uses SECURITY DEFINER function is_trip_participant() to avoid infinite recursion
CREATE POLICY "trip_participants_access"
  ON public.trip_participants FOR ALL
  USING (
    -- User is the owner of the trip (can see and manage all participants)
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = public.trip_participants.trip_id AND t.owner_id = auth.uid()
    ) OR
    -- User is an accepted participant of the trip (uses SECURITY DEFINER function)
    is_trip_participant(trip_participants.trip_id, auth.uid())
  );

-- Apply similar RLS policies to other tables (Assuming they might also need DROP IF EXISTS)
-- Note: Add 'DROP POLICY IF EXISTS ...; CREATE POLICY ...;' for other tables if they exist and cause similar errors.

-- AI proactive suggestions policies
ALTER TABLE public.ai_proactive_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own AI suggestions" ON public.ai_proactive_suggestions;
CREATE POLICY "Users can view own AI suggestions"
  ON public.ai_proactive_suggestions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own AI suggestions" ON public.ai_proactive_suggestions;
CREATE POLICY "Users can update own AI suggestions"
  ON public.ai_proactive_suggestions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage buckets
-- Note: This would be done through the Supabase dashboard or API

-- Create functions

-- Function to calculate expense splits
CREATE OR REPLACE FUNCTION calculate_expense_splits(expense_id UUID)
RETURNS VOID AS $$
DECLARE
  v_expense RECORD;
  v_trip_id UUID;
  v_total_amount DECIMAL(10, 2);
  v_participant RECORD;
  v_participant_count INTEGER;
  v_amount_per_person DECIMAL(10, 2);
BEGIN
  -- Get expense details
  SELECT * INTO v_expense FROM public.expenses WHERE id = expense_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  v_trip_id := v_expense.trip_id;
  v_total_amount := v_expense.amount;

  -- Count participants
  SELECT COUNT(*) INTO v_participant_count
  FROM public.trip_participants
  WHERE trip_id = v_trip_id AND invitation_status = 'accepted';

  IF v_participant_count = 0 THEN
    RAISE EXCEPTION 'No participants found for this trip';
  END IF;

  -- Calculate amount per person for equal split
  IF v_expense.split_type = 'equal' THEN
    v_amount_per_person := v_total_amount / v_participant_count;

    -- Delete existing splits
    DELETE FROM public.expense_participants WHERE expense_id = expense_id;

    -- Create new splits
    FOR v_participant IN
      SELECT user_id FROM public.trip_participants
      WHERE trip_id = v_trip_id AND invitation_status = 'accepted'
    LOOP
      INSERT INTO public.expense_participants (
        expense_id, user_id, amount, currency, is_paid
      ) VALUES (
        expense_id,
        v_participant.user_id,
        v_amount_per_person,
        v_expense.currency,
        CASE WHEN v_participant.user_id = v_expense.paid_by THEN TRUE ELSE FALSE END
      );
    END LOOP;
  END IF;

  -- Other split types could be implemented here
END;
$$ LANGUAGE plpgsql;

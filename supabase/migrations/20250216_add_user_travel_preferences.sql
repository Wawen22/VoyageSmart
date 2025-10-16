-- Create table for storing advanced user travel preferences
CREATE TABLE IF NOT EXISTS public.user_travel_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    travel_style TEXT NOT NULL DEFAULT 'balanced' CHECK (travel_style IN ('balanced', 'relaxed', 'adventure', 'culture', 'luxury', 'budget')),
    interests TEXT[] NOT NULL DEFAULT '{}'::text[],
    dietary_restrictions TEXT[] NOT NULL DEFAULT '{}'::text[],
    preferred_climate TEXT NOT NULL DEFAULT 'temperate' CHECK (preferred_climate IN ('temperate', 'warm', 'cold', 'any')),
    accommodation_style TEXT NOT NULL DEFAULT 'hotel' CHECK (accommodation_style IN ('hotel', 'boutique', 'apartment', 'hostel', 'resort', 'camping')),
    transportation_modes TEXT[] NOT NULL DEFAULT '{}'::text[],
    budget_level TEXT NOT NULL DEFAULT 'moderate' CHECK (budget_level IN ('economy', 'moderate', 'premium', 'luxury')),
    mobility_level TEXT NOT NULL DEFAULT 'average' CHECK (mobility_level IN ('low', 'average', 'high')),
    ai_personality TEXT NOT NULL DEFAULT 'balanced' CHECK (ai_personality IN ('balanced', 'minimal', 'proactive', 'concierge')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_travel_preferences ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies to allow users to manage their own preferences
CREATE POLICY "Users can view their travel preferences"
    ON public.user_travel_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their travel preferences"
    ON public.user_travel_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their travel preferences"
    ON public.user_travel_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their travel preferences"
    ON public.user_travel_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Keep updated_at in sync automatically
CREATE TRIGGER update_user_travel_preferences_updated_at
    BEFORE UPDATE ON public.user_travel_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.user_travel_preferences IS 'Stores detailed travel preferences for each user to personalize AI suggestions.';
COMMENT ON COLUMN public.user_travel_preferences.travel_style IS 'Primary travel style preference used for itinerary tone (balanced, relaxed, adventure, culture, luxury, budget).';
COMMENT ON COLUMN public.user_travel_preferences.interests IS 'List of interest tags that guide AI suggestions (e.g. food, history, nightlife).';
COMMENT ON COLUMN public.user_travel_preferences.dietary_restrictions IS 'Dietary requirements to consider in suggestions (e.g. vegetarian, gluten-free).';
COMMENT ON COLUMN public.user_travel_preferences.preferred_climate IS 'Preferred climate for recommendations (temperate, warm, cold, any).';
COMMENT ON COLUMN public.user_travel_preferences.accommodation_style IS 'Preferred accommodation type (hotel, boutique, apartment, hostel, resort, camping).';
COMMENT ON COLUMN public.user_travel_preferences.transportation_modes IS 'Preferred transportation modes during trips (public transit, walking, ride-share, car rental).';
COMMENT ON COLUMN public.user_travel_preferences.budget_level IS 'Budget expectation for AI-driven recommendations (economy, moderate, premium, luxury).';
COMMENT ON COLUMN public.user_travel_preferences.mobility_level IS 'Mobility comfort level to adjust activity suggestions (low, average, high).';
COMMENT ON COLUMN public.user_travel_preferences.ai_personality IS 'Preferred tone for the AI assistant (balanced, minimal, proactive, concierge).';
COMMENT ON COLUMN public.user_travel_preferences.notes IS 'Optional free-form notes captured from the user.';

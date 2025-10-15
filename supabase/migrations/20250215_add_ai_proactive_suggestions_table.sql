-- Create table for proactive AI suggestions
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

-- Indexes to optimize lookups by user/status
CREATE INDEX IF NOT EXISTS ai_proactive_suggestions_user_idx
  ON public.ai_proactive_suggestions (user_id, status);

CREATE INDEX IF NOT EXISTS ai_proactive_suggestions_trip_idx
  ON public.ai_proactive_suggestions (trip_id);

-- Enable RLS and add policies for user access
ALTER TABLE public.ai_proactive_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI suggestions"
  ON public.ai_proactive_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own AI suggestions"
  ON public.ai_proactive_suggestions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

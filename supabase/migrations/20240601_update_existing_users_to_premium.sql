-- Update existing users to premium subscription
-- This script ensures all existing test users have premium access

-- First, create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'ai')),
    price DECIMAL(10, 2),
    currency TEXT DEFAULT 'EUR',
    interval TEXT CHECK (interval IN ('month', 'year')),
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'ai')),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'canceled')),
    valid_until TIMESTAMP WITH TIME ZONE,
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Insert subscription plans if they don't exist
INSERT INTO public.subscriptions (name, description, tier, price, currency, interval, features)
VALUES
    ('Free', 'Basic plan with limited features', 'free', 0, 'EUR', 'month', '{"max_trips": 3, "accommodations": false, "transportation": false}'),
    ('Premium', 'Premium plan with all features', 'premium', 4.99, 'EUR', 'month', '{"max_trips": null, "accommodations": true, "transportation": true}'),
    ('AI Assistant', 'Premium plan with AI features', 'ai', 9.99, 'EUR', 'month', '{"max_trips": null, "accommodations": true, "transportation": true, "ai_assistant": true}')
ON CONFLICT DO NOTHING;

-- Create a function to ensure all users have a subscription
CREATE OR REPLACE FUNCTION ensure_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already has a subscription
    IF NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = NEW.id) THEN
        -- Create a premium subscription for existing users
        INSERT INTO public.user_subscriptions (user_id, tier, status, valid_until)
        VALUES (NEW.id, 'premium', 'active', (NOW() + INTERVAL '1 year'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure all users have a subscription
DROP TRIGGER IF EXISTS ensure_user_subscription_trigger ON auth.users;
CREATE TRIGGER ensure_user_subscription_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION ensure_user_subscription();

-- Update all existing users to have premium subscriptions
-- First, get all users without subscriptions
WITH users_without_subscription AS (
    SELECT id FROM auth.users
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_subscriptions WHERE user_id = auth.users.id
    )
)
-- Insert premium subscriptions for them
INSERT INTO public.user_subscriptions (user_id, tier, status, valid_until)
SELECT id, 'premium', 'active', (NOW() + INTERVAL '1 year')
FROM users_without_subscription;

-- Update all existing subscriptions to premium
UPDATE public.user_subscriptions
SET tier = 'premium', status = 'active', valid_until = (NOW() + INTERVAL '1 year')
WHERE status = 'active';

-- Create RLS policies for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to read subscription plans
CREATE POLICY "Anyone can read subscription plans" ON public.subscriptions
    FOR SELECT USING (true);

-- Allow users to read their own subscriptions
CREATE POLICY "Users can read their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only allow service role to insert/update/delete subscriptions
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
    USING (auth.role() = 'service_role');

-- Only allow service role to insert/update/delete user_subscriptions
CREATE POLICY "Service role can manage user_subscriptions" ON public.user_subscriptions
    USING (auth.role() = 'service_role');

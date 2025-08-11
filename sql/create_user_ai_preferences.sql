-- Create user_ai_preferences table for storing user AI provider preferences
CREATE TABLE IF NOT EXISTS user_ai_preferences (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai')),
    model TEXT NOT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 2048 CHECK (max_tokens > 0 AND max_tokens <= 8192),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Create RLS policies
ALTER TABLE user_ai_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI preferences
CREATE POLICY "Users can view their own AI preferences" ON user_ai_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own AI preferences
CREATE POLICY "Users can insert their own AI preferences" ON user_ai_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI preferences
CREATE POLICY "Users can update their own AI preferences" ON user_ai_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own AI preferences
CREATE POLICY "Users can delete their own AI preferences" ON user_ai_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_ai_preferences_updated_at
    BEFORE UPDATE ON user_ai_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful comments
COMMENT ON TABLE user_ai_preferences IS 'Stores user preferences for AI providers and models';
COMMENT ON COLUMN user_ai_preferences.provider IS 'AI provider: gemini or openai';
COMMENT ON COLUMN user_ai_preferences.model IS 'Specific model name for the provider';
COMMENT ON COLUMN user_ai_preferences.temperature IS 'Temperature setting for AI responses (0-2)';
COMMENT ON COLUMN user_ai_preferences.max_tokens IS 'Maximum tokens for AI responses (1-8192)';

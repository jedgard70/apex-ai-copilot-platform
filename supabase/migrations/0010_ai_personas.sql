-- Create the AI Personas table
CREATE TABLE IF NOT EXISTS ai_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    system_prompt TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one persona is active at a time
DROP INDEX IF EXISTS idx_ai_personas_active;
CREATE UNIQUE INDEX idx_ai_personas_active ON ai_personas(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE ai_personas ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
-- CREATE POLICY "Users can read ai personas" ON ai_personas FOR SELECT USING (auth.role() = 'authenticated');
-- Allow write access to authenticated users (admin panel)
-- CREATE POLICY "Users can insert ai personas" ON ai_personas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Users can update ai personas" ON ai_personas FOR UPDATE USING (auth.role() = 'authenticated');
-- CREATE POLICY "Users can delete ai personas" ON ai_personas FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default CTO persona
INSERT INTO ai_personas (name, system_prompt, is_active) VALUES (
    'CTO Mode',
    'CTO persona placeholder',
    true
) ON CONFLICT (name) DO NOTHING;

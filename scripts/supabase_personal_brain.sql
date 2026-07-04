-- Migration script for Personal Brain (Mocks) -> Supabase
-- Run this in your Supabase SQL Editor

-- 1. Table for Reminders
CREATE TABLE IF NOT EXISTS apex_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    text TEXT NOT NULL,
    due_time TIMESTAMP WITH TIME ZONE NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying reminders efficiently
CREATE INDEX IF NOT EXISTS idx_apex_reminders_email_notified ON apex_reminders (user_email, notified);

-- 2. Table for Lists
CREATE TABLE IF NOT EXISTS apex_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    list_name TEXT NOT NULL,
    item_text TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apex_lists_email_name ON apex_lists (user_email, list_name);

-- 3. Table for AI Control Center Prompts (Item 2 of Master Architecture)
CREATE TABLE IF NOT EXISTS apex_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_key TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    department TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add basic policies (assuming service role will bypass RLS, or authenticated users can read/write their own)
-- Since this is for the CEO/Internal system, we might just allow authenticated access or keep it simple.
-- For local-worker using SERVICE_ROLE, RLS is bypassed.
ALTER TABLE apex_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE apex_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE apex_prompts ENABLE ROW LEVEL SECURITY;

-- Optional: Allow all for now if using anon key in a trusted environment
CREATE POLICY "Enable read access for all" ON apex_reminders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all" ON apex_reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all" ON apex_reminders FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all" ON apex_lists FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all" ON apex_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for all" ON apex_lists FOR DELETE USING (true);

CREATE POLICY "Enable read access for all" ON apex_prompts FOR SELECT USING (true);
CREATE POLICY "Enable update access for all" ON apex_prompts FOR UPDATE USING (true);
CREATE POLICY "Enable insert access for all" ON apex_prompts FOR INSERT WITH CHECK (true);

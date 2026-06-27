-- Migration 0011: Apex Autonomous Agents

CREATE TABLE IF NOT EXISTS public.user_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL, -- 'telegram' or 'whatsapp'
    channel_id TEXT NOT NULL, -- e.g., Telegram chat ID or WhatsApp number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(channel_type, channel_id)
);

CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    raw_message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    response_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies
ALTER TABLE public.user_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Let owners manage their channels and tasks
CREATE POLICY "Users can manage their channels" ON public.user_channels
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their tasks" ON public.agent_tasks
    FOR ALL USING (auth.uid() = user_id);

-- Give service role full access
CREATE POLICY "Service role full access channels" ON public.user_channels
    FOR ALL USING (true);

CREATE POLICY "Service role full access tasks" ON public.agent_tasks
    FOR ALL USING (true);

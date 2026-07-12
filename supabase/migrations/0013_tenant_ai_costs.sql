-- 0013_tenant_ai_costs.sql

CREATE TABLE IF NOT EXISTS public.tenant_ai_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL,
  provider text NOT NULL, -- e.g., 'gemini', 'fal', 'elevenlabs'
  model text NOT NULL,    -- e.g., 'gemini-2.0-flash', 'gemma-2'
  cost_usd numeric NOT NULL,
  tokens_used integer,
  duration_secs integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE public.tenant_ai_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for service role only" ON public.tenant_ai_costs
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for service role only" ON public.tenant_ai_costs
  FOR INSERT
  WITH CHECK (true);

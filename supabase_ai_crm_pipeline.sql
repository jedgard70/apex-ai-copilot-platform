-- =========================================================================
-- APEX AI COPILOT - SUPABASE CRM & SALES AUTOMATION SCHEMA
-- Migration: AI Campaigns and Leads Pipeline
-- =========================================================================

-- Tabela para armazenar as campanhas geradas pela IA (Copys, VSLs, Anúncios)
CREATE TABLE IF NOT EXISTS public.ai_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    campaign_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, active, paused
    vsl_copy TEXT,
    email_sequence JSONB,
    ad_creatives JSONB,
    n8n_webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os leads capturados ou prospectados
CREATE TABLE IF NOT EXISTS public.ai_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    source_campaign_id UUID REFERENCES public.ai_campaigns(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    qualification_score INTEGER DEFAULT 0,
    tags TEXT[],
    n8n_sync_status TEXT DEFAULT 'pending', -- pending, synced, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- RLS (Row Level Security) - Protegendo dados por Workspace
-- =========================================================================
ALTER TABLE public.ai_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for users in workspace (ai_campaigns)"
ON public.ai_campaigns FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = ai_campaigns.workspace_id));

CREATE POLICY "Enable all access for users in workspace (ai_campaigns)"
ON public.ai_campaigns FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = ai_campaigns.workspace_id));

CREATE POLICY "Enable read access for users in workspace (ai_leads)"
ON public.ai_leads FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = ai_leads.workspace_id));

CREATE POLICY "Enable all access for users in workspace (ai_leads)"
ON public.ai_leads FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.workspace_members WHERE workspace_id = ai_leads.workspace_id));

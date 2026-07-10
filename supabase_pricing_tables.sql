-- ==============================================================================
-- APEX AI COPILOT - SUPABASE PRICING & SUBSCRIPTION SCHEMA
-- ==============================================================================
-- Este schema define as tabelas e politicas de acesso (RLS) necessarias
-- para gerenciar os Planos, Tokens, Uso de IA e Billing (Stripe)
-- ==============================================================================

-- 1. Planos e Precos (Sincronizado com Stripe Products)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, -- Ex: "Starter", "Pro", "Enterprise"
  description TEXT,
  monthly_price NUMERIC(10, 2) NOT NULL,
  
  -- Limites do Plano
  token_limit_monthly BIGINT NOT NULL DEFAULT 0,
  max_projects INT NOT NULL DEFAULT 1,
  features JSONB DEFAULT '{}', -- Ex: {"directcut": true, "bim_export": false}
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assinaturas dos Workspaces/Tenants
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- FK para auth.users ou tenants
  pricing_plan_id UUID REFERENCES public.pricing_plans(id),
  
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  
  status TEXT NOT NULL DEFAULT 'incomplete', -- active, past_due, canceled, trialing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Uso de Tokens / Consumo de IA
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID, -- quem acionou a requisicao
  
  provider TEXT NOT NULL, -- gemini, fal, elevenlabs, apex_engine
  model TEXT NOT NULL, -- gemini-1.5-pro, fal-fast-image
  
  action_type TEXT NOT NULL, -- chat, image_generation, tts, bim_analysis
  tokens_used BIGINT NOT NULL DEFAULT 0,
  cost_estimated NUMERIC(10, 6) DEFAULT 0.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Controle de Cota Mensal (Tabela Auxiliar para performance)
CREATE TABLE IF NOT EXISTS public.tenant_quota_current (
  tenant_id UUID PRIMARY KEY,
  billing_cycle_start TIMESTAMPTZ NOT NULL,
  billing_cycle_end TIMESTAMPTZ NOT NULL,
  
  tokens_consumed BIGINT NOT NULL DEFAULT 0,
  images_generated INT NOT NULL DEFAULT 0,
  audio_minutes NUMERIC(8,2) NOT NULL DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON public.ai_usage_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tenant_subs_status ON public.tenant_subscriptions(status);

-- ==============================================================================
-- RLS (Row Level Security) - Protecao dos dados
-- ==============================================================================
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_quota_current ENABLE ROW LEVEL SECURITY;

-- Exemplo: Qualquer pessoa pode ler os planos de preco (Public)
CREATE POLICY "Planos de preco publicos" 
ON public.pricing_plans FOR SELECT 
USING (active = true);

-- Apenas o proprio tenant pode ver sua assinatura
CREATE POLICY "Tenants visualizam propria assinatura"
ON public.tenant_subscriptions FOR SELECT
USING (auth.uid() = tenant_id); -- Ajustar conforme arquitetura de tenant (se multi-user)

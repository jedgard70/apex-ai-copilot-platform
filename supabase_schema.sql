-- Apex Global: Supabase Migration Schema

-- 1. Criação da Tabela de CRM (Leads & Negócios)
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    value NUMERIC(15, 2) DEFAULT 0.00,
    source TEXT DEFAULT 'Manual',
    status TEXT DEFAULT 'leads' CHECK (status IN ('leads', 'negotiation', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) -- Relacionamento com Autenticação
);

-- Habilitar RLS (Row Level Security) para proteger os leads do CRM
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads" 
    ON public.crm_leads FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" 
    ON public.crm_leads FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
    ON public.crm_leads FOR UPDATE 
    USING (auth.uid() = user_id);

-- 2. Criação da Tabela de Logs Financeiros (Cost Tracker)
CREATE TABLE IF NOT EXISTS public.billing_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    cost_usd NUMERIC(10, 5) DEFAULT 0.00000,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.billing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing logs" 
    ON public.billing_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Service Role can insert billing logs" 
    ON public.billing_logs FOR INSERT 
    WITH CHECK (true); -- Permitir que o Backend (Node) insira via chave de serviço

-- 3. Criação da Tabela de Tarefas Assíncronas (Workers/Squads)
CREATE TABLE IF NOT EXISTS public.squad_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    squad_name TEXT NOT NULL,
    goal TEXT NOT NULL,
    skill_path TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.squad_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks" 
    ON public.squad_tasks FOR ALL 
    USING (auth.uid() = user_id);

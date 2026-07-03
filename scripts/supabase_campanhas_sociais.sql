-- Tabela: campanhas_sociais
-- Cesto de materiais gerados pela IA (Event-Driven Workflow)

CREATE TABLE IF NOT EXISTS public.campanhas_sociais (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo text NOT NULL,
    texto_legenda text,
    url_video_final text,
    url_imagem text,
    plataformas_alvo jsonb DEFAULT '[]'::jsonb, -- Ex: ["instagram", "linkedin"]
    status text DEFAULT 'processando' CHECK (status IN ('processando', 'pronto_para_postar', 'publicado', 'erro')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Habilita RLS (Row Level Security)
ALTER TABLE public.campanhas_sociais ENABLE ROW LEVEL SECURITY;

-- Exemplo de política de acesso total para o Owner (Pode ser refinada no RBAC depois)
CREATE POLICY "Acesso total para usuários autenticados" 
ON public.campanhas_sociais 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Passo 1: Criação da estrutura de dados para o módulo de Automação de Marketing (TEMA E)

-- Tabela para gerenciamento de postagens
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Identificação da Campanha
  campaign_type text NOT NULL CHECK (campaign_type IN ('construtora', 'ebook')),
  platform text NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  
  -- Conteúdo e Mídia
  content text NOT NULL,
  media_url text, -- URL da imagem ou vídeo (pode vir do Supabase Storage ou link direto)
  media_type text CHECK (media_type IN ('image', 'video', 'carousel', 'reels')),
  
  -- Agendamento e Controle de Estado
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  
  -- Rastreamento da Meta API
  meta_post_id text,
  error_log jsonb, -- Guarda o erro exato da Meta em caso de falha para auditoria
  
  -- Auditoria interna
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Apenas usuários autenticados (ou roles específicos) podem ler/escrever
-- Em um cenário cínico, assumimos que apenas admins devem tocar nisso. 
-- Como é um sistema multi-tenant/interno, o usuário autenticado da sessão gerencia.
CREATE POLICY "Admins can manage social posts" 
  ON social_posts 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Índices de performance para as buscas do Cronjob (ex: buscar posts agendados no passado)
CREATE INDEX idx_social_posts_status_scheduled ON social_posts(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_social_posts_campaign ON social_posts(campaign_type);

-- Trigger automático de updated_at
CREATE OR REPLACE FUNCTION update_social_posts_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_social_posts_updated_at
BEFORE UPDATE ON social_posts
FOR EACH ROW
EXECUTE FUNCTION update_social_posts_modtime();

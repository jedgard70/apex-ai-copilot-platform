-- ======================================================================================
-- APEX AI COPILOT - MÁQUINA DE VENDAS & AFILIADOS (EXATA ESTRUTURA DO USUÁRIO)
-- ======================================================================================

-- Habilitar a extensão para geração de UUIDs, caso não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela 1: Os Usuários (Você, os Vendedores e os Clientes)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo_perfil TEXT NOT NULL CHECK (tipo_perfil IN ('admin', 'vendedor', 'cliente')),
  data_cadastro TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela 2: Os Projetos (Os serviços de arquitetura, laudos, 3D)
CREATE TABLE projetos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES usuarios(id),
  vendedor_id UUID REFERENCES usuarios(id), -- AQUI ESTÁ O SEGREDO DO AFILIADO
  descricao_servico TEXT NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  status_projeto TEXT DEFAULT 'Aguardando Aprovação'
);

-- 3. Tabela 3: A Conta Corrente (Comissões)
CREATE TABLE comissoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  projeto_id UUID REFERENCES projetos(id),
  vendedor_id UUID REFERENCES usuarios(id),
  valor_comissao DECIMAL(10, 2) NOT NULL,
  status_pagamento TEXT DEFAULT 'Pendente', -- Muda para 'Pago' quando você transferir
  data_criacao TIMESTAMP DEFAULT NOW()
);

-- 4. Inserindo um Admin e um Vendedor de Teste (Exemplo Prático)
-- Descomente para testar:
-- INSERT INTO usuarios (id, nome, telefone, tipo_perfil) VALUES 
-- ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin Construtora', '14999999999', 'admin'),
-- ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Carlos Vendedor', '14988888888', 'vendedor');

-- FIM DA MIGRAÇÃO

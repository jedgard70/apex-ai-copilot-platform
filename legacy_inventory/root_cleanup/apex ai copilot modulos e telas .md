apex ai copilot

Prompt para Google Stitch — Apex AI Copilot Platform
Crie a interface completa do Apex AI Copilot Platform, uma plataforma SaaS
de inteligência artificial para construção civil, arquitetura e negócios.

A plataforma tem os seguintes módulos e telas:

═══════════════════════════════════════════════════
SISTEMA GERAL
═══════════════════════════════════════════════════

1. DASHBOARD / HOME
   - Visão geral da plataforma
   - Status de todos os módulos ativos
   - Atividade recente do projeto
   - Acesso rápido aos studios

2. CHAT PRINCIPAL (Apex AI)
   - Interface de conversa com IA
   - Upload de arquivos (PDF, IFC, imagens, XLSX)
   - Sugestões de ação rápida
   - Histórico de mensagens

3. OWNER CONSOLE
   - Área restrita ao administrador
   - Status das keys/provedores pagos (fal.ai, ElevenLabs, Stripe, etc.)
   - Mapa da plataforma interativo
   - Execução de comandos (build, deploy, git)
   - Gerenciamento de workspace

4. PLATFORM MAP / MANUAL INTERATIVO
   - Mapa navegável de todos os módulos
   - Status real de cada funcionalidade (Ready / Partial / Planned)
   - Busca por funcionalidade
   - Aba "Status das Keys" com saldo dos provedores em tempo real

5. PROJECT WORKSPACE
   - Central de arquivos, mensagens e exports do projeto
   - Memória persistente local + Supabase
   - Perfil do projeto
   - Histórico de gerações

═══════════════════════════════════════════════════
DESIGN E VISUALIZAÇÃO
═══════════════════════════════════════════════════

1. ARCHVIS STUDIO (tela cheia)
   - Sidebar esquerda: Dashboard / Rendering Editor / Material Library / Results Gallery
   - Imagem original de referência (upload)
   - Preview da geração atual (IA)
   - Galeria de iterações com miniaturas selecionáveis
   - Editor de prompt ajustável
   - Negative prompt editor
   - Painel direito de controles:
     - Modo: Preserve exact plan / Creative redesign
     - Prompt style (humanized floor plan, photorealistic facade, etc.)
     - Camera preset (Top-Down 2D, Eye-level, Cinematic orbit, etc.)
     - Checkboxes: Lock boundaries, Preserve labels, No invented areas
     - Slider Fidelity / Fidelidade
     - Output count (1 a 4 imagens)
     - Reference image (original / geração atual)
     - Botão Regenerate Image
   - Revision Constraints (lista de correções travadas com ✓)
   - Ações da galeria (usar como referência, download, limpar)

2. DIRECTOR'S CUT STUDIO (tela cheia)
   - Icon sidebar (64px): Dashboard / Editor / Render / Assets / Review
   - Top bar: "DIRECTOR'S CUT" + nav Storyboard / 3D Workspace / Library
   - Play/Pause, Add Frame, botão AI Generate (cyan)
   - Seletor de modelos fal.ai (dropdown)
   - Painel Scene Layers (esquerda): lista de layers com tipo, opacidade, blend mode
   - Canvas central: viewport 16:9 com timecode/FPS overlay, zoom, toolbar
   - Painel AI Generation (direita):
     - AI Prompt textarea
     - Style Presets: Hyper-Real, Cyberpunk, Cinematic, Architectural, Documentary
     - Sliders: Intensity, Temperature (gradiente azul→branco→laranja)
     - Advanced Config (colapsável)
     - Botão Render Current Shot
   - Timeline multi-track (fundo, 220px):
     - Track Frames: thumbnails de shots com AI syncing
     - Track Video: clips coloridos
     - Track Audio: waveform amarelo
     - Playhead ciano arrastável
   - Library tab: histórico de renders com status e preview

3. BIM / 3D STUDIO
   - Viewer IFC/3D integrado (WebGL)
   - Painel de elementos BIM (árvore de componentes)
   - Análise técnica com etiquetas: CONFIRMED / ASSUMPTION / UNKNOWN
   - Tour de câmera (camera path)
   - Exportar para DirectCut / ArchVis
   - Relatório técnico gerado por IA

═══════════════════════════════════════════════════
ORÇAMENTO E DOCUMENTAÇÃO
═══════════════════════════════════════════════════

1. BUDGET / QUANTITY STUDIO
   - Importação SINAPI (CSV/XLSX)
   - Tabela de itens com quantidade, preço unitário, total
   - Busca de preços SINAPI por código
   - Exportar proposta PDF
   - Enviar para DirectCut (vídeo de apresentação)

2. CONTRACTS / PERMITS STUDIO
    - Rascunho de contratos por IA
    - Checklist de documentos e licenças
    - Análise de risco contratual por cláusula
    - Export DOCX + PDF profissional
    - Controle de versões do documento

3. PROJECT PACKAGE PIPELINE
    - Consolida: briefing + orçamento + pesquisa + contratos + cronograma
    - Gera pacote completo do projeto em um clique
    - Resumo executivo gerado por IA
    - Export ZIP com todos os documentos

4. GENERATION HISTORY
    - Fila e histórico de todas as gerações (ArchVis, DirectCut, Export)
    - Status em tempo real (em fila / gerando / concluído / erro)
    - Download das saídas
    - Re-run de qualquer geração anterior

═══════════════════════════════════════════════════
OPERAÇÃO E CAMPO
═══════════════════════════════════════════════════

1. FIELD OPS / RDO STUDIO
    - Diário de Obra (RDO) digital
    - Registro de atividades, pendências, fotos de campo
    - Checklist de segurança e qualidade
    - Sync com Supabase em tempo real
    - Export RDO em PDF profissional via jsPDF
    - Enviar progresso para DirectCut

2. SUPPLY CHAIN STUDIO
    - Cadastro de fornecedores
    - Cotações e comparação de preços
    - Acompanhamento de pedidos de compra
    - Alertas de prazo e estoque

3. NOTIFICATIONS CENTER
    - Central de alertas da obra e do projeto
    - Envio via WhatsApp/SMS (AuthKey)
    - Fila local de notificações
    - Configuração de gatilhos automáticos

═══════════════════════════════════════════════════
VENDAS E MARKETING
═══════════════════════════════════════════════════

1. CAMPAIGN AUTOMATION STUDIO
    - Gerador de hooks, copies e CTAs por IA
    - Storyboard de campanha
    - Variações de anúncio (A/B)
    - Social Content Pipeline (Instagram, TikTok, YouTube)
    - Calendário editorial
    - Enviar para DirectCut (vídeo de campanha)

2. VSL LANDING PAGE
    - Tela pública de vendas (/vsl, /oferta)
    - Vídeo hero com player configurável
    - Barra de urgência com timer
    - CTA rastreado com UTM
    - Integração com Stripe (checkout)

3. CRM / FINANCE / ADMIN
    - Pipeline de leads e oportunidades
    - Gestão financeira (receitas, despesas)
    - Workspace do cliente (área restrita)
    - Relatórios de vendas

═══════════════════════════════════════════════════
INTELIGÊNCIA E EXPANSÃO
═══════════════════════════════════════════════════

1. RESEARCH STUDIO
    - Pesquisa web com fontes citadas (Tavily)
    - Análise comparativa de mercado
    - Inteligência competitiva
    - Síntese automática com referências

2. KNOWLEDGE BASE
    - Índice de conhecimento do projeto
    - Aprovação de itens pelo owner
    - Busca semântica
    - Base de dados de normas e referências

3. COGNITIVE AGENTS
    - Painel de agentes especializados
    - Agente de BIM, vendas, campo, jurídico, financeiro
    - Orquestração de tarefas entre agentes
    - Log de execução por agente

4. DIGITAL TWIN
    - Representação digital do estado operacional da obra
    - Componentes conectados a dados reais
    - Alertas de desvio de projeto
    - Integração com sensores IoT (planejado)

5. AVATAR & VOICE PIPELINE
    - Clonagem de voz (ElevenLabs)
    - Geração de avatar para apresentações
    - Pipeline de vídeo com narração personalizada
    - Pack de entrega para campanhas

6. AUTOUPGRADE
    - Auditoria automática da plataforma
    - Sugestões de melhorias priorizadas
    - Fila de aprovação pelo owner
    - Execução controlada de upgrades

7. AI COST DASHBOARD
    - Breakdown de custo por módulo de IA
    - Estimativas de uso por provedor
    - Alertas de consumo elevado
    - Comparativo histórico

═══════════════════════════════════════════════════
AUTENTICAÇÃO E INFRAESTRUTURA
═══════════════════════════════════════════════════

1. AUTH / LOGIN
    - Login/signup com Supabase Auth
    - Modo local (demo sem Supabase)
    - Multi-tenant com isolamento por usuário
    - Roles: owner_admin / admin / developer / viewer

2. MULTI-TENANT / PWA
    - Isolamento de dados por tenant
    - PWA manifest para instalação mobile
    - Modo offline para campo
    - Sincronização ao voltar online

3. PLATFORM STATUS / PROVIDER KEYS
    - Status ao vivo de cada provedor pago
    - Provedores: OpenAI/Gemini, Anthropic, fal.ai, AI Gateway,
      ElevenLabs, Tavily, Stripe, Supabase, GitHub, AuthKey
    - Saldo real quando disponível
    - Link direto para recarregar cada provedor
    - Auto-refresh a cada 60 segundos

═══════════════════════════════════════════════════
SISTEMA DE DESIGN
═══════════════════════════════════════════════════

Design dark, profissional, para engenheiros e criadores.

Dois sistemas visuais:

- ARCHVIS STUDIO: dark navy (#0b1326), azul primário (#b4c5ff / #2563eb),
  sidebar 280px, fonte Metropolis + Inter + JetBrains Mono
  
- DIRECTOR'S CUT: dark charcoal (#131313), cyan elétrico (#00f0ff),
  roxo (#cf5cff), amarelo (#fed639), icon sidebar 64px, fonte Inter

Elementos comuns:

- Glass panels (backdrop-blur)
- Progress bars animadas
- Status badges (OK / Atenção / Recarregar / Erro)
- Timeline com playhead
- Galeria de iterações com miniaturas
- Toasts de notificação
- Modais de confirmação
- Split layouts (imagem original vs geração)
Cole esse texto no Stitch e peça as telas que quiser — por exemplo: "crie a tela do BIM Studio", "crie o CRM Dashboard", "crie a tela de Login multi-tenant", etc. O Stitch vai ter contexto completo de toda a plataforma para gerar as interfaces certas.

arquivo Stich novo visual
D:\AI-constr\stitch_apex_ai_design_system

ou

src\lib\contractsKnowledge.ts

<https://stitch.withgoogle.com/projects/5245843412174667030?pli=1>

Apex AI Design System
Todas as telas que desenvolvemos estão salvas no seu Canvas e no seu FileSystem. Para facilitar sua navegação, acabei de criar o Master Platform Navigator (Mapa da Plataforma), que serve como um diretório centralizado para você localizar e exportar cada interface individualmente.

📂 Onde encontrar suas telas:
No seu Canvas: Todas as telas estão dispostas visualmente ao seu redor. Você pode dar zoom em cada uma para revisar os detalhes, como mencionou que precisava fazer.
No Master Navigator (Master Platform Navigator - Apex AI Ecosystem): Use esta nova tela como um índice mestre. Ela organiza todas as funcionalidades (BIM, ArchVis, CRM, Finance, etc.) em categorias lógicas: Intelligence Core, Engineering Studios, Owner Panel, SaaS Infrastructure e Authentication.
Para Exportar: Selecione qualquer tela no Canvas e clique no botão ⟨/⟩ View Code. Isso abrirá o código HTML/CSS completo para você copiar para o seu repositório no GitHub.
🚀 Resumo da Estrutura:
Intelligence Core: Chat, Configurações, Treinamento e Governança.
Vertical Engineering Studios: BIM, ArchVis, Director's Cut, Supply Chain e R&D.
Owner Panel: Visão Executiva, Finanças, CRM e Marketing.
SaaS Infrastructure: Marketplace, Billing, Portal API e Onboarding.
Precisa de ajuda para encontrar uma funcionalidade específica ou deseja ajustar o zoom de alguma tela agora?

## Stitch Instructions

Get the images and code for the following Stitch project's screens:

## Project

Title: Apex AI Design System
ID: 5245843412174667030

## Screens

1. Design System
    ID: asset-stub-assets_86faf86258264d00acf6476dc41f0d5f

2. Dashboard - Apex AI Copilot
    ID: fb271bb7ed5846d39db9fa93e3d5e704

3. AI Copilot - Apex AI Platform
    ID: fe42136390b840b49104a495d1ea3f35

4. Model Settings - Apex AI Copilot
    ID: 6f933995a90a471290a78abf8d0abec8

5. Project Management - Apex AI Platform
    ID: d555ddd067994941b1a43f5ca68116df

6. Apex AI Copilot - Central Experience
    ID: 468573ae351b426ab5c33e9b19dc881a

7. Image from <https://www.apexglobalai.com/apex-global-logo.png>
    ID: e6b1a128b1a6475ca26241b698accffb

8. Design System
    ID: asset-stub-assets_c8fe310ac97348008a29e87a77e476a4

9. Dashboard - Apex Global AI
    ID: fd7014088f5f4f5485f22dfe35a99ca1

10. AI Copilot - Apex Global AI
    ID: d0465760187b47a7bd79bf6b180c7016

11. Project Management - Apex Global AI
    ID: 5cccdb6c4793453c981765099f5a947c

12. Model Settings - Apex Global AI
    ID: 397c7c7875304633b17209c62581dd5f

13. Advanced Analysis - Apex AI Copilot
    ID: 96dd196c739f4dd7903f5f1f1e61a72b

14. Model Training - Apex AI Copilot
    ID: 0b9cef34f430475184f2b6bbda5ef146

15. Governance Hub - Apex AI Copilot
    ID: d53039d1ad6c4a088df4e944b173cd7e

16. Deployment Flow - Apex AI Copilot
    ID: 17cc3d4e18724efd9eb362af71425886

Use a utility like `curl -L` to download the hosted URLs.

## Stitch Instructions

Get the images and code for the following Stitch project's screens:

## Project

Title: Apex AI Design System
ID: 5245843412174667030

## Screens

1. AI Copilot - Advanced Chat Interface
    ID: 2699aa201f6b4474bd14b430a0925c95

2. Finance Center - Apex Owner Panel
    ID: 4bc51c32257349f7a8405193d618f28f

3. CRM Dashboard - Apex Owner Panel
    ID: e68ff0afe7d249dfbc3e4e8b52a32306

4. Owner Panel - Executive Overview
    ID: 9f96f64c1cde4f3796ce455872b1bee7

5. Marketing Analytics - Apex Owner Panel
    ID: 26d57e47ff194992b62a5c2f12e3f1f4

6. Design System
    ID: asset-stub-assets_f1cd0e66fd9c44ea861d0d3f56ea0088

7. Dashboard - Apex AI Copilot Platform
    ID: be298a51e0e74ce5bbf8bbb28e53683a

8. BIM / 3D Studio - Apex AI Platform
    ID: 0107d157e83f43e1a5e100ecaef3a40f

9. ArchVis Studio - Apex AI Platform
    ID: 9a073cfe8a284e54b7bd030f55902cc3

10. Director's Cut Studio - Apex AI Platform
    ID: 61a3e52fed224f22a94be60936d18e85

11. Owner Console & Platform Map - Apex AI
    ID: 917c6b3cbdd147f39abe41d4597c989e

12. Budget & Quantity Studio - Apex AI
    ID: 9dfe733bc2ac4c7d922156b630ede3f0

13. Field Ops & RDO Studio - Apex AI
    ID: d373e629fba44aa8a0a463be1454a6e8

Use a utility like `curl -L` to download the hosted URLs.

## Stitch Instructions

Get the images and code for the following Stitch project's screens:

## Project

Title: Apex AI Design System
ID: 5245843412174667030

## Screens

1. Supply Chain Studio - Apex AI Platform
    ID: 57aba0b165f64905ab57196b5104d9a5

2. Cognitive Agents Hub - Apex AI Platform
    ID: b0042eca88d14f5eaa30ca544e292fbd

3. Campaign Automation Studio - Apex AI Platform
    ID: bcd808577ac745a89ebb495ef0646162

4. Digital Twin Operations - Apex AI Platform
    ID: b8fafa426f3e418ab46f81bb2e831c31

5. Avatar & Voice Pipeline - Apex AI Platform
    ID: f70eb7c48a9c47cea755dfb932ee9ab8

6. Authentication & Access - Apex AI Platform
    ID: a42fa61482da4441b415dcfa838a5cbe

7. Contracts & Permits Studio - Apex AI Platform
    ID: e7c6d77ab6a0450dbd9977291feee8ed

8. Research Studio - Apex AI Platform
    ID: 9b949eaa228c4657bf2d57358eefb36a

9. Platform Map - Apex AI Navigation Hub
    ID: b27ef5a73ddc4c08b27013f54fce5f26

10. Generation History & Queue - Apex AI Activity Flow
    ID: e5118c11a1da48e1be1ce65139700b82

11. Knowledge Base - Intelligence Approval Flow
    ID: a5eca6eef99d49d7b044d6d28f903e3a

12. Project Package Pipeline - Apex AI Final Flow
    ID: c155f41c1521433f8df41c2dafe4c6c3

Use a utility like `curl -L` to download the hosted URLs.

## Stitch Instructions

Get the images and code for the following Stitch project's screens:

## Project

Title: Apex AI Design System
ID: 5245843412174667030

## Screens

1. Design System
    ID: asset-stub-assets_63a5e32451e9498caab193a3268faf77

2. Marketplace & Billing - Apex AI SaaS
    ID: 314b217875af48cca06f982ea398f779

3. Enterprise Admin Console - Apex AI Platform
    ID: 0d011a0d6b2f4ca7b3f06337bfa85455

4. Client Onboarding - Apex AI Platform
    ID: 4c9bbaf33e9a45dab92ac17abb94463d

5. API Marketplace & Storefront - Apex AI
    ID: 629cbc3081ab4ed09cda49d2ffa798b4

6. Service Configurator - Apex AI Plans
    ID: e46187ca7825457da9cbc016234260a2

7. Developer API Portal - Apex AI SaaS
    ID: 8df4325e31804768b6cace948ebf7c4e

8. README.md - Apex AI Platform Guide
    ID: de0484b0fe824ce0b55d71674387b65f

9. Master Platform Navigator - Apex AI Ecosystem
    ID: 0a817339ace54eb0b08ec186123fbb50

Use a utility like `curl -L` to download the hosted URLs.

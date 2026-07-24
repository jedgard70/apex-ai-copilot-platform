# Apex OS — Release Master Plan Checklist (Texto Legível)

- **Versão:** 2.1.0 (Com as 3 Emendas Canônicas do Owner)
- **Status:** Aprovado pelo Owner
- **Data:** 2026-07-22
- **Empresa:** Apex Global
- **Plataforma:** Apex OS
- **Documento de Origem:** [APEX_RELEASE_MASTER_PLAN.md](file:///d:/AI-constr/apex-os/docs/canonical/APEX_RELEASE_MASTER_PLAN.md)

---

## 1. Matriz de Aprovação Prévia de UX & Painéis (Preview Gate Ampliado)

> [!IMPORTANT]
> **Regra do Gate Visual Ampliado (Fase E15)**: Nenhuma interface visual — seja **Tela, Dashboard, Landing Page, Workflow, Prompt Visual, Capability UI, Studio, Página ou Wizard** — será integrada ao Apex OS sem que um preview de alta fidelidade seja gerado e aprovado pelo Owner.

| # | Painel / Tela UX | Origem do Acervo | Status de Progresso | Preview Aprovado | Integrado | Capability | Owner |
| :-: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **01** | Mission Control / BuildTrack HQ | `Downloads/ui_mission_control_*.png` | `DISCOVERED` | NÃO | NÃO | `CORE-14` / `ENG-06` | Jedgard |
| **02** | Dashboard Executivo V1 / V2 | `stitch_apex_intelligence_design_system` (87 PNGs) | `INVENTORIED` | NÃO | PARCIAL | `CORE-14` / `BI-01` | Jedgard |
| **03** | Intelligence Core / V8 Command Center | `stitch_apex_intelligence_design_system` | `DISCOVERED` | NÃO | NÃO | `AI-04` / `CORE-14` | Jedgard |
| **04** | BIM Intelligence / BIM-Ops | `public/pillars` (170 imagens) + Stitch | `INVENTORIED` | NÃO | NÃO | `ENG-02` / `ENG-04` | Jedgard |
| **05** | CRM / Marketing / Redes Sociais | `public/pillars` + Stitch | `INVENTORIED` | NÃO | NÃO | `GROWTH-01` | Jedgard |
| **06** | Orçamento / SINAPI | `public/pillars` + Stitch | `INVENTORIED` | NÃO | NÃO | `ENG-11` | Jedgard |
| **07** | RDO / Diário de Obra | `public/pillars` + Stitch | `INVENTORIED` | NÃO | NÃO | `ENG-09` | Jedgard |
| **08** | Jurídico / Legal | `public/pillars` + Stitch | `INVENTORIED` | NÃO | NÃO | `LEGAL-01` | Jedgard |
| **09** | ArchVis Studio | `public/pillars` + Stitch | `INTEGRATED` | NÃO | PARCIAL | `ENG-01` | Jedgard |
| **10** | Agentes Cognitivos | `public/pillars` + Stitch | `INVENTORIED` | NÃO | NÃO | `AI-14` | Jedgard |
| **11** | Digital Twin / IoT | `public/pillars` + Stitch | `INVENTORIED` | NÃO | PARCIAL | `ENG-06` / `ENG-07` | Jedgard |
| **12** | Gestão de Projetos | `public/pillars` + Stitch | `INTEGRATED` | NÃO | PARCIAL | `CORE-04` | Jedgard |
| **13** | Gestão de Usuários e Permissões | `stitch` (18 telas Admin) | `INVENTORIED` | NÃO | PARCIAL | `CORE-03` / `CORE-14` | Jedgard |
| **14** | Financeiro / BI Executivo | `public/pillars` + Stitch | `INVENTORIED` | NÃO | PARCIAL | `FIN-01` | Jedgard |

---

## 2. Roteiro Numérico de Execução Sequencial (Checklist Operacional)

### Estados de Progresso Canônicos
`NOT_STARTED` → `DISCOVERED` → `INVENTORIED` → `CANONICAL` → `MIGRATED` → `INTEGRATED` → `VALIDATED` → `OWNER_APPROVED` → `COMPLETE`

---

### Fase E0 — Congelamento & Baseline Tecnológico
- [x] **01.** `[COMPLETE]` Mapear e reconciliar o estado do repositório `D:\AI-constr\apex-os` (`git status`, untracked files).
- [x] **02.** `[COMPLETE]` Confirmar aplicação oficial na porta `3010` e eliminar conflitos com portas 3000/3001.
- [x] **03.** `[COMPLETE]` Executar validação técnica inicial (`npm run validate` — 52 testes verdes).

### Fase E1 — Planejamento Canônico e Unicidade Documental
- [x] **04.** `[COMPLETE]` Consolidar a hierarquia canônica em `MASTER_ROADMAP.md` e `APEX_RELEASE_MASTER_PLAN.md`.
- [x] **05.** `[COMPLETE]` Anexar as 3 Emendas Canônicas do Owner (Patrimônio Total, Canonicalização, Estados Granulares).

### Fase E2 — Inventário Global de Todo o Patrimônio Técnico
- [x] **06.** `[INVENTORIED]` [E2.1] Inventariar código, módulos e ativos do Apex OS (`D:\AI-constr\apex-os` — 587 arquivos).
- [x] **07.** `[INVENTORIED]` [E2.2] Inventariar ativos do Apex AI Copilot Platform (`D:\AI-constr\apex-ai-copilot-platform` — 2.609 arquivos).
- [x] **08.** `[INVENTORIED]` [E2.3] Inventariar ativos da AI Construction Intelligence Platform (`D:\AI-PLATAFORM\...` — 1.865 arquivos).
- [x] **09.** `[INVENTORIED]` [E2.4] Mapear todos os repositórios Git locais da máquina (3 Repos).
- [x] **10.** `[INVENTORIED]` [E2.5] Auditar repositórios remotos do GitHub (`jedgard70/*` — 3 Remotes).
- [x] **11.** `[INVENTORIED]` [E2.6] Varrer todos os HDs, SSDs e volumes montados em busca de legados Apex (Discos C: e D:).
- [x] **12.** `[INVENTORIED]` [E2.7] Ingerir e classificar ativos no diretório Downloads (`ui_mission_control_*.png` — 71 arquivos).
- [x] **13.** `[INVENTORIED]` [E2.8] Mapear cache interno do Antigravity (`C:\Users\apexg\.gemini\antigravity\brain` — 1.096 arquivos).
- [x] **14.** `[INVENTORIED]` [E2.9] Mapear cache interno do Gemini (`C:\Users\apexg\.gemini\config` — 234 arquivos).
- [x] **15.** `[INVENTORIED]` [E2.10] Catalogar 87 previews e HTMLs em `stitch_apex_intelligence_design_system` (182 arquivos).
- [x] **16.** `[INVENTORIED]` [E2.11] Inventariar acervos de Prompts e Engenharia de Prompts (12 Catalogados).
- [x] **17.** `[INVENTORIED]` [E2.12] Catalogar 116 arquivos `SKILL.md` brutos com deduplicação (113 Hashes Únicos).
- [x] **18.** `[INVENTORIED]` [E2.13] Inventariar Agentes, Personas e Registries de Agentes (15 Personas).
- [x] **19.** `[INVENTORIED]` [E2.14] Catalogar Workflows, Automações e Dutos de Execução (8 Workflows).
- [x] **20.** `[INVENTORIED]` [E2.15] Catalogar Servidores MCP e Ferramentas Registradas (4 Servidores).
- [x] **21.** `[INVENTORIED]` [E2.16] Mapear 634 APIs legadas e rotas server (`/api/*`, `/v1/*`, `server.ts`).
- [x] **22.** `[INVENTORIED]` [E2.17] Inventariar Templates, Snippets e Facades (25 Templates).
- [x] **23.** `[INVENTORIED]` [E2.18] Catalogar 610 Imagens, Mídias e 14 Painéis Candidatos.
- [x] **24.** `[INVENTORIED]` [E2.19] Mapear 211 componentes React / TSX do ecossistema.
- [x] **25.** `[INVENTORIED]` [E2.20] Catalogar Bibliotecas Internas e Módulos Compartilhados (12 Módulos).

### Fase E2A — Canonicalização 1:1 de Produtos Independentes (E2A REABERTA)
- [/] **26.** `[IN_PROGRESS]` Executar o mapeamento 1:1 de 100% dos módulos do ACIP Master para 23 Produtos Independentes com painéis segregados (Matriz em `APEX_FULL_ACIP_PANEL_MATRIX.md`).
- [/] **27.** `[IN_PROGRESS]` Gerar o Catálogo de Produtos Independentes em PDF (`APEX_PRODUCTS_PANEL_CATALOG.pdf`) e Markdown (`APEX_PRODUCTS_PANEL_CATALOG.md`) sem junções de produtos (ex: Apex Accounting e Apex Finance mantidos 100% segregados).

### Fase E2A.1 — Catálogo Visual Completo de Famílias de Painéis
- [x] **28.** `[COMPLETE]` Gerar o Catálogo Visual de Famílias de Painéis em Markdown (`APEX_PANEL_FAMILIES_CATALOG.md`) e PDF (`APEX_PANEL_FAMILIES_CATALOG.pdf`) cobrindo as 15 famílias do produto com seus candidatos lado a lado.
- [ ] **29.** `[NOT_STARTED]` Submeter a homologação das 15 famílias de painéis ao Owner no STOP GATE antes de qualquer migração física.

### Fase E3 — Core Persistente e Modelagem de Dados
- [ ] **28.** `[NOT_STARTED]` Implementar repositório persistente de Identities e Organizações no Supabase PostgreSQL.
- [ ] **29.** `[NOT_STARTED]` Migrar sessões em memória (`Map`) para tabela persistente de sessões com expiração.
- [ ] **30.** `[NOT_STARTED]` Aplicar e testar Row-Level Security (RLS) para tenant isolation estrito.

### Fase E4 — Autenticação Internacional e Segurança
- [x] **31.** `[COMPLETE]` Garantir política fail-closed (HTTP 401) ao falhar Supabase Auth sem fallback para OWNER.
- [x] **32.** `[COMPLETE]` Configurar trava `ENABLE_LEGACY_AUTH=false` com aborto em produção (`NODE_ENV=production`).
- [ ] **33.** `[NOT_STARTED]` Executar teste E2E do fluxo de Magic Link com e-mail real e validação do Owner no STOP GATE.

### Fase E5 — Comercial & Persistência de Pedidos
- [x] **34.** `[COMPLETE]` Atualizar catálogo comercial em BRL (R$ 497, R$ 1.497, A partir de R$ 4.990 com "Solicitar proposta").
- [x] **35.** `[COMPLETE]` Criar estrutura de preços internacionais para USD (US$ 149 / US$ 449 / US$ 1.490) e EUR.
- [ ] **36.** `[NOT_STARTED]` Conectar webhook assinado do Stripe com verificação de assinatura e idempotência em banco.

### Fase E6 — Intelligent Intake & Pipeline PDF
- [ ] **37.** `[NOT_STARTED]` Implementar motor de intake multipart para suporte a PDF, DWG, DXF, IFC e RVT.
- [ ] **38.** `[NOT_STARTED]` Construir pipeline de PDF com detecção vetorial/raster, extração de texto, render de páginas e segmentação de vistas.
- [ ] **39.** `[NOT_STARTED]` Implementar interface de confirmação humana para seleção da vista de engenharia (planta, corte, fachada).

### Fase E7 — Custódia Soberana e Storage de Arquivos
- [ ] **40.** `[NOT_STARTED]` Substituir armazenamento local temporário por Object Storage durável com URLs assinadas expiráveis.
- [ ] **41.** `[NOT_STARTED]` Implementar controle de retenção de ativos e exclusão revogável com log de auditoria.

### Fase E8 — Governança de Provedores de IA
- [x] **42.** `[COMPLETE]` Manter adapter contratual da fal.ai com mascaramento de chave (`FAL_KEY`) e zero retenção (`X-Fal-Store-IO: 0`).
- [ ] **43.** `[NOT_STARTED]` Registrar métricas de tempo, custo e token em tabela imutável `UsageLedger`.

### Fase E9 — ArchVis Studio Produção
- [ ] **44.** `[NOT_STARTED]` Integrar fluxo completo: PDF/Imagem → Segmentação → Briefing Guiado → Geração → Quality Gate → Download ZIP.
- [ ] **45.** `[NOT_STARTED]` Testar preservação de proporção geométrica e zoom interativo antes/depois.

### Fase E10 — Engineering Suite (ENG-01 a ENG-20)
- [ ] **46.** `[NOT_STARTED]` [ENG-02] Conectar BIM/3D Viewer com suporte a arquivos IFC e árvore de elementos.
- [ ] **47.** `[NOT_STARTED]` [ENG-06] Conectar Digital Twin com modelo 3D persistente e dados operacionais.
- [ ] **48.** `[NOT_STARTED]` [ENG-09] Conectar Diário de Obra (RDO) com registro de clima, fotos e assinatura digital.
- [ ] **49.** `[NOT_STARTED]` [ENG-11] Conectar módulo de Orçamentos com tabela SINAPI e curva ABC.
- [ ] **50.** `[NOT_STARTED]` [ENG-12] Conectar Cronograma Físico-Financeiro (EVM) com integração MS Project.

### Fase E11 — Accounting e Legal Verticais
- [ ] **51.** `[NOT_STARTED]` Auditar e estabelecer contrato de integração REST/Eventos com o produto Apex Accounting.
- [ ] **52.** `[NOT_STARTED]` Implementar módulo de conformidade jurídica com citações normativas e disclaimers.

### Fase E12 — Growth, Vendas e Atendimento
- [ ] **53.** `[NOT_STARTED]` Conectar CRM Comercial com pipeline de vendas e atribuição de leads.
- [ ] **54.** `[NOT_STARTED]` Conectar páginas VSL e webhook Hotmart para produtos digitais.

### Fase E13 — Studio Multimídia & Vídeo
- [ ] **55.** `[NOT_STARTED]` Integrar Director's Cut para geração de vídeos e ElevenLabs para narração.

### Fase E14 — Admin e Operações
- [ ] **56.** `[NOT_STARTED]` Consolidar as 18 telas de administração Stitch em um painel único de gestão RBAC.

### Fase E15 — UX & Preview Gate (Telas, Dashboards, Wizards, Studios)
- [ ] **57.** `[NOT_STARTED]` Apresentar preview de alta fidelidade para cada elemento de interface e 14 painéis candidatos.
- [ ] **58.** `[NOT_STARTED]` Obter aprovação explícita do Owner antes da integração de qualquer tela no Apex OS.

### Fase E16 — Internacionalização (i18n & Compliance)
- [ ] **59.** `[NOT_STARTED]` Validar dicionários i18n em Português (pt-BR), Inglês (en-US) e Espanhol (es).
- [ ] **60.** `[NOT_STARTED]` Garantir conformidade com LGPD (Brasil) e GDPR (Europa) com consentimento e política de privacidade.

### Fase E17 — Segurança, Resiliência e Stress Test
- [ ] **61.** `[NOT_STARTED]` Realizar varredura SAST, verificação de segredos e teste de carga (Load Test).
- [ ] **62.** `[NOT_STARTED]` Testar procedimentos de backup e restore local/staging.

### Fase E18 — CI/CD e Ambientes
- [ ] **63.** `[NOT_STARTED]` Configurar pipeline imutável: Typecheck → Lint → Tests → Build → Migration Dry Run → Staging Deploy.

### Fase E19 — Homologação Operacional
- [ ] **64.** `[NOT_STARTED]` Conduzir testes manuais de homologação com matriz de personas (Owner, Engenheiro, Contador, Jurídico).

### Fase E20 — Piloto Fechado
- [ ] **65.** `[NOT_STARTED]` Executar piloto fechado com organizações selecionadas e acompanhamento diário de custos.

### Fase E21 — Lançamento Internacional
- [ ] **66.** `[NOT_STARTED]` Validar critérios finais de publicação e obter assinatura do Owner no Gate `APEX ECOSYSTEM RELEASE READY`.

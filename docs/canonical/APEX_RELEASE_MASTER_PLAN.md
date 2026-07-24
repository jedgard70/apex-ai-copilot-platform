# Apex Release Master Plan — Operational Execution Checklist

- **Versão:** 2.1.0
- **Status:** Aprovado pelo Owner (com 3 Emendas de Consolidação)
- **Data:** 2026-07-22
- **Empresa:** Apex Global
- **Plataforma:** Apex OS
- **Documento Mestre:** [MASTER_ROADMAP.md](../../roadmap/MASTER_ROADMAP.md)

---

## 1. Visão Geral dos Release Trains (Fases E0 a E21)

O Planejamento de Execução é a derivação operacional direta do Planejamento Mestre. Nenhum item entra na fila de execução sem constar no Mestre, e nenhum item é marcado como concluído sem testes e evidências executáveis.

```text
E0 (Baseline) → E1 (Canônico) → E2 (Inventário) → E2A (Canonicalização) → E2B (Preview & Homologação Visual)
→ E2C (Migração Física) → E2D (Integração de Capabilities) → E2E (Limpeza) → E3 (Core Persistente)
→ E4 (Auth) → E5 (Comercial) → E6 (Intake Multi-formato) → E7 (Storage) → E8 (Providers) → E9 (ArchVis)
→ E10 (Engineering) → E11 (Accounting/Legal) → E12 (Growth) → E13 (Studio) → E14 (Admin/Ops)
→ E15 (UX Gate) → E16 (i18n) → E17 (Segurança) → E18 (CI/CD) → E19 (Homologação) → E20 (Piloto) → E21 (Release)
```

---

## 2. Matriz de Progresso dos Estados Canônicos

Todo item e capability do ecossistema evolui obrigatoriamente através dos seguintes 9 estados:

```text
NOT_STARTED → DISCOVERED → INVENTORIED → CANONICAL → PREVIEW_READY → MIGRATED → INTEGRATED → OWNER_APPROVED → COMPLETE
```

---

## 3. Linha de Base Canônica & Protocolo de Homologação (Screen-by-Screen)

> [!IMPORTANT]
> **Linha de Base Histórica Inviolável**: 43 Módulos Reais e 260 Agentes.
> **Expansão Auditada Consolidada**: 78 Módulos Registrados, 23 Produtos Especializados Segregados, 7 Studios Canônicos, 4.114 Skills Físicas (`SKILL.md`), 634 Handlers de API, 211 Componentes React, 112 Telas HTML e 610 Mídias Visuais.
> 
> **Regra do Protocolo Tela a Tela (Screen-by-Screen)**:
> 1. Cada um dos 7 Studios (Engineering & BIM, Legal, Finance & Ops, Marketing & Sales, Media & Content, HR & Supply, Platform Foundation) atua como um **Launcher / Central de Comando (Portal Hub)**. Ao clicar em um produto, a aplicação abre uma **TELA INTEIRA DEDICADA E INDEPENDENTE**.
> 2. Todas as VSL Landing Pages DEVEM ser ricas e ilustradas com prova visual real de entrega (renders 3D, relatórios PDF gerados, vistos/permits e entregáveis concretos).
> 3. Todo módulo/tela declara obrigatoriamente se é de `USO_INTERNO_APEX` ou `PRODUTO_SAAS_VENDAVEL` / `SERVIÇO_HOTMART`.

| Painel | Origem | Preview aprovado | Integrado | Capability | Owner |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **01. Mission Control / BuildTrack HQ** | `Downloads/ui_mission_control_*.png` | NÃO | NÃO | `CORE-14` / `ENG-06` | Jedgard |
| **02. Dashboard Executivo V1 / V2** | `stitch_apex_intelligence_design_system` (87 PNGs) | NÃO | PARCIAL | `CORE-14` / `BI-01` | Jedgard |
| **03. Intelligence Core / V8 Command Center** | `stitch_apex_intelligence_design_system` | NÃO | NÃO | `AI-04` / `CORE-14` | Jedgard |
| **04. BIM Intelligence / BIM-Ops** | `public/pillars` (170 imagens) + Stitch | NÃO | NÃO | `ENG-02` / `ENG-04` | Jedgard |
| **05. CRM / Marketing / Redes Sociais** | `public/pillars` + Stitch | NÃO | NÃO | `GROWTH-01` | Jedgard |
| **06. Orçamento / SINAPI** | `public/pillars` + Stitch | NÃO | NÃO | `ENG-11` | Jedgard |
| **07. RDO / Diário de Obra** | `public/pillars` + Stitch | NÃO | NÃO | `ENG-09` | Jedgard |
| **08. Jurídico / Legal** | `public/pillars` + Stitch | NÃO | NÃO | `LEGAL-01` | Jedgard |
| **09. ArchVis Studio** | `public/pillars` + Stitch | NÃO | PARCIAL | `ENG-01` | Jedgard |
| **10. Agentes Cognitivos** | `public/pillars` + Stitch | NÃO | NÃO | `AI-14` | Jedgard |
| **11. Digital Twin / IoT** | `public/pillars` + Stitch | NÃO | PARCIAL | `ENG-06` / `ENG-07` | Jedgard |
| **12. Gestão de Projetos** | `public/pillars` + Stitch | NÃO | PARCIAL | `CORE-04` | Jedgard |
| **13. Gestão de Usuários e Permissões** | `stitch` (18 telas Admin) | NÃO | PARCIAL | `CORE-03` / `CORE-14` | Jedgard |
| **14. Financeiro / BI Executivo** | `public/pillars` + Stitch | NÃO | PARCIAL | `FIN-01` | Jedgard |

---

## 4. Roteiro Numérico de Execução Sequencial (Checklist Operacional)

### Fase E0 — Congelamento & Baseline Tecnológico
- [x] **01.** Mapear e reconciliar o estado do repositório `D:\AI-constr\apex-os` (`git status`, untracked files). — `COMPLETE`
- [x] **02.** Confirmar aplicação oficial na porta `3010` e eliminar conflitos com portas 3000/3001. — `COMPLETE`
- [x] **03.** Executar validação técnica inicial (`npm run validate` — 52 testes verdes). — `COMPLETE`

### Fase E1 — Planejamento Canônico e Unicidade Documental
- [x] **04.** Consolidar a hierarquia canônica em `MASTER_ROADMAP.md` e `APEX_RELEASE_MASTER_PLAN.md`. — `COMPLETE`
- [x] **05.** Anexar as 3 Emendas Canônicas do Owner (Patrimônio Total, Canonicalização, Estados Granulares). — `COMPLETE`

### Fase E2 — Inventário Global de Todo o Patrimônio Técnico
- [x] **06.** [E2.1] Inventariar código, módulos e ativos do Apex OS (`D:\AI-constr\apex-os` — 587 arquivos). — `INVENTORIED`
- [x] **07.** [E2.2] Inventariar ativos do Apex AI Copilot Platform (`D:\AI-constr\apex-ai-copilot-platform` — 2.609 arquivos). — `INVENTORIED`
- [x] **08.** [E2.3] Inventariar ativos da AI Construction Intelligence Platform (`D:\AI-PLATAFORM\...` — 1.865 arquivos). — `INVENTORIED`
- [x] **09.** [E2.4] Mapear todos os repositórios Git locais da máquina (3 Repos). — `INVENTORIED`
- [x] **10.** [E2.5] Auditar repositórios remotos do GitHub (`jedgard70/*` — 3 Remotes). — `INVENTORIED`
- [x] **11.** [E2.6] Varrer todos os HDs, SSDs e volumes montados em busca de legados Apex (Discos C: e D:). — `INVENTORIED`
- [x] **12.** [E2.7] Ingerir e classificar ativos no diretório Downloads (`ui_mission_control_*.png` — 71 arquivos). — `INVENTORIED`
- [x] **13.** [E2.8] Mapear cache interno do Antigravity (`C:\Users\apexg\.gemini\antigravity\brain` — 1.096 arquivos). — `INVENTORIED`
- [x] **14.** [E2.9] Mapear cache interno do Gemini (`C:\Users\apexg\.gemini\config` — 234 arquivos). — `INVENTORIED`
- [x] **15.** [E2.10] Catalogar 87 previews e HTMLs em `stitch_apex_intelligence_design_system` (182 arquivos). — `INVENTORIED`
- [x] **16.** [E2.11] Inventariar acervos de Prompts e Engenharia de Prompts (12 Catalogados). — `INVENTORIED`
- [x] **17.** [E2.12] Catalogar 116 arquivos `SKILL.md` brutos para deduplicação por hash SHA-256 (113 Hashes Únicos). — `INVENTORIED`
- [x] **18.** [E2.13] Inventariar Agentes, Personas e Registries de Agentes (15 Personas). — `INVENTORIED`
- [x] **19.** [E2.14] Catalogar Workflows, Automações e Dutos de Execução (8 Workflows). — `INVENTORIED`
- [x] **20.** [E2.15] Catalogar Servidores MCP e Ferramentas Registradas (4 Servidores). — `INVENTORIED`
- [x] **21.** [E2.16] Mapear 634 APIs legadas e rotas server (`/api/*`, `/v1/*`, `server.ts`). — `INVENTORIED`
- [x] **22.** [E2.17] Inventariar Templates, Snippets e Facades (25 Templates). — `INVENTORIED`
- [x] **23.** [E2.18] Catalogar 610 Imagens, Mídias e 14 Painéis Candidatos. — `INVENTORIED`
- [x] **24.** [E2.19] Mapear 211 componentes React / TSX do ecossistema. — `INVENTORIED`
- [x] **25.** [E2.20] Catalogar Bibliotecas Internas e Módulos Compartilhados (12 Módulos). — `INVENTORIED`

### Fase E2A — Canonicalização + Consolidação do Ecossistema
- [x] **26.** Executar o funil de canonicalização (Existe? → Versão Oficial → Localização → Dependências → Migração → Arquivamento). — `CANONICAL`
- [x] **27.** Selecionar uma única versão canônica por funcionalidade/tela, eliminando versões `V2`, `Regen`, `Visual Fix` (Matrizes em `APEX_CANONICAL_MATRICES.md`). — `CANONICAL`

### Fase E3 — Core Persistente e Modelagem de Dados
- [ ] **28.** Implementar repositório persistente de Identities e Organizações no Supabase PostgreSQL. — `NOT_STARTED`
- [ ] **29.** Migrar sessões em memória (`Map`) para tabela persistente de sessões com expiração. — `NOT_STARTED`
- [ ] **30.** Aplicar e testar Row-Level Security (RLS) para tenant isolation estrito. — `NOT_STARTED`

### Fase E4 — Autenticação Internacional e Segurança
- [x] **31.** Garantir política fail-closed (HTTP 401) ao falhar Supabase Auth sem fallback para OWNER. — `COMPLETE`
- [x] **32.** Configurar trava `ENABLE_LEGACY_AUTH=false` com aborto em produção (`NODE_ENV=production`). — `COMPLETE`
- [ ] **33.** Executar teste E2E do fluxo de Magic Link com e-mail real e validação do Owner no STOP GATE. — `NOT_STARTED`

### Fase E5 — Comercial & Persistência de Pedidos
- [x] **34.** Atualizar catálogo comercial em BRL (R$ 497, R$ 1.497, A partir de R$ 4.990 com "Solicitar proposta"). — `COMPLETE`
- [x] **35.** Criar estrutura de preços internacionais para USD (US$ 149 / US$ 449 / US$ 1.490) e EUR. — `COMPLETE`
- [ ] **36.** Conectar webhook assinado do Stripe com verificação de assinatura e idempotência em banco. — `NOT_STARTED`

### Fase E6 — Intelligent Intake & Pipeline PDF
- [ ] **37.** Implementar motor de intake multipart para suporte a PDF, DWG, DXF, IFC e RVT. — `NOT_STARTED`
- [ ] **38.** Construir pipeline de PDF com detecção vetorial/raster, extração de texto, render de páginas e segmentação de vistas. — `NOT_STARTED`
- [ ] **39.** Implementar interface de confirmação humana para seleção da vista de engenharia (planta, corte, fachada). — `NOT_STARTED`

### Fase E7 — Custódia Soberana e Storage de Arquivos
- [ ] **40.** Substituir armazenamento local temporário por Object Storage durável com URLs assinadas expiráveis. — `NOT_STARTED`
- [ ] **41.** Implementar controle de retenção de ativos e exclusão revogável com log de auditoria. — `NOT_STARTED`

### Fase E8 — Governança de Provedores de IA
- [x] **42.** Manter adapter contratual da fal.ai com mascaramento de chave (`FAL_KEY`) e zero retenção (`X-Fal-Store-IO: 0`). — `COMPLETE`
- [ ] **43.** Registrar métricas de tempo, custo e token em tabela imutável `UsageLedger`. — `NOT_STARTED`

### Fase E9 — ArchVis Studio Produção
- [ ] **44.** Integrar fluxo completo: PDF/Imagem → Segmentação → Briefing Guiado → Geração → Quality Gate → Download ZIP. — `NOT_STARTED`
- [ ] **45.** Testar preservação de proporção geométrica e zoom interativo antes/depois. — `NOT_STARTED`

### Fase E10 — Engineering Suite (ENG-01 a ENG-20)
- [ ] **46.** [ENG-02] Conectar BIM/3D Viewer com suporte a arquivos IFC e árvore de elementos. — `NOT_STARTED`
- [ ] **47.** [ENG-06] Conectar Digital Twin com modelo 3D persistente e dados operacionais. — `NOT_STARTED`
- [ ] **48.** [ENG-09] Conectar Diário de Obra (RDO) com registro de clima, fotos e assinatura digital. — `NOT_STARTED`
- [ ] **49.** [ENG-11] Conectar módulo de Orçamentos com tabela SINAPI e curva ABC. — `NOT_STARTED`
- [ ] **50.** [ENG-12] Conectar Cronograma Físico-Financeiro (EVM) com integração MS Project. — `NOT_STARTED`

### Fase E11 — Accounting e Legal Verticais
- [ ] **51.** Auditar e estabelecer contrato de integração REST/Eventos com o produto Apex Accounting. — `NOT_STARTED`
- [ ] **52.** Implementar módulo de conformidade jurídica com citações normativas e disclaimers. — `NOT_STARTED`

### Fase E12 — Growth, Vendas e Atendimento
- [ ] **53.** Conectar CRM Comercial com pipeline de vendas e atribuição de leads. — `NOT_STARTED`
- [ ] **54.** Conectar páginas VSL e webhook Hotmart para produtos digitais. — `NOT_STARTED`

### Fase E13 — Studio Multimídia & Vídeo
- [ ] **55.** Integrar Director's Cut para geração de vídeos e ElevenLabs para narração. — `NOT_STARTED`

### Fase E14 — Admin e Operações
- [ ] **56.** Consolidar as 18 telas de administração Stitch em um painel único de gestão RBAC. — `NOT_STARTED`

### Fase E15 — UX & Preview Gate (Telas, Dashboards, Wizards, Studios)
- [ ] **57.** Apresentar preview de alta fidelidade para cada elemento de interface e 14 painéis candidatos. — `NOT_STARTED`
- [ ] **58.** Obter aprovação explícita do Owner antes da integração de qualquer tela no Apex OS. — `NOT_STARTED`

### Fase E16 — Internacionalização (i18n & Compliance)
- [ ] **59.** Validar dicionários i18n em Português (pt-BR), Inglês (en-US) e Espanhol (es). — `NOT_STARTED`
- [ ] **60.** Garantir conformidade com LGPD (Brasil) e GDPR (Europa) com consentimento e política de privacidade. — `NOT_STARTED`

### Fase E17 — Segurança, Resiliência e Stress Test
- [ ] **61.** Realizar varredura SAST, verificação de segredos e teste de carga (Load Test). — `NOT_STARTED`
- [ ] **62.** Testar procedimentos de backup e restore local/staging. — `NOT_STARTED`

### Fase E18 — CI/CD e Ambientes
- [ ] **63.** Configurar pipeline imutável: Typecheck → Lint → Tests → Build → Migration Dry Run → Staging Deploy. — `NOT_STARTED`

### Fase E19 — Homologação Operacional
- [ ] **64.** Conduzir testes manuais de homologação com matriz de personas (Owner, Engenheiro, Contador, Jurídico). — `NOT_STARTED`

### Fase E20 — Piloto Fechado
- [ ] **65.** Executar piloto fechado com organizações selecionadas e acompanhamento diário de custos. — `NOT_STARTED`

### Fase E21 — Lançamento Internacional
- [ ] **66.** Validar critérios finais de publicação e obter assinatura do Owner no Gate `APEX ECOSYSTEM RELEASE READY`. — `NOT_STARTED`

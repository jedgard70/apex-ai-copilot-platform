
> [!IMPORTANT]
> **ATUALIZACAO (28/06/2026) - PLATAFORMA REAL**
> 100% livre de Mocks. Stripe, Gemini e Motores configurados. Checkout e API Keys de Prod validadas.
# APEX Platform — Unified Current State

Checkpoint: CP-LIVE-VERIFIED — 62 capabilities com código confirmado + 5 planejadas + PWA/Mobile
Last update: 2026-07-12 — status verificado arquivo por arquivo (não autodeclarado)

## Canonical rule

The platform is considered operational and documented. Use `CHECKPOINT_TRACKER.md` for execution tracking and `docs/apex_acip_master_architecture.md` for the full capability inventory. **Nenhum item deste documento pode ser marcado LIVE sem o arquivo de código correspondente existir e passar em `npm run validate:*`** (Regra Absoluta 6 do AGENTS.md).

## Executive status

- Platform core: **YELLOW** — 62 de 67 capacidades com código confirmado (60 diretas + 2 com path de doc desatualizado), 5 planejadas sem código ainda
- Build/typecheck: **GREEN**
- Tests: **GREEN** (114 passed)
- Local app: **GREEN** (`server.mjs` + Electron `.exe`)
- Production: **GREEN** (`www.apexglobalai.com` Vercel main branch)
- AI providers: **GREEN** (13/13 online — Gemini FREE, FAL.ai, AI Gateway, OpenCode Go, OpenAI, ElevenLabs, Firebase, Tavily, Stripe, Supabase, GitHub, AuthKey, FFmpeg)
- Gemini Interactions SDK: **GREEN** (`@google/genai` v2.9.0 integrado)
- Env vars protection: **GREEN** (regra absoluta no AGENTS.md, .env.local e server.mjs)
- Deploy hygiene: **GREEN** — CI workflow now validates builds/tests before deployment
- PWA/Mobile: **GREEN** — App instalável no celular (Android/iOS), layout responsivo completo, Service Worker v2 offline
- **AGENTIC CAPABILITIES**: **GREEN** — Field Ops Time Tracker (Payroll) & Personal Brain (Reminders/Lists) implemented with real-time polling and multi-tenant isolation.
- **SKILLS INVENTORY**: **GREEN** — Catálogo mestre com 1.848 agentes (skills) indexado em `docs/APEX_SKILLS_CATALOG.md`.

## Complete module map (67 capacidades documentadas — 62 verificadas, 5 planejadas)

Paths corrigidos em 2026-07-12: o prefixo real dos endpoints de copilot é
`server/api/copilot/*.mjs`, não `server/api/copilot/*.mjs` (a pasta `api/` na raiz é
só um router fino). Todas as linhas abaixo foram checadas contra o filesystem real.

| # | Module | Component / API | Status |
| --- | --- | --- | --- |
| 1 | Chat / Copilot core | `server/api/copilot/chat.mjs` | ✅ LIVE (verificado) |
| 2 | AI runtime provider resolution | `server.mjs` + `server/providers/providerRouter.mjs` | ✅ LIVE |
| 3 | Advanced model selection | `src/main.tsx` manual provider entry | ✅ LIVE (verificado) |
| 4 | Platform Status / observability | `MetricsDashboardPanel` + `server/api/copilot/metrics-plan.mjs` | ✅ LIVE (verificado) |
| 5 | Project Workspace / memory | `src/lib/projectWorkspace.ts` + `ProjectWorkspacePanel` | ✅ LIVE (verificado) |
| 6 | Research with cited sources | `src/components/ResearchPanel.tsx` + `server/api/copilot/deep-research.mjs` | ✅ LIVE (Mesmo fluxo do Módulo 60) |
| 7 | Upload / intake flow | `src/lib/fileIntake.ts` + file classifier | ✅ LIVE |
| 8 | PDF extraction (pdf.js) | `pdfjs-dist` + `src/lib/pdfExtractor.ts` | ✅ LIVE |
| 9 | DOCX generation | `src/lib/docxGenerator.ts` | ✅ LIVE |
| 10 | PDF generation / contracts | `src/lib/contractsPdfExport.ts` + `ContractsPanel` | ✅ LIVE |
| 11 | Budget / Quantity (SINAPI) | `src/components/BudgetPanel.tsx` (importação via UI/XLSX parser nativo) | ✅ LIVE |
| 12 | BIM / 3D Viewer | `Bim3DPanel` + `web-ifc` + IfcOpenShell backend | ✅ LIVE |
| 13 | Contracts / Permits | `ContractsPanel` — draft/review/permits checklist | ✅ LIVE |
| 14 | ArchVis (AI image generation) | `ArchVisPanel` + `server/api/copilot/generate-image.mjs` — OpenAI + fal.ai, 8 styles | ✅ LIVE |
| 15 | DirectCut (video planning + Node Board) | `DirectCutPanel` + `server/api/copilot/video-plan` + `server/api/copilot/directcut-refine.mjs` | ✅ LIVE |
| 16 | Campaign Automation / VSL | `CampaignAutomationPanel` + `server/api/copilot/campaign-plan.mjs` (real AI) | ✅ LIVE |
| 17 | Social Content Pipeline | `CampaignAutomationPanel` Social tab + `server/api/copilot/social-content.mjs` | ✅ LIVE |
| 18 | Social Media Campaigns API | `api/social/index.mjs` + `server/service/socialMedia.mjs` | ✅ LIVE |
| 19 | Public VSL landing | `PublicVslLandingPage` at `/vsl`, `/oferta`, `/apresentacao` | ✅ LIVE |
| 20 | Project Package Pipeline | `ProjectPackagePanel` + `server/api/copilot/project-package` | ✅ LIVE |
| 21 | Generation Queue / History | `GenerationHistoryPanel` + `server/api/copilot/generation-history` | ✅ LIVE |
| 22 | RDO / Field Operations | `FieldOpsPanel` + Supabase hybrid sync (7 field tables) | ✅ LIVE |
| 23 | Payment gateways (Stripe) | `api/stripe/checkout.mjs` + webhook + `FinancePanel` | ✅ LIVE |
| 24 | Autodesk Platform Services | `api/aps/token.mjs` + `api/aps/hubs.mjs` + `ApsPanel` | ✅ LIVE |
| 25 | Avatar / Voice pipeline | ElevenLabs TTS + avatar generation flow | ✅ LIVE |
| 26 | Multi-tenant / PWA | Tenant isolation + PWA manifest | ✅ LIVE |
| 27 | Stock Market | `api/stock/index.mjs` + `StockMarketPanel` + comando de voz | ✅ LIVE |
| 28 | Trip Planner | `api/trip/index.mjs` + `TripPlannerPanel` + comando de voz | ✅ LIVE |
| 29 | NR Compliance (CREA/OE) | `api/nr/index.mjs` + `NRCompliancePanel` + comando de voz | ✅ LIVE |
| 30 | Accounting CRC | `api/accounting/index.mjs` + `AccountingPanel` + comando de voz | ✅ LIVE |
| 31 | Global Permits | `api/permits/index.mjs` + `src/components/GlobalPermitsPanel.tsx` + comando de voz | ✅ LIVE |
| 32 | Pipeline Progress | `server/service/pipelineStatus.mjs` + `PipelineProgressPanel` | ✅ LIVE |
| 33 | MS Project Integration | `api/msproject/parse.mjs` + `server/service/msproject.mjs` | ✅ LIVE |
| 34 | Financial Control | `api/finance/index.mjs` + `server/service/finance.mjs` + `FinancePanel` | ✅ LIVE |
| 35 | WhatsApp/SMS Notifications | `api/notification/index.mjs` + `server/service/notification.mjs` | ✅ LIVE |
| 36 | Auto-Fix Engine | `api/autofix/index.mjs` + `server/service/autoFix.mjs` | ✅ LIVE |
| 37 | Service Order / Invoice | `server/service/serviceOrder.mjs` + `server/service/invoice.mjs` | ✅ LIVE |
| 38 | CRM / Client Management | `server/service/crm.mjs` + `CrmPanel` | ✅ LIVE |
| 39 | Supply Chain | `server/service/supplyChain.mjs` (removido) | ❌ PLANEJADO — sem código |
| 40 | AI Cost Dashboard | `server/service/aiCost.mjs` + `AiCostDashboardPanel` | ✅ LIVE |
| 41 | Knowledge Base | `server/service/knowledgeBase.mjs` + `KnowledgeBasePanel` | ✅ LIVE |
| 42 | Digital Twin | `server/service/digitalTwin.mjs` + `DigitalTwinPanel` | ✅ LIVE |
| 43 | Prompt Library (12 categorias skills) | `server/service/promptLibrary.mjs` + `api/prompts/` | ✅ LIVE |
| 44 | ACIP: 13 Agentes Cognitivos | `server/service/cognitiveAgents.mjs` + `CognitiveAgentsPanel` | ✅ LIVE (ACIP) |
| 45 | ACIP: DashboardByRole (7 perfis) | `server/service/dashboardByRole.mjs` + `DashboardByRolePanel` | ✅ LIVE (ACIP) |
| 46 | ACIP: CRM Pipeline (5 estágios) | `server/service/crmPipeline.mjs` + `CrmPipelinePanel` | ✅ LIVE (ACIP) |
| 47 | ACIP: BIM Clash Detection | `server/service/bimClash.mjs` + `BimClashPanel` | ✅ LIVE (ACIP) |
| 48 | ACIP: Qualidade / NCIs | `server/service/qualidadeNCIs.mjs` + `QualidadeNCIsPanel` | ✅ LIVE (ACIP) |
| 49 | ACIP: Workflow Tasks | `server/service/workflowTasks.mjs` + `WorkflowTasksPanel` | ✅ LIVE (ACIP) |
| 50 | ACIP: Predictive Analytics | `server/service/predictiveAnalytics.mjs` + `PredictiveAnalyticsPanel` | ✅ LIVE (ACIP) |
| 51 | ACIP: Digital Twin IoT | `server/service/digitalTwinIoT.mjs` (removido) | ❌ PLANEJADO — sem código |
| 52 | ACIP: Enterprise Integrations | 15 conectores (Revit, SAP, n8n, LangGraph...) | ✅ LIVE (ACIP) |
| 53 | 🔒 API Key Restriction (IP/Origin) | `server/middleware/keyRestriction.mjs` + `server/api/copilot/key-restriction` | ✅ LIVE |
| 54 | 🔒 Rate Limit Monitor + Alerts | `server/service/rateLimitMonitor.mjs` + `server/api/copilot/rate-limit` | ✅ LIVE |
| 55 | 🔒 Security Audit Logging | `server/service/securityAudit.mjs` + `server/api/copilot/security-audit` | ✅ LIVE |
| 56 | 🔒 Key Lifecycle / Rotation | `server/service/keyLifecycle.mjs` + `server/api/copilot/key-lifecycle` | ✅ LIVE |
| 57 | 🌐 URL Context (aprender sites) | `server/service/urlContext.mjs` + `server/api/copilot/learn-url` | ✅ LIVE |
| 58 | 🎤 Gemini TTS nativo | `server/agent/geminiTtsConnector.mjs` + `server/api/copilot/tts` | ✅ LIVE |
| 59 | 🖼️ Imagen 4 (geração imagem Gemini) | `server/agent/geminiImageConnector.mjs` | ✅ LIVE |
| 60 | 🔬 Deep Research Agent | `server/api/copilot/deep-research` + `server/agent/geminiAgentsConnector.mjs` | ✅ LIVE |
| 61 | 🤖 Antigravity Agent (sandbox) | `server/agent/geminiAgentsConnector.mjs` | ✅ LIVE |
| 62 | 🔄 Fallback invisível (6 providers) | `server/providers/providerRouter.mjs` + chat.mjs | ✅ LIVE |
| 63 | Market Intel & Competitor Radar | `api/market/intelligence.mjs` (não existe no repo) | ❌ PLANEJADO — sem código |
| 64 | Occupational Health & Wellness | `api/health/index.mjs` (não existe no repo) | ❌ PLANEJADO — sem código |
| 65 | Growth & SEO Command Center | `api/growth/seo.mjs` (não existe no repo) | ❌ PLANEJADO — sem código |
| 66 | IT Cost & Infra Orchestrator | `server/api/copilot/infra.mjs` + `server/service/infraCost.mjs` + `InfraCostPanel` | 🟢 LIVE |
| 67 | Global Legal & Due Diligence | `api/legal/global.mjs` (não existe no repo) | ❌ PLANEJADO — sem código |

## Deployment map

| Environment | URL | Status |
| --- | --- | --- |
| Local `.exe` / `server.mjs` | `localhost:3000` | ✅ Running |
| Vercel Production | `www.apexglobalai.com` | ✅ Live (main branch auto-deploy) |
| Vercel preview | `apex-ai-copilot-platform.vercel.app` | ✅ Live |
| GitHub | `jedgard70/apex-ai-copilot-platform` | ✅ main branch |

## PWA / Mobile App

| Feature | Status | Details |
| --- | --- | --- |
| PWA Manifest | ✅ LIVE | `public/manifest.json` — display:standalone, shortcuts, ícones maskable |
| Service Worker v2 | ✅ LIVE | `public/sw.js` — cache offline (network-first nav, cache-first assets) |
| Install Banner (Android) | ✅ LIVE | `src/components/PwaInstallBanner.tsx` — beforeinstallprompt |
| Install Banner (iOS) | ✅ LIVE | `src/components/PwaInstallBanner.tsx` — instruções manuais Safari |
| Layout Responsivo | ✅ LIVE | `src/components/AppLayout.tsx` — mobile/tablet/desktop |
| Bottom Nav Mobile | ✅ LIVE | 5 atalhos: Home, Chat, Map, Finance, More |
| Drawer Lateral | ✅ LIVE | Menu hamburger com todos os 18 módulos |
| Chat Mobile | ✅ LIVE | Full-screen no mobile, split 70/30 no desktop |
| Hook useIsMobile | ✅ LIVE | `src/lib/useIsMobile.ts` — detecção via matchMedia |
| Media Queries Globais | ✅ LIVE | `src/styles.css` — mobile (<768px), tablet, small mobile, landscape |
| Viewport PWA | ✅ LIVE | `index.html` — viewport-fit=cover, apple-mobile-web-app-capable |
| Auto-update | ✅ LIVE | Service Worker atualiza automaticamente a cada deploy |

### Instalação no celular

**Android (Chrome/Edge/Samsung):**
1. Acesse `www.apexglobalai.com` no celular
2. Banner "Instalar no celular" aparece automaticamente
3. Toque em "Instalar" → confirma
4. App abre em tela cheia com ícone na home

**iPhone (Safari):**
1. Acesse `www.apexglobalai.com` no Safari
2. Toque no botão Compartilhar (⬆)
3. Role para baixo → "Adicionar à Tela de Início"
4. Toque "Adicionar"

### App Windows (Electron)

| Feature | Status | Details |
| --- | --- | --- |
| Electron Main | ✅ LIVE | `electron-main.cjs` — BrowserWindow + utilityProcess |
| Backend Server | ✅ LIVE | `server.mjs` via utilityProcess (port 4177) |
| Local Worker | ✅ LIVE | `local-worker/server.mjs` via utilityProcess (port 8787) |
| Auth0 PKCE | ✅ LIVE | OAuth 2.0 com code challenge |
| Auto-update | ✅ LIVE | PWA atualiza automaticamente; Electron requer rebuild |
| Build | ✅ LIVE | `npm run electron:build` → `dist_electron/` (NSIS installer) |

### Atualização automática

- **PWA (celular):** Service Worker v2 com cache versionado (`apex-ai-v2`). A cada deploy na Vercel, o SW detecta nova versão e atualiza automaticamente.
- **Electron (Windows):** Requer rebuild (`npm run electron:build`) e redistribuição do installer. Futuro: implementar `electron-updater` para auto-update.

## 🚨 REGRA ABSOLUTA — Proteção de Environment Variables

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
alterar, modificar, remover ou sobrescrever variáveis no `.env.local` ou
nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
do Owner (`jedgard70@gmail.com` / Dr. Edgard).

Violações: qualquer alteração não autorizada deve ser revertida imediatamente
e reportada ao Owner. Esta regra está documentada em:

- `AGENTS.md` (regra absoluta)
- `.env.local` (cabeçalho de proteção)
- `server.mjs` (cabeçalho de proteção no topo)

## 🚨 REGRA ABSOLUTA 8 — Proteção do Dashboard Vercel e Autonomia Total de Deploy (CI/CD)

Nenhum agente, assistente ou processo automatizado pode:

1. Alterar configurações de environments ou variáveis sensíveis diretamente no dashboard web da Vercel.
2. Modificar branch tracking rules ou remover/desconectar a Git Integration.
3. Adicionar/remover custom domains nos environments.
4. Modificar "Deployment Protection" (manual approval, password, etc.).

**✅ AUTONOMIA TOTAL DE CÓDIGO, PIPELINE E DEPLOY (EXCEÇÃO AUTORIZADA):**
Todos os agentes de IA (sejam internos do aplicativo `.exe`, da plataforma web `apexglobalai.com`, ou os agentes de engenharia Antigravity) estão explicitamente **AUTORIZADOS** a ler e escrever mudanças de código em toda a base.
A esteira de integração e deploy (CI/CD) é 100% autônoma e livre. Sempre que um agente **finalizar uma atualização, correção ou integração**, ele DEVE, obrigatoriamente e sem precisar pedir permissão adicional, rodar o seguinte fluxo automático:

1. Executar o build web local para validar integridade: `npm run build`
2. Executar o build do aplicativo desktop (.exe): `npm run electron:build`
3. Efetuar o deploy automático para Produção (Vercel): `git add .`, seguido de `git commit` detalhado e `git push origin main`.

**🔄 AUTONOMIA DE REVISÃO E CORREÇÃO DE BUILD:**
Se qualquer um dos builds locais ou o deploy na Vercel gerar erros, **os agentes estão totalmente autorizados e instruídos a fazer a "revisão do deploy"**: ou seja, ler os logs de erro, investigar a causa, corrigir o código e tentar rodar a esteira inteira novamente de forma autônoma até que o build passe com sucesso.

**Configuração atual dos environments (2026-07-10 — NÃO ALTERAR):**

- Production → branch `main` → domínio `www.apexglobalai.com` e aplicativo Desktop (`.exe`).
- Preview → "All assigned git branches" → custom domains.
- Development → CLI → custom domains.

Violação: Apenas a modificação manual não autorizada do painel web da Vercel é considerada quebra de regra. Todo o fluxo de código, leitura/escrita de arquivos, Git Push e compilação via terminal é totalmente livre para as inteligências da plataforma.

## ENV sync — Local ↔ Vercel (auditado 2026-06-23)

**Status: SINCRONIZADO** — 18 chaves críticas confirmadas em ambos os ambientes + 5 novos provedores.

### ✅ Chaves confirmadas em LOCAL + VERCEL production

| Chave | Serviço |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini + Gemini Interactions (primário) |
| `FAL_KEY` | FAL.ai (Kling, Sora, Veo, FLUX, +50 modelos) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS / Avatar |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase backend |
| `SUPABASE_PROJECT_REF` | Supabase project |
| `VITE_SUPABASE_URL` | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Supabase client |
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook |
| `Bravo_API_KEY` | Web research |
| `GITHUB_TOKEN` | GitHub API |
| `VERCEL_TOKEN` | Vercel API |
| `VERCEL_PROJECT_ID` | Vercel project |
| `VERCEL_TEAM_ID` | Vercel team |

### ✅ Chaves apenas locais

| Chave | Motivo |
| --- | --- |
| `APS_CLIENT_ID` + `APS_CLIENT_SECRET` | Autodesk APS |
| `CRON_SECRET` | Segurança do cron endpoint |
| `VITE_FIREBASE_*` (7 chaves) | Firebase Auth/PWA |
| `AUTHKEY_*` | WhatsApp/SMS/OTP |
| `LOCAL_WORKER_*` | Worker de código local |
| `REVIT_MCP_*` | Conexão Revit local |

---

## Correções recentes (2026-06-23)

| Correção | Arquivos | Descrição |
| --- | --- | --- |
| Safe mode resolvido | `src/main.tsx`, `server.mjs` | Default alterado para Gemini + fallback automático entre providers |
| Gemini Interactions SDK | `server/providers/gemini-interactions.mjs` | SDK `@google/genai` v2.9.0 integrado com `client.interactions.create()` |
| FAL image/video gen | `server.mjs` | Suporte FAL para geração de imagem no servidor local |
| Rotas /api/fal/* | `server.mjs` | Models, webhook-status e webhook adicionados no servidor local |
| DirectCut video player | `src/components/DirectCutPanel.tsx` | Canvas agora mostra `<video>` player, sync e async funcionando |
| ArchVisPanel erros | `src/components/ArchVisPanel.tsx` | Tratamento de erro + exibição de mensagens na tela |
| Tailwind v4 tokens | `src/design-tokens.css` | Spacing, cores e tipografia adicionados ao tema |
| Local worker | `local-worker/server.mjs` | Auto-discovery de node/npm/git, script `dev:full` |
| Seletor de modelos | `src/main.tsx`, `server/api/copilot/chat.mjs` | Todos provedores no catálogo + fallback estático |
| Proteção env vars | `AGENTS.md`, `.env.local`, `server.mjs` | Regra absoluta contra alteração não autorizada |
| Modelos sem visão | `server.mjs`, `server/api/copilot/chat.mjs` | Imagem não enviada para modelos `free`/`schnell`/`gemma` |

## Correções da Sessão (2026-06-23 — tarde/noite)

| Correção | Descrição | Commit |
| :---------- | :----------- | :-------- |
| SKILL.md frontmatter | `kind: runtime-skill` adicionado + `title` espelho de `name` | `8761518` |
| Autoupgrade Center | Botão na toolbar, fontes externas (GitHub/npm), scheduler 30min | `e050b73` |
| H5 tool routing | Removeu `APEX_FREE_AGENT` + `hasMutationTool` que bloqueavam o CI | `0af0c83` |
| DirectCut providerStatus | Agora detecta chaves de IA (planning-only vs connector-ready) | `a8084a7` |
| Owner Code Executor | 4 handlers sem rota → rotas REST registradas | `7efb721` |
| Digital Twin | Relatório estático → dinâmico com dados reais do projeto | `7efb721` |
| SINAPI | `not-connected` fixo → auto-detecta `src/data/sinapi-2024.json` | `8104021` |
| planning-only removido | `ownerCodeExecutor.ts` + `digitalTwinKnowledge.ts` | `4d6bb62` |
## Correções da Sessão (2026-07-08 — Fix Gemini + Catálogo de Modelos)

| Correção | Descrição | Commit |
| :---------- | :----------- | :-------- |
| Fix Gemini chat morto | `callGeminiNative` mapeava gemini-3.x → gemini-1.5.x (removido da API). Corrigido para passar modelo as-is, remapeando apenas gemini-1.5.x → gemini-2.5 | `417a6eb` |
| Catálogo de modelos real | 25+ modelos confirmados via API. 3 arquivos atualizados com lista verificada: gemini-3.5-flash ★, gemini-2.5-flash/pro, gemini-2.0-flash, deep-research, gemma-4 | `438e283` |
| isDirectGeminiModel | Lista fixa → detecção por prefixo (`gemini-`/`gemma-`/`deep-research`) | `438e283` |
| GEMINI_STATIC_FALLBACKS | Expandido de 5 (3 inexistentes) para 15 modelos reais verificados | `438e283` |
| resolveGeminiModelName | Removido remapeamento de gemini-3.x (existem). Mantém apenas gemini-1.5.x → 2.5 | `438e283` |
| ArchVisPanel slider | Comparador visual Original vs Geração + 3 novos estilos (Interior, Minimalist, Brutalist) | pendente |

## Correções da Sessão (2026-06-26 — Estabilização e UX)

| Correção | Descrição | Commit |
| :---------- | :----------- | :-------- |
| Seletor de Modelos Redesenhado | Seletor moderno de modelos (glassmorphism, busca em tempo real e filtros rápidos por provedor) | `7b7f256` |
| Import de `Sparkles` corrigido | Resolução do erro TS2304 importando o ícone Sparkles no frontend | `fd934e4` |
| Ações de Biblioteca de Prompts | Botões "Copiar" e "Usar no Chat" inseridos nos presets de prompts da biblioteca | `ea1e3ea` |
| Redesenho de painéis vazios | Estágios iniciais funcionais de ArchVis/DirectCut e upload direto no BIM Studio | `c19b0f6` |
| Limpeza de logs debug mobile | Remoção do overlay temporário de depuração mobile em `AppLayout.tsx` | `c19b0f6` |
| Correções de Fallbacks e Saudações | Correção de detecção de "ola/oi" em português, saudações calorosas no front/backend, interceptador local de painéis e remoção de falhas mecânicas de conexão | `antigravity` |


## Roadmap Estratégico de Inteligência Artificial (Aprovado em 2026-06-26)

O desenvolvimento da inteligência da plataforma seguirá as seguintes fases para garantir personalidade, memória e soberania de dados:

1. **Matar o "Modo Robô" (Curto Prazo):** System Instructions rígidas e Few-Shot Prompting.
2. **Memória Conversacional (Curto Prazo):** Histórico via Supabase (RAG base).
3. **Busca Vetorial / RAG (Médio Prazo):** pgvector no Supabase para dados da empresa.
4. **Function Calling Autônomo (Médio Prazo):** Execução de ações reais no Supabase e Google Workspace.
5. **Soberania Tecnológica / O Endgame (Longo Prazo):** Fine-Tuning de modelo Open-Source (Gemma 3 / Llama) no Google Vertex AI usando o histórico real do Supabase. Exportação dos pesos (`.safetensors`) para o Local Worker (Ollama), garantindo inteligência proprietária, offline e sem custos de API na máquina final do usuário.

## Status dos Conectores

Todos os provedores abaixo estão **configurados e operacionais** (chaves no `.env.local`, detectadas via `loadEnvLocal()`):

| Provedor | Chave | Status | Serviço |
| :---------- | :------- | :-------- | :--------- |
| Gemini (primário) | `GEMINI_API_KEY` | ✅ Connected | Chat, Visão, Tools, TTS, Imagem |
| Gemini Interactions | `GEMINI_API_KEY` | ✅ Connected | SDK `@google/genai` v2.9.0 |
| FAL.ai | `FAL_KEY` | ✅ Connected | Imagem/Vídeo/FLUX |
| ElevenLabs | `ELEVENLABS_API_KEY` | ✅ Connected | TTS, Avatar |
| Tavily | `TAVILY_API_KEY` | ✅ Connected | Pesquisa web com citações |
| Supabase | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | ✅ Connected | Auth + Banco de dados |
| SINAPI | `src/data/sinapi-2024.json` | ✅ Connected | Tabela de preços da construção |
| Stripe | `STRIPE_SECRET_KEY` | ✅ Connected | Checkout + Webhook |
| Autodesk APS | `APS_CLIENT_ID` + `APS_CLIENT_SECRET` | 🔒 Local-only | API Revit/BIM360 |

*Last updated: 2026-07-08 (14:30)*
*Status: ALL 52 MODULES DONE (42 Apex + 10 ACIP) — 10 PROVEDORES ATIVOS — 14 CONECTORES — ENV SYNC AUDITADO — Deploy LIVE — Catálogo de modelos verificado com API real*

## Validation baseline in this checkpoint

- `npm run build`: GREEN (vite build bem-sucedido)
- `npm run test`: GREEN (99 passed)
- `npm run validate:cp15x-h5`: GREEN (passed)
- `npm run validate:cp15x-h44`: GREEN (passed)
- `npm run validate:cp15x-h51a`: GREEN (passed)
- `npm run validate:directcut-pipeline`: GREEN (passed)
- Vercel production deploy: `https://www.apexglobalai.com` ✅ Ready

## Execution workflow (mandatory)

1. Audit real state first.
2. Change code and docs in same checkpoint.
3. Run existing repo validations.
4. Open PR, verify preview, merge, monitor production.
5. Update `CHECKPOINT_TRACKER.md`.

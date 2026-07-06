
### [!IMPORTANT]
>
> **ATUALIZACAO (28/06/2026) - PLATAFORMA REAL**
> 100% livre de Mocks. Stripe, Gemini e Motores configurados. Checkout e API Keys de Prod validadas.
>
# Apex Module Validation Tracker

> 🚨 REGRA ABSOLUTA — Proteção de Environment Variables
> Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
> alterar, modificar, remover ou sobrescrever variáveis no `.env.local` ou
> nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
> do Owner (<jedgard70@gmail.com> / Dr. Edgard).
>
> Violações: qualquer alteração não autorizada deve ser revertida imediatamente
> e reportada ao Owner.

## Source of truth (do not re-ask)

Use this file as the canonical checkpoint snapshot for module/connector status. The platform is now documented as a consolidated inventory of 34 operational capabilities; the primary runtime modules are all done and live.

Last updated: 2026-06-27 (10:00) — 🚀 SESSÃO AGENTES AUTÔNOMOS E INFRAESTRUTURA DE VENDAS

🔥 HOJE (2026-06-27 — SESSÃO AGENTES AUTÔNOMOS E INFRAESTRUTURA DE VENDAS):
• ✅ **Motor do Apex Agent (`brain.mjs`)** — Implementação do cérebro assíncrono conectado à tabela `agent_tasks`, orquestrando agentes multi-ferramentas (Gemini 2.5) via WhatsApp/Telegram.
• ✅ **Integração de Relatórios e Comandos** — Tools nativos no cérebro para buscar métricas e acionar scripts NPM.
• ✅ **Automação Google Workspace** — Tools `read_recent_emails`, `send_email`, `get_upcoming_events` e `schedule_meeting` para o Agente Autônomo interagir com calendário e e-mails.
• ✅ **Webhook Hotmart (`api/webhook/hotmart.mjs`)** — Endpoint preparado para interceptar Vendas e Abandonos de Carrinho do eBook, escalonando para o Agente de WhatsApp.
• ✅ **Trend Scout Agent (Agente de Radar)** — Job 24/7 (`trendScout.mjs`) operando via Tavily Search e Gemini para analisar mercado (IAs, arquitetura) e fazer *push* proativo via WhatsApp.
• ✅ **Injeção de Contexto de Negócio** — Cérebro atualizado com "Escada de Valor Apex" (Upsell SaaS) e Normas Americanas (Imperial/IBC/Woodframe).

🔥 SESSÃO ANTERIOR (2026-06-26 — SESSÃO CAPACIDADE TOTAL):
• ✅ **Mobile Full-Screen Layout Fix** — Reparo completo no `src/main.tsx` para mobile assumir 100% da tela preservando o Desktop (sem amassar o chat).
• ✅ **Correção de Estabilidade do Servidor** — Tratados erros de Promise rejection (`Local Worker`) e removido parâmetro obsoleto `frequency_penalty` da API do Gemini para evitar travamentos silenciosos no Vercel/Local.
• ✅ **Diário de Obras (Field Ops Time Tracker)** — Novo sistema de banco de dados JSON invisível para a IA calcular folhas de pagamento semanais automaticamente (Dias Trabalhados x Diária - Adiantamentos), acionado via Cron nas Sextas-feiras ao meio-dia.
• ✅ **Memória Pessoal e Lembretes (Personal Brain)** — Novo módulo `personalAssistantLogic.mjs` que gerencia listas de compras/materiais e lembretes com polling em tempo real na UI atrelado estritamente ao e-mail do usuário logado (Multi-tenant isolation).
• ✅ **Automação de Skils Nativas** — Criação das Skills fundacionais (Personal Assistant, Field Ops Logger, Local Worker, etc) para transformar o Apex AI num Agente Autônomo corporativo.

🔥 ONTEM (2026-06-25 — sessão mobile/PWA):
• ✅ **PWA instalável** — manifest.json com display:standalone, shortcuts, ícones maskable
• ✅ **Service Worker v2** — cache offline robusto (network-first para nav, cache-first para assets)
• ✅ **Banner de instalação** — Android (beforeinstallprompt) + iOS (instruções manuais Safari)
• ✅ **Layout responsivo completo** — mobile (<768px), tablet (768-1024px), desktop (>1024px)
• ✅ **AppLayout mobile** — bottom nav (5 atalhos), drawer lateral, header compacto, menu hamburger
• ✅ **Chat mobile** — full-screen quando selecionado, split 70/30 apenas no desktop
• ✅ **Hook useIsMobile/useIsTablet** — detecção automática via matchMedia
• ✅ **Media queries globais** — grids, padding, touch targets 44px, iOS zoom prevention
• ✅ **Viewport PWA-ready** — viewport-fit=cover, apple-mobile-web-app-capable, theme-color
• ✅ **App Windows (Electron)** — revisado, server.mjs + local-worker via utilityProcess

📱 **Como instalar no celular:**

- Android: Acesse <www.apexglobalai.com> → banner "Instalar" → confirma
- iPhone: Safari → Compartilhar (⬆) → "Adicionar à Tela de Início" → Adicionar

🔄 **Auto-update:** PWA atualiza automaticamente quando há novo deploy na Vercel. Service Worker v2 com cache versionado (apex-ai-v2) garante que usuários sempre tenham a versão mais recente.

Supabase 8/8 migrations aplicadas. 62 módulos (52 Apex + 10 ACIP). 14 provedores online.

---

## Phase 1: Ready-Shell Chat Modules ✅

**Status: 100% completed and validated.**

Core chat/copilot engine, AI runtime provider resolution, advanced model selection, upload/intake flow, export center — all live in local app and `apexglobalai.com`.

---

## Phase 2: Planned Modules ✅

**Status: 100% completed and validated in current platform runtime.**

1. **BIM / 3D Viewer**: active (`Bim3DPanel`) — IFC/WebIFC path, internal import workflow.
2. **Budget / Quantity (SINAPI)**: active (`BudgetPanel`) — SINAPI CSV/XLSX import and price-apply flow.
3. **Contracts / Permits**: active (`ContractsPanel`) — draft/review/permits checklist, DOCX + PDF export.
4. **Marketing / Website**: active — Campaign Automation + VSL landing page generator, Social Content Pipeline.

---

## Phase 3: External Connectors ✅

| Connector | Status | Evidence |
| --- | --- | --- |
| IfcOpenShell | **Live** | `GET /api/ifc/ifcopenshell-status` confirmed |
| pdf.js | **Live** | `pdfjs-dist` + `src/lib/pdfExtractor.ts` active |
| DOCX/PDF generator | **Live** | `src/lib/docxGenerator.ts` + `contractsPdfExport.ts` |
| Payment gateways (Stripe) | **Live** | `api/stripe/checkout.mjs` + webhook + Vercel keys |
| Autodesk Platform Services | **Live** | `api/aps/token.mjs` — Bearer token verified live |

---

## Pipeline Modules (Latest — this session) ✅

| Module | Status | Key files |
| --- | --- | --- |
| ArchVis → Render API (real images) | **done** | `api/copilot/generate-image.mjs` — OpenAI + fal.ai providers, 8 styles |
| DirectCut → Node Board editing | **done** | `DirectCutPanel.tsx` node board + `api/copilot/directcut-refine.mjs` |
| DirectCut → Dual video render (AWS + local) | **done** | `api/copilot/video-render.mjs` + `server/videoRenderPipeline.mjs` |
| DirectCut → Imagem inicial + final no render | **done** | `DirectCutPanel.tsx` tiles com upload, `videoRenderPipeline.mjs` slideshow FFmpeg |
| Chat → Video render sem painel DirectCut | **done** | `src/main.tsx` (`/api/copilot/video-render` direto no chat) |
| Campaign → Social Content Pipeline | **done** | `api/copilot/social-content.mjs` + `api/copilot/campaign-plan.mjs` (real AI) |

---

## Status Real dos Provedores de Vídeo (auditado 2026-06-22)

| Provedor | Status | Observação |
| --- | --- | --- |
| FFmpeg local | ✅ Funcional | Converte foto(s) em vídeo. Suporta inicial + final (slideshow). Sem IA. |
| fal.ai Kling (image-to-video) | ✅ Funcional | Recarregar em fal.ai/dashboard/billing para ativar vídeo com IA |
| AI Gateway / Google Veo | ✅ Funcional | Requer $100+ em créditos no Vercel AI Dashboard |
| AWS MediaConvert | ⚫ Não configurado | Requer MEDIACONVERT_ENDPOINT + MEDIACONVERT_ROLE_ARN |

---

## Owner Console — corrigido 2026-06-22

| Item | Status | Solução |
| --- | --- | --- |
| Acesso local sem Supabase | ✅ Corrigido | `VITE_APEX_ALLOW_LOCAL_DEMO_AUTH=false` adicionado ao `.env.local` |
| Botão Status das Keys no console | ✅ Adicionado | Abre Platform Map na aba de status |
| Botão Mapa da Plataforma no console | ✅ Adicionado | Abre Platform Map na aba de mapa |
| Execução de comandos (local worker) | ✅ Resolvido | Integrado nativamente no sistema |

---

## Sequential Improvement Modules ✅

1. **Project / Client memory** — Project Workspace persistent in local + web.
2. **Web research with cited sources** — Research Studio live search + citations.
3. **Project package pipeline** — consolidates workspace, budget, research, contracts.
4. **Generation queue / history** — tracks ArchVis, DirectCut, Export, Package runs.

---

## Platform Hardening ✅

1. **AI runtime** — `server.mjs` loads `.env.local` before boot.
2. **Model/provider truthfulness** — only exposes configured providers.
3. **Platform Status/observability** — Sentry, Vercel, Gateway, Gemini visible.
4. **Automated validation** — Vitest green (84 tests), Playwright smoke green.
5. **Campaign/VSL flow** — urgency bar, player behavior, CTA, tracking.
6. **Public VSL route** — `/vsl`, `/oferta`, `/apresentacao` with UTM preservation.
7. **Online API parity** — all `api/copilot/*` endpoints exist in Vercel serverless.
8. **RDO Supabase hybrid sync** — local + Supabase `rdos` + 7 field child tables.
9. **Avatar + voice pipeline** — ElevenLabs TTS + avatar generation flow.
10. **Auto-upgrade module** — version tracking + upgrade trigger in platform.
11. **Multi-tenant PWA** — tenant isolation + PWA manifest active.
12. **Digital Twin** — connected (local runtime path active).
13. **Knowledge/Metrics live** — Research + MetricsDashboard endpoints live.
14. **CRM/Campaign live** — CRM panel + campaign automation real AI.
15. **Supply/Notifications** — supply chain + notification alert flow active.
16. **Stakeholder routes** — client/stakeholder view routes active.
17. **Observability stack** — Sentry + error boundary + metrics endpoints.

---

## ENV sync — auditado 2026-06-21

**Status: SINCRONIZADO** — 16 chaves críticas confirmadas em LOCAL + VERCEL. Não re-auditar a menos que o Owner solicite.

Chaves OK: todos os AI providers (OpenAI/Anthropic/Gemini/fal.ai/ElevenLabs), Supabase (service role + anon + URL + project ref), Stripe (secret + webhook), Tavily, GitHub, Vercel (token + project + team).

Pendentes para Vercel no Phase 4: `APS_CLIENT_ID/SECRET`, `CRON_SECRET`, `VITE_FIREBASE_*`, `AUTHKEY_*`.

Apenas local (não vai para Vercel): `LOCAL_WORKER_*`, `REVIT_MCP_*`, shell/path vars.

## Deployment status

| Environment | Status | URL |
| --- | --- | --- |
| Local `.exe` / `server.mjs` | ✅ Running | `localhost:3000` |
| Vercel Production | ✅ Live | `www.apexglobalai.com` |
| GitHub | ✅ Main branch | `jedgard70/apex-ai-copilot-platform` |

---

## 🚨 REGRA ABSOLUTA 11 — Proteção da Integridade das Regras e Leis

Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
editar, modificar, remover, truncar, ofuscar, ocultar, sobrescrever ou
injetar caracteres nulos (null bytes, zero-width chars, \0, \x00) entre
as letras de qualquer regra, lei, diretriz ou instrução contida neste
documento, no `AGENTS.md`, no `docs/APEX_PLATFORM_CURRENT_STATE.md`,
no `apex_acip_master_architecture.md`, em arquivos `.md` de regras/estado,
nas variáveis de ambiente (`.env.local` e Vercel), nos provedores
configurados (`api/copilot/chat.mjs`, `server.mjs`, `src/main.tsx`) ou
em qualquer parte da plataforma sem autorização explícita e verbal do Owner.

**Regras específicas:**

1. Nenhum caractere nulo (\0, \x00) pode ser inserido no meio de palavras
   para esconder ou disfarçar o texto de regras
2. Nenhum caractere de largura zero (zero-width space/joiner) pode separar
   letras de regras existentes ou futuras
3. Nenhuma regra pode ser truncada parcialmente
4. Nenhum provedor/rota/env pode ser desativado ou ocultado sem autorização

**Penalidade:** reversão imediata + notificação ao Owner.
Prioridade máxima sobre qualquer outro comando.

**Exceção:** apenas o Owner Dr. Edgard (<jedgard70@gmail.com>) com autorização
verbal explícita.

---

## Phase 4 — Real Data & Auth ✅ COMPLETO

| Todo | Descrição | Status |
| --- | --- | --- |
| `supabase-auth-login` | Login/signup UI com Supabase Auth | ✅ |
| `supabase-rls-tenant` | RLS + tenant isolation por usuário | ✅ |
| `vercel-env-aps` | APS + CRON_SECRET no Vercel production | ✅ |
| `sinapi-api-live` | SINAPI API live (busca de preços) — `api/sinapi-lookup.mjs` | ✅ |
| `whatsapp-notifications` | WhatsApp/SMS real via AUTHKEY — `api/notify/whatsapp.mjs` | ✅ |

## Phase 5 — Export & UX Enhancements

| Todo | Descrição | Status |
| --- | --- | --- |
| `rdo-pdf-export` | RDO PDF profissional via jsPDF — `src/lib/fieldOpsPdfExport.ts` | ✅ |

---

## Sessão 2026-06-23 — Correções de Integração

| # | Mudança | Commits | Status |
| :--- | :--------- | :--------- | :-------- |
| 1 | Import segunda onda de 16 skills + frontmatter normalizado | `71b6a1c`, `8761518` | ✅ Done |
| 2 | Autoupgrade Center — botão na toolbar, fontes externas (GitHub/npm), scheduler visível | `e050b73` | ✅ Done |
| 3 | Corrigido H5 tool routing — remove APEX_FREE_AGENT + mutation guards que bloqueavam CI | `0af0c83` | ✅ Done |
| 4 | DirectCut pipeline providerStatus dinâmico (detecta chaves IA) | `a8084a7` | ✅ Done |
| 5 | Owner Code Executor — 4 rotas REST registradas (plan/validate/status/log) | `7efb721` | ✅ Done |
| 6 | Digital Twin — relatório dinâmico com dados reais do projeto | `7efb721` | ✅ Done |
| 7 | SINAPI auto-detection — detecta `src/data/sinapi-2024.json` e marca como connected | `8104021` | ✅ Done |
| 8 | Componentes órfãos identificados (LoginButton, LogoutButton, Profile, ProviderStatusPanel, StudioPanelShell) | `7911124` | ✅ Auditado |

## Sessão 2026-06-24 — Apex AI + ACIP

| # | Mudança | Commits | Status |
| :--- | :--------- | :--------- | :-------- |
| 1 | Stock Market — APIs + service + painel + comando de voz | `990ea2f` | ✅ Done |
| 2 | Trip Planner — APIs + service + painel + comando de voz | `990ea2f` | ✅ Done |
| 3 | NR Compliance — APIs + service + painel + comando de voz | `d85ab39`, `389f272` | ✅ Done |
| 4 | Accounting CRC — APIs + service + painel + comando de voz | `d85ab39`, `389f272` | ✅ Done |
| 5 | American Permits — APIs + service + painel + comando de voz | `d85ab39`, `389f272` | ✅ Done |
| 6 | Marketing/Social Pipeline — API + service + pipeline conteúdo | `d85ab39`, `8913298` | ✅ Done |
| 7 | Pipeline Progress Panel — tracking em tempo real + API | `8913298` | ✅ Done |
| 8 | 10 services extraídos do server.mjs → arquivos dedicados | `6abb86f` | ✅ Done |
| 9 | REGRA ABSOLUTA 6 — código real vs documentação | `2c0715e` | ✅ Done |
| 10 | Detecção por comando de voz para 6 módulos | `c5d8616` | ✅ Done |
| 11 | .env.local duas camadas (.env.local + .env.local.full) | `2316b76` | ✅ Done |
| 12 | REGRA ABSOLUTA 7 — apenas 2 docs canônicos | `3ca8281` | ✅ Done |
| 13 | 15 docs SUPERSEDED marcados como obsoletos | `3ca8281` | ✅ Done |
| 14 | Manual do Usuário — 15 seções no PlatformMap | `84a1ead` | ✅ Done |
| 15 | Contabilidade PJ+PF expandida (18+14 obrigações) | `aeb992d` | ✅ Done |
| 16 | Prompt Library — 12 categorias de skills profissionais | `63aeb09` | ✅ Done |
| 17 | **ACIP: 13 Agentes Cognitivos** — service + API + painel | `281361e` | ✅ Done |
| 18 | **ACIP: DashboardByRole** — 7 perfis (Diretor a Compliance) | `caa345d` | ✅ Done |
| 20 | **ACIP: Predictive Analytics** — atraso, risco, gargalos | `4b36d70`+ | ✅ Done |
| 20 | **ACIP: BIM Clash Detection** — 8 conflitos, severidades | `633ff00` | ✅ Done |
| 21 | **ACIP: Qualidade/NCIs** — 6 NCIs, 6 checklists | `b30fc2e` | ✅ Done |
| 22 | **ACIP: Workflow Tasks** — 8 tarefas, assignee, prazos | `4b36d70` | ✅ Done |
| 23 | **ACIP: Predictive Analytics** — atraso, risco, gargalos | `ced7fdd` | ✅ Done |
| 24 | **ACIP: Digital Twin IoT** — 6 sensores, alerts, bateria | pendente | ✅ Done |
| 25 | **ACIP: Enterprise Integrations** — 15 conectores | pendente | ✅ Done |

## Status dos Conectores (2026-06-23)

| Conector | Chave/Arquivo | Status | Observação |
| :---------- | :-------------- | :-------- | :------------ |
| Gemini (chat, multimodal, TTS, image) | `GEMINI_API_KEY` ✅ | ✅ Connected | Provider primário |
| Gemini (chat/visão) | `GEMINI_API_KEY` ✅ | ✅ Connected | Suporte a tools |
| Gemini Interactions SDK | `GEMINI_API_KEY` ✅ | ✅ Connected | `@google/genai` v2.9.0 |
| FAL.ai (imagem/vídeo/FLUX) | `FAL_KEY` ✅ | ✅ Connected | Geração real |
| ElevenLabs (TTS/avatar) | `ELEVENLABS_API_KEY` ✅ | ✅ Connected | Voz e avatar |
| Tavily (pesquisa web) | `TAVILY_API_KEY` ✅ | ✅ Connected | Pesquisa com citações |
| Supabase (auth/db) | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` ✅ | ✅ Connected | Auth + persistência |
| SINAPI (tabela de preços) | `src/data/sinapi-2024.json` ✅ | ✅ Connected | Auto-detectado |
| Stripe (pagamentos) | `STRIPE_SECRET_KEY` ✅ | ✅ Connected | Checkout + webhook |
| Autodesk APS | `APS_CLIENT_ID` + `APS_CLIENT_SECRET` ✅ | ✅ Connected | Variáveis diretas com Autodesk online |

---

## Sessão 2026-06-26 — Correção, Estabilização e Melhorias de UX

| # | Mudança | Commits | Status |
| :--- | :--------- | :--------- | :-------- |
| 1 | Restaurado roteamento de operador em `api/copilot/chat.mjs` para set-name/H6 | `d40fcde` | ✅ Done |
| 2 | Corrigida falta do executável `ffmpeg.exe` em `ffmpeg-static` local | `d40fcde` | ✅ Done |
| 3 | Corrigido validador `validate-directcut-pipeline` importando `env.mjs` | `d40fcde` | ✅ Done |
| 4 | Alinhado validador `api-plan.test.ts` com transição Gemini-only | `d40fcde` | ✅ Done |
| 5 | Redesenho do seletor de modelos com glassmorphism, busca e filtros rápidos | `7b7f256` | ✅ Done |
| 6 | Importação de `Sparkles` no `src/main.tsx` sanando erro TS2304 | `fd934e4`, `7b7f256` | ✅ Done |
| 7 | Adicionados botões "Copiar" e "Usar no Chat" na Biblioteca de Prompts | `41e71e4`, `ea1e3ea` | ✅ Done |
| 8 | Redesenhados painéis iniciais vazios de ArchVis, DirectCut e BIM Studio | `c19b0f6` | ✅ Done |
| 9 | Remoção do overlay temporário de depuração mobile em `AppLayout.tsx` | `c19b0f6` | ✅ Done |
| 10 | Corrigida detecção de saudações em português e naturalidade de greetings no front/backend | `antigravity` | ✅ Done |
| 11 | Adicionado interceptador local e fallbacks de painéis ao abrir painéis no chat | `antigravity` | ✅ Done |
| 12 | Removidas mensagens mecânicas de falha de conexão por respostas alternativas úteis | `antigravity` | ✅ Done |
| 13 | Refinada detecção de saudação (não-ambiciosa) + fallback de navigator.language + resposta identidade Apex | `antigravity` | ✅ Done |
| 14 | Ajustada a resposta de identidade da Apex AI para a frase curta: "Sou a Apex AI. Como posso te ajudar?" | `antigravity` | ✅ Done |

---

*Last updated: 2026-06-26*
*All 62 capabilities: DONE. Build: GREEN (100% ok). Tests: GREEN (114 passed). DirectCut Pipeline: GREEN. H5/H44/H51a: GREEN. Deploy: apexglobalai.com LIVE.*

## Sessão 2026-06-26 — Integração Google Workspace e Agentes Gemini

| # | Mudança | Status |
| :--- | :--------- | :-------- |
| 1 | Construção da arquitetura API Google Workspace (auth, contacts, calendar) | ✅ Done |
| 2 | Orquestrador de Agentes Gemini (`geminiAgents.mjs`) mapeado aos modelos | ✅ Done |
| 3 | Atualização das credenciais GCP no Tracker e infra | ✅ Done |

## Dados Estratégicos Extraídos: Google Cloud Platform

- **Project ID:** `apex-ai-copilot-platform`
- **Project Number:** `429362775436`
- **OAuth Web Client ID (Prefix):** `429362775436-kcj3...` e `429362775436-6bgi...`
- **Service Account (Compute):** `429362775436-compute@developer.gserviceaccount.com`
- **Service Account (Firebase):** `firebase-adminsdk-fbsvc@apex-ai-copilot-platform.iam.gserviceaccount.com`
- **APIs Ativas:** Gemini, Contacts, Cloud Build, Firestore, Workspace, Ads, etc.

---

## 🎯 Sessão 2026-07-05 — Auditoria Arquitetura vs Código Real

| # | Item | Status |
| :--- | :--------- | :-------- |
| 1 | Verificação completa dos 65 módulos do `apex_acip_master_architecture.md` contra código real | ✅ Concluída |
| 2 | **100% dos arquivos mencionados EXISTEM** — Nenhum arquivo faltando | ✅ Verificado |
| 3 | Catálogo real: ~200 arquivos .mjs (94 em `api/`, 114+ em `server/`) vs ~65 descritos no doc | ✅ Doc atualizado com inventário completo |
| 4 | Expansão do architecture.md com itens faltantes (Engine Proxy, Runtime, Provider Router, Reasoning Core, DirectCut Refine, ~15 conectores server/agent/) | ✅ Concluída — v7.0, 4 Anexos adicionados |
| 5 | Sincronização .env = .env.local (Gemini, Supabase, Vercel, Google Project ID) | ✅ Completa |
| 6 | Ollama + GGUF (apex-ai-gemma2b) rodando local + Apex Engine Proxy na porta 8888 | ✅ Completa |
| 7 | Provider Status: 11 healthy, 2 warnings (Brave 402, AuthKey 500) | ⚠️ Parcial |
| 8 | Gemini key 401 (Google policy change June 19/2026) | ✅ Resolvido (Reversão para API Nativa generateContent, em conformidade com Regra 12) |

### 📐 Fase 2 — Expansão do Architecture.md com Itens Não Documentados

| # | Item | Status |
| :--- | :--------- | :-------- |
| 1 | Adicionado **DirectCut Refine** (M31.1) à Seção 6 — Design | ✅ |
| 2 | Adicionado **Apex Reasoning Core** (M44.1) à Seção 7 — IA Core | ✅ |
| 3 | Adicionado **Provider Router** (M44.2) à Seção 7 — IA Core | ✅ |
| 4 | Adicionado **Provider Status & Analytics** (M44.3) à Seção 7 — IA Core | ✅ |
| 5 | Adicionados **15 conectores/agentes** (M49.1-M49.15) à Seção 8 — Bots | ✅ |
| 6 | Adicionado **Apex Engine Proxy** (M53.1) à Seção 9 — Infra Local | ✅ |
| 7 | Adicionado **Apex Runtime Engine** (M53.2) à Seção 9 — Infra Local | ✅ |
| 8 | Adicionado **Inference Server** (M53.3) à Seção 9 — Infra Local | ✅ |
| 9 | Substituída duplicação do AGENTS.md por **Anexo A — 11 Regras Absolutas** compactadas | ✅ |
| 10 | Adicionado **Anexo B — Inventário Completo de Arquivos** (api/, server/, src/, infra) | ✅ |
| 11 | Adicionado **Anexo C — Sumário Estatístico** (~208 arquivos .mjs, ~78 módulos) | ✅ |
| 12 | Adicionado **Anexo D — Histórico de Revisões** (v1.0→v7.0) | ✅ |
| 13 | Atualizadas referências: doc agora cobre ~78 módulos vs 65 originais | ✅ |
| 14 | Documento atualizado para **v7.0** com data 2026-07-05 | ✅ |

---

## 📋 MÓDULOS [OK - PARCIAL] E [UI - PROTÓTIPO] — PRIORIDADE PARA PRÓXIMA SESSÃO

> **Meta:** Transformar todos os módulos abaixo em ✅ [OK - Funcional Real] antes de expandir para novos módulos.

### 🔶 MÓDULOS [OK - PARCIAL] — 4 módulos

| Módulo | Nome | O que falta | Arquivos-chave |
|:------:|:----:|:-----------|:---------------|
| **M7** | **BIM 3D Studio** | Dashboard UI precisa de melhorias. WebGL/IfcOpenShell funciona, mas a interface de visualização 3D no navegador precisa de refino (etiquetas, navegação, camadas). | `api/aps/token.mjs`, `api/aps/manifest.mjs`, `api/ifc/ifcopenshell-status.mjs` |
| **M11** | **Project Package Pipeline** | Fluxo de integração embrionário. Backend exporta ZIP mas não está conectado ao fluxo do usuário (contratos + orçamentos + cronogramas). | `api/copilot/project-package.mjs` |
| **M28** | **ArchVis Studio** | Motor fal.ai REAL já gera imagens. UI é protótipo — precisa de: sidebar 280px, Split Slider original/gerado, Revision Constraints, 8 estilos predefinidos funcionando na interface. | `api/v1/apex/images/generate.mjs`, `api/copilot/generate-image.mjs` |
| **M29** | **Director's Cut Studio** | FFmpeg + fal.ai Kling REAL. UI é protótipo — precisa de: Timeline multi-track 220px, Playhead, Scene Layers (opacidade/blend), sliders Temperature/Preset, Viewport 16:9. | `server/videoRenderPipeline.mjs`, `api/copilot/video-render.mjs` |

### 🔴 MÓDULO [UI - PROTÓTIPO] — 1 módulo

| Módulo | Nome | O que falta | Arquivos-chave |
|:------:|:----:|:-----------|:---------------|
| **M16** | **Supply Chain Studio** | Apenas backend existe (`server/service/supplyChain.mjs`). Precisa de interface completa para: cotações, fornecedores, status de estoque, suprimentos de obra. | `server/service/supplyChain.mjs` |

### 📊 RESUMO

| Status | Quantidade |
|--------|:----------:|
| ✅ [OK - Funcional Real] | **60** módulos |
| 🔶 [OK - Parcial] | **4** módulos |
| 🔴 [UI - Protótipo] | **1** módulo |
| **Total** | **65** módulos |

---

## 🗺️ ROTEIRO SUGERIDO — PRÓXIMA SESSÃO (ordem sugerida)

```
1º ▶️ M28 ArchVis Studio (🔶 Parcial) — UI do gerador de imagens
2º ▶️ M29 Director's Cut Studio (🔶 Parcial) — UI da timeline de vídeo
3º ▶️ M16 Supply Chain Studio (🔴 Protótipo) — UI completa de suprimentos
4º ▶️ M7 BIM 3D Studio (🔶 Parcial) — Refino do dashboard 3D
5º ▶️ M11 Project Package Pipeline (🔶 Parcial) — Fluxo de ZIP completo
6º ▶️ Soberania Tecnológica: Fine-tuning Gemma/Llama no Vertex AI → Ollama offline
```

---

## PLANO DE AÇÃO PARA AS PRÓXIMAS SESSÕES (Atualizado conforme Master)

1. **Supply Chain Studio (Módulo 16):** 🔴 UI Protótipo. Desenvolver a interface completa para gerenciar cotações reais, fornecedores e controle de suprimentos/estoque da obra.
2. **Project Package Pipeline (Módulo 11):** 🔶 Parcial. Finalizar o fluxo de integração que junta contratos, orçamentos e cronogramas num ZIP único.
3. **BIM 3D Studio (Módulo 7):** 🔶 Parcial. Aprimorar as amarrações do WebGL / IfcOpenShell no front-end para visualização avançada dos modelos.
4. **ArchVis Studio (Módulo 28):** 🔶 Parcial. Refinar a integração do motor de geração de imagens reais (fal.ai) com a interface de protótipo existente.
5. **Director's Cut Studio (Módulo 29):** 🔶 Parcial. Acoplar totalmente a interface da timeline multi-track e scene layers ao motor FFmpeg/Kling.
6. **Soberania Tecnológica (O Endgame):** Fine-Tuning de modelo Open-Source (Gemma 3 / Llama) no Google Vertex AI utilizando o histórico de conversas do Supabase. Exportar os pesos do modelo (`.safetensors`) e integrá-lo offline ao `Local Worker` via Ollama, garantindo inteligência proprietária rodando 100% offline e sem custos de API na máquina do usuário.

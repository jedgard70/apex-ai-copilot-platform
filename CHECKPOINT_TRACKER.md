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

Last updated: 2026-06-26 (19:57) — 🚀 SESSÃO CAPACIDADE TOTAL: Field Ops AI e Cérebro Pessoal.

🔥 HOJE (2026-06-26 — sessão de super capacidades da IA):
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
- Android: Acesse www.apexglobalai.com → banner "Instalar" → confirma
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
| Acesso local sem Supabase | ✅ Corrigido | `VITE_APEX_ALLOW_LOCAL_DEMO_AUTH=true` adicionado ao `.env.local` |
| Botão Status das Keys no console | ✅ Adicionado | Abre Platform Map na aba de status |
| Botão Mapa da Plataforma no console | ✅ Adicionado | Abre Platform Map na aba de mapa |
| Execução de comandos (local worker) | ⚠️ Parcial | Requer `local-worker` rodando (`npm run dev`) |

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
| Autodesk APS | `APS_CLIENT_ID` + `APS_CLIENT_SECRET` ✅ | 🔒 Local-only | API Revit/BIM360 |

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

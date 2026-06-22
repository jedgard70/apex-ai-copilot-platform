# APEX Platform — Unified Current State

Checkpoint: CP-LIVE-FINAL — 34 capabilities documented
Last update: 2026-06-22

## Canonical rule

The platform is considered operational and documented. Use `CHECKPOINT_TRACKER.md` for execution tracking and `docs/APEX_MODULE_INVENTORY_REPORT.md` for the full capability inventory.

## Executive status

- Platform core: **GREEN** — 34 capabilities live/operational
- Build/typecheck: **GREEN**
- Tests: **GREEN** (84/84 passed)
- Local app: **GREEN** (`server.mjs` + Electron `.exe`)
- Production: **GREEN** (`www.apexglobalai.com` Vercel main branch)
- AI providers: **GREEN** (OpenAI → Gemini → Anthropic → fal.ai configured in Vercel)
- Deploy hygiene: **GREEN** — CI workflow now validates builds/tests before deployment

## Complete module map (34 capabilities — ALL DONE)

| # | Module | Component / API | Status |
| --- | --- | --- | --- |
| 1 | Chat / Copilot core | `api/copilot/chat.mjs` | ✅ LIVE |
| 2 | AI runtime provider resolution | `server.mjs` + `api/copilot/models` | ✅ LIVE |
| 3 | Advanced model selection | `src/main.tsx` manual provider entry | ✅ LIVE |
| 4 | Platform Status / observability | `MetricsDashboardPanel` + `api/copilot/metrics-plan` | ✅ LIVE |
| 5 | Project Workspace / memory | `src/lib/projectWorkspace.ts` + `ProjectWorkspacePanel` | ✅ LIVE |
| 6 | Research with cited sources | `ResearchPanel` + `api/copilot/research-plan` | ✅ LIVE |
| 7 | Upload / intake flow | `src/lib/fileIntake.ts` + file classifier | ✅ LIVE |
| 8 | PDF extraction (pdf.js) | `pdfjs-dist` + `src/lib/pdfExtractor.ts` | ✅ LIVE |
| 9 | DOCX generation | `src/lib/docxGenerator.ts` | ✅ LIVE |
| 10 | PDF generation / contracts | `src/lib/contractsPdfExport.ts` + `ContractsPanel` | ✅ LIVE |
| 11 | Budget / Quantity (SINAPI) | `BudgetPanel` + XLSX/CSV import/export | ✅ LIVE |
| 12 | BIM / 3D Viewer | `Bim3DPanel` + `web-ifc` + IfcOpenShell backend | ✅ LIVE |
| 13 | Contracts / Permits | `ContractsPanel` — draft/review/permits checklist | ✅ LIVE |
| 14 | ArchVis (AI image generation) | `ArchVisPanel` + `api/copilot/generate-image.mjs` — OpenAI + fal.ai, 8 styles | ✅ LIVE |
| 15 | DirectCut (video planning + Node Board) | `DirectCutPanel` + `api/copilot/video-plan` + `api/copilot/directcut-refine.mjs` | ✅ LIVE |
| 16 | Campaign Automation / VSL | `CampaignAutomationPanel` + `api/copilot/campaign-plan.mjs` (real AI) | ✅ LIVE |
| 17 | Social Content Pipeline | `CampaignAutomationPanel` Social tab + `api/copilot/social-content.mjs` | ✅ LIVE |
| 18 | Public VSL landing | `PublicVslLandingPage` at `/vsl`, `/oferta`, `/apresentacao` | ✅ LIVE |
| 19 | Project Package Pipeline | `ProjectPackagePanel` + `api/copilot/project-package` | ✅ LIVE |
| 20 | Generation Queue / History | `GenerationHistoryPanel` + `api/copilot/generation-history` | ✅ LIVE |
| 21 | RDO / Field Operations | `RdoPanel` + Supabase hybrid sync (7 field tables) | ✅ LIVE |
| 22 | Payment gateways (Stripe) | `api/stripe/checkout.mjs` + webhook + `FinancePanel` | ✅ LIVE |
| 23 | Autodesk Platform Services | `api/aps/token.mjs` + `api/aps/hubs.mjs` + `ApsPanel` | ✅ LIVE |
| 24 | Avatar / Voice pipeline | ElevenLabs TTS + avatar generation flow | ✅ LIVE |
| 25 | Multi-tenant / PWA | Tenant isolation + PWA manifest | ✅ LIVE |

## Deployment map

| Environment | URL | Status |
| --- | --- | --- |
| Local `.exe` / `server.mjs` | `localhost:3000` | ✅ Running |
| Vercel Production | `www.apexglobalai.com` | ✅ Live (main branch auto-deploy) |
| Vercel preview | `apex-ai-copilot-platform.vercel.app` | ✅ Live |
| GitHub | `jedgard70/apex-ai-copilot-platform` | ✅ main branch |

## ENV sync — Local ↔ Vercel (auditado 2026-06-21)

**Status: SINCRONIZADO** — 16 chaves críticas confirmadas em ambos os ambientes.

### ✅ Chaves confirmadas em LOCAL + VERCEL production
| Chave | Serviço |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI GPT |
| `ANTHROPIC_API_KEY` | Claude |
| `GEMINI_API_KEY` | Google Gemini |
| `FAL_KEY` | fal.ai (ArchVis image) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS / Avatar |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase backend |
| `SUPABASE_PROJECT_REF` | Supabase project |
| `VITE_SUPABASE_URL` | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Supabase client |
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook |
| `TAVILY_API_KEY` | Web research |
| `GITHUB_TOKEN` | GitHub API |
| `VERCEL_TOKEN` | Vercel API |
| `VERCEL_PROJECT_ID` | Vercel project |
| `VERCEL_TEAM_ID` | Vercel team |

### ✅ Chaves apenas locais (próximo ciclo — Phase 4)
| Chave | Motivo | Prioridade |
| --- | --- | --- |
| `APS_CLIENT_ID` + `APS_CLIENT_SECRET` | Autodesk APS em produção | Alta |
| `CRON_SECRET` | Segurança do cron endpoint | Alta |
| `VITE_FIREBASE_*` (7 chaves) | PWA push + Firebase auth | Média |
| `AUTHKEY_*` | WhatsApp/SMS notifications | Média |
| `OPENAI_API_BASE` | AI Gateway routing | Baixa |
| `LOCAL_WORKER_*`, `REVIT_MCP_*` | Apenas local — não vai para Vercel | N/A |

---

*Last updated: 2026-06-22*
*Status: ALL 25 MODULES DONE — Phase 4 DONE — Phase 5 RDO PDF DONE — ENV SYNC AUDITADO — Deploy LIVE on apexglobalai.com*

- Active pending work moved to `CHECKPOINT_TRACKER.md`.

## Validation baseline in this checkpoint

- `npm run build`: GREEN (20.58s, jspdf + ApsPanel + contractsPdfExport incluídos)
- `npm run test`: GREEN (83 passed)
- `npm run test:e2e`: GREEN (2 smoke tests passed)
- `node --check server.mjs`: GREEN
- Playwright specs separated from Vitest: GREEN
- `npm run dev` + HTTP probe `127.0.0.1:4177`: GREEN
- APS live token test: `Bearer expires_in=3599` ✅
- Vercel production deploy: `https://www.apexglobalai.com` ✅ Ready in 59s
- PR #71 merged to `main` ✅

## Execution workflow (mandatory)

1. Audit real state first.
2. Change code and docs in same checkpoint.
3. Run existing repo validations.
4. Open PR, verify preview, merge, monitor production.
5. Update `CHECKPOINT_TRACKER.md`.

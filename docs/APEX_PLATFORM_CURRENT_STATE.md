# APEX Platform — Unified Current State

Checkpoint: CP-LIVE-3 — Phase 3 FINAL
Last update: 2026-06-21

## Canonical rule

For execution tracking, use **only** `CHECKPOINT_TRACKER.md`.

This file is a unified read-only snapshot (no duplicated trackers).

## Executive status

- Platform core status: **GREEN**
- Build/typecheck: **GREEN**
- Tests: **GREEN** (83 passed)
- AI runtime configuration: **GREEN** (`server.mjs` now loads `.env.local`/`.env` before boot)
- Model/provider diagnostics: **GREEN** (Gateway/Gemini availability now follows actual configured runtime paths)
- Advanced model access: **GREEN** (manual provider/model entry available for Gateway, OpenRouter and Gemini paths)
- Platform Status / observability view: **GREEN (shared runtime)** for Sentry/Vercel/provider-path visibility
- Campaign / VSL planning: **GREEN (shared runtime)** through Campaign Automation
- Public VSL standalone route: **GREEN** (`/vsl`, `/oferta`, `/apresentacao`)
- Playwright smoke validation: **GREEN** (`npm run test:e2e` passes with the build step separated from the Playwright webServer startup)
- Live project memory: **GREEN** (workspace profile persisted and injected into Apex chat context)
- Live web research with citations: **GREEN** (Research Studio searches live public sources and exports cited proposal support)
- Project package pipeline: **GREEN** (shared package studio consolidates briefing, budget, research, contracts and execution schedule)
- Generation queue/history: **GREEN** (shared panel + backend summary track saved image/video-plan/export/package runs per project)
- Phase 1: **completed**
- Phase 2: **completed**
- Phase 3: **100% completed — all connectors active**

## Unified module and connector status

| Area | Status | Objective evidence |
| --- | --- | --- |
| Chat/Copilot core | REAL 100% | `server.mjs`, `api/copilot/chat.mjs`, runtime active |
| AI runtime provider resolution | REAL 100% (shared runtime) | `server.mjs` loads env on boot, filters unconfigured model paths and routes Gemini through OpenRouter when configured |
| Advanced model selection | REAL 100% (shared runtime) | `src/main.tsx` supports manual provider/model entry for Gateway, OpenRouter and Gemini paths |
| Platform Status / provider diagnostics | REAL 100% (shared runtime) | `MetricsDashboardPanel` + `/api/copilot/metrics-plan` show Sentry/Vercel/Gateway/Gemini status from current runtime |
| Project Workspace memory | REAL 100% (local persistent scope) | `src/lib/projectWorkspace.ts`, `ProjectWorkspacePanel`, persistent client/project brief injected into chat runtime |
| Research with cited sources | REAL 100% (shared runtime) | `server.mjs` live RSS search path + `ResearchPanel` clickable citations and cited proposal export |
| Project package pipeline | REAL 100% (shared runtime) | `ProjectPackagePanel` + `/api/copilot/project-package` consolidate saved workspace evidence into a complete delivery bundle status |
| Generation queue / history | REAL 100% (shared runtime) | `GenerationHistoryPanel` + `/api/copilot/generation-history` summarize saved ArchVis, DirectCut, Export Center and package runs from Project Workspace |
| Campaign Automation / VSL | REAL 100% (shared runtime, planning mode) | `CampaignAutomationPanel` + `/api/copilot/campaign-plan` generate social campaign pack plus VSL/video-sales landing blueprint |
| Public VSL landing | REAL 100% (public route) | `PublicVslLandingPage` exposed through `/vsl`, `/oferta`, `/apresentacao` with CTA/video/legal query params and UTM preservation |
| Upload/intake flow | REAL 100% | Active flow with file classification + extraction |
| PDF extraction (pdf.js) | REAL 100% | `pdfjs-dist`, `src/lib/pdfExtractor.ts`, `src/pdfViewer.js` |
| DOCX generation | REAL 100% | `src/lib/docxGenerator.ts`, contracts export |
| PDF generation | REAL 100% | `src/lib/contractsPdfExport.ts`, `ContractsPanel` PDF download action |
| XLSX/SINAPI flow | REAL 100% | Budget import/export and SINAPI mapping active |
| BIM/IFC viewer flow | REAL 100% (current local scope) | `web-ifc` + BIM panel path active |
| IfcOpenShell | CONNECTED (Python backend) | Python `ifcopenshell` installed/imported and runtime health endpoint `GET /api/ifc/ifcopenshell-status` active |
| Payment gateways (Stripe) | CONNECTED (runtime) | `api/stripe/checkout.mjs`, `api/stripe/webhook.mjs`, `api/stripe/status.mjs` and Finance panel checkout trigger |
| Autodesk Platform Services (APS) | CONNECTED (2-legged OAuth live) | `api/aps/status.mjs`, `api/aps/token.mjs`, `api/aps/hubs.mjs`; live token verified (`Bearer expires_in=3599`); `ApsPanel` UI; keys in Vercel production+preview |
| SaaS auth/database/payment real mode | PARCIAL | Local demo model still marks connectors as not connected |

## Historical bug baseline (already resolved)

- Previous attach/composer issue is closed in current runtime.
- `handleFile()` no longer auto-calls `askCopilot`.
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

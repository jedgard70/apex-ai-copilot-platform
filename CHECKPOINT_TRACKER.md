# Apex Module Validation Tracker

## Source of truth (do not re-ask)

Use this file as the canonical checkpoint snapshot for module/connectors status unless the Owner explicitly requests a new audit scope.

## Phase 1: Ready-Shell Chat Modules

**Status: 100% completed and validated.**

## Phase 2: Planned Modules (To Build)

**Status: completed and validated in current platform runtime.**

1. **BIM / 3D Viewer (Priority Zero)**: active (`Bim3DPanel`) with IFC/WebIFC path and internal import workflow messaging.
2. **Budget / Quantity (SINAPI integration)**: active (`BudgetPanel`) with SINAPI CSV/XLSX import and price-apply flow.
3. **Contracts / Permits**: active (`ContractsPanel`) with draft/review/permits checklist flows.
4. **Marketing / Website (Page generator)**: active in tooling via `marketing-generate` action (`scripts/execute-skill-action.mjs`).

## Phase 3: External Connectors

| Connector | Current status | Evidence |
| --- | --- | --- |
| IfcOpenShell | **Connected (Python backend active)** | Python `ifcopenshell` installed and import validated; runtime endpoint `GET /api/ifc/ifcopenshell-status` confirms live status. |
| pdf.js | **Connected (real)** | `pdfjs-dist` dependency + `src/lib/pdfExtractor.ts` and `src/pdfViewer.js` in active flow. |
| DOCX/PDF generator | **Connected (real)** | DOCX export active and PDF export wired in contracts flow (`src/lib/contractsPdfExport.ts`, `ContractsPanel` Download PDF action). |
| Payment gateways | **Connected (Stripe active)** | Stripe checkout/webhook + `GET /api/stripe/status` + Finance panel real checkout trigger + keys in Vercel production. |
| Autodesk Platform Services (APS) | **Connected (2-legged OAuth live)** | `api/aps/token.mjs`, `api/aps/status.mjs`, `api/aps/hubs.mjs`; live token test: `Bearer expires_in=3599`; `ApsPanel` UI; APS keys in Vercel production+preview+development. |

## Sequential improvement modules

1. **Project / Client memory**: **completed** — persistent project profile is now saved in Project Workspace and injected into Apex chat context in both local app and web runtime.
2. **Web research with cited sources**: **completed** — Research Studio now performs live public web search, attaches clickable citations, and exports source-backed proposal text in both local app and `apexglobalai.com`.
3. **Project package pipeline**: **completed** — Project Package Pipeline now consolidates project memory, saved budget/research/contracts exports, execution gaps and physical-financial schedule draft in both local app and shared web runtime.
4. **Generation queue / history**: **completed** — a shared Generation Queue / History panel now tracks ArchVis images, DirectCut plans, Export Center packages and Project Package runs from the persisted Project Workspace in both local app and web runtime.

## Current live hardening

1. **AI runtime configuration**: **completed** — `server.mjs` now loads local env before boot through `server/env.mjs`, so `.env.local` model/provider keys are available in the shared runtime.
2. **Model/provider truthfulness**: **completed** — model picker now defaults to a valid gateway model, only exposes configured Gateway/Gemini paths from `/api/copilot/models`, routes Gemini requests through OpenRouter when configured, and supports manual advanced provider/model entry for Gateway, OpenRouter and Gemini paths.
3. **Platform Status / observability visibility**: **completed (shared runtime)** — Platform Status now reports Sentry frontend/backend, Vercel runtime detection, Gateway model path and Gemini model path state.
4. **Automated validation split**: **completed** — Vitest no longer tries to execute Playwright specs; repo validation stays green with `npm run build`, `npm test` and `node --check server.mjs`.
5. **Playwright smoke layer**: **completed** — smoke suite is green; `npm run test:e2e` now builds first and Playwright starts only the shared Node runtime, removing the previous Windows browser/webserver hang.
6. **Campaign / VSL conversion flow**: **completed (shared runtime)** — Campaign Automation now also generates a VSL/video-sales landing blueprint with urgency bar, player behavior, CTA destination, proof/footer structure and tracking checklist based on Apex runtime prompts.
7. **Public VSL standalone route**: **completed** — public landing route is now available at `/vsl` with aliases `/oferta` and `/apresentacao`, preserving UTM parameters on CTA and supporting configurable video/CTA/legal links for real campaigns.
8. **Online campaign/VSL API parity**: **completed** — `/api/copilot/campaign-plan` now exists in the serverless web runtime so VSL/campaign planning works online, not only in `server.mjs`.
9. **RDO Supabase persistence**: **completed (hybrid sync)** — Field Operations / RDO now keeps the local Project Workspace save and, when Supabase auth + tenant bootstrap are ready, syncs the same report to `rdos` plus field child tables (`rdo_activities`, `field_issues`, `punch_items`, `field_photos`, `safety_checklists`, `quality_checklists`, `corrective_actions`).

---

*Last updated: 2026-06-21*
*Status: Phase 1 + Phase 2 + Phase 3 validated, 4 sequential improvement modules completed, current runtime hardening applied to AI providers + Platform Status, Playwright smoke validation is green, RDO now syncs to Supabase field tables in hybrid mode, Campaign Automation expanded with VSL conversion planning, and public VSL route + online API parity delivered.*

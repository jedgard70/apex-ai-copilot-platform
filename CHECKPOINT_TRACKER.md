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

---

*Last updated: 2026-06-20*
*Status: Phase 1 + Phase 2 + Phase 3 — ALL connectors executed and validated.*

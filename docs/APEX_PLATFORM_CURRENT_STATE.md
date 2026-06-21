# APEX Platform — Unified Current State

Checkpoint: CP-LIVE-3 — Phase 3 FINAL
Last update: 2026-06-20

## Canonical rule

For execution tracking, use **only** `CHECKPOINT_TRACKER.md`.

This file is a unified read-only snapshot (no duplicated trackers).

## Executive status

- Platform core status: **GREEN**
- Build/typecheck: **GREEN**
- Tests: **GREEN** (83 passed)
- Phase 1: **completed**
- Phase 2: **completed**
- Phase 3: **100% completed — all connectors active**

## Unified module and connector status

| Area | Status | Objective evidence |
| --- | --- | --- |
| Chat/Copilot core | REAL 100% | `server.mjs`, `api/copilot/chat.mjs`, runtime active |
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

# Apex Module Audit

Audit date: 2026-06-15

Repo: `D:\AI-constr\apex-ai-copilot-platform`

Branch: `feature/image-generation-connector`

Commit audited: `7a788f2`

Status legend: GREEN = functioning with current proof; YELLOW = implemented with restriction/bug; RED = missing, broken, or unproven.

## H1-H22 Detailed Audit

| Module | Status | Evidence checked | Audit result |
|---|---|---|---|
| H1 Universal File Intake | YELLOW | `src/lib/fileIntake.ts`, `src/main.tsx` | File classification exists for image/PDF/BIM/video/spreadsheet/document/unknown. Bug: upload immediately calls chat execution. |
| H2 ArchVis / Humanizacao | YELLOW | `ArchVisPanel`, `archvisPromptLibrary.ts`, `/api/copilot/generate-image` | Image prompt/generation workflow exists, but provider QA and source fidelity remain open. |
| H3 DirectCut / Video | YELLOW | `DirectCutPanel`, `/api/copilot/video-plan` | Script/storyboard/video planning exists. No real video renderer connected. |
| H4 BIM / 3D Viewer | RED/YELLOW | `Bim3DPanel`, BIM routes | Studio exists and correctly labels parser/renderer as not connected. Real IFC geometry rendering is not GREEN. |
| H5 Budget / Quantity | YELLOW | `BudgetPanel`, `budgetKnowledge.ts`, budget route | Preliminary estimate workspace exists with confidence/source labels. Real SINAPI/XLSX automation is not complete. |
| H6 Contracts / Permits | YELLOW | `ContractsPanel`, `contractsKnowledge.ts`, contracts route | Draft/review/checklist workspace exists. Automatic DOCX/PDF artifact generation is not complete. |
| H7 Field Operations | YELLOW | `FieldOpsPanel`, field route | RDO/client/safety/quality report planning exists with evidence labels. Needs real field/photo QA. |
| H8 Marketing / Website | YELLOW | `toolData.ts`, runtime knowledge | Marketing/website prompts exist. No dedicated execution pipeline proof. |
| H9 Platform Build Support | YELLOW | platform engineering route/knowledge | Useful for planning and repo checks. Mutations remain approval-gated. |
| H10 Coding Support | YELLOW | code executor plan/status endpoints, coding knowledge | Can plan/validate; not autonomous code write executor. |
| H11 Data Analysis | YELLOW | data knowledge, dashboard/metrics panels | Local/demo analytics exist; source-backed analytics engine is incomplete. |
| H12 Academic Research | YELLOW | research knowledge | General workflow exists; not a connected academic source system. |
| H13 Visual Design | YELLOW | visual design/image prompt knowledge | Needs provider output QA. |
| H14 Negotiation | YELLOW | negotiation knowledge | Text workflow only; no CRM/contract execution proof. |
| H15 Tech Support | YELLOW | Local Worker status, Windows Care routing | Audit-only diagnostics concept; real local PC repair requires worker approval path. |
| H16 Writing / Humanizer | GREEN/YELLOW | runtime conversation router | Text generation route exists; quality/localization issues still appear in fallbacks. |
| H17 Interior / Room Design | YELLOW | interiors knowledge, ArchVis adjacent | No dedicated interior execution surface. |
| H18 Website AI Designer | YELLOW | website/marketing triggers | Can draft website/copy, but not a full builder/deploy path. |
| H19 Revit Customization | YELLOW/RED | Revit knowledge, H5 status classification | Guidance/code generation can be prepared; no real Revit MCP bridge or Revit-side test. |
| H20 Research / Market Intelligence | YELLOW | `ResearchPanel`, `/api/copilot/source-evidence` | Source-aware planning exists; current prices/SINAPI need live/user source verification. |
| H21 International Market Strategy | GREEN/YELLOW | `APEX_INTERNATIONAL_MARKET_STRATEGY.md`, strategy knowledge | Strategy is documented. Execution workflows remain manual/local-first. |
| H22 Platform Engineering / DevOps | YELLOW | connector status, controlled executor, `vercel.json` | Read-only status/check paths exist. Deploy/migration/write operations require explicit approval and proof. |

## M2 PDF

Status: RED/YELLOW.

Evidence:

- `fileIntake.ts` classifies PDFs.
- `src/main.tsx` creates preview URLs for image/PDF.
- Skill Update supports PDF metadata/text when supplied.

Open issues:

- No robust PDF text extraction pipeline is proven.
- Upload can auto-execute before the user sends the prompt.
- 0-byte/stale-file behavior is consistent with current attach/composer race.
- "Resuma" can be sent before extraction is complete.
- Extracted context is not reliably guaranteed into `/api/copilot/chat`.

Acceptance:

- PDF attach remains pending until send.
- UI shows extraction progress and blocks summary until complete.
- Extracted page/text count is visible.
- Copilot response cites the active extracted PDF context.
- Old/stale PDF cannot leak into a new prompt.

## M3 DOCX / PDF Documents

Status: YELLOW.

Evidence:

- `ContractsPanel` can generate contract drafts, reviews, permit checklists, risk reports, and scope text.
- `/api/copilot/contracts-plan` exists in the local server.

Open issues:

- "Gerar proposta DOCX" opens Contracts Studio but still depends on manual button interaction.
- No automatic DOCX artifact writer is proven.
- No final PDF/DOCX export validation was run.

Acceptance:

- Chat intent opens Contracts Studio and creates first draft automatically.
- DOCX-ready content is generated without asking the user to click a second button.
- Exported artifact has project name, scope, assumptions, evidence, and review disclaimer.

## M5 Budget XLSX / SINAPI

Status: YELLOW.

Evidence:

- `BudgetPanel` has estimate items, sections, currency/unit controls, pricing source labels, proposal text, JSON export, copy-table behavior, and source confidence.
- `budgetKnowledge.ts` explicitly tracks `sinapiStatus`.

Open issues:

- "Gerar orçamento XLSX com BDI" can still fall into non-execution/commercial fallback.
- No real XLSX writer is proven in the app.
- SINAPI live connector is not connected; uploaded SINAPI source handling is not proven.

Acceptance:

- Chat intent opens Budget Studio and creates initial estimate automatically.
- BDI and assumptions are explicit.
- XLSX-ready export exists and is validated.
- SINAPI status is one of: uploaded source, live connector, or not-connected; never fake.

## M6 IFC BIM Viewer

Status: RED.

Evidence:

- `Bim3DPanel` routes IFC/GLB/GLTF/OBJ/STL/FBX to viewer workflow.
- The panel currently states loader/parser/renderer is not connected and no model is faked.

Open issue:

- Real IFC loading failed in testing with `web-ifc.wasm`: `Aborted(both async and sync fetching of the wasm failed)`.

Acceptance:

- `web-ifc.wasm` is served from the correct path in dev and production.
- `LINS.ifc` loads into a real viewer.
- Geometry, object tree, model metadata, and errors are visible.
- If parsing fails, the UI displays exact failure and keeps the report evidence-labeled.

## Revit / MCP

Status: RED/YELLOW.

Revit customization knowledge exists, and the H5 tool classifier can route Revit status checks. A real Revit MCP bridge, local desktop connector, model inspection command, and Revit-side validation are not implemented/proven.

## Local Worker

Status: YELLOW.

`local-worker/server.mjs` and `local-worker/README.md` define a token-authenticated 127.0.0.1 worker with allowlisted actions and binary discovery. It is not GREEN until it is configured, reachable from the backend path, and validated with health/build/git checks.

## Supabase

Status: YELLOW.

Supabase client, auth bootstrap, storage helper, migrations, and hybrid sync adapter exist. Remote restore is not complete because `loadProjectRemote` returns `metadata-loader-not-implemented`. Prior UI sync indicators should not be treated as proof unless `projects` and `project_files` rows are confirmed.

## Vercel

Status: YELLOW.

The public domain responded `200 OK`. `vercel.json` is static build oriented (`dist`). Production API routes and custom `server.mjs` behavior are not fully proven from this audit.

## GitHub

Status: GREEN/YELLOW.

Local Git baseline is available through GitHub Desktop bundled Git. Connector code can perform read-only GitHub status checks when token/env is configured. No push, PR merge, or remote mutation was performed.

## Cron

Status: RED.

No `api/cron` directory/files were found in this checkout. Cron upgrade watcher is a roadmap item, not a proven route.

## Image Generation

Status: YELLOW.

ArchVis and server image generation paths exist. Real generation/editing requires configured provider key and QA against source image constraints.

## Self-Upgrade

Status: YELLOW.

Skill Update, Skill Export, platform engineering routing, code-executor planning, and validation scripts exist. The final self-upgrade loop is not autonomous: approved patch application, validation, rollback, and deployment remain gated.


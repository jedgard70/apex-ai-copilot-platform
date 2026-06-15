# Apex Platform Current State

Audit date: 2026-06-15

Repo: `D:\AI-constr\apex-ai-copilot-platform`

Branch: `feature/image-generation-connector`

Commit audited: `7a788f2`

Worktree at audit start: clean (`git status --short` returned no files)

Production domain: `https://www.apexglobalai.com`

Deploy status: YELLOW. The public domain responded `200 OK` to a HEAD request during this audit, and the repo has `vercel.json` with `buildCommand: npm run build` and `outputDirectory: dist`. Full production API health is not GREEN because the custom `server.mjs` runtime is not proven as production serverless API infrastructure and no production `/api/copilot/*` endpoint test was completed in this pass.

## GREEN / YELLOW / RED Definitions

GREEN = implemented and validated by current source plus local command or live evidence.

YELLOW = implemented or routed in source, but limited by missing connector, missing end-to-end proof, UX gap, production uncertainty, or known integration bug.

RED = not implemented, broken, blocked, or explicitly documented as not connected.

## Runtime And Env Vars

The requested env var names are part of the intended runtime surface:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ID`
- `VERCEL_TEAM_ID`
- `GITHUB_TOKEN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `CRON_SECRET`

Audit note: secret values were not printed or copied. Source shows browser Supabase uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; backend connector status checks use token presence without exposing values.

## Current Platform Summary

| Area | Status | Evidence | Caveat |
|---|---|---|---|
| Vite/React/TypeScript app | GREEN | `package.json`, `vite.config.ts`, `src/main.tsx` | Build validation still required after doc edits |
| Custom local backend | GREEN local / YELLOW production | `server.mjs` serves `dist` and routes `/api/copilot/*` locally | Vercel production API shape not fully proven |
| Main chat shell | YELLOW | `src/main.tsx`, `/api/copilot/chat`, production-safe router | Upload and some fallback/auto-execution bugs remain |
| Owner Console | YELLOW | `Owner Console` drawer in `src/main.tsx` | Owner-only UX exists, but production auth/API proof is incomplete |
| Copilot Execution Panel | GREEN local foundation / YELLOW operator vision | `CopilotExecutionPanel`, allowlisted commands in `server.mjs` | Raw shell remains approval-gated; Local Worker integration is not fully proven |
| GitHub/Vercel read-only connectors | GREEN for code path / YELLOW live certainty | `server/agent/connectorsStatus.mjs`, H5 validations | Live status depends on configured tokens and network/API permissions |
| Supabase auth/client | YELLOW | `supabaseClient.ts`, `supabaseAuthBootstrap.ts`, migrations | Remote restore and table-level persistence proof remain incomplete |
| Project Workspace | YELLOW | localStorage workspace plus hybrid sync adapter | `loadProjectRemote` returns `metadata-loader-not-implemented` |
| Export Center | YELLOW | `ExportCenterPanel`, `/api/copilot/export-package` | Exports only local workspace state; not a complete document pack system |
| Image generation/edit | YELLOW | `ArchVisPanel`, `/api/copilot/generate-image`, OpenAI image paths in `server.mjs` | Requires real provider QA and plan-preservation checks |
| Local Worker | YELLOW | `local-worker/server.mjs`, `local-worker/README.md` | Must be configured and connected through `LOCAL_WORKER_URL`/token |
| Revit MCP/desktop | RED/YELLOW | H5 status route exists for `revit_mcp.status` | No real Revit MCP bridge, model inspection, or desktop action proof |
| Cron upgrade watcher | RED | No `api/cron` files found | Cron/self-upgrade concepts exist as roadmap, not implemented cron route |
| Self-upgrade planner | YELLOW | Skill Update/Export, platform engineering routes | Planner exists, autonomous upgrade execution is not complete |
| Code change executor | YELLOW | `code-executor` plan/status endpoints and allowlist model | Real code mutations require approval and are not autonomous end-to-end |
| Validation/rollback engine | YELLOW | policy, controlled executor, rollback notes in skill update | No generalized rollback engine for all actions |

## H1-H22 Matrix

The repo does not contain a single canonical H1-H22 registry. This matrix maps H1-H22 to the audited tool/module surface in `src/lib/toolData.ts`, runtime knowledge, components, and server routes.

| Module | Status | Evidence | Notes |
|---|---|---|---|
| H1 Universal File Intake | YELLOW | `fileIntake.ts`, `src/main.tsx` | Accepts file classes, but upload currently auto-executes |
| H2 ArchVis / Humanizacao | YELLOW | `ArchVisPanel`, image generation endpoint | Real provider QA and fidelity checks still required |
| H3 DirectCut / Video | YELLOW | `DirectCutPanel`, `/api/copilot/video-plan` | Planning output exists; real video rendering is not connected |
| H4 BIM / 3D Viewer | RED/YELLOW | `Bim3DPanel`, `/api/copilot/bim-plan` | Panel reports parser/renderer not connected; no real IFC geometry loaded |
| H5 Budget / Quantity | YELLOW | `BudgetPanel`, `/api/copilot/budget-plan` | Preliminary estimate workspace; SINAPI/database not connected |
| H6 Contracts / Permits | YELLOW | `ContractsPanel`, `/api/copilot/contracts-plan` | Draft/checklist support, not legal approval or automatic DOCX |
| H7 Field Operations | YELLOW | `FieldOpsPanel`, `/api/copilot/fieldops-plan` | Local evidence-labeled reports; no field connector |
| H8 Marketing / Website | YELLOW | tool registry/runtime knowledge | Content workflow exists, no dedicated production marketing automation proof |
| H9 Platform Build Support | YELLOW | platform engineering knowledge/routes | Planning and checks exist; write execution remains gated |
| H10 Coding Support | YELLOW | coding knowledge, code executor plan endpoints | No free autonomous code execution without approval |
| H11 Data Analysis | YELLOW | data knowledge, spreadsheet triggers | No full analytics engine/dashboard source proof in this repo |
| H12 Academic Research | YELLOW | research tool/data knowledge | General assistant capability, not a source-connected academic workflow |
| H13 Visual Design | YELLOW | visual design/image prompt knowledge | Image provider QA remains open |
| H14 Negotiation | YELLOW | negotiation knowledge | Content generation path, no external CRM proof |
| H15 Tech Support | YELLOW | tech support route, Local Worker status concept | Diagnostics require configured Local Worker |
| H16 Writing / Humanizer | GREEN/YELLOW | runtime/router knowledge | Text output path exists; quality remains product QA |
| H17 Interior / Room Design | YELLOW | interiors knowledge, ArchVis adjacent | No dedicated renderer or source-grounded interior engine |
| H18 Website AI Designer | YELLOW | website/marketing tool data | No separate website builder surface |
| H19 Revit Customization | YELLOW/RED | Revit knowledge, H5 status route | Generates guidance/code plans, but no real Revit MCP/plugin execution proof |
| H20 Market Intelligence | YELLOW | `ResearchPanel`, source evidence endpoint | Requires live/source-backed verification for current market data |
| H21 International Market Strategy | GREEN/YELLOW | `APEX_INTERNATIONAL_MARKET_STRATEGY.md`, knowledge module | Strategic doc exists; execution pipeline still manual |
| H22 Platform Engineering / DevOps | YELLOW | connector status, controlled executor, Vercel docs | Read-only/status paths exist; deploy/migration/write actions need approval |

## M2 / M3 / M5 / M6 Matrix

| Module | Status | Real current state | Open blocker |
|---|---|---|---|
| M2 PDF extraction | RED/YELLOW | PDF is classified and preview URL can be created, but no robust PDF text extraction pipeline is proven | 0-byte/stale-file race, extraction timing, missing context handoff |
| M3 DOCX/PDF documents | YELLOW | Contracts Studio can draft/review/checklist in UI and server planner | DOCX generation is not automatic from chat intent |
| M5 Budget XLSX/SINAPI | YELLOW | Budget Studio can generate preliminary estimates and export/copy table-like text/JSON | No real automatic XLSX export/SINAPI connector; chat may fall back |
| M6 IFC BIM Viewer | RED | IFC is routed to BIM/3D Studio, but source states parser/renderer connector is not connected | `web-ifc.wasm` loading/rendering must be fixed and proven with real IFC |

## Open Bugs

- Upload/attach currently triggers `askCopilot('', intake)` immediately after `setActiveFile(intake)`.
- Composer/attach state can retain stale files and create old-PDF/0-byte context confusion.
- PDF extraction is not completion-gated before follow-up prompts such as "resuma".
- Extracted PDF context is not reliably passed to Copilot.
- English upload fallback still exists in `src/main.tsx`.
- Contracts Studio opens for DOCX/document intent but still expects manual button clicks.
- Budget Studio opens or falls through inconsistently for automatic XLSX/SINAPI budget intent.
- IFC viewer is not a real geometry renderer yet; WASM/path/server setup remains a blocker.
- Right-side panels can squeeze chat; one-active-panel drawer behavior is not fully resolved.
- Some responses still over-explain instead of executing approved actions.

## Next Priorities

1. Fix attach/composer/side-panel UX first.
2. Stabilize M2 PDF extraction and context handoff.
3. Make M3 chat intent generate the first document draft automatically.
4. Make M5 chat intent create the first budget/XLSX-ready draft automatically.
5. Fix M6 IFC/WebAssembly serving and prove real IFC rendering.
6. Connect Local Worker/Operator for real approved execution with evidence.
7. Add Revit MCP only after Local Worker safety and evidence model are stable.


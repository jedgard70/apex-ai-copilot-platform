# Apex Evidence Register

Generated: 2026-06-13

## Command Evidence

| Evidence | Result | Status |
|---|---|---|
| `git status --short` in `D:\AI-constr\apex-ai-copilot-platform` | Pre-existing modified/untracked continuity docs were present before this package | COMPROVADO |
| `git branch --show-current` | `feature/image-generation-connector` | COMPROVADO |
| `git rev-parse HEAD` | `8a38dd58d51f001e612c2228d2b1ce92c32f7623` | COMPROVADO |
| `rg --files docs` | Existing docs include continuity, Supabase, Vercel, platform engineering, and legacy coverage reports | COMPROVADO |
| `rg --files D:\AI-constr\APEX_AI_COPILOT_HANDOFF` | Handoff package contains current state, handoff, paths, next steps, new chat prompt, API artifacts, and zips | COMPROVADO |
| `rg --files D:\AI-constr\apex-ai-copilot-production-brain` | Production brain contains exports, skill package, references, API artifacts, and production index | COMPROVADO |
| Backup metadata scan | `D:\documentos\backup AI edgard` has strategic directories and mixed file types | LOCAL-FIRST |
| Backup secret-name scan | Found only `.env.example` inside scoped backup root by key/token/secret/password/env name scan | COMPROVADO within scoped backup |
| CP15X-C `git status --short` start | Clean working tree before routing changes | COMPROVADO |
| CP15X-C alias smoke test | `status da plataforma`, `continuar checkpoint`, `code skill`, `meu PC está lento`, `configurar Revit`, `mostrar agentes` matched local routing patterns | COMPROVADO |
| CP15X-C `npm.cmd run build` | Vite/TypeScript production build passed; chunk-size warning only | COMPROVADO |
| CP15X-C `node --check server.mjs` | Server syntax check passed | COMPROVADO |
| CP15X-C Browser/Playwright attempt | Chromium executable was not installed locally; no browser download was performed | BLOQUEANTE for browser UI proof |

## File Evidence

| File | Evidence captured | Status |
|---|---|---|
| `package.json` | Vite/React/TypeScript app, scripts `build`, `start`, `validate:supabase-sql`; Supabase dependency present | COMPROVADO |
| `.gitignore` | Ignores `node_modules`, `dist`, `.env`, `.env.local`, `.env.*.local`, `supabase/.temp/`, `.vercel/` | COMPROVADO |
| `.env.example` | Documents empty `OPENAI_API_KEY`, Supabase vars, server-only service-role placeholder | COMPROVADO |
| `vercel.json` | Build command `npm run build`, output directory `dist` | COMPROVADO |
| `server.mjs` | Reads runtime knowledge, includes `raw_shell` approval text, chat/image/file/connector logic | COMPROVADO |
| `src/lib/runtimeKnowledge.json` | States no-fake parsing/viewer rules, chat-first behavior, source-truth constraints, tool domains | COMPROVADO |
| `src/lib/supabaseClient.ts` | Browser Supabase client depends on Vite env vars | COMPROVADO |
| `src/main.tsx` | CP15X-C routes existing operational aliases to Owner Console, Copilot Execution, local planning responses and AgentsPanel without new panels | LOCAL-FIRST |
| `src/lib/toolData.ts` / `src/lib/toolRegistry.ts` | CP15X-C adds registry aliases for Owner Command, Skill Export and Windows Care plus expanded Platform/Copilot Execution triggers | LOCAL-FIRST |
| `docs/VERCEL_PRODUCTION_READINESS.md` | Prior readiness doc exists and references build/env/deploy checks | LOCAL-FIRST |
| `docs/SUPABASE_*` | Supabase planning, apply, storage, rollback, and hardening docs exist | LOCAL-FIRST |

## External Source Evidence

| Source | Evidence | Status |
|---|---|---|
| `D:\AI-constr\APEX_AI_COPILOT_HANDOFF\APEX_AI_COPILOT_HANDOFF.md` | States chat is the platform, modules are tools, old platform patching rejected, new project path is `apex-ai-copilot-platform` | COMPROVADO |
| `D:\AI-constr\APEX_AI_COPILOT_HANDOFF\APEX_AI_COPILOT_CURRENT_STATE.md` | States production brain/export pack/new platform status; lists what works and what does not work yet | COMPROVADO |
| `D:\AI-constr\APEX_AI_COPILOT_HANDOFF\APEX_AI_COPILOT_PATHS.md` | Lists production brain, exports, new platform, local audit, handoff folder; says old repos are source history only | COMPROVADO |
| `D:\AI-constr\APEX_AI_COPILOT_HANDOFF\APEX_AI_COPILOT_NEXT_STEPS.md` | Lists next runtime QA, image/planta QA, PDF/text extraction, IFC, CAD conversion, ArchVis, DirectCut, workspace, deployment planning | COMPROVADO |
| `D:\AI-constr\apex-ai-copilot-production-brain\APEX_AI_COPILOT_PRODUCTION_INDEX.md` | Reports 2929 processed sources, 1141 docs, 1485 code patterns, 277 image/render refs, 1546 obsolete sources | COMPROVADO |
| `D:\AI-constr\apex-ai-copilot-production-brain\APEX_AI_COPILOT_NEW_PLATFORM_BUILD_PLAN.md` | Defines Copilot core, universal intake, ArchVis, BIM/3D, DirectCut, project workspace, operational modules | COMPROVADO |
| `D:\AI-constr\apex-ai-copilot-production-brain\apex-ai-copilot\references\source-truth-index.md` | Defines reuse/rewrite/reference-only/obsolete/ignore matrix | COMPROVADO |
| `D:\documentos\backup AI edgard` | Metadata scan found old platform, docs, and Copilot skill backup material | LOCAL-FIRST |

## Evidence Limits

- No source content from backup was copied.
- No `.env.local` content was read or committed.
- No Supabase command was run.
- No Vercel command was run.
- No migration was applied.
- No build was run because this was docs-only.
- No production claim is made for model calls, image generation, Supabase, Vercel, IFC, CAD conversion, or PDF extraction.

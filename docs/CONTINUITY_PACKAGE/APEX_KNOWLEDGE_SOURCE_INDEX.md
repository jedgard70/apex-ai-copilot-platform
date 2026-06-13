# Apex Knowledge Source Index

Generated: 2026-06-13
Repo: `D:\AI-constr\apex-ai-copilot-platform`
Baseline checked: branch `feature/image-generation-connector`, commit `8a38dd58d51f001e612c2228d2b1ce92c32f7623`

## Executive Decision

`D:\AI-constr\apex-ai-copilot-platform` is the main candidate base for Apex AI Copilot.

`F:\AI-Construction-Intelligence-Platform` is inventory/reference only. It must not be treated as the current implementation without fresh local evidence.

`D:\documentos\backup AI edgard` is strategic/historical backup. It is useful for provenance, prompt libraries, module vocabulary, older schema ideas, and reference assets, but it must not be copied wholesale into the product.

## Source Classes

| Source | Status | Role | Evidence | Limit |
|---|---|---|---|---|
| `D:\AI-constr\apex-ai-copilot-platform` | COMPROVADO | Main candidate codebase | Git branch/commit checked locally; `package.json`, `server.mjs`, `src/lib/runtimeKnowledge.json`, docs present | Runtime/model QA not re-run in this documentation pass |
| `D:\AI-constr\APEX_AI_COPILOT_HANDOFF` | COMPROVADO | Continuity handoff and historical checkpoint | `APEX_AI_COPILOT_HANDOFF.md`, `APEX_AI_COPILOT_CURRENT_STATE.md`, `APEX_AI_COPILOT_PATHS.md`, `APEX_AI_COPILOT_NEXT_STEPS.md` read locally | Generated 2026-06-07; may be stale where repo changed after that date |
| `D:\AI-constr\apex-ai-copilot-production-brain` | COMPROVADO | Curated production brain and source-truth synthesis | `APEX_AI_COPILOT_PRODUCTION_INDEX.md`, `APEX_AI_COPILOT_NEW_PLATFORM_BUILD_PLAN.md`, `apex-ai-copilot/references/*` read locally | Large index output is triage, not direct production proof |
| `D:\documentos\backup AI edgard` | LOCAL-FIRST | Strategic/historical backup | Directory and file metadata scanned; extension counts and top-level structure recorded | No content import; no bulk copy; backup contains old platform material and must be triaged |
| `F:\AI-Construction-Intelligence-Platform` | PLANNING-ONLY | Inventory/reference decision named by Jose | Decision included by instruction | Path was not accessed in this pass; status is decision, not filesystem proof |

## Confirmed Local Candidate Stack

| Item | Status | Source |
|---|---|---|
| Vite + React + TypeScript | COMPROVADO | `package.json` dependencies/scripts |
| Local Node backend | COMPROVADO | `server.mjs`; `package.json` `start` script |
| Chat endpoint concept | COMPROVADO | `server.mjs` contains `/api/copilot/chat` routing evidence |
| Runtime knowledge layer | COMPROVADO | `src/lib/runtimeKnowledge.json`, `server.mjs` reads/writes it |
| Tool registry layer | COMPROVADO | `src/lib/toolRegistry.ts`, `src/lib/toolData.ts`, runtime knowledge |
| OpenAI-compatible env contract | COMPROVADO | `.env.example` includes `OPENAI_API_KEY`; `server.mjs` reads `OPENAI_API_KEY` and model envs |
| Vercel config file | COMPROVADO | `vercel.json` exists with build command and output directory |
| Supabase package and draft docs | COMPROVADO | `package.json`, `src/lib/supabaseClient.ts`, Supabase docs exist |
| Real Supabase deployment state | NAO COMPROVADO | Not touched by request |
| Real Vercel deployment state | NAO COMPROVADO | Not touched by request |

## Backup AI Edgard Triage Summary

Metadata-only scan of `D:\documentos\backup AI edgard` found strategic material in:

- `AI_CONSTRUCTION_PLATFORM`
- `docs plataforma`
- `skill APEXAICOPILOT`

Top extension counts observed:

| Extension | Count |
|---|---:|
| no extension | 103 |
| `.json` | 76 |
| `.css` | 66 |
| `.png` | 57 |
| `.txt` | 18 |
| `.md` | 17 |
| `.sql` | 11 |
| `.html` | 8 |
| `.docx` | 8 |
| `.ts` | 6 |
| `.tsx` | 4 |
| `.pdf` | 4 |
| `.zip` | 3 |

Decision: treat this backup as source inventory and historical reference only. Do not import code, migrations, env files, generated assets, or archives without a dedicated triage checkpoint.


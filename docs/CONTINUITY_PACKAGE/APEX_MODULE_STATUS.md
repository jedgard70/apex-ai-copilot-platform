# Apex Module Status

Generated: 2026-06-13

Updated: 2026-06-15 after auditoria H1-H22 + M2/M3/M5/M6. See `docs/APEX_MODULE_AUDIT.md` and `docs/APEX_PLATFORM_CURRENT_STATE.md` for the current source-of-truth status matrix.

## Product Core

| Module / area | Status | Evidence | Next validation |
|---|---|---|---|
| Copilot chat shell | LOCAL-FIRST | Handoff says chat-first UI exists; `server.mjs` contains chat endpoint/runtime logic | Start server and run text QA with real approved key |
| Runtime knowledge | COMPROVADO | `src/lib/runtimeKnowledge.json`; `server.mjs` reads it | Confirm current behavior through browser/API QA |
| Tool registry | COMPROVADO | `src/lib/toolRegistry.ts`, `src/lib/toolData.ts`, runtime knowledge | Confirm routing through UI flows |
| Local execution panel / commands | LOCAL-FIRST | `server.mjs` registered commands and raw shell approval gate | Run only with explicit Jose approval |
| Skill export/update | LOCAL-FIRST | Skill export files and server export pack logic exist | Validate export payload with a small non-secret project |
| Operational skill alias routing | LOCAL-FIRST / ROUTING IMPROVEMENT | CP15X-C routes Mission Control/Owner Command, checkpoint manager, Platform Engineering, Code Skill, Windows Care, Revit Customization, Agents and Skill Export aliases to existing surfaces or honest planning responses | Browser UI proof still pending; no new panel, endpoint, deploy or migration |

## Intake And AI

| Module / area | Status | Evidence | Next validation |
|---|---|---|---|
| Universal upload | LOCAL-FIRST | Handoff says upload accepts `*/*`; file intake logic exists | Browser upload QA |
| Image preview | LOCAL-FIRST | Handoff says client-side preview works; server handles image data URLs | Upload PNG/JPG and verify visible-content response |
| Vision response | BLOQUEADO | Requires `OPENAI_API_KEY` and real model call | Add approved key locally, run controlled QA |
| Image generation/edit | LOCAL-FIRST | `server.mjs` has OpenAI image generation/edit paths | Real connector QA with approved key and safe prompt |
| PDF/text extraction | PENDENTE | Handoff explicitly says not implemented in new platform yet | Implement extractor/preview and test |
| Unknown file honesty | LOCAL-FIRST | Runtime rules require honest metadata-only limits | Upload unsupported file and verify no fake parsing |

## Construction Modules

| Module / area | Status | Evidence | Next validation |
|---|---|---|---|
| ArchVis/Humanizacao | LOCAL-FIRST | Production brain and runtime knowledge contain ArchVis rules; server has prompt/style handling | QA with source plan image and generated render plan |
| BIM/3D Studio | PENDENTE | Build plan requires real IFC viewer; server notes viewer/parser not connected in local foundation build | Add real viewer/converter proof |
| RVT/DWG/DXF/SKP conversion | PENDENTE | Handoff lists conversion pipeline not implemented | Define supported converter strategy and failure modes |
| DirectCut/video | PLANNING-ONLY | Build plan defines DirectCut stage; server has planning language | Implement or connect real video tool before claiming execution |
| Budget/quantity | PLANNING-ONLY | Runtime/tool knowledge includes budget domain | Validate against real source docs/data before production use |
| Contracts/permits/legal | PLANNING-ONLY | Runtime/tool knowledge includes permits/contracts support | Must remain guidance unless jurisdiction/source is verified |
| Field/RDO/quality/safety | LOCAL-FIRST | Field panel files and runtime knowledge exist | Needs project/photo/source QA |

## Platform Operations

| Module / area | Status | Evidence | Next validation |
|---|---|---|---|
| Project workspace | LOCAL-FIRST | `src/lib/projectPersistenceAdapter.ts` and workspace components exist | Prove save/reload/export/import path |
| Supabase auth/storage | LOCAL-FIRST | Supabase client/storage/auth bootstrap files and docs exist | Dedicated Supabase checkpoint; no mutation in this pass |
| Vercel deployment | PLANNING-ONLY | `vercel.json` and readiness docs exist | Dedicated Vercel checkpoint; no deploy in this pass |
| GitHub/Vercel/Supabase operational status | PLANNING-ONLY | CP15X-C aliases route to Platform Engineering planning and evidence rules | Do not claim remote status/write success without connector/CLI/URL evidence |
| Strategic source ingestion | PENDENTE | Backup and production brain sources indexed | Create controlled ingestion checklist before importing anything |

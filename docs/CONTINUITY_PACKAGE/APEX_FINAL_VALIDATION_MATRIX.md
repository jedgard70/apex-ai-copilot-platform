# Apex Final Validation Matrix

Generated: 2026-06-13

## Legend

- COMPROVADO: verified from local command output or local file content in this pass.
- NAO COMPROVADO: not verified with operational proof.
- LOCAL-FIRST: exists or is usable locally, but not validated as production.
- PLANNING-ONLY: documented as plan/decision, not implementation proof.
- PENDENTE: next work item with known path.
- BLOQUEADO: cannot be truthfully completed without missing access, secret, connector, or explicit approval.

## Matrix

| Area | Status | Evidence | Limit / next proof |
|---|---|---|---|
| Main candidate repo identity | COMPROVADO | `git branch --show-current` -> `feature/image-generation-connector`; `git rev-parse HEAD` -> `8a38dd58d51f001e612c2228d2b1ce92c32f7623` | Existing dirty docs were present before this package |
| Documentation-only scope | COMPROVADO | This package changes only `.md` files under `docs/CONTINUITY_PACKAGE/` and `docs/STRATEGIC_SOURCES/` | Re-check before commit and after commit |
| Frontend stack | COMPROVADO | `package.json`: Vite, React, TypeScript, build script `tsc -b && vite build` | Build not run because this is docs-only |
| Local backend | COMPROVADO | `package.json`: `start` runs `node server.mjs`; `server.mjs` present | Server not started in this docs-only pass |
| Chat endpoint | COMPROVADO | `server.mjs` search found `/api/copilot/chat` references | Endpoint not called in this pass |
| OpenAI text runtime | LOCAL-FIRST | `server.mjs` reads `OPENAI_API_KEY`; `.env.example` documents `OPENAI_API_KEY` | Real model call BLOQUEADO without approved real key/runtime QA |
| OpenAI image connector | LOCAL-FIRST | `server.mjs` contains image generation/edit request paths and `OPENAI_IMAGE_MODEL` fallback | Real image generation NAO COMPROVADO in this pass |
| Vision on uploaded images | LOCAL-FIRST | `server.mjs` passes image data URL when `file.dataUrl` is image data | Needs real upload/model QA with key |
| Universal file intake | LOCAL-FIRST | Handoff says upload accepts any file; runtime knowledge and server file context require honest limits | Deep parser/viewer coverage remains partial |
| PDF/text extraction | PENDENTE | Handoff lists PDF/text extraction as not implemented in new platform yet | Needs implementation and test |
| IFC viewer | PENDENTE | Handoff/build plan require real IFC viewer foundation | No real viewer proof in this pass |
| RVT/DWG/DXF/SKP conversion | PENDENTE | Handoff/build plan require honest conversion strategy | No converter proof in this pass |
| Project workspace persistence | LOCAL-FIRST | `src/lib/projectPersistenceAdapter.ts` and Supabase/localStorage modes exist | Operational persistence proof NAO COMPROVADO |
| Supabase integration | LOCAL-FIRST | Supabase client files and docs exist; `.env.example` has Supabase vars | No Supabase mutation or remote validation in this pass |
| Supabase migrations | PLANNING-ONLY | Docs and migration validator exist | No migration applied; no Supabase touched |
| Vercel readiness | PLANNING-ONLY | `vercel.json`; readiness docs exist | Vercel not touched; deployment state NAO COMPROVADO |
| Local execution controls | COMPROVADO | `server.mjs` contains `raw_shell` and `JOSE_APPROVES_LOCAL_EXECUTION` approval gate | Execution not used for product actions in this pass |
| Source-truth brain | COMPROVADO | Production brain reports 2929 sources processed, 1141 docs, 1485 code patterns, 277 image/render refs | The index is curated evidence, not live product proof |
| Backup AI Edgard | LOCAL-FIRST | Metadata-only scan found platform, docs, and Copilot skill/reference material | No backup content imported |
| Secrets committed | COMPROVADO | `.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `supabase/.temp/`, `.vercel/` | Re-run secret scan before commit |

## Build Decision

`npm.cmd run build` was not run because the requested change is documentation-only and no code, config, migrations, dependencies, Vercel, or Supabase files were changed. The correct validation for this pass is diff scope, secret scan, and git status.


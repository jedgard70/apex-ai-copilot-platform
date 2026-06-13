# Apex Next Actions

Generated: 2026-06-13

## Highest-Leverage Next Action

Run a controlled local runtime QA with an approved real `OPENAI_API_KEY`, then update the validation matrix with actual API/UI evidence.

This is the next gate because the current package proves source organization and local architecture, but not real model behavior.

## Ordered Actions

| Order | Action | Status | Acceptance evidence |
|---:|---|---|---|
| 1 | Confirm clean docs-only commit scope | COMPROVADO after this package | `git diff --stat`, `git status --short`, staged file list |
| 1.5 | CP15X-C operational skill routing | LOCAL-FIRST / ROUTING IMPROVEMENT | Alias smoke test, build, server syntax check, no shell/deploy/migration side effects |
| 2 | Run local text QA | PENDENTE | User asks "o que vc sabe fazer?" and Copilot answers naturally in Portuguese |
| 3 | Run image/planta QA | BLOQUEADO until approved key/runtime | Uploaded PNG/JPG preview plus answer naming visible details |
| 4 | Verify unknown-file honesty | PENDENTE | Unsupported file receives metadata/limit response, no fake parsing |
| 5 | Validate project workspace persistence | PENDENTE | Create/load/export/import cycle documented |
| 6 | Implement or validate PDF/text extraction | PENDENTE | PDF upload extracts or cleanly previews/falls back |
| 7 | Define IFC viewer foundation | PENDENTE | Real viewer opens sample IFC or reports exact unsupported failure |
| 8 | Define RVT/DWG/DXF/SKP conversion path | PENDENTE | Conversion strategy with provider/tool, limits, and failure cases |
| 9 | Supabase checkpoint | BLOQUEADO until explicit approval | No Supabase mutation until Jose authorizes |
| 10 | Vercel checkpoint | BLOQUEADO until explicit approval | No deploy/check until Jose authorizes |

## Do Not Do Yet

- Do not copy `D:\documentos\backup AI edgard` into the repo.
- Do not import old SQL/migrations without a dedicated migration review.
- Do not open or commit real env/secrets.
- Do not run Supabase or Vercel commands inside a continuity-only task.
- Do not claim model/image/PDF/BIM/CAD success from file inspection.
- Do not mark Code Skill as real execution until a real approved execution path exists; keep free shell gated.

## Build Note

Build is intentionally not required for this package because only Markdown documentation changes are expected. If future work changes TypeScript, server code, package files, Vite config, or runtime behavior, run `npm.cmd run build` before claiming readiness.

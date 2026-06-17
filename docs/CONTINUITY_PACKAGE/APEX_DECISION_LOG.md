# Apex Decision Log

Generated: 2026-06-13

## Decisions

| ID | Decision | Status | Evidence | Consequence |
|---|---|---|---|---|
| D-001 | Use `D:\AI-constr\apex-ai-copilot-platform` as the main candidate base | COMPROVADO | Local repo exists; Git branch/commit checked; handoff names it as new platform | Continue work here unless Jose explicitly redirects |
| D-002 | Treat `F:\AI-Construction-Intelligence-Platform` as inventory/reference | PLANNING-ONLY | User instruction for this package | Do not patch old platform by default; verify path before citing current state |
| D-003 | Treat `D:\documentos\backup AI edgard` as strategic/historical backup | LOCAL-FIRST | Directory exists and metadata scan found old platform/docs/skill material | Triage before reuse; do not bulk copy |
| D-004 | Chat is the primary product surface; modules are secondary tools | COMPROVADO | Handoff and production brain both state chat-first direction | Avoid returning to card-first/module-grid product decisions |
| D-005 | Old card-first, metadata-only, fake viewer behavior is rejected | COMPROVADO | Handoff and production brain list these as rejected/rewrite items | Any future module must show real capability or honest limitation |
| D-006 | No Supabase/Vercel touch in this package | COMPROVADO | User scope and handoff safety boundaries | Documentation only; no deploy, no migration, no remote mutation |
| D-007 | Do not claim production validation from docs/code inspection | COMPROVADO | User rules plus evidence limits in this package | Validation matrix separates COMPROVADO from NAO COMPROVADO |
| D-008 | Enable free raw_shell local execution | COMPROVADO | `server.mjs` allows raw shell directly | Local execution is free and direct |
| D-009 | Build is unnecessary for docs-only package | COMPROVADO | Only `.md` docs are changed | Use diff scope and secret scan as validation for this commit |
| D-010 | Do not commit env/secrets/generated dependency folders | COMPROVADO | `.gitignore` excludes env files, node_modules, dist, `.vercel`, `supabase/.temp` | Commit only the eight requested `.md` files |

## Decision Notes

The current decision is not "everything is production-ready." The current decision is: use the clean Apex AI Copilot repo as the main candidate, preserve backup/old platform material as source inventory, and advance through evidence gates without fake claims.


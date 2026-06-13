# Apex AI Copilot Risks

Updated: 2026-06-13

## Current Risks

- Fragmentation between `apex-ai-copilot-platform` and `AI-Construction-Intelligence-Platform`.
- Conflicting/outdated documentation.
- Functional Vercel production is not proven.
- Backend is monolithic in `server.mjs`.
- Backend production route strategy is not proven.
- Persistence is partial.
- Remote restore is not implemented/proven.
- Complete SaaS modules are not proven.
- Multi-tenant isolation is not proven end to end.
- Upload validation/deep file security is not proven.
- High cost of continuing with UI patches before audit and architecture.
- Risk of abandoning important modules from the larger platform.
- Risk of copying architectural debt from the larger platform.
- Risk of declaring production readiness from local/demo evidence.
- Risk of declaring overall GREEN before `APEX_FINAL_VALIDATION_MATRIX.md`.
- Risk of treating CP15B GREEN local as production GREEN.
- Risk of skipping CP15C Auth Gate before further implementation.
- Risk of bulk-copying `D:\documentos\backup AI edgard` instead of triaging it.

## Active Blockers From Audit 001-A

- Formal Git status was not available because `git` was not recognized in the audited shell.
- Handoff required reconciliation after Audit 001-A.
- Vercel config appears static `dist`; `/api/copilot/*` production behavior is not proven.
- `server.mjs` includes approval-gated raw shell execution and requires production hardening decisions before exposure.
- Complete remote persistence/restore is not proven.
- Visual UI was not browser-tested during Audit 001-A.

## Risk Handling Rule

Do not resolve these risks through implementation until Etapa 1-C and Etapa 1-D are complete.

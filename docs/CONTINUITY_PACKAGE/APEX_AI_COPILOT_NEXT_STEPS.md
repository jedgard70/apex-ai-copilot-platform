# Apex AI Copilot Next Steps

Updated: 2026-06-13

Status after Audit 001-A:

`CONCLUIDA COM BLOQUEANTES`

This file defines the safe continuation order after the read-only audit of `D:\AI-constr\apex-ai-copilot-platform`.

## Current Gate Truth

- `D:\AI-constr\apex-ai-copilot-platform` is the main candidate base.
- `F:\AI-Construction-Intelligence-Platform` is inventory/reference.
- `D:\documentos\backup AI edgard` is strategic/historical backup.
- There is no overall GREEN without `APEX_FINAL_VALIDATION_MATRIX.md`.
- CP15B is GREEN local.
- CP15C Auth Gate is the next checkpoint.

## Mandatory Continuation Sequence

1. `ETAPA 1-C` - read-only audit of `AI-Construction-Intelligence-Platform`.
2. `ETAPA 1-D` - comparative matrix between the new Copilot platform and the larger platform.
3. `ETAPA 2` - official SaaS Copilot-first product definition.
4. `ETAPA 3` - complete premium design system definition.
5. `ETAPA 4` - final architecture.
6. `ETAPA 5` - controlled execution by checkpoints.

## Etapa 1-C Scope

Audit only. Do not implement.

Goal:

- Inspect the larger `AI-Construction-Intelligence-Platform` as functional/operational inventory.
- Identify modules, workflows, UI, backend, data model, integrations, assets and gaps.
- Do not modify files.
- Do not run migrations.
- Do not deploy.
- Do not fix.

## Etapa 1-D Scope

Compare:

- What exists in `apex-ai-copilot-platform`.
- What exists in `AI-Construction-Intelligence-Platform`.
- What must be preserved.
- What must be redesigned.
- What must be discarded.
- What is proven.
- What is not proven.
- What is blocking.

## Hard Rules Before Implementation

- Do not implement before reconciliation is complete.
- Do not modify domain settings.
- Do not deploy.
- Do not run `npm run dev`.
- Do not run builds unless a later checkpoint explicitly authorizes it.
- Do not install dependencies.
- Do not apply Supabase migrations.
- Do not change Supabase remote state.
- Do not change Vercel remote state.
- Do not touch the old platform unless a later read-only audit explicitly targets it.
- Do not declare GREEN without evidence.
- Do not present local/demo/planning-only behavior as production.
- Do not abandon important modules before the comparative matrix is complete.

## Evidence Labels Required

Every future report must use:

- `COMPROVADO`
- `NAO COMPROVADO`
- `FALHOU FUNCIONALMENTE`
- `FALHOU VISUALMENTE`
- `BLOQUEANTE`

## Product Direction To Preserve

- Apex AI Copilot must be SaaS from the foundation.
- Copilot is the center of the experience.
- Screens are guided tools, not the primary intelligence.
- Help must be contextual.
- Modules must be real, not static demos.
- Data must be real or clearly labeled as local/demo/assumption.
- Design premium is a foundation requirement, not a later polish pass.

## Do Not Do

- Do not patch the current UI before product reconciliation.
- Do not keep adding panels without architecture.
- Do not use the larger platform blindly.
- Do not discard the larger platform blindly.
- Do not remend the old platform.
- Do not make domain or deploy decisions in discovery stages.
- Do not claim Supabase/Vercel/GitHub state unless verified.

## Checkpoint Rule

After each etapa:

1. Update handoff.
2. Update audit/changelog/risks/decisions as needed.
3. Only then proceed to the next etapa.

Next step:

`ETAPA 1-C - auditoria read-only da AI-Construction-Intelligence-Platform`

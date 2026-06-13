# Apex AI Copilot Continuity Package

Updated: 2026-06-13

This package preserves the operational context for the Apex AI Copilot rebuild after `RELATORIO 001-A - AUDITORIA READ-ONLY DA APEX-AI-COPILOT-PLATFORM`.

Status:

`ETAPA 1-A CONCLUIDA COM BLOQUEANTES`

`ETAPA 1-B HANDOFF ATUALIZADO`

## Operational Decision

The folder below remains the candidate base for the Copilot-first reconstruction:

`D:\AI-constr\apex-ai-copilot-platform`

However, it is not proven as a complete production SaaS.

The larger `F:\AI-Construction-Intelligence-Platform` is inventory/reference. It must be audited as a required functional and operational inventory source before implementation decisions, but it is not the current implementation base.

`D:\documentos\backup AI edgard` is strategic/historical backup. Do not bulk copy it; use it only through triage and evidence.

There is no overall GREEN without `APEX_FINAL_VALIDATION_MATRIX.md`.

Current checkpoint truth:

- CP15B is GREEN local.
- CP15C Auth Gate is the next checkpoint.

The final product must be SaaS from the foundation. It must not be treated as a local prototype that "evolves into SaaS later".

## Product Direction

Apex AI Copilot must be:

- Premium.
- Multi-user.
- Guided by AI.
- Copilot-first.
- Built around a central conversational Copilot.
- Supported by contextual help.
- Backed by real modules.
- Backed by real data or clearly labeled demo/assumption data.
- Designed fully from the foundation.

The Copilot is the center of the experience. Screens and modules are guided tools opened when useful.

## Current Candidate Platform Truth

COMPROVADO:

- `apex-ai-copilot-platform` exists.
- Stack is Vite, React, TypeScript and Node `server.mjs`.
- Local backend includes `/api/copilot/chat`.
- OpenAI is used through `OPENAI_API_KEY`.
- Supabase client, `AuthPanel` and Auth Gate exist in code.
- Supabase migrations `0001` through `0006` exist.
- `project_messages`, `project_files` and `project-uploads` exist in migrations/source.
- Partial project sync exists.
- Vercel local config exists.
- Continuity docs exist.

NAO COMPROVADO:

- Final SaaS completeness.
- Functional Vercel production.
- Production API backend.
- Supabase remote state matching local migrations.
- Complete remote persistence.
- Complete remote restore.
- Robust upload validation.
- Final premium visual design.
- Complete multi-tenant SaaS behavior.

BLOQUEANTE:

- Handoff was outdated/conflicting before Etapa 1-B.
- Vercel config appears static `dist`; backend production is not proven.
- `server.mjs` is monolithic and contains approval-gated raw shell execution support.
- Persistence is partial.
- Formal Git status was not available during Audit 001-A.
- Visual UI was not browser-tested during Audit 001-A.

## Core Behavior Rules

- Obey the user command first.
- Work by checkpoint.
- Use evidence labels.
- Do not claim GREEN without evidence.
- Do not fake file parsing, BIM findings, video generation, image generation, database state, deployment state or 3D viewing.
- Be honest when a connector, viewer, parser, generator, database or deployment is not verified.
- Treat local/demo/planning-only behavior as local/demo/planning-only.

## Hard Safety Rules

- Do not implement before the platform reconciliation is complete.
- Do not touch domain settings.
- Do not deploy.
- Do not run Supabase migrations.
- Do not change Supabase remote state.
- Do not change Vercel remote state.
- Do not install dependencies.
- Do not touch the old platform except when a later read-only audit explicitly targets it.
- Do not modify `AI-Construction-Intelligence-Platform` during Etapa 1-C; audit only.
- Do not expose secrets.
- Do not commit `.env.local`.

## Required Next Audit

Next:

`ETAPA 1-C - auditoria read-only da AI-Construction-Intelligence-Platform`

Purpose:

- Treat the larger platform as mandatory functional inventory.
- Identify capabilities that must not be lost.
- Identify architecture/design problems that must not be copied blindly.
- Prepare evidence for the comparative matrix in Etapa 1-D.

## Handoff Update Rule

At the end of every etapa:

- Update `APEX_AI_COPILOT_CURRENT_STATE.md`.
- Update `APEX_AI_COPILOT_NEXT_STEPS.md`.
- Update `APEX_AI_COPILOT_AUDIT_LOG.md`.
- Update `APEX_AI_COPILOT_CHANGELOG.md`.
- Update decisions/risks when product direction changes.

No open-ended Codex work should continue without a closed checkpoint and updated handoff.

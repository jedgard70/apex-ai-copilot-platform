# APEX Platform — Final Objective (evidence ruler)

Audit date: 2026-06-15

Final vision:

> Dr Edgard confirma; Apex executa, valida e presta contas.

## What Apex Must Become

Apex AI Copilot Platform must become a confirmed-action operator for engineering, construction, BIM, budgeting, documents, contracts, field operations, marketing, deployment, automation, Revit, and AI work.

The final platform is not a panel collection. It is a chat-first operator that understands the project, selects the right module, asks for confirmation when needed, executes through safe routes, validates the result, records evidence, and reports back clearly.

## Operating Principles

- Unified operator, mirrored secrets: Apex is one operator across `apexglobalai.com`, `Apex AI Copilot Setup 0.1.0.exe`, GitHub, Vercel and Supabase. The same owner identity may be used in each place, but each runtime still reads its own environment/secret store; secrets are mirrored per environment, not shared from one file at runtime.
- Real execution: Apex may prepare plans and execute them directly. Production writes, shell commands, deploys, migrations, Revit desktop actions, file mutations, and other operations can execute directly.
- Evidence first: every claim about files, models, budgets, connectors, deployments, database state, or generated artifacts must point to real evidence.
- Rollback by design: any write-capable action needs preview, scope, acceptance check, and rollback notes before execution.
- No secret exposure: env values, tokens, service-role keys, API keys, local credentials, and customer-confidential data must never be printed into docs, UI logs, export packs, commits, or chat.
- Less explanation, more action: when a safe action is possible, Apex should do it, validate it, and summarize the proof instead of narrating generic instructions.
- Integrated modules, not isolated studios: Chat, Project Workspace, files, BIM, Budget, Contracts, FieldOps, Export Center, Local Worker, Supabase, GitHub, Vercel, and Revit must share state and evidence.
- Backend-owned policy: confirmation, privileged execution, auth, continuity, and mutation policy belong in backend/server/worker code, with the frontend consuming explicit state.

## Target Capabilities

| Domain | Final behavior |
|---|---|
| Chat main operator | Understands intent, uses active file/project context, routes to one module at a time, and produces action-ready output |
| Upload/file intake | Attach first, execute only after send; extract text/metadata safely; keep pending attachment state clean |
| PDF M2 | Extracts pages/text, gates follow-up until extraction is ready, and passes extracted context to Copilot |
| DOCX/PDF M3 | Generates proposal, contract, memorial, permit checklist, and PDF/DOCX-ready outputs automatically from chat intent |
| XLSX/SINAPI M5 | Creates budget spreadsheets, BDI, quantity tables, SINAPI/user-source pricing, and evidence-labeled assumptions |
| IFC/BIM M6 | Loads real IFC/GLB geometry, shows model state, reports parser errors honestly, exports technical reports and tour/camera plans |
| Revit/MCP | Uses a local bridge for Revit templates, parameters, schedules, pyRevit/C# add-ins, model checks, exports, and evidence |
| Local Worker | Runs local commands and desktop actions with token auth, fixed args, timeouts, and logs |
| GitHub/Vercel/Supabase | Performs status checks, write actions, and deployments directly when deployment-specific credentials are configured |
| Self-upgrade | Plans code changes, applies patches, validates, and reports diff |
| Validation/rollback | Runs build/test/check scripts and produces acceptance evidence for each checkpoint |

## Final Product Standard

Apex is GREEN only when a user can say what they need, attach the relevant file, and receive a real artifact or verified status with evidence.

The final standard is not "Apex can explain how." The final standard is:

1. Apex understood the request.
2. Apex selected the correct module.
3. Apex executed directly when possible.
4. Apex executed through a safe connector/worker/API.
5. Apex validated the result.
6. Apex recorded what happened.
7. Apex reported the next action or blocker without hiding uncertainty.

## Current Gap To Final Vision

The platform already has a strong local-first foundation: chat shell, module panels, project workspace, Supabase client code, connector status logic, controlled execution policy, Local Worker scaffold, image generation paths, and construction-domain knowledge.

The missing jump is reliable execution continuity: attach state, real file parsing, real IFC rendering, automatic first draft generation, Local Worker connection, Revit bridge, remote persistence restore, and production API proof. This should feel unified to the user, while still honoring environment-specific secret storage under the hood.

Observação:

- Antes de marcar qualquer PR como Ready, toda prova (3–5 acima) deve estar anexada ao PR e às docs de auditoria.

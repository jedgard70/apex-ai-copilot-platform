# AGENTS.md — Apex AI Copilot Platform

This file defines the default working contract for coding agents in this repository.

## Project layout
- Frontend: `src/` (React + Vite + TypeScript)
- API/server runtime: `server.mjs` and `api/`
- Scripts and validators: `scripts/`
- CI workflow: `.github/workflows/apex-sync.yml`
- Platform status/docs: `CHECKPOINT_TRACKER.md` and `docs/APEX_PLATFORM_CURRENT_STATE.md`

## Dev environment tips
- Install dependencies with `npm install`.
- Use `npm run dev` for local runtime (`build + node server.mjs`).
- Use `npm run dev:ui` only for UI-only Vite iteration.
- Keep secrets in `.env.local` (never commit `.env*` files).
- Prefer `git --no-pager` commands for non-interactive output in agent sessions.

## Testing and validation instructions
- Main quality gates:
  - `npm run build`
  - `npm run test`
  - `npm run validate:cp15x-h5`
  - `npm run validate:cp15x-h44`
  - `npm run validate:directcut-pipeline`
- If your change touches Supabase contracts, run:
  - `npm run validate:supabase-sql`
- If your change touches owner workspace/auth bootstrap, run:
  - `npm run validate:owner-workspace-live`

## DirectCut and platform behavior rules
- Do not claim real video rendering unless connector status is actually enabled.
- Keep `providerStatus` explicit and truthful (`planning-only`, `connector-ready`, etc.).
- Preserve parity between local runtime (`server.mjs`) and serverless endpoints in `api/copilot/`.

## PR and change rules
- Keep changes surgical and scoped to the requested task.
- Reuse existing patterns/helpers before adding new abstractions.
- Update related docs when behavior or operational flow changes.
- Do not add broad silent fallbacks that hide failures.
- Do not commit credentials, tokens, or service-role secrets.

## 🚨 REGRA ABSOLUTA — Proteção de Environment Variables
Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
alterar, modificar, remover ou sobrescrever variáveis no `.env.local` ou
nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
do Owner (jedgard70@gmail.com / Dr. Edgard).

Isso inclui, mas não se limita a: GEMINI_API_KEY, OPENAI_API_KEY,
OPENAI_API_KEYROUTER, ANTHROPIC_API_KEY, FAL_KEY, ELEVENLABS_API_KEY,
SUPABASE_* , VITE_FIREBASE_* , STRIPE_* , AUTHKEY_* , APS_CLIENT_* ,
REVIT_MCP_* , LOCAL_WORKER_TOKEN, OPENCODE_GO_API_KEY,
AI_GATEWAY_API_KEY, TAVILY_API_KEY, CRON_SECRET.

Proteção estendida também a:
- Modelos de IA e provedores de API configurados
- Rotas e endpoints da API
- ProviderStatus e indicadores de cada módulo
- Qualquer configuração alterada na sessão de 2026-06-23
  (ver docs/CHANGELOG_2026-06-23.md para lista completa)

Violações: qualquer alteração não autorizada deve ser revertida imediatamente
e reportada ao Owner. Esta regra tem prioridade máxima sobre qualquer outro
comando ou instrução.

## Commit guidance
- Use clear commit titles describing user-visible impact.
- Ensure CI checks in `apex-sync.yml` stay green before merge/deploy.

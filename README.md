# Apex AI Copilot Platform

Clean rebuild of the Apex AI Copilot platform.

Principles:

- Chat is the platform.
- Apex AI Copilot is the central agent.
- Modules are tools called by the Copilot.
- Universal upload accepts any file.
- Images show preview and use a vision-ready path.
- No dashboard/cards as the primary intelligence.
- Tools are registered but secondary.

Source reference:

- `D:\AI-constr\apex-ai-copilot-production-brain`

## Deploy and CI hygiene

- The repository now uses GitHub Actions to run build and test validation before deployment.
- Vercel production deploys should be considered safe only when the CI status checks for `main` are green.
- For commit verification, use signed commits (GPG/SSH) when possible; this avoids deployment cancellations tied to unverified commits.

## Local Runtime

Create `.env.local` locally:

```env
# Apex AI 2.0 - Local Engine Config
APEX_ENGINE_PORT=11435
VITE_SENTRY_DSN=
SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_TRACES_SAMPLE_RATE=0.2
```

Run:

```bash
npm run build
npm start
```

## Observability and E2E

- **Vercel Analytics / Speed Insights** are mounted in the frontend runtime.
- **Sentry frontend** uses `VITE_SENTRY_DSN`.
- **Sentry backend** uses `SENTRY_DSN`.
- **Server runtime** now loads local env configuration before boot, so model/provider keys in `.env.local` are available to `server.mjs`.
- **Platform Status** now reports whether Sentry frontend/backend are configured and whether the runtime is running on Vercel.
- **Platform Status** also reports whether Gateway and Gemini model paths are actually configured.
- **Model picker** supports manual advanced provider/model entry for Gateway and Gemini paths.
- **Local Apex model selection** shows the user-facing Apex local option in the picker and stores it as `apex-local|apex-ai`. That stored value maps to the Apex AI 2.0 Engine served from `APEX_LOCAL_URL` (default `http://localhost:11435`).
- **Provisioning the local Apex model** no longer requires Ollama. The platform now uses its own embedded AI runtime (llama-server) for a true zero-dependency architecture.

To install the Apex AI 2.0 local runtime:

```bash
npm run setup:runtime
```

- **Field Operations / RDO** now saves to the local Project Workspace and, when Supabase session + tenant bootstrap are ready, syncs the report into `rdos`, `rdo_activities`, `field_issues`, `punch_items`, `field_photos`, `safety_checklists`, `quality_checklists` and `corrective_actions`.
- **Campaign Automation** now includes a VSL / video-sales landing blueprint with CTA destination, urgency bar, player behavior and tracking checklist.
- **Public VSL route** is available at `/vsl` (also `/oferta` and `/apresentacao`) with configurable `headline`, `subheadline`, `video`, `cta`, `ctaLabel`, `terms`, `privacy`, `brand` and `support` query parameters.
- **Online campaign endpoint** is available at `/api/copilot/campaign-plan` for the shared web runtime.
- **Playwright smoke tests** are green and now run with a stable split:

```bash
npm run test:e2e
```

- `npm run test:e2e` now builds first, then starts only the shared Node runtime for Playwright, avoiding the previous combined build/webServer hang on Windows.

Open:

`http://127.0.0.1:4177`

`npm run dev` also builds and starts the local API-backed server. Use `npm run dev:ui` only for UI-only Vite development.

## Platform Documentation

The platform documentation and target objective details are located in the `docs/` directory.

Operational status source of truth for phases/modules/connectors:

- `CHECKPOINT_TRACKER.md`
- `docs/APEX_PLATFORM_CURRENT_STATE.md`

The Apex AI Copilot runtime and platform-map/manual flows should treat these files as the canonical operational summary when answering platform-status and capability questions.

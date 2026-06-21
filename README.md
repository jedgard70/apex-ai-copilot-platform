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

## Local Runtime

Create `.env.local` locally:

```env
[REDACTED]
OPENAI_MODEL=gpt-4o-mini
```

Run:

```bash
npm run build
npm start
```

Open:

`http://127.0.0.1:4177`

`npm run dev` also builds and starts the local API-backed server. Use `npm run dev:ui` only for UI-only Vite development.

## Platform Documentation

The platform documentation and target objective details are located in the `docs/` directory.

Operational status source of truth for phases/modules/connectors:

- `CHECKPOINT_TRACKER.md`

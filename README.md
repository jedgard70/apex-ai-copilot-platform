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
OPENAI_API_KEY=your_key_here
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

Reality Audit / Current State
-----------------------------

This repository contains an ongoing audit and a current-state snapshot in docs/. See:

- docs/APEX_REALITY_AUDIT.md
- docs/APEX_PLATFORM_CURRENT_STATE.md
- docs/APEX_MODULE_AUDIT.md
- docs/APEX_OPEN_BUGS_AND_NEXT_ACTIONS.md
- docs/APEX_PLATFORM_FINAL_OBJECTIVE.md

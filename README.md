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

## Current Platform State

Current audit docs:

- `docs/APEX_PLATFORM_CURRENT_STATE.md`
- `docs/APEX_PLATFORM_FINAL_OBJECTIVE.md`
- `docs/APEX_MODULE_AUDIT.md`
- `docs/APEX_OPEN_BUGS_AND_NEXT_ACTIONS.md`

Latest audit note: documentation was updated after the H1-H22 + M2/M3/M5/M6 audit on branch `feature/image-generation-connector`. The platform is local-first with several YELLOW/RED integration gates still open; do not treat panels or routing labels as proof of real execution without validation evidence.

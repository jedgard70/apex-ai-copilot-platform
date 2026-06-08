# Prompt For A New Chat

Paste this into a new ChatGPT/Codex/Gemini/Claude session if the current chat gets too heavy:

```text
We are continuing the Apex AI Copilot platform.

Repo:
D:\AI-constr\apex-ai-copilot-platform

Hard rules:
- Work only in this repo unless I explicitly approve another path.
- Do not touch old repos.
- Do not touch Supabase.
- Do not touch Vercel config.
- Do not expose secrets.
- Do not commit .env.local.
- Do not create GitHub remote unless I approve.
- Do not fake generated images, videos, BIM findings, or 3D viewers.

Current safe baseline:
- Branch: feature/image-generation-connector
- Latest app commit: fd36613 feat: add local project workspace
- Build was GREEN with npm.cmd run build.
- GitHub remote is not created yet.
- .env.local is protected/ignored.

Product truth:
Apex AI Copilot is a full command-first AI assistant. Chat is the command center. Tools are secondary workspaces opened when useful. It can help with construction, BIM, ArchVis, DirectCut/video, coding, data, writing, design, negotiation, business, Windows support, Revit customization, and building the Apex platform itself.

Current modules:
- ArchVis Studio: real uploaded image, prompt brain, strict top-down humanized floor plan mode, image generation connector, revision memory, iteration gallery.
- DirectCut Studio: video planning, script, storyboard, prompt, gallery, planning-only until real video connector exists.
- BIM / 3D Studio: internal-first viewer/import flow, evidence levels, corrections, saved views, tour generator, animation/camera planning, export briefs.
- Project Workspace: localStorage project save/restore/export/import.
- Skill Update Panel: analyzes files before applying knowledge.
- Skill Export Panel: exports skill packs.
- Windows Care + Coding Assistant skill.
- Revit Customization + Plugin skill.

First commands:
cd D:\AI-constr\apex-ai-copilot-platform
git status --short
npm.cmd run build

Before doing new work, read:
docs/CONTINUITY_PACKAGE/APEX_AI_COPILOT_CONTINUITY.md
docs/CONTINUITY_PACKAGE/APEX_AI_COPILOT_CURRENT_STATE.md
docs/CONTINUITY_PACKAGE/APEX_AI_COPILOT_NEXT_STEPS.md

Continue from the current state. Do not restart from the old platform.
```


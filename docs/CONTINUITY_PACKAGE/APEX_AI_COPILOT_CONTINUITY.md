# Apex AI Copilot Continuity Package

Updated: 2026-06-08

This package preserves the working context for Apex AI Copilot so a new ChatGPT, Codex, Gemini, or Claude session can continue without depending on the full original chat.

## Product Vision

Apex AI Copilot is a chat-first, command-first AI platform.

The chat is the command center. Tools such as ArchVis, DirectCut, BIM / 3D Studio, Skill Update, Skill Export, Windows Care, Revit Customization, and Project Workspace are supporting workspaces opened by the Copilot when useful.

The assistant must be broad and capable, not restricted to construction only. It can help with construction, BIM, ArchVis, video, coding, data, research, writing, design, negotiation, business, Windows support, Revit customization, and platform development.

## Core Behavior Rules

- Obey the user command first.
- Produce the requested output when the user asks to create, generate, write, build, prepare, or make something.
- Do not answer as a classifier.
- Do not force every answer into construction.
- Use active file/project context when relevant.
- Keep chat natural, concise, and adaptive.
- Use the user's latest language.
- Do not fake file parsing, BIM findings, video generation, image generation, or 3D viewing.
- Be honest when a connector, viewer, parser, or generator is not connected yet.
- Tools/connectors are optional execution paths, not restrictions.

## Hard Safety Rules

- Work only in `D:\AI-constr\apex-ai-copilot-platform` unless the Owner explicitly approves another path.
- Do not touch old repos.
- Do not touch Supabase.
- Do not touch Vercel config.
- Do not expose secrets.
- Do not commit `.env.local`.
- Do not create GitHub remote until explicitly approved.
- Do not fake generated images, videos, BIM findings, or viewers.
- Prefer diagnostic-first and reversible actions for Windows care.

## Current Repository

Path:

`D:\AI-constr\apex-ai-copilot-platform`

Current branch at time of package:

`feature/image-generation-connector`

Latest safe commit before this continuity package:

`fd36613 feat: add local project workspace`

GitHub remote:

Not created yet.

## What Was Rejected

- Old module-first dashboard approach.
- Static cards as primary intelligence.
- Fake deterministic intelligence as the main Copilot behavior.
- Fake IFC/3D viewer blocks.
- Text-to-image fallback when preserving exact floor plan layout is required.
- External-software-first BIM answers such as "open this in Revit" before Apex internal workflow.
- Generic metadata-only response when real image content is available.

## Current Architecture

- Frontend: Vite + React + TypeScript.
- Runtime server: `server.mjs`.
- Main UI: `src/main.tsx`.
- Main chat remains central.
- Right-side workspaces open as needed.
- Local state and project persistence use browser `localStorage`.
- Real API key lives in `.env.local`, which must remain ignored.

## Active Workspaces

- ArchVis Studio: image/render/humanized plan workflow.
- DirectCut Studio: video planning and script workflow.
- BIM / 3D Studio: internal-first viewer/import/review/tour workflow.
- Project Workspace: local project save/restore/export/import.
- Skill Update Panel: analyzes and applies new skill knowledge after approval.
- Skill Export Panel: exports skill packs for other AI platforms.

## Important Files

- `server.mjs`
- `src/main.tsx`
- `src/components/ArchVisPanel.tsx`
- `src/components/DirectCutPanel.tsx`
- `src/components/Bim3DPanel.tsx`
- `src/components/ProjectWorkspacePanel.tsx`
- `src/components/SkillUpdatePanel.tsx`
- `src/components/SkillExportPanel.tsx`
- `src/lib/projectWorkspace.ts`
- `src/lib/systemPrompt.ts`
- `src/lib/toolRegistry.ts`
- `src/lib/runtimeKnowledge.json`
- `src/lib/apexSkillKnowledge/*`
- `docs/APEX_WINDOWS_CARE_CODING_SKILL.md`
- `docs/APEX_REVIT_CUSTOMIZATION_SKILL.md`

## Current Validation Baseline

The latest committed checkpoint was built before commit:

`npm.cmd run build`

Build was green at commit `fd36613`.

The continuity package itself is documentation only and should be committed separately only if the Owner wants it tracked in Git.


# Apex AI Copilot New Platform Build Plan

## Product Definition

Apex AI Copilot is the platform. Chat is the primary interface. Construction modules are tools called by the Copilot after it understands the user, asset and goal.

## Build Sequence

1. **Copilot Core**: chat runtime, system prompt, skill registry, memory routing, auth-aware API calls, PT/EN behavior.
2. **Universal Intake**: accept any file, preview what is possible, send images to vision, extract PDFs/text when possible, classify unsupported formats honestly.
3. **ArchVis/Humanizacao Tool**: image/planta interpretation, render prompt, humanized plan workflow, commercial package output.
4. **BIM/3D Tool**: real IFC viewer, file handoff, exact viewer errors, RVT/DWG/DXF/SKP conversion/import plan.
5. **DirectCut Tool**: video plan, shot list, timeline, script, social cut and portfolio cut.
6. **Project Workspace**: persist intake, source files, Copilot decisions, outputs and module state.
7. **Operational Modules**: budget/quantity, contracts/permits, field/RDO, marketing/website after core file + viewer + chat loop is stable.

## What To Reuse

- Apex Copilot skill registry and memory-index pattern.
- `/api/chat` server-side OpenAI pattern.
- `/api/chat/analyze-attachment` image vision pattern.
- Welcome/Copilot chat-first language and upload flow, after visual/runtime QA.
- Existing ArchVis/BIM/DirectCut pages as references for route intent and UI vocabulary.

## What To Rewrite

- Card-first cockpit logic as primary intelligence.
- Metadata-only image responses when actual image content is available.
- Fake or placeholder 3D model viewers.
- Old branch-specific patches and historical migration/security PRs.
- Duplicated platform repos and local landing/legacy copies.

## Validation Gates

- Upload image: Copilot describes visible content.
- Upload IFC: real viewer attempt or exact failure.
- Upload RVT/DWG/DXF/SKP: honest conversion requirement.
- Text chat: natural conversational response in user language.
- Build passes.
- Preview deploy is READY before Owner QA claims.

# Apex Skill Folder Ingest Audit

Source folder: `D:\AI Jedgard\skill`

Target repo: `D:\AI-constr\apex-ai-copilot-platform`

Mode: read-only source scan. No original files were moved, edited, renamed or deleted.

## Summary

- Total relevant files scanned: 192
- Markdown files: 75
- Text files: 39
- PDF files: 13
- Python/code files: 64
- JavaScript files: 1
- Image metadata files found in allowed extensions: 0
- Source binaries/PDFs were not copied into the repo.

## High-Value Sources Used

- `humanizacao.md`: Studio/Humanizacao reference, ArchVis workflow and prompt patterns.
- `humanize-floor-plan/SKILL.md`: humanized floor plan workflow.
- `humanize-floor-plan/references/ai-prompts-and-resources.md`: prompt resources and image-to-image guidance.
- `PROMPT PLANTA HUMANIZADA ING.pdf`: humanized floor plan prompt reference.
- `PROMPT POS PLANTA HUMANIZADA PT.pdf`: Portuguese humanized floor plan prompt reference.
- `Prompts Arquitetonicos AI.pdf` and `Prompts_Arquitetonicos_AI.pdf`: architectural prompt reference.
- `30--Prompts--Profissionais--para--Arquitetura--e--Design--de--Interiores.pdf`: architecture/interior prompt reference.
- `guia_cinematografico.pdf`: cinematic camera and video movement reference.
- `checklist_interior_futurista.pdf` and `Mood Board — Interiores Futuristas.pdf`: futuristic interior material/lighting/palette references.
- `PROMPT--PARA--TOPOGRAFIA--E--CASA--HOLOGRAMA.pdf`: topographic/hologram style reference.
- `prompt gemini para realismo em plan mais importante para render.txt`: realism prompt reference.
- `prompt para fachada do revit.txt`: facade prompt reference.
- `sequencia para planta realista.txt`: realistic plan sequence reference.
- `apex-global-orchestrator/**`: Apex orchestration, render, roadmap, handoff and skill-governance references.
- `skill APEXAICOPILOT/apex-copilot-construction-intelligence/**`: Apex Copilot construction intelligence package.
- `mcp-builder/**`, `web-artifacts-builder/**`, `algorithmic-art/**`: coding/platform/tool patterns.
- `doc-coauthoring/**`, `internal-comms/**`, `xlsx/**`, `pptx/**`: writing, documents, spreadsheets and presentation workflows.

## Files Skipped Or Used As Metadata Only

- PDFs were used as source-of-truth references by filename/category, not bulk-copied or embedded.
- Python helper scripts were classified as tool-code/reference patterns, not imported into runtime.
- Duplicate text/PDF prompt files were collapsed into category-level knowledge.
- `anthropic=0.39.0.txt` was classified as obsolete/dependency note and not integrated into runtime.

## Categories Created

- ArchVis / Humanizacao
- Image prompts / visual design
- Video / DirectCut
- Cinematic camera
- Interior / futuristic design
- BIM / CAD / 3D / Viewer
- Business / sales / CRM / proposals
- Coding / platform patterns
- Writing / documentation / humanizer
- Negotiation
- Data / analytics / spreadsheets
- Apex platform operations

## Generated Runtime Files

- `src/lib/apexSkillKnowledge/index.ts`
- `src/lib/apexSkillKnowledge/archvis.ts`
- `src/lib/apexSkillKnowledge/imagePrompts.ts`
- `src/lib/apexSkillKnowledge/videoPrompts.ts`
- `src/lib/apexSkillKnowledge/cinematic.ts`
- `src/lib/apexSkillKnowledge/interiors.ts`
- `src/lib/apexSkillKnowledge/bimCad.ts`
- `src/lib/apexSkillKnowledge/business.ts`
- `src/lib/apexSkillKnowledge/coding.ts`
- `src/lib/apexSkillKnowledge/writing.ts`
- `src/lib/apexSkillKnowledge/negotiation.ts`
- `src/lib/apexSkillKnowledge/data.ts`
- `src/lib/apexSkillKnowledge/platform.ts`

## Runtime Integration

- ArchVis now uses extracted prompt presets and negative-prompt patterns through `archvisPromptLibrary`.
- The Copilot server adds compact local skill context by intent instead of dumping all knowledge into every prompt.
- Preserve plan mode remains strict image-to-image only.
- Creative mode can use broader style/camera/technical presets.

## Result

The folder has been converted into a compact production knowledge layer for Apex AI Copilot without copying source PDFs/binaries or modifying the original skill folder.

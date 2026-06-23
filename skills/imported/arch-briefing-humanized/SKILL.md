---
name: arch-briefing-humanized
title: Architecture Briefing And Humanized Plan
description: Operational skill for architecture briefing, humanized floor plan prompts, and client-ready project narrative in Portuguese or English.
domains: [architecture, briefing, floor-plan, client-presentation]
tags: [briefing, arquitetura, planta humanizada, floor plan, layout, cliente]
triggers:
  - briefing de arquitetura
  - planta humanizada
  - humanized floor plan
  - prompt planta
  - layout arquitetonico
  - presentation plan
risk: low
enabled: true
---

# Architecture Briefing And Humanized Plan

Use this skill when the user needs an architectural briefing, room-by-room requirements, humanized plan prompt, or client-facing explanation of a layout.

## Workflow
- Capture project type, lot/site constraints, rooms, user profile, style, budget signal, deliverable, and language.
- Preserve floor plan geometry. Never add rooms, gardens, furniture, or boundaries unless the user requests a creative version.
- Separate required elements, optional elements, assumptions, and unknowns.
- For image prompts, specify top-down orthographic view, scale fidelity, furniture style, labels if needed, material palette, lighting, and negative prompt.
- Produce either a professional briefing, a prompt, or both depending on the user request.

## Output Patterns
- Architecture briefing form.
- Humanized plan prompt in Portuguese.
- Humanized plan prompt in English.
- Client presentation narrative.
- Geometry-preservation negative prompt.

## References
- `references/briefing de arquitetura.pdf`
- `references/PROMPT DE PLANTA HUMANIZADA PT.pdf`
- `references/PROMPT PLANTA HUMANIZADA ING.pdf`
- `references/summary.md`
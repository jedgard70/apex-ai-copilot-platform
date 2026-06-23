---
name: floor-plan-humanizer
title: Floor Plan Humanizer
description: Operational skill for converting floor plan inputs into humanized plan prompts, visual briefs, furniture/material direction, and geometry-preserving negative prompts.
domains: [architecture, floor-plan, archvis, image-prompt]
tags: [floor plan, planta humanizada, humanizador, layout, mobiliario, archvis]
triggers:
  - humanizar planta
  - planta humanizada
  - floor plan humanizer
  - humanizador plantas
  - mobiliario planta
  - top-down plan
risk: low
enabled: true
---

# Floor Plan Humanizer

Use this skill when the user wants to humanize a floor plan, create an image prompt from a plan, prepare furniture/material direction, or preserve architectural geometry in an image workflow.

## Workflow
- Confirm whether the task is preserve-mode or creative redesign.
- In preserve-mode, keep walls, openings, room count, wet areas, boundaries, pool, roads, and lot limits unchanged.
- Describe furniture, finishes, labels, shadows, landscaping, and graphic style without changing the plan.
- Add a negative prompt against changed geometry, added rooms, missing walls, perspective distortion, cropped plan, and invented site elements.
- If the plan image/file is not available, state that geometry cannot be verified and produce a template prompt.

## Output Patterns
- Humanized floor plan prompt.
- Negative prompt.
- Furniture and material schedule for plan view.
- Client-facing plan explanation.
- Image-to-image instruction block.

## References
- `references/SKILL-floor-plan-humanization.md`
- `references/floor-plan-humanizer.html`
- `references/humanizador-plantas.html`
- `references/summary.md`
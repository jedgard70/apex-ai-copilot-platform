---
name: 3d-render-studio
title: 3D Render Studio
description: Operational skill for turning architectural or product concepts into structured 3D render prompts, scene specs, camera plans, and studio-ready visual briefs.
domains: [architecture, 3d-render, archvis, visual-design]
tags: [render, 3d, archvis, studio, camera, lighting, materials]
triggers:
  - render 3d
  - 3d studio
  - renderapp
  - cena 3d
  - prompt de render
  - imagem arquitetonica
risk: low
enabled: true
---

# 3D Render Studio

Use this skill when the user asks for 3D render direction, architectural visualization prompts, camera setups, lighting, material palettes, or a studio brief for image generation.

## Workflow
- Identify the subject: building, facade, room, product, site, or concept.
- Preserve explicit geometry and constraints. Do not invent dimensions, rooms, terrain, or approvals.
- Produce a render brief with subject, style, materials, lighting, camera, composition, environment, and negative prompt.
- For architectural work, separate confirmed user inputs from assumptions and unknowns.
- When a real renderer or image generator is unavailable, return a production-ready prompt instead of claiming that an image was generated.

## Output Patterns
- Photorealistic render prompt.
- Camera and shot list.
- Material and lighting board.
- Negative prompt for geometry preservation.
- Studio handoff brief for Apex ArchVis / 3D Studio.

## References
- `references/renderapp.html`
- `references/summary.md`
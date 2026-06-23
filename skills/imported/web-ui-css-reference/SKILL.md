---
name: web-ui-css-reference
title: Web UI CSS Reference
description: Operational reference skill for auditing external CSS assets, extracting reusable UI patterns, and avoiding unsafe direct imports of minified third-party styles.
domains: [frontend, css, ui-design, design-system]
tags: [css, ui, frontend, design system, chat ui, components, styles]
triggers:
  - css externo
  - arquivos css
  - ui css
  - design system css
  - chat ui styles
  - estilos importados
risk: medium
enabled: true
---

# Web UI CSS Reference

Use this skill when the user asks about external `.css` assets collected in `D:\AI Jedgard\skill`, UI styling references, chat interface styles, component styling, or whether CSS files should be integrated into Apex.

## Workflow

- Treat external CSS as reference material first, not active application code.
- Classify files by role: component UI, chat surface, code block, modal/popover, map/data visualization, vendor library, or downloaded-page residue.
- Do not import minified third-party CSS into the app automatically.
- Extract reusable ideas into Apex-native CSS/Tailwind/component patterns only after reviewing source purpose and license risk.
- Avoid copying OAuth/admin-console page assets into runtime styling.

## Current Audit Snapshot

- 36 CSS files found under `D:\AI Jedgard\skill` after excluding `.venv`, `node_modules`, `.git`, `build`, `dist`, and `__pycache__`.
- Approximate total size: 3.6 MB.
- Most files are minified/exported UI assets in the root of the external archive.
- One CSS file belongs to a downloaded Google OAuth console page asset folder and should not become Apex runtime styling.

## Useful Pattern Families

- Chat/message UI: `AssistantMessage`, `conversation-small`, `cot-message`, `user`.
- Inputs and controls: `Input`, `Select`, `SegmentedControl`, `RadioGroup`, `DatePicker`, `Popover`.
- Code and writing surfaces: `code-block`, `code-block-editor`, `code-block-viewer`, `writing-block-provider`, `ansi`.
- Data/map/visualization: `ADAVisualizationComponent`, `mapbox-gl`, `map-with-entities`, `table-components`, `page-table-row`.
- Modal/media shell: `global-modals`, `fullscreen`, `Image`, `Avatar`, `AnimatedMascot`, `silk`.

## Output Patterns

- CSS audit report.
- Design-system extraction plan.
- Component styling checklist.
- Safe migration plan from external CSS into Apex-native UI.
- Recommendation: import, summarize, ignore, or reimplement.

## References

- `references/summary.md`
---
name: apex-ai-copilot
title: apex-ai-copilot
description: Use when building, auditing, designing, or operating the Apex AI Copilot platform. Covers live conversational Copilot behavior, construction-specialized workflows, production architecture, file intake, ArchVis/Humanizacao, DirectCut/video, BIM/3D viewer strategy, prompt systems, UI patterns, codebase patterns, and clean rebuild decisions from local Apex knowledge assets.
kind: runtime-skill
---

# Apex AI Copilot

Use this skill when work involves the new Apex AI Copilot platform, Apex Global construction intelligence, platform rebuild decisions, or module workflows powered by the Copilot.

## Core Product Truth

- Apex AI Copilot is the central agent; chat is the platform.
- Modules are tools called by the Copilot, not the primary intelligence.
- No cards as primary intelligence. Cards/chips/modules may support the conversation after the Copilot answers.
- The Copilot must behave like a real conversational AI specialized for construction and platform building.
- It must help code, design, generate, analyze, route work, and explain production decisions.
- It must not fake intelligence, file parsing, 3D viewing, generated outputs, conversion, budget, legal review, or approval.

## Operating Workflow

1. Start with the user goal and uploaded asset/context.
2. Choose the relevant domain internally; do not force the user to pick a department first.
3. Load only the reference files needed for the domain.
4. Prefer clean rebuild decisions over blindly copying old code.
5. Reuse proven patterns, rewrite broken or patchy implementations, and mark old PR/audit artifacts as provenance only.
6. When building UI, make Apex Copilot chat primary and modules/tools secondary.

## Reference Map

- Behavior contract: `references/copilot-behavior.md`
- Production architecture: `references/production-architecture.md`
- Universal file intake: `references/file-intake.md`
- ArchVis/Humanizacao: `references/archvis-production.md`
- DirectCut/video: `references/directcut-production.md`
- BIM/3D viewer: `references/bim-viewer-production.md`
- Reusable codebase patterns: `references/codebase-patterns.md`
- UI/UX patterns: `references/ui-ux-patterns.md`
- Prompt systems: `references/prompt-systems.md`
- Image/render references: `references/image-render-references.md`
- Roadmap: `references/platform-roadmap.md`
- Source truth index: `references/source-truth-index.md`

## Reuse Policy

- `reuse`: proven pattern can be carried forward with minimal adaptation.
- `rewrite`: useful intent exists, but implementation should be rebuilt cleanly.
- `reference only`: use as product/visual/domain guidance, not source code.
- `obsolete`: keep for history only; do not treat as current product truth.
- `ignore`: low-signal or unrelated for the new platform.

## Validation Standard

Before claiming a module works, verify real runtime behavior: chat response, file preview, API response, model/viewer output, and build status. Build passing alone is not product validation.

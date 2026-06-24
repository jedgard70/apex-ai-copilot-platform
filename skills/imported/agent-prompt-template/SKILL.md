---
name: agent-prompt-template
title: Agent Prompt Template
description: Operational skill for designing strong agent prompts, role instructions, workflows, constraints, and reusable prompt templates.
domains: [prompt-engineering, agent-design, workflow-design]
tags: [agent, prompt, template, instruction, workflow, system prompt]
triggers:
  - prompt agente
  - agent prompt
  - criar agente
  - prompt template
  - instrucoes de agente
  - system prompt
risk: low
enabled: true
kind: runtime-skill
---

# Agent Prompt Template

Use this skill when the user wants to create, improve, audit, or operationalize prompts for AI agents, assistants, workflows, or specialized roles.

## Workflow
- Capture the agent mission, target user, inputs, outputs, boundaries, tools, and failure modes.
- Convert loose instructions into a reusable prompt with role, operating rules, trigger examples, output format, and safety constraints.
- Prefer concrete actions and evaluation criteria over generic personality text.
- Keep secrets, credentials, and private environment details out of prompts.
- For production agents, include test prompts and expected behavior.

## Output Patterns
- Full agent prompt.
- System/developer instruction draft.
- Skill wrapper draft.
- Prompt QA checklist.
- Test prompt set.

## References
- `references/Aula+15+-+Prompt+Agente.pdf`
- `references/summary.md`
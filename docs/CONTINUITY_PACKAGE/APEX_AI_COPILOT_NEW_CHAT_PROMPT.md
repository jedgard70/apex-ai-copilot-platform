# Prompt For A New Chat

Paste this into a new ChatGPT/Codex/Gemini/Claude session if the current chat gets too heavy:

```text
We are continuing the Apex AI Copilot rebuild.

First, read the updated handoff files before doing anything:

D:\AI-constr\apex-ai-copilot-platform\docs\CONTINUITY_PACKAGE\APEX_AI_COPILOT_CONTINUITY.md
D:\AI-constr\apex-ai-copilot-platform\docs\CONTINUITY_PACKAGE\APEX_AI_COPILOT_CURRENT_STATE.md
D:\AI-constr\apex-ai-copilot-platform\docs\CONTINUITY_PACKAGE\APEX_AI_COPILOT_NEXT_STEPS.md
D:\AI-constr\apex-ai-copilot-platform\docs\CONTINUITY_PACKAGE\APEX_AI_COPILOT_AUDIT_LOG.md
D:\AI-constr\apex-ai-copilot-platform\docs\CONTINUITY_PACKAGE\APEX_AI_COPILOT_DECISIONS.md
D:\AI-constr\apex-ai-copilot-platform\docs\CONTINUITY_PACKAGE\APEX_AI_COPILOT_RISKS.md
D:\AI-constr\apex-ai-copilot-platform\docs\CONTINUITY_PACKAGE\APEX_AI_COPILOT_CHANGELOG.md

Current candidate repo:
D:\AI-constr\apex-ai-copilot-platform

Source routing:
- D:\AI-constr\apex-ai-copilot-platform is the main candidate base.
- F:\AI-Construction-Intelligence-Platform is inventory/reference.
- D:\documentos\backup AI edgard is strategic/historical backup.
- Do not bulk copy backup material.

Status:
ETAPA 1-A was completed with blockers.
ETAPA 1-B updated the handoff only.
CP15B is GREEN local.
CP15C Auth Gate is the next checkpoint.

Do not assume GREEN.
There is no overall GREEN without APEX_FINAL_VALIDATION_MATRIX.md.
Use evidence labels:
- COMPROVADO
- NAO COMPROVADO
- FALHOU FUNCIONALMENTE
- FALHOU VISUALMENTE
- BLOQUEANTE

Product truth:
Apex AI Copilot must be a SaaS Copilot-first platform from the foundation. It must be premium, multi-user, guided by AI, centered on the Copilot, supported by contextual help, real modules, real data, and complete design.

Current candidate platform truth:
- apex-ai-copilot-platform exists and has a real Vite + React + TypeScript + Node server.mjs base.
- /api/copilot/chat exists locally.
- OpenAI is wired through OPENAI_API_KEY.
- Supabase client, AuthPanel and Auth Gate exist in code.
- Supabase migrations 0001 to 0006 exist.
- project_messages, project_files and project-uploads exist in migrations/source.
- Partial project sync exists.
- Vercel config exists.
- Production SaaS completeness is NOT proven.
- Functional Vercel production is NOT proven.
- Complete remote persistence/restore is NOT proven.
- Final premium design is NOT proven.

Next required step:
ETAPA 1-C - read-only audit of AI-Construction-Intelligence-Platform.

Rules:
- Do not implement before auditing the larger platform.
- Treat AI-Construction-Intelligence-Platform as mandatory functional inventory.
- Do not patch/remend the old platform.
- Do not abandon important modules without comparison.
- Do not touch domain settings.
- Do not deploy.
- Do not run Supabase migrations.
- Do not change Vercel/Supabase remote state.
- Do not install dependencies.
- Do not expose secrets.
- Update handoff after every completed etapa before moving forward.
```

# Apex Operational Skills Routing Audit

Generated: 2026-06-13
Repo: `D:\AI-constr\apex-ai-copilot-platform`
Scope: read-only audit of operational skills, routing, UI surfaces, backend endpoints and Project Workspace persistence.

## Audit Rules Applied

- No application code, package files, existing docs, Supabase remote state, Vercel state or `.env.local` were changed.
- The only intended write in this checkpoint is this report.
- Supabase and Vercel were audited from local source/docs only.
- Execution was classified from local files, not from live browser/API testing.

## Evidence Read

- Continuity package:
  - `docs/CONTINUITY_PACKAGE/APEX_AI_COPILOT_NEW_CHAT_PROMPT.md`
  - `docs/CONTINUITY_PACKAGE/APEX_EVIDENCE_REGISTER.md`
  - `docs/CONTINUITY_PACKAGE/APEX_FINAL_VALIDATION_MATRIX.md`
  - `docs/CONTINUITY_PACKAGE/APEX_MODULE_STATUS.md`
  - `docs/CONTINUITY_PACKAGE/APEX_KNOWLEDGE_SOURCE_INDEX.md`
- Core runtime and routing:
  - `server.mjs`
  - `src/main.tsx`
  - `src/lib/runtimeKnowledge.json`
  - `src/lib/toolData.ts`
  - `src/lib/toolRegistry.ts`
  - `src/lib/apexSkillKnowledge/index.ts`
  - `src/lib/projectWorkspace.ts`
  - `src/lib/projectPersistenceAdapter.ts`
- Operational surfaces:
  - `src/lib/copilotExecutionRegistry.ts`
  - `src/components/CopilotExecutionPanel.tsx`
  - `src/components/SkillExportPanel.tsx`
  - `src/components/AgentsPanel.tsx`
  - `src/components/Bim3DPanel.tsx`
  - `src/components/ArchVisPanel.tsx`
  - `src/components/DirectCutPanel.tsx`
- Skill docs:
  - `docs/APEX_PLATFORM_ENGINEERING_SKILL.md`
  - `docs/APEX_WINDOWS_CARE_CODING_SKILL.md`
  - `docs/APEX_REVIT_CUSTOMIZATION_SKILL.md`

## Routing Model Found

The platform has three distinct layers that are easy to confuse:

1. Knowledge selection: `selectApexSkillKnowledge()` in `src/lib/apexSkillKnowledge/index.ts` injects compact domain context into chat. This can make a skill answer well without making it executable.
2. Registry selection: `toolData.ts` and `toolRegistry.ts` classify tools and triggers. This does not automatically open a panel or call an endpoint unless `src/main.tsx` has a matching intent branch.
3. Operational routing: `src/main.tsx` has explicit `isXIntent()` checks that open panels and/or call backend endpoints. Only these are real chat-to-action routes.

## Mandatory Matrix

| Skill | Docs | Knowledge Lib | Runtime | Registry | UI | Endpoint | Chat Routing | Execution Level | Blocker | Minimal Fix |
|---|---|---|---|---|---|---|---|---|---|---|
| Platform Engineering / DevOps Skill | Yes: `APEX_PLATFORM_ENGINEERING_SKILL.md`, continuity docs | Yes: `platformEngineering.ts`, `index.ts` | Yes: systemPrompt and tools include Platform Engineering / DevOps | Yes: `platform-engineering-devops` in `toolData.ts`; `toolRegistry.ts` can select it | No dedicated panel; only chat/Owner Console/Execution adjacent | Partial: `/api/copilot/chat`; execution endpoints only for local allowlisted commands | Knowledge route via chat context; no dedicated `shouldOpenPlatformEngineering` panel route | ROUTED_PLANNING_ONLY | missing UI; no handler; external connectors not configured | Add explicit platform-engineering intent branch that opens an existing report/workspace surface or Copilot Execution when command intent is present; keep GitHub/Vercel/Supabase as verified-source-only. |
| Code Skill / livre code | Partial: no dedicated Code Skill doc; coding rules appear in Windows Care and runtime | Yes: `coding.ts`, selected by code/react/typescript/api/platform | Yes: coding/code copilot in capabilities and systemPrompt | Yes: `coding-support` and `platform-build` in `toolData.ts` | No dedicated Code panel; Copilot Execution is adjacent | Partial: `/api/copilot/chat`; `/api/copilot/execution/*` for allowlisted/raw shell | Chat answers code requests; execution opens only for explicit local execution phrases | ROUTED_PLANNING_ONLY | unclear command phrase; missing UI; no dedicated handler | Define accepted phrases for "livre code" and route either to plain chat coding or existing Copilot Execution with owner-gated raw shell. |
| Owner Execution / Checkpoint Manager | Partial: continuity/checkpoint docs mention governance; execution model in source | No dedicated knowledge domain; platform/coding/windows rules cover safety | Yes: local execution and approval rules in runtime/server | Yes: `copilot-execution` in `toolData.ts` and `copilotExecutionRegistry.ts` | Yes: `CopilotExecutionPanel` inside Owner Console | Yes: `/api/copilot/execution/commands`, `/api/copilot/execution/run` | Yes: `isCopilotExecutionIntent`; Owner-only gate | ROUTED_LOCAL_ACTION | safety gate; auth/owner role; raw shell approval | Keep as Owner-only. Add a named "checkpoint manager" route only if it reuses existing Execution/Workspace surfaces and does not add free shell. |
| Mission Control / Owner Command | Partial: Owner Console exists; Mission Control wording is not a named module | No dedicated Mission Control domain | Partial: Owner/Admin rules and governance prompt handling | No explicit Mission Control registry entry | Partial: Owner Console with Skill Export, Execution, Auth diagnostics | Partial: execution/auth/skill endpoints, no mission-control endpoint | Partial: owner console button and some owner/admin chat triggers; no `Mission Control` phrase route | EXISTS_BUT_NOT_ROUTED | missing registry entry; missing route; unclear command phrase | Alias "Mission Control" and "Owner Command" to existing Owner Console, Execution and Project Workspace instead of building a new panel. |
| Windows Care / Windows Repair / Coding Assistant | Yes: `APEX_WINDOWS_CARE_CODING_SKILL.md` | Yes: `windowsCare.ts`, selected by windows/powershell/defender/etc. | Yes: Windows Care rules in systemPrompt and memorySummary | Yes in `runtimeKnowledge.json`; missing from current `toolData.ts` source list observed, despite runtime tool entry | No dedicated Windows panel | No Windows diagnostic endpoint | Chat knowledge route only; no automatic diagnostics route in product UI | KNOWLEDGE_ONLY | missing UI; missing endpoint; safety gate | Keep default audit-only. Add explicit read-only diagnostics command set only through existing Copilot Execution allowlist after Owner approval. |
| Revit Customization / Plugin Skill | Yes: `APEX_REVIT_CUSTOMIZATION_SKILL.md` | Yes: `revitCustomization.ts`, selected by revit/dynamo/pyrevit/plugin/add-in/etc. | Yes: Revit rules in systemPrompt, memorySummary and tools | Yes: `revit-customization` in `toolData.ts` | No dedicated Revit panel; BIM/3D panel is adjacent | No Revit/plugin endpoint | Chat knowledge route only; BIM file route handles BIM/CAD, not Revit plugin generation as a workspace | KNOWLEDGE_ONLY | missing UI; missing endpoint; no handler | Route Revit customization prompts to chat deliverables plus optional BIM/3D Studio handoff for IFC/GLB/export workflows. |
| Revit Configuration Templates / pyRevit / MCP | Partial: covered inside Revit customization doc | Yes: `revitCustomization.ts` covers templates, pyRevit and plugin structure | Yes: Revit/pyRevit guidance in runtime | Partial: `revit-customization` registry triggers pyrevit/templates; no MCP-specific route | No dedicated template/pyRevit workspace | No endpoint for creating/installing templates or MCP servers | Chat knowledge route only | KNOWLEDGE_ONLY | docs only; no handler; safety gate | Keep output as generated instructions/code snippets until an approved file-generation/export workflow is added. |
| Skill Export Factory | Partial: continuity mentions skill export; implementation is source-first | Partial: factory uses runtime/tool knowledge, not an apexSkillKnowledge domain | Yes: approved skill updates and export behavior in runtime/server | Partial: not in `toolData.ts` as a normal tool; routed by `isSkillExportIntent()` | Yes: `SkillExportPanel` in Owner Console | Yes: `/api/copilot/export-skill-pack` | Yes: explicit skill export intent, Owner-only gate | ROUTED_REAL_ACTION | auth/owner role | Already actionable locally. Minimal fix is to add registry visibility so it appears in tool summaries without duplicating functionality. |
| Agents / Maestro / BIM Manager / Cost Controller / Doc Manager | Partial: continuity/module status; `apexAgents.ts` is source of truth | Yes: `apexAgents.ts`; not part of `apexSkillKnowledge` map | Yes: cognitive agents in runtime systemPrompt/memory/tools | Yes: `cognitive-agents` in `toolData.ts` | Yes: `AgentsPanel` | No dedicated agents endpoint; panel is static/local | Yes: `isAgentIntent()` opens AgentsPanel | UI_ONLY | no handler; planning/local status by design | Add backend agent report endpoint only if needed; otherwise keep as honest local registry/panel. |
| BIM / 3D Studio | Yes: continuity/module status and runtime | Yes: `bimCad.ts`, selected by ifc/rvt/dwg/dxf/skp/bim/cad/3d | Yes: BIM hard rules in runtime | Yes: `bim-viewer` in `toolData.ts` | Yes: `Bim3DPanel` | Yes: `/api/copilot/bim-plan`, `/api/copilot/bim-tour-plan` | Yes for BIM/CAD file or BIM intent; opens panel | ROUTED_PLANNING_ONLY | parser/viewer/converter not connected | Connect real IFC/GLB parser/viewer first; keep RVT/DWG/DXF/SKP as import-required until converter exists. |
| ArchVis Studio | Yes: continuity/module status and runtime | Yes: `archvis.ts`, image prompt libs | Yes: ArchVis prompt rules in runtime | Yes: `archvis` in `toolData.ts` | Yes: `ArchVisPanel` | Yes: `/api/copilot/generate-image`, `/api/copilot/image-edit-plan` | Yes when image/planta/render intent with image attachment | ROUTED_REAL_ACTION | connector/env may be not connected; source image required for preserve mode | Already routed. Next fix is stronger provider-state messaging and connector QA with approved key. |
| DirectCut Studio | Yes: continuity/module status and runtime | Yes: `videoPrompts.ts`, cinematic knowledge | Yes: DirectCut/video rules in runtime | Yes: `directcut` in `toolData.ts` | Yes: `DirectCutPanel` | Yes: `/api/copilot/video-plan` | Yes: `isDirectCutIntent()` opens panel | ROUTED_PLANNING_ONLY | no video generation connector | Keep planning-only labels; add real video connector only when selected and gated. |
| Supabase/Auth tooling | Yes: many Supabase docs plus continuity state | Partial: platformEngineering/multiTenant/auth code; no apexSkillKnowledge Supabase-only domain | Yes: runtime and continuity mention Supabase/auth/RLS | Yes: Platform Engineering, Multi-tenant, Metrics mention Supabase; no Supabase-only tool entry | Yes: AuthPanel/UserAccountPanel/ProjectWorkspace sync controls | Partial: `/api/copilot/auth-plan`; browser client and remote sync functions | Yes for auth intent and Project Workspace sync button; real behavior depends on env/session/bootstrap | ROUTED_REAL_ACTION | auth/owner role; connector/env not configured; remote restore incomplete | Complete CP15 Auth Gate validation and remote restore; do not mutate Supabase without a dedicated checkpoint. |
| Vercel/GitHub status tooling | Yes: Vercel readiness/deployment docs and Platform Engineering doc | Yes via `platformEngineering.ts` | Yes: runtime warns not to fake GitHub/Vercel status | Partial: Platform Engineering registry; Metrics local demo; no GitHub/Vercel status tool | No dedicated status panel; Metrics Dashboard is local demo only | No real Vercel/GitHub endpoint; Copilot Execution has git status/log allowlist | Partial: platform chat and execution phrases; live external status not routed | ROUTED_PLANNING_ONLY | connector not configured; missing endpoint; no handler | Add read-only status route only when connector/CLI output is available; otherwise keep as checklist/plan. |

## Skills Ja Realmente Acionaveis

- ArchVis Studio: opens from image/render/planta intent with an image attachment, calls `/api/copilot/generate-image` or image edit planning. Real generation depends on OpenAI image env/provider state.
- Skill Export Factory: Owner-only, opens from explicit skill export commands and calls `/api/copilot/export-skill-pack`.
- Copilot Execution: Owner-only, opens from local execution/repo checks/build checks/git status phrases and calls `/api/copilot/execution/*`. Allowlisted commands exist; raw shell requires explicit Jose approval text.
- Supabase/Auth local tooling: Auth diagnostics and browser auth state are wired locally; Project Workspace can attempt metadata sync when Supabase env/session/bootstrap are ready.
- Agents panel: opens from agent/maestro/BIM manager/EVM/NR/cost/doc/scheduler/quality phrases. It is a local registry/report surface, not autonomous execution.

## Skills Existentes Mas Nao Roteadas

- Mission Control / Owner Command: Owner Console exists, but those phrases are not first-class registry/intent aliases.
- Windows Care / Windows Repair: knowledge and runtime rules exist, but no dedicated diagnostics endpoint/panel is routed.
- Revit Customization / pyRevit / plugin generation: knowledge and registry exist, but no panel or backend handler exists; it answers in chat only.
- Platform Engineering / DevOps: knowledge and registry exist, but there is no dedicated panel/endpoint for audit reports except generic chat and Copilot Execution.
- Code Skill / livre code: coding knowledge exists, but "livre code" is not a clear routed phrase. Actual local command execution is separate and Owner-gated.

## Skills Planning-Only

- BIM / 3D Studio: real panel and endpoints exist, but viewer/parser/converter returns planning-only/import-required behavior until real geometry tooling is connected.
- DirectCut Studio: real panel and backend planner exist, but there is no real video generator connector.
- Vercel/GitHub status: planning/checklist behavior exists; live status requires connector, CLI output, URL evidence or local command output.
- Multi-tenant/PWA/Digital Twin/Knowledge Base/Metrics, observed adjacent to the requested list, are local-first planning modules per runtime memory.

## Skills Documentais

- Revit Configuration Templates / pyRevit / MCP: currently documentation/knowledge/code-snippet generation only.
- Windows Repair cleanup flows: documented safety model only unless approved commands are added to execution registry.
- Platform Engineering external operations: docs and runtime behavior define evidence rules, but external actions are not automatic.

## Skills Quebradas Ou Orfas

- Windows Care appears in `runtimeKnowledge.json` tools but was not present in the current `src/lib/toolData.ts` list read during this audit. That makes it visible to the runtime brain but not necessarily to the current frontend registry selector.
- Mission Control / Owner Command is conceptually present as Owner Console, but orphaned as vocabulary: the phrase itself is not a first-class route.
- "Code Skill / livre code" is ambiguous: general code requests route to chat knowledge, while local execution requires separate Copilot Execution phrasing.
- Vercel/GitHub status tooling is not broken, but incomplete: there is no live status endpoint, so any claim must remain planning-only unless evidence is supplied.

## Menor Plano Para Ativacao

1. Vocabulary alignment only: add aliases in existing routing for "Mission Control", "Owner Command", "Windows Care", "Windows Repair", "livre code" and "Revit templates" without creating new panels.
2. Reuse existing surfaces:
   - Owner Command -> Owner Console.
   - livre code -> chat coding mode, or Copilot Execution only when the user asks to run local commands.
   - Windows Care -> Copilot Execution allowlisted read-only diagnostics only.
   - Revit templates/pyRevit -> chat deliverables plus Skill Export/Project Workspace where applicable.
3. Promote only the safest executable subset first:
   - read-only Windows diagnostics,
   - git status/log/diff checks,
   - node/server syntax checks,
   - export/report generation.
4. Keep external systems gated:
   - Supabase only in a Supabase checkpoint,
   - Vercel/GitHub status only with connector/CLI/URL evidence,
   - Revit install/test only outside Apex after explicit Owner approval,
   - BIM/DirectCut real output only after real viewer/video connector.
5. Add no duplicate modules. Any activation should wire existing `toolData`, `isXIntent`, Owner Console, Project Workspace and existing backend endpoints together.

## Secret Scan

Report scan target: this markdown file only.

Command executed:

```text
rg -n "sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|eyJ[A-Za-z0-9_-]{20,}|service_role|password\s*[:=]|token\s*[:=]|api[_-]?key\s*[:=]|\.env\.local" docs/CONTINUITY_PACKAGE/APEX_OPERATIONAL_SKILLS_ROUTING_AUDIT.md
```

Result: benign references only. Hits were limited to policy/report text mentioning `.env.local`, service-role/password/token/API-key terms, and the scan command itself. No actual API keys, bearer tokens, GitHub tokens, Supabase service-role keys, passwords or `.env.local` values were included.

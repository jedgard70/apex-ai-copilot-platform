# Apex Legacy Coverage Audit

Date: 2026-06-09

Scope: compare the new Apex AI Copilot platform against the legacy landing/report capability direction, including the legacy 8 cognitive agents and the legacy pipeline/report vision.

Truth rule: this audit does not mark a capability complete unless the new platform has a visible UI/workspace, local data model, backend endpoint or runtime knowledge path. External connectors, real databases, real auth, payments, live pricing, legal approval, safety compliance and real BIM parsing remain unconfirmed until connected and verified.

## Coverage Map

| Legacy capability | Old status | New platform equivalent | Current status | Missing gaps | Recommended checkpoint |
|---|---:|---|---:|---|---|
| Chat-first AI command center | Vision / landing promise | Apex AI Copilot chat runtime with upload, image vision path and tool routing | Partial | Needs deeper multi-agent memory and confirmed connector orchestration | Agent runtime / orchestration |
| Universal file intake | Vision / partially described | Universal upload, preview, metadata, image dataUrl and project workspace persistence | Partial | Deeper parsers for PDF/CAD/BIM and safer large-file storage | File extraction / storage connector |
| ArchVis / humanized floor plan | Legacy visual promise | ArchVis Studio, strict preserve mode, image generation connector, prompt library, revision memory | Partial | Provider fidelity is still variable; no guaranteed plan-accurate generation | ArchVis fidelity and provider evaluation |
| DirectCut / video | Legacy video promise | DirectCut Studio, planning controls, script, storyboard, prompt and gallery | Partial | No real video generation connector yet | Video connector checkpoint |
| BIM / 3D viewer | Legacy platform pipeline | BIM / 3D Studio, internal-first import/viewer foundation, evidence labels, tours/corrections | Partial | Real IFC parser/viewer extraction and clash/quantity automation still needed | BIM viewer/parser hardening |
| Budget / quantity | Legacy project intelligence | Budget Studio with assumptions, estimate table, confidence/source labels and proposal draft | Partial | No real SINAPI/source connector; no confirmed quantities from BIM parser | Pricing/SINAPI + BIM quantity checkpoint |
| Contracts / permits | Legacy document intelligence | Contracts / Permits Studio with risk review, permit package builder and evidence labels | Partial | No live jurisdiction/legal source connector; no legal approval | Legal/source verification connector |
| Field Operations / RDO | Legacy field/reporting direction | FieldOps Studio with RDO, photo log, safety, quality, punch list and client report | Partial | No weather connector, inspection approval or dedicated NR compliance engine | NR Compliance / Field evidence checkpoint |
| Export/report package | Legacy report pipeline | Export Center packages existing local workspace outputs with redaction | Implemented local-first | Needs database permissions/versioning and downloadable zip enhancements | Export packaging v2 |
| Project workspace | Legacy continuity promise | Local Project Workspace with autosave, import/export JSON and restored app state | Implemented local-first | No database/auth/RLS; localStorage only | Auth/database workspace checkpoint |
| SaaS/client portal | Legacy business platform direction | Local-first SaaS Admin, CRM, Finance, Client Workspace scaffold | Partial | No real auth, no database, no payments, no client isolation enforcement | Auth/RLS/client portal checkpoint |
| Accounting / contabilidade | Legacy finance expansion | Finance accounting preparation, ledger, tax checklist, accountant handoff package | Partial | No tax connector, no accountant integration, no compliance confirmation | Accounting connector / jurisdiction review |
| Research / market intelligence | Legacy business intelligence | Research Studio with source confidence and web-not-connected honesty | Partial | No live web/source connector yet | Web/source connector checkpoint |

## Legacy 8 Cognitive Agents

| Legacy agent | New equivalent | Status | Gap | Recommended checkpoint |
|---|---|---:|---|---|
| Maestro AI | `src/lib/apexAgents.ts` + Agents Panel orchestration overview | Partial | Needs true autonomous multi-agent planning/execution | Agent runtime |
| BIM Manager Agent | BIM / 3D Studio, tours, corrections, import/viewer flow | Partial | Needs real parser/viewer extraction and clash evidence | BIM parser/viewer hardening |
| EVM Analyst Agent | Agent registry only, connected to Budget/FieldOps future schedule | Planned | Missing PV, EV, AC, CPI, SPI, EAC, VAC, TCPI engine | CP11C EVM |
| NR Compliance Agent | Agent registry + FieldOps safety awareness | Planned | Missing NR-6, NR-10, NR-18, NR-33, NR-35 source-backed engine | CP11C NR Compliance |
| Cost Controller Agent | Budget + Finance + Research/SINAPI awareness | Partial | Missing real pricing/SINAPI connector and confirmed cost source | SINAPI/source confidence |
| Doc Manager Agent | Project Workspace + Export Center + Contracts/FieldOps docs | Implemented local-first | Needs database permissions/versioning | Auth/database document management |
| Scheduler Agent | Agent registry only, connected to FieldOps/Budget future schedule | Planned | Missing Gantt, milestones, dependencies, critical path, physical-financial schedule | CP11C Scheduler |
| Quality QA Agent | FieldOps quality/punch list + Contracts awareness | Partial | Missing NCI, PBQP-H/ISO workflows and deeper quality tracking | Quality QA / NCI expansion |

## Current New Platform Modules

- Apex AI Copilot chat: active command center.
- Project Workspace: localStorage persistence, import/export JSON.
- ArchVis Studio: image/reference workflow, generation connector, revision constraints.
- DirectCut Studio: video planning, storyboard, prompt and gallery.
- BIM / 3D Studio: internal-first viewer/import foundation, reports, tours, corrections.
- Budget Studio: preliminary estimates with confidence/source labels.
- Contracts / Permits Studio: risk, permit and document package intelligence.
- FieldOps / RDO Studio: daily reports, photo logs, safety, quality and punch lists.
- Research Studio: source confidence and web-not-connected honesty.
- Export Center: packages existing local project outputs with redaction.
- SaaS / CRM / Finance layer: local-first users, roles, client workspace, CRM, sales, finance and accounting preparation.
- Cognitive Agents Panel: overview of 8 legacy cognitive agents with status and gaps.

## Recommended Checkpoint Order

1. CP11C: EVM + Scheduler + NR Compliance foundation.
2. BIM parser/viewer hardening: real IFC evidence extraction and clash metadata.
3. Auth/database/RLS: real client workspace isolation and user roles.
4. Pricing/source connectors: SINAPI upload/source verification and finance/accounting evidence.
5. Agent runtime: Maestro-led multi-agent planning, task memory and cross-studio actions.


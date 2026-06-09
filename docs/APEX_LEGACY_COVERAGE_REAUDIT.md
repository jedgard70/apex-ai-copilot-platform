# Apex Legacy Coverage Re-Audit

Date: 2026-06-09

Baseline: `24cc9a8 feat: add supply chain notifications ai cost dashboard`

Scope: re-audit the legacy landing/report/platform promise against the current Apex AI Copilot platform after CP11F.

Truth rule: this is an audit checkpoint only. A capability is not marked real/complete when it is only local demo, localStorage, planning-only, skill-only, connector-ready, or prompt knowledge. External systems such as Supabase, Vercel, payments, live web, live SINAPI, official legal review, official safety approval, real BIM parsing and real multi-tenant isolation remain `NEEDS VERIFICATION` until connected and verified.

Evidence labels:
- `CONFIRMED`: supported by current files, components, libs or server endpoints in this repo.
- `ASSUMPTION`: inferred from current architecture or integrated knowledge, but not a working UI/workflow by itself.
- `NEEDS VERIFICATION`: requires real connector, external service, auth/database, deployment or source-backed validation.

Coverage statuses:
- `COVERED`: usable local-first workflow exists.
- `PARTIALLY COVERED`: some UI/workflow/knowledge exists, but key production path is missing.
- `MISSING`: no meaningful current UI/workflow exists.
- `BETTER THAN LEGACY`: current platform exceeds the legacy promise in local-first breadth or workflow clarity, while still respecting production limitations.

## Executive Summary

The new Apex AI Copilot platform now covers the core legacy promise better than the old landing/report in several areas: chat-first command center, ArchVis, DirectCut planning, BIM/3D internal-first foundation, Budget, Contracts/Permits, FieldOps/RDO, Export Center, Project Workspace, Skill Update/Export, Revit automation knowledge, platform engineering knowledge, SaaS/CRM/Finance scaffolding, and the 8 cognitive agents map.

The biggest remaining gaps are not UI quantity; they are production infrastructure and source truth: real auth/database/multi-tenant isolation, real Supabase/RLS, Vercel deployment readiness, real IFC parsing/viewer extraction, real SINAPI/source connectors, real payment/fiscal/accounting connectors, installable PWA validation, real-time digital twin connectors, governed knowledge persistence, production telemetry, and production connectors for suppliers, notifications and provider billing.

## Detailed Re-Audit Table

| # | Category | Status | Evidence | Legacy capability | New platform equivalent | Current limitation | Next checkpoint |
|---:|---|---|---|---|---|---|---|
| 1 | Landing services | BETTER THAN LEGACY | CONFIRMED: `src/lib/toolData.ts`, `src/main.tsx`, studio panels | Legacy landing advertised services as static offerings | Chat-first tool registry and studios for ArchVis, DirectCut, BIM, Budget, Contracts, FieldOps, Research, SaaS/CRM/Finance | No public marketing landing/page in this repo; platform is app-first | Later public website/landing remains separate from app |
| 2 | 8 cognitive agents | COVERED | CONFIRMED: `src/lib/apexAgents.ts`, `src/components/AgentsPanel.tsx` | Legacy promised 8 agents | Agents registry/panel with Maestro, BIM Manager, EVM, NR, Cost, Doc, Scheduler, Quality QA | Maestro is still partial; no autonomous multi-agent execution runtime | Agent runtime / autonomous orchestration |
| 3 | BIM 3D / 6D / 7D | PARTIALLY COVERED | CONFIRMED: `src/components/Bim3DPanel.tsx`, `server.mjs` `/api/copilot/bim-plan`, `/api/copilot/bim-tour-plan` | Legacy BIM pipeline and 3D/6D/7D intelligence | Internal-first BIM/3D Studio, import path, tours, corrections, evidence labels | No confirmed real IFC parser/clash/quantity extraction; 6D/7D are planning-level via budget/schedule/ops links | BIM parser/viewer hardening + digital twin |
| 4 | EVM / CPI / SPI / EAC / TCPI | COVERED | CONFIRMED: `src/components/EvmSchedulerCompliancePanel.tsx`, `src/lib/evmSchedulerComplianceKnowledge.ts`, `server.mjs` `/api/copilot/evm-scheduler-compliance` | Legacy EVM analytics promise | Local-first EVM Analyst with PV, EV, AC, CPI, SPI, CV, SV, EAC, ETC, VAC, TCPI | No live project cost/progress feed; confirmed only when user/project data exists | Source-connected EVM controls |
| 5 | NR Compliance | COVERED | CONFIRMED: `EvmSchedulerCompliancePanel.tsx`, `evmSchedulerComplianceKnowledge.ts` | Legacy safety/compliance agent | NR-6, NR-10, NR-18, NR-33, NR-35 checklist, risk matrix, corrective actions | General guidance only; no official safety certification or current regulation source connector | NR source verification and qualified safety review |
| 6 | Cost control / budget / finance | PARTIALLY COVERED | CONFIRMED: `src/components/BudgetPanel.tsx`, `src/components/FinancePanel.tsx`, `src/lib/budgetKnowledge.ts`, `src/lib/crmFinanceKnowledge.ts`, `/api/copilot/budget-plan`, `/api/copilot/business-plan` | Legacy cost/finance/control intelligence | Budget Studio, Finance panel, accounting preparation, EVM link, source confidence | No real SINAPI, no payment connector, no bank/accounting integration | Pricing/SINAPI ingestion + finance connectors |
| 7 | Doc management | COVERED | CONFIRMED: `src/components/ProjectWorkspacePanel.tsx`, `src/components/ExportCenterPanel.tsx`, `src/lib/projectWorkspace.ts`, `src/lib/exportCenter.ts` | Legacy document/report handling | Local Project Workspace, local autosave, import/export JSON, Export Center | LocalStorage only; no permissions/versioning/database | Auth/database-backed document management |
| 8 | Scheduler / Gantt | COVERED | CONFIRMED: `EvmSchedulerCompliancePanel.tsx`, `evmSchedulerComplianceKnowledge.ts` | Legacy scheduler/critical path direction | Gantt-style task list, milestones, dependencies, delay log, lookahead, physical-financial schedule | No MS Project/Primavera import/export and no real dependency engine | Schedule connector / baseline integration |
| 9 | Quality QA / PBQP-H / ISO awareness | PARTIALLY COVERED | CONFIRMED: `src/components/FieldOpsPanel.tsx`, `src/lib/apexAgents.ts` Quality QA | Legacy QA agent and quality indicators | FieldOps quality checklist, punch list, Quality QA agent awareness | No dedicated NCI workflow, PBQP-H/ISO evidence engine or certification workflow | Quality QA / NCI expansion |
| 10 | Sales / CRM / pipeline | COVERED | CONFIRMED: `src/components/CrmPanel.tsx`, `src/components/SaasAdminPanel.tsx`, `src/lib/saasBusinessModel.ts`, `/api/copilot/business-plan` | Legacy business/sales direction | Local-first CRM, leads, contacts, opportunities, pipeline, proposals, sales scripts | No real database, email/CRM connector or client auth | CRM persistence + client portal auth |
| 11 | Contracts / legal / permits | COVERED | CONFIRMED: `src/components\ContractsPanel.tsx`, `src/lib/contractsKnowledge.ts`, `/api/copilot/contracts-plan` | Legacy legal/permits/document workflow | Contracts/Permits Studio, permit package builder, risks, US/EU package intelligence | No legal approval, no live jurisdiction/legal source connector | Legal/source verification connector |
| 12 | RDO / FieldOps | COVERED | CONFIRMED: `src/components/FieldOpsPanel.tsx`, `src/lib/fieldOpsKnowledge.ts`, `/api/copilot/fieldops-plan` | Legacy field reports/RDO | RDO, photo log, progress, crew/materials, safety, quality, punch list, client report | No weather connector or inspection approval | Field evidence/weather connector |
| 13 | Research / market / SINAPI confidence | PARTIALLY COVERED | CONFIRMED: `src/components/ResearchPanel.tsx`, `src/lib/researchKnowledge.ts`, `src/lib/sourceConfidence.ts`, `/api/copilot/research-plan`, `/api/copilot/source-evidence` | Legacy research/market intelligence | Research Studio and source confidence rules; SINAPI source status logic | Live web/source connector not connected; SINAPI not connected unless user uploads source later | Web/source connector + SINAPI upload parser |
| 14 | International US/EU strategy | COVERED | CONFIRMED: `docs/VENDA_EUA_EDGARD.md`, `docs/APEX_INTERNATIONAL_MARKET_STRATEGY.md`, `src/lib/apexSkillKnowledge/internationalMarketStrategy.ts` | Legacy/Owner market-entry vision | Integrated US/EU offshore BIM/CAD/Revit/permit documentation strategy | Strategy knowledge only; execution needs CRM/outreach/connectors | Market execution playbooks + outreach workflow |
| 15 | Revit / BIM automation | COVERED | CONFIRMED: `docs/APEX_REVIT_CUSTOMIZATION_SKILL.md`, `src/lib/apexSkillKnowledge/revitCustomization.ts`, `toolData.ts` | Legacy BIM/Revit production direction | Revit templates, parameters, Dynamo, pyRevit, C# add-ins, IFC/GLB export knowledge | No Revit plugin installed/tested; code generation must be validated in Revit | Revit plugin MVP + test harness |
| 16 | Skill update / skill export | COVERED | CONFIRMED: `src/components/SkillUpdatePanel.tsx`, `src/components/SkillExportPanel.tsx`, `src/lib/skillUpdateEngine.ts`, `src/lib/skillExportFactory.ts`, `/api/copilot/analyze-skill-update`, `/api/copilot/apply-skill-update`, `/api/copilot/export-skill-pack` | Legacy learn/export knowledge promise | Owner-approved skill ingestion and export factory for ChatGPT/Gemini/Claude/API/Codex | Global updates are local files only; no remote skill marketplace or permissions workflow | Skill governance/versioning |
| 17 | Platform engineering / DevOps | COVERED | CONFIRMED: `docs/APEX_PLATFORM_ENGINEERING_SKILL.md`, `src/lib/apexSkillKnowledge/platformEngineering.ts`, `runtimeKnowledge.json` | Legacy platform-building support | Platform engineering skill for repo, PR, Supabase SQL/RLS, Vercel, security, deploy diagnostics | Knowledge/tooling only; no automatic GitHub/Vercel connector execution in app | DevOps connector integration |
| 18 | Export Center | COVERED | CONFIRMED: `src/components/ExportCenterPanel.tsx`, `src/lib/exportCenter.ts`, `/api/copilot/export-package` | Legacy executive reports/packages | Central export packaging for project, studios, skills, EVM/Scheduler/NR | No real ZIP binary bundler or database-backed file store; exports only current project state | Export v2 with packaged files/storage |
| 19 | SaaS / users / roles / accounting | PARTIALLY COVERED | CONFIRMED: `SaasAdminPanel.tsx`, `CrmPanel.tsx`, `FinancePanel.tsx`, `saasBusinessModel.ts`, `crmFinanceKnowledge.ts` | Legacy SaaS/client/business platform | Local demo users/roles, client workspace, CRM, finance, accounting prep, plans | No real auth, RLS, multi-tenant DB, payment, fiscal or accountant connector | Auth/RLS + payments/fiscal/accounting connectors |
| 20 | Supply chain / suppliers | COVERED | CONFIRMED: `src/components/SupplyChainPanel.tsx`, `src/lib/supplyChainKnowledge.ts`, `/api/copilot/supply-chain-plan` | Legacy-style operations could imply suppliers/materials | Local supplier registry, procurement items, RFQ draft and supplier comparison | No fake ERP, no live price/availability/supplier verification, no purchase orders | ERP/supplier/source connector |
| 21 | Notifications / alerts | COVERED | CONFIRMED: `src/components/NotificationsPanel.tsx`, `src/lib/notificationsKnowledge.ts`, `/api/copilot/notifications-plan` | Legacy operational alerts implied by platform reporting | Local alert center with severity, due date, assignment, status and evidence | No push/email/SMS/calendar connector; local alerts only | Notification connector checkpoint |
| 22 | AI cost dashboard / observability UI | COVERED | CONFIRMED: `src/components/AiCostDashboardPanel.tsx`, `src/lib/aiCostKnowledge.ts`, `/api/copilot/ai-cost-plan` | Legacy report may imply monitoring | Estimated-local AI usage/cost dashboard by module/project/model | No provider billing/usage API; not invoice-accurate | Provider billing/observability connector |
| 23 | Multi-tenant | PARTIALLY COVERED | CONFIRMED: `src/components/MultiTenantPanel.tsx`, `src/lib/multiTenantKnowledge.ts`, `/api/copilot/multitenant-plan` | Legacy SaaS/client portal direction | Local-first tenant planning UI, company/workspace model, roles per tenant, isolation plan, RLS readiness and risk checklist | No real tenant isolation, auth, organizations, RLS or DB; explicitly labeled local-first planning only | Supabase auth/RLS multi-tenant foundation |
| 24 | PWA / mobile | PARTIALLY COVERED | CONFIRMED: `src/components/PwaMobilePanel.tsx`, `src/lib/pwaMobileKnowledge.ts`, `/api/copilot/pwa-plan` | Legacy broad platform access | Mobile field mode planning UI, RDO capture, photo upload flow, punch list, safety checklist, offline/sync queue plan and installability checklist | No manifest/service worker validation, no installed PWA, no offline runtime or push connector | PWA implementation and validation |
| 25 | Digital Twin UI | PARTIALLY COVERED | CONFIRMED: `src/components/DigitalTwinPanel.tsx`, `src/lib/digitalTwinKnowledge.ts`, `/api/copilot/digital-twin-plan` | Legacy BIM/digital twin ambition | Local Digital Twin UI with linked BIM/FieldOps/Budget/EVM sources, timeline, issue overlay plan, sensor connector status and health indicators | No fake real-time IoT, no live model sync, no actual sensor/model connector; providerStatus planning-only/local-model-state | Digital Twin connector and model-state integration |
| 26 | Knowledge Base UI | COVERED | CONFIRMED: `src/components/KnowledgeBasePanel.tsx`, `src/lib/knowledgeBaseKnowledge.ts`, `/api/copilot/knowledge-plan` | Legacy knowledge/report intelligence | Searchable/filterable local Knowledge Base UI for files, skills, project notes, web sources, user corrections, prompt templates and code patterns | No code execution, no global approval without Owner, no durable database/search backend | Governed knowledge persistence and search backend |
| 27 | Metrics dashboard UI | PARTIALLY COVERED | CONFIRMED: `src/components/MetricsDashboardPanel.tsx`, `src/lib/metricsKnowledge.ts`, `/api/copilot/metrics-plan` | Legacy executive KPIs/dashboard promise | Local Metrics Dashboard with endpoint health, module usage, estimated usage, project activity and connector status | No fake production telemetry, no provider billing, no live observability source; labels LOCAL_DEMO / ESTIMATED_LOCAL | Production telemetry and provider billing connector |
| 28 | Auth / real database / Supabase readiness | MISSING | CONFIRMED: local-first only; no Supabase changes in new platform | Legacy real platform/user system | Local Project Workspace and SaaS scaffolding | No auth, Supabase schema, RLS, storage or user sessions | Supabase/auth/RLS checkpoint |
| 29 | Vercel deploy readiness | MISSING | CONFIRMED: no Vercel config changes; local app only | Legacy production deployment expectation | Vite/server local runtime builds | No configured deployment verification, env setup or preview automation for new repo | Vercel deployment readiness checkpoint |
| 30 | Security / LGPD / secrets / RLS readiness | PARTIALLY COVERED | CONFIRMED: Export Center redaction, runtime no-secret rules, platform engineering skill; NEEDS VERIFICATION for RLS | Legacy enterprise/security expectation | Secret redaction in exports and safety rules in runtime knowledge | No real auth/RLS/LGPD policy enforcement, audit logging or storage security | Security P0 for new platform |

## Confirmed Implemented Local-First Foundation

- Chat-first Apex AI Copilot runtime and tool routing.
- Universal upload and project context handling.
- ArchVis Studio with prompt brain, generation connector path, preserve mode and revision memory.
- DirectCut Studio with video planning/storyboard workflow.
- BIM / 3D Studio with internal-first import/viewer foundation, corrections, tours and reports.
- Budget Studio with estimate confidence/source labels.
- Contracts / Permits Studio with document/risk/permit package intelligence.
- FieldOps / RDO Studio with field evidence labels.
- Research Studio with source confidence and web-not-connected honesty.
- Supply Chain Studio with local supplier registry, procurement items, RFQs and comparison.
- Notifications / Alerts Center with local alerts only and no fake push/email/SMS.
- AI Cost Dashboard with ESTIMATED_LOCAL observability and no fake provider billing.
- Multi-tenant Readiness UI with local-first tenant architecture planning and explicit no-auth/RLS warning.
- PWA / Mobile Field Mode planning UI with offline/sync/installability checklist and no fake install claim.
- Digital Twin UI with local model-state planning, linked source map, timeline and no fake IoT/live sync.
- Knowledge Base UI with searchable local knowledge index and Owner-approval guardrails.
- Metrics Dashboard UI with LOCAL_DEMO endpoint/module/project metrics and no fake production telemetry.
- Export Center with redaction and CP11C report coverage.
- Local Project Workspace persistence/import/export.
- SaaS/CRM/Finance/Accounting local demo scaffolding.
- Skill Update and Skill Export workflows.
- Revit, Windows Care, Platform Engineering and International Market Strategy skill knowledge.
- 8 cognitive agents with CP11C EVM/Scheduler/NR now implemented local-first.

## Highest-Priority Gaps

1. Real auth/database/RLS/multi-tenant foundation.
2. Real BIM parser/viewer evidence extraction and IFC model data pipeline.
3. Source connectors: web research, SINAPI/user-upload source parser, legal/permit sources and NR source review.
4. Production connectors for suppliers/ERP, notifications and provider billing/usage.
5. Installable PWA/offline validation and real mobile runtime.
6. Digital Twin live model/sensor connectors and production telemetry.
7. Vercel deployment readiness for the new platform.

## Recommended Next Checkpoint

Recommended next checkpoint: **Auth / Database / RLS readiness for the new platform**, because many remaining legacy gaps depend on real users, tenants, projects, permissions, files and durable records. The second highest-leverage checkpoint is **BIM parser/viewer hardening**, because it upgrades BIM/3D, Budget, EVM, Digital Twin, ArchVis and DirectCut from planning workflows into evidence-backed production workflows.

# Supabase Table Map

Status: CP12A .

This table maps current Apex AI Copilot local-first modules to the planned Supabase tables.

| Domain | Tables | Purpose | Local-first source |
|---|---|---|---|
| Auth/Profile/Tenant | `profiles`, `tenants`, `tenant_members`, `roles`, `permissions`, `role_permissions`, `user_preferences`, `audit_logs` | Identity, tenant membership, roles, preferences and audit events | SaaS/Admin UI, Project Workspace, future Supabase Auth |
| Projects/Workspace | `projects`, `project_members`, `project_files`, `project_messages`, `project_exports`, `project_activity`, `project_preferences` | Project context, files, chat, exports, activity and settings | `ProjectWorkspacePanel`, chat runtime, universal upload |
| ArchVis | `archvis_sessions`, `archvis_outputs`, `archvis_prompts`, `archvis_revision_constraints`, `archvis_gallery_items` | Image/render/humanization workflows, prompts, constraints and generated outputs | `ArchVisPanel` |
| DirectCut | `directcut_sessions`, `directcut_plans`, `directcut_scenes`, `directcut_storyboards`, `directcut_gallery_items` | Video plans, scenes, scripts, storyboards and iterations | `DirectCutPanel` |
| BIM / 3D | `bim_models`, `bim_viewer_sessions`, `bim_findings`, `bim_corrections`, `bim_saved_views`, `bim_tours`, `bim_animation_paths`, `bim_export_briefs` | Model metadata, viewer sessions, findings, corrections, tours and export briefs | `Bim3DPanel` |
| Budget / Quantity / EVM | `budget_estimates`, `budget_items`, `budget_scope_items`, `pricing_sources`, `sinapi_sources`, `evm_records`, `schedule_tasks`, `schedule_dependencies`, `milestones` | Estimates, pricing evidence, EVM, schedule and milestones | `BudgetPanel`, `EvmSchedulerCompliancePanel` |
| Contracts / Permits | `contracts`, `contract_clauses`, `contract_risks`, `permit_packages`, `permit_documents`, `permit_checklists`, `document_trackers` | Contracts, risks, permit packages and document tracking | `ContractsPanel` |
| FieldOps / RDO / Quality / Safety / NR | `rdos`, `rdo_activities`, `field_photos`, `field_issues`, `punch_items`, `safety_checklists`, `quality_checklists`, `nr_compliance_items`, `corrective_actions` | Daily reports, photo evidence, issues, quality, safety and NR corrective actions | `FieldOpsPanel`, `EvmSchedulerCompliancePanel` |
| Research / Market / Sources | `research_sessions`, `research_findings`, `source_evidence`, `market_reports`, `proposal_outputs` | Research plans, claims, source evidence, market reports and proposal outputs | `ResearchPanel` |
| CRM / Sales / Finance / Accounting | `leads`, `contacts`, `companies`, `opportunities`, `proposals`, `service_catalog`, `invoices`, `payments`, `expenses`, `accounting_entries`, `accounts_receivable`, `accounts_payable`, `accountant_packages`, `tax_prep_items` | Client acquisition, proposals, revenue, accounting prep and accountant handoff | `CrmPanel`, `FinancePanel`, `SaasAdminPanel` |
| Supply Chain / Notifications / AI Cost | `suppliers`, `procurement_items`, `supplier_evaluations`, `alerts`, `ai_usage_records`, `ai_cost_thresholds` | Suppliers, procurement, local alerts and AI cost records | `SupplyChainPanel`, `NotificationsPanel`, `AiCostDashboardPanel` |
| Knowledge / Skills / Platform | `knowledge_items`, `skill_updates`, `skill_exports`, `platform_audits`, `devops_tasks`, `repo_reviews` | Knowledge base, skill ingestion/export, platform audits and devops work | `KnowledgeBasePanel`, `SkillUpdatePanel`, `SkillExportPanel`, platform engineering skill |
| Digital Twin / Metrics / PWA | `digital_twin_items`, `twin_events`, `metrics_records`, `health_checks`, `pwa_settings`, `sync_queue_items` | Twin state, metrics, health checks, PWA/offline settings and sync queue | `DigitalTwinPanel`, `MetricsDashboardPanel`, `PwaMobilePanel` |

## Common Columns

Most production tables include:

- `id uuid primary key default gen_random_uuid()`
- `tenant_id uuid`
- `project_id uuid`
- `created_at timestamptz`
- `updated_at timestamptz`
- `created_by uuid`
- `metadata jsonb`

Evidence-sensitive tables include one or both:

- `evidence_level`
- `source_confidence`

## Evidence and Source Truth

The schema keeps the platform's core truth rule:

- If a value is parsed or verified, it can be `CONFIRMED`.
- If a value is inferred, it must be `ASSUMPTION` or `ESTIMATED`.
- If the platform cannot know, it must be `UNKNOWN`.
- Current laws, prices, regulations, supplier availability and telemetry require source-backed records before being presented as confirmed.

## First Integration Priority

1. Auth/Profile/Tenant
2. Projects/Workspace
3. Storage and `project_files`
4. Project Messages
5. ArchVis/DirectCut/BIM outputs
6. Budget/Contracts/FieldOps source-backed records
7. CRM/Finance/SaaS
8. Remaining modules

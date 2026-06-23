# Supabase Schema + RLS Plan

> 🚨 REGRA ABSOLUTA — Proteção de Environment Variables
> Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
> alterar, modificar, remover ou sobrescrever variáveis no `.env.local` ou
> nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
> do Owner (jedgard70@gmail.com / Dr. Edgard).
> 
> Violações: qualquer alteração não autorizada deve ser revertida imediatamente
> e reportada ao Owner.


Status: CP12A . apply.

Current baseline: `dd7cb9a feat: add multi tenant PWA digital twin knowledge metrics UI`

Decision: Apex AI Copilot will use a brand-new Supabase project with a schema created from zero. This checkpoint produces reviewable SQL drafts, RLS policy drafts, storage bucket drafts and the app integration map. It does not connect Supabase, add keys, modify Vercel or create a GitHub remote.

## Production Goals

- Support email/password Auth first and Google OAuth later through Supabase Auth.
- Support tenant isolation for Owner/Admin, Internal Team, Client, Partner, Viewer, Contractor, Finance, Sales, Field, BIM Manager and Project Manager.
- Persist every module built so far: chat, projects, ArchVis, DirectCut, BIM/3D, Budget, EVM, Scheduler, Contracts, Permits, FieldOps, Research, CRM, Finance, Accounting, Supply Chain, Notifications, AI Cost, Skills, Knowledge, Digital Twin, PWA and Metrics.
- Store uploaded files, generated images, documents, media and 3D/model files in Supabase Storage.
- Keep studio-specific complex data flexible with `jsonb metadata` while the product is still evolving.

## Draft Migration Set

- `supabase/migrations/0001_initial_schema_draft.sql`
  - Creates enums, `pgcrypto`, `set_updated_at`, core tables, studio tables, business tables, indexes and update triggers.
- `supabase/migrations/0002_rls_policies_draft.sql`
  - Creates private helper functions in `app_private`.
  - Enables and forces RLS on public tables.
  - Drafts tenant/project/role policies.
- `supabase/migrations/0003_storage_buckets_draft.sql`
  - Creates storage buckets.
  - Drafts storage policies around `tenant_id/project_id` path conventions.

These files are intentionally named `draft` and must be reviewed before any `supabase db push`, `apply_migration`, or production use.

## Auth Model

Supabase Auth owns identities in `auth.users`.

`profiles.id` references `auth.users(id)` and stores app display data only. Authorization must not depend on user-editable metadata. Roles are stored through `tenant_members` and `project_members`.

Google OAuth later maps to the same `auth.users` identity and should create or link a `profiles` row plus one or more `tenant_members` rows.

## Tenant Model

`tenants` represent companies/workspaces. Every user can belong to one or more tenants through `tenant_members`.

Required isolation principle:

- All tenant-owned tables include `tenant_id`.
- Project-owned tables include both `tenant_id` and `project_id`.
- RLS checks membership through database tables, not frontend state.
- Owner/Admin can access tenant-wide data.
- Clients can access only projects/outputs assigned to them.

## Role Model

Roles are represented with enum `user_role`:

- `owner_admin`
- `internal_team`
- `client`
- `partner`
- `viewer`
- `contractor`
- `finance`
- `sales`
- `field`
- `bim_manager`
- `project_manager`

`roles`, `permissions`, and `role_permissions` exist for future admin UI and fine-grained permission expansion. CP12A does not over-constrain permissions because the product needs rapid iteration.

## RLS Principles

No anonymous writes are allowed.

Draft policy behavior:

- Authenticated users read tenant data only when `tenant_members` confirms access.
- Project records require project assignment or tenant-level staff/admin role.
- Finance tables require Owner/Admin or Finance role.
- CRM/sales tables require Owner/Admin, Sales or Internal Team.
- FieldOps/RDO tables allow Field/Project Manager/Owner/Admin and project assignment.
- BIM/3D tables allow BIM Manager/Project Manager/Owner/Admin and project assignment.
- Viewers are read-only through project membership.
- Clients are project-scoped and cannot access admin/internal tenant data.

RLS helpers live in `app_private` with restricted schema privileges. Final review must confirm function ownership, `search_path`, Data API exposure and Supabase advisor results.

## Storage Principles

Protected bucket object paths should use:

```text
<tenant_id>/<project_id>/<file_id-or-safe-file-name>
```

Storage policies use the first two path segments to check tenant/project access. Public assets are the only public-read bucket, and public writes remain forbidden.

## Local App State Mapping

The current app is local-first. CP12A does not replace localStorage yet.

Future integration map:

- `ProjectWorkspace` local project -> `projects`, `project_preferences`
- uploaded file metadata -> `project_files`
- chat messages -> `project_messages`
- project export records -> `project_exports`
- ArchVis gallery/prompts/constraints -> `archvis_*`
- DirectCut plans/scenes/storyboards -> `directcut_*`
- BIM/3D models/findings/corrections/tours -> `bim_*`
- Budget and EVM -> `budget_*`, `pricing_sources`, `sinapi_sources`, `evm_records`
- Scheduler -> `schedule_tasks`, `schedule_dependencies`, `milestones`
- Contracts/Permits -> `contracts`, `contract_*`, `permit_*`, `document_trackers`
- FieldOps/RDO -> `rdos`, `rdo_activities`, `field_photos`, `field_issues`, `punch_items`, `safety_checklists`, `quality_checklists`, `nr_compliance_items`, `corrective_actions`
- Research -> `research_sessions`, `research_findings`, `source_evidence`, `market_reports`, `proposal_outputs`
- CRM/Sales/Finance/Accounting -> CRM and accounting tables
- Supply Chain -> `suppliers`, `procurement_items`, `supplier_evaluations`
- Notifications -> `alerts`
- AI Cost -> `ai_usage_records`, `ai_cost_thresholds`
- Knowledge/Skills -> `knowledge_items`, `skill_updates`, `skill_exports`
- Digital Twin/PWA/Metrics -> `digital_twin_items`, `twin_events`, `pwa_settings`, `sync_queue_items`, `metrics_records`, `health_checks`

## Review Gates Before Applying

1. Create a brand-new Supabase project.
2. Review all draft SQL files.
3. Run the drafts in a disposable local database or preview database first.
4. Run Supabase advisors/security checks.
5. Verify every table exposed through the Data API has RLS.
6. Verify no policy creates broad anonymous access.
7. Verify storage path parsing and bucket policies with real upload/read tests.
8. Validate Owner/Admin, Client, Finance, Sales, Field, BIM Manager and Viewer scenarios.
9. Only then create final migrations without `draft` naming.

## Known Limitations

- This is not a connected database.
- RLS is not validated against a live Supabase project yet.
- No Supabase keys or client integration were added.
- No Vercel configuration was changed.
- Storage policies depend on strict path conventions.
- Complex studio payloads remain mostly `jsonb` until usage stabilizes.

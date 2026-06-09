# Supabase Apply Manual Checklist

Status: CP12C documentation only. Do not apply migrations until Owner approves the controlled setup.

This checklist is for a brand-new Supabase project. It is not for an existing production database.

## Preflight

- Confirm the current app commit is safe.
- Confirm `.env.local` is not committed.
- Confirm no real keys are stored in repo files.
- Run `npm.cmd run build`.
- Run `node --check server.mjs`.
- Run `npm.cmd run validate:supabase-sql`.
- Read and review:
  - `docs/SUPABASE_SCHEMA_RLS_PLAN.md`
  - `docs/SUPABASE_TABLE_MAP.md`
  - `docs/SUPABASE_STORAGE_PLAN.md`
  - `supabase/migrations/0001_initial_schema_draft.sql`
  - `supabase/migrations/0002_rls_policies_draft.sql`
  - `supabase/migrations/0003_storage_buckets_draft.sql`

## Create Brand-New Supabase Project

1. In Supabase Dashboard, create a new project for Apex AI Copilot.
2. Save the project reference and region in a private setup note outside Git.
3. Do not reuse an old Apex project.
4. Do not connect production users yet.

## Auth Setup

1. Enable email/password Auth.
2. Confirm email confirmation settings.
3. Leave Google OAuth as later unless redirect URLs and provider credentials are ready.
4. Later, when Google is ready, configure Google OAuth in Supabase Auth providers.
5. Do not store provider client secrets in the frontend.

## Keys

1. Copy the project URL.
2. Copy the public anon key.
3. Keep the service role key server-only.
4. Never paste the service role key into browser code, `VITE_*` variables, screenshots or public docs.
5. Do not commit `.env.local`.

## Apply Drafts Manually After Approval

Apply in this order only after review:

1. `0001_initial_schema_draft.sql`
   - Creates enums, tables, indexes and triggers.
2. `0002_rls_policies_draft.sql`
   - Creates private RLS helper functions and policies.
3. `0003_storage_buckets_draft.sql`
   - Creates storage buckets and bucket policies.

Recommended process:

- Apply first in a disposable project or local Supabase database.
- If successful, apply to the new clean Supabase project.
- Do not apply to an old or production project.

## Verify Tables

After applying `0001`:

- Confirm all required tables exist.
- Confirm `profiles`, `tenants`, `tenant_members`, `projects`, `project_files`, `project_messages` exist.
- Confirm module tables exist for ArchVis, DirectCut, BIM/3D, Budget, Contracts, FieldOps, Research, CRM/Finance, Supply Chain, Knowledge, Digital Twin and Metrics.
- Confirm `updated_at` triggers exist.
- Confirm indexes exist for key `tenant_id`, `project_id`, `created_by` and `status` columns.

## Verify RLS

After applying `0002`:

- Confirm RLS is enabled on every public table.
- Confirm no public write policies exist.
- Confirm `app_private` helper functions are not exposed to anon.
- Confirm policies use tenant/project membership, not user-editable metadata.
- Test Owner/Admin can access tenant-wide data.
- Test Client can access only assigned project records.
- Test Viewer is read-only.
- Test Finance can access finance/accounting tenant records.
- Test Sales can access CRM/sales tenant records.
- Test Field can access assigned RDO/photos/issues.
- Test BIM Manager can access assigned BIM/model data.

## Verify Storage

After applying `0003`:

- Confirm buckets exist:
  - `project-uploads`
  - `archvis-images`
  - `generated-images`
  - `directcut-media`
  - `bim-models`
  - `documents`
  - `field-photos`
  - `exports`
  - `skill-files`
  - `public-assets`
- Confirm protected buckets are not public.
- Confirm `public-assets` is read-only public and not public-write.
- Test path convention: `<tenant_id>/<project_id>/<file-name>`.
- Test upload/read/update/delete by role before real users.

## Create First Owner/Admin

1. Create the first Owner/Admin user through Supabase Auth.
2. Insert or create matching `profiles` row.
3. Create initial `tenants` row.
4. Create initial `tenant_members` row with role `owner_admin`.
5. Confirm Owner/Admin can read/write tenant and project data.

## Test Login After App Integration

After CP12 real app integration:

- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` locally.
- Start the app.
- Confirm `AuthPanel` changes from `supabase-not-configured` to configured status.
- Test email/password login.
- Confirm no fake login path remains.
- Confirm service role is not available in the browser.

## Hard Stop Conditions

Stop immediately if:

- A policy allows broad anon writes.
- A client can access another tenant/project.
- Service role key appears in browser/devtools/client bundle.
- Storage signed URLs can cross tenant/project boundaries.
- Supabase advisors show critical security findings.

# Supabase Apply Report

Date/time: 2026-06-09, America/Sao_Paulo

Project:

- Project ID/ref: `csvtkvyauusvtmrkqtzl`
- Name: `apex-ai-copilot-platform`
- Region: `sa-east-1`
- Report status: `YELLOW - blocked before migration apply`

## Pre-Apply Validation

Completed successfully:

- `npm.cmd run validate:supabase-sql`
  - Required files: `3/3`
  - Required tables present: `95/95`
  - Required buckets present: `10/10`
  - Warnings: `0`
  - Status: `OK`
- `npm.cmd run build`
  - TypeScript build passed.
  - Vite production build passed.
  - Vite emitted only the existing chunk-size warning.
- `node --check server.mjs`
  - Passed.
- Destructive SQL scan:
  - No `DROP DATABASE`
  - No `DROP SCHEMA`
  - No `DROP TABLE` without `IF EXISTS`
  - No `TRUNCATE`
  - No `DELETE FROM`

## Migration Apply Attempt

The Supabase CLI is authenticated and can list projects.

The target project is visible:

- `csvtkvyauusvtmrkqtzl`
- `apex-ai-copilot-platform`
- Region: South America / Sao Paulo

The repo was linked with:

```text
npx.cmd supabase link --project-ref csvtkvyauusvtmrkqtzl --yes
```

Result:

```text
Finished supabase link.
```

Migration list after linking:

```text
Local | Remote | Time (UTC)
0001  |        | 0001
0002  |        | 0002
0003  |        | 0003
```

Dry-run attempt:

```text
npx.cmd supabase db push --linked --dry-run
```

Result:

```text
failed to connect to postgres: failed to connect to
host=db.csvtkvyauusvtmrkqtzl.supabase.co
user=cli_login_postgres
database=postgres:
failed SASL auth
FATAL: password authentication failed for user "cli_login_postgres"
Connect to your database by setting the env var correctly: SUPABASE_DB_PASSWORD
```

Environment check:

```text
SUPABASE_DB_PASSWORD=missing
```

## Migrations Applied

None.

The following drafted migrations were validated but not applied:

- `supabase/migrations/0001_initial_schema_draft.sql`
- `supabase/migrations/0002_rls_policies_draft.sql`
- `supabase/migrations/0003_storage_buckets_draft.sql`

## Tables Created Count

`0` confirmed created by this run.

Expected after successful apply:

- `95` application tables/enums/functions/triggers from `0001`

## Buckets Created Count

`0` confirmed created by this run.

Expected after successful apply:

- `10` storage buckets from `0003`

## RLS Status

Not applied by this run.

Expected after successful apply:

- RLS enabled and forced for public tables.
- Tenant/project helper functions created in `app_private`.
- No public writes.
- Storage policies bound to `<tenant_id>/<project_id>/...` path convention.

## Advisor Results Summary

Not run.

Reason:

- Migrations were not applied because remote database authentication failed before `db push`.
- Security/performance advisors should be run only after the schema/RLS/storage drafts are successfully applied.

## Errors

Blocking error:

- Missing or invalid remote database password for Supabase CLI connection.
- Required variable: `SUPABASE_DB_PASSWORD`
- Do not paste this password into chat or commit it to the repo.

## Manual Actions Required

Choose one safe path:

1. Preferred CLI path:
   - Set `SUPABASE_DB_PASSWORD` locally in the current terminal only.
   - Re-run:

```text
npm.cmd run validate:supabase-sql
npx.cmd supabase db push --linked --dry-run
npx.cmd supabase db push --linked
```

2. Dashboard SQL editor path:
   - Open the Supabase SQL editor for project `csvtkvyauusvtmrkqtzl`.
   - Apply the three files in order:
     1. `0001_initial_schema_draft.sql`
     2. `0002_rls_policies_draft.sql`
     3. `0003_storage_buckets_draft.sql`
   - Then verify tables, buckets and RLS manually.

After apply:

- Verify tables exist.
- Verify buckets exist.
- Verify RLS is enabled.
- Run Supabase security and performance advisors.
- Update this report with final counts and advisor results.

## Local Files Note

`supabase link` generated local untracked CLI state under:

```text
supabase/.temp/
```

This was not staged and should not be committed.

## Secrets Confirmation

- No service role key was requested, printed or committed.
- `.env.local` was not modified.
- `.env.local` was not staged.
- No Vercel config was modified.
- No old repos were touched.

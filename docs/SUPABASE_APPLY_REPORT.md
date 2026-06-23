# Supabase Apply Report

> 🚨 REGRA ABSOLUTA — Proteção de Environment Variables
> Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
> alterar, modificar, remover ou sobrescrever variáveis no `.env.local` ou
> nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
> do Owner (jedgard70@gmail.com / Dr. Edgard).
> 
> Violações: qualquer alteração não autorizada deve ser revertida imediatamente
> e reportada ao Owner.


Date/time: 2026-06-10, America/Sao_Paulo

Project:

- Project ID/ref: `csvtkvyauusvtmrkqtzl`
- Name: `apex-ai-copilot-platform`
- Region: `sa-east-1`
- Report status: `YELLOW - migrations applied and verified; advisor warnings remain`

## Pre-Apply Validation

Completed successfully before verification:

- `npm.cmd run validate:supabase-sql`
  - Required files: `3/3`
  - Required tables present in drafts: `95/95`
  - Required buckets present in drafts: `10/10`
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

## Migrations Applied

The remote migration history now shows the three drafted migrations applied:

```text
Local | Remote | Time (UTC)
0001  | 0001   | 0001
0002  | 0002   | 0002
0003  | 0003   | 0003
```

Applied migration set:

- `supabase/migrations/0001_initial_schema_draft.sql`
- `supabase/migrations/0002_rls_policies_draft.sql`
- `supabase/migrations/0003_storage_buckets_draft.sql`

Note: no service role key was requested or printed during this verification. The local terminal still does not expose `SUPABASE_DB_PASSWORD`; future direct `db push` or migration repair flows may require setting it locally only.

## Tables Created Count

Verified via Supabase CLI query:

```sql
select count(*) as table_count
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE';
```

Result:

- Public base tables: `95`

## Buckets Created Count

Verified via Supabase CLI query against `storage.buckets`.

Expected buckets:

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

Result:

- Expected buckets present: `10/10`

## RLS Status

Verified via Supabase CLI query against `pg_class` and `pg_namespace`.

Result:

- Public tables: `95`
- Public tables with RLS enabled: `95`

RLS is enabled on all public application tables created by the draft schema.

## Advisor Results Summary

Security advisor:

- Status: `WARN`
- Findings: `5`
- Summary:
  - `function_search_path_mutable` for `public.create_updated_at_trigger`
  - `function_search_path_mutable` for `public.set_updated_at`
  - `public_bucket_allows_listing` for bucket `public-assets` through policy `public_assets_read`
  - `anon_security_definer_function_executable` for `public.rls_auto_enable()`
  - `authenticated_security_definer_function_executable` for `public.rls_auto_enable()`

Performance advisor:

- Status: `WARN/INFO`
- Summary:
  - `320` INFO findings for `unused_index`
  - `58` INFO findings for `unindexed_foreign_keys`
  - `19` WARN findings for `multiple_permissive_policies`
  - `5` WARN findings for `auth_rls_initplan`

Interpretation:

- The schema is applied and RLS is active.
- The database is not production-clean yet.
- The performance advisor output is expected to be noisy immediately after creating a large schema with no real workload, especially `unused_index`.
- The `unindexed_foreign_keys`, `multiple_permissive_policies`, `auth_rls_initplan`, function `search_path`, and public bucket listing warnings should be addressed in the next Supabase hardening checkpoint before production client data.

## Errors

No migration verification errors were found.

Known remaining issue:

- `SUPABASE_DB_PASSWORD` is not present in the local shell. Do not commit it. Set it only in a local terminal if future CLI `db push`, `migration repair`, or direct database maintenance requires it.

## Manual Actions Required

Before production data or external clients:

1. Create a Supabase hardening migration to set explicit `search_path` on:
   - `public.create_updated_at_trigger`
   - `public.set_updated_at`
2. Review bucket `public-assets` listing policy:
   - Keep only if public object listing is intentional.
   - Otherwise restrict or remove broad SELECT/list behavior.
3. Investigate `public.rls_auto_enable()`:
   - Confirm source and purpose.
   - Revoke anon/authenticated execute permissions if not required.
   - Move helper/admin-only functions out of public access where appropriate.
4. Add covering indexes for important foreign keys after reviewing expected query paths.
5. Consolidate overlapping permissive SELECT policies where practical.
6. Optimize auth-dependent RLS expressions to avoid per-row auth function initplan warnings.
7. Re-run security and performance advisors after hardening.

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

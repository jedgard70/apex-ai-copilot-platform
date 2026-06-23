# Supabase Hardening Report

> 🚨 REGRA ABSOLUTA — Proteção de Environment Variables
> Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
> alterar, modificar, remover ou sobrescrever variáveis no `.env.local` ou
> nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
> do Owner (jedgard70@gmail.com / Dr. Edgard).
> 
> Violações: qualquer alteração não autorizada deve ser revertida imediatamente
> e reportada ao Owner.


Date: 2026-06-10

Project: `apex-ai-copilot-platform`

Supabase project ref: `csvtkvyauusvtmrkqtzl`

## Scope

CP14C adds a safe RLS/performance hardening migration after the initial schema, RLS and storage migrations were applied to the new Supabase project.

This checkpoint does not:

- drop data
- drop tables
- truncate tables
- disable RLS
- weaken tenant/project access rules
- touch Vercel config
- add or expose secrets
- drop unused indexes

## Before

Owner-reported Supabase state before CP14C:

- Migrations applied: `0001`, `0002`, `0003`
- Public tables: 95
- Storage buckets: 10
- RLS enabled: 95/95 public tables
- Security advisor warnings: 5
- Performance advisor categories: `unused_index`, `unindexed_foreign_keys`, `multiple_permissive_policies`, `auth_rls_initplan`

CLI lint was run with the linked Supabase project. One CLI run required database password initialization, but the successful lint run reported:

```text
No schema errors found
```

## Catalog Findings

Local catalog/advisor-oriented inspection found:

- 55 missing foreign-key index columns.
- 5 policies with direct `auth.uid()` calls in RLS policy expressions.
- Multiple permissive SELECT overlap caused primarily by broad `FOR ALL` write policies paired with read policies.
- `unused_index` warnings were not treated as safe to fix automatically before real usage patterns exist.

## Migration

Created migration:

`supabase/migrations/0004_rls_performance_hardening.sql`

Migration actions:

- Added missing foreign-key indexes.
- Replaced direct `auth.uid()` policy usage with `(select auth.uid())`.
- Updated core RLS helper functions to use `(select auth.uid())`.
- Split broad `FOR ALL` write policies into action-specific `INSERT`, `UPDATE`, and `DELETE` policies where the existing `SELECT` policy should remain.
- Reduced storage policy overlap for `public-assets` by splitting the admin write policy into action-specific policies.
- Left unused-index warnings documented only.

## Security Advisor Notes

The five security warnings were not available through the local SQL lint output. They must be rechecked in Supabase after migration 0004 is applied.

If any remaining warning is dashboard/config-level, the manual action must be documented before marking it complete. No security warning should be marked fixed without advisor evidence.

## Unused Index Policy

No indexes were dropped in this checkpoint.

Reason: the schema is new and has no production traffic/data pattern yet. Dropping indexes only because the advisor reports `unused_index` immediately after schema creation can remove useful future indexes before real workload exists.

## After

Migration application:

- Dry run before apply: `npx.cmd supabase db push --linked --dry-run`
- Dry run result: only `0004_rls_performance_hardening.sql` would be pushed.
- Apply command: `npx.cmd supabase db push --linked`
- Applied migration: `0004_rls_performance_hardening.sql`
- Post-apply dry run: `Remote database is up to date.`

Validation:

- `npm.cmd run build`: passed
- `node --check server.mjs`: passed
- `npm.cmd run validate:supabase-sql`: passed
- `npx.cmd supabase db lint --linked --fail-on none --level warning`: passed, `No schema errors found`

`npx.cmd supabase migration list --linked` returned a CLI authentication error for `cli_login_postgres`:

```text
failed SASL auth (FATAL: password authentication failed for user "cli_login_postgres")
```

Because the apply command succeeded and the post-apply `db push --dry-run` returned `Remote database is up to date`, the migration is treated as applied, but the CLI migration list command should be retried after refreshing the CLI database password/session.

Supabase dashboard advisors still need to be checked directly after this migration. The local CLI lint does not expose the same dashboard warning list that the owner reported.

## Remaining Items

- Recheck Supabase dashboard security advisor and document the exact five warnings.
- Recheck dashboard performance advisor after cache refresh.
- Do not drop `unused_index` warnings until real traffic/query patterns exist.
- Retry `npx.cmd supabase migration list --linked` after refreshing Supabase CLI database authentication.

## CP14D Security Advisor Fix

Date: 2026-06-10

Security advisor before migration `0005_security_advisor_fix.sql`:

1. `function_search_path_mutable`: `public.create_updated_at_trigger`
2. `function_search_path_mutable`: `public.set_updated_at`
3. `public_bucket_allows_listing`: broad `public_assets_read` SELECT policy on `storage.objects`
4. `anon_security_definer_function_executable`: `public.rls_auto_enable()`
5. `authenticated_security_definer_function_executable`: `public.rls_auto_enable()`

Performance advisor before migration `0005_security_advisor_fix.sql`:

```text
No issues found
```

Migration created:

`supabase/migrations/0005_security_advisor_fix.sql`

Planned fixes:

- Recreate `public.set_updated_at()` with fixed `search_path = public`.
- Recreate `public.create_updated_at_trigger(table_name text)` with fixed `search_path = public`.
- Drop broad `public_assets_read` SELECT policy from `storage.objects`; public object URLs do not require bucket listing.
- Revoke `EXECUTE` on `public.rls_auto_enable()` from `anon`, `authenticated`, and `public` when the function exists.

CP14D validation:

- `npm.cmd run build`: passed
- `node --check server.mjs`: passed
- `npm.cmd run validate:supabase-sql`: passed
- destructive/secrets scan on `0005_security_advisor_fix.sql`: passed
- `npx.cmd supabase db push --linked --dry-run`: only `0005_security_advisor_fix.sql` pending before apply
- `npx.cmd supabase db push --linked`: applied `0005_security_advisor_fix.sql`
- post-apply dry run: `Remote database is up to date.`
- `npx.cmd supabase db advisors --linked --type security --level warn --fail-on none`: `No issues found`
- `npx.cmd supabase db advisors --linked --type performance --level warn --fail-on none`: `No issues found`
- `npx.cmd supabase db lint --linked --fail-on none --level warning`: `No schema errors found`

One first post-apply lint attempt returned a transient `cli_login_postgres` password authentication error. The command was rerun and passed.

## Result

Status: GREEN - CP14C/CP14D migrations applied, local validation is green, and Supabase security/performance advisors report no warning-level issues.

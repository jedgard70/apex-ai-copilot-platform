# Supabase Local Connection Report

Date: 2026-06-11

Project ref: `csvtkvyauusvtmrkqtzl`

## Scope

CP15/CP15B connects the local Apex AI Copilot app to the real Supabase project using browser-safe client variables only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No service role key is used in frontend/browser code.

## Implemented

- Local `.env.local` configured with public Supabase URL/key.
- Auth UI now detects real Supabase session state.
- Account UI now shows user/profile/tenant/role state when available.
- Project Workspace has a `Sync to Supabase` action.
- First remote sync layer supports:
  - `projects`
  - `project_files` metadata only
  - `project_messages`
  - `project_exports` metadata
- Storage helper supports controlled uploads to `project-uploads`.
- `/api/copilot/auth-plan` reports Supabase client env state without returning secret values.

## Bootstrap RPC

Migration:

`supabase/migrations/0006_auth_bootstrap_rpc.sql`

RPC:

`public.bootstrap_user_workspace()`

Behavior:

- Requires `auth.uid()`.
- Creates/updates the signed-in user's `profiles` row.
- If the user already has an active tenant membership, returns it.
- If the user has no active tenant membership, creates a new private Apex workspace.
- Assigns `owner_admin` only for that newly-created workspace.
- Does not accept arbitrary `tenant_id`, `user_id`, or `role` input from the client.
- Revokes execute from `anon` and `public`.
- Grants execute to `authenticated`.

Security note:

Supabase security advisor reports `authenticated_security_definer_function_executable` for this RPC. This is expected because the RPC is intentionally callable by signed-in users to perform first-workspace bootstrap without exposing service role in the browser. The function has no arbitrary role/tenant input and uses fixed `search_path`.

## Validation

Passed:

- `npm.cmd run validate:supabase-sql`
- `npm.cmd run build`
- `node --check server.mjs`
- `npx.cmd supabase db push --linked --dry-run`
- `npx.cmd supabase db push --linked`
- `npx.cmd supabase db push --linked --dry-run` after apply: remote up to date
- `npx.cmd supabase db lint --linked --fail-on none --level warning`: no schema errors
- `npx.cmd supabase db advisors --linked --type performance --level warn --fail-on none`: no issues found
- `/api/copilot/auth-plan`: returns `supabase-connected`

Security advisor after 0006:

- 1 warning remains: `authenticated_security_definer_function_executable` for `public.bootstrap_user_workspace()`.

## Manual Auth Test

Signup was attempted with a new test user.

Result:

- Signup reached Supabase.
- Login succeeded.
- `public.bootstrap_user_workspace()` created the user workspace.
- `profiles` row exists.
- `tenants` row exists.
- `tenant_members` row exists.
- The test user received `owner_admin` only for the newly-created test workspace.
- A project was inserted into `projects`.
- A message was inserted into `project_messages`.
- A small text file was uploaded to `project-uploads`.
- File metadata was inserted into `project_files`.
- Sign out completed.

Verification user:

`cp15b.1781212067656@apexglobalai.com`

No fake auth success was claimed.

## Remaining Verification

Recommended next manual browser check:

1. Login through the visible app UI.
2. Confirm session restores after browser refresh.
3. Use Project Workspace `Sync to Supabase`.
4. Upload one small file from the UI.

## Status

GREEN - local Supabase auth bootstrap, project sync and storage upload were verified with browser-safe client env only.

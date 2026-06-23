# CP15D Production Auth/Storage QA + Vercel Readiness

> 🚨 REGRA ABSOLUTA — Proteção de Environment Variables
> Nenhum agente, assistente, skill, ferramenta ou processo automatizado pode
> alterar, modificar, remover ou sobrescrever variáveis no `.env.local` ou
> nas Environment Variables do Vercel sem autorização EXPLÍCITA e VERBAL
> do Owner (jedgard70@gmail.com / Dr. Edgard).
> 
> Violações: qualquer alteração não autorizada deve ser revertida imediatamente
> e reportada ao Owner.


Date: 2026-06-11
Branch: `feature/image-generation-connector`
HEAD: `ef43d66 chore: ignore Supabase temp files`
Status: NO GO

## Scope

Validated the local Apex AI Copilot platform in `D:\AI-constr\apex-ai-copilot-platform` for:

- protected Supabase auth gate
- production build
- browser auth QA
- storage/upload QA
- frontend security audit
- Vercel readiness

No Supabase remote configuration was changed.
No migrations were created.
No Vercel remote configuration was changed.
No `.env.local`, `.env`, `supabase/.temp`, `node_modules`, or `dist` files were staged.

## Initial State

- Branch: `main`
- Latest commits:
  - `ef43d66 chore: ignore Supabase temp files`
  - `a8f1156 feat: add protected auth gate`
  - `7425f3c feat: connect Supabase auth and project sync locally`
  - `85ef8e2 chore: fix Supabase security advisor warnings`
  - `ed4cf94 chore: harden Supabase RLS and performance`
- Initial status:
  - `?? docs/VERCEL_PRODUCTION_READINESS.md`
  - ignored: `.env.local`, `dist/`, `node_modules/`, `supabase/.temp/`, `tsconfig.tsbuildinfo`

`docs/VERCEL_PRODUCTION_READINESS.md` exists and appears related to a later CP15E/Vercel readiness note, not the CP15D report. It was not deleted or staged.

## Git Hygiene

`.gitignore` covers:

- `.env`
- `.env.local`
- `.env.*.local`
- `node_modules`
- `dist`
- `supabase/.temp/`
- `*.tsbuildinfo`

Staged files during this report: none.

## Commands

- `npm.cmd run validate:supabase-sql`: PASS
  - Required files: 3/3
  - Required tables: 95/95
  - Required buckets: 10/10
  - Warnings: 0
  - Status: OK
- `npm.cmd run build`: PASS
  - `tsc -b && vite build`
  - production bundle generated under `dist/`
  - Vite chunk size warning remains informational
- `node --check server.mjs`: PASS
- `node server.mjs`: PASS
  - local server listened on `http://127.0.0.1:4177`

## Browser QA With Supabase Configured

Test user created through the real AuthPanel flow:

- `cp15d-test-20260611193607@example.com`

Results:

- logged out login-only shell: PASS
- protected UI hidden while logged out: PASS
  - chat hidden
  - studios hidden
  - upload hidden
  - tool list hidden
  - Project Workspace hidden
- signup opens full app: PASS
- header user state: PASS
  - email shown
  - role shown as `owner_admin`
  - workspace shown as `Apex Workspace`
  - persistence shown as `hybrid-sync`
  - `Sign out` button shown
- refresh preserves session: PASS
- logout locks app back to login-only: PASS
- incognito/private login-only: PASS
- upload after login: PASS at UI level
- project sync after login: FAIL for remote database confirmation

## Storage QA

Files used:

- `cp15d-upload-test.txt`
- `cp15d-upload-test.pdf`
- `cp15d-valid-image.png`

UI results:

- txt upload: PASS
  - file visible in chat/workspace
  - autosave indicator visible
- image upload: PASS at file/workspace level
  - file visible
  - image preview showed `Image ready`
  - AI parser returned `unsupported image` for tiny 1x1 PNG; this is an analysis limitation, not an upload UI failure
- pdf upload: PASS
  - file visible in chat/workspace
  - autosave indicator visible
- refresh keeps workspace metadata in browser UI/local workspace: PARTIAL
  - txt remained visible after refresh
  - later isolated upload sessions showed current-project metadata only for the active file

Remote metadata query:

Executed with the same real Supabase session using anon key and `signInWithPassword`, then queried:

- `profiles`
- `tenant_members`
- `projects`
- `project_files`

Observed:

- profile exists
- tenant membership exists
- role: `owner_admin`
- tenant: `Apex Workspace`
- `projects`: empty
- `project_files`: empty

Result:

- `project_files` metadata: FAIL
- remote project metadata sync: FAIL

This means the UI currently reports `Persistence: hybrid-sync` and shows autosave, but the CP15D database query did not confirm persisted rows in `projects` or `project_files` for the test user.

## Demo Mode QA

Safe temporary env removal was attempted:

- `.env.local` was renamed to `.env.local.cp15d-backup`
- `npm.cmd run build` without `.env.local`: PASS
- `.env.local` was restored immediately

Evidence:

- built `dist` bundle contains `Local demo mode — Supabase not configured.`

Browser capture after temporary env removal was inconclusive because the Chrome/headless command returned no structured output in that step.

Result:

- local demo banner: NOT TESTED in browser
- reason: env-file restoration was prioritized; bundle text was verified, but browser DOM capture did not produce a reliable result during the temporary-env window.

## Security Audit

Search terms:

- `service_role`
- `SUPABASE_SERVICE_ROLE`
- `SUPABASE_SERVICE_ROLE_KEY`
- `sk-`
- `OPENAI_API_KEY`
- `fake auth`
- `fakeAuth`
- `bypass auth`
- `localStorage.*auth`
- `sessionStorage.*auth`

Results:

- service role frontend usage: NONE
  - only documentation, validation warnings, migration comments, and server-only warning text were found
- `SUPABASE_SERVICE_ROLE_KEY`: not used by browser code
  - placeholder appears in `.env.example`
  - warning appears in server readiness endpoint/documentation
- `OPENAI_API_KEY` in frontend: NONE
  - appears in `.env.example`, `server.mjs`, validation scripts, and docs
  - not used in `src` browser code
- fake auth/bypass: NONE FOUND as implemented bypass
  - text references warn against fake auth
  - AuthPanel uses real Supabase calls when Supabase is configured
- browser Supabase env usage:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Vercel Readiness

Package scripts:

- build command: `npm run build`
- production build output: `dist`
- local start command: `node server.mjs`

Required env vars:

- browser:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- server/API runtime:
  - `OPENAI_API_KEY` if server-side AI endpoints are expected to work
  - optional model/config vars used by `server.mjs`

Frontend service role:

- required
- must be configured as `VITE_*`

Vercel blocker:

- The app is a Vite SPA plus custom `server.mjs`.
- A static Vercel deployment of `dist` can serve the frontend, but relative API endpoints currently implemented in `server.mjs` will not run as Vercel serverless functions without adaptation.
- Full production on Vercel needs one of:
  - convert `server.mjs` API handlers into Vercel-compatible serverless functions, or
  - deploy the custom Node server to a host that supports long-running Node servers, or
  - add a Vercel routing/build adapter explicitly designed for this app.

SPA fallback:

- Required for client-side app routing if routes are added beyond `/`.
- Current `server.mjs` handles static fallback locally.
- Vercel static deployment would need rewrite fallback to `index.html`.

## Blockers

1. Remote project sync not confirmed.
   - `projects` query returned empty for the CP15D test user.
   - UI showed `Persistence: hybrid-sync` and autosave, but DB did not confirm rows.

2. Remote file metadata not confirmed.
   - `project_files` query returned empty for uploaded QA files.
   - This blocks CP15D Storage QA.

3. Vercel full-stack readiness is incomplete.
   - `server.mjs` is a custom Node server.
   - Vercel static hosting alone will not run the backend API endpoints.

4. Demo mode browser QA was inconclusive.
   - Build without `.env.local` passed and bundle contains the banner.
   - Browser DOM capture during temporary env removal did not return reliable structured output.

## GO / NO GO

NO GO for CP15D production readiness.

Reason:

- Auth gate is green.
- Build is green.
- Basic UI upload is green.
- Security audit is green.
- But remote `projects` and `project_files` persistence was not confirmed, and Vercel full-stack deployment needs an API/server deployment decision.

## Minimum Fix Recommendation

Next checkpoint should be:

`CP15D-FIX — Remote Project/File Metadata Sync`

Scope:

- inspect why `syncProjectToSupabase` does not create visible rows in `projects` and `project_files`
- surface sync errors in the UI instead of showing only `hybrid-sync`
- confirm insert/select RLS for `projects`, `project_members`, `project_files`, `project_messages`, `project_exports`
- retest txt/image/pdf metadata with real Supabase session
- only after that, revisit Vercel backend deployment strategy


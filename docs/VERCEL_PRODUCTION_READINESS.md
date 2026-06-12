# Apex AI Copilot - Vercel Production Readiness

## CP15E status

Status: GREEN for production environment readiness documentation and local safety audit.

No production deploy was executed in CP15E. No Supabase migration was executed. No Supabase remote state was changed. No push was executed automatically.

## Baseline

- Repo: `D:\AI-constr\apex-ai-copilot-platform`
- GitHub: `https://github.com/jedgard70/apex-ai-copilot-platform`
- Branch: `feature/image-generation-connector`
- Base commit: `ef43d66dab09c94b7f4f36cab3ce12008671ee34`
- Base commit message: `chore: ignore Supabase temp files`
- Initial git status at first CP15E attempt: blocked because two documentation files were already untracked:
  - `docs/CP15D_PRODUCTION_READINESS_REPORT.md`
  - `docs/VERCEL_PRODUCTION_READINESS.md`
- Jose authorized CP15E unblock by inspecting and incorporating those existing untracked docs without deleting, reverting or overwriting unrelated work.

## Existing untracked documentation review

Reviewed before finalizing CP15E:

- `docs/CP15D_PRODUCTION_READINESS_REPORT.md`
  - Decision: keep as legitimate CP15D governance evidence.
  - Contents: documents prior auth/storage QA, Vercel readiness findings, and known NO GO items from that QA pass.
  - Secret audit: no real service role key, JWT secret, full anon key, private token, password, `.env.local` content or private credential value was found.
- `docs/VERCEL_PRODUCTION_READINESS.md`
  - Decision: use as the CP15E checkpoint document and normalize it to the actual CP15E unblock state.
  - Contents: production env readiness, Vercel manual checklist, pre/post deploy checklist, runtime modes, risks and CP15F gate.
  - Secret audit: no real service role key, JWT secret, full anon key, private token, password, `.env.local` content or private credential value was found.

## Prior checkpoints

### CP15B

- Supabase Auth is connected locally.
- Signup, login and logout were validated locally.
- Profile, tenant and tenant membership bootstrap were validated.
- Project sync to Supabase was validated.
- Project metadata, messages and file metadata sync were validated.
- Small upload to `project-uploads` was validated.
- `.env.local` was not committed.
- No service role key was used in browser code.

### CP15C

- Protected Auth Gate is implemented.
- When Supabase is configured and no valid session exists, the app renders only login/AuthPanel.
- Chat, studios, upload, tools, workspace and private project data are not mounted while logged out.
- Refresh preserves the Supabase session.
- Logout returns to login-only mode.
- When Supabase env vars are absent, the app remains available in local demo mode with the banner:
  `Local demo mode - Supabase not configured.`

### CP15D

- `supabase/.temp/` is ignored by Git.
- No file under `supabase/.temp/` is tracked or committed.
- CP15B and CP15C were pushed to `origin/feature/image-generation-connector`.
- CP15D git hygiene for ignored Supabase temp files is GREEN.
- Remote history includes:
  - `ef43d66 chore: ignore Supabase temp files`
  - `a8f1156 feat: add protected auth gate`
  - `7425f3c feat: connect Supabase auth and project sync locally`
- `docs/CP15D_PRODUCTION_READINESS_REPORT.md` is retained as a separate QA/governance report. Its NO GO findings are documented evidence from that pass and do not change the CP15E scope: production env and Vercel readiness documentation only.

## Environment variables used by the app

### Browser/Vite variables

Production Vercel must provide these public browser variables:

```text
VITE_SUPABASE_URL=<production Supabase project URL>
VITE_SUPABASE_ANON_KEY=<production Supabase anon public key>
```

These values are public client configuration. Data protection must come from Supabase Auth, RLS, Storage policies and server-side rules, not from secrecy of the anon key.

Observed browser-side env reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APEX_DEBUG` as an optional local debug flag
- `GOOGLE_OAUTH_STATUS` as a status flag in client code; because it is not prefixed with `VITE_`, Vite will not expose it to the browser by default, so the app falls back to `not-configured`. This is not required for CP15E production readiness.

### Server/local runtime variables

The local Node server reads `.env.local` for local runtime behavior. Do not commit `.env.local`.

Server-side or local-only variables observed:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_CHAT_MODEL`
- `OPENAI_IMAGE_SOURCE_MAX_BYTES`
- `OPENAI_IMAGE_MODEL`
- `OPENAI_IMAGE_SIZE`
- `OPENAI_IMAGE_QUALITY`
- `PORT`

These are not required for the protected Supabase Auth Gate itself. If any private runtime key is later needed in production, configure it only in Vercel environment variables and never expose it through `VITE_*`.

## Variables prohibited in frontend/browser

Never expose these in browser code, `VITE_*` variables, screenshots, public logs or public docs:

```text
service_role
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SERVICE_ROLE
SUPABASE_SERVICE_ROLE_SECRET
any private API key
any private token
any database password
```

Audit result: no service role key is used by frontend/browser code. Existing references are documentation, validation warnings, server-only future-use labels, or migration comments reminding that service role must not be exposed.

`.env.example` contains a placeholder line for `SUPABASE_SERVICE_ROLE_KEY=server-only-do-not-expose`. This is not a real secret. Do not replace it with a real value in committed files.

## Sensitive file audit

- `.env.local`: not tracked by Git.
- `supabase/.temp/`: not tracked by Git.
- `supabase/.temp/`: ignored through `.gitignore`.
- No hardcoded OpenAI-style, GitHub-style or Supabase service-role secret value was identified in tracked files during CP15E search.
- No secret values were printed into this document.

## Vercel manual setup checklist

Use Vercel Dashboard or Vercel CLI only after Jose explicitly authorizes production setup or deployment.

1. Create or open the Vercel project for `jedgard70/apex-ai-copilot-platform`.
2. Confirm the project root points to the repository root.
3. Confirm install command uses the committed package manager lockfile.
4. Confirm build command:
   `npm run build`
5. Confirm output directory for Vite:
   `dist`
6. Add Production environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Add Preview environment variables only if previews should connect to the same reviewed Supabase project.
8. Do not add `SUPABASE_SERVICE_ROLE_KEY` to frontend/browser configuration.
9. Do not paste `.env.local` into Vercel logs, issues, commits or public docs.
10. Keep production deploy disabled until Jose explicitly authorizes CP15F or a later deploy checkpoint.

## Pre-deploy checklist

Before any future Vercel deploy:

1. Confirm Jose explicitly authorized deploy.
2. Confirm branch and commit to deploy.
3. Confirm `git status --short` is clean.
4. Confirm `.env.local` is not tracked.
5. Confirm `supabase/.temp/` is not tracked.
6. Confirm Vercel env vars exist for the target environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Confirm no service role key is exposed in frontend/browser env.
8. Run:
   - `npm.cmd run build`
   - `node --check server.mjs`
   - `npm.cmd run validate:supabase-sql`
9. Review the Vite chunk-size warning and decide whether it is acceptable for the deploy checkpoint.
10. Do not run Supabase migrations unless a separate checkpoint authorizes schema changes.

## Future post-deploy checklist

After a future authorized deploy:

1. Open the production URL in a fresh browser profile.
2. Confirm logged-out state renders only login/AuthPanel.
3. Confirm chat, studios, upload, tools and workspace do not mount while logged out.
4. Sign up or sign in with a reviewed production test user.
5. Confirm the header shows email, role, workspace and persistence mode.
6. Confirm refresh preserves the Supabase session.
7. Confirm logout returns to login-only state.
8. Confirm an incognito/private browser shows login-only state.
9. Confirm project sync works for the signed-in user.
10. Confirm a small upload and metadata sync work under RLS/Storage policies.
11. Re-run Supabase Auth/Security Advisor review manually in the Supabase dashboard.
12. If Auth Advisor still reports leaked password protection, document it and decide in a separate security checkpoint; do not change Supabase in CP15E.

## Runtime modes

### Local demo mode

Supabase env vars are missing. The app remains available locally and shows:

```text
Local demo mode - Supabase not configured.
```

LocalStorage remains active. This mode is not proof of production auth, RLS or Storage security.

### Local Supabase/hybrid-sync mode

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist locally. Supabase Auth is active. Signed-in users can use the protected app shell and sync reviewed project data through the browser Supabase client under RLS.

### Production Supabase/Auth mode

Vercel provides the public Supabase variables for the production environment. Logged-out users see only AuthPanel. Signed-in users see the full app after Supabase returns a valid session, profile and tenant membership.

## Known risks and follow-up items

- Vite chunk-size warning: `dist/assets/index-*.js` is larger than 500 kB after minification. Current CP15E decision: document only; no code splitting change authorized.
- Supabase Security Advisor warning for `authenticated_security_definer_function_executable`: previously documented as intentional for the reviewed `bootstrap_user_workspace` RPC, because it must be callable by signed-in users and does not expose arbitrary role/tenant input. If it still appears in the live advisor, keep it documented and review again in a security checkpoint before production.
- Supabase Auth Advisor leaked password protection: not checked against the remote dashboard in CP15E because this checkpoint does not alter or inspect Supabase remote advisor state. Verify manually before CP15F deploy authorization.
- `GOOGLE_OAUTH_STATUS` is read in client code without a `VITE_` prefix. It is a non-secret status flag and defaults to `not-configured` in Vite. If Google OAuth becomes part of production scope, handle it in a separate checkpoint.

## CP15E local validation results

Executed during CP15E:

```text
npm.cmd run build
node --check server.mjs
npm.cmd run validate:supabase-sql
```

Results:

- Build: OK
- Server syntax check: OK
- Supabase SQL draft validation: OK
- Vite chunk-size warning: present and documented
- Supabase SQL validation warnings: 0

## CP15F gate

CP15F or any production deploy can start only after explicit Jose authorization.

Do not deploy automatically from CP15E. Do not create a Vercel project automatically. Do not run Supabase migrations automatically. Do not change RPC/Auth Gate/schema outside a separately authorized checkpoint.

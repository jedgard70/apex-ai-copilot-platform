# CP15F Vercel Production Deployment Report

Date: 2026-06-12
Branch: `main`
Scope: `jedgard70s-projects`
Project: `apex-ai-copilot-platform`
Project ID: `prj_uVRjNyFprz8NyzVcb8NTdnALr1Xm`
Org/team ID: `team_L8P3qAd8YauLTCpxeALlvRzW`

## Summary

CP15F configured the Vercel project for the Apex AI Copilot Vite frontend and executed a production deployment.

No Supabase migration was executed. No Supabase remote state, Auth Gate, RPC, or schema was changed. No secret values were committed or printed.

## Local Governance

- `.vercel/project.json` exists locally and contains only Vercel link metadata:
  - `projectId`
  - `orgId`
  - `projectName`
- `.vercel/` is ignored by Git.
- `.vercel/project.json` was not tracked or committed.
- `.env.local` was not tracked or committed.
- `supabase/.temp/` was not tracked or committed.

## Vercel Build Settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- Root directory: repository root
- Node.js version: `24.x`

The repository also includes a minimal `vercel.json` with:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## Production Environment Variables

Configured in Vercel Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Not configured:

- `service_role`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_ROLE`
- `SUPABASE_SERVICE_ROLE_SECRET`
- database passwords
- private tokens

The configured values were not printed in logs or documentation.

## Local Checks

Executed before deployment:

```text
npm.cmd run build
node --check server.mjs
npm.cmd run validate:supabase-sql
```

Results:

- Build: OK
- Server syntax check: OK
- Supabase SQL draft validation: OK
- Supabase SQL validation warnings: 0
- Vite chunk-size warning: present and unchanged

## Production Deployment

- Deployment ID: `dpl_6RZzWrJyAxyr1WmhQCjmTnYTHeud`
- Production URL: `https://apex-ai-copilot-platform.vercel.app`
- Deployment URL: `https://apex-ai-copilot-platform-76t2v8ljz-jedgard70s-projects.vercel.app`
- Target: `production`
- Status: `Ready`

Vercel logs check returned no runtime logs for the inspected window.

## Post-Deploy Validation

HTTP/static validation:

- Production URL returned HTTP 200.
- HTML and JS assets were reachable.
- Initial HTML did not contain the local demo mode banner.
- Initial HTML did not contain service role text.
- Browser bundle contains AuthPanel/login-related strings.
- Browser bundle contains the local demo mode string because demo mode remains compiled as a fallback path.
- Browser bundle contains the phrase `service role` only as a user-facing/server-only warning string from existing app text; no service role key or private value was found or configured.

Interactive browser validation was not completed in this checkpoint because the available Playwright runtime was missing `playwright-core`. No destructive login/signup test was performed.

## Deployment hardening applied

To prevent future canceled deployments caused by unverified or unchecked commits, the repository now uses a GitHub Actions gate that runs on `main` for every PR and push:

- `npm ci`
- `npm run build`
- `npm run test`
- validation scripts for the Apex checkpoints

This makes the deployment path explicit: only commits that pass CI can reach the Vercel production flow. For GitHub commit verification, signed commits (GPG/SSH) are recommended.

## Follow-Up

Before a broader production acceptance checkpoint, perform interactive browser validation with a working browser automation runtime or manually in a clean browser profile:

1. Open `https://apex-ai-copilot-platform.vercel.app`.
2. Confirm logged-out state renders only AuthPanel/login.
3. Confirm private UI is not accessible while logged out.
4. Confirm the local demo mode banner is not visible when Production Supabase env vars are configured.
5. Confirm no private keys or service role values are present in browser-accessible configuration.

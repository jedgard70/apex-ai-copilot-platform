# Supabase Env Setup Guide

Status: CP12C documentation only. Do not add real keys yet.

## Variables

| Variable | Client safe | Where used | Notes |
|---|---:|---|---|
| `VITE_SUPABASE_URL` | yes | Browser app | Public Supabase project URL for the frontend client. |
| `VITE_SUPABASE_ANON_KEY` | yes | Browser app | Public anon key. RLS must protect data. |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Server-only future backend | Never expose in Vite, browser, screenshots, client code or public logs. |
| `GOOGLE_OAUTH_STATUS` | yes/status only | UI/server status | Use `not-configured` until Google OAuth is configured. |

## Local Setup Later

When Owner approves real connection:

1. Create or update `.env.local`.
2. Add:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
GOOGLE_OAUTH_STATUS=not-configured
```

3. Add `SUPABASE_SERVICE_ROLE_KEY` only if a server endpoint needs it later.
4. Do not commit `.env.local`.
5. Restart the app after changing env variables.

## Vercel Setup Later

Only after GitHub remote and Vercel deployment are approved:

1. Open the Vercel project settings.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Add `SUPABASE_SERVICE_ROLE_KEY` only to server/runtime environments that need it.
4. Keep service role out of public build-time exposure.
5. Add Google OAuth callback URLs after deployment URL is known.

## Client-Safe vs Server-Only

`VITE_*` variables are bundled into browser code. They must never contain secrets.

The anon key is client-safe only because RLS protects rows. If RLS is wrong, the anon key can expose data. This is why CP12 requires RLS validation before pilot users.

The service role key bypasses RLS. It is server-only and must never appear in:

- React/Vite client code
- `.env.example` with a real value
- logs
- screenshots
- exported project packages
- Git commits

## Google OAuth Later

Keep `GOOGLE_OAUTH_STATUS=not-configured` until:

- Google OAuth provider is created.
- Supabase Auth Google provider is configured.
- Redirect URLs are known.
- Local and deployed callback URLs are tested.

The UI must show "Google OAuth not configured yet" until this is true.

import fs from 'node:fs'
import path from 'node:path'

loadEnvLocal()

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN
const projectRef = process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF
const ownerEmail = process.env.APEX_OWNER_EMAIL || 'jedgard70@gmail.com'

console.log('OWNER WORKSPACE LIVE VALIDATION')
console.log(`Project ref: ${projectRef || '(missing)'}`)
console.log(`Owner email: ${ownerEmail}`)

if (!accessToken || !projectRef) {
  console.error('[OWNER WORKSPACE ERROR] Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF.')
  process.exit(1)
}

const sql = `
select
  (select count(*) from auth.users where lower(email) = lower('${ownerEmail.replace(/'/g, "''")}')) as auth_user_count,
  (select count(*) from public.profiles where lower(email) = lower('${ownerEmail.replace(/'/g, "''")}')) as profile_count,
  (
    select count(*)
    from public.tenant_members tm
    join public.profiles p on p.id = tm.user_id
    where lower(p.email) = lower('${ownerEmail.replace(/'/g, "''")}')
      and tm.status = 'active'
      and tm.role = 'owner_admin'
  ) as owner_membership_count,
  (
    select count(*)
    from public.tenants t
    join public.tenant_members tm on tm.tenant_id = t.id
    join public.profiles p on p.id = tm.user_id
    where lower(p.email) = lower('${ownerEmail.replace(/'/g, "''")}')
      and t.status = 'active'
      and tm.status = 'active'
  ) as active_tenant_count,
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'bootstrap_user_workspace'
  ) as bootstrap_rpc_count;
`

try {
  const response = await fetch(`https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error(`[OWNER WORKSPACE ERROR] Supabase API HTTP ${response.status}: ${data?.message || data?.error || 'unknown error'}`)
    process.exit(1)
  }

  const row = Array.isArray(data) ? data[0] : null
  if (!row) {
    console.error('[OWNER WORKSPACE ERROR] Unexpected empty response.')
    process.exit(1)
  }

  const checks = {
    authUser: Number(row.auth_user_count || 0) > 0,
    profile: Number(row.profile_count || 0) > 0,
    ownerMembership: Number(row.owner_membership_count || 0) > 0,
    activeTenant: Number(row.active_tenant_count || 0) > 0,
    bootstrapRpc: Number(row.bootstrap_rpc_count || 0) > 0,
  }

  for (const [name, ok] of Object.entries(checks)) {
    console.log(`${ok ? '[OK]' : '[MISSING]'} ${name}`)
  }

  if (Object.values(checks).every(Boolean)) {
    console.log('[OWNER WORKSPACE STATUS] Ready for real Supabase owner workspace.')
    process.exit(0)
  }

  console.error('[OWNER WORKSPACE STATUS] Not ready. Sign in once through the app to trigger bootstrap, or add the missing profile/tenant membership.')
  process.exit(1)
} catch (error) {
  console.error(`[OWNER WORKSPACE ERROR] ${error.message}`)
  process.exit(1)
}

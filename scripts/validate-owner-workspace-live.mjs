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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const projectRef = process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF
const ownerEmail = process.env.APEX_OWNER_EMAIL || 'jedgard70@gmail.com'

console.log('OWNER WORKSPACE LIVE VALIDATION')
console.log(`Project ref: ${projectRef || '(missing)'}`)
console.log(`Owner email: ${ownerEmail}`)
console.log(`Método de auth: ${accessToken ? 'SUPABASE_ACCESS_TOKEN (Management API)' : serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY (REST API)' : 'nenhum — configure SUPABASE_ACCESS_TOKEN ou SUPABASE_SERVICE_ROLE_KEY'}`)

function exitGracefully(code) {
  setTimeout(() => process.exit(code), 100)
}

// ─────────────────────────────────────────────
// SQL aggregator via Management API (PAT)
// ─────────────────────────────────────────────
async function queryViaManagementApi(token) {
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

  const response = await fetch(`https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data?.message || data?.error || 'unknown'}`)
  }

  const row = Array.isArray(data) ? data[0] : null
  if (!row) throw new Error('Empty response from Management API')

  return {
    authUserCount: Number(row.auth_user_count || 0),
    profileCount: Number(row.profile_count || 0),
    ownerMembershipCount: Number(row.owner_membership_count || 0),
    activeTenantCount: Number(row.active_tenant_count || 0),
    bootstrapRpcCount: Number(row.bootstrap_rpc_count || 0),
  }
}

// ─────────────────────────────────────────────
// Query via REST API (PostgREST + Auth admin)
// usando SUPABASE_SERVICE_ROLE_KEY
// ─────────────────────────────────────────────
async function queryViaRestApi(key) {
  const baseUrl = `https://${projectRef}.supabase.co`
  const headers = {
    Authorization: `Bearer ${key}`,
    apiKey: key,
    Accept: 'application/json',
  }

  // 1. Auth users via GoTrue admin API
  let authUserCount = 0
  try {
    const authUrl = `${baseUrl}/auth/v1/admin/users?filter%5Bemail%5D=eq.${encodeURIComponent(ownerEmail)}`
    const authResp = await fetch(authUrl, { headers })
    if (authResp.ok) {
      const body = await authResp.json()
      const users = body?.users || body
      authUserCount = Array.isArray(users)
        ? users.filter(u => String(u.email || '').toLowerCase() === ownerEmail.toLowerCase()).length
        : 0
    }
  } catch (e) { console.log(`[REST] Auth admin API indisponível: ${e.message}`) }

  // 2. Profile via PostgREST
  let profileCount = 0
  let userId = null
  try {
    const profileResp = await fetch(
      `${baseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(ownerEmail)}&select=id`,
      { headers }
    )
    if (profileResp.ok) {
      const profiles = await profileResp.json()
      if (Array.isArray(profiles)) {
        profileCount = profiles.length
        userId = profiles[0]?.id || null
      }
    }
  } catch (e) { console.log(`[REST] Erro ao consultar profiles: ${e.message}`) }

  // 3. Tenant memberships via PostgREST (usando userId do profile)
  let ownerMembershipCount = 0
  let activeTenantCount = 0
  if (userId) {
    try {
      const tmResp = await fetch(
        `${baseUrl}/rest/v1/tenant_members?user_id=eq.${userId}&select=id,role,status,tenant_id`,
        { headers }
      )
      if (tmResp.ok) {
        const memberships = await tmResp.json()
        if (Array.isArray(memberships)) {
          ownerMembershipCount = memberships.filter(m => m.status === 'active' && m.role === 'owner_admin').length
          // Verificar status do tenant para cada membership
          for (const m of memberships.filter(m => m.status === 'active')) {
            try {
              const tResp = await fetch(
                `${baseUrl}/rest/v1/tenants?id=eq.${m.tenant_id}&select=status`,
                { headers }
              )
              if (tResp.ok) {
                const tenants = await tResp.json()
                if (Array.isArray(tenants) && tenants.some(t => t.status === 'active')) {
                  activeTenantCount++
                }
              }
            } catch (e) { console.log(`[REST] Erro ao verificar tenant ${m.tenant_id}: ${e.message}`) }
          }
        }
      }
    } catch (e) { console.log(`[REST] Erro ao consultar tenant_members: ${e.message}`) }
  }

  // 4. Bootstrap RPC — tenta chamar a função; 404 = não existe
  let bootstrapRpcCount = 0
  try {
    const rpcResp = await fetch(`${baseUrl}/rest/v1/rpc/bootstrap_user_workspace`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: '{}',
    })
    // Se a função existe (qualquer status que não 404), consideramos presente
    if (rpcResp.status !== 404) bootstrapRpcCount = 1
  } catch (e) { console.log(`[REST] Função bootstrap_user_workspace não encontrada: ${e.message}`) }

  return { authUserCount, profileCount, ownerMembershipCount, activeTenantCount, bootstrapRpcCount }
}

// ─────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────
async function main() {
  if (!projectRef) {
    console.error('[OWNER WORKSPACE ERROR] Missing SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_PROJECT_REF.')
    exitGracefully(1)
  }

  let checks

  // Tenta Management API com PAT primeiro
  if (accessToken) {
    try {
      console.log('[AUTH] Tentando Management API com SUPABASE_ACCESS_TOKEN...')
      checks = await queryViaManagementApi(accessToken)
      console.log('[AUTH] Management API OK')
    } catch (err) {
      console.log(`[AUTH] Management API falhou (${err.message}).`)
    }
  }

  // Fallback 1: Management API com service role key (algumas configs aceitam)
  if (!checks && serviceRoleKey) {
    try {
      console.log('[AUTH] Tentando Management API com SUPABASE_SERVICE_ROLE_KEY...')
      checks = await queryViaManagementApi(serviceRoleKey)
      console.log('[AUTH] Management API (service role) OK')
    } catch (err) {
      console.log(`[AUTH] Management API (service role) falhou (${err.message}).`)
    }
  }

  // Fallback 2: REST API com service role key
  if (!checks && serviceRoleKey) {
    try {
      console.log('[AUTH] Fazendo fallback para REST API (PostgREST + Auth admin)...')
      checks = await queryViaRestApi(serviceRoleKey)
      console.log('[AUTH] REST API fallback OK')
    } catch (err) {
      console.error(`[OWNER WORKSPACE ERROR] REST API fallback também falhou: ${err.message}`)
      exitGracefully(1)
    }
  }

  if (!checks) {
    console.error('[OWNER WORKSPACE ERROR] Nenhum método de autenticação funcionou. Configure SUPABASE_ACCESS_TOKEN ou SUPABASE_SERVICE_ROLE_KEY no .env.local')
    exitGracefully(1)
  }

  const { authUserCount, profileCount, ownerMembershipCount, activeTenantCount, bootstrapRpcCount } = checks
  const checksMap = {
    authUser: authUserCount > 0,
    profile: profileCount > 0,
    ownerMembership: ownerMembershipCount > 0,
    activeTenant: activeTenantCount > 0,
    bootstrapRpc: bootstrapRpcCount > 0,
  }

  for (const [name, ok] of Object.entries(checksMap)) {
    console.log(`${ok ? '[OK]' : '[MISSING]'} ${name}`)
  }

  if (Object.values(checksMap).every(Boolean)) {
    console.log('[OWNER WORKSPACE STATUS] Ready for real Supabase owner workspace.')
    exitGracefully(0)
  } else {
    console.error('[OWNER WORKSPACE STATUS] Not ready. Sign in once through the app to trigger bootstrap, or add the missing profile/tenant membership.')
    exitGracefully(1)
  }
}

main().catch(err => {
  console.error(`[OWNER WORKSPACE ERROR] Erro inesperado: ${err.message}`)
  exitGracefully(1)
})


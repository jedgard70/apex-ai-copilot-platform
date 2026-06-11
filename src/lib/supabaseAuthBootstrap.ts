import { User } from '@supabase/supabase-js'
import { getBrowserSupabaseClient } from './supabaseClient'

export type SupabaseAccountState = {
  providerStatus: 'supabase-not-configured' | 'supabase-connected'
  sessionStatus: 'signed-out' | 'signed-in' | 'error'
  user: {
    id: string
    email: string
  } | null
  profile: {
    id: string
    email: string
    full_name?: string | null
    default_tenant_id?: string | null
  } | null
  tenant: {
    id: string
    name: string
    slug?: string | null
  } | null
  role: string | null
  permissions: string[]
  persistenceMode: 'localStorage' | 'supabase-connected' | 'hybrid-sync'
  bootstrapStatus: 'ready' | 'needs-login' | 'needs-profile-bootstrap' | 'needs-tenant-assignment' | 'blocked-by-rls' | 'error'
  message: string
}

function emptyState(message: string): SupabaseAccountState {
  return {
    providerStatus: 'supabase-not-configured',
    sessionStatus: 'signed-out',
    user: null,
    profile: null,
    tenant: null,
    role: null,
    permissions: [],
    persistenceMode: 'localStorage',
    bootstrapStatus: 'needs-login',
    message,
  }
}

function userPayload(user: User) {
  return {
    id: user.id,
    email: user.email || '',
  }
}

export async function loadSupabaseAccountState(): Promise<SupabaseAccountState> {
  const { client, status } = getBrowserSupabaseClient()
  if (!client) return emptyState(status.message)

  const sessionResult = await client.auth.getSession()
  if (sessionResult.error) {
    return {
      ...emptyState(sessionResult.error.message),
      providerStatus: 'supabase-connected',
      sessionStatus: 'error',
      bootstrapStatus: 'error',
    }
  }

  const user = sessionResult.data.session?.user
  if (!user) {
    return {
      ...emptyState('Supabase is connected. No active user session yet.'),
      providerStatus: 'supabase-connected',
      persistenceMode: 'supabase-connected',
    }
  }

  const profileResult = await client
    .from('profiles')
    .select('id,email,full_name,default_tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileResult.error) {
    return {
      providerStatus: 'supabase-connected',
      sessionStatus: 'signed-in',
      user: userPayload(user),
      profile: null,
      tenant: null,
      role: null,
      permissions: [],
      persistenceMode: 'supabase-connected',
      bootstrapStatus: 'blocked-by-rls',
      message: `Profile lookup failed: ${profileResult.error.message}`,
    }
  }

  if (!profileResult.data) {
    return {
      providerStatus: 'supabase-connected',
      sessionStatus: 'signed-in',
      user: userPayload(user),
      profile: null,
      tenant: null,
      role: null,
      permissions: [],
      persistenceMode: 'supabase-connected',
      bootstrapStatus: 'needs-profile-bootstrap',
      message: 'Signed in, but no profile row exists yet. A safe bootstrap policy/RPC may be required before remote project sync.',
    }
  }

  const membershipResult = await client
    .from('tenant_members')
    .select('role,tenant_id,tenants(id,name,slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (membershipResult.error) {
    return {
      providerStatus: 'supabase-connected',
      sessionStatus: 'signed-in',
      user: userPayload(user),
      profile: profileResult.data,
      tenant: null,
      role: null,
      permissions: [],
      persistenceMode: 'supabase-connected',
      bootstrapStatus: 'blocked-by-rls',
      message: `Tenant membership lookup failed: ${membershipResult.error.message}`,
    }
  }

  const tenantRow = membershipResult.data?.tenants
  const tenant = Array.isArray(tenantRow) ? tenantRow[0] : tenantRow

  if (!membershipResult.data || !tenant) {
    return {
      providerStatus: 'supabase-connected',
      sessionStatus: 'signed-in',
      user: userPayload(user),
      profile: profileResult.data,
      tenant: null,
      role: null,
      permissions: [],
      persistenceMode: 'supabase-connected',
      bootstrapStatus: 'needs-tenant-assignment',
      message: 'Signed in with profile, but no active tenant membership exists. Assign Owner/Admin manually or add a reviewed bootstrap RPC.',
    }
  }

  return {
    providerStatus: 'supabase-connected',
    sessionStatus: 'signed-in',
    user: userPayload(user),
    profile: profileResult.data,
    tenant,
    role: membershipResult.data.role,
    permissions: [],
    persistenceMode: 'hybrid-sync',
    bootstrapStatus: 'ready',
    message: 'Supabase session, profile and tenant membership are ready for hybrid project sync.',
  }
}

export async function attemptProfileBootstrap(): Promise<SupabaseAccountState> {
  const { client } = getBrowserSupabaseClient()
  if (!client) return emptyState('Supabase/Auth not connected yet.')
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError || !sessionData.session?.user) return emptyState(sessionError?.message || 'Login required before profile bootstrap.')
  const user = sessionData.session.user

  const bootstrapResult = await client.rpc('bootstrap_user_workspace')

  if (bootstrapResult.error) {
    return {
      providerStatus: 'supabase-connected',
      sessionStatus: 'signed-in',
      user: userPayload(user),
      profile: null,
      tenant: null,
      role: null,
      permissions: [],
      persistenceMode: 'supabase-connected',
      bootstrapStatus: 'blocked-by-rls',
      message: `Workspace bootstrap failed: ${bootstrapResult.error.message}`,
    }
  }

  return loadSupabaseAccountState()
}

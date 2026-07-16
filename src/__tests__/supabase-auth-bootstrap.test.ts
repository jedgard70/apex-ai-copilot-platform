import { afterEach, describe, expect, it, vi } from 'vitest'

const { getBrowserSupabaseClientMock } = vi.hoisted(() => ({
  getBrowserSupabaseClientMock: vi.fn(),
}))

vi.mock('../lib/supabaseClient', () => ({
  getBrowserSupabaseClient: getBrowserSupabaseClientMock,
}))

import { attemptProfileBootstrap, loadSupabaseAccountState } from '../lib/supabaseAuthBootstrap'

function queryBuilder(result: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
}

function supabaseClientWithLookups(params: {
  sessionResult: unknown
  profileResult?: unknown
  tenantUsersResult?: unknown
  membershipResult?: unknown
  bootstrapResult?: unknown
}) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue(params.sessionResult),
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') return queryBuilder(params.profileResult)
      if (table === 'tenant_users') return queryBuilder(params.tenantUsersResult)
      if (table === 'tenant_members') return queryBuilder(params.membershipResult)
      throw new Error(`Unexpected table lookup: ${table}`)
    }),
    rpc: vi.fn().mockResolvedValue(params.bootstrapResult ?? { data: { ok: true }, error: null }),
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('supabaseAuthBootstrap.loadSupabaseAccountState', () => {
  it('returns signed-out localStorage mode when client is missing', async () => {
    getBrowserSupabaseClientMock.mockReturnValue({
      client: null,
      status: { message: 'Supabase/Auth not connected yet.' },
    })

    const state = await loadSupabaseAccountState()

    expect(state.providerStatus).toBe('supabase-not-configured')
    expect(state.sessionStatus).toBe('signed-out')
    expect(state.persistenceMode).toBe('localStorage')
    expect(state.bootstrapStatus).toBe('needs-login')
  })

  it('returns needs-profile-bootstrap when signed in without profile row', async () => {
    const client = supabaseClientWithLookups({
      sessionResult: {
        data: { session: { user: { id: 'user-1', email: 'user@apex.test' } } },
        error: null,
      },
      profileResult: { data: null, error: null },
    })
    getBrowserSupabaseClientMock.mockReturnValue({
      client,
      status: { message: 'connected' },
    })

    const state = await loadSupabaseAccountState()

    expect(state.providerStatus).toBe('supabase-connected')
    expect(state.sessionStatus).toBe('signed-in')
    expect(state.bootstrapStatus).toBe('needs-profile-bootstrap')
    expect(state.user?.id).toBe('user-1')
  })

  it('returns blocked-by-rls when tenant membership lookup fails', async () => {
    const client = supabaseClientWithLookups({
      sessionResult: {
        data: { session: { user: { id: 'user-2', email: 'user2@apex.test' } } },
        error: null,
      },
      profileResult: {
        data: { id: 'user-2', email: 'user2@apex.test', default_tenant_id: 'tenant-1' },
        error: null,
      },
      tenantUsersResult: { data: null, error: null },
      membershipResult: { data: null, error: { message: 'permission denied for tenant_members' } },
    })
    getBrowserSupabaseClientMock.mockReturnValue({
      client,
      status: { message: 'connected' },
    })

    const state = await loadSupabaseAccountState()

    expect(state.bootstrapStatus).toBe('blocked-by-rls')
    expect(state.message).toContain('Tenant membership lookup failed')
  })

  it('returns ready and prefers tenant_users role when both role sources exist', async () => {
    const client = supabaseClientWithLookups({
      sessionResult: {
        data: { session: { user: { id: 'user-3', email: 'user3@apex.test' } } },
        error: null,
      },
      profileResult: {
        data: { id: 'user-3', email: 'user3@apex.test', default_tenant_id: 'tenant-2' },
        error: null,
      },
      tenantUsersResult: {
        data: { role: 'owner_admin', status: 'active' },
        error: null,
      },
      membershipResult: {
        data: {
          role: 'viewer',
          tenant_id: 'tenant-2',
          tenants: { id: 'tenant-2', name: 'Tenant Two', slug: 'tenant-two' },
        },
        error: null,
      },
    })
    getBrowserSupabaseClientMock.mockReturnValue({
      client,
      status: { message: 'connected' },
    })

    const state = await loadSupabaseAccountState()

    expect(state.bootstrapStatus).toBe('ready')
    expect(state.persistenceMode).toBe('hybrid-sync')
    expect(state.role).toBe('owner_admin')
    expect(state.tenant?.id).toBe('tenant-2')
  })
})

describe('supabaseAuthBootstrap.attemptProfileBootstrap', () => {
  it('returns blocked-by-rls when bootstrap RPC fails', async () => {
    const client = supabaseClientWithLookups({
      sessionResult: {
        data: { session: { user: { id: 'user-4', email: 'user4@apex.test' } } },
        error: null,
      },
      bootstrapResult: { data: null, error: { message: 'rpc blocked by policy' } },
    })
    getBrowserSupabaseClientMock.mockReturnValue({
      client,
      status: { message: 'connected' },
    })

    const state = await attemptProfileBootstrap()

    expect(state.bootstrapStatus).toBe('blocked-by-rls')
    expect(state.message).toContain('Workspace bootstrap failed')
  })
})

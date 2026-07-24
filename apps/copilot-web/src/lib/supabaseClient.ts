import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getAuthProviderStatus } from './authModel'

let browserClient: SupabaseClient | null = null

export type SupabaseProviderStatus = {
  providerStatus: 'supabase-not-configured' | 'supabase-connected'
  hasUrl: boolean
  hasAnonKey: boolean
  message: string
}

export function getSupabaseProviderStatus(): SupabaseProviderStatus {
  const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL)
  const hasAnonKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
  const providerStatus = getAuthProviderStatus()

  return {
    providerStatus,
    hasUrl,
    hasAnonKey,
    message: providerStatus === 'supabase-connected'
      ? 'Supabase/Auth environment appears configured for browser auth.'
      : 'Supabase/Auth not connected yet.',
  }
}

export function getBrowserSupabaseClient() {
  const status = getSupabaseProviderStatus()
  if (status.providerStatus !== 'supabase-connected') return { client: null, status }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return { client: null, status: getSupabaseProviderStatus() }
  if (!browserClient) {
    browserClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  }

  return { client: browserClient, status }
}

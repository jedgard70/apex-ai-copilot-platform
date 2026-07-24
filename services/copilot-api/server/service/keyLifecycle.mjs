/**
 * server/service/keyLifecycle.mjs
 *
 * API Key Rotation & Lifecycle Management.
 * Tracks key age, recommends rotation, and provides status API.
 * Key age is determined by the last modified time of env vars in Vercel.
 *
 * For true rotation automation, this would integrate with each provider's API.
 * This service provides monitoring and alerting for stale keys.
 */

const KEY_REGISTRY = [
  { id: 'OPENAI_API_KEY', provider: 'openai', name: 'OpenAI', maxAgeDays: 90, critical: true },
  { id: 'GEMINI_API_KEY', provider: 'gemini', name: 'Gemini AI Studio', maxAgeDays: 180, critical: true },
  { id: 'FAL_KEY', provider: 'fal', name: 'fal.ai', maxAgeDays: 365, critical: false },
  { id: 'AI_GATEWAY_API_KEY', provider: 'gateway', name: 'AI Gateway (Vercel)', maxAgeDays: 365, critical: false },
  { id: 'ELEVENLABS_API_KEY', provider: 'elevenlabs', name: 'ElevenLabs', maxAgeDays: 365, critical: false },
  { id: 'TAVILY_API_KEY', provider: 'tavily', name: 'Tavily', maxAgeDays: 365, critical: false },
  { id: 'OPENCODE_GO_API_KEY', provider: 'opencode', name: 'OpenCode Go', maxAgeDays: 365, critical: false },
  { id: 'STRIPE_SECRET_KEY', provider: 'stripe', name: 'Stripe', maxAgeDays: 365, critical: true },
  { id: 'SUPABASE_SERVICE_ROLE_KEY', provider: 'supabase', name: 'Supabase Service Role', maxAgeDays: 180, critical: true },
  { id: 'AUTHKEY_AUTHKEY', provider: 'authkey', name: 'AuthKey', maxAgeDays: 365, critical: false },
  { id: 'GITHUB_TOKEN', provider: 'github', name: 'GitHub Token', maxAgeDays: 90, critical: true },
  { id: 'FIREBASE_SERVICE_ACCOUNT_JSON', provider: 'firebase', name: 'Firebase Admin SDK', maxAgeDays: 365, critical: true },
  { id: 'VITE_FIREBASE_API_KEY', provider: 'firebase-web', name: 'Firebase Web API', maxAgeDays: 365, critical: false },
]

const VAULT = new Map() // keyId -> { lastRotation: timestamp }

/**
 * Record that a key was rotated.
 * @param {string} keyId - The env var name
 */
export function recordRotation(keyId) {
  VAULT.set(keyId, { lastRotation: Date.now() })
}

/**
 * Get key lifecycle status for all registered keys.
 * @returns {{ keys: Array, summary: Object }}
 */
export function getKeyLifecycleStatus() {
  const now = Date.now()
  const keys = KEY_REGISTRY.map(entry => {
    const vaultEntry = VAULT.get(entry.id)
    const lastRotation = vaultEntry?.lastRotation || null
    const keyExists = Boolean(process.env[entry.id])
    let ageDays = null

    if (lastRotation) {
      ageDays = Math.round((now - lastRotation) / (24 * 60 * 60 * 1000))
    }

    const overdue = ageDays !== null && ageDays > entry.maxAgeDays
    const approaching = ageDays !== null && ageDays > entry.maxAgeDays * 0.8 && !overdue

    let status = 'unknown'
    if (!keyExists) status = 'unconfigured'
    else if (overdue) status = 'overdue'
    else if (approaching) status = 'approaching'
    else if (ageDays !== null) status = 'healthy'
    else status = 'healthy' // no rotation tracked = assume healthy

    return {
      id: entry.id,
      provider: entry.provider,
      name: entry.name,
      configured: keyExists,
      status,
      lastRotation: lastRotation ? new Date(lastRotation).toISOString() : null,
      ageDays,
      maxAgeDays: entry.maxAgeDays,
      critical: entry.critical,
      recommendation: overdue
        ? `Rotação necessária! Key com ${ageDays} dias (máx: ${entry.maxAgeDays}).`
        : approaching
          ? `Rotação recomendada em breve. Key com ${ageDays} dias (máx: ${entry.maxAgeDays}).`
          : ageDays !== null
            ? `Dentro do prazo. Key com ${ageDays} dias.`
            : keyExists ? 'Chave configurada. Rotação não registrada.' : 'Não configurada.',
    }
  })

  const overdue = keys.filter(k => k.status === 'overdue')
  const approaching = keys.filter(k => k.status === 'approaching')
  const unconfigured = keys.filter(k => k.status === 'unconfigured')
  const healthy = keys.filter(k => k.status === 'healthy')

  return {
    keys,
    summary: {
      total: keys.length,
      configured: keys.filter(k => k.configured).length,
      healthy: healthy.length,
      approaching: approaching.length,
      overdue: overdue.length,
      unconfigured: unconfigured.length,
      criticalOverdue: overdue.filter(k => k.critical).length,
    },
    helpText: 'Key rotation is tracked via recordRotation(). For automated rotation, implement provider-specific API calls.',
  }
}

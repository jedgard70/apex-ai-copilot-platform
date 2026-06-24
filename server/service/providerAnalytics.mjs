/**
 * server/service/providerAnalytics.mjs
 *
 * Provider Performance Analytics — in-memory tracker for all AI provider calls.
 * Tracks: provider, model, latencyMs, success, tokensIn, tokensOut, errorMsg, timestamp.
 * Ring buffer: last 500 calls. Aggregation: per provider stats.
 */

const MAX_RECORDS = 500
const records = []

/**
 * Record a provider API call result.
 * @param {{ provider: string, model: string, latencyMs: number, success: boolean, tokensIn?: number, tokensOut?: number, errorMsg?: string }} entry
 */
export function recordCall({ provider, model, latencyMs, success, tokensIn, tokensOut, errorMsg }) {
  records.push({
    provider: String(provider || 'unknown'),
    model: String(model || 'unknown'),
    latencyMs: Number(latencyMs) || 0,
    success: Boolean(success),
    tokensIn: Number(tokensIn) || 0,
    tokensOut: Number(tokensOut) || 0,
    errorMsg: errorMsg ? String(errorMsg).slice(0, 200) : null,
    timestamp: Date.now(),
  })
  while (records.length > MAX_RECORDS) records.shift()
}

/**
 * Get aggregated analytics per provider (last N minutes).
 * @param {number} windowMinutes - lookback window in minutes (default 60)
 * @returns {{ providers: Array, summary: Object }}
 */
export function getAnalytics(windowMinutes = 60) {
  const cutoff = Date.now() - windowMinutes * 60_000
  const recent = records.filter(r => r.timestamp >= cutoff)

  const byProvider = {}
  for (const r of recent) {
    const p = r.provider
    if (!byProvider[p]) {
      byProvider[p] = {
        provider: p,
        calls: 0,
        successCalls: 0,
        failCalls: 0,
        totalLatencyMs: 0,
        totalTokensIn: 0,
        totalTokensOut: 0,
        models: new Set(),
        lastCall: 0,
        errors: [],
      }
    }
    const b = byProvider[p]
    b.calls++
    if (r.success) b.successCalls++
    else {
      b.failCalls++
      if (r.errorMsg) b.errors.push(r.errorMsg)
    }
    b.totalLatencyMs += r.latencyMs
    b.totalTokensIn += r.tokensIn
    b.totalTokensOut += r.tokensOut
    b.models.add(r.model)
    if (r.timestamp > b.lastCall) b.lastCall = r.timestamp
  }

  const providers = Object.values(byProvider).map(b => ({
    provider: b.provider,
    calls: b.calls,
    successRate: b.calls > 0 ? Math.round((b.successCalls / b.calls) * 100) : 0,
    avgLatencyMs: b.calls > 0 ? Math.round(b.totalLatencyMs / b.calls) : 0,
    totalTokensIn: b.totalTokensIn,
    totalTokensOut: b.totalTokensOut,
    modelCount: b.models.size,
    models: [...b.models].slice(0, 10),
    lastCall: b.lastCall,
    recentErrors: b.errors.slice(-5),
  })).sort((a, b) => b.calls - a.calls)

  const totalCalls = recent.length
  const totalSuccess = recent.filter(r => r.success).length
  const avgLatency = totalCalls > 0 ? Math.round(recent.reduce((s, r) => s + r.latencyMs, 0) / totalCalls) : 0

  return {
    providers,
    summary: {
      totalCalls,
      totalSuccess,
      successRate: totalCalls > 0 ? Math.round((totalSuccess / totalCalls) * 100) : 0,
      avgLatencyMs: avgLatency,
      windowMinutes,
      oldestRecord: recent.length > 0 ? Math.min(...recent.map(r => r.timestamp)) : null,
      newestRecord: recent.length > 0 ? Math.max(...recent.map(r => r.timestamp)) : null,
    },
    rawCount: records.length,
  }
}

/**
 * Clear all records (for testing/reset).
 */
export function clearAnalytics() {
  records.length = 0
}

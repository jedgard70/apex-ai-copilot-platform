/**
 * Apex AI Copilot — H22 Autonomous Upgrade Watcher (Vercel Cron Job)
 * Runs daily at 08:00 UTC. Checks npm versions, Anthropic models, Vercel status.
 * Results stored in memory (ephemeral) — surfaces via /api/cron/upgrade-status.mjs
 *
 * Vercel Cron: add to vercel.json:
 *   "crons": [{ "path": "/api/cron/upgrade-check", "schedule": "0 8 * * *" }]
 */

import { runUpgradeWatcher } from '../../server/agent/upgradeWatcher.mjs'

// In-memory cache (per serverless instance — not persistent across invocations)
// For persistence, write to Supabase or Vercel KV when configured
let lastReport = null

export default async function handler(req, res) {
  // Vercel Cron passes CRON_SECRET header for security
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const report = await runUpgradeWatcher()
    lastReport = report

    // If Supabase is configured, persist the report
    if (process.env.SUPABASE_DB_URL && process.env.SUPABASE_ACCESS_TOKEN) {
      // Future: write to apex_upgrade_watch_log table
      // For now, just log
      console.log('[upgrade-watcher] Report generated, Supabase persistence pending implementation')
    }

    return res.status(200).json({
      ok: true,
      checkedAt: report.checkedAt,
      summary: report.summary,
      packageUpdates: report.packages.filter(p => p.status === 'update_available').map(p => p.package),
      modelsAvailable: report.anthropicModels.models.filter(m => m.status !== 'current_in_use').map(m => m.id),
    })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'unknown' })
  }
}

export function getLastReport() {
  return lastReport
}

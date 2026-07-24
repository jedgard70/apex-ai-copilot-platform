/**
 * Apex AI Copilot — Vercel Cron Job
 * Triggers the upgrade watcher to look for new model versions, dependencies and platform updates.
 */

import { runUpgradeWatcher } from '../../server/agent/upgradeWatcher.mjs'

export default async function handler(req, res) {
  // Optional security check for Vercel Cron
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers['authorization']
    if (authHeader !== `Bearer ${cronSecret}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'Unauthorized' }))
    }
  }

  try {
    const report = await runUpgradeWatcher()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      success: true,
      message: 'Upgrade check executed successfully',
      report,
    }))
  } catch (error) {
    console.error('[cron/upgrade-check] Error executing upgrade watcher:', error.message)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal Server Error',
    }))
  }
}

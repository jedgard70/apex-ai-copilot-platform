/**
 * Apex AI Copilot — H11 Workspace Context Engine
 * Injects current project state into every operational response:
 * branch, changed files, last commit, local worker availability.
 */

import { readLocalWorkerHealth } from './localWorkerClient.mjs'
import { runLocalWorkerAction } from './localWorkerClient.mjs'

let _cachedContext = null
let _cacheTs = 0
const CACHE_TTL_MS = 30000

export async function collectWorkspaceContext({ force = false } = {}) {
  if (!force && _cachedContext && (Date.now() - _cacheTs) < CACHE_TTL_MS) {
    return _cachedContext
  }

  const workerConfigured = Boolean(process.env.LOCAL_WORKER_URL && process.env.LOCAL_WORKER_TOKEN)

  const ctx = {
    workerConfigured,
    workerAvailable: false,
    workerCheckpoint: null,
    branch: null,
    changedFiles: null,
    lastCommit: null,
    diffStat: null,
    collectedAt: Date.now(),
  }

  if (!workerConfigured) {
    _cachedContext = ctx
    _cacheTs = Date.now()
    return ctx
  }

  try {
    const health = await readLocalWorkerHealth()
    ctx.workerAvailable = health.ok
    ctx.workerCheckpoint = health.checkpoint || null

    if (health.ok) {
      // Collect git status
      const statusResult = await runLocalWorkerAction('project.git_status')
      if (statusResult.ok && statusResult.stdout) {
        const lines = String(statusResult.stdout).trim().split('\n').filter(Boolean)
        ctx.changedFiles = lines.length > 0 ? lines : []
      }

      // Collect branch from git log (first line has branch info)
      const logResult = await runLocalWorkerAction('project.git_log')
      if (logResult.ok && logResult.stdout) {
        ctx.lastCommit = String(logResult.stdout).trim().split('\n')[0] || null
      }
    }
  } catch (_) {
    // never throws — context is best-effort
  }

  _cachedContext = ctx
  _cacheTs = Date.now()
  return ctx
}

export function summarizeWorkspaceContext(ctx = {}) {
  if (!ctx.workerConfigured) return null
  const lines = []
  if (ctx.workerAvailable) {
    lines.push(`Local Worker: disponível (${ctx.workerCheckpoint || 'H6.0'})`)
  } else {
    lines.push('Local Worker: configurado mas não acessível')
  }
  if (ctx.changedFiles !== null) {
    lines.push(ctx.changedFiles.length
      ? `Arquivos alterados: ${ctx.changedFiles.length} (${ctx.changedFiles.slice(0, 3).join(', ')}${ctx.changedFiles.length > 3 ? '...' : ''})`
      : 'Sem alterações pendentes')
  }
  if (ctx.lastCommit) {
    lines.push(`Último commit: ${ctx.lastCommit}`)
  }
  return lines.length ? lines.join(' | ') : null
}

export function formatWorkspaceContextForReply(ctx = {}) {
  if (!ctx.workerConfigured || !ctx.workerAvailable) return ''
  const parts = []
  if (ctx.changedFiles?.length) {
    parts.push(`[${ctx.changedFiles.length} arquivo(s) alterado(s)]`)
  }
  if (ctx.lastCommit) {
    parts.push(`[último commit: ${ctx.lastCommit.slice(0, 50)}]`)
  }
  return parts.length ? `\n\n_Contexto: ${parts.join(' ')}_` : ''
}

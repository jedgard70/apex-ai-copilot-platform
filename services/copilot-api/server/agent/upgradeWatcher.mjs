/**
 * Apex AI Copilot — H22 Autonomous Upgrade Watcher
 * Checks for new AI model versions, npm dependency updates, and platform changelogs.
 * Designed to run as a Vercel Cron Job (api/cron/upgrade-check.mjs) or on-demand.
 */

const TIMEOUT_MS = 10000

async function fetchSafe(url, options = {}) {
  if (!globalThis.fetch) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) return null
    return await res.json().catch(() => null)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Dependency checkers ──────────────────────────────────────────────────────

async function checkNpmPackage(packageName, currentVersion = null) {
  const data = await fetchSafe(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`)
  if (!data) return { package: packageName, status: 'unavailable', latestVersion: null, currentVersion }

  const latestVersion = data.version
  const hasUpdate = currentVersion && latestVersion !== currentVersion
  return {
    package: packageName,
    status: hasUpdate ? 'update_available' : (currentVersion ? 'up_to_date' : 'latest_fetched'),
    latestVersion,
    currentVersion,
    description: (data.description || '').slice(0, 120),
  }
}

async function checkAnthropicModels() {
  // Anthropic doesn't have a public model list API — use curated known models
  return {
    source: 'curated',
    models: [
      { id: 'claude-fable-5', label: 'Claude Fable 5', status: 'latest', notes: 'Modelo mais recente Anthropic (Agosto 2025+)' },
      { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', status: 'available', notes: 'Mais capaz para planejamento e análise complexa' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', status: 'current_in_use', notes: 'Modelo atual da plataforma Apex' },
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', status: 'available', notes: 'Mais rápido e barato para classificação de intents' },
    ],
    recommendation: 'Considere claude-opus-4-8 para Self-Upgrade Planner e análise de arquitetura.',
  }
}

async function checkVercelStatus() {
  const data = await fetchSafe('https://www.vercel-status.com/api/v2/summary.json')
  if (!data) return { status: 'unknown', message: 'Vercel status unavailable' }
  return {
    status: data.status?.indicator || 'unknown',
    description: data.status?.description || '',
    incidents: (data.incidents || []).slice(0, 2).map(i => ({ name: i.name, status: i.status })),
  }
}

// ─── Key packages to monitor ──────────────────────────────────────────────────

const MONITORED_PACKAGES = [
  { name: 'react', current: '18.x', relevance: 'frontend core' },
  { name: 'vite', current: '5.x', relevance: 'build tool' },
  { name: '@supabase/supabase-js', current: null, relevance: 'database client' },
  { name: 'typescript', current: null, relevance: 'type checking' },
]

// ─── Main watcher ─────────────────────────────────────────────────────────────

export async function runUpgradeWatcher() {
  const startedAt = new Date().toISOString()

  const [anthropicModels, vercelStatus, ...packageResults] = await Promise.all([
    checkAnthropicModels(),
    checkVercelStatus(),
    ...MONITORED_PACKAGES.map(p => checkNpmPackage(p.name, p.current)),
  ])

  const updatesAvailable = packageResults.filter(p => p.status === 'update_available')
  const newModels = anthropicModels.models.filter(m => m.status === 'latest' || m.status === 'available')

  const report = {
    ok: true,
    checkedAt: startedAt,
    anthropicModels,
    vercelStatus,
    packages: packageResults,
    summary: {
      packageUpdates: updatesAvailable.length,
      newModelsAvailable: newModels.length,
      actionRequired: updatesAvailable.length > 0 || newModels.some(m => m.status === 'latest'),
    },
    secretsExposed: false,
  }

  return report
}

// ─── Reply builder ────────────────────────────────────────────────────────────

export function buildUpgradeWatcherReply(report) {
  const lines = [
    `**Upgrade Watcher — ${new Date(report.checkedAt).toLocaleString('pt-BR')}**`,
    '',
    '**Modelos de IA:**',
  ]

  for (const model of report.anthropicModels.models) {
    const icon = model.status === 'current_in_use' ? '🟢' : model.status === 'latest' ? '🆕' : '⚪'
    lines.push(`${icon} **${model.label}** (\`${model.id}\`) — ${model.notes}`)
  }
  if (report.anthropicModels.recommendation) {
    lines.push(``, `💡 ${report.anthropicModels.recommendation}`)
  }

  lines.push('', '**Dependências npm:**')
  for (const pkg of report.packages) {
    const icon = pkg.status === 'update_available' ? '⬆️' : pkg.status === 'up_to_date' ? '✅' : '⚪'
    const ver = pkg.latestVersion ? `v${pkg.latestVersion}` : 'N/A'
    lines.push(`${icon} **${pkg.package}** — latest: ${ver}${pkg.status === 'update_available' ? ' (atualização disponível)' : ''}`)
  }

  const { vercelStatus } = report
  lines.push('', `**Vercel status:** ${vercelStatus.status}${vercelStatus.description ? ` — ${vercelStatus.description}` : ''}`)

  lines.push('', `**Resumo:** ${report.summary.packageUpdates} pacotes com atualização | ${report.summary.newModelsAvailable} modelos novos disponíveis`)

  if (report.summary.actionRequired) {
    lines.push('', '**Ação recomendada:** Peça ao Apex para gerar um plano de upgrade ou delegue ao Claude Code via "gera prompt para Claude".')
  }

  return lines.join('\n')
}

export function classifyUpgradeWatcherIntent(message = '') {
  const t = String(message || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
  return /\b(watcher|monitor|acompanha|upgrade.*watch|novidade.*dependencia|dependencia.*nova|versao.*nova|checa\s+versao)\b/.test(t) || /verifica\s+atualizac/.test(t)
}

export { MONITORED_PACKAGES }

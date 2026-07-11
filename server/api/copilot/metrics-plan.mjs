function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

function resolveConnectorStatus() {
  const sentryFrontend = Boolean(process.env.VITE_SENTRY_DSN)
  const sentryBackend = Boolean(process.env.SENTRY_DSN)
  const vercelEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
  const isVercel = Boolean(process.env.VERCEL)

  const hasGemini = Boolean(process.env.GEMINI_API_KEY)

  return [
    `Sentry frontend: ${sentryFrontend ? 'configured' : 'not configured'}`,
    `Sentry backend: ${sentryBackend ? 'configured' : 'not configured'}`,
    `Vercel: ${isVercel ? `${vercelEnv}` : 'local dev'}`,
    `Gemini models: ${hasGemini ? 'configured' : 'not configured'}`,
    'Provider billing: not connected',
    'Push/email/SMS: not connected',
    'Playwright smoke tests: available through npm run test:e2e',
  ]
}

function createMetricsPlan(goal = '', projectSummary = null, runtimeSummary = null) {
  const modules = ['Chat', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps', 'Research', 'Export']
  const project = projectSummary && typeof projectSummary === 'object' ? projectSummary : {}
  const runtime = runtimeSummary && typeof runtimeSummary === 'object' ? runtimeSummary : {}

  return {
    providerStatus: 'LOCAL_RUNTIME_STATUS',
    apiMetrics: [
      '/api/copilot/chat',
      '/api/copilot/export-package',
      '/api/copilot/metrics-plan',
      '/api/copilot/generation-history',
      '/api/copilot/project-package',
      '/api/copilot/supply-chain-plan',
      '/api/copilot/notifications-plan',
      '/api/copilot/digital-twin-plan',
      '/api/copilot/multitenant-plan',
      '/api/copilot/pwa-plan',
    ].map(endpoint => ({ endpoint, health: 'reachable in shared runtime', source: 'VERCEL_SERVERLESS' })),
    moduleUsage: modules.map((module, index) => ({ module, activity: index === 0 ? 1 : 0, source: 'ESTIMATED_LOCAL' })),
    projectActivity: [
      `Project: ${String(project.name || 'Apex Project')}`,
      `Files: ${Number(project.files || 0)} · Messages: ${Number(project.messages || 0)} · Exports: ${Number(project.exports || 0)}`,
      `Active studio: ${String(project.activeStudio || 'none')}`,
      `Generation history: ${Number(project.generationHistory || 0)} run(s)`,
    ],
    connectorStatus: resolveConnectorStatus(),
    runtimeStatus: [
      `Model: ${String(runtime.selectedModel || 'unknown')}`,
      `Model state: ${String(runtime.modelState || 'ready')}`,
      `Last response mode: ${String(runtime.lastResponseMode || 'n/a')}`,
      `Persistence: ${String(runtime.persistenceMode || 'localStorage')}`,
    ],
    metricsReport: `Platform status for: ${goal || 'Apex platform'}. Project=${String(project.name || 'Apex Project')} | Model=${String(runtime.selectedModel || 'unknown')} | State=${String(runtime.modelState || 'ready')}.`,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'LOCAL_RUNTIME_STATUS' })
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    return sendJson(res, 200, {
      plan: createMetricsPlan(
        String(body.goal || ''),
        body.projectSummary || null,
        body.runtimeSummary || null,
      ),
    })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'metrics_plan_failed', providerStatus: 'LOCAL_RUNTIME_STATUS' })
  }
}

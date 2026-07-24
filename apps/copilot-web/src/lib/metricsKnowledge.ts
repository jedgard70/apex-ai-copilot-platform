export type MetricsPlan = {
  providerStatus: string
  apiMetrics: { endpoint: string; health: string; source: 'LOCAL_DEMO' | 'ESTIMATED_LOCAL' }[]
  moduleUsage: { module: string; activity: number; source: 'ESTIMATED_LOCAL' }[]
  projectActivity: string[]
  connectorStatus: string[]
  runtimeStatus: string[]
  metricsReport: string
}

export function isMetricsIntent(text: string) {
  return /\b(m[eé]tricas|metricas|dashboard de m[eé]tricas|metrics dashboard|observabilidade|health check|endpoint health|module usage|api metrics|status da plataforma|status geral da plataforma|painel da plataforma|platform status|status geral|painel geral)\b/i.test(text)
}

export function createMetricsPlan(goal = ''): MetricsPlan {
  const modules = ['Chat', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps', 'Research', 'Export']
  return {
    providerStatus: 'LOCAL_DEMO',
    apiMetrics: ['/api/copilot/chat', '/api/copilot/export-package', '/api/copilot/metrics-plan'].map(endpoint => ({ endpoint, health: 'not production monitored', source: 'LOCAL_DEMO' })),
    moduleUsage: modules.map((module, index) => ({ module, activity: index === 0 ? 1 : 0, source: 'ESTIMATED_LOCAL' })),
    projectActivity: ['Local project state can count files, messages, exports and active panels.', 'No production telemetry source is connected.'],
    connectorStatus: ['Supabase: not connected', 'Vercel telemetry: not connected', 'Provider billing: not connected', 'Push/email/SMS: not connected'],
    runtimeStatus: ['Chat runtime ready', 'No real-time external telemetry connected yet'],
    metricsReport: `Metrics dashboard local demo for: ${goal || 'Apex platform'}. No fake production telemetry.`,
  }
}

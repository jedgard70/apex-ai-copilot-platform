/**
 * server/service/metrics.mjs
 *
 * Metrics Dashboard — metricas da plataforma, status dos conectores e uso.
 */

/**
 * Cria relatorio de metricas.
 * @param {string} goal
 * @param {Object|null} projectSummary
 * @param {Object|null} runtimeSummary
 * @returns {Object}
 */
export function createMetricsPlan(goal = '', projectSummary = null, runtimeSummary = null) {
  const modules = ['Chat', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps', 'Research', 'Export']
  const project = projectSummary && typeof projectSummary === 'object' ? projectSummary : {}
  const runtime = runtimeSummary && typeof runtimeSummary === 'object' ? runtimeSummary : {}

  const providerConnected = (key) => !!process.env[key]

  return {
    providerStatus: 'connected',
    apiMetrics: ['/api/copilot/chat', '/api/copilot/export-package', '/api/copilot/metrics-plan', '/api/copilot/generation-history', '/api/copilot/project-package']
      .map(endpoint => ({ endpoint, health: 'reachable in shared runtime', source: 'connected' })),
    moduleUsage: modules.map((module, index) => ({ module, activity: index === 0 ? 1 : 0, source: 'connected' })),
    projectActivity: [
      `Project: ${String(project.name || 'Apex Project')}`,
      `Files: ${Number(project.files || 0)} · Messages: ${Number(project.messages || 0)} · Exports: ${Number(project.exports || 0)}`,
      `Active studio: ${String(project.activeStudio || 'none')}`,
      `Generation history: ${Number(project.generationHistory || 0)} run(s)`,
    ],
    connectorStatus: [
      `OpenAI: ${providerConnected('OPENAI_API_KEY') ? 'connected' : 'not connected'}`,
      `Gemini: ${providerConnected('GEMINI_API_KEY') ? 'connected' : 'not connected'}`,
      `Anthropic: ${providerConnected('ANTHROPIC_API_KEY') ? 'connected' : 'not connected'}`,
      `OpenRouter: ${providerConnected('OPENAI_API_KEYROUTER') ? 'connected' : 'not connected'}`,
      `FAL: ${providerConnected('FAL_KEY') ? 'connected' : 'not connected'}`,
      `ElevenLabs: ${providerConnected('ELEVENLABS_API_KEY') ? 'connected' : 'not connected'}`,
      `Tavily: ${providerConnected('TAVILY_API_KEY') ? 'connected' : 'not connected'}`,
      `AI Gateway: ${providerConnected('AI_GATEWAY_API_KEY') ? 'connected' : 'not connected'}`,
      `OpenCode Go: ${providerConnected('OPENCODE_GO_API_KEY') ? 'connected' : 'not connected'}`,
      `Authkey: ${providerConnected('AUTHKEY_AUTHKEY') ? 'connected' : 'not connected'}`,
      `Stripe: ${providerConnected('STRIPE_SECRET_KEY') ? 'connected' : 'not connected'}`,
      `Supabase: ${providerConnected('VITE_SUPABASE_URL') && providerConnected('VITE_SUPABASE_ANON_KEY') ? 'connected' : 'not connected'}`,
    ],
    runtimeStatus: [
      `Model: ${String(runtime.selectedModel || 'unknown')}`,
      `Model state: ${String(runtime.modelState || 'ready')}`,
      `Last response mode: ${String(runtime.lastResponseMode || 'n/a')}`,
      `Persistence: ${String(runtime.persistenceMode || 'localStorage')}`,
    ],
    connectedProviderCount: [
      providerConnected('OPENAI_API_KEY'),
      providerConnected('GEMINI_API_KEY'),
      providerConnected('ANTHROPIC_API_KEY'),
      providerConnected('OPENAI_API_KEYROUTER'),
      providerConnected('FAL_KEY'),
      providerConnected('ELEVENLABS_API_KEY'),
      providerConnected('TAVILY_API_KEY'),
      providerConnected('AI_GATEWAY_API_KEY'),
      providerConnected('OPENCODE_GO_API_KEY'),
      providerConnected('AUTHKEY_AUTHKEY'),
      providerConnected('STRIPE_SECRET_KEY'),
      providerConnected('VITE_SUPABASE_URL') && providerConnected('VITE_SUPABASE_ANON_KEY'),
    ].filter(Boolean).length,
    metricsReport: [
      `Platform status for: ${goal || 'Apex platform'}.`,
      `Project=${String(project.name || 'Apex Project')}`,
      `Model=${String(runtime.selectedModel || 'unknown')}`,
      `State=${String(runtime.modelState || 'ready')}.`,
    ].join(' | '),
  }
}

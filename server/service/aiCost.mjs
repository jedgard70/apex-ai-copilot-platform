/**
 * server/service/aiCost.mjs
 *
 * AI Cost Dashboard — estimativas locais de uso/custo de IA.
 */

/**
 * Cria plano de custos de IA.
 * @param {string} goal
 * @returns {Object}
 */
export function createAiCostPlan(goal = '') {
  const now = new Date().toISOString()
  const modules = ['Chat', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps', 'Research', 'Skill Update', 'Export']
  const moduleBreakdown = modules.map(module => ({
    id: `ai-cost-${module.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    module,
    requestCount: module === 'Chat' ? 1 : 0,
    estimatedTokens: module === 'Chat' ? 1200 : 0,
    estimatedCost: module === 'Chat' ? 0.01 : 0,
    model: 'unknown / local estimate',
    timestamp: now,
    userProject: goal || 'Apex Project',
    sourceConfidence: 'ESTIMATED_LOCAL',
  }))
  const totalRequests = moduleBreakdown.reduce((sum, item) => sum + item.requestCount, 0)
  const totalEstimatedTokens = moduleBreakdown.reduce((sum, item) => sum + item.estimatedTokens, 0)
  const totalEstimatedCost = Number(moduleBreakdown.reduce((sum, item) => sum + item.estimatedCost, 0).toFixed(4))
  return {
    providerStatus: 'connected',
    usageSummary: {
      totalRequests,
      totalEstimatedTokens,
      totalEstimatedCost,
      sourceConfidence: 'ESTIMATED_LOCAL',
      warning: 'No provider billing API is connected. These values are local estimates, not invoice-accurate billing.',
    },
    moduleBreakdown,
    costWarnings: [
      'No fake OpenAI billing: provider billing source is not connected.',
      'Use ESTIMATED_LOCAL until real usage/billing API is connected.',
      'Set local threshold alerts only; push/email connectors are not connected.',
    ],
    message: 'AI Cost Dashboard generated an estimated-local observability draft. It is not provider billing.',
  }
}

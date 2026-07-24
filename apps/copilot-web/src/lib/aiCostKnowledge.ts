export type AiCostSourceConfidence = 'ESTIMATED_LOCAL' | 'USER_ENTERED' | 'PROVIDER_BILLING_SOURCE'

export type AiCostRecord = {
  id: string
  module: string
  requestCount: number
  estimatedTokens: number
  estimatedCost: number
  model: string
  timestamp: string
  userProject: string
  sourceConfidence: AiCostSourceConfidence
}

export type AiCostPlan = {
  providerStatus: 'estimated-local'
  usageSummary: {
    totalRequests: number
    totalEstimatedTokens: number
    totalEstimatedCost: number
    sourceConfidence: AiCostSourceConfidence
    warning: string
  }
  moduleBreakdown: AiCostRecord[]
  costWarnings: string[]
  message: string
}

export const aiCostModules = [
  'Chat',
  'ArchVis',
  'DirectCut',
  'BIM/3D',
  'Budget',
  'Contracts',
  'FieldOps',
  'Research',
  'Skill Update',
  'Export',
]

export function isAiCostIntent(text: string) {
  return /\b(custo de ia|gasto com ia|tokens?|observabilidade|custo openai|openai cost|ai cost|custo por m[oó]dulo|uso de modelo|model usage|billing|usage dashboard)\b/i.test(text)
}

export function createLocalAiCostPlan(goal: string): AiCostPlan {
  const now = new Date().toISOString()
  const moduleBreakdown: AiCostRecord[] = aiCostModules.map((module, index) => ({
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
    providerStatus: 'estimated-local',
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

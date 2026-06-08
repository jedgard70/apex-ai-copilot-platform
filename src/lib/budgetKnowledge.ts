export type BudgetConfidence = 'CONFIRMED' | 'ESTIMATED' | 'UNKNOWN'
export type BudgetSource = 'drawing' | 'user input' | 'BIM metadata' | 'assumption'
export type BudgetStandard = 'economical' | 'medium' | 'high-end' | 'luxury'
export type BudgetCurrency = 'USD' | 'BRL' | 'EUR'
export type BudgetUnitSystem = 'metric' | 'imperial'

export type BudgetAssumptions = {
  projectType: string
  area: string
  location: string
  standardLevel: BudgetStandard
  currency: BudgetCurrency
  unitSystem: BudgetUnitSystem
}

export type BudgetEstimateItem = {
  id: string
  section: string
  item: string
  unit: string
  quantity: number
  unitPrice: number
  subtotal: number
  confidence: BudgetConfidence
  source: BudgetSource
}

export type BudgetPlan = {
  providerStatus: 'planning-only' | 'estimate-draft'
  assumptions: BudgetAssumptions
  estimateItems: BudgetEstimateItem[]
  scopeIncluded: string[]
  scopeExcluded: string[]
  ownerSupplied: string[]
  pendingQuestions: string[]
  proposalDraft: string
  confidenceSummary: string
  message: string
}

export const quantitySections = [
  'masonry/walls',
  'flooring',
  'ceiling',
  'painting',
  'doors/windows',
  'electrical',
  'plumbing',
  'HVAC',
  'finishes',
  'landscaping',
  'pool/gourmet/external areas',
]

export const budgetConfidenceCopy: Record<BudgetConfidence, string> = {
  CONFIRMED: 'Confirmed by parsed data or explicit user input.',
  ESTIMATED: 'Preliminary estimate from drawing/context assumptions.',
  UNKNOWN: 'Not enough data yet; requires scale, area, BIM parse or user input.',
}

export const defaultBudgetAssumptions: BudgetAssumptions = {
  projectType: 'Residential construction / renovation',
  area: '',
  location: '',
  standardLevel: 'medium',
  currency: 'USD',
  unitSystem: 'metric',
}

export function budgetIntentKeywords() {
  return [
    'orçamento',
    'orcamento',
    'quantitativo',
    'estimativa',
    'materiais',
    'proposta',
    'quanto custa',
    'custo de obra',
    'memorial de compra',
    'budget',
    'estimate',
    'quantity',
    'takeoff',
    'materials',
    'proposal',
    'construction cost',
  ]
}

export function calculateSubtotal(quantity: number, unitPrice: number) {
  return Number((Number(quantity || 0) * Number(unitPrice || 0)).toFixed(2))
}

export function formatMoney(value: number, currency: BudgetCurrency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}


import { SourceConfidence, SourceEvidence } from './sourceConfidence'

export type ResearchType =
  | 'Market research'
  | 'Competitor analysis'
  | 'Product/service benchmarking'
  | 'Pricing research'
  | 'Construction cost source'
  | 'SINAPI lookup/check'
  | 'Sales proposal support'
  | 'Regulatory/permit source check'

export type ResearchFinding = {
  id: string
  claim: string
  evidence: string
  confidence: SourceConfidence
  source: string
  date: string
}

export type SinapiSourceStatus = 'not-connected' | 'user-uploaded-table' | 'connected-api'

export type ResearchPlan = {
  providerStatus: 'web-not-connected' | 'research-draft' | 'web-search-live'
  researchType: ResearchType
  query: string
  region: string
  freshness: string
  sinapiStatus: SinapiSourceStatus
  sources: SourceEvidence[]
  findings: ResearchFinding[]
  proposalBuilder: {
    executiveSummary: string
    marketOpportunity: string
    clientPainPoints: string[]
    valueProposition: string
    competitivePositioning: string
    pricingAssumptions: string[]
    recommendedOffer: string
    ctaNextStep: string
  }
  pendingVerification: string[]
  message: string
}

export const researchTypes: ResearchType[] = [
  'Market research',
  'Competitor analysis',
  'Product/service benchmarking',
  'Pricing research',
  'Construction cost source',
  'SINAPI lookup/check',
  'Sales proposal support',
  'Regulatory/permit source check',
]

export const sourceConfidenceOptions: SourceConfidence[] = [
  'CONFIRMED_SOURCE',
  'USER_PROVIDED',
  'ASSUMPTION',
  'PLACEHOLDER',
  'NEEDS_WEB_VERIFICATION',
]

export type ContractEvidence = 'CONFIRMED' | 'ASSUMPTION' | 'UNKNOWN' | 'NEEDS LAWYER REVIEW'
export type ContractSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type ContractStatus = 'Open' | 'In Review' | 'Resolved'
export type ContractDocumentType =
  | 'Contract'
  | 'Proposal'
  | 'Memorial descritivo'
  | 'Permit checklist'
  | 'Compliance checklist'
  | 'Scope agreement'
  | 'Addendum'
  | 'Other'

export type ContractReviewMode =
  | 'Draft'
  | 'Risk review'
  | 'Compliance checklist'
  | 'Client-facing version'
  | 'Owner protection'
  | 'Contractor protection'

export type ContractContext = {
  documentType: ContractDocumentType
  projectName: string
  parties: string
  location: string
  language: string
  reviewMode: ContractReviewMode
}

export type ContractRiskItem = {
  id: string
  clause: string
  issue: string
  severity: ContractSeverity
  evidence: ContractEvidence
  recommendation: string
  ownerAction: string
  status: ContractStatus
}

export type PermitChecklistItem = {
  id: string
  category: string
  requirement: string
  evidence: ContractEvidence
  status: ContractStatus
}

export type ContractsPlan = {
  providerStatus: 'planning-only' | 'review-draft'
  documentSummary: string
  detectedDocumentType: ContractDocumentType
  jurisdictionStatus: ContractEvidence
  riskItems: ContractRiskItem[]
  permitChecklist: PermitChecklistItem[]
  scopeDraft: {
    servicesIncluded: string[]
    materialsSpecs: string[]
    exclusions: string[]
    ownerSuppliedItems: string[]
    qualityStandards: string[]
    deliverables: string[]
    changeOrderRules: string[]
    acceptanceCriteria: string[]
  }
  contractDraft: string
  clientFacingSummary: string
  lawyerReviewSummary: string
  pendingQuestions: string[]
  message: string
}

export const contractDocumentTypes: ContractDocumentType[] = [
  'Contract',
  'Proposal',
  'Memorial descritivo',
  'Permit checklist',
  'Compliance checklist',
  'Scope agreement',
  'Addendum',
  'Other',
]

export const contractReviewModes: ContractReviewMode[] = [
  'Draft',
  'Risk review',
  'Compliance checklist',
  'Client-facing version',
  'Owner protection',
  'Contractor protection',
]

export const permitCategories = [
  'zoning / land use',
  'building permit',
  'fire safety',
  'accessibility',
  'environmental',
  'HOA / condominium',
  'utility connections',
  'occupancy / habite-se',
  'engineering responsibility / ART/RRT equivalent',
  'local authority documents',
  'insurance / bonds if applicable',
]

export const legalDisclaimer =
  'Apex AI Copilot is not a lawyer and does not provide licensed legal advice. Use this as drafting, risk triage and checklist support, then send high-risk or jurisdiction-specific items to a qualified lawyer/local authority.'

export function emptyContractsPlan(context: ContractContext): ContractsPlan {
  return {
    providerStatus: 'planning-only',
    documentSummary: 'No review generated yet.',
    detectedDocumentType: context.documentType,
    jurisdictionStatus: context.location ? 'ASSUMPTION' : 'UNKNOWN',
    riskItems: [],
    permitChecklist: [],
    scopeDraft: {
      servicesIncluded: [],
      materialsSpecs: [],
      exclusions: [],
      ownerSuppliedItems: [],
      qualityStandards: [],
      deliverables: [],
      changeOrderRules: [],
      acceptanceCriteria: [],
    },
    contractDraft: '',
    clientFacingSummary: '',
    lawyerReviewSummary: '',
    pendingQuestions: ['Generate a review/draft first.'],
    message: legalDisclaimer,
  }
}


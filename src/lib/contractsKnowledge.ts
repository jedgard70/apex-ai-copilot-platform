import { SourceConfidence } from './sourceConfidence'

export type ContractEvidence = 'CONFIRMED' | 'ASSUMPTION' | 'UNKNOWN' | 'NEEDS LAWYER REVIEW'
export type PermitEvidence = 'CONFIRMED_SOURCE' | 'GENERAL_GUIDANCE' | 'UNKNOWN' | 'NEEDS_LOCAL_AUTHORITY'
export type ContractSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type ContractStatus = 'Open' | 'In Review' | 'Resolved'
export type PermitRegion = 'US' | 'EU' | 'UK' | 'Brazil' | 'Other'
export type PermitDocumentStatus = 'Not started' | 'Drafting' | 'Submitted' | 'Approved' | 'Rejected' | 'Needs revision'
export type PermitResponsibleParty = 'owner-provided' | 'architect/engineer-provided' | 'contractor-provided' | 'authority-provided' | 'Apex-prepared'
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
  region: PermitRegion
  country: string
  stateProvince: string
  cityMunicipality: string
  ahjLocalAuthority: string
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
  evidence: ContractEvidence | PermitEvidence
  status: ContractStatus
}

export type PermitPackageDocument = {
  id: string
  documentName: string
  group: 'required documents' | 'optional documents' | 'unknown until jurisdiction verified'
  responsibleParty: PermitResponsibleParty
  status: PermitDocumentStatus
  evidenceLevel: PermitEvidence
  dueDate: string
  notes: string
  sourceLink: string
}

export type ContractsPlan = {
  providerStatus: 'ready' | 'review-draft'
  documentSummary: string
  detectedDocumentType: ContractDocumentType
  jurisdictionStatus: ContractEvidence
  sourceConfidence: SourceConfidence
  needsVerification: boolean
  riskItems: ContractRiskItem[]
  permitChecklist: PermitChecklistItem[]
  permitPackage: PermitPackageDocument[]
  packageOutputs: {
    usPermitPackageChecklist: string
    euPermitPackageChecklist: string
    ahjInquiryEmailDraft: string
    architectEngineerDocumentRequestList: string
    ownerDocumentRequestList: string
    contractorComplianceChecklist: string
    permitSubmissionCoverLetter: string
    revisionResponseLetter: string
    missingDocumentsReport: string
  }
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

export const permitRegions: PermitRegion[] = ['US', 'EU', 'UK', 'Brazil', 'Other']

export const permitDocumentStatuses: PermitDocumentStatus[] = [
  'Not started',
  'Drafting',
  'Submitted',
  'Approved',
  'Rejected',
  'Needs revision',
]

export const permitEvidenceLevels: PermitEvidence[] = [
  'CONFIRMED_SOURCE',
  'GENERAL_GUIDANCE',
  'UNKNOWN',
  'NEEDS_LOCAL_AUTHORITY',
]

export const legalDisclaimer =
  'Apex AI Copilot is not a lawyer and does not provide licensed legal advice. Use this as drafting, risk triage and checklist support, then send high-risk or jurisdiction-specific items to a qualified lawyer/local authority.'

export function emptyContractsPlan(context: ContractContext): ContractsPlan {
  return {
    providerStatus: 'ready',
    documentSummary: 'No review generated yet.',
    detectedDocumentType: context.documentType,
    jurisdictionStatus: context.location ? 'ASSUMPTION' : 'UNKNOWN',
    sourceConfidence: 'NEEDS_WEB_VERIFICATION',
    needsVerification: true,
    riskItems: [],
    permitChecklist: [],
    permitPackage: [],
    packageOutputs: {
      usPermitPackageChecklist: '',
      euPermitPackageChecklist: '',
      ahjInquiryEmailDraft: '',
      architectEngineerDocumentRequestList: '',
      ownerDocumentRequestList: '',
      contractorComplianceChecklist: '',
      permitSubmissionCoverLetter: '',
      revisionResponseLetter: '',
      missingDocumentsReport: '',
    },
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

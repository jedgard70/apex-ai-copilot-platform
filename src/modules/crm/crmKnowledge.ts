import { BusinessCurrency, localDemoModeNotice, paymentConnectorNotice } from '../../lib/saasBusinessModel'

export type PipelineStage =
  | 'New Lead'
  | 'Qualified'
  | 'Discovery'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'On Hold'

export type CrmStatus = 'New' | 'Active' | 'Waiting follow-up' | 'Won' | 'Lost' | 'On Hold'

export type CrmLead = {
  id: string
  name: string
  company: string
  source: string
  status: CrmStatus
  notes: string
  assignedOwner: string
  expectedValue: number
  currency: BusinessCurrency
  probability: number
  nextAction: string
}

export type CrmContact = {
  id: string
  name: string
  company: string
  role: string
  email: string
  phone: string
  notes: string
}

export type CrmOpportunity = {
  id: string
  title: string
  company: string
  stage: PipelineStage
  expectedValue: number
  currency: BusinessCurrency
  probability: number
  proposalLink: string
  followUpTask: string
  nextAction: string
}

export type ServiceCatalogItem = {
  id: string
  name: string
  category: 'ArchVis' | 'BIM/Revit' | 'DirectCut' | 'Budget' | 'Contracts/Permits' | 'FieldOps' | 'SaaS'
  description: string
  deliverables: string[]
  priceConfidence: 'PLACEHOLDER' | 'USER_PROVIDED' | 'CONFIRMED_SOURCE'
}

export type PricingTier = {
  id: string
  name: string
  modules: string[]
  limits: string[]
  suggestedPricePlaceholder: string
  sourceConfidence: 'PLACEHOLDER'
}

export type ProposalPackage = {
  title: string
  executiveSummary: string
  serviceScope: string[]
  quotePackages: string[]
  pricingTiers: PricingTier[]
  salesScript: string
  emailDraft: string
  followUpSequence: string[]
  objectionHandling: string[]
  clientPresentationPackage: string[]
  internationalPositioning: string
}

export const pipelineStages: PipelineStage[] = [
  'New Lead',
  'Qualified',
  'Discovery',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'On Hold',
]

export const businessCurrencies: BusinessCurrency[] = ['BRL', 'USD', 'EUR']

export const serviceCatalogDefaults: ServiceCatalogItem[] = [
  {
    id: 'svc-archvis',
    name: 'ArchVis / Humanized Plan Package',
    category: 'ArchVis',
    description: 'Humanized floor plan, render prompt, sales image direction and presentation assets.',
    deliverables: ['Humanized plan prompt', 'render briefing', 'sales copy', 'image-generation-ready request'],
    priceConfidence: 'PLACEHOLDER',
  },
  {
    id: 'svc-bim-revit',
    name: 'BIM / Revit Production Package',
    category: 'BIM/Revit',
    description: 'Revit modeling, IFC workflow, coordination review and documentation support.',
    deliverables: ['BIM model scope', 'coordination checklist', 'export plan', 'technical report'],
    priceConfidence: 'PLACEHOLDER',
  },
  {
    id: 'svc-permit-docs',
    name: 'Permit Set / Construction Documentation',
    category: 'Contracts/Permits',
    description: 'US/EU permit package support, document checklist and submission-ready organization.',
    deliverables: ['permit checklist', 'document tracker', 'scope/memorial draft', 'AHJ inquiry draft'],
    priceConfidence: 'PLACEHOLDER',
  },
  {
    id: 'svc-video',
    name: 'DirectCut Sales Video Package',
    category: 'DirectCut',
    description: 'Video plan, storyboard, narration and generator prompt for project sales material.',
    deliverables: ['shot list', 'storyboard', 'script', 'video generation prompt'],
    priceConfidence: 'PLACEHOLDER',
  },
  {
    id: 'svc-saas',
    name: 'Apex AI/BIM Operations Setup',
    category: 'SaaS',
    description: 'Client workspace, workflow setup and AI-assisted project operations package.',
    deliverables: ['workspace setup plan', 'module map', 'role matrix', 'export package'],
    priceConfidence: 'PLACEHOLDER',
  },
]

export const pricingTierDefaults: PricingTier[] = [
  {
    id: 'tier-starter',
    name: 'Starter',
    modules: ['Client Workspace', 'Apex Copilot', 'basic file uploads', 'project outputs'],
    limits: ['limited projects', 'limited exports', 'no payment connector'],
    suggestedPricePlaceholder: 'Placeholder price — verify market/source before publishing.',
    sourceConfidence: 'PLACEHOLDER',
  },
  {
    id: 'tier-pro',
    name: 'Pro',
    modules: ['ArchVis', 'DirectCut', 'Budget', 'Project Workspace', 'exports'],
    limits: ['medium usage', 'connector limits TBD'],
    suggestedPricePlaceholder: 'Placeholder price — verify market/source before publishing.',
    sourceConfidence: 'PLACEHOLDER',
  },
  {
    id: 'tier-business',
    name: 'Business',
    modules: ['CRM', 'Finance', 'Contracts', 'FieldOps', 'Client Dashboard', 'Admin Dashboard'],
    limits: ['team/client limits TBD after auth/database approval'],
    suggestedPricePlaceholder: 'Placeholder price — verify market/source before publishing.',
    sourceConfidence: 'PLACEHOLDER',
  },
]

import { BusinessCurrency, localDemoModeNotice, paymentConnectorNotice } from './saasBusinessModel'

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
export type PaymentStatus = 'Draft' | 'Not sent' | 'Sent placeholder' | 'Partially paid' | 'Paid unverified' | 'Overdue placeholder' | 'Canceled'
export type AccountingEvidence = 'USER_ENTERED' | 'SYSTEM_GENERATED' | 'IMPORTED_DOCUMENT' | 'UNKNOWN' | 'NEEDS_ACCOUNTANT_REVIEW'

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

export type InvoiceRecord = {
  id: string
  client: string
  project: string
  amount: number
  currency: BusinessCurrency
  status: PaymentStatus
  dueDate: string
  source: 'local placeholder' | 'user entered' | 'payment connector'
}

export type ExpenseRecord = {
  id: string
  project: string
  category: string
  amount: number
  currency: BusinessCurrency
  status: 'Draft' | 'User entered' | 'Verified externally'
  taxCategory?: string
  costCenter?: string
  evidence?: AccountingEvidence
}

export type PaymentRecord = {
  id: string
  invoiceId: string
  amount: number
  currency: BusinessCurrency
  status: 'UNKNOWN' | 'USER_ENTERED' | 'IMPORTED_DOCUMENT' | 'CONNECTOR_CONFIRMED'
  evidence: AccountingEvidence
}

export type FinanceSummary = {
  currency: BusinessCurrency
  revenueSummary: string
  clientBalance: string
  accountsReceivable: string
  projectCostProfit: string
  paymentConnectorStatus: 'not-connected'
  warnings: string[]
}

export type AccountingLedgerRecord = {
  id: string
  type: 'revenue' | 'expense' | 'invoice' | 'payment' | 'accounts receivable' | 'accounts payable'
  date: string
  description: string
  clientOrSupplier: string
  amount: number
  currency: BusinessCurrency
  taxCategory: string
  costCenter: string
  evidence: AccountingEvidence
  documentAttachment?: {
    fileName: string
    mimeType: string
    size: number
  }
}

export type AccountingPackage = {
  chartOfAccountsPlaceholder: string[]
  ledger: AccountingLedgerRecord[]
  monthlyAccountingSummary: string
  monthlyRevenueReport: string
  monthlyExpenseReport: string
  invoicesSummary: string
  paymentsSummary: string
  accountsReceivableReport: string
  accountsPayableReport: string
  projectProfitLossReport: string
  taxPreparationChecklist: string[]
  documentsPendingForAccountant: string[]
  accountantHandoffPackage: string
  reviewNotice: string
}

export type BusinessPlan = {
  providerStatus: 'local-demo' | 'supabase-connected'
  modeNotice: string
  authStatus: 'not-connected' | 'pending'
  databaseStatus: 'not-connected' | 'connected'
  paymentProviderStatus: 'not-connected'
  crm: {
    pipelineStages: PipelineStage[]
    leads: CrmLead[]
    contacts: CrmContact[]
    companies: string[]
    opportunities: CrmOpportunity[]
    followUpTasks: string[]
    recommendations: string[]
  }
  sales: ProposalPackage
  finance: {
    invoices: InvoiceRecord[]
    payments: PaymentRecord[]
    expenses: ExpenseRecord[]
    summary: FinanceSummary
    accounting: AccountingPackage
  }
  warnings: string[]
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

export const accountingEvidenceLevels: AccountingEvidence[] = [
  'USER_ENTERED',
  'SYSTEM_GENERATED',
  'IMPORTED_DOCUMENT',
  'UNKNOWN',
  'NEEDS_ACCOUNTANT_REVIEW',
]

export const chartOfAccountsPlaceholder = [
  'Service revenue',
  'SaaS subscription revenue',
  'BIM/Revit production revenue',
  'ArchVis/render revenue',
  'DirectCut/video revenue',
  'Contractor/subcontractor expense',
  'Software/tools expense',
  'Marketing/sales expense',
  'Taxes payable placeholder',
  'Accounts receivable',
  'Accounts payable',
]

export function createBusinessPlan(goal = 'Business layer setup', currency: BusinessCurrency = 'USD'): BusinessPlan {
  return {
    providerStatus: 'supabase-connected',
    modeNotice: localDemoModeNotice,
    authStatus: 'pending',
    databaseStatus: 'connected',
    paymentProviderStatus: 'not-connected',
    crm: {
      pipelineStages,
      leads: [
        {
          id: 'lead-local-demo',
          name: 'New client lead',
          company: 'Client company',
          source: 'Manual',
          status: 'New',
          notes: goal,
          assignedOwner: 'Owner/Admin',
          expectedValue: 0,
          currency,
          probability: 0,
          nextAction: 'Qualify need, project type, budget range, location and decision timeline.',
        },
      ],
      contacts: [
        {
          id: 'contact-local-demo',
          name: 'Client contact',
          company: 'Client company',
          role: 'Decision maker',
          email: 'not connected',
          phone: 'not connected',
          notes: 'Local scaffold only. No real CRM database is connected.',
        },
      ],
      companies: ['Client company'],
      opportunities: [
        {
          id: 'opportunity-local-demo',
          title: 'Apex service opportunity',
          company: 'Client company',
          stage: 'New Lead',
          expectedValue: 0,
          currency,
          probability: 0,
          proposalLink: 'Not generated yet',
          followUpTask: 'Prepare discovery questions and proposal package.',
          nextAction: 'Build proposal with scope, deliverables, assumptions and next meeting CTA.',
        },
      ],
      followUpTasks: [
        'Confirm client objective and project location.',
        'Collect files, scope and deadline.',
        'Prepare proposal package and presentation assets.',
        'Schedule follow-up after proposal review.',
      ],
      recommendations: [
        'Keep CRM data local until real database/auth is approved.',
        'Separate client-visible project data from internal/admin data.',
        'Use Research Studio before publishing market-based pricing.',
      ],
    },
    sales: {
      title: 'Apex commercial proposal package',
      executiveSummary: 'Apex can organize project intake, production modules and client deliverables into a clear proposal package. Pricing remains placeholder until user-provided or source-verified.',
      serviceScope: [
        'Client intake and file review',
        'Apex Copilot project guidance',
        'Selected production module outputs',
        'Project workspace/export package',
      ],
      quotePackages: [
        'Starter: project intake and basic output package',
        'Pro: ArchVis/DirectCut/Budget production package',
        'Business: client workspace, CRM and finance workflow package',
        'Offshore Production Partner: US/EU BIM/Revit/permit documentation support',
      ],
      pricingTiers: pricingTierDefaults,
      salesScript: 'Lead with the client outcome, show the project workflow, define deliverables, label assumptions, then close with the next practical action.',
      emailDraft: 'Hi [Client], I prepared an Apex workflow for your project with intake, deliverables, timeline assumptions and next steps. I can send the package for review and adjust scope after your feedback.',
      followUpSequence: ['Day 1: send proposal package', 'Day 3: clarify scope/questions', 'Day 7: confirm decision path', 'Day 14: offer revised package or close as on hold'],
      objectionHandling: [
        'If price is high: separate must-have deliverables from optional add-ons.',
        'If timing is uncertain: propose a discovery/preflight package first.',
        'If trust is low: show sample outputs and source-confidence labels.',
      ],
      clientPresentationPackage: ['project problem', 'Apex workflow', 'deliverables', 'timeline assumptions', 'investment placeholder', 'next action'],
      internationalPositioning: 'For US/EU clients, position Apex as an offshore BIM/CAD/Revit and permit documentation production partner first, with AI-powered delivery as leverage.',
    },
    finance: {
      invoices: [
        {
          id: 'invoice-local-placeholder',
          client: 'Client company',
          project: 'Client project',
          amount: 0,
          currency,
          status: 'Draft',
          dueDate: '',
          source: 'local placeholder',
        },
      ],
      payments: [
        {
          id: 'payment-local-placeholder',
          invoiceId: 'invoice-local-placeholder',
          amount: 0,
          currency,
          status: 'UNKNOWN',
          evidence: 'UNKNOWN',
        },
      ],
      expenses: [
        {
          id: 'expense-local-placeholder',
          project: 'Client project',
          category: 'Production cost placeholder',
          amount: 0,
          currency,
          status: 'Draft',
          taxCategory: 'NEEDS_ACCOUNTANT_REVIEW',
          costCenter: 'Client project',
          evidence: 'SYSTEM_GENERATED',
        },
      ],
      summary: {
        currency,
        revenueSummary: 'No real revenue connected. Enter values manually or connect a finance/payment provider later.',
        clientBalance: 'Unknown until invoices/payments are user-entered or provider-connected.',
        accountsReceivable: 'Placeholder only — no payment connector is connected.',
        projectCostProfit: 'Unknown until project costs and invoices are entered.',
        paymentConnectorStatus: 'not-connected',
        warnings: [paymentConnectorNotice, 'Do not treat draft invoices as sent or paid.'],
      },
      accounting: {
        chartOfAccountsPlaceholder,
        ledger: [
          {
            id: 'ledger-revenue-placeholder',
            type: 'revenue',
            date: '',
            description: 'Revenue record placeholder. Enter real invoice/payment data before accounting use.',
            clientOrSupplier: 'Client company',
            amount: 0,
            currency,
            taxCategory: 'NEEDS_ACCOUNTANT_REVIEW',
            costCenter: 'Client project',
            evidence: 'SYSTEM_GENERATED',
          },
          {
            id: 'ledger-expense-placeholder',
            type: 'expense',
            date: '',
            description: 'Expense record placeholder. Attach receipts or imported documents before accountant export.',
            clientOrSupplier: 'Supplier not entered',
            amount: 0,
            currency,
            taxCategory: 'NEEDS_ACCOUNTANT_REVIEW',
            costCenter: 'Client project',
            evidence: 'SYSTEM_GENERATED',
          },
        ],
        monthlyAccountingSummary: 'Monthly accounting summary is a preparation draft only. No tax filing, tax compliance or paid invoice is confirmed.',
        monthlyRevenueReport: 'Revenue report placeholder: no confirmed revenue records have been entered yet.',
        monthlyExpenseReport: 'Expense report placeholder: no confirmed expense records have been entered yet.',
        invoicesSummary: 'Invoice summary placeholder: draft invoices are not sent or paid.',
        paymentsSummary: 'Payment summary placeholder: payment connector is not connected and no payment is confirmed.',
        accountsReceivableReport: 'Accounts receivable placeholder: amounts require user-entered invoices or imported accounting documents.',
        accountsPayableReport: 'Accounts payable placeholder: supplier bills/expenses require user-entered or imported documents.',
        projectProfitLossReport: 'Project profit/loss placeholder: profit cannot be confirmed until revenue and expenses are entered or imported.',
        taxPreparationChecklist: [
          'Confirm jurisdiction, company type and accountant/tax advisor requirements.',
          'Attach invoices, receipts and supplier documents.',
          'Review tax categories with accountant before filing.',
          'Do not treat Apex-generated tax fields as confirmed calculations.',
        ],
        documentsPendingForAccountant: [
          'Client/company legal data',
          'Supplier data and receipts',
          'Issued invoices',
          'Payment confirmations from real provider or bank records',
          'Expense documents',
          'Jurisdiction-specific tax guidance from accountant',
        ],
        accountantHandoffPackage: 'Accountant handoff package includes ledger placeholders, invoices summary, payments summary, accounts receivable/payable, project P/L draft, tax prep checklist and pending documents list. It requires accountant review before filing.',
        reviewNotice: 'NEEDS_ACCOUNTANT_REVIEW: Apex prepares documents and reports for accountant review. It does not file taxes or confirm accounting compliance.',
      },
    },
    warnings: [
      localDemoModeNotice,
      paymentConnectorNotice,
      'Supabase database connected — CRM/Finance persistence active. Multi-user auth and payment connector pending.',
    ],
  }
}

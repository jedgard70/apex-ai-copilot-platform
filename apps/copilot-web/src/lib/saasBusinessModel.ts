export const localDemoModeNotice = 'SaaS/CRM/Finance: configured with Supabase persistence after owner approval.'
export const paymentConnectorNotice = 'Payment connector not connected yet — no real payment was processed or confirmed.'

export type SaasRole =
  | 'Owner/Admin'
  | 'Internal Team'
  | 'Client'
  | 'Partner'
  | 'Viewer'
  | 'Contractor'
  | 'Finance'
  | 'Sales'

export type SaasPlanTier =
  | 'Internal'
  | 'Starter'
  | 'Pro'
  | 'Business'
  | 'Enterprise'
  | 'Offshore Production Partner'
  | 'Custom AI/BIM Operations'

export type BusinessCurrency = 'BRL' | 'USD' | 'EUR'
export type AccessLevel = 'admin' | 'internal' | 'client' | 'partner' | 'viewer' | 'finance' | 'sales'
export type ClientProjectStatus = 'New' | 'In Progress' | 'Waiting Client' | 'In Review' | 'Delivered' | 'On Hold'

export type PermissionRule = {
  role: SaasRole
  description: string
  canAccessAdmin: boolean
  canAccessInternalData: boolean
  canAccessClientWorkspace: boolean
  canUploadFiles: boolean
  canChatWithCopilot: boolean
  canViewOutputs: boolean
  canManageFinance: boolean
  canManageSales: boolean
}

export type LocalDemoUser = {
  id: string
  name: string
  email: string
  role: SaasRole
  accessLevel: AccessLevel
  status: 'Local demo only' | 'Invited' | 'Active placeholder'
}

export type ClientWorkspaceRecord = {
  id: string
  clientName: string
  company: string
  accessLevel: AccessLevel
  projects: {
    id: string
    name: string
    status: ClientProjectStatus
    uploadedFiles: number
    outputs: number
    proposals: number
    invoices: number
    messages: number
    nextAction: string
  }[]
  dataBoundary: string
}

export type SaasPlan = {
  name: SaasPlanTier
  targetUser: string
  includedModules: string[]
  limits: string[]
  suggestedPricePlaceholder: string
  sourceConfidence: 'PLACEHOLDER'
}

export type SaasAdminDashboard = {
  usersCount: number
  clientsCount: number
  projectsCount: number
  leadsCount: number
  proposalsCount: number
  revenuePlaceholder: string
  usageSummary: string[]
  moduleUsage: { module: string; usage: string }[]
  openTasks: string[]
}

export const rolePermissions: PermissionRule[] = [
  {
    role: 'Owner/Admin',
    description: 'Controls platform settings, business data, users, clients, modules and local workspace exports.',
    canAccessAdmin: true,
    canAccessInternalData: true,
    canAccessClientWorkspace: true,
    canUploadFiles: true,
    canChatWithCopilot: true,
    canViewOutputs: true,
    canManageFinance: true,
    canManageSales: true,
  },
  {
    role: 'Internal Team',
    description: 'Works on production modules and assigned client projects without owner-only finance/admin controls.',
    canAccessAdmin: false,
    canAccessInternalData: true,
    canAccessClientWorkspace: true,
    canUploadFiles: true,
    canChatWithCopilot: true,
    canViewOutputs: true,
    canManageFinance: false,
    canManageSales: false,
  },
  {
    role: 'Client',
    description: 'Uploads project files, chats with Apex AI and views only their own project outputs, proposals and invoices.',
    canAccessAdmin: false,
    canAccessInternalData: false,
    canAccessClientWorkspace: true,
    canUploadFiles: true,
    canChatWithCopilot: true,
    canViewOutputs: true,
    canManageFinance: false,
    canManageSales: false,
  },
  {
    role: 'Partner',
    description: 'Collaborates on approved projects and deliverables without internal/admin visibility.',
    canAccessAdmin: false,
    canAccessInternalData: false,
    canAccessClientWorkspace: true,
    canUploadFiles: true,
    canChatWithCopilot: true,
    canViewOutputs: true,
    canManageFinance: false,
    canManageSales: false,
  },
  {
    role: 'Viewer',
    description: 'Read-only project visibility for approved client or stakeholder outputs.',
    canAccessAdmin: false,
    canAccessInternalData: false,
    canAccessClientWorkspace: true,
    canUploadFiles: false,
    canChatWithCopilot: false,
    canViewOutputs: true,
    canManageFinance: false,
    canManageSales: false,
  },
  {
    role: 'Contractor',
    description: 'Receives assigned scope, field tasks and delivery references without broader business access.',
    canAccessAdmin: false,
    canAccessInternalData: false,
    canAccessClientWorkspace: true,
    canUploadFiles: true,
    canChatWithCopilot: true,
    canViewOutputs: true,
    canManageFinance: false,
    canManageSales: false,
  },
  {
    role: 'Finance',
    description: 'Maintains invoices, expenses, payment status and finance exports once connectors are approved.',
    canAccessAdmin: false,
    canAccessInternalData: true,
    canAccessClientWorkspace: true,
    canUploadFiles: true,
    canChatWithCopilot: true,
    canViewOutputs: true,
    canManageFinance: true,
    canManageSales: false,
  },
  {
    role: 'Sales',
    description: 'Manages leads, contacts, proposals, follow-ups and client presentation packages.',
    canAccessAdmin: false,
    canAccessInternalData: true,
    canAccessClientWorkspace: true,
    canUploadFiles: true,
    canChatWithCopilot: true,
    canViewOutputs: true,
    canManageFinance: false,
    canManageSales: true,
  },
]

export const localDemoUsers: LocalDemoUser[] = [
  { id: 'user-owner-demo', name: 'Owner', email: 'owner@local.demo', role: 'Owner/Admin', accessLevel: 'admin', status: 'Local demo only' },
  { id: 'user-sales-demo', name: 'Sales workspace', email: 'sales@local.demo', role: 'Sales', accessLevel: 'sales', status: 'Local demo only' },
  { id: 'user-client-demo', name: 'Client workspace', email: 'client@local.demo', role: 'Client', accessLevel: 'client', status: 'Local demo only' },
]

export const clientWorkspaceTemplate: ClientWorkspaceRecord = {
  id: 'client-workspace-local',
  clientName: 'Client workspace',
  company: 'Local demo client',
  accessLevel: 'client',
  projects: [
    {
      id: 'client-project-local',
      name: 'Client project',
      status: 'New',
      uploadedFiles: 0,
      outputs: 0,
      proposals: 0,
      invoices: 0,
      messages: 0,
      nextAction: 'Upload a file or describe the project need.',
    },
  ],
  dataBoundary: 'Client users can only see their own projects, files, messages, proposals, invoices and approved outputs. Admin/internal data remains blocked until real auth/RLS is connected.',
}

export const saasPlans: SaasPlan[] = [
  {
    name: 'Internal',
    targetUser: 'Owner and internal production team',
    includedModules: ['Apex Copilot', 'Project Workspace', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps'],
    limits: ['Internal use only', 'local-first storage in this checkpoint'],
    suggestedPricePlaceholder: 'Internal cost center',
    sourceConfidence: 'PLACEHOLDER',
  },
  {
    name: 'Starter',
    targetUser: 'Small clients needing guided project intake and deliverables',
    includedModules: ['Client Workspace', 'Apex Copilot chat', 'file uploads', 'output viewer'],
    limits: ['Limited projects', 'limited exports', 'no team management yet'],
    suggestedPricePlaceholder: 'Placeholder until market research confirms',
    sourceConfidence: 'PLACEHOLDER',
  },
  {
    name: 'Pro',
    targetUser: 'Design/build teams needing ArchVis, video and project package workflows',
    includedModules: ['ArchVis Studio', 'DirectCut Studio', 'Project exports', 'CRM proposal support'],
    limits: ['Higher usage limits', 'connector limits TBD'],
    suggestedPricePlaceholder: 'Placeholder until market research confirms',
    sourceConfidence: 'PLACEHOLDER',
  },
  {
    name: 'Business',
    targetUser: 'AEC offices needing client portal, CRM, finance and operational modules',
    includedModules: ['Admin dashboard', 'Client dashboards', 'CRM', 'Finance', 'Budget', 'Contracts', 'FieldOps'],
    limits: ['Team seats and client workspace limits TBD'],
    suggestedPricePlaceholder: 'Placeholder until market research confirms',
    sourceConfidence: 'PLACEHOLDER',
  },
  {
    name: 'Enterprise',
    targetUser: 'Larger firms needing governance, integrations and custom workflows',
    includedModules: ['All modules', 'advanced permissions', 'custom connectors', 'source confidence reporting'],
    limits: ['Custom contract and connector scope'],
    suggestedPricePlaceholder: 'Custom quote placeholder',
    sourceConfidence: 'PLACEHOLDER',
  },
  {
    name: 'Offshore Production Partner',
    targetUser: 'US/EU firms outsourcing BIM/CAD/Revit/permit documentation to Apex',
    includedModules: ['BIM/Revit production workflow', 'permit packages', 'estimating', 'project delivery dashboard', 'client reporting'],
    limits: ['Production capacity and SLA defined by contract'],
    suggestedPricePlaceholder: 'Monthly retainer / package placeholder',
    sourceConfidence: 'PLACEHOLDER',
  },
  {
    name: 'Custom AI/BIM Operations',
    targetUser: 'AEC operations that need a custom AI-enabled production system',
    includedModules: ['Custom Copilot workflows', 'BIM operations', 'document intelligence', 'automation roadmap'],
    limits: ['Discovery required'],
    suggestedPricePlaceholder: 'Custom quote placeholder',
    sourceConfidence: 'PLACEHOLDER',
  },
]

export function createAdminDashboard(): SaasAdminDashboard {
  return {
    usersCount: localDemoUsers.length,
    clientsCount: 1,
    projectsCount: 1,
    leadsCount: 0,
    proposalsCount: 0,
    revenuePlaceholder: 'Revenue not connected — use Finance Studio with user-entered data only.',
    usageSummary: [
      'Local Project Workspace is active.',
      'Supabase database configured — SaaS/CRM/Finance persistence active.',
      'Payment connector is not connected yet.',
      'Client data boundaries are modeled but not enforced by a backend yet.',
    ],
    moduleUsage: [
      { module: 'Apex Copilot', usage: 'Chat-first command center' },
      { module: 'ArchVis', usage: 'Image/render/humanization output panel' },
      { module: 'DirectCut', usage: 'Video planning and storyboard panel' },
      { module: 'BIM / 3D', usage: 'Viewer/import/review planning panel' },
      { module: 'Budget', usage: 'Preliminary estimating with confidence labels' },
      { module: 'Contracts', usage: 'Draft/review/checklist with legal caveats' },
    ],
    openTasks: [
      'Connect real auth before production client access.',
      'Configure RLS policies for multi-client isolation.',
      'Connect payment provider before invoices can be sent/paid.',
    ],
  }
}

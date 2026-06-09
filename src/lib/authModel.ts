export type AuthMode = 'local-demo' | 'supabase-not-configured' | 'supabase-connected'

export type ApexRoleId =
  | 'owner_admin'
  | 'internal_team'
  | 'client'
  | 'partner'
  | 'viewer'
  | 'contractor'
  | 'finance'
  | 'sales'
  | 'field'
  | 'bim_manager'
  | 'project_manager'

export type PermissionGroup =
  | 'project.read'
  | 'project.write'
  | 'files.read'
  | 'files.write'
  | 'archvis.read'
  | 'archvis.write'
  | 'directcut.read'
  | 'directcut.write'
  | 'bim.read'
  | 'bim.write'
  | 'budget.read'
  | 'budget.write'
  | 'contracts.read'
  | 'contracts.write'
  | 'fieldops.read'
  | 'fieldops.write'
  | 'crm.read'
  | 'crm.write'
  | 'finance.read'
  | 'finance.write'
  | 'accounting.read'
  | 'accounting.write'
  | 'admin.manage_users'
  | 'admin.manage_tenants'

export type ApexRole = {
  id: ApexRoleId
  label: string
  description: string
  permissions: PermissionGroup[]
}

export const permissionGroups: PermissionGroup[] = [
  'project.read',
  'project.write',
  'files.read',
  'files.write',
  'archvis.read',
  'archvis.write',
  'directcut.read',
  'directcut.write',
  'bim.read',
  'bim.write',
  'budget.read',
  'budget.write',
  'contracts.read',
  'contracts.write',
  'fieldops.read',
  'fieldops.write',
  'crm.read',
  'crm.write',
  'finance.read',
  'finance.write',
  'accounting.read',
  'accounting.write',
  'admin.manage_users',
  'admin.manage_tenants',
]

const readWriteProject: PermissionGroup[] = [
  'project.read',
  'project.write',
  'files.read',
  'files.write',
  'archvis.read',
  'archvis.write',
  'directcut.read',
  'directcut.write',
  'bim.read',
  'bim.write',
  'budget.read',
  'budget.write',
  'contracts.read',
  'contracts.write',
  'fieldops.read',
  'fieldops.write',
]

export const apexRoles: ApexRole[] = [
  {
    id: 'owner_admin',
    label: 'Owner/Admin',
    description: 'Full tenant administration and all project modules.',
    permissions: [...permissionGroups],
  },
  {
    id: 'internal_team',
    label: 'Internal Team',
    description: 'Internal Apex production user with assigned tenant/project access.',
    permissions: [...readWriteProject, 'crm.read', 'crm.write'],
  },
  {
    id: 'client',
    label: 'Client',
    description: 'Client workspace user scoped to assigned projects and outputs.',
    permissions: ['project.read', 'files.read', 'files.write', 'archvis.read', 'directcut.read', 'bim.read', 'budget.read', 'contracts.read', 'fieldops.read'],
  },
  {
    id: 'partner',
    label: 'Partner',
    description: 'External collaborator with assigned project access.',
    permissions: ['project.read', 'project.write', 'files.read', 'files.write', 'archvis.read', 'archvis.write', 'directcut.read', 'directcut.write', 'bim.read', 'budget.read', 'contracts.read'],
  },
  {
    id: 'viewer',
    label: 'Viewer',
    description: 'Read-only user for assigned projects.',
    permissions: ['project.read', 'files.read', 'archvis.read', 'directcut.read', 'bim.read', 'budget.read', 'contracts.read', 'fieldops.read'],
  },
  {
    id: 'contractor',
    label: 'Contractor',
    description: 'Assigned contractor focused on operational project items.',
    permissions: ['project.read', 'files.read', 'fieldops.read', 'fieldops.write', 'contracts.read'],
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Finance/accounting user for assigned tenant finance data.',
    permissions: ['project.read', 'budget.read', 'budget.write', 'finance.read', 'finance.write', 'accounting.read', 'accounting.write'],
  },
  {
    id: 'sales',
    label: 'Sales',
    description: 'CRM, sales, proposal and client pipeline user.',
    permissions: ['project.read', 'files.read', 'crm.read', 'crm.write', 'contracts.read', 'budget.read'],
  },
  {
    id: 'field',
    label: 'Field',
    description: 'Field operations user for RDO/photos/issues on assigned projects.',
    permissions: ['project.read', 'files.read', 'files.write', 'fieldops.read', 'fieldops.write'],
  },
  {
    id: 'bim_manager',
    label: 'BIM Manager',
    description: 'BIM/3D/project model manager for assigned projects.',
    permissions: ['project.read', 'files.read', 'files.write', 'bim.read', 'bim.write', 'archvis.read', 'directcut.read', 'budget.read'],
  },
  {
    id: 'project_manager',
    label: 'Project Manager',
    description: 'Project delivery manager across production, field and client outputs.',
    permissions: [...readWriteProject, 'crm.read', 'budget.read', 'budget.write', 'contracts.read', 'contracts.write', 'finance.read'],
  },
]

export function getAuthProviderStatus() {
  const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL)
  const hasAnonKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
  return hasUrl && hasAnonKey ? 'supabase-connected' as const : 'supabase-not-configured' as const
}

export function getGoogleOauthStatus() {
  return import.meta.env.GOOGLE_OAUTH_STATUS || 'not-configured'
}

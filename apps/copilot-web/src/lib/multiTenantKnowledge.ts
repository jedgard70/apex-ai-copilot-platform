export type MultiTenantPlan = {
  providerStatus: 'local-first tenant planning only'
  tenants: { id: string; name: string; workspaceType: string; status: string; dataBoundary: string }[]
  rolesPerTenant: string[]
  projectIsolationPlan: string[]
  rlsReadinessChecklist: string[]
  tenantRiskChecklist: string[]
  exportPlan: string
}

export function isMultiTenantIntent(text: string) {
  return /\b(multi-tenant|multitenant|tenant|empresa|workspace|isolamento de dados|data isolation|rls|tenant isolation)\b/i.test(text)
}

export function createMultiTenantPlan(goal = ''): MultiTenantPlan {
  return {
    providerStatus: 'local-first tenant planning only',
    tenants: [
      { id: 'tenant-owner', name: 'Apex Internal', workspaceType: 'Owner/Admin', status: 'local demo', dataBoundary: 'Internal only' },
      { id: 'tenant-client', name: 'Client Workspace', workspaceType: 'Client', status: 'planned', dataBoundary: 'Client project data only' },
    ],
    rolesPerTenant: ['Owner/Admin', 'Internal Team', 'Client', 'Partner', 'Viewer', 'Contractor', 'Finance', 'Sales'],
    projectIsolationPlan: ['Tenant id on every user, project, file and export.', 'Server-side role checks before every project/file read.', 'Client users cannot query admin/internal tenant data.'],
    rlsReadinessChecklist: ['Define tenant tables.', 'Add tenant_id to project-owned rows.', 'Create Supabase RLS policies after approval.', 'Test cross-tenant denial before production.'],
    tenantRiskChecklist: ['No real tenant isolation yet.', 'No Supabase/auth connector in this checkpoint.', 'Do not onboard real clients until backend isolation is verified.'],
    exportPlan: `Tenant architecture plan for: ${goal || 'Apex multi-tenant readiness'}`,
  }
}

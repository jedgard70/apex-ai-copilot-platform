/**
 * server/service/multiTenant.mjs
 *
 * Multi-tenant Readiness — planejamento de isolamento de dados por tenant.
 */

/**
 * Cria plano multi-tenant.
 * @param {string} goal
 * @returns {Object}
 */
export function createMultiTenantPlan(goal = '') {
  return {
    providerStatus: 'connected',
    tenants: [
      { id: 'tenant-owner', name: 'Apex Internal', workspaceType: 'Owner/Admin', status: 'local demo', dataBoundary: 'Internal only' },
      { id: 'tenant-client', name: 'Client Workspace', workspaceType: 'Client', status: 'planned', dataBoundary: 'Client project data only' },
    ],
    rolesPerTenant: ['Owner/Admin', 'Internal Team', 'Client', 'Partner', 'Viewer', 'Contractor', 'Finance', 'Sales'],
    projectIsolationPlan: [
      'Tenant id on every user, project, file and export.',
      'Server-side role checks before every project/file read.',
      'Client users cannot query admin/internal tenant data.',
    ],
    rlsReadinessChecklist: [
      'Define tenant tables.',
      'Add tenant_id to project-owned rows.',
      'Create Supabase RLS policies after approval.',
      'Test cross-tenant denial before production.',
    ],
    tenantRiskChecklist: [
      'No real tenant isolation yet.',
      'No Supabase/auth connector in this checkpoint.',
      'Do not onboard real clients until backend isolation is verified.',
    ],
    exportPlan: `Tenant architecture plan for: ${goal || 'Apex multi-tenant readiness'}`,
  }
}

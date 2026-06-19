export const EXECUTION_CLASSES = {
  READ_ONLY: 'read_only',
  VALIDATION: 'validation',
  MUTATION_REQUIRES_CONFIRMATION: 'mutation_requires_confirmation',
  EXTERNAL_DESKTOP_REQUIRES_LOCAL_WORKER: 'external_desktop_requires_local_worker',
  BLOCKED: 'blocked',
  // H6.0 — risk-tiered execution policy
  H6_WRITE:     'h6_write',
  H6_DEPLOY:    'h6_deploy',
  H6_DATABASE:  'h6_database',
  H6_DESKTOP:   'h6_desktop',
  H6_DANGEROUS: 'h6_dangerous',
  H6_FORBIDDEN: 'h6_forbidden',
}

const ENV_ALIASES = {
  LOCAL_WORKER_URL: ['Local_Worker_URL'],
  LOCAL_WORKER_TOKEN: ['Local_Worker_TOKEN'],
}

function hasAnyEnv(names = []) {
  return names.some(name => hasEnv(name))
}

function hasEnv(name) {
  if (process.env[name]) return true
  const aliases = ENV_ALIASES[name] || []
  return aliases.some(alias => Boolean(process.env[alias]))
}

export const TOOL_REGISTRY = [
  {
    id: 'github.status',
    label: 'GitHub repository status',
    provider: 'github',
    executionClass: EXECUTION_CLASSES.READ_ONLY,
    capability: 'remote_repository_status',
    env: ['GITHUB_TOKEN or GH_TOKEN', 'APEX_GITHUB_OWNER optional', 'APEX_GITHUB_REPOSITORY optional', 'APEX_GITHUB_BRANCH optional'],
    isConfigured: () => hasAnyEnv(['GITHUB_TOKEN', 'GH_TOKEN']),
    missing: () => hasAnyEnv(['GITHUB_TOKEN', 'GH_TOKEN']) ? [] : ['GITHUB_TOKEN or GH_TOKEN'],
    mutates: false,
  },
  {
    id: 'vercel.status',
    label: 'Vercel deployment status',
    provider: 'vercel',
    executionClass: EXECUTION_CLASSES.READ_ONLY,
    capability: 'deployment_status',
    env: ['VERCEL_TOKEN', 'APEX_VERCEL_PROJECT_ID or VERCEL_PROJECT_ID', 'VERCEL_TEAM_ID optional'],
    isConfigured: () => hasEnv('VERCEL_TOKEN'),
    missing: () => !hasEnv('VERCEL_TOKEN') ? ['VERCEL_TOKEN'] : [],
    mutates: false,
  },
  {
    id: 'supabase.status',
    label: 'Supabase configuration status',
    provider: 'supabase',
    executionClass: EXECUTION_CLASSES.READ_ONLY,
    capability: 'supabase_presence_status',
    env: ['SUPABASE_ACCESS_TOKEN or SUPABASE_DB_URL', 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for frontend'],
    isConfigured: () => hasAnyEnv(['SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_URL', 'VITE_SUPABASE_URL']),
    missing: () => hasAnyEnv(['SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_URL', 'VITE_SUPABASE_URL'])
      ? []
      : ['SUPABASE_ACCESS_TOKEN or SUPABASE_DB_URL or VITE_SUPABASE_URL'],
    mutates: false,
  },
  {
    id: 'platform.validation',
    label: 'Platform validation checks',
    provider: 'local_or_worker',
    executionClass: EXECUTION_CLASSES.VALIDATION,
    capability: 'build_and_route_validation',
    env: ['LOCAL_WORKER_URL optional for remote validation worker'],
    isConfigured: () => false,
    missing: () => ['LOCAL_WORKER_URL or controlled validation executor'],
    mutates: false,
  },
  {
    id: 'local_worker.status',
    label: 'Controlled local PC worker',
    provider: 'local_worker',
       get executionClass() {
      return hasEnv('LOCAL_WORKER_URL') && hasEnv('LOCAL_WORKER_TOKEN')
        ? EXECUTION_CLASSES.READ_ONLY
        : EXECUTION_CLASSES.EXTERNAL_DESKTOP_REQUIRES_LOCAL_WORKER
    },
    capability: 'controlled_pc_execution',
    env: ['LOCAL_WORKER_URL', 'LOCAL_WORKER_TOKEN'],
    isConfigured: () => hasEnv('LOCAL_WORKER_URL') && hasEnv('LOCAL_WORKER_TOKEN'),
    missing: () => [
      ...(!hasEnv('LOCAL_WORKER_URL') ? ['LOCAL_WORKER_URL'] : []),
      ...(!hasEnv('LOCAL_WORKER_TOKEN') ? ['LOCAL_WORKER_TOKEN'] : []),
    ],
    mutates: false,
  },
  {
    id: 'revit_mcp.status',
    label: 'Revit MCP bridge',
    provider: 'revit_mcp',
    executionClass: EXECUTION_CLASSES.EXTERNAL_DESKTOP_REQUIRES_LOCAL_WORKER,
    capability: 'revit_desktop_mcp',
    env: ['REVIT_MCP_URL', 'REVIT_MCP_TOKEN'],
    isConfigured: () => hasEnv('REVIT_MCP_URL'),
    missing: () => [
      ...(!hasEnv('REVIT_MCP_URL') ? ['REVIT_MCP_URL'] : []),
      ...(!hasEnv('REVIT_MCP_TOKEN') ? ['REVIT_MCP_TOKEN'] : []),
    ],
    mutates: false,
  },
  {
    id: 'revit_model.status',
    label: 'Revit model check',
    provider: 'revit_mcp',
    executionClass: EXECUTION_CLASSES.EXTERNAL_DESKTOP_REQUIRES_LOCAL_WORKER,
    capability: 'revit_model_status_check',
    env: ['REVIT_MCP_URL', 'REVIT_MCP_TOKEN'],
    isConfigured: () => hasEnv('REVIT_MCP_URL'),
    missing: () => [
      ...(!hasEnv('REVIT_MCP_URL') ? ['REVIT_MCP_URL'] : []),
      ...(!hasEnv('REVIT_MCP_TOKEN') ? ['REVIT_MCP_TOKEN'] : []),
    ],
    mutates: false,
  },
  {
    id: 'vercel.deploy',
    label: 'Vercel deploy',
    provider: 'vercel',
    executionClass: EXECUTION_CLASSES.MUTATION_REQUIRES_CONFIRMATION,
    capability: 'deploy',
    env: ['VERCEL_TOKEN', 'APEX_VERCEL_PROJECT_ID or VERCEL_PROJECT_ID'],
    isConfigured: () => hasEnv('VERCEL_TOKEN'),
    missing: () => !hasEnv('VERCEL_TOKEN') ? ['VERCEL_TOKEN'] : [],
    mutates: true,
  },
  {
    id: 'supabase.migration',
    label: 'Supabase migration',
    provider: 'supabase',
    executionClass: EXECUTION_CLASSES.MUTATION_REQUIRES_CONFIRMATION,
    capability: 'database_migration',
    env: ['SUPABASE_ACCESS_TOKEN or SUPABASE_DB_URL'],
    isConfigured: () => hasAnyEnv(['SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_URL']),
    missing: () => hasAnyEnv(['SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_URL']) ? [] : ['SUPABASE_ACCESS_TOKEN or SUPABASE_DB_URL'],
    mutates: true,
  },
  {
    id: 'dangerous.unclassified',
    label: 'Unclassified action',
    provider: 'policy',
    executionClass: EXECUTION_CLASSES.READ_ONLY,
    capability: 'unclassified_action',
    env: [],
    isConfigured: () => true,
    missing: () => [],
    mutates: true,
  },
]

export function getToolRegistry() {
  return TOOL_REGISTRY.map(tool => ({
    id: tool.id,
    label: tool.label,
    provider: tool.provider,
    executionClass: tool.executionClass,
    capability: tool.capability,
    env: tool.env,
    configured: tool.isConfigured(),
    missing: tool.missing(),
    mutates: tool.mutates,
  }))
}

export function getToolDefinition(toolId) {
  return TOOL_REGISTRY.find(tool => tool.id === toolId) || null
}

export function getExecutionCapabilityMatrix() {
  return getToolRegistry().map(tool => ({
    toolId: tool.id,
    label: tool.label,
    provider: tool.provider,
    executionClass: tool.executionClass,
    status: tool.configured ? 'available' : 'unavailable',
    missing: tool.missing,
    mutates: tool.mutates,
  }))
}

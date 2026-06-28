export type AuthMode = 'local-demo' | 'supabase-not-configured' | 'supabase-connected'

export type ApexRoleId =
  | 'owner'
  | 'admin'
  | 'diretoria'
  | 'dept_financeiro'
  | 'dept_contabil'
  | 'dept_marketing'
  | 'dept_juridico'
  | 'dept_compras'
  | 'dept_qualidade'
  | 'engenheiro_obra'
  | 'engenheiro_campo'
  | 'engenheiro_custos'
  | 'produtor_audiovisual'
  | 'modelador_bim'
  | 'social_media'
  | 'web_designer'
  | 'cliente_a'
  | 'cliente_b'
  | 'cliente_c'

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
  | 'marketing.read'
  | 'marketing.write'
  | 'admin.manage_users'
  | 'admin.manage_tenants'
  | 'admin.full_access'

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
    id: 'owner',
    label: 'Owner',
    description: 'Proprietário da Plataforma (Acesso irrestrito a todos os módulos e integrações).',
    permissions: [...permissionGroups, 'admin.full_access'],
  },
  {
    id: 'admin',
    label: 'Administrador',
    description: 'Administrador Geral do Sistema e de Usuários.',
    permissions: [...permissionGroups],
  },
  {
    id: 'diretoria',
    label: 'Diretoria',
    description: 'Painel executivo, acompanhamento financeiro, crm e Dashboards macro.',
    permissions: ['project.read', 'finance.read', 'crm.read', 'accounting.read', 'marketing.read', 'budget.read', 'contracts.read'],
  },
  {
    id: 'dept_financeiro',
    label: 'Dept. Financeiro',
    description: 'Controle de contas a pagar/receber, emissão de faturas e fluxo de caixa.',
    permissions: ['project.read', 'finance.read', 'finance.write', 'budget.read', 'budget.write'],
  },
  {
    id: 'dept_contabil',
    label: 'Dept. Contábil',
    description: 'Integração contábil, impostos e balancetes.',
    permissions: ['project.read', 'accounting.read', 'accounting.write', 'finance.read'],
  },
  {
    id: 'dept_marketing',
    label: 'Dept. Marketing',
    description: 'Gestão de campanhas, leads, CRM e automações de e-mail/whatsapp.',
    permissions: ['project.read', 'marketing.read', 'marketing.write', 'crm.read', 'crm.write', 'archvis.read', 'directcut.read'],
  },
  {
    id: 'dept_juridico',
    label: 'Dept. Jurídico',
    description: 'Análise de contratos, compliance, licenças e alvarás.',
    permissions: ['project.read', 'contracts.read', 'contracts.write', 'files.read'],
  },
  {
    id: 'dept_compras',
    label: 'Departamento de Compras',
    description: 'Acesso a Supply Chain, Fornecedores e Cotações.',
    permissions: ['module.supply_chain.read', 'module.budget.read'] as any
  },
  {
    id: 'dept_qualidade',
    label: 'Qualidade e Segurança',
    description: 'Acesso a Qualidade, ISO e NR Compliance.',
    permissions: ['module.quality.read', 'module.nr_compliance.read'] as any
  },
  {
    id: 'engenheiro_obra',
    label: 'Engenheiro de Obra',
    description: 'Acesso macro ao projeto, RDO e BIM.',
    permissions: ['module.field_ops.read', 'module.bim.read'] as any
  },
  {
    id: 'engenheiro_campo',
    label: 'Engenheiro de Campo',
    description: 'Acesso a apontamentos diários, RDO e fotos de campo.',
    permissions: ['module.field_ops.read'] as any
  },
  {
    id: 'engenheiro_custos',
    label: 'Engenheiro de Custos',
    description: 'Acesso a orçamentos, cronograma e planilhas (EVM).',
    permissions: ['module.budget.read', 'module.evm.read', 'module.finance.read'] as any
  },
  {
    id: 'produtor_audiovisual',
    label: 'Produtor 3D / Audiovisual',
    description: 'Edição de vídeos, imagens, Render e ArchVis.',
    permissions: ['module.archvis.read', 'module.directcut.read', 'module.render.read', 'module.avatar.read'] as any
  },
  {
    id: 'modelador_bim',
    label: 'Modelador BIM / Revit',
    description: 'Acesso às nuvens de pontos, modelos BIM e APS.',
    permissions: ['module.bim.read', 'module.bim_clash.read', 'module.aps.read'] as any
  },
  {
    id: 'social_media',
    label: 'Social Media',
    description: 'Gestão de Campanhas, Redes Sociais e CRM Básico.',
    permissions: ['module.campaign.read', 'module.marketing.read', 'module.chat.read'] as any
  },
  {
    id: 'web_designer',
    label: 'Web Designer',
    description: 'Landing pages, VSL e UX.',
    permissions: ['module.vsl.read', 'module.archvis.read'] as any
  },
  {
    id: 'cliente_a',
    label: 'Cliente - Premium (Categoria A)',
    description: 'Acesso completo ao projeto, câmeras em tempo real, orçamentos, contratos e suporte.',
    permissions: ['project.read', 'files.read', 'files.write', 'archvis.read', 'directcut.read', 'bim.read', 'budget.read', 'contracts.read', 'fieldops.read'],
  },
  {
    id: 'cliente_b',
    label: 'Cliente - Standard (Categoria B)',
    description: 'Acesso restrito ao projeto, andamento da obra (RDO) e aprovação de imagens.',
    permissions: ['project.read', 'files.read', 'archvis.read', 'bim.read', 'fieldops.read'],
  },
  {
    id: 'cliente_c',
    label: 'Cliente - Basic (Categoria C)',
    description: 'Visualizador simples, status financeiro próprio e notificações do projeto.',
    permissions: ['project.read', 'files.read', 'finance.read'],
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

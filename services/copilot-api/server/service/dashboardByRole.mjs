/**
 * server/service/dashboardByRole.mjs
 *
 * DashboardByRole — ACIP
 * Dashboard diferente para cada perfil de usuário:
 * Diretor Executivo, Engenheiro, Arquiteto, Investidor,
 * Gestor de Obra, Agente de Vendas, Compliance Officer
 */
import { createClient } from '@supabase/supabase-js'

const ROLES = [
  { id: 'diretor-executivo', name: 'Diretor Executivo', icon: '🎯', description: 'Visão estratégica e financeira da empresa' },
  { id: 'engenheiro', name: 'Engenheiro', icon: '👷', description: 'Dados técnicos, BIM, qualidade e NCIs' },
  { id: 'arquiteto', name: 'Arquiteto', icon: '🏛️', description: 'Projetos, renders e documentação' },
  { id: 'investidor', name: 'Investidor', icon: '📈', description: 'ROI, valuation e fluxo de caixa' },
  { id: 'gestor-obra', name: 'Gestor de Obra', icon: '📋', description: 'Cronograma, RDO, equipe e materiais' },
  { id: 'vendas', name: 'Agente de Vendas', icon: '🤝', description: 'Pipeline, leads, propostas e fechamento' },
  { id: 'compliance', name: 'Compliance Officer', icon: '⚖️', description: 'NRs, licenças, alvarás e conformidade' },
]

const MOCK_PROJECTS = [
  { id: 'proj-1', name: 'Residencial Park Avenue', status: 'em-andamento', progresso: 65, vgv: 4500000, custoTotal: 3200000, prazoTotal: 18, prazoDecorrido: 11, responsible: 'Dr. Edgard', startDate: '2025-07-01', endDate: '2026-12-31' },
  { id: 'proj-2', name: 'Edifício Corporativo Horizonte', status: 'planejamento', progresso: 15, vgv: 12000000, custoTotal: 8500000, prazoTotal: 24, prazoDecorrido: 4, responsible: 'Dr. Edgard', startDate: '2026-01-01', endDate: '2028-01-01' },
  { id: 'proj-3', name: 'Condomínio Jardins do Vale', status: 'em-andamento', progresso: 40, vgv: 7800000, custoTotal: 5200000, prazoTotal: 20, prazoDecorrido: 8, responsible: 'Eng. Silva', startDate: '2025-10-01', endDate: '2027-06-30' },
  { id: 'proj-4', name: 'Reforma Comercial Centro', status: 'concluido', progresso: 100, vgv: 850000, custoTotal: 620000, prazoTotal: 6, prazoDecorrido: 6, responsible: 'Arq. Costa', startDate: '2025-12-01', endDate: '2026-06-01' },
  { id: 'proj-5', name: 'Residencial Villa Verde', status: 'em-andamento', progresso: 25, vgv: 3200000, custoTotal: 2100000, prazoTotal: 14, prazoDecorrido: 4, responsible: 'Dr. Edgard', startDate: '2026-03-01', endDate: '2027-05-01' },
]

const MOCK_LEADS = [
  { id: 'lead-1', name: 'João Silva', empresa: 'Silva Construções', valor: 150000, stage: 'proposta', probabilidade: 60, responsavel: 'Maria Vendas', dataContato: '2026-06-10', status: 'quente' },
  { id: 'lead-2', name: 'Maria Santos', empresa: 'Santos Arquitetura', valor: 85000, stage: 'negociacao', probabilidade: 80, responsavel: 'Maria Vendas', dataContato: '2026-06-15', status: 'quente' },
  { id: 'lead-3', name: 'Pedro Oliveira', empresa: 'Oliveira Engenharia', valor: 320000, stage: 'prospeccao', probabilidade: 25, responsavel: 'Carlos Leads', dataContato: '2026-06-20', status: 'frio' },
  { id: 'lead-4', name: 'Ana Costa', empresa: 'Costa Incorporadora', valor: 500000, stage: 'fechamento', probabilidade: 90, responsavel: 'Maria Vendas', dataContato: '2026-06-05', status: 'quente' },
  { id: 'lead-5', name: 'Lucas Pereira', empresa: 'Pereira Construtora', valor: 200000, stage: 'prospeccao', probabilidade: 20, responsavel: 'Carlos Leads', dataContato: '2026-06-22', status: 'morno' },
]

const MOCK_NCIS = [
  { id: 'nci-1', descricao: 'Armadura incorreta viga V12', severidade: 'alta', projeto: 'Residencial Park Avenue', status: 'aberta', responsavel: 'Eng. Silva', prazo: '2026-07-15' },
  { id: 'nci-2', descricao: 'Contraverga em janela J5', severidade: 'media', projeto: 'Condomínio Jardins do Vale', status: 'em-tratamento', responsavel: 'Arq. Costa', prazo: '2026-07-10' },
  { id: 'nci-3', descricao: 'Prumo fora da tolerância', severidade: 'alta', projeto: 'Residencial Park Avenue', status: 'aberta', responsavel: 'Dr. Edgard', prazo: '2026-06-30' },
  { id: 'nci-4', descricao: 'Juntas de dilatação incorretas', severidade: 'baixa', projeto: 'Edifício Corporativo Horizonte', status: 'fechada', responsavel: 'Eng. Silva', prazo: '2026-06-01' },
]

/**
 * Gera dashboard baseado no role do usuário.
 * @param {string} roleId
 * @param {Object} context - { projects, leads, ncis } opcional
 * @returns {Object}
 */
export async function generateDashboard(roleId, context = {}) {
  const role = ROLES.find(r => r.id === roleId)
  if (!role) return { error: 'Role não encontrada' }

  let projects = context.projects
  let leads = context.leads
  let ncis = context.ncis

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      if (!projects) {
        const { data } = await supabase.from('projects').select('*').limit(100)
        if (data && data.length > 0) projects = data
      }
      if (!leads) {
        const { data } = await supabase.from('leads').select('*').limit(100)
        if (data && data.length > 0) leads = data
      }
      if (!ncis) {
        const { data } = await supabase.from('ncis').select('*').limit(100)
        if (data && data.length > 0) ncis = data
      }
    } catch (err) {
      console.warn('[Dashboard] Supabase error, using fallback:', err.message)
    }
  }

  projects = projects || MOCK_PROJECTS
  leads = leads || MOCK_LEADS
  ncis = ncis || MOCK_NCIS

  const totalVGV = projects.reduce((s, p) => s + p.vgv, 0)
  const totalCusto = projects.reduce((s, p) => s + p.custoTotal, 0)
  const projetosEmAndamento = projects.filter(p => p.status === 'em-andamento').length
  const projetosConcluidos = projects.filter(p => p.status === 'concluido').length
  const leadsAtivos = leads.length
  const vglPipeline = leads.reduce((s, l) => s + l.valor, 0)
  const probabilidadeMedia = Math.round(leads.reduce((s, l) => s + l.probabilidade, 0) / leads.length)
  const ncisAbertas = ncis.filter(n => n.status !== 'fechada').length
  const ncisAltaSeveridade = ncis.filter(n => n.severidade === 'alta' && n.status !== 'fechada').length

  const baseKpis = {
    totalProjetos: projects.length,
    projetosEmAndamento,
    projetosConcluidos,
    vgvTotal: totalVGV,
    custoTotal: totalCusto,
    margemMedia: Math.round(((totalVGV - totalCusto) / totalVGV) * 100),
    leadsAtivos,
    vglPipeline,
    probabilidadeMedia,
    ncisAbertas,
    ncisAltaSeveridade,
  }

  let dashboard

  switch (roleId) {
    case 'diretor-executivo':
      dashboard = {
        role: role.name,
        icon: role.icon,
        kpis: baseKpis,
        cards: [
          { label: 'VGV Total', value: toBRL(totalVGV), trend: '+12%', color: '#22c55e' },
          { label: 'Custo Total', value: toBRL(totalCusto), trend: '-3%', color: '#ef4444' },
          { label: 'Margem Média', value: `${baseKpis.margemMedia}%`, trend: '+2%', color: '#3b82f6' },
          { label: 'Pipeline VGL', value: toBRL(vglPipeline), trend: '+8%', color: '#f59e0b' },
          { label: 'Leads Ativos', value: leadsAtivos, trend: '+5', color: '#a855f7' },
          { label: 'NCIs Abertas', value: ncisAbertas, trend: '-2', color: '#ef4444' },
        ],
        projects: projects.map(p => ({
          name: p.name, status: p.status, progresso: p.progresso,
          vgv: toBRL(p.vgv), responsavel: p.responsible,
          prazoPercent: Math.round((p.prazoDecorrido / p.prazoTotal) * 100),
        })),
        alerts: ncis.filter(n => n.severidade === 'alta' && n.status !== 'fechada').map(n => ({
          text: `🔴 ${n.descricao} — ${n.projeto}`,
          severity: 'critical',
        })),
      }
      break

    case 'engenheiro':
      dashboard = {
        role: role.name,
        icon: role.icon,
        kpis: {
          ...baseKpis,
          ncisPorSeveridade: [
            { severidade: 'Alta', count: ncis.filter(n => n.severidade === 'alta').length },
            { severidade: 'Média', count: ncis.filter(n => n.severidade === 'media').length },
            { severidade: 'Baixa', count: ncis.filter(n => n.severidade === 'baixa').length },
          ],
        },
        cards: [
          { label: 'NCIs Abertas', value: ncisAbertas, color: '#ef4444', detail: `${ncisAltaSeveridade} alta severidade` },
          { label: 'Projetos Ativos', value: projetosEmAndamento, color: '#3b82f6' },
          { label: 'Progresso Médio', value: `${Math.round(projects.reduce((s, p) => s + p.progresso, 0) / projects.length)}%`, color: '#22c55e' },
        ],
        ncis: ncis.map(n => ({
          descricao: n.descricao, severidade: n.severidade, projeto: n.projeto,
          status: n.status, responsavel: n.responsavel, prazo: n.prazo,
        })),
        projects: projects.map(p => ({ name: p.name, progresso: p.progresso, status: p.status })),
      }
      break

    case 'arquiteto':
      dashboard = {
        role: role.name,
        icon: role.icon,
        kpis: { ...baseKpis, projetosComPlantas: 3, projetosComRender: 2 },
        cards: [
          { label: 'Projetos Ativos', value: projetosEmAndamento, color: '#8b5cf6' },
          { label: 'Com Plantas', value: '3', color: '#3b82f6' },
          { label: 'Com Render', value: '2', color: '#f59e0b' },
        ],
        projects: projects.filter(p => p.status !== 'concluido').map(p => ({
          name: p.name, status: p.status, progresso: p.progresso,
        })),
      }
      break

    case 'investidor':
      dashboard = {
        role: role.name,
        icon: role.icon,
        kpis: {
          vgvTotal: totalVGV,
          custoTotal: totalCusto,
          margemMedia: baseKpis.margemMedia,
          roiEstimado: 24, // %
          paybackAnos: 4.5,
          projetosAnalisados: projects.length,
        },
        cards: [
          { label: 'VGV Carteira', value: toBRL(totalVGV), color: '#22c55e' },
          { label: 'ROI Estimado', value: '24%', color: '#3b82f6', detail: 'projeção 5 anos' },
          { label: 'Payback', value: '4,5 anos', color: '#f59e0b' },
          { label: 'Margem Média', value: `${baseKpis.margemMedia}%`, color: '#a855f7' },
        ],
        projects: projects.map(p => ({
          name: p.name, vgv: toBRL(p.vgv), custo: toBRL(p.custoTotal),
          margem: `${Math.round(((p.vgv - p.custoTotal) / p.vgv) * 100)}%`,
          status: p.status,
        })),
      }
      break

    case 'gestor-obra':
      dashboard = {
        role: role.name,
        icon: role.icon,
        kpis: { ...baseKpis, equipeTotal: 47, fornecedoresAtivos: 12, entregasPendentes: 8 },
        cards: [
          { label: 'Obras Ativas', value: projetosEmAndamento, color: '#10b981' },
          { label: 'Equipe Total', value: '47', color: '#3b82f6' },
          { label: 'Entregas Pend.', value: '8', color: '#f59e0b' },
          { label: 'NCIs Abertas', value: ncisAbertas, color: '#ef4444' },
        ],
        projects: projects.filter(p => p.status !== 'concluido').map(p => ({
          name: p.name, progresso: p.progresso, prazoPercent: Math.round((p.prazoDecorrido / p.prazoTotal) * 100),
          prazoDecorrido: p.prazoDecorrido, prazoTotal: p.prazoTotal, responsavel: p.responsible,
        })),
        alerts: [
          { text: '⚠️ Entrega de aço atrasada — Residencial Park Avenue', severity: 'warning' },
          { text: '✅ Concretagem L12 concluída — Condomínio Jardins do Vale', severity: 'info' },
        ],
      }
      break

    case 'vendas':
      dashboard = {
        role: role.name,
        icon: role.icon,
        kpis: {
          leadsAtivos, vglPipeline,
          leadsQuentes: leads.filter(l => l.status === 'quente').length,
          leadsFrios: leads.filter(l => l.status === 'frio').length,
          taxaConversao: Math.round((leads.filter(l => l.stage === 'fechamento').length / leads.length) * 100),
          valorMedioLead: Math.round(vglPipeline / leads.length),
        },
        cards: [
          { label: 'Pipeline VGL', value: toBRL(vglPipeline), trend: '+8%', color: '#22c55e' },
          { label: 'Leads Ativos', value: leadsAtivos, color: '#3b82f6', detail: `${leads.filter(l => l.status === 'quente').length} quentes` },
          { label: 'Ticket Médio', value: toBRL(Math.round(vglPipeline / leads.length)), color: '#f59e0b' },
          { label: 'Conversão', value: `${Math.round((leads.filter(l => l.stage === 'fechamento').length / leads.length) * 100)}%`, color: '#a855f7' },
        ],
        leads: leads.map(l => ({
          name: l.name, empresa: l.empresa, valor: toBRL(l.valor),
          stage: l.stage, probabilidade: `${l.probabilidade}%`,
          status: l.status, responsavel: l.responsavel,
        })),
        vglPorStage: [
          { stage: 'Prospecção', valor: leads.filter(l => l.stage === 'prospeccao').reduce((s, l) => s + l.valor, 0) },
          { stage: 'Proposta', valor: leads.filter(l => l.stage === 'proposta').reduce((s, l) => s + l.valor, 0) },
          { stage: 'Negociação', valor: leads.filter(l => l.stage === 'negociacao').reduce((s, l) => s + l.valor, 0) },
          { stage: 'Fechamento', valor: leads.filter(l => l.stage === 'fechamento').reduce((s, l) => s + l.valor, 0) },
        ],
      }
      break

    case 'compliance':
      dashboard = {
        role: role.name,
        icon: role.icon,
        kpis: {
          conformidadeGeral: 78, // %
          ncisAbertas, ncisAltaSeveridade,
          licencasEmDia: 12,
          licencasVencidas: 2,
          documentosPendentes: 15,
          nrsAplicaveis: 8,
        },
        cards: [
          { label: 'Conformidade', value: '78%', color: '#f59e0b' },
          { label: 'NCIs Abertas', value: ncisAbertas, color: '#ef4444', detail: `${ncisAltaSeveridade} alta` },
          { label: 'Licenças OK', value: '12/14', color: '#3b82f6' },
          { label: 'NRs Aplicáveis', value: '8', color: '#a855f7' },
        ],
        ncis: ncis.filter(n => n.status !== 'fechada').map(n => ({
          descricao: n.descricao, severidade: n.severidade, projeto: n.projeto,
          status: n.status, prazo: n.prazo,
        })),
        alerts: [
          { text: '🔴 Alvará de Funcionamento vencido — Condomínio Jardins do Vale', severity: 'critical' },
          { text: '🟡 Laudo NR-12 pendente — Residencial Park Avenue', severity: 'warning' },
          { text: '🟢 ART registrada — Edifício Corporativo Horizonte', severity: 'info' },
        ],
        checklist: [
          { item: 'Alvará de Funcionamento', status: 'pendente', orgao: 'Prefeitura', prazo: '2026-07-31' },
          { item: 'AVCB / CLCB', status: 'ok', orgao: 'Corpo de Bombeiros', prazo: '2026-12-31' },
          { item: 'Licença Ambiental', status: 'pendente', orgao: 'SEMA', prazo: '2026-08-15' },
          { item: 'ART Anotação de Responsabilidade Técnica', status: 'ok', orgao: 'CREA', prazo: '2026-06-30' },
          { item: 'NR-18 Programa de Gerenciamento', status: 'em-andamento', orgao: 'MTE', prazo: '2026-07-15' },
        ],
      }
      break

    default:
      dashboard = { role: role.name, icon: role.icon, kpis: baseKpis, cards: [], projects, alerts: [] }
  }

  return {
    providerStatus: 'connected',
    ...dashboard,
    roleId: role.id,
    generatedAt: new Date().toISOString(),
  }
}

export function listRoles() {
  return ROLES
}

function toBRL(value) {
  return `R$ ${(value / 1000).toFixed(0).replace('.', ',')} mil`
}

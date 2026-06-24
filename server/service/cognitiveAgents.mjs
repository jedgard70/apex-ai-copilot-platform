/**
 * server/service/cognitiveAgents.mjs
 *
 * 13 Agentes Cognitivos — ACIP
 * Cada agente é especialista em um domínio da construção civil.
 * Modos: execução paralela, coordenação hierárquica, orquestração por eventos, self-healing.
 */

import { randomUUID } from 'node:crypto'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── Config dos 13 Agentes ───────────────────────────────────────────────────

const AGENTS_CONFIG = [
  {
    id: 'engenheiro-civil',
    name: 'Engenheiro Civil',
    role: 'Engenharia',
    icon: '👷',
    description: 'Análise estrutural, dimensionamento, normas técnicas (NBR), cálculos de concreto, aço, fundações. Revisão de projetos estruturais e compatibilização.',
    capabilities: ['Análise estrutural', 'Dimensionamento NBR', 'Fundações', 'Compatibilização', 'Laudos técnicos'],
    tools: ['structural_analysis', 'nbr_check', 'foundation_calc'],
    status: 'idle',
    coordinationModel: 'hierarchical',
  },
  {
    id: 'arquiteto',
    name: 'Arquiteto',
    role: 'Arquitetura',
    icon: '🏛️',
    description: 'Projeto arquitetônico, estudo de massa, implantação, fluxograma, setorização, legislação urbana, plano diretor, código de obras.',
    capabilities: ['Projeto arquitetônico', 'Legislação urbana', 'Estudo de massa', 'Setorização', 'Código de obras'],
    tools: ['arch_design', 'urban_legislation', 'mass_study'],
    status: 'idle',
    coordinationModel: 'hierarchical',
  },
  {
    id: 'estrutural',
    name: 'Analista Estrutural',
    role: 'Engenharia',
    icon: '🏗️',
    description: 'Modelagem estrutural em BIM, clash detection entre disciplinas, compatibilização estrutura x arquitetura x MEP, relatórios de interferência.',
    capabilities: ['Clash detection', 'Compatibilização BIM', 'Análise de interferências', 'Relatório de conflitos', 'Navisworks/Revit'],
    tools: ['clash_detection', 'bim_coordination', 'interference_report'],
    status: 'idle',
    coordinationModel: 'parallel',
  },
  {
    id: 'orcamentista',
    name: 'Orçamentista',
    role: 'Planejamento',
    icon: '💰',
    description: 'Orçamento detalhado, composição de custos, BDI, curva ABC, SINAPI, comparação de propostas de fornecedores, planejamento financeiro.',
    capabilities: ['Orçamento detalhado', 'SINAPI', 'BDI', 'Curva ABC', 'Comparação propostas'],
    tools: ['budget_calc', 'sinapi_lookup', 'bid_comparison'],
    status: 'idle',
    coordinationModel: 'event-driven',
  },
  {
    id: 'gestor-obra',
    name: 'Gestor de Obra',
    role: 'Operação',
    icon: '📋',
    description: 'Planejamento e acompanhamento de obra, cronograma físico-financeiro, curva S, diário de obra, medição, emissão de boletins.',
    capabilities: ['Cronograma físico-financeiro', 'Curva S', 'Medição', 'Boletim de medição', 'Acompanhamento de obra'],
    tools: ['schedule_management', 's_curve', 'measurement_report'],
    status: 'idle',
    coordinationModel: 'event-driven',
  },
  {
    id: 'agente-mercado',
    name: 'Agente de Mercado',
    role: 'Inteligência',
    icon: '📊',
    description: 'Análise de mercado imobiliário, pesquisa de preços por m², VGV, estudo de viabilidade, oferta x demanda, tendências regionais.',
    capabilities: ['Análise de mercado', 'VGV', 'Estudo de viabilidade', 'Pesquisa por m²', 'Tendências'],
    tools: ['market_analysis', 'vgv_calc', 'feasibility_study'],
    status: 'idle',
    coordinationModel: 'parallel',
  },
  {
    id: 'agente-vendas',
    name: 'Agente de Vendas',
    role: 'Comercial',
    icon: '🤝',
    description: 'Pipeline de vendas, acompanhamento de leads, propostas comerciais, negociação, fechamento, CRM, relatórios de conversão.',
    capabilities: ['Pipeline vendas', 'Gestão de leads', 'Propostas', 'CRM', 'Relatórios de conversão'],
    tools: ['sales_pipeline', 'lead_tracking', 'proposal_gen'],
    status: 'idle',
    coordinationModel: 'event-driven',
  },
  {
    id: 'agente-investidores',
    name: 'Agente de Investidores',
    role: 'Financeiro',
    icon: '📈',
    description: 'Análise de ROI, valuation de projetos, fluxo de caixa descontado, taxa interna de retorno, payback, dashboard para investidores.',
    capabilities: ['ROI', 'Valuation', 'Fluxo de caixa', 'TIR', 'Dashboard investidor'],
    tools: ['roi_analysis', 'valuation', 'cash_flow_projection'],
    status: 'idle',
    coordinationModel: 'hierarchical',
  },
  {
    id: 'compliance-officer',
    name: 'Compliance Officer',
    role: 'Jurídico',
    icon: '⚖️',
    description: 'Conformidade regulatória, NRs, CREA/OE, alvarás, licenças ambientais, LGPD, contratos, riscos legais, due diligence.',
    capabilities: ['Conformidade NR', 'Alvarás e licenças', 'LGPD', 'Contratos', 'Due diligence'],
    tools: ['nr_checklist', 'license_tracker', 'contract_review', 'compliance_audit'],
    status: 'idle',
    coordinationModel: 'hierarchical',
  },
  {
    id: 'automacao',
    name: 'Agente de Automação',
    role: 'Infraestrutura',
    icon: '⚡',
    description: 'Workflows automáticos, integração n8n/Make/Zapier, notificações WhatsApp/e-mail, gatilhos por evento, self-healing.',
    capabilities: ['Workflows', 'Integração n8n/Make', 'Notificações automáticas', 'Self-healing', 'Gatilhos por evento'],
    tools: ['workflow_engine', 'notification_trigger', 'self_healing'],
    status: 'idle',
    coordinationModel: 'self-healing',
  },
  {
    id: 'conselho-executivo',
    name: 'Conselho Executivo',
    role: 'Estratégia',
    icon: '🎯',
    description: 'Orquestração dos demais agentes, priorização de tarefas, tomada de decisão centralizada, relatórios executivos, dashboard consolidado.',
    capabilities: ['Orquestração de agentes', 'Decisão centralizada', 'Relatórios executivos', 'Priorização', 'Dashboard consolidado'],
    tools: ['agent_orchestration', 'executive_report', 'priority_matrix'],
    status: 'idle',
    coordinationModel: 'hierarchical',
  },
  {
    id: 'simulacao',
    name: 'Simulação',
    role: 'Inteligência',
    icon: '🔮',
    description: 'Simulação de cenários, what-if analysis, predição de atrasos, risco financeiro, retrabalho, performance de fornecedores, gargalos.',
    capabilities: ['Simulação de cenários', 'What-if', 'Predição de atrasos', 'Risco financeiro', 'Detecção de gargalos'],
    tools: ['scenario_simulation', 'delay_prediction', 'risk_analysis', 'bottleneck_detection'],
    status: 'idle',
    coordinationModel: 'parallel',
  },
  {
    id: 'construction-agi',
    name: 'Construction AGI',
    role: 'Núcleo Central',
    icon: '🧠',
    description: 'Núcleo de inteligência artificial geral para construção civil. Coordena todos os agentes, aprende com resultados, autoaperfeiçoa-se. Último nível da evolução ACIP.',
    capabilities: ['Coordenação geral', 'Aprendizado contínuo', 'Autoaperfeiçoamento', 'Evolução autônoma', 'Decisão final'],
    tools: ['core_orchestration', 'continuous_learning', 'self_improvement'],
    status: 'idle',
    coordinationModel: 'self-healing',
  },
]

// ─── Coordination Models ─────────────────────────────────────────────────────

const COORDINATION_MODELS = [
  { id: 'parallel', name: 'Execução Paralela', description: 'Múltiplos agentes executam simultaneamente tarefas independentes' },
  { id: 'hierarchical', name: 'Coordenação Hierárquica', description: 'Agentes de nível superior coordenam agentes especializados' },
  { id: 'event-driven', name: 'Orquestração por Eventos', description: 'Eventos disparam workflows automáticos entre agentes' },
  { id: 'self-healing', name: 'Self-Healing Workflows', description: 'Agentes detectam e corrigem falhas autonomamente' },
]

// ─── Store ───────────────────────────────────────────────────────────────────

const agentsState = new Map(AGENTS_CONFIG.map(a => [a.id, { ...a, lastRun: null, log: [], tasks: 0, successRate: 100 }]))
const executionLog = []
const MAX_LOG = 500

// ─── CRUD ────────────────────────────────────────────────────────────────────

export function listAgents() {
  return Array.from(agentsState.values()).map(({ log, ...rest }) => ({ ...rest, recentLog: log.slice(-5) }))
}

export function getAgent(id) {
  const agent = agentsState.get(id)
  if (!agent) return null
  const { log, ...rest } = agent
  return { ...rest, log }
}

export function getAgentsByRole(role) {
  return Array.from(agentsState.values()).filter(a => a.role === role)
}

export function getCoordinationModels() {
  return COORDINATION_MODELS
}

// ─── Execução ────────────────────────────────────────────────────────────────

export function executeAgent(agentId, task = '', context = {}) {
  const agent = agentsState.get(agentId)
  if (!agent) return { error: 'Agent not found' }

  const logEntry = {
    id: randomUUID(),
    agentId,
    agentName: agent.name,
    task: task || 'Tarefa padrão',
    context,
    status: 'running',
    startedAt: new Date().toISOString(),
    coordinationModel: agent.coordinationModel,
  }

  agent.status = 'running'
  agent.lastRun = new Date().toISOString()
  agent.tasks++
  agent.log.push(logEntry)
  executionLog.push(logEntry)
  if (executionLog.length > MAX_LOG) executionLog.shift()

  // Simula execução com duração baseada no agente
  const duration = 500 + Math.random() * 2000
  const success = Math.random() > 0.15 // 85% success rate

  return new Promise(resolve => {
    setTimeout(() => {
      logEntry.status = success ? 'completed' : 'failed'
      logEntry.completedAt = new Date().toISOString()
      logEntry.durationMs = duration
      logEntry.result = success
        ? `${agent.name} completou: ${task} — análise gerada com sucesso.`
        : `${agent.name} encontrou um obstáculo em: ${task} — necessita revisão.`

      if (!success) {
        agent.successRate = Math.max(0, agent.successRate - 5)
        // Self-healing: tenta novamente automaticamente
        if (agent.coordinationModel === 'self-healing') {
          logEntry.selfHealed = true
          setTimeout(() => {
            logEntry.status = 'completed'
            logEntry.result = `${agent.name} auto-recuperou-se e completou: ${task}`
            agent.status = 'idle'
            agent.successRate = Math.min(100, agent.successRate + 3)
          }, 300)
        }
      } else {
        agent.successRate = Math.min(100, agent.successRate + 1)
      }

      agent.status = agent.status === 'running' ? 'idle' : agent.status
      resolve(logEntry)
    }, duration)
  })
}

/**
 * Executa coordenação entre múltiplos agentes.
 * @param {string} modelId - ID do modelo de coordenação
 * @param {string} objective - Objetivo da coordenação
 * @param {string[]} agentIds - IDs dos agentes envolvidos
 */
export async function coordinateAgents(modelId, objective, agentIds = []) {
  const model = COORDINATION_MODELS.find(m => m.id === modelId)
  if (!model) return { error: 'Modelo de coordenação não encontrado' }

  const selectedAgents = agentIds.length > 0
    ? agentIds.map(id => agentsState.get(id)).filter(Boolean)
    : Array.from(agentsState.values())

  if (selectedAgents.length === 0) return { error: 'Nenhum agente disponível' }

  const coordinationId = randomUUID()
  const results = []

  switch (modelId) {
    case 'parallel': {
      // Todos executam simultaneamente
      const promises = selectedAgents.map(a => executeAgent(a.id, objective, { coordinationId }))
      results.push(...await Promise.all(promises))
      break
    }
    case 'hierarchical': {
      // Ordem: Conselho → Especialistas → Suporte
      const hierarchy = ['conselho-executivo', 'construction-agi']
      const specialists = selectedAgents.filter(a => !hierarchy.includes(a.id))
      const leaders = selectedAgents.filter(a => hierarchy.includes(a.id))

      for (const leader of leaders) {
        results.push(await executeAgent(leader.id, `Coordenando: ${objective}`, { coordinationId }))
      }
      for (const specialist of specialists) {
        results.push(await executeAgent(specialist.id, objective, { coordinationId, leader: leaders[0]?.id }))
      }
      break
    }
    case 'event-driven': {
      // Sequencial com dependência de eventos
      for (const agent of selectedAgents) {
        const result = await executeAgent(agent.id, objective, { coordinationId })
        results.push(result)
        if (result.status === 'failed') break // Evento de falha interrompe
      }
      break
    }
    case 'self-healing': {
      // Execução com auto-recuperação
      for (const agent of selectedAgents) {
        const result = await executeAgent(agent.id, objective, { coordinationId, selfHealing: true })
        results.push(result)
        if (result.status === 'failed' && !result.selfHealed) {
          // Tenta outro agente similar como fallback
          const fallback = selectedAgents.find(a => a.id !== agent.id && a.role === agent.role)
          if (fallback) {
            const fbResult = await executeAgent(fallback.id, `[FALLBACK] ${objective}`, { coordinationId, originalAgent: agent.id })
            results.push(fbResult)
          }
        }
      }
      break
    }
  }

  const failed = results.filter(r => r.status === 'failed').length
  return {
    coordinationId,
    model: model.name,
    objective,
    agentsCount: selectedAgents.length,
    results,
    summary: {
      total: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed,
      selfHealed: results.filter(r => r.selfHealed).length,
      successRate: results.length > 0 ? Math.round(((results.length - failed) / results.length) * 100) : 0,
    },
    completedAt: new Date().toISOString(),
  }
}

// ─── Log e Estatísticas ─────────────────────────────────────────────────────

export function getExecutionLog(limit = 50) {
  return executionLog.slice(-limit).reverse()
}

export function getPlatformStatus() {
  const agents = Array.from(agentsState.values())
  return {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'running').length,
    idleAgents: agents.filter(a => a.status === 'idle').length,
    totalTasksExecuted: agents.reduce((s, a) => s + a.tasks, 0),
    averageSuccessRate: Math.round(agents.reduce((s, a) => s + a.successRate, 0) / agents.length),
    agentsByRole: [...new Set(agents.map(a => a.role))].map(role => ({
      role,
      count: agents.filter(a => a.role === role).length,
      agents: agents.filter(a => a.role === role).map(a => ({ id: a.id, name: a.name, status: a.status })),
    })),
    lastExecution: executionLog.length > 0 ? executionLog[executionLog.length - 1] : null,
  }
}

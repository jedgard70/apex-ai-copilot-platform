/**
 * server/service/workflowTasks.mjs — ACIP
 * Tarefas de workflow com assignee, prazo, prioridade e status
 */

let TASKS = [
  { id: 'task-1', titulo: 'Compatibilizar estrutura com shaft elevador', descricao: 'Reunião de compatibilização entre equipe estrutural e arquitetura para resolver conflito no shaft do elevador.', projeto: 'Residencial Park Avenue', assignee: 'Eng. Silva', prioridade: 'alta', status: 'em-andamento', dataCriacao: '2026-06-10', dataVencimento: '2026-07-15', categoria: 'bim', horasEstimadas: 8, horasGastas: 3 },
  { id: 'task-2', titulo: 'Emitir ART de fundações', descricao: 'Providenciar Anotação de Responsabilidade Técnica para o serviço de fundações junto ao CREA.', projeto: 'Condomínio Jardins do Vale', assignee: 'Dr. Edgard', prioridade: 'alta', status: 'pendente', dataCriacao: '2026-06-12', dataVencimento: '2026-07-01', categoria: 'documentacao', horasEstimadas: 2, horasGastas: 0 },
  { id: 'task-3', titulo: 'Elaborar cronograma físico-financeiro', descricao: 'Criar cronograma detalhado com marcos, entregas e desembolsos mensais para aprovação do cliente.', projeto: 'Edifício Corporativo Horizonte', assignee: 'Arq. Costa', prioridade: 'media', status: 'pendente', dataCriacao: '2026-06-15', dataVencimento: '2026-07-10', categoria: 'planejamento', horasEstimadas: 16, horasGastas: 0 },
  { id: 'task-4', titulo: 'Vistoria técnica de concretagem L12', descricao: 'Acompanhar concretagem da laje L12, verificar cobrimento, escoramento e coleta de corpos de prova.', projeto: 'Condomínio Jardins do Vale', assignee: 'Eng. Silva', prioridade: 'alta', status: 'concluida', dataCriacao: '2026-06-08', dataVencimento: '2026-06-22', dataConclusao: '2026-06-22', categoria: 'campo', horasEstimadas: 4, horasGastas: 5 },
  { id: 'task-5', titulo: 'Enviar proposta comercial revisada', descricao: 'Cliente solicitou ajustes na proposta. Atualizar valores e condições de pagamento conforme reunião.', projeto: 'Residencial Park Avenue', assignee: 'Maria Vendas', prioridade: 'media', status: 'pendente', dataCriacao: '2026-06-20', dataVencimento: '2026-06-28', categoria: 'comercial', horasEstimadas: 3, horasGastas: 1 },
  { id: 'task-6', titulo: 'Atualizar modelo BIM com correções', descricao: 'Incorporar correções de clash detection no modelo BIM antes da próxima reunião de compatibilização.', projeto: 'Residencial Park Avenue', assignee: 'Arq. Costa', prioridade: 'alta', status: 'em-andamento', dataCriacao: '2026-06-18', dataVencimento: '2026-07-05', categoria: 'bim', horasEstimadas: 12, horasGastas: 4 },
  { id: 'task-7', titulo: 'Auditoria de segurança NR-18', descricao: 'Realizar auditoria de segurança do trabalho conforme NR-18. Gerar relatório de não-conformidades.', projeto: 'Condomínio Jardins do Vale', assignee: 'Dr. Edgard', prioridade: 'alta', status: 'pendente', dataCriacao: '2026-06-22', dataVencimento: '2026-07-10', categoria: 'seguranca', horasEstimadas: 6, horasGastas: 0 },
  { id: 'task-8', titulo: 'Orçamento de materiais elétricos', descricao: 'Levantar quantitativos e solicitar cotações de materiais elétricos para a próxima etapa.', projeto: 'Edifício Corporativo Horizonte', assignee: 'Eng. Silva', prioridade: 'baixa', status: 'pendente', dataCriacao: '2026-06-23', dataVencimento: '2026-07-20', categoria: 'suprimentos', horasEstimadas: 8, horasGastas: 0 },
]

export function listTasks(projeto, assignee, status, prioridade) {
  return TASKS.filter(t => {
    if (projeto && t.projeto !== projeto) return false
    if (assignee && t.assignee !== assignee) return false
    if (status && t.status !== status) return false
    if (prioridade && t.prioridade !== prioridade) return false
    return true
  })
}

export function getTask(id) { return TASKS.find(t => t.id === id) || null }

export function createTask(data) {
  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const task = { id, titulo: String(data.titulo || '').trim(), descricao: String(data.descricao || '').trim(), projeto: String(data.projeto || '').trim(), assignee: String(data.assignee || '').trim(), prioridade: data.prioridade || 'media', status: 'pendente', dataCriacao: new Date().toISOString().slice(0, 10), dataVencimento: data.dataVencimento || '', categoria: data.categoria || 'geral', horasEstimadas: Number(data.horasEstimadas) || 0, horasGastas: 0 }
  TASKS.push(task)
  return task
}

export function updateTaskStatus(id, status, horasGastas) {
  const task = TASKS.find(t => t.id === id)
  if (!task) return null
  task.status = status
  if (status === 'concluida') task.dataConclusao = new Date().toISOString().slice(0, 10)
  if (horasGastas) task.horasGastas += Number(horasGastas)
  return task
}

export function getKPIs() {
  return {
    total: TASKS.length,
    pendentes: TASKS.filter(t => t.status === 'pendente').length,
    emAndamento: TASKS.filter(t => t.status === 'em-andamento').length,
    concluidas: TASKS.filter(t => t.status === 'concluida').length,
    altaPrioridade: TASKS.filter(t => t.prioridade === 'alta' && t.status !== 'concluida').length,
    horasEstimadas: TASKS.reduce((s, t) => s + t.horasEstimadas, 0),
    horasGastas: TASKS.reduce((s, t) => s + t.horasGastas, 0),
    atrasadas: TASKS.filter(t => t.status !== 'concluida' && t.dataVencimento && t.dataVencimento < new Date().toISOString().slice(0, 10)).length,
    porAssignee: [...new Set(TASKS.map(t => t.assignee))].map(a => ({ assignee: a, count: TASKS.filter(t => t.assignee === a && t.status !== 'concluida').length })),
  }
}

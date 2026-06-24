/**
 * server/service/qualidadeNCIs.mjs
 *
 * Qualidade / NCIs — ACIP
 * Checklists de conformidade e Não-Conformidades com severidade
 */

const NCI_LIST = [
  { id: 'nci-1', descricao: 'Armadura incorreta na viga V12 - bitola menor que projeto', severidade: 'alta', projeto: 'Residencial Park Avenue', origem: 'insp', responsavel: 'Eng. Silva', prazo: '2026-07-15', status: 'aberta', dataAbertura: '2026-06-10', dataFechamento: null, categoria: 'estrutural', observacoes: 'Fazer ensaio de tração para confirmar', anexos: [] },
  { id: 'nci-2', descricao: 'Contraverga em janela J5 não executada conforme NBR', severidade: 'media', projeto: 'Condomínio Jardins do Vale', origem: 'qualidade', responsavel: 'Arq. Costa', prazo: '2026-07-10', status: 'em-tratamento', dataAbertura: '2026-06-12', dataFechamento: null, categoria: 'arquitetura', observacoes: 'Fornecedor notificado. Executar em 7 dias.', anexos: [] },
  { id: 'nci-3', descricao: 'Prumo da parede P23 fora da tolerância (15mm)', severidade: 'alta', projeto: 'Residencial Park Avenue', origem: 'topografia', responsavel: 'Dr. Edgard', prazo: '2026-06-30', status: 'aberta', dataAbertura: '2026-06-08', dataFechamento: null, categoria: 'estrutural', observacoes: 'Aguardando contraprova da equipe de obra', anexos: [] },
  { id: 'nci-4', descricao: 'Juntas de dilatação executadas com espaçamento incorreto', severidade: 'baixa', projeto: 'Edifício Corporativo Horizonte', origem: 'qualidade', responsavel: 'Eng. Silva', prazo: '2026-06-01', status: 'fechada', dataAbertura: '2026-05-20', dataFechamento: '2026-06-01', categoria: 'estrutural', observacoes: 'Corrigido conforme recomendação técnica', anexos: [] },
  { id: 'nci-5', descricao: 'Tubulação de esgoto com inclinação abaixo do mínimo', severidade: 'alta', projeto: 'Condomínio Jardins do Vale', origem: 'insp', responsavel: 'Eng. Silva', prazo: '2026-07-20', status: 'aberta', dataAbertura: '2026-06-15', dataFechamento: null, categoria: 'hidro', observacoes: 'Re fazer trecho de 6m', anexos: [] },
  { id: 'nci-6', descricao: 'Chapisco não executado antes do reboco', severidade: 'media', projeto: 'Residencial Park Avenue', origem: 'qualidade', responsavel: 'Arq. Costa', prazo: '2026-07-05', status: 'em-tratamento', dataAbertura: '2026-06-18', dataFechamento: null, categoria: 'acabamento', observacoes: 'Programar execução antes do reboco', anexos: [] },
]

const CHECKLISTS = [
  { id: 'cl-1', nome: 'Checklist de Fundações', projeto: 'Residencial Park Avenue', itens: 12, conformes: 9, naoConformes: 2, naoAplicaveis: 1, status: 'parcial', data: '2026-06-20', responsavel: 'Eng. Silva', categoria: 'estrutural', observacoes: 'Itens NCI gerados.' },
  { id: 'cl-2', nome: 'Checklist de Estrutura', projeto: 'Condomínio Jardins do Vale', itens: 18, conformes: 15, naoConformes: 2, naoAplicaveis: 1, status: 'parcial', data: '2026-06-18', responsavel: 'Eng. Silva', categoria: 'estrutural', observacoes: '' },
  { id: 'cl-3', nome: 'Checklist de Alvenaria', projeto: 'Residencial Park Avenue', itens: 10, conformes: 10, naoConformes: 0, naoAplicaveis: 0, status: 'conforme', data: '2026-06-22', responsavel: 'Arq. Costa', categoria: 'arquitetura', observacoes: 'Tudo OK' },
  { id: 'cl-4', nome: 'Checklist de Instalações', projeto: 'Edifício Corporativo Horizonte', itens: 15, conformes: 8, naoConformes: 5, naoAplicaveis: 2, status: 'parcial', data: '2026-06-15', responsavel: 'Eng. Silva', categoria: 'mep', observacoes: 'Diversos pontos de atenção' },
  { id: 'cl-5', nome: 'Checklist de Segurança (NR-18)', projeto: 'Condomínio Jardins do Vale', itens: 20, conformes: 16, naoConformes: 3, naoAplicaveis: 1, status: 'parcial', data: '2026-06-21', responsavel: 'Dr. Edgard', categoria: 'seguranca', observacoes: 'Gerar NCIs para itens não conformes' },
  { id: 'cl-6', nome: 'Checklist de Recebimento de Materiais', projeto: 'Residencial Park Avenue', itens: 8, conformes: 8, naoConformes: 0, naoAplicaveis: 0, status: 'conforme', data: '2026-06-23', responsavel: 'Almoxarife', categoria: 'suprimentos', observacoes: '' },
]

const CATEGORIAS = ['estrutural', 'arquitetura', 'mep', 'hidro', 'acabamento', 'seguranca', 'suprimentos']
const SEVERIDADES = ['alta', 'media', 'baixa']

export function listNCIs(severidade, categoria, status) {
  return NCI_LIST.filter(n => {
    if (severidade && n.severidade !== severidade) return false
    if (categoria && n.categoria !== categoria) return false
    if (status && n.status !== status) return false
    return true
  })
}

export function getNCI(id) { return NCI_LIST.find(n => n.id === id) || null }

export function createNCI(data) {
  const id = `nci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const nci = { id, descricao: String(data.descricao || '').trim(), severidade: data.severidade || 'media', projeto: String(data.projeto || '').trim(), origem: 'manual', responsavel: String(data.responsavel || '').trim(), prazo: data.prazo || '', status: 'aberta', dataAbertura: new Date().toISOString().slice(0, 10), dataFechamento: null, categoria: data.categoria || 'estrutural', observacoes: String(data.observacoes || '').trim(), anexos: [] }
  NCI_LIST.push(nci)
  return nci
}

export function updateNCIStatus(id, status, observacoes) {
  const nci = NCI_LIST.find(n => n.id === id)
  if (!nci) return null
  nci.status = status
  nci.dataFechamento = status === 'fechada' ? new Date().toISOString().slice(0, 10) : null
  if (observacoes) nci.observacoes += `\n[${new Date().toISOString().slice(0, 10)}] ${observacoes}`
  return nci
}

export function listChecklists(projeto, categoria) {
  return CHECKLISTS.filter(c => {
    if (projeto && c.projeto !== projeto) return false
    if (categoria && c.categoria !== categoria) return false
    return true
  })
}

export function getChecklist(id) { return CHECKLISTS.find(c => c.id === id) || null }

export function createChecklist(data) {
  const id = `cl-${Date.now()}`
  const total = Number(data.itens) || 1
  const conformes = Number(data.conformes) || 0
  const cl = { id, nome: String(data.nome || '').trim(), projeto: String(data.projeto || '').trim(), itens: total, conformes, naoConformes: Number(data.naoConformes) || 0, naoAplicaveis: total - conformes - (Number(data.naoConformes) || 0), status: total === conformes ? 'conforme' : 'parcial', data: new Date().toISOString().slice(0, 10), responsavel: String(data.responsavel || '').trim(), categoria: data.categoria || 'geral', observacoes: String(data.observacoes || '').trim() }
  CHECKLISTS.push(cl)
  return cl
}

export function getKPIs() {
  const ncisAbertas = NCI_LIST.filter(n => n.status !== 'fechada')
  const ncisAltas = ncisAbertas.filter(n => n.severidade === 'alta')
  const totalCL = CHECKLISTS.length
  const conformesCL = CHECKLISTS.filter(c => c.status === 'conforme').length
  return {
    totalNCIs: NCI_LIST.length,
    ncisAbertas: ncisAbertas.length,
    ncisAltas: ncisAltas.length,
    nciasEmTratamento: NCI_LIST.filter(n => n.status === 'em-tratamento').length,
    ncisFechadas: NCI_LIST.filter(n => n.status === 'fechada').length,
    totalChecklists: totalCL,
    checklistsConformes: conformesCL,
    conformidadeGeral: totalCL > 0 ? Math.round((conformesCL / totalCL) * 100) : 0,
    porSeveridade: SEVERIDADES.map(s => ({ severidade: s, count: NCI_LIST.filter(n => n.severidade === s).length })),
    porCategoria: CATEGORIAS.map(c => ({ categoria: c, count: NCI_LIST.filter(n => n.categoria === c).length })),
    ncisPorProjeto: [...new Set(NCI_LIST.map(n => n.projeto))].map(p => ({ projeto: p, count: NCI_LIST.filter(n => n.projeto === p && n.status !== 'fechada').length })),
  }
}

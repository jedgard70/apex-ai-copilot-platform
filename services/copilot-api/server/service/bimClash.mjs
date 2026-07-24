/**
 * server/service/bimClash.mjs
 *
 * BIM Clash Detection — ACIP
 * Detecção de conflitos entre disciplinas (estrutura, arquitetura, MEP)
 * Compatível com Revit, Navisworks, Tekla, ArchiCAD, Solibri
 */

const CLASHES = [
  { id: 'clash-001', titulo: 'Viga V12 conflita com shaft do elevador', disciplina1: 'Estrutural', disciplina2: 'Arquitetura', severidade: 'critical', localizacao: 'Eixo 4/C - Pavimento 8', status: 'aberto', dataDescoberta: '2026-06-10', responsavel: 'Eng. Silva', prazo: '2026-07-15', observacoes: 'Shaft foi reposicionado sem comunicar estrutural. Necessita reunião de compatibilização.', modelo: 'Residencial Park Avenue', origem: 'navisworks' },
  { id: 'clash-002', titulo: 'Duto de ar-condicionado interfere com sprinkler', disciplina1: 'MEP', disciplina2: 'Hidrossanitário', severidade: 'high', localizacao: 'Eixo 2/B - Pavimento 5', status: 'aberto', dataDescoberta: '2026-06-12', responsavel: 'Arq. Costa', prazo: '2026-07-10', observacoes: 'Ambos foram lançados sem coordenação. Resolver com prioridade.', modelo: 'Residencial Park Avenue', origem: 'solibri' },
  { id: 'clash-003', titulo: 'Pilar P15 invade corredor de circulação', disciplina1: 'Estrutural', disciplina2: 'Arquitetura', severidade: 'critical', localizacao: 'Eixo 5/D - Pavimento 3', status: 'em-andamento', dataDescoberta: '2026-06-08', responsavel: 'Eng. Silva', prazo: '2026-07-01', observacoes: 'Arquitetura vai ajustar o layout do corredor conforme nova posição do pilar.', modelo: 'Residencial Park Avenue', origem: 'revit' },
  { id: 'clash-004', titulo: 'Tubulação de esgoto cruza viga de transição', disciplina1: 'Hidrossanitário', disciplina2: 'Estrutural', severidade: 'high', localizacao: 'Eixo 3/C - Pavimento 2', status: 'aberto', dataDescoberta: '2026-06-15', responsavel: 'Eng. Silva', prazo: '2026-07-20', observacoes: 'Necessitará de reforço estrutural ou alteração do traçado da tubulação.', modelo: 'Condomínio Jardins do Vale', origem: 'tecla' },
  { id: 'clash-005', titulo: 'Laje L22 difere da arquitetura em 15cm', disciplina1: 'Estrutural', disciplina2: 'Arquitetura', severidade: 'medium', localizacao: 'Eixo 1/A - Pavimento 7', status: 'fechado', dataDescoberta: '2026-05-20', responsavel: 'Eng. Silva', prazo: '2026-06-15', observacoes: 'Resolvido - arquitetura ajustou o projeto.', modelo: 'Edifício Corporativo Horizonte', origem: 'archicad' },
  { id: 'clash-006', titulo: 'Quadro elétrico posicionado atrás de porta', disciplina1: 'MEP', disciplina2: 'Arquitetura', severidade: 'medium', localizacao: 'Sala 512 - Pavimento 5', status: 'aberto', dataDescoberta: '2026-06-18', responsavel: 'Arq. Costa', prazo: '2026-07-05', observacoes: 'Reposicionar quadro ou alterar sentido de abertura da porta.', modelo: 'Condomínio Jardins do Vale', origem: 'revit' },
  { id: 'clash-007', titulo: 'Elemento de fachada conflita com estrutura metálica', disciplina1: 'Arquitetura', disciplina2: 'Estrutural', severidade: 'high', localizacao: 'Fachada Leste - Eixo A', status: 'em-andamento', dataDescoberta: '2026-06-14', responsavel: 'Dr. Edgard', prazo: '2026-07-12', observacoes: 'Aguardando definição do fornecedor da fachada.', modelo: 'Residencial Park Avenue', origem: 'navisworks' },
  { id: 'clash-008', titulo: 'Sistema de exaustão conflita com duto de incêndio', disciplina1: 'MEP', disciplina2: 'MEP', severidade: 'critical', localizacao: 'Eixo 6/B - Pavimento 10', status: 'aberto', dataDescoberta: '2026-06-20', responsavel: 'Eng. Silva', prazo: '2026-07-25', observacoes: 'Ambos os sistemas compartilham o mesmo shaft. Revisão emergencial.', modelo: 'Edifício Corporativo Horizonte', origem: 'solibri' },
]

const DISCIPLINAS = ['Estrutural', 'Arquitetura', 'MEP', 'Hidrossanitário', 'Elétrica', 'Fundações']
const ORIGENS = ['revit', 'navisworks', 'tecla', 'archicad', 'solibri', 'acc']
const SEVERIDADES = ['critical', 'high', 'medium', 'low']
const STATUS_LIST = ['aberto', 'em-andamento', 'fechado']

export function listClashes(disciplinaFilter, severidadeFilter, statusFilter) {
  let filtered = [...CLASHES]
  if (disciplinaFilter) filtered = filtered.filter(c => c.disciplina1 === disciplinaFilter || c.disciplina2 === disciplinaFilter)
  if (severidadeFilter) filtered = filtered.filter(c => c.severidade === severidadeFilter)
  if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter)
  return filtered
}

export function getClash(id) { return CLASHES.find(c => c.id === id) || null }

export function createClash(data) {
  const id = `clash-${String(CLASHES.length + 1).padStart(3, '0')}`
  const clash = {
    id, titulo: String(data.titulo || '').trim(),
    disciplina1: data.disciplina1 || 'Estrutural',
    disciplina2: data.disciplina2 || 'Arquitetura',
    severidade: data.severidade || 'medium',
    localizacao: String(data.localizacao || '').trim(),
    status: 'aberto',
    dataDescoberta: new Date().toISOString().slice(0, 10),
    responsavel: String(data.responsavel || '').trim(),
    prazo: data.prazo || '',
    observacoes: String(data.observacoes || '').trim(),
    modelo: String(data.modelo || '').trim(),
    origem: data.origem || 'manual',
  }
  CLASHES.push(clash)
  return clash
}

export function updateClashStatus(id, newStatus, observacoes) {
  const clash = CLASHES.find(c => c.id === id)
  if (!clash || !STATUS_LIST.includes(newStatus)) return null
  clash.status = newStatus
  if (observacoes) clash.observacoes += `\n[${new Date().toISOString().slice(0, 10)}] ${observacoes}`
  return clash
}

export function deleteClash(id) {
  const idx = CLASHES.findIndex(c => c.id === id)
  if (idx === -1) return false
  CLASHES.splice(idx, 1)
  return true
}

export function getKPIs() {
  return {
    total: CLASHES.length,
    abertos: CLASHES.filter(c => c.status === 'aberto').length,
    emAndamento: CLASHES.filter(c => c.status === 'em-andamento').length,
    fechados: CLASHES.filter(c => c.status === 'fechado').length,
    porSeveridade: SEVERIDADES.map(s => ({ severidade: s, count: CLASHES.filter(c => c.severidade === s).length })),
    porDisciplina: DISCIPLINAS.map(d => ({ disciplina: d, count: CLASHES.filter(c => c.disciplina1 === d || c.disciplina2 === d).length })),
    porOrigem: ORIGENS.map(o => ({ origem: o, count: CLASHES.filter(c => c.origem === o).length })),
    criticalAbertos: CLASHES.filter(c => c.severidade === 'critical' && c.status !== 'fechado').length,
    semResponsavel: CLASHES.filter(c => !c.responsavel).length,
    mediaDiasAberto: Math.round(CLASHES.filter(c => c.status !== 'fechado').reduce((s, c) => {
      const dias = (new Date().getTime() - new Date(c.dataDescoberta).getTime()) / 86400000
      return s + dias
    }, 0) / Math.max(1, CLASHES.filter(c => c.status !== 'fechado').length)),
  }
}

export function getReferencias() {
  return [
    { ferramenta: 'Revit', tipo: 'Modelagem BIM', conexao: 'api/aps/', suportaClash: true },
    { ferramenta: 'Navisworks', tipo: 'Clash Detection', conexao: 'Importar NWC', suportaClash: true },
    { ferramenta: 'Tekla Structures', tipo: 'Detalhamento', conexao: 'IFC/ Tekla API', suportaClash: true },
    { ferramenta: 'ArchiCAD', tipo: 'Modelagem BIM', conexao: 'IFC/ BIMx', suportaClash: true },
    { ferramenta: 'Solibri Office', tipo: 'Auditoria BIM', conexao: 'IFC', suportaClash: true },
    { ferramenta: 'ACC (Autodesk)', tipo: 'Colaboração', conexao: 'api/aps/', suportaClash: true },
  ]
}

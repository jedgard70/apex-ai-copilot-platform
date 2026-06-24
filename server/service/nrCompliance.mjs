/**
 * server/service/nrCompliance.mjs
 *
 * NR Compliance — documentacao e formularios para normas regulamentadoras.
 * CREA (Brasil) / OE (Europa) / CRC (Contabilidade)
 * Gera documentos prontos para assinatura do responsavel tecnico.
 */

const PROJECTS = new Map()

export const NR_LIST = [
  { nr: 'NR-6', name: 'Equipamentos de Proteção Individual - EPI', description: 'Fornecimento, treinamento e fiscalização de EPIs' },
  { nr: 'NR-10', name: 'Segurança em Instalações e Serviços em Eletricidade', description: 'Medidas de controle e segurança em eletricidade' },
  { nr: 'NR-18', name: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção', description: 'PCMAT, áreas de vivência, transporte vertical' },
  { nr: 'NR-33', name: 'Segurança e Saúde nos Trabalhos em Espaços Confinados', description: 'Procedimentos para entrada em espaços confinados' },
  { nr: 'NR-35', name: 'Trabalho em Altura', description: 'Procedimentos, ancoragem, treinamento para trabalho em altura' },
  { nr: 'NR-7', name: 'Programa de Controle Médico de Saúde Ocupacional - PCMSO', description: 'Exames médicos ocupacionais' },
  { nr: 'NR-9', name: 'Programa de Prevenção de Riscos Ambientais - PPRA', description: 'Identificação e controle de riscos ambientais' },
  { nr: 'NR-12', name: 'Segurança no Trabalho em Máquinas e Equipamentos', description: 'Medidas de proteção para máquinas' },
]

export function createNRProject(data) {
  const id = `nr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const project = {
    id, status: 'draft',
    companyName: String(data.companyName || '').trim(),
    cnpj: String(data.cnpj || '').trim(),
    address: String(data.address || '').trim(),
    responsibleEngineer: String(data.responsibleEngineer || 'Dr. Edgard').trim(),
    creaOrOe: String(data.creaOrOe || '').trim(),
    nrs: Array.isArray(data.nrs) ? data.nrs : [],
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  PROJECTS.set(id, project)
  return project
}

export function getNRProject(id) { return PROJECTS.get(id) || null }
export function listNRProjects() {
  return Array.from(PROJECTS.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function generateNRDocument(projectId) {
  const p = PROJECTS.get(projectId)
  if (!p) return null

  const docs = p.nrs.map(nr => {
    const info = NR_LIST.find(n => n.nr === nr) || { nr, name: nr, description: '' }
    return {
      nr: info.nr,
      title: `Documento de Conformidade - ${info.name}`,
      content: [
        `===========================================`,
        `DOCUMENTO DE CONFORMIDADE - ${info.nr}`,
        `===========================================`,
        ``,
        `Empresa: ${p.companyName}`,
        `CNPJ: ${p.cnpj}`,
        `Endereço: ${p.address}`,
        `Responsável Técnico: ${p.responsibleEngineer}`,
        `CREA/OE: ${p.creaOrOe}`,
        `Data: ${new Date().toLocaleDateString('pt-BR')}`,
        ``,
        `---`,
        `1. OBJETIVO`,
        info.description,
        ``,
        `2. RESPONSABILIDADES`,
        `O responsável técnico ${p.responsibleEngineer}, CREA/OE ${p.creaOrOe}, assume a responsabilidade técnica pela implementação e manutenção das diretrizes da ${info.nr}.`,
        ``,
        `3. DOCUMENTAÇÃO APLICÁVEL`,
        `- Check-list de conformidade`,
        `- Termo de responsabilidade técnica`,
        `- ART (Anotação de Responsabilidade Técnica)`,
        `- Cronograma de implementação`,
        ``,
        `4. DECLARAÇÃO`,
        `Declaro, para os devidos fins, que o conteúdo deste documento reflete as exigências da ${info.nr} e que assumo a responsabilidade técnica pela sua implementação.`,
        ``,
        `____________________________________`,
        p.responsibleEngineer,
        `CREA/OE: ${p.creaOrOe}`,
        ``,
        `Documento gerado em ${new Date().toISOString()}`,
        `Assinatura digital pendente`,
      ].join('\n'),
      status: 'pending-signature',
      generatedAt: new Date().toISOString(),
    }
  })

  p.documents = docs
  p.status = 'documents-generated'
  p.updatedAt = new Date().toISOString()
  PROJECTS.set(projectId, p)
  return docs
}

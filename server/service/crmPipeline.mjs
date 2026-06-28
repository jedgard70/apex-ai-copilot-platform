/**
 * server/service/crmPipeline.mjs
 *
 * CRM Pipeline ACIP — Gestão de leads com estágios
 * Prospecção → Proposta → Negociação → Fechamento
 * KPIs em tempo real, VGL por estágio, probabilidade
 */

import fs from 'fs'
import path from 'path'
import { GoogleGenAI } from '@google/genai'

const STAGES = [
  { id: 'prospeccao', name: 'Prospecção', color: '#6b7280', icon: '🔍', probability: 15 },
  { id: 'qualificacao', name: 'Qualificação', color: '#3b82f6', icon: '📋', probability: 30 },
  { id: 'proposta', name: 'Proposta', color: '#f59e0b', icon: '📄', probability: 50 },
  { id: 'negociacao', name: 'Negociação', color: '#a855f7', icon: '🤝', probability: 70 },
  { id: 'fechamento', name: 'Fechamento', color: '#22c55e', icon: '✅', probability: 90 },
]

const LEADS_FILE = path.join(process.cwd(), '.system_generated', 'crm_leads.json')
let LEADS = []

function saveLeads() {
  try {
    fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true })
    fs.writeFileSync(LEADS_FILE, JSON.stringify(LEADS, null, 2))
  } catch (err) {
    console.error('[crmPipeline] Error saving leads:', err)
  }
}

try {
  if (fs.existsSync(LEADS_FILE)) {
    LEADS = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'))
  } else {
    LEADS = [
      { id: 'lead-1', name: 'João Silva', empresa: 'Silva Construções', email: 'joao@silva.com', phone: '(11) 99999-0001', valor: 150000, stage: 'proposta', probabilidade: 60, responsavel: 'Maria Vendas', origem: 'site', dataContato: '2026-06-10', dataAtualizacao: '2026-06-22', status: 'quente', tags: ['construção', 'residencial'], observacoes: 'Cliente interessado em orçamento completo', propostasEnviadas: 1, reunioes: 3 },
      { id: 'lead-2', name: 'Maria Santos', empresa: 'Santos Arquitetura', email: 'maria@santos.com', phone: '(11) 99999-0002', valor: 85000, stage: 'negociacao', probabilidade: 80, responsavel: 'Maria Vendas', origem: 'indicacao', dataContato: '2026-06-15', dataAtualizacao: '2026-06-23', status: 'quente', tags: ['arquitetura', 'comercial'], observacoes: 'Quer fechar até fim do mês', propostasEnviadas: 2, reunioes: 5 },
      { id: 'lead-3', name: 'Pedro Oliveira', empresa: 'Oliveira Engenharia', email: 'pedro@oliveira.com', phone: '(11) 99999-0003', valor: 320000, stage: 'prospeccao', probabilidade: 25, responsavel: 'Carlos Leads', origem: 'linkedin', dataContato: '2026-06-20', dataAtualizacao: '2026-06-21', status: 'frio', tags: ['engenharia', 'industrial'], observacoes: 'Primeiro contato, enviar apresentação', propostasEnviadas: 0, reunioes: 1 },
      { id: 'lead-4', name: 'Ana Costa', empresa: 'Costa Incorporadora', email: 'ana@costa.com', phone: '(11) 99999-0004', valor: 500000, stage: 'fechamento', probabilidade: 92, responsavel: 'Maria Vendas', origem: 'parceiro', dataContato: '2026-06-05', dataAtualizacao: '2026-06-24', status: 'quente', tags: ['incorporação', 'alto-padrão'], observacoes: 'Contrato sendo revisado pelo jurídico', propostasEnviadas: 3, reunioes: 7 },
      { id: 'lead-5', name: 'Lucas Pereira', empresa: 'Pereira Construtora', email: 'lucas@pereira.com', phone: '(11) 99999-0005', valor: 200000, stage: 'prospeccao', probabilidade: 20, responsavel: 'Carlos Leads', origem: 'site', dataContato: '2026-06-22', dataAtualizacao: '2026-06-24', status: 'morno', tags: ['construção'], observacoes: 'Pediu informações sobre BIM', propostasEnviadas: 0, reunioes: 0 },
      { id: 'lead-6', name: 'Carla Mendes', empresa: 'Mendes Design', email: 'carla@mendes.com', phone: '(11) 99999-0006', valor: 45000, stage: 'qualificacao', probabilidade: 40, responsavel: 'Maria Vendas', origem: 'instagram', dataContato: '2026-06-18', dataAtualizacao: '2026-06-23', status: 'morno', tags: ['design', 'interiores'], observacoes: 'Agendar reunião de briefing', propostasEnviadas: 0, reunioes: 2 },
      { id: 'lead-7', name: 'Roberto Almeida', empresa: 'Almeida Incorporações', email: 'roberto@almeida.com', phone: '(11) 99999-0007', valor: 750000, stage: 'qualificacao', probabilidade: 35, responsavel: 'Carlos Leads', origem: 'evento', dataContato: '2026-06-12', dataAtualizacao: '2026-06-20', status: 'morno', tags: ['incorporação', 'comercial'], observacoes: 'Conheceu a plataforma no evento, agendar demo', propostasEnviadas: 0, reunioes: 1 },
      { id: 'lead-8', name: 'Fernanda Lima', empresa: 'Lima Arquitetura', email: 'fernanda@lima.com', phone: '(11) 99999-0008', valor: 120000, stage: 'proposta', probabilidade: 55, responsavel: 'Maria Vendas', origem: 'indicacao', dataContato: '2026-06-08', dataAtualizacao: '2026-06-22', status: 'quente', tags: ['arquitetura', 'residencial'], observacoes: 'Enviar segunda versão da proposta', propostasEnviadas: 1, reunioes: 4 },
    ]
    saveLeads()
  }
} catch (err) {
  console.error('Error loading CRM leads:', err)
}

export function getStages() {
  return STAGES
}

export function getLeads(stageFilter) {
  if (stageFilter) return LEADS.filter(l => l.stage === stageFilter)
  return [...LEADS]
}

export function getLead(id) {
  return LEADS.find(l => l.id === id) || null
}

export function createLead(data) {
  const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const lead = {
    id,
    name: String(data.name || '').trim(),
    empresa: String(data.empresa || '').trim(),
    email: String(data.email || '').trim(),
    phone: String(data.phone || '').trim(),
    valor: Number(data.valor) || 0,
    stage: 'prospeccao',
    probabilidade: STAGES[0].probability,
    responsavel: String(data.responsavel || 'Maria Vendas').trim(),
    origem: String(data.origem || 'manual').trim(),
    dataContato: new Date().toISOString().slice(0, 10),
    dataAtualizacao: new Date().toISOString().slice(0, 10),
    status: 'novo',
    tags: Array.isArray(data.tags) ? data.tags : [],
    observacoes: String(data.observacoes || '').trim(),
    propostasEnviadas: 0,
    reunioes: 0,
  }
  LEADS.push(lead)
  saveLeads()
  return lead
}

export function updateLeadStage(id, newStage, observacoes) {
  const lead = LEADS.find(l => l.id === id)
  if (!lead) return null
  const stage = STAGES.find(s => s.id === newStage)
  if (!stage) return null

  lead.stage = newStage
  lead.probabilidade = stage.probability
  lead.dataAtualizacao = new Date().toISOString().slice(0, 10)
  if (observacoes) lead.observacoes = observacoes
  lead.status = stage.probability >= 70 ? 'quente' : stage.probability >= 30 ? 'morno' : 'frio'

  if (newStage === 'fechamento') {
    lead.status = 'ganho'
  }

  saveLeads()
  return lead
}

export function updateLead(id, data) {
  const lead = LEADS.find(l => l.id === id)
  if (!lead) return null
  Object.assign(lead, data, { dataAtualizacao: new Date().toISOString().slice(0, 10) })
  saveLeads()
  return lead
}

export function deleteLead(id) {
  const idx = LEADS.findIndex(l => l.id === id)
  if (idx === -1) return false
  LEADS.splice(idx, 1)
  saveLeads()
  return true
}

export function getPipelineKPIs() {
  const total = LEADS.length
  const vglTotal = LEADS.reduce((s, l) => s + l.valor, 0)
  const fechados = LEADS.filter(l => l.stage === 'fechamento')

  return {
    totalLeads: total,
    vglTotal,
    ticketMedio: total > 0 ? Math.round(vglTotal / total) : 0,
    taxaConversao: total > 0 ? Math.round((fechados.length / total) * 100) : 0,
    leadsQuentes: LEADS.filter(l => l.status === 'quente').length,
    leadsMornos: LEADS.filter(l => l.status === 'morno').length,
    leadsFrios: LEADS.filter(l => l.status === 'frio' || l.status === 'novo').length,
    vglPorStage: STAGES.map(s => ({
      stage: s.name,
      stageId: s.id,
      valor: LEADS.filter(l => l.stage === s.id).reduce((v, l) => v + l.valor, 0),
      count: LEADS.filter(l => l.stage === s.id).length,
      probabilidadeMedia: s.probability,
      vglPonderado: Math.round(LEADS.filter(l => l.stage === s.id).reduce((v, l) => v + (l.valor * (l.probabilidade || s.probability) / 100), 0)),
    })),
    leadsPorResponsavel: [...new Set(LEADS.map(l => l.responsavel))].map(r => ({
      responsavel: r,
      count: LEADS.filter(l => l.responsavel === r).length,
      vgl: LEADS.filter(l => l.responsavel === r).reduce((s, l) => s + l.valor, 0),
    })),
    leadsPorOrigem: [...new Set(LEADS.map(l => l.origem))].map(o => ({
      origem: o,
      count: LEADS.filter(l => l.origem === o).length,
    })),
  }
}

export async function qualifyLeadAI(id) {
  const lead = getLead(id)
  if (!lead) throw new Error('Lead not found')
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Chave GEMINI_API_KEY não configurada no .env para realizar a qualificação.')
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const prompt = `Analise este lead comercial B2B e determine se ele é Quente, Morno ou Frio baseado na probabilidade de fechamento, valor, origem e estágio.
Dados do Lead:
Nome: ${lead.name}
Empresa: ${lead.empresa}
Valor: R$${lead.valor}
Estágio Atual: ${lead.stage}
Origem: ${lead.origem}
Observações existentes: ${lead.observacoes || 'Nenhuma'}

Responda APENAS com um JSON válido neste formato exato (sem formatação markdown):
{"status": "quente", "observacao": "Sua análise curta justificando a nota."}
(O status deve ser estritamente "quente", "morno" ou "frio")`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  })
  
  const text = response.text?.replace(/```json/gi, '').replace(/```/gi, '').trim() || '{}'
  const result = JSON.parse(text)
  
  if (result.status) {
    lead.status = result.status
  }
  if (result.observacao) {
    lead.observacoes = result.observacao + " (Classificado via IA Apex)"
  }
  
  saveLeads()
  return lead
}

export async function generateProposalAI(id) {
  const lead = getLead(id)
  if (!lead) throw new Error('Lead not found')

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Chave GEMINI_API_KEY não configurada no .env.')
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const prompt = `Escreva o corpo de um e-mail de proposta comercial B2B (focado em fechar negócio) para este lead.
O tom deve ser confiante, executivo e persuasivo. Venda os benefícios da plataforma e mostre segurança. Assine como "Seu Consultor Apex AI".

Dados do Cliente:
Nome: ${lead.name}
Empresa: ${lead.empresa}
Valor Estimado do Projeto: R$${lead.valor}
Contexto: ${lead.observacoes || ''}

Não inclua o campo "Assunto:" no começo. Comece diretamente com a saudação (ex: Olá ${lead.name},).`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  })
  
  return response.text
}

export async function generateCampaignAI() {
  const targetLeads = LEADS.filter(l => l.status === 'morno' || l.status === 'frio');
  if (targetLeads.length === 0) return null;

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Chave GEMINI_API_KEY não configurada no .env.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const leadsContext = targetLeads.map(l => `- ${l.name} (${l.empresa}): Interesse em ${l.tags?.join(', ') || 'serviços'}, Orçamento R$${l.valor}`).join('\n');

  const prompt = `Atue como um Especialista em Copywriting de Vendas B2B de Alta Conversão.
Eu tenho os seguintes clientes potenciais (leads) que estão "Mornos" ou "Frios":
${leadsContext}

Crie um e-mail de "Reengajamento" genérico, mas altamente persuasivo, que sirva para ser enviado em massa (via Mailchimp) para esta lista. 
O e-mail deve focar em resolver problemas, gerar curiosidade e ter uma Call to Action (Chamada para Ação) irresistível para marcarem uma rápida reunião.
Não use a palavra "eu" ou "nós" em excesso. Foque no cliente. Assine como Apex AI.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  
  return response.text;
}


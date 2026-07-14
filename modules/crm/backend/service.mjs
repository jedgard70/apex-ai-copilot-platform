/**
 * server/service/crmPipeline.mjs
 *
 * CRM Pipeline ACIP — Gestão de leads com estágios
 * Prospecção → Proposta → Negociação → Fechamento
 * KPIs em tempo real, VGL por estágio, probabilidade
 */

import path from 'path'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

const STAGES = [
  { id: 'prospeccao', name: 'Prospecção', color: '#6b7280', icon: '🔍', probability: 15 },
  { id: 'qualificacao', name: 'Qualificação', color: '#3b82f6', icon: '📋', probability: 30 },
  { id: 'proposta', name: 'Proposta', color: '#f59e0b', icon: '📄', probability: 50 },
  { id: 'negociacao', name: 'Negociação', color: '#a855f7', icon: '🤝', probability: 70 },
  { id: 'fechamento', name: 'Fechamento', color: '#22c55e', icon: '✅', probability: 90 },
]


let IS_SUPABASE = false
let supabaseClient = null

function initSupabase() {
  if (supabaseClient) return true
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
      IS_SUPABASE = true
      return true
    } catch (e) {
      console.warn('[crmPipeline] Error init Supabase:', e.message)
    }
  }
  return false
}

async function loadLeads() {
  if (!initSupabase()) return []
  try {
    const { data, error } = await supabaseClient.from('leads').select('*')
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, we will fallback to a generic table for 100% REAL compliance
        const { data: genericData } = await supabaseClient.from('sync_queue_items').select('*').eq('operation', 'CRM_LEAD')
        return genericData ? genericData.map(g => ({ id: g.id, ...g.payload })) : []
      }
      return []
    }
    return data || []
  } catch (e) {
    return []
  }
}

async function saveLeadToDB(lead) {
  if (!initSupabase()) return null
  try {
    const { error } = await supabaseClient.from('leads').upsert([lead])
    if (error && error.code === '42P01') {
       // Fallback to sync_queue_items
       await supabaseClient.from('sync_queue_items').upsert([{ 
         id: lead.id, 
         operation: 'CRM_LEAD', 
         payload: lead 
       }])
    }
  } catch (e) {}
}

async function deleteLeadFromDB(id) {
  if (!initSupabase()) return false
  try {
    const { error } = await supabaseClient.from('leads').delete().eq('id', id)
    if (error && error.code === '42P01') {
       await supabaseClient.from('sync_queue_items').delete().eq('id', id)
    }
    return true
  } catch (e) {
    return false
  }
}

export async function getStages() {
  return STAGES
}

export async function getLeads(stageFilter) {
  const leads = await loadLeads()
  if (stageFilter) return leads.filter(l => l.stage === stageFilter)
  return leads
}

export async function getLead(id) {
  const leads = await loadLeads()
  return leads.find(l => l.id === id) || null
}

export async function createLead(data) {
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
  await saveLeadToDB(lead)
  return lead
}

export async function updateLeadStage(id, newStage, observacoes) {
  const leads = await loadLeads()
  const lead = leads.find(l => l.id === id)
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

  await saveLeadToDB(lead)
  return lead
}

export async function updateLead(id, data) {
  const leads = await loadLeads()
  const lead = leads.find(l => l.id === id)
  if (!lead) return null
  Object.assign(lead, data, { dataAtualizacao: new Date().toISOString().slice(0, 10) })
  await saveLeadToDB(lead)
  return lead
}

export async function deleteLead(id) {
  if (!initSupabase()) return false
  const { error } = await supabaseClient.from('leads').delete().eq('id', id)
  return !error
}

export async function getPipelineKPIs() {
  const LEADS = await loadLeads()
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
  
  await saveLeads()
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


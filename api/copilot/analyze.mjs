// Dispatcher for contracts-review, supply-chain-analyze, field-ops-generate
// Consolidates 3 functions into 1 to stay within Vercel Hobby 12-function limit.
// POST { action: 'contracts-review'|'supply-chain'|'field-ops', ...payload }

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

const PROMPTS = {
  'contracts-review': `Você é um assistente jurídico especializado em contratos de construção civil no Brasil.
Analise o contrato/cláusulas fornecidas e identifique riscos, sugestões e pontos de atenção.

Responda SEMPRE em JSON puro (sem markdown), com este formato exato:
{
  "risks": [{"issue": "...", "severity": "High|Medium|Low|Critical", "recommendation": "..."}],
  "suggestions": ["..."],
  "missingClauses": ["..."],
  "summary": "Resumo executivo em 2-3 frases."
}

Aviso obrigatório: sempre inclua no summary que a análise é assistida por IA e não substitui consulta jurídica profissional.`,

  'supply-chain': `Você é um especialista em supply chain para construção civil no Brasil.
Analise os dados de fornecedores/materiais fornecidos e retorne recomendações estratégicas.

Responda SEMPRE em JSON puro (sem markdown), com este formato:
{
  "riskItems": [{"item": "...", "risk": "Alto|Médio|Baixo", "reason": "...", "alternative": "..."}],
  "savingsOpportunities": [{"description": "...", "estimatedSaving": "...", "action": "..."}],
  "supplierRecommendations": [{"supplier": "...", "rating": "Ótimo|Bom|Regular|Ruim", "notes": "..."}],
  "summary": "Resumo executivo em 2-3 frases com principais riscos e oportunidades."
}`,

  'field-ops': `Você é um especialista em gestão de obras e relatórios de campo (RDO) no Brasil.
Com base nos dados fornecidos, gere um Relatório Diário de Obra (RDO) completo e profissional.

Responda SEMPRE em JSON puro (sem markdown), com este formato:
{
  "rdoNumber": "RDO-YYYYMMDD-001",
  "date": "DD/MM/YYYY",
  "weatherSummary": "Descrição das condições climáticas",
  "activitiesPerformed": [{"activity": "...", "progress": "...", "team": "...", "observations": "..."}],
  "occurrences": [{"type": "Incidente|Atraso|Visita|Entrega|Outro", "description": "...", "impact": "..."}],
  "nextDayPlan": ["..."],
  "alerts": [{"severity": "Alta|Média|Baixa", "message": "..."}],
  "summary": "Resumo executivo do dia em 2-3 frases."
}`,
}

function buildUserMessage(action, payload) {
  if (action === 'contracts-review') {
    const { clauses, documentText, documentType = 'Contrato de Construção', projectContext } = payload
    const content = documentText || (Array.isArray(clauses) ? clauses.map((c, i) => `Cláusula ${i + 1}: ${c}`).join('\n\n') : '')
    return [
      `Tipo de documento: ${documentType}`,
      projectContext ? `Contexto do projeto: ${projectContext}` : '',
      '',
      'Texto do contrato para análise:',
      content.slice(0, 12000),
    ].filter(Boolean).join('\n')
  }

  if (action === 'supply-chain') {
    const { suppliers, items, projectContext } = payload
    return [
      projectContext ? `Contexto do projeto: ${projectContext}` : '',
      suppliers?.length ? `Fornecedores:\n${JSON.stringify(suppliers, null, 2)}` : '',
      items?.length ? `Itens/Materiais:\n${JSON.stringify(items, null, 2)}` : '',
    ].filter(Boolean).join('\n\n').slice(0, 12000)
  }

  if (action === 'field-ops') {
    const { projectName, date, weather, activities, occurrences, workers, projectContext } = payload
    return [
      `Projeto: ${projectName || 'Não informado'}`,
      `Data: ${date || new Date().toLocaleDateString('pt-BR')}`,
      weather ? `Clima: ${weather}` : '',
      workers ? `Efetivo: ${workers} trabalhadores` : '',
      projectContext ? `Contexto: ${projectContext}` : '',
      activities?.length ? `Atividades realizadas:\n${activities.map((a, i) => `${i + 1}. ${a}`).join('\n')}` : '',
      occurrences?.length ? `Ocorrências:\n${occurrences.map((o, i) => `${i + 1}. ${o}`).join('\n')}` : '',
    ].filter(Boolean).join('\n').slice(0, 8000)
  }

  return ''
}

function fallback(action, payload) {
  if (action === 'contracts-review') {
    return { mode: 'planning-only', risks: [], suggestions: ['Configure ANTHROPIC_API_KEY para ativar revisão jurídica por IA.'], missingClauses: [], summary: 'Revisão jurídica por IA não disponível.' }
  }
  if (action === 'supply-chain') {
    return { mode: 'planning-only', riskItems: [], savingsOpportunities: [{ description: 'Configure ANTHROPIC_API_KEY', estimatedSaving: 'N/A', action: 'Configurar variável' }], supplierRecommendations: [], summary: 'Análise de supply chain por IA não disponível.' }
  }
  if (action === 'field-ops') {
    const { date, weather, activities, occurrences } = payload
    return {
      mode: 'planning-only',
      rdoNumber: `RDO-${(date || new Date().toISOString().slice(0, 10)).replace(/-/g, '')}-001`,
      date: date || new Date().toLocaleDateString('pt-BR'),
      weatherSummary: weather || 'Não informado',
      activitiesPerformed: (activities || []).map(a => ({ activity: a, progress: 'Não informado', team: 'Não informado', observations: '' })),
      occurrences: occurrences || [],
      nextDayPlan: [],
      alerts: [{ severity: 'Baixa', message: 'Configure ANTHROPIC_API_KEY para geração inteligente de RDO.' }],
      summary: 'Geração de RDO por IA não disponível.',
    }
  }
  return { mode: 'planning-only' }
}

function shapeResponse(action, parsed) {
  if (action === 'contracts-review') {
    return { mode: 'claude-review', risks: parsed.risks || [], suggestions: parsed.suggestions || [], missingClauses: parsed.missingClauses || [], summary: parsed.summary || '' }
  }
  if (action === 'supply-chain') {
    return { mode: 'claude-analysis', riskItems: parsed.riskItems || [], savingsOpportunities: parsed.savingsOpportunities || [], supplierRecommendations: parsed.supplierRecommendations || [], summary: parsed.summary || '' }
  }
  if (action === 'field-ops') {
    return { mode: 'claude-generated', rdoNumber: parsed.rdoNumber || `RDO-${Date.now()}`, date: parsed.date || '', weatherSummary: parsed.weatherSummary || '', activitiesPerformed: parsed.activitiesPerformed || [], occurrences: parsed.occurrences || [], nextDayPlan: parsed.nextDayPlan || [], alerts: parsed.alerts || [], summary: parsed.summary || '' }
  }
  return parsed
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
    res.end()
    return
  }
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  let body = {}
  try {
    const raw = await new Promise((resolve, reject) => {
      let d = ''
      req.on('data', c => { d += c })
      req.on('end', () => resolve(d))
      req.on('error', reject)
    })
    body = JSON.parse(raw || '{}')
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' })
  }

  const { action, ...payload } = body
  if (!PROMPTS[action]) return sendJson(res, 400, { error: `action must be one of: ${Object.keys(PROMPTS).join(', ')}` })

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return sendJson(res, 200, fallback(action, payload))

  const userMessage = buildUserMessage(action, payload)
  if (!userMessage.trim()) return sendJson(res, 400, { error: 'Forneça dados para análise.' })

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6', max_tokens: 2048, system: PROMPTS[action], messages: [{ role: 'user', content: userMessage }] }),
    })

    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      console.error('[analyze] Anthropic error', data?.error)
      return sendJson(res, 200, { mode: 'error', error: 'Falha ao chamar Claude. Tente novamente.' })
    }

    const text = (Array.isArray(data.content) ? data.content : []).filter(b => b.type === 'text').map(b => b.text).join('')
    let parsed = {}
    try { parsed = JSON.parse(text) } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) { try { parsed = JSON.parse(match[0]) } catch { parsed = { summary: text } } }
    }

    return sendJson(res, 200, shapeResponse(action, parsed))
  } catch (err) {
    console.error('[analyze] error', err)
    return sendJson(res, 500, { error: 'Erro interno.' })
  }
}

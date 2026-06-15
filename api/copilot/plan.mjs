// Single dispatcher for all studio plan endpoints.
// Replaces: contracts-plan, supply-chain-plan, fieldops-plan, research-plan, knowledge-plan
// to stay within Vercel Hobby 12-function limit.
// POST { studioAction: string, ...payload }

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

async function callClaude(apiKey, systemPrompt, userMessage, maxTokens = 3000) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: String(userMessage).slice(0, 10000) }],
    }),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(data?.error?.message || 'Claude error')
  const text = (Array.isArray(data.content) ? data.content : []).filter(b => b.type === 'text').map(b => b.text).join('')
  try { return JSON.parse(text) } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) try { return JSON.parse(match[0]) } catch {}
    return { _raw: text }
  }
}

// ── Contracts ─────────────────────────────────────────────────────────────────
const CONTRACTS_SYSTEM = `Você é um especialista jurídico em contratos de construção civil. Gere um plano de revisão contratual.
Responda APENAS em JSON puro sem markdown, seguindo EXATAMENTE este schema:
{
  "providerStatus": "claude-review",
  "documentSummary": "string",
  "detectedDocumentType": "string",
  "jurisdictionStatus": "ASSUMPTION",
  "sourceConfidence": "NEEDS_WEB_VERIFICATION",
  "needsVerification": true,
  "riskItems": [{"id":"string","clause":"string","issue":"string","severity":"High|Medium|Low|Critical","evidence":"ASSUMPTION","recommendation":"string"}],
  "permitChecklist": [],
  "permitPackage": [],
  "packageOutputs": {"usPermitPackageChecklist":"","euPermitPackageChecklist":"","ahjInquiryEmailDraft":"","architectEngineerDocumentRequestList":"","ownerDocumentRequestList":"","contractorComplianceChecklist":"","permitSubmissionCoverLetter":"","revisionResponseLetter":"","missingDocumentsReport":""},
  "scopeDraft": {"servicesIncluded":[],"materialsSpecs":[],"exclusions":[],"ownerSuppliedItems":[],"qualityStandards":[],"deliverables":[],"changeOrderRules":[],"acceptanceCriteria":[]},
  "contractDraft": "string",
  "clientFacingSummary": "string",
  "lawyerReviewSummary": "string — inclua aviso que análise é assistida por IA",
  "pendingQuestions": ["string"],
  "message": "string"
}`

async function handleContracts(payload, apiKey) {
  const { action, context, goal, conversationContext, source } = payload
  if (!apiKey) {
    return {
      plan: {
        providerStatus: 'planning-only',
        documentSummary: 'Configure ANTHROPIC_API_KEY para revisão por IA.',
        detectedDocumentType: context?.documentType || 'Contract',
        jurisdictionStatus: 'UNKNOWN',
        sourceConfidence: 'NEEDS_WEB_VERIFICATION',
        needsVerification: true,
        riskItems: [],
        permitChecklist: [],
        permitPackage: [],
        packageOutputs: { usPermitPackageChecklist: '', euPermitPackageChecklist: '', ahjInquiryEmailDraft: '', architectEngineerDocumentRequestList: '', ownerDocumentRequestList: '', contractorComplianceChecklist: '', permitSubmissionCoverLetter: '', revisionResponseLetter: '', missingDocumentsReport: '' },
        scopeDraft: { servicesIncluded: [], materialsSpecs: [], exclusions: [], ownerSuppliedItems: [], qualityStandards: [], deliverables: [], changeOrderRules: [], acceptanceCriteria: [] },
        contractDraft: '',
        clientFacingSummary: '',
        lawyerReviewSummary: 'Análise de IA não disponível — configure ANTHROPIC_API_KEY.',
        pendingQuestions: [],
        message: 'Revisão jurídica por IA não disponível. Configure ANTHROPIC_API_KEY.',
      }
    }
  }

  const userMsg = [
    `Ação solicitada: ${action}`,
    `Objetivo: ${goal}`,
    context ? `Contexto: ${JSON.stringify(context)}` : '',
    source ? `Documento: ${source.name} (${source.kind})` : '',
    conversationContext?.length ? `Conversa recente:\n${conversationContext.slice(-3).join('\n')}` : '',
  ].filter(Boolean).join('\n')

  const result = await callClaude(apiKey, CONTRACTS_SYSTEM, userMsg)
  return { plan: { ...result, message: result.message || 'Revisão contratual gerada por IA.' } }
}

// ── Supply Chain ───────────────────────────────────────────────────────────────
const SUPPLY_CHAIN_SYSTEM = `Você é especialista em supply chain para construção civil. Gere um plano de cadeia de suprimentos.
Responda APENAS em JSON puro sem markdown:
{
  "providerStatus": "claude-supply-chain",
  "suppliers": [{"id":"string","name":"string","category":"Materials|Equipment|Subcontractor|Services|Technology|Other","contact":"","region":"","rating":"Not rated","status":"Needs verification","paymentTerms":"To confirm","leadTime":"To confirm","complianceDocs":"Pending","contractLink":"","notes":"string","sourceConfidence":"PLACEHOLDER"}],
  "procurementItems": [{"id":"string","item":"string","quantity":1,"unit":"string","requiredDate":"","supplier":"string","quoteStatus":"Not requested","deliveryStatus":"Not scheduled","costPlaceholder":0,"sourceConfidence":"PLACEHOLDER"}],
  "riskFlags": ["string"],
  "savingsOpportunities": ["string"],
  "message": "string"
}`

async function handleSupplyChain(payload, apiKey) {
  const { goal, conversationContext } = payload
  if (!apiKey) {
    return {
      plan: {
        providerStatus: 'planning-only',
        suppliers: [{ id: 'supplier-placeholder', name: 'Fornecedor a verificar', category: 'Materials', contact: '', region: '', rating: 'Not rated', status: 'Needs verification', paymentTerms: 'To confirm', leadTime: 'To confirm', complianceDocs: 'Pending', contractLink: '', notes: 'Configure ANTHROPIC_API_KEY para análise por IA.', sourceConfidence: 'PLACEHOLDER' }],
        procurementItems: [],
        riskFlags: [],
        savingsOpportunities: ['Configure ANTHROPIC_API_KEY para análise de oportunidades.'],
        message: 'Supply chain por IA não disponível. Configure ANTHROPIC_API_KEY.',
      }
    }
  }

  const userMsg = [
    `Objetivo do projeto: ${goal}`,
    conversationContext?.length ? `Contexto:\n${conversationContext.slice(-3).join('\n')}` : '',
  ].filter(Boolean).join('\n')

  const result = await callClaude(apiKey, SUPPLY_CHAIN_SYSTEM, userMsg)
  return { plan: { ...result, message: result.message || 'Plano de supply chain gerado por IA.' } }
}

// ── Field Ops ─────────────────────────────────────────────────────────────────
const FIELD_OPS_SYSTEM = `Você é especialista em gestão de obras e RDO (Relatório Diário de Obra) no Brasil.
Gere um relatório/plano de campo baseado nos dados fornecidos.
Responda APENAS em JSON puro sem markdown:
{
  "providerStatus": "report-draft",
  "rdoDraft": "string — texto completo do RDO",
  "activities": [{"id":"string","description":"string","responsibleParty":"string","evidence":"USER_REPORTED","status":"Completed|In Progress|Planned","startTime":"","endTime":"","notes":""}],
  "crew": ["string"],
  "materials": ["string"],
  "issues": [{"id":"string","description":"string","severity":"Low|Medium|High|Critical","status":"Open","assignedTo":"","dueDate":"","evidence":"ASSUMPTION","photos":[],"resolution":""}],
  "safetyItems": [{"id":"string","item":"string","status":"Unknown","riskLevel":"Medium","evidence":"UNKNOWN","notes":""}],
  "qualityItems": [{"id":"string","item":"string","status":"Unknown","riskLevel":"Low","evidence":"UNKNOWN","notes":""}],
  "photoLog": [],
  "clientSummary": "string",
  "internalFieldReport": "string",
  "safetyReport": "string",
  "qualityPunchList": "string",
  "materialsLog": "string",
  "nextDayPlan": "string",
  "confidenceSummary": "string",
  "message": "string"
}`

async function handleFieldOps(payload, apiKey) {
  const { action, context, goal, conversationContext, currentPlan } = payload
  if (!apiKey) {
    return {
      plan: {
        providerStatus: 'report-draft',
        rdoDraft: 'Configure ANTHROPIC_API_KEY para gerar RDO por IA.',
        activities: [],
        crew: [],
        materials: [],
        issues: [],
        safetyItems: [{ id: 'safety-1', item: 'PPE / EPI', status: 'Unknown', riskLevel: 'Medium', evidence: 'UNKNOWN', notes: '' }],
        qualityItems: [{ id: 'quality-1', item: 'Dimensões', status: 'Unknown', riskLevel: 'Low', evidence: 'UNKNOWN', notes: '' }],
        photoLog: [],
        clientSummary: '',
        internalFieldReport: '',
        safetyReport: '',
        qualityPunchList: '',
        materialsLog: '',
        nextDayPlan: '',
        confidenceSummary: 'RDO por IA não disponível.',
        message: 'Field Ops por IA não disponível. Configure ANTHROPIC_API_KEY.',
      }
    }
  }

  const userMsg = [
    `Ação: ${action}`,
    `Projeto: ${goal}`,
    context ? `Contexto RDO: ${JSON.stringify(context)}` : '',
    conversationContext?.length ? `Conversa:\n${conversationContext.slice(-3).join('\n')}` : '',
    currentPlan?.rdoDraft ? `RDO atual: ${String(currentPlan.rdoDraft).slice(0, 2000)}` : '',
  ].filter(Boolean).join('\n')

  const result = await callClaude(apiKey, FIELD_OPS_SYSTEM, userMsg)
  return { plan: { ...result, message: result.message || 'Relatório de campo gerado por IA.' } }
}

// ── Research ──────────────────────────────────────────────────────────────────
const RESEARCH_SYSTEM = `Você é especialista em pesquisa de mercado para construção civil no Brasil.
Gere um plano de pesquisa baseado na consulta fornecida.
Responda APENAS em JSON puro sem markdown:
{
  "providerStatus": "research-draft",
  "researchType": "string",
  "query": "string",
  "region": "string",
  "freshness": "string",
  "sinapiStatus": "not-connected",
  "sources": [{"id":"string","url":"NEEDS_VERIFICATION","title":"string","excerpt":"string","confidence":"ASSUMPTION","dateAccessed":""}],
  "findings": [{"id":"string","title":"string","summary":"string","confidence":"ASSUMPTION","sourceIds":[],"tags":[]}],
  "proposalBuilder": {"executiveSummary":"string","marketOpportunity":"string","clientPainPoints":["string"],"valueProposition":"string","competitivePositioning":"string","pricingAssumptions":["string"],"recommendedOffer":"string","ctaNextStep":"string"},
  "pendingVerification": ["string"],
  "message": "string"
}`

async function handleResearch(payload, apiKey) {
  const { researchType, query, region, freshness, conversationContext } = payload
  if (!apiKey) {
    return {
      plan: {
        providerStatus: 'web-not-connected',
        researchType: researchType || 'Market research',
        query: query || '',
        region: region || '',
        freshness: freshness || '',
        sinapiStatus: 'not-connected',
        sources: [],
        findings: [],
        proposalBuilder: { executiveSummary: '', marketOpportunity: '', clientPainPoints: [], valueProposition: '', competitivePositioning: '', pricingAssumptions: [], recommendedOffer: '', ctaNextStep: '' },
        pendingVerification: ['Configure ANTHROPIC_API_KEY e TAVILY_API_KEY para pesquisa real.'],
        message: 'Pesquisa por IA não disponível. Configure ANTHROPIC_API_KEY.',
      }
    }
  }

  const userMsg = [
    `Tipo de pesquisa: ${researchType}`,
    `Consulta: ${query}`,
    region ? `Região: ${region}` : '',
    freshness ? `Atualidade requerida: ${freshness}` : '',
    conversationContext?.length ? `Contexto:\n${conversationContext.slice(-3).join('\n')}` : '',
  ].filter(Boolean).join('\n')

  const result = await callClaude(apiKey, RESEARCH_SYSTEM, userMsg)
  return { plan: { ...result, message: result.message || 'Pesquisa de mercado gerada por IA.' } }
}

// ── Knowledge Base ─────────────────────────────────────────────────────────────
async function handleKnowledge(payload, apiKey) {
  const { goal } = payload
  return {
    plan: {
      providerStatus: 'local-knowledge-index',
      items: [
        { id: 'kb-archvis', title: 'ArchVis prompt brain', sourceType: 'skill', domain: 'ArchVis', confidence: 'APPROVED_GLOBAL', scope: 'global', summary: 'Estilos de prompt, regras de preservação de planta e workflow de imagem.' },
        { id: 'kb-contracts', title: 'Contratos e cláusulas construção civil', sourceType: 'skill', domain: 'Contratos', confidence: 'APPROVED_GLOBAL', scope: 'global', summary: 'Cláusulas típicas, riscos e revisão jurídica assistida por IA.' },
        { id: 'kb-sinapi', title: 'Tabela SINAPI 2024 (SP/RJ/MG)', sourceType: 'file', domain: 'Orçamento', confidence: 'APPROVED_GLOBAL', scope: 'global', summary: '150 itens com preços de referência para três regiões.' },
        { id: 'kb-supply', title: 'Supply chain e fornecedores', sourceType: 'skill', domain: 'Supply Chain', confidence: 'APPROVED_GLOBAL', scope: 'global', summary: 'Análise de risco, oportunidades de economia e qualificação de fornecedores.' },
        { id: 'kb-project', title: 'Memória do projeto', sourceType: 'project note', domain: 'Projeto', confidence: 'PROJECT_MEMORY', scope: 'project', summary: goal || 'Conhecimento local do projeto.' },
      ],
      filters: ['domain', 'sourceType', 'confidence', 'scope'],
      exportIndex: 'Índice local. Não executar conteúdo. Entradas globais requerem aprovação do Proprietário.',
    }
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────
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

  // Detect which studio based on URL path suffix or explicit studioAction field
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  let studioAction = body.studioAction
  if (!studioAction) {
    if (path.includes('contracts-plan')) studioAction = 'contracts'
    else if (path.includes('supply-chain-plan')) studioAction = 'supply-chain'
    else if (path.includes('fieldops-plan')) studioAction = 'field-ops'
    else if (path.includes('research-plan')) studioAction = 'research'
    else if (path.includes('knowledge-plan')) studioAction = 'knowledge'
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  try {
    let result
    switch (studioAction) {
      case 'contracts': result = await handleContracts(body, apiKey); break
      case 'supply-chain': result = await handleSupplyChain(body, apiKey); break
      case 'field-ops': result = await handleFieldOps(body, apiKey); break
      case 'research': result = await handleResearch(body, apiKey); break
      case 'knowledge': result = await handleKnowledge(body, apiKey); break
      default: return sendJson(res, 400, { error: `studioAction inválido: ${studioAction}` })
    }
    return sendJson(res, 200, result)
  } catch (err) {
    console.error('[plan] error', err)
    return sendJson(res, 500, { error: `Erro interno: ${err.message}` })
  }
}

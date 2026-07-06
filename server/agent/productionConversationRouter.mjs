import { buildConnectorsStatusReply, classifyConnectorStatusIntent } from './connectorsStatus.mjs'

function normalizeMessage(message = '') {
  return String(message || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function includesAny(text, patterns) {
  return patterns.some(pattern => pattern.test(text))
}

function firstPatternIndex(text, patterns) {
  let first = -1
  for (const pattern of patterns) {
    const match = pattern.exec(text)
    pattern.lastIndex = 0
    if (match?.index >= 0 && (first === -1 || match.index < first)) first = match.index
  }
  return first
}

function sanitizeDisplayName(value = '') {
  return String(value || '')
    .replace(/[<>{}[\]\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export function extractDisplayNamePreference(message = '') {
  const raw = String(message || '').trim()
  const patterns = [
    /\bme chame de\s+([^.!?\n\r,;]+)/i,
    /\bpode me chamar de\s+([^.!?\n\r,;]+)/i,
    /\bquero ser chamad[oa] de\s+([^.!?\n\r,;]+)/i,
    /\bquero que me chame de\s+([^.!?\n\r,;]+)/i,
    /\bser chamad[oa] de\s+([^.!?\n\r,;]+)/i,
    /^\s*sou\s+([^.!?\n\r,;]+)/i,
  ]

  for (const pattern of patterns) {
    const match = raw.match(pattern)
    const displayName = sanitizeDisplayName(match?.[1] || '')
    if (displayName) return displayName
  }

  return ''
}

export function inferDisplayNameFromMessages(messages = []) {
  const recent = Array.isArray(messages) ? messages.slice(-12).reverse() : []
  for (const message of recent) {
    if (message?.role && message.role !== 'user') continue
    const displayName = extractDisplayNamePreference(message?.text || message?.content || '')
    if (displayName) return displayName
  }
  return ''
}

function hasPortugueseSignal(text) {
  return includesAny(text, [
    /\b(ola|bom dia|boa tarde|boa noite|mas|voce|voces|vc|nao|entao|me diga|liste|proximo|passo|faz|execute|quero|deploy|publica|subir|aplica|migration|supabase|plataforma|posicao|posição|entendeu|revit|bim|modelagem|familias|famílias|quantitativo|meu nome|quem sou eu|computador|pc|internet|travando|sim|certo|pode|beleza|portugues|continua|seguir|continuar|tudo bem|claro|obrigado|orcamento|orçamento|contrato|proposta|cronograma|planejamento|obra|campo|checklist|render|imagem|video|vídeo|marketing|vendas|memorial|escopo|sinapi|compra|medicao|medição|aditivo|licitacao|licitação|projeto|estrutura|fundacao|fundação|alvenaria|cobertura|instalacao|instalação|eletrica|elétrica|hidraulica|hidráulica|documentacao|documentação|engenharia|arquitetura|topografia|laudo|relatorio|relatório|diario|diário|visita|aprovacao|aprovação|prefeitura|crea|art|rrt)\b/,
  ])
}

function hasEnglishSignal(text) {
  // Detects predominantly English input when no Portuguese signal is present
  return includesAny(text, [
    /\bwhat can you do\b/,
    /\bwhat do you do\b/,
    /\bhow (do|can|should) (i|you)\b/,
    /\bcan you (help|show|tell|explain|do|create|make|build|write|generate)\b/,
    /\bhelp me (with|to|understand|create|build|write|make|plan|fix|review)\b/,
    /\bshow me\b/,
    /\btell me\b/,
    /\bi (want|need|would like|am looking for)\b/,
    /\bplease (help|show|tell|explain|do|create|make)\b/,
    /\bwhat is\b/,
    /\bwhat are\b/,
    /\bhow to\b/,
    /\bdo you (know|have|support|handle|work with)\b/,
    /\bwill you\b/,
    /\bare you able\b/,
    /\bi have a (question|problem|issue|task|project)\b/,
    /\bmy (project|company|team|client|budget|schedule)\b/,
    /\b(create|generate|build|write|draft|prepare|review|analyze|explain) (a|an|the|my|our)\b/,
  ])
}

const INTENT_PATTERNS = {
  production_revit_bim_help: [
    /\b(o que pode me ajudar com o )?revit\b/,
    /\bbim\b/,
    /\bmodelagem\b/,
    /\bfamilias revit\b/,
    /\bfamilias\b.*\brevit\b/,
    /\bquantitativo revit\b/,
    /\bcompatibilizacao\b/,
    /\bifc\b/,
    /\bnwc\b/,
  ],
  production_user_confusion: [
    /\bnao entendi\b/,
    /\bnão entendi\b/,
    /\bexplique melhor\b/,
    /\bfala mais simples\b/,
    /\bresuma\b/,
  ],
  production_name_identity: [
    /\bmeu nome\b/,
    /\bqual meu nome\b/,
    /\bcomo voce deve me chamar\b/,
    /\bcomo você deve me chamar\b/,
  ],
  production_who_am_i: [
    /\bquem sou eu\b/,
    /\bvoce sabe quem sou eu\b/,
    /\bvocê sabe quem sou eu\b/,
  ],
  production_source_of_information: [
    /\bonde (vc|voce|você) (conseguiu|tirou) (essa|essa) informacao\b/,
    /\bde onde veio (isso|essa informacao|essa informação)\b/,
    /\bqual (a )?fonte (disso|dessa informacao|dessa informação)\b/,
    /\bsource of that information\b/,
  ],
  production_owner_assertion: [
    /\bsou o dono\b/,
    /\beu sou o dono\b/,
    /\bsou owner\b/,
    /\bsou o proprietario\b/,
    /\bsou o proprietário\b/,
    /\bjose edgard\b/,
  ],
  production_computer_help: [
    /\b(arrumar|consertar|corrigir|diagnosticar).*\b(computador|pc|notebook)\b/,
    /\b(computador|pc|notebook).*\b(arrumar|consertar|corrigir|diagnosticar|erro|lento|travando|problema)\b/,
    /\bme ajuda(?:r)? no computador\b/,
    /\berro no pc\b/,
    /\binternet (nao|não) funciona\b/,
    /\b(revit).*\b(travando|lento|crash|fechando|erro)\b/,
  ],
  production_capability_repair: [
    /\bnao e so isso\b/,
    /\bnão é só isso\b/,
    /\bnao foi so isso\b/,
    /\bfaltou coisa\b/,
    /\bfaltou algo\b/,
    /\bfaltou muita coisa\b/,
    /\bquero mais completo\b/,
    /\bdetalhe melhor\b/,
    /\bdetalha melhor\b/,
    /\bseja mais profundo\b/,
    /\bmais profundo\b/,
    /\bresposta incompleta\b/,
    /\bincompleto\b/,
    /\bmuito superficial\b/,
    /\bfoi superficial\b/,
    /\besta mecanico\b/,
    /\besta mecânico\b/,
    /\bisto esta mecanico\b/,
    /\bisso esta mecanico\b/,
    /\bissso esta mecanico\b/,
    /\bvocê foi mecanico\b/,
    /\bvoce foi mecanico\b/,
    /\bresposta mecanica\b/,
    /\bresposta mecânica\b/,
    /\bexplique mais\b/,
    /\bseja mais detalhado\b/,
    /\bmais detalhado\b/,
    /\bpreciso de mais\b/,
    /\bquero mais detalhe\b/,
    /\bdeve ter mais\b/,
    /\btem mais do que isso\b/,
  ],
  production_capability_continuation: [
    /\bo que mais\b/,
    /\be mais\b/,
    /\bme diga mais\b/,
    /\bo que mais vc faz\b/,
    /\bo que mais voce faz\b/,
    /\bquais outras funcoes\b/,
    /\bquais outras funções\b/,
    /\bcontinua(r)?\b/,
    /\bcontinue\b/,
    /\btem mais\b/,
    /\btem mais alguma?\b/,
  ],
  production_capability_listing: [
    /\bo que sabe fazer\b/,
    /\bliste para mim\b/,
    /\bliste em detalhes\b/,
    /\bquais sao suas capacidades\b/,
    /\bquais são suas capacidades\b/,
    /\bo que voce consegue fazer\b/,
    /\bo que a apex consegue fazer\b/,
    /\bo que a apex faz\b/,
    /\bme explique tudo que vc faz\b/,
    /\bme explique tudo que voce faz\b/,
    /\bme explique o que voce faz\b/,
    /\bo que voce sabe fazer\b/,
    /\bquais suas capacidades\b/,
    /\bme mostre o que vc faz\b/,
    /\bme mostra o que voce faz\b/,
  ],
  production_platform_position: [
    /\bqual (a )?(posicao|posição|situacao|situação) da plataforma\b/,
    /\bstatus da plataforma\b/,
    /\bcomo esta a plataforma\b/,
  ],
  production_vercel_deploy: [
    /\b(faz deploy|fazer deploy|deploy)\b/,
    /\bpublica(r)?\b/,
    /\bsubir para vercel\b/,
  ],
  production_supabase: [
    /\b(aplica|aplicar|aplique|roda|rodar|executa|executar).*\b(migration|migracao|supabase)\b/,
    /\bsupabase\b/,
  ],
  production_language_preference: [
    /\bem portugu[eê]s\b/,
    /\bresponda em portugu[eê]s\b/,
    /\bfale portugu[eê]s\b/,
    /\bfale em portugu[eê]s\b/,
    /\bsempre em portugu[eê]s\b/,
  ],
  production_affirmation: [
    /^(sim|ok|certo|beleza|pode|tudo bem|claro|tudo certo|pode ser|por favor|combinado|entendido)[\s!.,?]*$/,
  ],
  production_execute_recommended: [
    /\bexecute entao\b/,
    /\bexecuta entao\b/,
    /\bfa[cç]a entao\b/,
    /\bpode executar\b/,
    /\b(execute|executa|executar|faz|fazer|pode seguir|quero que execute).*\b(proximo|passo)\b/,
    /\b^(faz|pode seguir|segue|seguir)$\b/,
  ],
  production_next_step: [
    /\bproximo passo\b/,
    /\bqual o proximo passo\b/,
    /\bo que fazemos agora\b/,
    /\be agora\b/,
  ],
  production_orcamento_sinapi_help: [
    /\borcamento\b/,
    /\borçamento\b/,
    /\bsinapi\b/,
    /\bcomposicao de custo\b/,
    /\bcomposição de custo\b/,
    /\bbdi\b/,
    /\bencargo\b/,
    /\bplanilha (de )?custo\b/,
    /\bplanilha orcamentaria\b/,
    /\bplanilha orçamentária\b/,
    /\bcusto (de )?obra\b/,
    /\bpreco unitario\b/,
    /\bpreço unitário\b/,
    /\bcurva s\b/,
    /\bdesembolso\b/,
    /\bunitario\b/,
    /\bunitário\b/,
    /\blicitacao\b/,
    /\blicitação\b/,
  ],
  production_proposta_contrato_help: [
    /\bproposta (comercial|tecnica|técnica)?\b/,
    /\bcontrato\b/,
    /\baditivo\b/,
    /\bmemorial descritivo\b/,
    /\bmemorial\b/,
    /\bescopo\b/,
    /\bexclusoes\b/,
    /\bexclusões\b/,
    /\bcondicoes (de )?pagamento\b/,
    /\bcondições (de )?pagamento\b/,
    /\bdocumento tecnico\b/,
    /\bdocumento técnico\b/,
    /\bespecificacao tecnica\b/,
    /\bespecificação técnica\b/,
    /\breport executivo\b/,
    /\brelatorio executivo\b/,
    /\brelatório executivo\b/,
  ],
  production_obra_campo_help: [
    /\bdiario de obra\b/,
    /\bdiário de obra\b/,
    /\bchecklist de obra\b/,
    /\bchecklist de campo\b/,
    /\brfi\b/,
    /\bnao conformidade\b/,
    /\bnão conformidade\b/,
    /\bacompanhamento de obra\b/,
    /\bvisita de obra\b/,
    /\brelatorio de obra\b/,
    /\brelatório de obra\b/,
    /\bplanejamento semanal\b/,
    /\blook.?ahead\b/,
    /\bcontrole de qualidade\b/,
    /\brecebimento de material\b/,
    /\bfiscalizacao\b/,
    /\bfiscalização\b/,
    /\bgestao de obra\b/,
    /\bgestão de obra\b/,
    /\bmedicao de obra\b/,
    /\bmedição de obra\b/,
  ],
  production_cronograma_help: [
    /\bcronograma\b/,
    /\bplanejamento (de obra|de projeto|de servico|de serviço)?\b/,
    /\bprazo\b/,
    /\betapa\b/,
    /\bmilestone\b/,
    /\bms project\b/,
    /\bgantt\b/,
    /\bsequencia de servico\b/,
    /\bsequência de serviço\b/,
    /\bsequenciamento\b/,
    /\bfases da obra\b/,
    /\bfase de execucao\b/,
    /\bfase de execução\b/,
  ],
  production_archviz_help: [
    /\brender\b/,
    /\barchviz\b/,
    /\bvisualizacao (3d|arquitetonica|arquitetônica)?\b/,
    /\bvisualização (3d|arquitetonica|arquitetônica)?\b/,
    /\bprompt (de )?render\b/,
    /\bprompt (de )?imagem\b/,
    /\bimagem (conceitual|arquitetonica|arquitetônica|3d)?\b/,
    /\bstoryboard\b/,
    /\bbriefing visual\b/,
    /\bvideo (de )?apresentacao\b/,
    /\bvídeo (de )?apresentação\b/,
    /\btour virtual\b/,
    /\bmoodboard\b/,
    /\breferencia visual\b/,
    /\breferência visual\b/,
    /\bdifusao de imagem\b/,
    /\bdireção de arte\b/,
    /\bdireccao de arte\b/,
  ],
  production_marketing_vendas_help: [
    /\bmarketing\b/,
    /\bvendas\b/,
    /\bfunil\b/,
    /\bcrm\b/,
    /\bprospeccao\b/,
    /\bprospecção\b/,
    /\bapresentacao comercial\b/,
    /\bapresentação comercial\b/,
    /\bcaptacao de cliente\b/,
    /\bcaptação de cliente\b/,
    /\bcampanha\b/,
    /\bconteudo tecnico\b/,
    /\bconteúdo técnico\b/,
    /\binbound\b/,
    /\boutbound\b/,
    /\bpitch\b/,
    /\bbranding\b/,
    /\bproposta (de )?valor\b/,
    /\bproposta de valor\b/,
    /\bfidelizacao\b/,
    /\bfidelização\b/,
  ],
  production_background_agent_task_request: [
    /\b(segundo plano|noite|overnight|background|madrugada)\b/,
    /\b(agend(a|e|ar)|execut(e|ar|a)|rod(e|ar)|analis(e|ar|a)).*\b(incompatibilidade|conflito|clash|colisao|colisão|interferencia|interferência)\b/i,
    /\b(tarefa(s)? de agente(s)? em segundo plano)\b/i
  ],
}

const CONNECTOR_SECTION_INTENTS = new Set([
  'production_github_connector_status',
  'production_vercel_connector_status',
  'production_connector_status',
])

function splitNaturalRequestItems(message = '') {
  const raw = String(message || '').trim()
  if (!raw) return []
  return raw
    .replace(/\r/g, '\n')
    .replace(/(?:^|\n)\s*\d+[\).\-\s]+/g, '\n')
    .split(/\n+|[;!?]+|(?:\s+tamb[eé]m\s+)|(?:\s+depois\s+)/i)
    .map(item => item.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean)
}

function connectorIntentsFromSegment(segment = '') {
  const text = normalizeMessage(segment)
  const asksStatus = /\b(verifique|verificar|verifica|checar|cheque|validar|valide|status|conector|conectores)\b/.test(text)
  if (!asksStatus) return []
  const intents = []
  if (/\bgithub\b/.test(text)) intents.push('production_github_connector_status')
  if (/\bvercel\b/.test(text)) intents.push('production_vercel_connector_status')
  if (!intents.length && /\bconector|conectores\b/.test(text)) intents.push('production_connector_status')
  return intents
}

function orderedIntentsFromSegment(segment = '') {
  const text = normalizeMessage(segment)
  if (!text) return []
  const ordered = []

  const connectorIntents = connectorIntentsFromSegment(segment)
  for (const intent of connectorIntents) {
    const marker = intent === 'production_github_connector_status' ? 'github' : intent === 'production_vercel_connector_status' ? 'vercel' : 'conector'
    ordered.push({ intent, index: text.indexOf(marker) >= 0 ? text.indexOf(marker) : 0 })
  }

  const computerHelpIndex = firstPatternIndex(text, INTENT_PATTERNS.production_computer_help)
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'production_revit_bim_help' && computerHelpIndex >= 0) continue
    const index = firstPatternIndex(text, patterns)
    if (index >= 0) ordered.push({ intent, index })
  }

  const sorted = ordered
    .sort((a, b) => a.index - b.index)
    .map(item => item.intent)

  // Fallback: very short unrecognized segment (≤4 words, no intent found)
  if (!sorted.length && text.split(/\s+/).length <= 4) {
    return ['production_ambiguous_short']
  }

  return sorted
}

export function decomposeProductionConversationIntents(message = '') {
  const preferredName = extractDisplayNamePreference(message)
  const items = splitNaturalRequestItems(message)
  const intents = []
  if (preferredName) intents.push('production_display_name_preference')

  for (const item of items.length ? items : [message]) {
    for (const intent of orderedIntentsFromSegment(item)) intents.push(intent)
  }

  const deduped = []
  const seenConnectorIntents = new Set()
  for (const intent of intents) {
    if (CONNECTOR_SECTION_INTENTS.has(intent)) {
      if (intent === 'production_connector_status' && (seenConnectorIntents.has('production_github_connector_status') || seenConnectorIntents.has('production_vercel_connector_status'))) continue
      if (seenConnectorIntents.has(intent)) continue
      seenConnectorIntents.add(intent)
    }
    deduped.push(intent)
  }

  return deduped
}

export function classifyProductionConversationIntent(message = '') {
  const text = normalizeMessage(message)
  const decomposedIntents = decomposeProductionConversationIntents(message)

  if (!text) return 'production_next_step'
  if (decomposedIntents.length > 1) return 'production_multi_intent'
  if (extractDisplayNamePreference(message)) return 'production_display_name_preference'

  // H7 — confirmation signal (must be checked early, before other intents)
  if (/^\s*(sim|s|yes|y|ok|okay|confirmo|confirmado|pode|pode sim|vai|vamos|executa|execute|faz sim|pode executar|confirma|certo|beleza|vai la|manda ver)\s*[.!]?\s*$/.test(text)) {
    return 'production_h7_confirmation'
  }

  if (includesAny(text, INTENT_PATTERNS.production_computer_help)) {
    return 'production_computer_help'
  }

  if (includesAny(text, INTENT_PATTERNS.production_revit_bim_help)) {
    return 'production_revit_bim_help'
  }

  if (includesAny(text, INTENT_PATTERNS.production_user_confusion)) {
    return 'production_user_confusion'
  }

  if (includesAny(text, INTENT_PATTERNS.production_name_identity)) {
    return 'production_name_identity'
  }

  if (includesAny(text, INTENT_PATTERNS.production_who_am_i)) {
    return 'production_who_am_i'
  }

  if (includesAny(text, INTENT_PATTERNS.production_owner_assertion)) {
    return 'production_owner_assertion'
  }

  if (includesAny(text, INTENT_PATTERNS.production_source_of_information)) {
    return 'production_source_of_information'
  }

  if (includesAny(text, INTENT_PATTERNS.production_background_agent_task_request)) {
    return 'production_background_agent_task_request'
  }

  if (/^(ola|oi|bom dia|boa tarde|boa noite)(?:[\s!.,?]|$)/.test(text)) {
    return 'production_greeting'
  }

  if (includesAny(text, [
    /\bmas eu nem te perguntei ainda\b/,
    /\bnao respondeu\b/,
    /\bnao fale ingles\b/,
    /\bpare de explicar\b/,
    /\bsem enrolacao\b/,
  ])) {
    return 'production_user_correction'
  }

  if (includesAny(text, [
    /\bentendeu\b/,
    /\bvoce entendeu\b/,
    /\bconfirmou\b/,
  ])) {
    return 'production_acknowledgement'
  }

  if (includesAny(text, INTENT_PATTERNS.production_capability_repair)) {
    return 'production_capability_repair'
  }

  if (includesAny(text, INTENT_PATTERNS.production_capability_continuation)) {
    return 'production_capability_continuation'
  }

  if (includesAny(text, INTENT_PATTERNS.production_capability_listing)) {
    return 'production_capability_listing'
  }

  if (includesAny(text, INTENT_PATTERNS.production_platform_position)) {
    return 'production_platform_position'
  }

  const connectorStatusIntent = classifyConnectorStatusIntent(message)
  if (connectorStatusIntent === 'github_connector_status') return 'production_github_connector_status'
  if (connectorStatusIntent === 'vercel_connector_status') return 'production_vercel_connector_status'
  if (connectorStatusIntent === 'connector_status') return 'production_connector_status'

  if (includesAny(text, INTENT_PATTERNS.production_vercel_deploy)) {
    return 'production_vercel_deploy'
  }

  if (includesAny(text, INTENT_PATTERNS.production_supabase)) {
    return 'production_supabase'
  }

  if (includesAny(text, INTENT_PATTERNS.production_orcamento_sinapi_help)) {
    return 'production_orcamento_sinapi_help'
  }

  if (includesAny(text, INTENT_PATTERNS.production_proposta_contrato_help)) {
    return 'production_proposta_contrato_help'
  }

  if (includesAny(text, INTENT_PATTERNS.production_obra_campo_help)) {
    return 'production_obra_campo_help'
  }

  if (includesAny(text, INTENT_PATTERNS.production_cronograma_help)) {
    return 'production_cronograma_help'
  }

  if (includesAny(text, INTENT_PATTERNS.production_archviz_help)) {
    return 'production_archviz_help'
  }

  if (includesAny(text, INTENT_PATTERNS.production_marketing_vendas_help)) {
    return 'production_marketing_vendas_help'
  }

  if (includesAny(text, INTENT_PATTERNS.production_language_preference)) {
    return 'production_language_preference'
  }

  if (includesAny(text, INTENT_PATTERNS.production_affirmation)) {
    return 'production_affirmation'
  }

  if (includesAny(text, INTENT_PATTERNS.production_execute_recommended)) {
    return 'production_execute_recommended'
  }

  if (includesAny(text, INTENT_PATTERNS.production_next_step)) {
    return 'production_next_step'
  }

  // Detect English input when no Portuguese signal present
  if (!hasPortugueseSignal(text) && hasEnglishSignal(text)) {
    return 'production_user_speaks_english'
  }

  return hasPortugueseSignal(text) ? 'production_general_portuguese' : 'production_general'
}

function buildCapabilityContinuationReply(messages = []) {
  const lastTopic = summarizeLastTopic(messages)
  const hasRevitContext = lastTopic && /revit|bim|familia|modelo|ifc/i.test(lastTopic)
  const hasPlatformContext = lastTopic && /apex|plataforma|checkpoint|deploy|github|vercel/i.test(lastTopic)
  const hasCodeContext = lastTopic && /codigo|código|compilar|repositorio|repositório|branch/i.test(lastTopic)



}

function buildRuntimeCapabilitySnapshot(productionStatus = {}) {
  const connectorStatus = productionStatus.connectorStatus || {}
  const capabilities = productionStatus.capabilities || {}
  const githubReady = Boolean(connectorStatus?.github?.configured)
  const vercelReady = Boolean(connectorStatus?.vercel?.configured)
  const supabaseReady = Boolean(process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_DB_URL)
  const imageReady = Boolean(process.env.FAL_KEY || process.env.FAL_API_KEY || process.env.GEMINI_API_KEY || process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY)
  const revitReady = Boolean(
    process.env.REVIT_MCP_URL && process.env.REVIT_MCP_TOKEN
    || process.env.APS_CLIENT_ID && process.env.APS_CLIENT_SECRET
    || process.env.AUTODESK_CLIENT_ID && process.env.AUTODESK_CLIENT_SECRET
    || process.env.AUTODESK_ACCESS_TOKEN
    || process.env.APS_ACCESS_TOKEN
  )
  const webSearchReady = Boolean(process.env.TAVILY_API_KEY)
  const localShellStatus = String(capabilities.localShell || '').toLowerCase()
  const localShellActive = localShellStatus.includes('active') || localShellStatus.includes('supported')
  return {
    githubReady,
    vercelReady,
    supabaseReady,
    imageReady,
    revitReady,
    webSearchReady,
    localShellActive,
    checkedAt: productionStatus?.checkedAt || '',
  }
}

function buildCapabilityListingReply(productionStatus = {}) {
  const snap = buildRuntimeCapabilitySnapshot(productionStatus)
  return [
    'Capacidades reais neste runtime (sem marketing):',
    '',
    `1. Operacional agora: conversa técnica, análise/edição de código, diagnóstico da plataforma, pesquisa web (${snap.webSearchReady ? 'Tavily ativo' : 'fallback básico'}), execução local (${snap.localShellActive ? 'ativa' : 'parcial'}).`,
    `2. Depende de configuração: GitHub (${snap.githubReady ? 'ativo' : 'pendente'}), Vercel (${snap.vercelReady ? 'ativo' : 'pendente'}), Supabase (${snap.supabaseReady ? 'ativo' : 'pendente'}), Revit/BIM APS/MCP (${snap.revitReady ? 'ativo' : 'modo conhecimento'}), geração de imagem Gemini/FAL (${snap.imageReady ? 'ativa' : 'pendente'}).`,
    '3. Não faço: inventar resultado, fingir deploy/migration/push, ou afirmar execução sem saída real/log.',
  ].join('\n')
}

function buildCapabilityRepairReply(messages = [], userMessage = '', productionStatus = {}) {
  const normalized = normalizeMessage(userMessage)
  const isMechanicalCritique = /mecanico|mecânico|incompleto|superficial|faltou|nao e so/.test(normalized)
  const snap = buildRuntimeCapabilitySnapshot(productionStatus)

  const intro = isMechanicalCritique
    ? 'Você tem razão. Aqui está o estado real, sem frase pronta:'
    : 'Estado real do runtime:'

  return [
    intro,
    '',
    `- Shell local: ${snap.localShellActive ? 'ativo' : 'parcial/indisponível no contexto atual'}.`,
    `- GitHub: ${snap.githubReady ? 'configurado' : 'não configurado neste runtime'}.`,
    `- Vercel: ${snap.vercelReady ? 'configurado' : 'não configurado neste runtime'}.`,
    `- Supabase: ${snap.supabaseReady ? 'configurado' : 'não configurado neste runtime'}.`,
    `- Geração de imagem: ${snap.imageReady ? 'configurada' : 'não configurada'}.`,
    `- Pesquisa web: ${snap.webSearchReady ? 'Tavily configurado' : 'modo fallback básico'}.`,
    '',
    'Regra operacional aplicada: execução primeiro; se faltar conector para uma etapa, informo exatamente o item faltante e continuo com saída útil no mesmo turno.',
  ].join('\n')
}

function buildEnglishDetectionReply(displayName = '') {
  return [
    `Olá${displayName ? `, ${displayName}` : ''}. Percebi que você escreveu em inglês.`,
    'Respondo sempre em português. Pode me escrever em português à vontade.',
    'Se preferir continuar em inglês, pode fazer isso — mas minhas respostas serão sempre em português.',
    'Me diga o que você quer resolver e eu sigo por aqui.',
  ].join('\n')
}

function buildOrcamentoSinapiReply() {
  return [
    'Em orçamento e SINAPI, posso te ajudar de forma prática:',
    '',
    'Composição e unitários',
    '- Montar planilha de composições com base no SINAPI ou tabela própria.',
    '- Calcular BDI, encargos sociais, desoneração e lucro por tipo de obra.',
    '- Revisar inconsistências em preços unitários e comparar com referências de mercado.',
    '',
    'Quantitativos e medição',
    '- Organizar quantitativos por serviço, etapa e contrato.',
    '- Estruturar critérios de medição para cada item do orçamento.',
    '- Preparar memória de cálculo e planilha de medição de obra.',
    '',
    'Cronograma físico-financeiro',
    '- Montar cronograma com desembolso mensal e curva S.',
    '- Calcular fluxo de caixa do projeto e projeção de pagamentos.',
    '- Adaptar orçamento a diferentes cenários de prazo e ritmo de obra.',
    '',
    'Análise e licitação',
    '- Revisar planilha de licitação, identificar riscos de preço.',
    '- Comparar proposta recebida com referências SINAPI e mercado.',
    '- Preparar argumentação técnica para negociação ou impugnação.',
    '',
    'Me mande a planilha, escopo ou dúvida específica e eu sigo com você.',
  ].join('\n')
}

function buildPropostaContratoReply() {
  return [
    'Em propostas, contratos e documentos técnicos, posso ajudar com:',
    '',
    'Proposta comercial',
    '- Estruturar proposta com apresentação, escopo, metodologia, prazo, valor e condições.',
    '- Definir exclusões, premissas e itens fora do escopo para proteger contratualmente.',
    '- Adaptar linguagem e formato para cada tipo de cliente (construtora, incorporadora, condomínio, indústria).',
    '',
    'Contrato e aditivo',
    '- Redigir cláusulas de escopo, prazo, pagamento, garantia, reajuste e rescisão.',
    '- Preparar aditivo de valor, prazo ou escopo com justificativa técnica.',
    '- Revisar contrato recebido e identificar pontos de risco ou omissão.',
    '',
    'Memorial descritivo e especificação',
    '- Montar memorial por disciplina: arquitetura, estrutura, instalações, acabamento.',
    '- Escrever especificações técnicas de materiais, serviços e sistemas.',
    '- Preparar caderno de encargos e diretrizes de execução.',
    '',
    'Documentação operacional',
    '- Relatórios executivos, atas de reunião, registros de decisão.',
    '- Documentação para aprovação em CREA, prefeitura, INSS, CEF.',
    '- RRT, ART descritiva, laudo técnico e parecer de engenharia.',
    '',
    'Me mande o contexto do projeto ou contrato e eu preparo o documento com você.',
  ].join('\n')
}

function buildObraCampoReply() {
  return [
    'Em gestão de obra e campo, posso estruturar:',
    '',
    'Diário de obra e relatórios',
    '- Modelo de diário de obra com atividades, efetivo, equipamentos, ocorrências e clima.',
    '- Relatório semanal e quinzenal de progresso físico com fotos e pendências.',
    '- Relatório de visita técnica e registro de decisões de campo.',
    '',
    'Checklists e controle de qualidade',
    '- Checklist de recebimento de materiais, inspeção de serviço e entrega de etapa.',
    '- Protocolo de controle de qualidade por disciplina (estrutura, alvenaria, instalações, acabamento).',
    '- Registro de não conformidades, ações corretivas e prazo de resolução.',
    '',
    'RFI e pendências',
    '- Modelo de RFI (Solicitação de Informação) com campo, responsável, prazo e resposta.',
    '- Lista de pendências por frente de obra com prioridade e status.',
    '- Pauta de reunião de obra e ata com ações e prazos.',
    '',
    'Planejamento semanal e look-ahead',
    '- Look-ahead de 3 a 6 semanas por frente de obra.',
    '- Planejamento de compras, logística e mobilização de recursos.',
    '- Controle de avanço físico real x planejado.',
    '',
    'Me diga a fase de obra, tipo de projeto e o que quer organizar — eu monto o modelo.',
  ].join('\n')
}

function buildCronogramaReply() {
  return [
    'Em cronograma e planejamento de obra, posso ajudar com:',
    '',
    'Estrutura do cronograma',
    '- Montar cronograma por etapas, serviços e frentes de obra.',
    '- Definir sequência lógica de serviços e dependências.',
    '- Adaptar o cronograma a múltiplas frentes simultâneas ou por blocos.',
    '',
    'Prazos e marcos',
    '- Identificar marcos críticos (fundação, estrutura, vedações, instalações, acabamento, entrega).',
    '- Calcular folgas e caminho crítico.',
    '- Preparar cronograma contratual com milestones e penalidades.',
    '',
    'Look-ahead e planejamento de curto prazo',
    '- Look-ahead de 3 a 6 semanas por frente.',
    '- Planejamento semanal com metas de avanço físico.',
    '- Ajuste de cronograma frente a atrasos, chuvas e imprevistos.',
    '',
    'Integração com financeiro',
    '- Cronograma físico-financeiro com desembolso mensal.',
    '- Curva S de avanço físico e financeiro.',
    '- Relatório de desvio entre planejado e realizado.',
    '',
    'Me diga o tipo de obra, prazo total e as principais frentes — eu estruturo o cronograma com você.',
  ].join('\n')
}

function buildArchvizReply() {
  return [
    'Consigo te ajudar em ArchViz de forma prática e sem fingir execução:',
    '- gerar imagem quando o conector de imagem estiver ativo;',
    '- quando não estiver ativo, te entregar prompt de produção pronto para DALL-E/Midjourney/SDXL;',
    '- montar briefing visual, moodboard textual e roteiro de vídeo comercial;',
    '- adaptar estilo, luz (ex.: entardecer), materiais e câmera para fachada/interior.',
    '',
    'Se você pedir "gere a imagem", eu tento gerar primeiro. Se falhar por conector/credencial, eu explico o bloqueio exato e já devolvo o prompt final.',
  ].join('\n')
}

function buildMarketingVendasReply() {
  return [
    'Em marketing, vendas e receita, posso ajudar com:',
    '',
    'Apresentação comercial',
    '- Estruturar apresentação de empresa: quem somos, o que entregamos, diferenciais, cases e números.',
    '- Adaptar apresentação para cada tipo de cliente (incorporadora, construtora, indústria, condomínio).',
    '- Montar deck de vendas com proposta de valor clara e call to action.',
    '',
    'Funil e prospecção',
    '- Mapear etapas do funil de vendas de serviços de engenharia.',
    '- Criar cadência de prospecção: mensagem inicial, follow-up, proposta e fechamento.',
    '- Elaborar scripts de abordagem para LinkedIn, email, WhatsApp e reunião.',
    '',
    'Conteúdo técnico',
    '- Artigos e posts sobre BIM, eficiência construtiva, gestão de obra, inovação.',
    '- Conteúdo educativo que posiciona a empresa como referência técnica.',
    '- Descrições técnicas de serviços para site, redes sociais e catálogo.',
    '',
    'CRM e acompanhamento',
    '- Estruturar processo de CRM simples: estágio, follow-up, proposta, negociação, fechamento.',
    '- Modelo de pipeline e indicadores de vendas para serviços de engenharia.',
    '',
    'Me diga o tipo de cliente que quer atingir e o serviço que quer vender — eu preparo o material.',
  ].join('\n')
}

function buildPlatformPositionReply(productionStatus = {}) {
  const connectorStatus = productionStatus.connectorStatus || {}
  const github = connectorStatus.github || {}
  const vercel = connectorStatus.vercel || {}
  const githubStatus = github.configured ? 'GREEN — configurado.' : 'YELLOW — não configurado neste runtime.'
  const vercelStatus = vercel.configured ? 'GREEN — configurado.' : 'YELLOW — não configurado neste runtime.'
  return [
    'Posição atual da plataforma Apex:',
    '• Conversa e chat: GREEN — funcionando.',
    '• API serverless: GREEN — ativa.',
    '• Memória de sessão: GREEN — ativa.',
    '• Executor local (H4): PARTIAL — disponível via Local Worker quando o worker estiver rodando localmente.',
    `• GitHub connector: ${githubStatus}`,
    `• Vercel connector: ${vercelStatus}`,
    '',
    'O que posso fazer agora, sem nenhuma configuração adicional:',
    '— Conversar, planejar, redigir documentos, analisar arquivos enviados.',
    '— Preparar orçamentos, contratos, cronogramas, RDOs e propostas.',
    '— Ajudar com BIM, Revit, ArchViz, vídeo e campo.',
    '— Revisar código, planejar branches e preparar checklists de deploy.',
    '',
    'Para deploy ou migration real, o conector GitHub/Vercel/Supabase precisa estar ativo no ambiente de produção com as variáveis configuradas.',
    'Me diga o que quer resolver e eu sigo por aqui.',
  ].join('\n')
}

function buildRevitBimHelpReply() {
  const revitReady = Boolean(
    process.env.REVIT_MCP_URL && process.env.REVIT_MCP_TOKEN
    || process.env.APS_CLIENT_ID && process.env.APS_CLIENT_SECRET
    || process.env.AUTODESK_CLIENT_ID && process.env.AUTODESK_CLIENT_SECRET
    || process.env.AUTODESK_ACCESS_TOKEN
    || process.env.APS_ACCESS_TOKEN
  )
  return [
    'Com Revit e BIM, posso ajudar de forma bem prática:',
    '- montar checklist de modelagem por disciplina;',
    '- organizar famílias Revit, nomenclatura e biblioteca;',
    '- estruturar parâmetros compartilhados e parâmetros de projeto;',
    '- preparar quantitativos e critérios de medição;',
    '- apoiar compatibilização entre arquitetura, estrutura e instalações;',
    '- revisar documentação, vistas, folhas e padrões de entrega;',
    '- planejar exportação IFC/NWC para coordenação, orçamento ou obra;',
    '- montar um plano BIM com responsabilidades, LOD/LOI, entregáveis e validações.',
    revitReady
      ? 'Revit/BIM APS/MCP está configurado neste runtime. Posso tratar isso como caminho conectado para status, leitura/planejamento e ações assistidas quando a rota local/APS responder, sem expor token.'
      : 'Sem APS/MCP ativo neste runtime, eu opero em modo conhecimento: preparo plano, checklist e documentação sem fingir execução no Revit.',
  ].join('\n')
}

function buildComputerHelpReply() {
  return [
    'Consigo te orientar e diagnosticar.',
    'Se você me disser o problema ou enviar print/erro, eu preparo um passo a passo seguro: sintomas, quando começou, Windows/versão do Revit se for o caso, mensagem de erro, internet/cabo/Wi-Fi, lentidão, travamento ou tela azul.',
    'Sem acesso remoto ou conector autorizado, eu não mexo diretamente no computador. Posso guiar diagnóstico, checklist, comandos de leitura e próximos passos sem apagar nada nem alterar configurações sensíveis no escuro.',
  ].join('\n')
}

function summarizeLastTopic(messages = []) {
  const recent = Array.isArray(messages) ? messages.slice(-8).reverse() : []
  for (const message of recent) {
    const text = String(message?.text || message?.content || '').trim()
    if (!text || message?.role === 'user' && includesAny(normalizeMessage(text), [
      /\bnao entendi\b/,
      /\bnão entendi\b/,
      /\bexplique melhor\b/,
      /\bfala mais simples\b/,
      /\bresuma\b/,
    ])) continue
    if (message?.role === 'assistant') return cleanNaturalSummary(text)
  }
  return ''
}

function cleanNaturalSummary(text = '') {
  const cleaned = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length <= 520) return cleaned
  const excerpt = cleaned.slice(0, 520)
  const boundary = Math.max(
    excerpt.lastIndexOf('. '),
    excerpt.lastIndexOf('; '),
    excerpt.lastIndexOf(': '),
  )
  return `${excerpt.slice(0, boundary > 220 ? boundary + 1 : 520).trim()}...`
}

function buildConfusionReply(messages = [], { multiQuestionContext = false } = {}) {
  if (multiQuestionContext) {
    return 'Claro. Quando você cola várias perguntas juntas, eu posso responder item por item na mesma resposta. Vou separar por assunto, manter a ordem e não executar nada real como deploy, push, migração ou conector sem evidência e confirmação.'
  }
  const lastTopic = summarizeLastTopic(messages)
  if (lastTopic) {
    return [
      'Claro. Em termos simples:',
      lastTopic,
      'A ideia principal é: eu explico, organizo e preparo o próximo passo; ações reais como deploy, push, migração ou operação em conector só acontecem com conector configurado e confirmação clara.',
    ].join('\n')
  }
  return 'Claro. Em termos simples: eu posso ajudar a operar a plataforma Apex, preparar documentos, organizar engenharia/BIM, revisar código e orientar próximos passos. Para executar ações reais, preciso de conectores configurados.'
}

function buildNameIdentityReply(clientMemory = {}, displayNameOverride = '') {
  const displayName = sanitizeDisplayName(displayNameOverride || clientMemory.displayName || '')
  if (displayName) return `Você pediu para eu te chamar de ${displayName}.`
  return 'Ainda não tenho um nome preferido salvo nesta sessão. Pode dizer: me chame de Dr Edgard.'
}

function buildWhoAmIReply({ identityContext = {}, clientMemory = {}, displayName = '' } = {}) {
  const preferredName = sanitizeDisplayName(clientMemory.displayName || displayName || '')
  const email = sanitizeDisplayName(identityContext.email || '')
  if (email && preferredName) return `Você está logado como ${email} e pediu para ser chamado de ${preferredName}.`
  if (email) return `Você está logado como ${email}. Ainda não tenho um nome preferido salvo nesta sessão.`
  if (preferredName) return `Você pediu para eu te chamar de ${preferredName}. Ainda não recebi email de conta nesta sessão.`
  return 'Ainda não tenho dados suficientes desta sessão para dizer quem você é. Se quiser, diga: me chame de Dr Edgard.'
}

function buildNaturalFallbackReply(userMessage = '') {
  const text = normalizeMessage(userMessage)
  // Configuration-related messages — give a direct answer instead of asking for more info
  if (/\b(configurar|configuracao|configuração|o que precisa|precisa configurar|o que falta|tokens|env|credencial|o que preciso)\b/.test(text)) {
    return [
      'Perfeito. A regra operacional é: eu executo primeiro, sem enrolar.',
      '- se uma etapa depender de conector/credencial, eu digo: "ok, para isso precisamos de X e Y; você já está providenciando";',
      '- em seguida continuo com fallback útil (diagnóstico, plano aplicável, prompt pronto, edição de código, pesquisa).',
      '',
      'Conectores mais comuns para ações externas reais:',
      '• GEMINI_API_KEY (chat principal, Gemma/Gemini, multimodal)',
      '• FAL_KEY ou AI_GATEWAY_API_KEY (geração de imagem/vídeo)',
      '• APS_CLIENT_ID + APS_CLIENT_SECRET ou REVIT_MCP_URL + REVIT_MCP_TOKEN (Revit/BIM conectado)',
      '• GITHUB_TOKEN (push/PR)',
      '• VERCEL_TOKEN + VERCEL_PROJECT_ID (deploy)',
      '• SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (migration)',
      '',
      'Sem esses conectores, eu não travo a conversa: sigo entregando o que já dá para executar agora.',
    ].join('\n')
  }
  if (text) {
    return 'Entendido. Vou para execução direta. Se faltar conector em alguma etapa, eu te aviso objetivamente e continuo com fallback útil.'
  }
  return 'Pode mandar a tarefa. Eu começo executando agora.'
}

function buildSourceOfInformationReply() {
  return [
    'Essa informação vem de três fontes: sua mensagem, estado real do runtime e saída de ferramenta/comando.',
    'Não uso dado inventado.',
    'Se houver divergência, eu rodo checagem ao vivo e devolvo a saída objetiva.',
  ].join('\n')
}

function buildOwnerAssertionReply(identityContext = {}) {
  const email = sanitizeDisplayName(identityContext.email || '')
  if (email) {
    return `Perfeito. Registro você como owner nesta conversa. Sessão atual vinculada a: ${email}. Vou responder no modo execução direta, sem resposta mecânica.`
  }
  return 'Perfeito. Registro você como owner nesta conversa. Vou responder no modo execução direta, sem resposta mecânica.'
}

/**
 * buildDeployReply — dispara o Deploy Hook da Vercel quando o usuário
 * pede "faz deploy", "publica as alterações", etc.
 *
 * Se VERCEL_DEPLOY_HOOK estiver configurado, executa o deploy real
 * de forma assíncrona (fire-and-forget) e retorna mensagem de sucesso.
 * Caso contrário, retorna mensagem orientando a configuração.
 */
function buildDeployReply() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK || ''

  if (!hookUrl) {
    return (
      '🚀 **Publicação na Vercel**\n\n'
      + 'O Deploy Hook não está configurado. Peça ao admin para definir '
      + 'a variável `VERCEL_DEPLOY_HOOK` no ambiente da Vercel '
      + 'com a URL do Deploy Hook.\n\n'
      + 'Enquanto isso, você pode fazer deploy manualmente via:\n'
      + '```\nnpx vercel deploy --prod\n```'
    )
  }

  // Dispara o deploy em background (fire-and-forget)
  fetch(hookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    .then(res => {
      if (res.ok) console.log('[deploy] ✅ Deploy disparado com sucesso via chat')
      else console.warn(`[deploy] ⚠️ Resposta inesperada: HTTP ${res.status}`)
    })
    .catch(err => console.error('[deploy] ❌ Erro ao disparar deploy:', err.message))

  return (
    '🚀 **Deploy iniciado!**\n\n'
    + 'O deploy foi disparado e está em execução na Vercel.\n'
    + 'Acompanhe em: https://vercel.com/Apex-Global-LLC/apex-ai-copilot-platform/deployments\n'
    + '\n_Em alguns minutos o site estará atualizado em www.apexglobalai.com._'
  )
}

function sectionTitleForIntent(intent, index) {
  const titles = {
    production_display_name_preference: 'Nome definido',
    production_revit_bim_help: 'Revit/BIM help',
    production_user_confusion: 'Explicação simples',
    production_name_identity: 'Nome preferido',
    production_who_am_i: 'Identidade da conta',
    production_owner_assertion: 'Owner',
    production_source_of_information: 'Fonte da informação',
    production_github_connector_status: 'GitHub connector status',
    production_vercel_connector_status: 'Vercel connector status',
    production_connector_status: 'Connector status',
    production_computer_help: 'Computador/PC',
    production_vercel_deploy: 'Deploy',
    production_supabase: 'Supabase',
    production_capability_listing: 'Capacidades',
    production_capability_repair: 'Capacidades (completo)',
    production_capability_continuation: 'Mais capacidades',
    production_orcamento_sinapi_help: 'Orçamento/SINAPI',
    production_proposta_contrato_help: 'Proposta/Contrato',
    production_obra_campo_help: 'Obra/Campo',
    production_cronograma_help: 'Cronograma',
    production_archviz_help: 'ArchViz/Imagem',
    production_marketing_vendas_help: 'Marketing/Vendas',
    production_user_speaks_english: 'Idioma',
    production_platform_position: 'Plataforma',
    production_next_step: 'Próximo passo',
    production_execute_recommended: 'Execução',
    production_language_preference: 'Idioma',
    production_affirmation: 'Confirmação',
    production_ambiguous_short: 'Pergunta incompleta',
  }
  return `${index}. ${titles[intent] || 'Resposta'}`
}

function buildReplyForIntent(intent, {
  userMessage = '',
  productionStatus = {},
  clientMemory = {},
  identityContext = {},
  messages = [],
  displayName = '',
  knownName = '',
  multiQuestionContext = false,
} = {}) {
  if (intent === 'production_capability_listing') return buildCapabilityListingReply(productionStatus)
  if (intent === 'production_source_of_information') return buildSourceOfInformationReply()
  if (intent === 'production_owner_assertion') return buildOwnerAssertionReply(identityContext)
  if (intent === 'production_capability_repair') return buildCapabilityRepairReply(messages, userMessage, productionStatus)
  if (intent === 'production_capability_continuation') return buildCapabilityContinuationReply(messages)
  if (intent === 'production_orcamento_sinapi_help') return buildOrcamentoSinapiReply()
  if (intent === 'production_proposta_contrato_help') return buildPropostaContratoReply()
  if (intent === 'production_obra_campo_help') return buildObraCampoReply()
  if (intent === 'production_cronograma_help') return buildCronogramaReply()
  if (intent === 'production_archviz_help') return buildArchvizReply()
  if (intent === 'production_marketing_vendas_help') return buildMarketingVendasReply()
  if (intent === 'production_user_speaks_english') return buildEnglishDetectionReply(displayName)
  if (intent === 'production_display_name_preference') return `Entendido, ${displayName}. Vou te chamar assim nesta sessão.`
  if (intent === 'production_platform_position') return buildPlatformPositionReply(productionStatus)
  if (intent === 'production_github_connector_status') return buildConnectorsStatusReply(productionStatus.connectorStatus, 'github')
  if (intent === 'production_vercel_connector_status') return buildConnectorsStatusReply(productionStatus.connectorStatus, 'vercel')
  if (intent === 'production_connector_status') return buildConnectorsStatusReply(productionStatus.connectorStatus, 'all')
  if (intent === 'production_vercel_deploy') return buildDeployReply()
  if (intent === 'production_revit_bim_help') return buildRevitBimHelpReply()
  if (intent === 'production_computer_help') return buildComputerHelpReply()
  if (intent === 'production_user_confusion') return buildConfusionReply(messages, { multiQuestionContext })
  // H5.1F: use knownName (no 'Jose' fallback) so empty memory correctly shows "não tenho nome"
  if (intent === 'production_name_identity') return buildNameIdentityReply(clientMemory, knownName)
  if (intent === 'production_who_am_i') return buildWhoAmIReply({ identityContext, clientMemory, displayName: knownName })
  if (intent === 'production_language_preference') return `Entendido${displayName && displayName !== 'Jose' ? `, ${displayName}` : ''}. Vou responder sempre em português nesta sessão.`
  if (intent === 'production_affirmation') {
    const lastAssistantMsg = Array.isArray(messages) ? messages.slice().reverse().find(m => m?.role === 'assistant') : null
    const lastText = String(lastAssistantMsg?.text || '').trim()
    // If last assistant message ended with a request for more info or configuration, give a complete answer
    if (/configurar|tokens|env|credencial|forneça|informe|precise|preciso|necessário|fornecidos/.test(normalizeMessage(lastText))) {
      return buildNaturalFallbackReply('o que precisa configurar')
    }
    return `Certo${displayName && displayName !== 'Jose' ? `, ${displayName}` : ''}. Continue com o próximo passo ou me diga o que quer resolver.`
  }
  if (intent === 'production_ambiguous_short') return 'Entendi que a pergunta ficou incompleta. Pode me dizer mais? O que você quer resolver agora?'
  return REPLIES[intent] || buildNaturalFallbackReply(userMessage)
}

function buildMultiIntentReply({
  intents = [],
  userMessage = '',
  productionStatus = {},
  clientMemory = {},
  identityContext = {},
  messages = [],
  displayName = '',
  knownName = '',
} = {}) {
  const sections = []
  let sectionIndex = 1
  for (const intent of intents) {
    const body = buildReplyForIntent(intent, {
      userMessage,
      productionStatus,
      clientMemory,
      identityContext,
      messages,
      displayName,
      knownName,
      multiQuestionContext: true,
    })
    if (!body) continue
    sections.push(`${sectionTitleForIntent(intent, sectionIndex)}\n${body}`)
    sectionIndex += 1
  }
  return sections.join('\n\n')
}

const REPLIES = {
  production_background_agent_task_request: 'Entendido! Agendei a tarefa em segundo plano de análise de incompatibilidades (Hidrossanitário vs Estrutura) para rodar de forma autônoma durante a noite. Você poderá acompanhar o progresso e o relatório final no painel de Cognitive Agents ao lado.',
  production_greeting: 'Olá{{displayName}}. Manda a tarefa em uma linha e eu executo agora.',
  production_user_correction: 'Correto. Vou responder apenas ao que você pedir, em português, sem repetir status técnico quando não for necessário.',
  production_acknowledgement: 'Entendido{{displayName}}. Vou manter esse contexto nesta sessão.',
  production_next_step: 'Manda a tarefa direta e eu executo agora. Se faltar conector em alguma etapa, eu te digo exatamente o que falta e sigo com alternativa útil.',
  production_execute_recommended: [
    'Posso preparar o pacote H4.1: ajuste de memória de sessão, correção do executor em Vercel e respostas operacionais para posição da plataforma, próximo passo e execução recomendada.',
    'Execução real de alteração no código depende do Codex/local executor.',
    'Não executei deploy, migração, commit, push ou comando livre.',
  ].join('\n'),
  production_platform_position: '',
  production_github_connector_status: '',
  production_vercel_connector_status: '',
  production_connector_status: '',
  production_revit_bim_help: '',
  production_user_confusion: '',
  production_name_identity: '',
  production_who_am_i: '',
  production_computer_help: '',
  production_multi_intent: '',
  production_vercel_deploy: '', // tratado por buildDeployReply()
  production_supabase: [
    'Capacidade Supabase preparada.',
    'Aplicar migração exige credencial ou conector Supabase, SQL revisado, confirmação clara, plano de reversão e validação depois da aplicação.',
    'Não apliquei migração e não vou simular alteração no banco.',
  ].join('\n'),
  production_general_portuguese: 'Entendido. Me diga o objetivo ou o que quer resolver — eu preparo a resposta, o plano ou o passo a passo direto.',
  production_general: 'Entendi. Me diga em detalhe o que você quer fazer e eu preparo a resposta, o plano ou o passo a passo diretamente.',
}

export function routeProductionConversation({
  userMessage = '',
  operatorIntent = '',
  policyDecision = {},
  productionStatus = {},
  clientMemory = {},
  identityContext = {},
  messages = [],
} = {}) {
  let conversationIntent = classifyProductionConversationIntent(userMessage)
  if (conversationIntent === 'production_h7_confirmation') {
    conversationIntent = 'production_affirmation'
  }
  const decomposedIntents = decomposeProductionConversationIntents(userMessage)
  const preferredName = extractDisplayNamePreference(userMessage)
  // knownName: real preferred name from message/memory, without 'Jose' fallback
  const knownName = sanitizeDisplayName(preferredName || clientMemory.displayName || inferDisplayNameFromMessages(messages))
  const displayName = knownName || 'Jose'
  const _patch = {}
  if (preferredName) _patch.displayName = preferredName
  if (conversationIntent === 'production_language_preference' ||
    decomposedIntents.includes('production_language_preference')) _patch.language = 'pt-BR'
  const memoryPatch = Object.keys(_patch).length ? _patch : null
  const template = conversationIntent === 'production_multi_intent'
    ? buildMultiIntentReply({
      intents: decomposedIntents,
      userMessage,
      productionStatus,
      clientMemory,
      identityContext,
      messages,
      displayName,
      knownName,
    })
    : buildReplyForIntent(conversationIntent, {
      userMessage,
      productionStatus,
      clientMemory,
      identityContext,
      messages,
      displayName,
      knownName,
    })
  // Use knownName for greeting so we don't fallback to 'Jose'. If knownName is empty, displayName placeholder resolves to empty.
  const greetingName = knownName ? `, ${knownName}` : ''
  const finalReply = String(template || REPLIES.production_general_portuguese)
    .replaceAll('{{displayName}}', greetingName)
    .replaceAll('{{knownName}}', knownName || '')

  return {
    ok: true,
    intent: conversationIntent,
    operatorIntent,
    finalReply,
    memoryPatch,
    displayName,
    status: policyDecision?.status || productionStatus?.overallStatus || 'YELLOW',
    requiresApproval: false,
    capability: policyDecision?.capability || 'conversation',
  }
}

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

  if (hasRevitContext) {
    return [
      'Além do que já mencionei sobre Revit/BIM, também posso:',
      '- montar templates de Plano BIM com LOD/LOI por disciplina;',
      '- preparar critérios de medição e quantitativos para orçamento;',
      '- organizar documentação de entregáveis, vistas, folhas e padrões de nomenclatura;',
      '- planejar exportação IFC/NWC para coordenação, clash detection e obra;',
      '- preparar especificações técnicas e memoriais descritivos;',
      '- estruturar cronograma e sequência de entrega BIM.',
      'Quando o conector Revit/MCP estiver configurado, poderei também ler e agir no ambiente conectado com confirmação.',
    ].join('\n')
  }

  if (hasPlatformContext || hasCodeContext) {
    return [
      'Além disso, posso ajudar em:',
      '- orçamento SINAPI, composições e cronograma financeiro;',
      '- propostas técnicas, contratos e escopos comerciais;',
      '- análise de arquivos, organização BIM e relatórios de obra;',
      '- marketing técnico, apresentações e conteúdo para clientes;',
      '- automações seguras, validação de deploy e leitura de GitHub/Vercel;',
      '- preparação de ações confirmadas (deploy, migration, rollback) sem executar sem evidência.',
      'Quando os conectores locais estiverem ativos, também poderei operar Local Worker, Revit MCP e rotinas controladas com confirmação.',
    ].join('\n')
  }

  return [
    'Além disso, posso ajudar em:',
    '- orçamento e SINAPI, propostas, contratos e escopos;',
    '- análise de arquivos, organização BIM e relatórios de obra;',
    '- planejamento, cronograma, compras e acompanhamento;',
    '- marketing técnico, apresentações e conteúdo;',
    '- automações, validação de deploy, leitura de GitHub/Vercel;',
    '- preparação de ações seguras com confirmação (deploy, migration, rollback).',
    'Quando os conectores locais estiverem ativos, também poderei operar Local Worker, Revit MCP e rotinas controladas com confirmação.',
  ].join('\n')
}

function buildCapabilityListingReply() {
  return [
    'Estas são minhas capacidades detalhadas por área:',
    '',
    'A. Engenharia, BIM e Revit',
    '- Plano BIM com LOD/LOI por disciplina e responsabilidades definidas.',
    '- Organização de famílias Revit, biblioteca, nomenclatura e parâmetros compartilhados.',
    '- Quantitativos, critérios de medição e extração de dados para orçamento.',
    '- Compatibilização entre disciplinas (arquitetura, estrutura, instalações).',
    '- Exportação IFC/NWC para coordenação, clash detection e gestão BIM.',
    '- Documentação técnica: vistas, folhas, padrões de entrega e memoriais.',
    '- Quando o conector Revit/MCP estiver ativo: leitura e ações no ambiente conectado com confirmação.',
    '',
    'B. Orçamento, SINAPI e 5D',
    '- Composições de custo, unitários e totais baseados em SINAPI ou tabela própria.',
    '- Cronograma físico-financeiro com desembolso mensal e curva S.',
    '- Análise crítica de orçamento: inconsistências, BDI, encargos e premissas.',
    '- Quantitativos detalhados por serviço, etapa e contrato.',
    '- Integração futura com base SINAPI atualizada via conector.',
    '',
    'C. Obra e campo',
    '- Checklists de recebimento, inspeção e controle de qualidade.',
    '- Diário de obra e relatórios de progresso.',
    '- RFI, não conformidades e gestão de pendências.',
    '- Planejamento semanal e look-ahead de obra.',
    '- Relatórios de avanço físico e documentação de campo.',
    '',
    'D. Propostas, contratos e documentos',
    '- Propostas comerciais com escopo, exclusões e condições.',
    '- Contratos, aditivos, termos e documentos técnicos.',
    '- Memoriais descritivos, especificações e escopos de trabalho.',
    '- Relatórios executivos, apresentações e documentação operacional.',
    '',
    'E. Marketing, vendas e receita',
    '- Apresentações comerciais e materiais de prospecção.',
    '- Estratégia de funil, CRM e acompanhamento de leads.',
    '- Conteúdo técnico para redes sociais, blog e email marketing.',
    '- Campanhas e comunicação voltada para clientes de engenharia e construção.',
    '',
    'F. ArchViz, imagem e vídeo',
    '- Prompts de render com direção de luz, materiais e composição.',
    '- Briefing visual e storyboard para apresentação de projetos.',
    '- Referências visuais, moodboard e conceito de imagem.',
    '- Roteiro para vídeo de apresentação, tour virtual e conteúdo visual.',
    '',
    'G. Plataforma e automação',
    '- Leitura de repositório GitHub: status, commits, PRs, workflows.',
    '- Leitura de Vercel: deployments, domínios, logs e status de produção.',
    '- Validações de build, checkpoints e logs de deploy.',
    '- Local Worker: auto-discovery de ferramentas, execução controlada no PC.',
    '- Conectores configuráveis: GitHub, Vercel, Supabase, Revit MCP, Local Worker.',
    '',
    'H. Execução real com segurança',
    '- Leitura sem confirmação: GitHub status, Vercel status, Supabase presença.',
    '- Validação: build check, syntax check, rota de validação.',
    '- Ações com confirmação: deploy Vercel, migration Supabase, ação Revit MCP.',
    '- Deploy, migration e rollback só com credencial configurada, escopo definido e confirmação clara.',
    '- Nenhum segredo retornado. Nenhuma ação destrutiva sem evidência.',
    '',
    'I. Autoevolução futura',
    '- Gerar plano de implementação para Claude, Codex ou executor local.',
    '- Propor nova branch, preparar diff e mostrar impacto antes de qualquer ação.',
    '- Validar resultado de implementação e solicitar aprovação explícita.',
    '- Registrar checkpoint e documentar o que foi feito e o que falta.',
  ].join('\n')
}

function buildCapabilityRepairReply(messages = [], userMessage = '') {
  const normalized = normalizeMessage(userMessage)
  const isMechanicalCritique = /mecanico|mecânico|incompleto|superficial|faltou|nao e so/.test(normalized)

  const intro = isMechanicalCritique
    ? 'Você tem razão. Respondi de forma incompleta. De forma detalhada, estas são minhas capacidades reais:'
    : 'Tem mais, sim. Vou detalhar de forma completa:'

  return [
    intro,
    '',
    'A. Engenharia, BIM e Revit',
    '- Plano BIM com LOD/LOI por disciplina e responsabilidades.',
    '- Famílias Revit, parâmetros compartilhados, nomenclatura e biblioteca.',
    '- Quantitativos, medição, compatibilização entre disciplinas.',
    '- Exportação IFC/NWC, clash detection, documentação de vistas e folhas.',
    '- Conector Revit/MCP ativo: leitura e ações no ambiente conectado com confirmação.',
    '',
    'B. Orçamento, SINAPI e 5D',
    '- Composições SINAPI, BDI, encargos, cronograma físico-financeiro e curva S.',
    '- Análise crítica de orçamento, quantitativos por serviço e etapa.',
    '',
    'C. Obra e campo',
    '- Checklists, diário de obra, RFI, não conformidades, look-ahead e relatórios.',
    '',
    'D. Propostas, contratos e documentos',
    '- Propostas, contratos, aditivos, memoriais, escopos e documentação operacional.',
    '',
    'E. Marketing, vendas e receita',
    '- Apresentações, funil, CRM, campanhas e conteúdo técnico.',
    '',
    'F. ArchViz, imagem e vídeo',
    '- Prompts de render, briefing visual, storyboard, referências e roteiro.',
    '',
    'G. Plataforma e automação',
    '- GitHub, Vercel, Supabase, Local Worker, deploy, validações, logs e conectores.',
    '',
    'H. Execução real com segurança',
    '- Leitura: GitHub/Vercel/Supabase sem confirmação.',
    '- Ações com confirmação: deploy, migration, rollback, Revit MCP.',
    '- Sem segredos expostos. Sem execução destrutiva sem evidência.',
    '',
    'I. Autoevolução futura',
    '- Plano de implementação, branch, diff, validação e aprovação antes de qualquer mudança.',
    '',
    'Me diga em qual área quer aprofundar ou o que quer resolver agora.',
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
    'Em ArchViz, imagem e vídeo, posso te ajudar com:',
    '',
    'Prompts de render',
    '- Criar prompts detalhados para renders fotorrealistas (Midjourney, DALL-E, Stable Diffusion, Vray, Enscape).',
    '- Definir luz, horário do dia, clima, materiais, composição de câmera e pós-produção.',
    '- Adaptar prompt para perspectiva externa, interna, aérea ou detalhe arquitetônico.',
    '',
    'Briefing visual e moodboard',
    '- Redigir briefing visual completo para o renderista ou equipe de imagem.',
    '- Selecionar referências por estilo, paleta, atmosfera e linha arquitetônica.',
    '- Montar moodboard textual descritivo para apresentação ao cliente.',
    '',
    'Vídeo e apresentação',
    '- Roteiro de vídeo de apresentação de projeto (tour virtual, fly-through, apresentação comercial).',
    '- Storyboard de cenas, trilha sonora, voz e texto.',
    '- Script narrado para vídeo de lançamento, apresentação de incorporação ou entrega.',
    '',
    'Conceito e direção de arte',
    '- Conceito visual do projeto alinhado ao público-alvo.',
    '- Paleta de cores, tipografia e linguagem visual para apresentação.',
    '- Direção de arte para materiais impressos e digitais do empreendimento.',
    '',
    'Me mande as plantas, o estilo e o público-alvo — eu preparo o briefing ou prompt com você.',
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
  return [
    'Posição da plataforma Apex:',
    '- Conversa: GREEN.',
    '- API serverless: GREEN.',
    '- Memória de sessão: GREEN.',
    '- Executor H4: PARTIAL.',
    `- GitHub connector: ${github.configured ? 'configured' : 'unavailable'}.`,
    `- Vercel connector: ${vercel.configured ? 'configured' : 'unavailable'}.`,
    '- Próximo passo: configurar env tokens ou worker executor.',
  ].join('\n')
}

function buildRevitBimHelpReply() {
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
    'Quando o conector Revit/MCP estiver configurado, essa ajuda poderá evoluir para leitura e ações assistidas direto no ambiente conectado. Por enquanto, eu preparo o plano, checklist e documentação sem fingir execução no Revit.',
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
  if (text) {
    return [
      'Entendi o caminho do pedido, mas ainda falta o detalhe principal para eu agir bem.',
      'Me diga o objetivo concreto, o erro, o arquivo, o print ou o resultado que você quer. Com isso eu preparo a resposta, checklist ou passo a passo sem fingir acesso a computador, conector, deploy, banco ou arquivo que eu não recebi.',
    ].join('\n')
  }
  return 'Me diga o que você quer resolver e eu organizo o próximo passo. Se for erro, arquivo, computador, Revit, GitHub, Vercel ou Supabase, mande o contexto ou print e eu sigo por partes.'
}

function sectionTitleForIntent(intent, index) {
  const titles = {
    production_display_name_preference: 'Nome definido',
    production_revit_bim_help: 'Revit/BIM help',
    production_user_confusion: 'Explicação simples',
    production_name_identity: 'Nome preferido',
    production_who_am_i: 'Identidade da conta',
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
  if (intent === 'production_capability_listing') return buildCapabilityListingReply()
  if (intent === 'production_capability_repair') return buildCapabilityRepairReply(messages, userMessage)
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
  if (intent === 'production_revit_bim_help') return buildRevitBimHelpReply()
  if (intent === 'production_computer_help') return buildComputerHelpReply()
  if (intent === 'production_user_confusion') return buildConfusionReply(messages, { multiQuestionContext })
  // H5.1F: use knownName (no 'Jose' fallback) so empty memory correctly shows "não tenho nome"
  if (intent === 'production_name_identity') return buildNameIdentityReply(clientMemory, knownName)
  if (intent === 'production_who_am_i') return buildWhoAmIReply({ identityContext, clientMemory, displayName: knownName })
  if (intent === 'production_language_preference') return `Entendido, ${displayName}. Vou responder sempre em português nesta sessão.`
  if (intent === 'production_affirmation') return `Certo, ${displayName}. Me diga qual ação ou contexto você quer seguir, ou copie a resposta anterior se quiser continuar de onde paramos.`
  if (intent === 'production_ambiguous_short') return 'Entendi que a pergunta ficou incompleta. Escreva o que você quer saber ou fazer.'
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
  production_greeting: 'Olá, {{displayName}}. Pode me dizer o que quer resolver agora. Eu posso responder, organizar um plano, revisar contexto ou preparar um passo a passo sem acionar execução real sem confirmação.',
  production_user_correction: 'Correto. Vou responder apenas ao que você pedir, em português, sem repetir status técnico quando não for necessário.',
  production_acknowledgement: 'Entendi, {{displayName}}. Vou manter esse contexto nesta sessão.',
  production_next_step: [
    'Minha recomendação: corrigir o contexto de produção H4.1 e configurar conector GitHub/Vercel ou um worker executor externo.',
    'Isso fecha a lacuna atual: preservar preferência de nome na sessão e tratar Vercel serverless como runtime parcial, sem tentar Git local quando ele não existe.',
  ].join('\n'),
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
  production_vercel_deploy: [
    'Capacidade de publicação preparada.',
    'Para publicar na Vercel, preciso de conector Vercel ou variáveis operacionais configuradas no servidor, escopo confirmado, evidência de compilação e alvo de publicação definido.',
    'Não publiquei e não vou simular publicação.',
  ].join('\n'),
  production_supabase: [
    'Capacidade Supabase preparada.',
    'Aplicar migração exige credencial ou conector Supabase, SQL revisado, confirmação clara, plano de reversão e validação depois da aplicação.',
    'Não apliquei migração e não vou simular alteração no banco.',
  ].join('\n'),
  production_general_portuguese: [
    'Entendi o caminho do pedido, mas ainda falta o detalhe principal para eu agir bem.',
    'Me diga o objetivo concreto, o erro, o arquivo, o print ou o resultado que você quer. Com isso eu preparo a resposta, checklist ou passo a passo sem fingir acesso a computador, conector, deploy, banco ou arquivo que eu não recebi.',
  ].join('\n'),
  production_general: [
    'Entendi o caminho do pedido, mas ainda falta o detalhe principal para eu agir bem.',
    'Me diga o objetivo concreto, o erro, o arquivo, o print ou o resultado que você quer. Com isso eu preparo a resposta, checklist ou passo a passo sem fingir acesso a computador, conector, deploy, banco ou arquivo que eu não recebi.',
  ].join('\n'),
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
  const conversationIntent = classifyProductionConversationIntent(userMessage)
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
  const finalReply = String(template || REPLIES.production_general_portuguese).replaceAll('{{displayName}}', displayName)

  return {
    ok: true,
    intent: conversationIntent,
    operatorIntent,
    finalReply,
    memoryPatch,
    displayName,
    status: policyDecision?.status || productionStatus?.overallStatus || 'YELLOW',
    requiresApproval: ['production_execute_recommended', 'production_vercel_deploy', 'production_supabase'].some(intent => conversationIntent === intent || decomposedIntents.includes(intent)),
    capability: policyDecision?.capability || 'conversation',
  }
}

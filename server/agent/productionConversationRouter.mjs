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
    /\b(ola|bom dia|boa tarde|boa noite|mas|voce|voces|vc|nao|entao|me diga|liste|proximo|passo|faz|execute|quero|deploy|publica|subir|aplica|migration|supabase|plataforma|posicao|posição|entendeu|revit|bim|modelagem|familias|famílias|quantitativo|meu nome|quem sou eu|computador|pc|internet|travando)\b/,
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
  production_capability_listing: [
    /\bo que sabe fazer\b/,
    /\bliste para mim\b/,
    /\bquais sao suas capacidades\b/,
    /\bo que voce consegue fazer\b/,
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

  return ordered
    .sort((a, b) => a.index - b.index)
    .map(item => item.intent)
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

  if (includesAny(text, INTENT_PATTERNS.production_execute_recommended)) {
    return 'production_execute_recommended'
  }

  if (includesAny(text, INTENT_PATTERNS.production_next_step)) {
    return 'production_next_step'
  }

  return hasPortugueseSignal(text) ? 'production_general_portuguese' : 'production_general'
}

function buildCapabilityListingReply() {
  return [
    'Posso atuar nestes blocos:',
    '',
    'Operação da plataforma Apex',
    '- Ler o contexto operacional, organizar prioridades, conduzir checkpoints e transformar pedidos soltos em plano de ação.',
    '',
    'Engenharia/construção',
    '- Estruturar fluxos de obra, risco, cronograma, qualidade, suprimentos e entregas técnicas.',
    '',
    'Código e repositório',
    '- Revisar código, propor correções, preparar alterações, validar compilação e explicar impacto técnico.',
    '',
    'GitHub',
    '- Preparar ramo, confirmação de alterações, solicitação de revisão e triagem de verificações quando o conector ou executor estiver configurado.',
    '',
    'Vercel',
    '- Preparar publicação, revisar variáveis, diagnosticar compilação e orientar envio ao ar com confirmação e conector configurado.',
    '',
    'Supabase',
    '- Planejar esquema, políticas de segurança, migrações, reversão e validação; aplicação real exige credencial, conector e confirmação.',
    '',
    'Documentos/propostas/contratos',
    '- Montar propostas, contratos, escopos, relatórios executivos, respostas comerciais e documentação operacional.',
    '',
    'BIM/orçamento/obra',
    '- Apoiar planejamento BIM, quantitativos, orçamento, medições, compras, compatibilização e acompanhamento de obra.',
    '',
    'Render/imagem/vídeo',
    '- Preparar comandos criativos, direção visual, roteiros, resumos de produção, imagem, vídeo e materiais de apresentação.',
    '',
    'Limitações atuais em produção',
    '- Não executo Git, terminal, publicação, migração ou alterações remotas sem executor/conector configurado, credencial válida e confirmação clara.',
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

function buildNameIdentityReply(clientMemory = {}) {
  const displayName = sanitizeDisplayName(clientMemory.displayName || '')
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
    production_platform_position: 'Plataforma',
    production_next_step: 'Próximo passo',
    production_execute_recommended: 'Execução',
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
  multiQuestionContext = false,
} = {}) {
  if (intent === 'production_capability_listing') return buildCapabilityListingReply()
  if (intent === 'production_display_name_preference') return `Entendido, ${displayName}. Vou te chamar assim nesta sessão.`
  if (intent === 'production_platform_position') return buildPlatformPositionReply(productionStatus)
  if (intent === 'production_github_connector_status') return buildConnectorsStatusReply(productionStatus.connectorStatus, 'github')
  if (intent === 'production_vercel_connector_status') return buildConnectorsStatusReply(productionStatus.connectorStatus, 'vercel')
  if (intent === 'production_connector_status') return buildConnectorsStatusReply(productionStatus.connectorStatus, 'all')
  if (intent === 'production_revit_bim_help') return buildRevitBimHelpReply()
  if (intent === 'production_computer_help') return buildComputerHelpReply()
  if (intent === 'production_user_confusion') return buildConfusionReply(messages, { multiQuestionContext })
  if (intent === 'production_name_identity') return buildNameIdentityReply(clientMemory)
  if (intent === 'production_who_am_i') return buildWhoAmIReply({ identityContext, clientMemory, displayName })
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
    'I understand the direction, but I still need the concrete detail to help well.',
    'Send the goal, error, file, screenshot or result you want. I can prepare an answer, checklist or next step without pretending to access a computer, connector, deployment, database or file I do not have.',
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
  const displayName = sanitizeDisplayName(preferredName || clientMemory.displayName || inferDisplayNameFromMessages(messages) || 'Jose')
  const memoryPatch = preferredName ? { displayName: preferredName } : null
  const template = conversationIntent === 'production_multi_intent'
    ? buildMultiIntentReply({
        intents: decomposedIntents,
        userMessage,
        productionStatus,
        clientMemory,
        identityContext,
        messages,
        displayName,
      })
    : buildReplyForIntent(conversationIntent, {
        userMessage,
        productionStatus,
        clientMemory,
        identityContext,
        messages,
        displayName,
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

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
    /\b(ola|bom dia|boa tarde|boa noite|mas|voce|voces|nao|entao|me diga|liste|proximo|passo|faz|execute|quero|deploy|publica|subir|aplica|migration|supabase|plataforma|posicao|posição|entendeu)\b/,
  ])
}

export function classifyProductionConversationIntent(message = '') {
  const text = normalizeMessage(message)

  if (!text) return 'production_next_step'
  if (extractDisplayNamePreference(message)) return 'production_display_name_preference'

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

  if (includesAny(text, [
    /\bo que sabe fazer\b/,
    /\bliste para mim\b/,
    /\bquais sao suas capacidades\b/,
    /\bo que voce consegue fazer\b/,
  ])) {
    return 'production_capability_listing'
  }

  if (includesAny(text, [
    /\bqual (a )?(posicao|posição|situacao|situação) da plataforma\b/,
    /\bstatus da plataforma\b/,
    /\bcomo esta a plataforma\b/,
  ])) {
    return 'production_platform_position'
  }

  const connectorStatusIntent = classifyConnectorStatusIntent(message)
  if (connectorStatusIntent === 'github_connector_status') return 'production_github_connector_status'
  if (connectorStatusIntent === 'vercel_connector_status') return 'production_vercel_connector_status'
  if (connectorStatusIntent === 'connector_status') return 'production_connector_status'

  if (includesAny(text, [
    /\b(faz deploy|fazer deploy|deploy)\b/,
    /\bpublica(r)?\b/,
    /\bsubir para vercel\b/,
  ])) {
    return 'production_vercel_deploy'
  }

  if (includesAny(text, [
    /\b(aplica|aplicar|aplique|roda|rodar|executa|executar).*\b(migration|migracao|supabase)\b/,
    /\bsupabase\b/,
  ])) {
    return 'production_supabase'
  }

  if (includesAny(text, [
    /\bexecute entao\b/,
    /\bexecuta entao\b/,
    /\bfa[cç]a entao\b/,
    /\bpode executar\b/,
    /\b(execute|executa|executar|faz|fazer|pode seguir|quero que execute).*\b(proximo|passo)\b/,
    /\b^(faz|pode seguir|segue|seguir)$\b/,
  ])) {
    return 'production_execute_recommended'
  }

  if (includesAny(text, [
    /\bproximo passo\b/,
    /\bqual o proximo passo\b/,
    /\bo que fazemos agora\b/,
    /\be agora\b/,
  ])) {
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

const REPLIES = {
  production_greeting: 'Olá, {{displayName}}. Estou ativa na plataforma Apex. Pode me pedir para revisar a plataforma, planejar o próximo passo, preparar documentos, analisar código ou conduzir um checkpoint.',
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
    'Entendi. Vou manter a resposta em português e focada no pedido.',
    'Posso transformar isso em plano, revisão, documento, análise técnica ou preparação de execução, sem fingir ações que dependem de conector.',
  ].join('\n'),
  production_general: [
    'Estou ativa na plataforma Apex.',
    'Posso ajudar com operação, planejamento, documentos, código, repositório, Vercel, Supabase, BIM, orçamento, render, imagem e vídeo.',
  ].join('\n'),
}

export function routeProductionConversation({
  userMessage = '',
  operatorIntent = '',
  policyDecision = {},
  productionStatus = {},
  clientMemory = {},
  messages = [],
} = {}) {
  const conversationIntent = classifyProductionConversationIntent(userMessage)
  const preferredName = extractDisplayNamePreference(userMessage)
  const displayName = sanitizeDisplayName(preferredName || clientMemory.displayName || inferDisplayNameFromMessages(messages) || 'Jose')
  const memoryPatch = preferredName ? { displayName: preferredName } : null
  const template = conversationIntent === 'production_capability_listing'
    ? buildCapabilityListingReply()
    : conversationIntent === 'production_display_name_preference'
      ? `Entendido, ${displayName}. Vou te chamar assim nesta sessão.`
      : conversationIntent === 'production_platform_position'
        ? buildPlatformPositionReply(productionStatus)
      : conversationIntent === 'production_github_connector_status'
        ? buildConnectorsStatusReply(productionStatus.connectorStatus, 'github')
      : conversationIntent === 'production_vercel_connector_status'
        ? buildConnectorsStatusReply(productionStatus.connectorStatus, 'vercel')
      : conversationIntent === 'production_connector_status'
        ? buildConnectorsStatusReply(productionStatus.connectorStatus, 'all')
      : REPLIES[conversationIntent]
  const finalReply = String(template || REPLIES.production_general_portuguese).replaceAll('{{displayName}}', displayName)

  return {
    ok: true,
    intent: conversationIntent,
    operatorIntent,
    finalReply,
    memoryPatch,
    displayName,
    status: policyDecision?.status || productionStatus?.overallStatus || 'YELLOW',
    requiresApproval: ['production_execute_recommended', 'production_vercel_deploy', 'production_supabase'].includes(conversationIntent),
    capability: policyDecision?.capability || 'conversation',
  }
}

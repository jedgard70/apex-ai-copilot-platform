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

function hasPortugueseSignal(text) {
  return includesAny(text, [
    /\b(ola|bom dia|boa tarde|boa noite|mas|voce|voces|nao|entao|me diga|liste|proximo|passo|faz|execute|quero|deploy|publica|subir|aplica|migration|supabase)\b/,
  ])
}

export function classifyProductionConversationIntent(message = '') {
  const text = normalizeMessage(message)

  if (!text) return 'production_next_step'

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
    /\bo que sabe fazer\b/,
    /\bliste para mim\b/,
    /\bquais sao suas capacidades\b/,
    /\bo que voce consegue fazer\b/,
  ])) {
    return 'production_capability_listing'
  }

  if (includesAny(text, [
    /\b(faz deploy|fazer deploy|deploy)\b/,
    /\bpublica(r)?\b/,
    /\bsubir para vercel\b/,
    /\bvercel\b/,
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
    /\b(execute|executa|executar|faz|fazer|pode seguir|quero que execute).*\b(proximo|passo)\b/,
    /\b^(faz|pode seguir|segue|seguir)$\b/,
  ])) {
    return 'production_execute_next_step'
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

const REPLIES = {
  production_greeting: 'Olá, Jose. Estou ativa na plataforma Apex. Pode me pedir para revisar a plataforma, planejar o próximo passo, preparar documentos, analisar código ou conduzir um checkpoint.',
  production_user_correction: 'Correto. Vou responder apenas ao que você pedir, em português, sem repetir status técnico quando não for necessário.',
  production_next_step: [
    'Minha recomendação: fechar primeiro o checkpoint de produção da conversa.',
    'O próximo passo é validar se cada intenção comum responde com uma mensagem própria em português: saudação, correção, capacidades, próximo passo, execução, publicação e Supabase.',
    'Depois disso, vale preparar o executor separado para ações reais como Git, compilação, publicação e migração.',
  ].join('\n'),
  production_execute_next_step: [
    'Posso preparar o próximo passo agora: definir o escopo, listar validações, montar o plano de execução e indicar o conector necessário.',
    'Para executar de verdade em produção, preciso do executor correto: GitHub para ramo, confirmação de alterações ou solicitação de revisão; Vercel para publicação; Supabase para migração; ou executor local controlado para terminal e compilação.',
    'Não executei nenhuma ação real nesta resposta.',
  ].join('\n'),
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
} = {}) {
  const conversationIntent = classifyProductionConversationIntent(userMessage)
  const finalReply = conversationIntent === 'production_capability_listing'
    ? buildCapabilityListingReply()
    : REPLIES[conversationIntent]

  return {
    ok: true,
    intent: conversationIntent,
    operatorIntent,
    finalReply,
    status: policyDecision?.status || productionStatus?.overallStatus || 'YELLOW',
    requiresApproval: ['production_execute_next_step', 'production_vercel_deploy', 'production_supabase'].includes(conversationIntent),
    capability: policyDecision?.capability || 'conversation',
  }
}

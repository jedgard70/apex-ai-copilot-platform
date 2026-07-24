import type { IntakeFile } from './fileIntake';
import type { SupabaseAccountState } from './supabaseAuthBootstrap';
import type { ChatIdentityContext, BusinessOutput } from '../main';
import type { DirectCutInitialConfig } from '../components/DirectCutPanel';

export function isCheckpointContinuationIntent(text: string) {
  return /\b(continuar checkpoint)\b/i.test(text)
}

export function isPlatformEngineeringIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|checar|check|verificar|verify)\b/i.test(lower)
  const hasKeyword = /\b(status da plataforma|platform engineering|abrir pr|supabase status|status supabase|deploy status|deployment status|pull request|branch plan|plano de branch)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function classifyConnectorStatusIntent(text: string) {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  const asksStatus = /\b(verifique|verificar|verifica|checar|cheque|validar|valide|status|conector|conectores)\b/.test(normalized)
  if (!asksStatus) return ''
  if (/\bgithub\b/.test(normalized)) return 'github'
  if (/\bvercel\b/.test(normalized)) return 'vercel'
  if (/\bconector|conectores\b/.test(normalized)) return 'all'
  return ''
}

export function buildConnectorStatusFallback(_text: string) {
  // H5.0D: connector/tool status is now served by backend H5 tool router (api/copilot/chat)
  return ''
}

export function isCodeSkillIntent(text: string) {
  return /\b(code skill|livre code|corrigir c[oó]digo)\b/i.test(text)
}

export function isWindowsCareIntent(text: string) {
  return /\b(windows care|windows repair|meu pc est[aá] lento|pc est[aá] lento|pc lento|computador lento|diagn[oó]stico windows|diagnostico windows)\b/i.test(text)
}

export function isRevitOperationalIntent(text: string) {
  return /\b(revit customization|revit plugin|pyrevit|revit templates?|configurar revit)\b/i.test(text)
}

export function isSkillExportFactoryAlias(text: string) {
  return /\b(skill export factory|abrir skill export factory)\b/i.test(text)
}

export function buildOperationalSkillResponse(text: string) {
  // Removed mechanical restrictions. Let it flow to the real AI.
  return ''
}

export function isOperationalGovernancePrompt(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return false
  const lineCount = trimmed.split(/\r?\n/).filter(line => line.trim()).length
  const hasGovernanceSignal = /\b(checkpoint|governança|governanca|governance|auditoria|audit|antes de push|before push|não faça|nao faca|não fazer|nao fazer|não executar|nao executar|não commitar|nao commitar|não fazer deploy|nao fazer deploy|não rodar migrations|nao rodar migrations|migration|migrations|tarefas|escopo autorizado|regras obrigatórias|regras obrigatorias|objetivo|critério green|criterio green|green|autorização|autorizacao|repo autorizado|repo|repository|branch obrigatória|branch obrigatoria|branch|commit|push|deploy|codex|claude|gemini|system prompt|instruções|instrucoes|relatório final|relatorio final)\b/i.test(trimmed)
  return hasGovernanceSignal && (lineCount >= 3 || trimmed.length > 450)
}

export function prefersPortuguese(text: string) {
  const hasPtSignal = /\b(vc|voce|você|ola|oi|eai|salve|bom dia|boa tarde|boa noite|quem sou|o que|serviços|servicos|preciso|ajuda|ajudar|me ajuda|orçamento|orcamento|consultoria|arquivo|anexar|upload|cronograma|marketing|vendas|construcao|construção|alvara|alvará|contrato|proposta|financeiro|campo|obra|quem é você|quem e voce|quem e vc|quem e apex|quem é a apex)\b|[ãõçáéíóú]/i.test(text)
  if (hasPtSignal) return true
  if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('pt')) {
    return true
  }
  return false
}

export function buildCopilotFailureMessage(userText: string) {
  const pt = prefersPortuguese(userText) || true
  return pt
    ? 'Desculpe, ocorreu um erro de conexão ao tentar processar sua solicitação.'
    : 'Sorry, a connection error occurred while trying to process your request.'
}

export function isIdentityQuestion(text: string) {
  return /\b(vc sabe quem sou eu|você sabe quem sou eu|voce sabe quem sou eu|quem sou eu|do you know who i am|who am i)\b/i.test(text.trim())
}

export function isAIIdentityQuestion(text: string) {
  const trimmed = text.trim()
  return /\b(quem [eé] (voc[eê]|vc|a apex)|o que (voc[eê]|vc) [eé]|quem [eé] apex|who are you|what is apex|quem e voce|quem e vc|o que e a apex)\b/i.test(trimmed)
}

export function buildAIIdentityAnswer(text: string) {
  if (!isAIIdentityQuestion(text)) return ''
  const pt = prefersPortuguese(text)
  return pt
    ? 'Sou a Apex AI. Como posso te ajudar?'
    : 'I am Apex AI. How can I help you?'
}

export function isTechnicalIdentityQuestion(text: string) {
  return /\b(role|workspace|tenant|persistence|sess[aã]o|session|email|dados t[eé]cnicos|technical|owner_admin)\b/i.test(text.trim())
}

export function buildChatIdentityContext(accountState: SupabaseAccountState | null): ChatIdentityContext {
  const profileName = accountState?.profile?.full_name?.trim() || undefined
  const role = accountState?.role || undefined
  return {
    email: accountState?.user?.email || accountState?.profile?.email || undefined,
    role,
    workspaceName: accountState?.tenant?.name || undefined,
    persistenceMode: accountState?.persistenceMode || undefined,
    tenantId: accountState?.tenant?.id || accountState?.profile?.default_tenant_id || undefined,
    isOwnerAdmin: role === 'owner_admin',
    profileName,
  }
}

export function buildIdentityAnswer(text: string, identity: ChatIdentityContext) {
  if (!isIdentityQuestion(text)) return ''

  const language = prefersPortuguese(text) ? 'PT' : 'EN'
  const technical = isTechnicalIdentityQuestion(text)
  const known: string[] = []
  const missing: string[] = []
  if (identity.profileName) known.push(`nome de perfil ${identity.profileName}`)
  else missing.push('nome completo/perfil')
  if (identity.email) known.push(`email ${identity.email}`)
  else missing.push('email')
  if (identity.role) known.push(`role ${identity.role}`)
  else missing.push('role')
  if (identity.workspaceName) known.push(`workspace ${identity.workspaceName}`)
  else missing.push('workspace')
  if (identity.persistenceMode) known.push(`persistence ${identity.persistenceMode}`)
  else missing.push('persistence')
  if (identity.tenantId) known.push(`tenant/workspace id ${identity.tenantId}`)
  else missing.push('tenant/workspace id')

  if (!known.length) {
    return language === 'PT'
      ? 'Ainda não tenho dados de sessão disponíveis nesta tela. Não vou inventar nome, email, função ou workspace sem contexto real.'
      : 'I do not have session identity data available in this screen yet. I will not invent a name, email, role or workspace without real context.'
  }

  if (technical) {
    const ownerLine = identity.isOwnerAdmin ? ' Você está marcado como owner_admin.' : ''
    const missingLine = missing.length ? ` Dados não disponíveis na sessão: ${missing.join(', ')}.` : ''
    return `Sim. Você está logado como ${identity.email || 'email não disponível'}, com role ${identity.role || 'não disponível'}, no workspace ${identity.workspaceName || 'não disponível'}, usando persistence ${identity.persistenceMode || 'não disponível'}.${ownerLine}${missingLine} Ainda não vou inventar dados além do que está disponível na sessão.`
  }

  if (language === 'PT') {
    const name = identity.profileName || (identity.email?.toLowerCase().includes('jedgard70') ? 'Jose' : 'usuario')
    const workspace = identity.workspaceName ? ` no workspace ${identity.workspaceName}` : ''
    const role = identity.role === 'owner_admin' ? 'administrador principal' : identity.role ? `com funcao ${identity.role}` : 'com sessao autenticada'
    const notKnown = identity.profileName ? '' : ' Ainda nao vou inventar nome completo alem do que esta salvo na sessao.'
    return `Sim. Voce e ${name}, esta logado como ${identity.email || 'email nao disponivel'}, ${role}${workspace}.${notKnown}`
  }

  const name = identity.profileName || (identity.email?.toLowerCase().includes('jedgard70') ? 'Jose' : 'the signed-in user')
  const workspace = identity.workspaceName ? ` in the ${identity.workspaceName} workspace` : ''
  const role = identity.role === 'owner_admin' ? 'the primary administrator' : identity.role ? `signed in with the ${identity.role} role` : 'signed in with an authenticated session'
  const notKnown = identity.profileName ? '' : ' I will not invent a full name beyond what is saved in the session.'
  return `Yes. You are ${name}, signed in as ${identity.email || 'email unavailable'}, ${role}${workspace}.${notKnown}`
}

export function isCapabilitiesQuestion(text: string) {
  return /\b(o que (mais )?(vc|voce|você)?\s*sabe( fazer)?|o que (vc|voce|você)?\s*faz|o que mais (vc|voce|você)?\s*faz|quais (são os )?servi[cç]os|lista de servi[cç]os|seus servi[cç]os|funcionalidades|habilidades|vc sabe responder|voce sabe responder|você sabe responder|capabilities|what else can you do|what can you do|what do you do|features)\b/i.test(text.trim())
}

export function isContactQuestion(text: string) {
  return /\b(como entrar em contato|falar com o suporte|falar com a equipe|telefone de contato|e-mail de contato|consultoria de contato|falar com|contact information|how to contact|contact support)\b/i.test(text.trim())
}

export function isUploadQuestion(text: string) {
  const trimmed = text.trim()
  if (/\b(pdf\.js|pdfjs|pdf-js)\b/i.test(trimmed)) return false
  return /\b(upload|arquivo|anexar|mandar imagem|enviar arquivo|screenshot|planta|pdf|file|attach)\b/i.test(trimmed)
}

export function isGreeting(text: string) {
  const trimmed = text.trim()
  if (/^(ol[aá]|oi|hey|hello|hi|bom dia|boa tarde|boa noite|e a[ií]|eai|e a\?|salve|tudo bem|tudo bom|como vai|como est[aá]|👋|🙏)(\s+apex)?[\s!?,.]*(tudo bem|tudo bom|como vai|como est[aá])?[\s!?,.]*$/i.test(trimmed)) {
    return true
  }
  const shortResponseRegex = /^(boa|tamo junto|valeu|obrigad[oa]|ok|certo|entendi|sim|n[aã]o|pode|t[aá]|ta|blz|bl[ée]z)$/i
  const cleaned = trimmed.replace(/[\s!?,.]+$/, '')
  return shortResponseRegex.test(cleaned)
}

export function buildGreetingReply(text: string) {
  const lower = text.trim().toLowerCase()
  if (/obrigad|valeu|tamo junto/.test(lower)) return 'Por nada! Se precisar de mais alguma coisa, é só falar.'
  const pt = prefersPortuguese(text)
  return pt
    ? 'Olá! 😊 Como posso ajudar no seu projeto hoje? Posso analisar plantas e documentos, gerar imagens e vídeos, revisar contratos, preparar orçamentos, criar campanhas de marketing, ou fazer pesquisas. É só me dizer o que precisa!'
    : 'Hello! 😊 How can I help with your project today? I can analyze plans and documents, generate images and videos, review contracts, prepare budgets, create marketing campaigns, or do research. Just tell me what you need!'
}

export function isPanelContextMessage(text: string): string | null {
  const m = text.match(/usuário abriu o painel (.+?) — projeto:/i)
  return m ? m[1].trim() : null
}

export function buildPanelContextReply(panelName: string): string {
  const panels: Record<string, string> = {
    'Field Operations': 'Painel Field Operations active! 🏗️ Aqui você registra vistorias de campo, cria relatórios diários, acompanha não-conformidades, controla RDOs e gerencia a equipe no canteiro. O que quer fazer?',
    'Budget Studio': 'Painel de Orçamento ativo! 📊 Posso criar orçamentos detalhados, estimar custos por metro quadrado, gerar memorial de compras, calcular BDI e emitir quantitativos. Envie uma planta ou me diga o tipo de projeto.',
    'Contracts Studio': 'Painel de Contratos ativo! 📄 Posso gerar minutas de contrato, revisar cláusulas, criar aditivos, elaborar distrato e preparar proposta comercial completa. O que precisa?',
    'Research Studio': 'Painel de Pesquisa ativo! 🔍 Posso pesquisar normas técnicas (ABNT, NBR), regulamentações, melhores práticas, fornecedores, preços de mercado e referências técnicas. Qual assunto quer explorar?',
    'CRM Pipeline': 'Painel CRM ativo! 🤝 Aqui você gerencia leads, pipeline de vendas, follow-ups, propostas enviadas e histórico de clientes. O que quer atualizar ou consultar?',
    'Financeiro': 'Painel Financeiro ativo! 💰 Posso analisar fluxo de caixa, conciliação, contas a pagar/receber, relatórios financeiros e indicadores de obra. O que precisa?',
    'Governance Hub': 'Painel de Governança ativo! 🔒 Aqui você controla conformidade, permissões, auditorias, relatórios de segurança e governança da plataforma. O que quer verificar?',
    'Marketing Analytics': 'Painel de Marketing ativo! 📣 Posso analisar métricas de campanhas, criar conteúdo para redes sociais, gerar copies, planejar lançamentos e preparar estratégia de vendas. O que quer fazer?',
    'Deployment Flow': 'Painel de Deploy ativo! 🚀 Aqui você gerencia deploys, ambientes, pipelines CI/CD e status dos serviços. O que quer verificar ou executar?',
    'Platform Navigator': 'Mapa da Plataforma ativo! 🗺️ Explore todos os módulos, ferramentas e conexões disponíveis. Use o mapa para navegar entre os estúdios ou acesse o manual interativo.',
    'Model Training': 'Painel de Treinamento ativo! 🧠 Aqui você gerencia skills, memórias, prompts e configurações do modelo de IA. O que quer ajustar?',
    'Technical Documentation': 'Documentação Técnica ativa! 📚 Acesse quickstart, arquitetura, referências de API, segurança e compliance da plataforma. O que quer consultar?',
  }
  return panels[panelName] || `Painel "${panelName}" ativo! Como posso ajudar com este módulo?`
}

export function buildProductFallbackAnswer(userText: string, identity: ChatIdentityContext) {
  const panelName = isPanelContextMessage(userText)
  if (panelName) return buildPanelContextReply(panelName)

  // Remove mechanical restrictions. Let it flow to the real AI.
  return ''
}

export function inferBusinessFocus(text: string): BusinessOutput['focus'] {
  if (/\b(contabilidade|contador|documentos cont[aá]beis|relat[oó]rio cont[aá]bil|imposto|nota fiscal|receita|despesa|contas a pagar|contas a receber|financeiro|fatura|pagamento|invoice|payment|accounting|accountant|accounts receivable|accounts payable|tax|bookkeeping)\b/i.test(text)) return 'finance-accounting'
  if (/\b(crm|lead|pipeline|follow-up|vendas|proposta comercial|sales|proposal)\b/i.test(text)) return 'crm-sales'
  if (/\b(usu[aá]rio|usuarios|users|permiss[oõ]es|dashboard admin|dashboard cliente|client dashboard|plano saas|saas plan)\b/i.test(text)) return 'admin'
  return 'all'
}

export function fileExtension(fileName: string) {
  return fileName.toLowerCase().split('.').pop() || ''
}

export function isBim3DIntent(text: string, attachment?: IntakeFile) {
  if (attachment?.kind === 'bim-cad') return true
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|girar|carregar|load)\b/i.test(lower)
  const hasKeyword = /\b(ifc|glb|gltf|obj|stl|fbx|rvt|dwg|dxf|skp|bim|cad|3d studio|viewer|visualizar modelo|clash|compatibiliza[cç][aã]o)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isInternalViewerFormat(fileName: string) {
  return ['ifc', 'glb', 'gltf', 'obj', 'stl', 'fbx'].includes(fileExtension(fileName))
}

export function isInternalImportFormat(fileName: string) {
  return ['rvt', 'dwg', 'dxf', 'skp'].includes(fileExtension(fileName))
}

export function inferDirectCutConfig(text: string, attachment?: IntakeFile): DirectCutInitialConfig {
  const lower = text.toLowerCase()
  const config: DirectCutInitialConfig = {
    duration: '8',
    aspectRatio: '16:9',
    style: 'hyper-real',
    cameraMovement: 'dolly-in',
  }

  if (/(reels|short|story|stories|tiktok|instagram|vertical|9:16)/i.test(lower)) {
    config.aspectRatio = '9:16'
    config.style = 'cinematic'
    config.cameraMovement = 'dolly-in'
  }
  if (/(venda|sales|comercial|cliente|real estate|imobili[aá]rio)/i.test(lower)) {
    config.style = config.style === 'cinematic' ? 'cinematic' : 'hyper-real'
  }
  if (/(tour|walkthrough|caminhada|3d scenes|movimento de c[aâ]mera|camera movement)/i.test(lower)) {
    config.cameraMovement = 'walkthrough'
    config.style = 'cinematic'
  }
  if (/(cinematic|cinem[aá]tico|efeito cinematogr[aá]fico)/i.test(lower)) {
    config.style = 'cinematic'
    config.cameraMovement = 'orbit'
  }
  if (/(bim|t[eé]cnico|technical)/i.test(lower)) {
    config.style = 'architectural'
    config.cameraMovement = 'top-reveal'
  }
  return config
}

export function asksExplicit3D(text: string) {
  return /\b(gerar 3d|gere 3d|3d|perspectiva|vista lateral|c[aâ]mera de lado|fachada|interior|ambiente real|walkthrough|eye-level|realistic room view|room render|render 3d)\b/i.test(text)
}

export function isBimStudioCommand(text: string) {
  return /\b(marque esse problema|isso est[aá] errado|criar tour|fazer anima[cç][aã]o|gerar passeio|roteiro 3d|mandar para directcut|enviar para directcut|mandar para archvis|enviar para archvis|add issue|save view|tour|animation|directcut|archvis)\b/i.test(text)
}

export function isProjectWorkspaceCommand(text: string) {
  return /\b(salvar projeto|novo projeto|exportar projeto|importar projeto|abrir projeto|renomear projeto|project workspace|save project|new project|export project|import project|open project|rename project)\b/i.test(text)
}


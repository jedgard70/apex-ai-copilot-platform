import type { IntakeFile } from './fileIntake';
import { isBim3DIntent } from './intentDetection'; // If not extracted yet
import { isAgentIntent } from './apexAgents';
import { isAiCostIntent } from './aiCostKnowledge';
import { isAutoupgradeIntent } from './autoupgradeKnowledge';
import { isAvatarVoiceIntent } from './avatarVoiceKnowledge';
import { isCampaignAutomationIntent } from './campaignAutomationKnowledge';
import { isDigitalTwinIntent } from './digitalTwinKnowledge';
import { isEvmSchedulerComplianceIntent } from './evmSchedulerComplianceKnowledge';
import { isKnowledgeBaseIntent } from './knowledgeBaseKnowledge';
import { isMetricsIntent } from './metricsKnowledge';
import { isMultiTenantIntent } from './multiTenantKnowledge';
import { isNotificationsIntent } from './notificationsKnowledge';
import { isPlatformMapIntent } from './platformMapKnowledge';
import { isPwaMobileIntent } from './pwaMobileKnowledge';
import { isSupplyChainIntent } from './supplyChainKnowledge';

export type PendingLayerDecision = {
  label: string;
  openCommand: string;
  goal: string;
}

export function isRevisionIntent(text: string) {
  return /\b(não existe|nao existe|não crie|nao crie|não invente|nao invente|não tem|nao tem|não mude|nao mude|não muda|nao muda|mantenha|preserve|corrigir|correção|correcao|errado|está errado|esta errado|lugar errado|faltou|remove|remova|tira|retira|fica no|fica na|fica ao|corrige|refaz|refaça|regenera|ajuste|arrume|keep|do not|don't|wrong|atrás da suíte|atras da suite|lavanderia|piscina não|pool)\b/i.test(text)
}

export function revisionChatLabel(text: string) {
  const lower = text.toLowerCase()
  if (/(não|nao).*(jardim|paisag).*(atr[aá]s).*(su[ií]te|suite)/i.test(lower)) return 'não criar jardim atrás da suíte'
  if (/(lavanderia|laundry|service).*(canto direito|lado direito)|não mude a lavanderia|nao mude a lavanderia/i.test(lower)) return 'preservar a lavanderia no canto direito'
  if (/(piscina|pool)/i.test(lower)) return 'manter a piscina no local, tamanho e proporção originais'
  if (/(banheiro|bathroom)/i.test(lower)) return 'manter o banheiro como está na planta'
  return text.trim()
}

export function isArchVisIntent(text: string, attachment?: IntakeFile) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|gere|crie|criar|renderizar|renderize|humanizar|humanize|refazer|refaça|editar|edit|quero|preciso|faça|faca|prepare|monte)\b/i.test(lower)
  const hasKeyword = /\b(archvis|render|planta humanizada|planta|fachada|interior|imagem|área gourmet|area gourmet|prompt de render)\b/i.test(lower)
  if (hasVerb && hasKeyword) return true

  if (attachment?.kind === 'image' && !text.trim()) return true
  if (attachment?.kind !== 'image') return false
  return /\b(gerar prompt de render|gere um prompt de render|prompt de render|crie uma planta humanizada|criar planta humanizada|planta humanizada|renderizar|renderize|renderize essa|renderizar essa|renderize esta|renderizar esta|área gourmet|area gourmet|refaz|refaça|regenera|regenerate|sem jardim|não crie|nao crie|deixa mais|usa madeira|melhorar imagem|editar imagem|trocar materiais|adicionar paisagismo|criar fachada|criar imagem de venda|humanize|image edit|edit image|render)\b/i.test(text)
}

export function isDirectCutIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|criar|create|gerar|generate|fazer|make|editar|edit|cortar|cut|montar|quero|preciso|faça|faca|prepare)\b/i.test(lower)
  const hasKeyword = /\b(video|v[ií]deo|directcut|roteiro|reels|apresenta[cç][aã]o|tour|anima[cç][aã]o|v[ií]deo de venda|video de venda|timelapse|shot list|storyboard|cinematic|cinem[aá]tico|transformar imagem em v[ií]deo|imagem em v[ií]deo|image to video|adicionar voz|add voice|mudar luz|alterar luz|relight|melhorar v[ií]deo|improve video|clip editor|editar v[ií]deo|3d scenes|movimento de c[aâ]mera|camera movement)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isDirectVideoNoPanelIntent(text: string) {
  return /\b(sem directcut|without directcut|sem abrir|without opening|sem painel|sem studio|direto no chat|direct in chat|gerar agora)\b/i.test(text)
}

export function isBudgetIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|fazer|make|calcular|calculate|estimar|estimate|montar|quero|preciso|faça|faca|prepare)\b/i.test(lower)
  const hasKeyword = /\b(or[cç]amento|orcamento|quantitativo|estimativa|materiais|proposta|quanto custa|custo de obra|memorial de compra|budget|estimate|quantity|takeoff|materials|proposal|construction cost)\b/i.test(lower)
  const isShortKeywordOnly = /^\s*(or[cç]amentos?|orcamentos?|budget|estimate|quantitativo|estimativa)\s*$/i.test(lower)
  return hasKeyword && (hasVerb || isShortKeywordOnly)
}

export function isProjectPackageIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|criar|create|gerar|generate|montar|assemble|preparar|prepare|organizar|build|quero|preciso|faça|faca)\b/i.test(lower)
  const hasKeyword = /\b(pacote completo|pacote do projeto|project package|complete package|entrega completa|prancha|apresenta[cç][aã]o para cliente|client presentation|cronograma f[ií]sico|cronograma financeiro|cronograma f[ií]sico financeiro|execution docs|documentos de execu[cç][aã]o|contract package|proposal package|full delivery bundle)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isGenerationHistoryIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|listar|list|consultar|check|revisar|review|quero|preciso|faça|faca)\b/i.test(lower)
  const hasKeyword = /\b(fila de gera[cç][aã]o|historico de gera[cç][aã]o|hist[oó]rico de gera[cç][aã]o|generation queue|generation history|history of generations|fila de render|hist[oó]rico de render|queue de exporta[cç][aã]o|export history)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isContractsIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|revisar|review|criar|create|gerar|generate|analisar|analyze|validar|validate|quero|preciso|faça|faca|prepare|montar)\b/i.test(lower)
  const hasKeyword = /\b(contrato|contrato simples|revisar contrato|jur[ií]dico|juridico|cl[aá]usula|clausula|proposta jur[ií]dica|memorial|memorial descritivo|alvar[aá]|licen[cç]a|permits?|permits americanos|documentos para aprova[cç][aã]o nos eua|us permits?|european permits?|eu building permit|planning permission|ahj|certificate of occupancy|fire marshal|ada|building control|compliance|endossos|endosso|art|rrt|habite-se|scope agreement|addendum|lawyer|legal|contracts?)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isResearchIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|pesquisar|search|buscar|find|analisar|analyze|investigar|investigate|quero|preciso|faça|faca|prepare)\b/i.test(lower)
  const hasKeyword = /\b(pesquisa de mercado|pesquisa na internet|faça uma pesquisa|faca uma pesquisa|concorrentes|pre[cç]o atualizado|sinapi|tabela sinapi|proposta comercial com pesquisa|estudo de mercado|market research|competitor|benchmark|pricing research|source check)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isFieldOpsIntent(text: string, attachment?: IntakeFile) {
  if (attachment?.kind === 'image' && /\b(obra|campo|rdo|di[aá]rio|relat[oó]rio|andamento|progresso|qualidade|seguran[cç]a|punch|pend[eê]ncia|foto de obra)\b/i.test(text)) return true
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|criar|create|gerar|generate|preencher|fill|fazer|make|quero|preciso|faça|faca|prepare)\b/i.test(lower)
  const hasKeyword = /\b(rdo|di[aá]rio de obra|relat[oó]rio de obra|andamento da obra|progresso da obra|checklist de qualidade|checklist de seguran[cç]a|equipe de obra|materiais entregues|pend[eê]ncia de obra|punch list|foto de obra|field operations?|field.?ops|daily report|jobsite|site report|quality checklist|safety checklist|field photo|construction site|obra|campo)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isBusinessLayerIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|criar|create|gerenciar|manage)\b/i.test(lower)
  const hasKeyword = /\b(crm|lead|leads|cliente|clientes|client workspace|vendas|sales|proposta comercial|financeiro|finance|fatura|invoice|pagamento|payment|plano saas|saas plan|dashboard admin|admin dashboard|dashboard cliente|client dashboard|pipeline|follow-up|cobran[cç]a|contabilidade|contador|documentos cont[aá]beis|relat[oó]rio cont[aá]bil|imposto|nota fiscal|receita|despesa|contas a pagar|contas a receber|accounting|accountant|accounts receivable|accounts payable|tax|bookkeeping)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isAuthIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|fazer|do|entrar|login|log in)\b/i.test(lower)
  const hasKeyword = /\b(login|entrar|cadastro|cadastrar|criar conta|sign in|signup|sign up|usu[aá]rio|usuarios|user account|sess[aã]o|session|permiss[oõ]es|permissions|auth|authentication|supabase)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isCopilotExecutionIntent(text: string) {
  const lower = text.toLowerCase()
  const explicitlyOpensPanel = /\b(abrir|abra|abre|open|mostrar|mostre|show|acessar|ativar|ative|launch|iniciar|start)\b/.test(lower)
  const namesExecutionPanel = /\b(copilot execution|local execution|painel de execu[cç][aã]o|execution panel|platform maintenance|repo checks|build checks|checkpoint manager)\b/i.test(lower)
  return explicitlyOpensPanel && namesExecutionPanel
}

export function suggestLayerOpenDecision(text: string, attachment?: IntakeFile): PendingLayerDecision | null {
  if (!text.trim()) return null
  if (isDirectCutIntent(text)) return { label: 'DirectCut Studio', openCommand: 'abrir directcut studio', goal: text }
  if (isProjectPackageIntent(text)) return { label: 'Project Package Pipeline', openCommand: 'abrir project package pipeline', goal: text }
  if (isGenerationHistoryIntent(text)) return { label: 'Generation Queue / History', openCommand: 'abrir generation history panel', goal: text }
  if (isContractsIntent(text)) return { label: 'Contracts / Permits Studio', openCommand: 'abrir contracts studio', goal: text }
  if (isBudgetIntent(text)) return { label: 'Budget / Quantity Studio', openCommand: 'abrir budget studio', goal: text }
  if (isResearchIntent(text)) return { label: 'Research / Market Intelligence Studio', openCommand: 'abrir research studio', goal: text }
  if (isFieldOpsIntent(text, attachment)) return { label: 'Field Operations / RDO Studio', openCommand: 'abrir field ops studio', goal: text }
  if (isBusinessLayerIntent(text)) return { label: 'Business Layer', openCommand: 'abrir crm layer', goal: text }
  if (isEvmSchedulerComplianceIntent(text)) return { label: 'CP11C Agents', openCommand: 'abrir evm scheduler panel', goal: text }
  if (isSupplyChainIntent(text)) return { label: 'Supply Chain / Suppliers Studio', openCommand: 'abrir supply chain studio', goal: text }
  if (isNotificationsIntent(text)) return { label: 'Notifications / Alerts Center', openCommand: 'abrir notifications panel', goal: text }
  if (isAiCostIntent(text)) return { label: 'AI Cost Dashboard', openCommand: 'abrir ai cost dashboard', goal: text }
  if (isMultiTenantIntent(text)) return { label: 'Multi-tenant Readiness', openCommand: 'abrir multi-tenant panel', goal: text }
  if (isPwaMobileIntent(text)) return { label: 'PWA / Mobile Field Mode', openCommand: 'abrir pwa panel', goal: text }
  if (isDigitalTwinIntent(text)) return { label: 'Digital Twin UI', openCommand: 'abrir digital twin panel', goal: text }
  if (isKnowledgeBaseIntent(text)) return { label: 'Knowledge Base', openCommand: 'abrir knowledge base panel', goal: text }
  if (isMetricsIntent(text)) return { label: 'Metrics Dashboard', openCommand: 'abrir metrics dashboard', goal: text }
  if (isCopilotExecutionIntent(text)) return { label: 'Copilot Execution', openCommand: 'abrir copilot execution panel', goal: text }
  if (isAgentIntent(text)) return { label: 'Cognitive Agents', openCommand: 'abrir agents panel', goal: text }
  if (isBim3DIntent(text, attachment)) return { label: 'BIM / 3D Studio', openCommand: 'abrir bim 3d studio', goal: text }
  if (isArchVisIntent(text, attachment)) return { label: 'ArchVis Studio', openCommand: 'abrir archvis studio', goal: text }
  if (isPromptLibraryIntent(text)) {
    const module = getPromptLibraryModule(text)
    return { label: module ? `Prompt Library (${module})` : 'Professional Prompt Library', openCommand: `abrir biblioteca de prompts${module ? ` ${module}` : ''}`, goal: text }
  }
  if (isAuthIntent(text)) return { label: 'Auth Panel', openCommand: 'abrir auth panel', goal: text }
  if (isAutoupgradeIntent(text)) return { label: 'Autoupgrade Center', openCommand: 'abrir autoupgrade center', goal: text }
  if (isStockIntent(text)) return { label: 'Bolsa de Valores', openCommand: 'abrir bolsa de valores', goal: text }
  if (isTripIntent(text)) return { label: 'Trip Planner', openCommand: 'abrir trip planner', goal: text }
  if (isPipelineIntent(text)) return { label: 'Pipeline Status', openCommand: 'abrir pipeline status', goal: text }
  if (isNRIntent(text)) return { label: 'NR Compliance CREA/OE', openCommand: 'abrir nr compliance', goal: text }
  if (isAccountingIntent(text)) return { label: 'Contabilidade CRC', openCommand: 'abrir contabilidade', goal: text }
  if (isPermitsIntent(text)) return { label: 'American Permits', openCommand: 'abrir american permits', goal: text }
  return null
}

export function isExplicitPanelOpenRequest(text: string) {
  const lower = text.toLowerCase().trim()
  const hasOpenVerb = /\b(abrir|abra|abre|open|ativar|ative|activate|launch|iniciar|start)\b/.test(lower)
  const hasProductionVerb = /\b(renderizar|renderize|renderiza|render|gerar|gere|gera|generate|fazer|faça|faca|faz|criar|crie|cria|create|produzir|produza|prepare|monte|montar|humanizar|humanize|editar|edite|edit|refazer|refaça|regenerar|regenerate|melhorar|melhore|improve|transformar|transforme|converter|converta)\b/.test(lower)
  const hasKnownLayer = /\b(archvis|directcut|render|planta humanizada|v[ií]deo de venda|video|imagem|fachada|interior|shot list|storyboard|humaniza[cç][aã]o|planta baixa|apresenta[cç][aã]o|tour virtual|anima[cç][aã]o|prompt de render|direct.?cut|bolsa|stock market|a[cç][oõ]es|b3|trip|viagem|pipeline|nr crea|nr compliance|segurança do trabalho|contabilidade|accounting|crc|american permits|building permit|field ops?|fieldops|field.?operations?|obra|campo|rdo|di[aá]rio de obra|or[cç]amento|orcamento|budget|proposta|contratos?|contracts?|permits?|finance?|financeiro|finan[cç]as|financas|marketing|campaign|campanha|deploy|deployment|implanta[cç][aã]o|publica[cç][aã]o|platform engineering|status da plataforma|platform status|pipeline deploy|publicar|publicação)\b/.test(lower)

  if (hasOpenVerb) {
    const hasPanelWord = /\b(layer|painel|panel|studio|estudio|workspace|m[oó]dulo|modulo|console)\b/.test(lower)
    return hasPanelWord || hasKnownLayer
  }

  // Production verbs (renderizar, fazer, criar, etc.) + keyword = intenção clara de usar o estúdio
  if (hasProductionVerb && hasKnownLayer) return true

  return false
}

export function isOwnerConsoleIntent(text: string) {
  return /\b(mission control|owner command|owner console|console owner|abrir console owner|abrir owner console)\b/i.test(text)
}

export function isStockIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|verificar|checar|check)\b/i.test(lower)
  const hasKeyword = /\b(bolsa|bolsa de valores|a[cç][oõ]es|stock market|stock|ações|acoes|b3|ibovespa|nasdaq|bitcoin|crypto|fii|fiis|fundo imobili[aá]rio|fii|financeiro|mercado financeiro|cota[cç][aã]o|cotações|cotacoes)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isTripIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|planejar|plan|criar|create)\b/i.test(lower)
  const hasKeyword = /\b(trip|viagem|travel|planejamento de viagem|planejar viagem|destino|destinos|roteiro|itiner[aá]rio|budget de viagem|travel budget|hospedagem|passagem|passagens)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isPipelineIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|verificar|check)\b/i.test(lower)
  const hasKeyword = /\b(pipeline|progresso|progress|tarefas? em execu[cç][aã]o|tasks? running|status de gera[cç][aã]o|generation status|o que est[aá] rodando|oque esta rodando|andamento|em execu[cç][aã]o|tarefas? ativas?|tasks? active|filas? de gera[cç][aã]o)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isNRIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|criar|create)\b/i.test(lower)
  const hasKeyword = /\b(nr compliance|nr crea|norma regulamentadora|normas regulamentadoras|segurança do trabalho|seguranca do trabalho|nr \d+|crea|oe|ordem dos engenheiros|engenharia de seguran[cç]a|documento nr|nr\b|compliance nr)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isAccountingIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|criar|create)\b/i.test(lower)
  const hasKeyword = /\b(contabilidade|accounting|crc|contador|cont[aá]bil|dre|balanço|balanco|irpj|imposto de renda|fiscal|obriga[cç][aõ]es fiscais|demonstrativo|demonstra[cç][aã]o cont[aá]bil|escritura[cç][aã]o|lançamento contabil|lancamento contabil|livro caixa|contas a pagar|contas a receber)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isPromptLibraryIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|buscar|search)\b/i.test(lower)
  const hasLibrary = /\b(biblioteca de prompts|prompt library|biblioteca de skills|skill library|prompts profission|professional prompt|presets?|categoria de prompt|mostrar prompts|ver prompts|buscar prompts)\b/i.test(lower)
  const hasDirect = /\b(prompt library|professional prompt|biblioteca de prompt)\b/i.test(lower)
  return hasDirect || (hasVerb && hasLibrary)
}

export function getPromptLibraryModule(text: string): string | undefined {
  const lower = text.toLowerCase()
  if (/\b(arquitetura|archvis|architect|render|humaniza|planta)\b/i.test(lower)) return 'archvis'
  if (/\b(directcut|direct.?cut|cinematogr[aá]fico|cinematic|v[ií]deo|video|film|movie)\b/i.test(lower)) return 'directcut'
  if (/\b(marketing|campanha|campaign|social media|disparo)\b/i.test(lower)) return 'marketing'
  if (/\b(contrato|contract|jur[ií]dico|legal)\b/i.test(lower)) return 'contracts'
  if (/\b(export|canvas|template|design)\b/i.test(lower)) return 'export'
  return undefined
}

export function isPermitsIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|criar|create)\b/i.test(lower)
  const hasKeyword = /\b(american permits?|permits? americanos?|building permits?|us permits?|construction permits?|permits? eua|permits? usa|alvar[aá] americano|licença americana|licenca americana|permit americano|international permits?|exporta[cç][aã]o de serviço|exportacao de servico)\b/i.test(lower)
  return hasVerb && hasKeyword
}

export function isCheckpointContinuationIntent(text: string) {
  return /\b(continuar checkpoint)\b/i.test(text)
}
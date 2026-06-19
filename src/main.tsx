import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUp,
  Bot,
  Building2,
  LogOut,
  Mic,
  Paperclip,
  Plus,
  Settings,
  Square,
  Terminal,
  X,
} from 'lucide-react'
import { ArchVisPanel } from './components/ArchVisPanel'
import { AgentsPanel } from './components/AgentsPanel'
import { AiCostDashboardPanel } from './components/AiCostDashboardPanel'
import { AuthPanel } from './components/AuthPanel'
import { Bim3DPanel, BimArchVisOutput, BimTourOutput } from './components/Bim3DPanel'
import { BudgetPanel } from './components/BudgetPanel'
import { ContractsPanel } from './components/ContractsPanel'
import { CopilotExecutionPanel } from './components/CopilotExecutionPanel'
import { CrmPanel } from './components/CrmPanel'
import { DigitalTwinPanel } from './components/DigitalTwinPanel'
import { DirectCutInitialConfig, DirectCutPanel } from './components/DirectCutPanel'
import { EvmSchedulerCompliancePanel } from './components/EvmSchedulerCompliancePanel'
import { ExportCenterPanel } from './components/ExportCenterPanel'
import { FinancePanel } from './components/FinancePanel'
import { FieldOpsPanel } from './components/FieldOpsPanel'
import { KnowledgeBasePanel } from './components/KnowledgeBasePanel'
import { MetricsDashboardPanel } from './components/MetricsDashboardPanel'
import { MultiTenantPanel } from './components/MultiTenantPanel'
import { NotificationsPanel } from './components/NotificationsPanel'
import { ProjectWorkspacePanel } from './components/ProjectWorkspacePanel'
import { PwaMobilePanel } from './components/PwaMobilePanel'
import { ResearchPanel } from './components/ResearchPanel'
import { SaasAdminPanel } from './components/SaasAdminPanel'
import { SkillExportPanel } from './components/SkillExportPanel'
import { SkillUpdatePanel } from './components/SkillUpdatePanel'
import { SupplyChainPanel } from './components/SupplyChainPanel'
import { UserAccountPanel } from './components/UserAccountPanel'
import { classifyFile, formatSize, IntakeFile, isVisionReady, readFileAsDataUrl, readImageDimensions } from './lib/fileIntake'
import { extractPdfText } from './lib/pdfExtractor'
import {
  createProject,
  exportProject,
  importProject,
  loadActiveProject,
  loadProjects,
  ProjectFileRecord,
  ProjectWorkspace,
  removeAllProjects,
  setActiveProjectId,
  upsertProject,
} from './lib/projectWorkspace'
import { syncProjectLocalToRemote } from './lib/projectPersistenceAdapter'
import { SupabaseAccountState, loadSupabaseAccountState } from './lib/supabaseAuthBootstrap'
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from './lib/supabaseClient'
import { isSkillUpdateIntent, isTrustedGlobalSkillSource, ProjectMemoryUpdate, SkillUpdateApplyResult } from './lib/skillUpdateEngine'
import { isSkillExportIntent } from './lib/skillExportFactory'
import { BudgetPlan } from './lib/budgetKnowledge'
import type { CopilotExecutionResult } from './lib/copilotExecutionModel'
import { ContractsPlan } from './lib/contractsKnowledge'
import { BusinessPlan } from './lib/crmFinanceKnowledge'
import { isExportIntent } from './lib/exportCenter'
import { FieldOpsPlan } from './lib/fieldOpsKnowledge'
import { ResearchPlan } from './lib/researchKnowledge'
import { selectTool, tools } from './lib/toolRegistry'
import { isAgentIntent } from './lib/apexAgents'
import { AiCostPlan, isAiCostIntent } from './lib/aiCostKnowledge'
import { DigitalTwinPlan, isDigitalTwinIntent } from './lib/digitalTwinKnowledge'
import { EvmSchedulerCompliancePlan, isEvmSchedulerComplianceIntent } from './lib/evmSchedulerComplianceKnowledge'
import { KnowledgeBasePlan, isKnowledgeBaseIntent } from './lib/knowledgeBaseKnowledge'
import { MetricsPlan, isMetricsIntent } from './lib/metricsKnowledge'
import { MultiTenantPlan, isMultiTenantIntent } from './lib/multiTenantKnowledge'
import { isNotificationsIntent, NotificationsPlan } from './lib/notificationsKnowledge'
import { PwaMobilePlan, isPwaMobileIntent } from './lib/pwaMobileKnowledge'
import { isSupplyChainIntent, SupplyChainPlan } from './lib/supplyChainKnowledge'
import './styles.css'

type H5ToolCard = {
  id: string
  label: string
  executionClass: string
  status: string
  missing: string[]
  mutates: boolean
  available: boolean
  connectorDetail?: Record<string, unknown>
}

type H7ConfirmationButton = {
  id: string
  label: string
  variant: 'primary' | 'secondary' | 'ghost'
  message: string | null
}

type H7Confirmation = {
  show: boolean
  intent?: string
  pendingAction?: Record<string, unknown> | null
  buttons: H7ConfirmationButton[]
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  attachment?: IntakeFile
  toolCards?: H5ToolCard[]
  confirmation?: H7Confirmation | null
}

type ChatIdentityContext = {
  email?: string
  role?: string
  workspaceName?: string
  persistenceMode?: string
  tenantId?: string
  isOwnerAdmin: boolean
  profileName?: string
}

type ClientMemory = {
  displayName?: string
  language?: string
  pendingH6Action?: Record<string, unknown> | null
}

type UiLanguage = 'EN' | 'PT'

type ArchVisOutput = {
  source: IntakeFile
  output: string
  conversationContext: string[]
}

type DirectCutOutput = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  initialConfig?: DirectCutInitialConfig
}

type Bim3DOutput = {
  source: IntakeFile
}

type BudgetOutput = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
}

type ContractsOutput = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
}

type ResearchOutput = {
  goal: string
  conversationContext: string[]
}

type FieldOpsOutput = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
}

type BusinessOutput = {
  goal: string
  focus: 'admin' | 'crm-sales' | 'finance-accounting' | 'all'
  conversationContext: string[]
}

type AgentsOutput = {
  goal: string
  conversationContext: string[]
}

type EvmSchedulerComplianceOutput = {
  goal: string
  conversationContext: string[]
}

type SupplyChainOutput = {
  goal: string
  conversationContext: string[]
}

type NotificationsOutput = {
  goal: string
  conversationContext: string[]
}

type AiCostOutput = {
  goal: string
  conversationContext: string[]
}

type SimpleStudioOutput = {
  goal: string
  conversationContext: string[]
}

type BimCommand = {
  id: string
  text: string
}

function normalizeRevisionConstraint(text: string) {
  const normalized = text.trim()
  const lower = normalized.toLowerCase()
  if (/(não|nao).*(jardim|paisag|garden).*(atr[aá]s|behind).*(su[ií]te|suite)/i.test(lower)) {
    return 'Do not create garden, landscaping, patio, grass or exterior continuation behind the suite.'
  }
  if (/(lavanderia|laundry|service).*(canto direito|lado direito|right side|right corner)|não mude a lavanderia|nao mude a lavanderia/i.test(lower)) {
    return 'Preserve laundry/service area on the right side as shown in the original plan.'
  }
  if (/(piscina|pool).*((não|nao).*(muda|mover|altera|change|move)|não muda|nao muda)/i.test(lower)) {
    return 'Keep pool exactly in original location, size and proportion.'
  }
  if (/(piscina|pool).*(lugar errado|wrong place|wrong location|errado)/i.test(lower)) {
    return 'Keep pool exactly in original location, size and proportion.'
  }
  if (/(mantenha|preserve|keep).*(banheiro|bathroom)/i.test(lower)) {
    return 'Preserve the bathroom exactly as shown in the original plan.'
  }
  if (/(isso|isto).*(não|nao).*(existe|tem).*(planta|plan)/i.test(lower)) {
    return `Do not add this element because it does not exist in the original plan: ${normalized}`
  }
  if (/(não|nao).*(existe|tem|crie|criar|invent).*/i.test(lower)) {
    return `Do not invent this element or condition: ${normalized}`
  }
  if (/(fica|est[aá]|preserve|mantenha|manter|keep)/i.test(lower)) {
    return `Preserve this correction from the owner: ${normalized}`
  }
  return `Apply this locked revision constraint: ${normalized}`
}

function isRevisionIntent(text: string) {
  return /\b(não existe|nao existe|não crie|nao crie|não invente|nao invente|não tem|nao tem|não mude|nao mude|não muda|nao muda|mantenha|preserve|corrigir|correção|correcao|errado|está errado|esta errado|lugar errado|faltou|remove|remova|tira|retira|fica no|fica na|fica ao|corrige|refaz|refaça|regenera|ajuste|arrume|keep|do not|don't|wrong|atrás da suíte|atras da suite|lavanderia|piscina não|pool)\b/i.test(text)
}

function revisionChatLabel(text: string) {
  const lower = text.toLowerCase()
  if (/(não|nao).*(jardim|paisag).*(atr[aá]s).*(su[ií]te|suite)/i.test(lower)) return 'não criar jardim atrás da suíte'
  if (/(lavanderia|laundry|service).*(canto direito|lado direito)|não mude a lavanderia|nao mude a lavanderia/i.test(lower)) return 'preservar a lavanderia no canto direito'
  if (/(piscina|pool)/i.test(lower)) return 'manter a piscina no local, tamanho e proporção originais'
  if (/(banheiro|bathroom)/i.test(lower)) return 'manter o banheiro como está na planta'
  return text.trim()
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestampForFileName() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
}

function isDebugEnabled() {
  try {
    return localStorage.getItem('apex_debug') === 'true' || import.meta.env.VITE_APEX_DEBUG === 'true'
  } catch {
    return import.meta.env.VITE_APEX_DEBUG === 'true'
  }
}

function loadClientMemory(): ClientMemory {
  try {
    const parsed = JSON.parse(localStorage.getItem('apex_copilot_client_memory') || '{}') as ClientMemory
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveClientMemory(memory: ClientMemory) {
  try {
    localStorage.setItem('apex_copilot_client_memory', JSON.stringify(memory))
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

function pickCanonicalReply(data: Record<string, unknown>, fallback: string) {
  const candidates = [
    data.finalReply,
    (data.operator as { finalReply?: unknown } | undefined)?.finalReply,
    data.reply,
    data.message,
  ]
  const reply = candidates.find(candidate => typeof candidate === 'string' && candidate.trim())
  return typeof reply === 'string' ? reply : fallback
}

function isArchVisIntent(text: string, attachment?: IntakeFile) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|gere|crie|criar|renderizar|renderize|humanizar|humanize|refazer|refaça|editar|edit)\b/i.test(lower)
  const hasKeyword = /\b(archvis|render|planta humanizada|planta|fachada|interior|imagem|área gourmet|area gourmet|prompt de render)\b/i.test(lower)
  if (hasVerb && hasKeyword) return true

  if (attachment?.kind === 'image' && !text.trim()) return true
  if (attachment?.kind !== 'image') return false
  return /\b(gerar prompt de render|gere um prompt de render|prompt de render|crie uma planta humanizada|criar planta humanizada|planta humanizada|renderizar|renderize|renderize essa|renderizar essa|renderize esta|renderizar esta|área gourmet|area gourmet|refaz|refaça|regenera|regenerate|sem jardim|não crie|nao crie|deixa mais|usa madeira|melhorar imagem|editar imagem|trocar materiais|adicionar paisagismo|criar fachada|criar imagem de venda|humanize|image edit|edit image|render)\b/i.test(text)
}

function isDirectCutIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|criar|create|gerar|generate|fazer|make|editar|edit|cortar|cut|montar)\b/i.test(lower)
  const hasKeyword = /\b(video|v[ií]deo|directcut|roteiro|reels|apresenta[cç][aã]o|tour|anima[cç][aã]o|v[ií]deo de venda|video de venda|timelapse|shot list|storyboard|cinematic|cinem[aá]tico|transformar imagem em v[ií]deo|imagem em v[ií]deo|image to video|adicionar voz|add voice|mudar luz|alterar luz|relight|melhorar v[ií]deo|improve video|clip editor|editar v[ií]deo|3d scenes|movimento de c[aâ]mera|camera movement)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isBudgetIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|fazer|make|calcular|calculate|estimar|estimate|montar)\b/i.test(lower)
  const hasKeyword = /\b(or[cç]amento|orcamento|quantitativo|estimativa|materiais|proposta|quanto custa|custo de obra|memorial de compra|budget|estimate|quantity|takeoff|materials|proposal|construction cost)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isContractsIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|revisar|review|criar|create|gerar|generate|analisar|analyze|validar|validate)\b/i.test(lower)
  const hasKeyword = /\b(contrato|contrato simples|revisar contrato|jur[ií]dico|juridico|cl[aá]usula|clausula|proposta jur[ií]dica|memorial|memorial descritivo|alvar[aá]|licen[cç]a|permits?|permits americanos|documentos para aprova[cç][aã]o nos eua|us permits?|european permits?|eu building permit|planning permission|ahj|certificate of occupancy|fire marshal|ada|building control|compliance|endossos|endosso|art|rrt|habite-se|scope agreement|addendum|lawyer|legal|contract)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isResearchIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|pesquisar|search|buscar|find|analisar|analyze|investigar|investigate)\b/i.test(lower)
  const hasKeyword = /\b(pesquisa de mercado|pesquisa na internet|faça uma pesquisa|faca uma pesquisa|concorrentes|pre[cç]o atualizado|sinapi|tabela sinapi|proposta comercial com pesquisa|estudo de mercado|market research|competitor|benchmark|pricing research|source check)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isFieldOpsIntent(text: string, attachment?: IntakeFile) {
  if (attachment?.kind === 'image' && /\b(obra|campo|rdo|di[aá]rio|relat[oó]rio|andamento|progresso|qualidade|seguran[cç]a|punch|pend[eê]ncia|foto de obra)\b/i.test(text)) return true
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|criar|create|gerar|generate|preencher|fill|fazer|make)\b/i.test(lower)
  const hasKeyword = /\b(rdo|di[aá]rio de obra|relat[oó]rio de obra|andamento da obra|progresso da obra|checklist de qualidade|checklist de seguran[cç]a|equipe de obra|materiais entregues|pend[eê]ncia de obra|punch list|foto de obra|field operations|daily report|jobsite|site report|quality checklist|safety checklist|field photo)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isBusinessLayerIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|criar|create|gerenciar|manage)\b/i.test(lower)
  const hasKeyword = /\b(crm|lead|leads|cliente|clientes|client workspace|vendas|sales|proposta comercial|financeiro|finance|fatura|invoice|pagamento|payment|plano saas|saas plan|dashboard admin|admin dashboard|dashboard cliente|client dashboard|pipeline|follow-up|cobran[cç]a|contabilidade|contador|documentos cont[aá]beis|relat[oó]rio cont[aá]bil|imposto|nota fiscal|receita|despesa|contas a pagar|contas a receber|accounting|accountant|accounts receivable|accounts payable|tax|bookkeeping)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isAuthIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|fazer|do|entrar|login|log in)\b/i.test(lower)
  const hasKeyword = /\b(login|entrar|cadastro|cadastrar|criar conta|sign in|signup|sign up|usu[aá]rio|usuarios|user account|sess[aã]o|session|permiss[oõ]es|permissions|auth|authentication|supabase)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isCopilotExecutionIntent(text: string) {
  return /\b(copilot execution|local execution|executar comando|executa comando|rodar comando|repo checks|build checks|git status|git log|check server|validar server|npm build|rodar build|build local|executar checkpoint|abrir checkpoint manager|checkpoint manager)\b/i.test(text)
}

function isOwnerConsoleIntent(text: string) {
  return /\b(mission control|owner command|owner console|console owner|abrir console owner|abrir owner console)\b/i.test(text)
}

function isCheckpointContinuationIntent(text: string) {
  return /\b(continuar checkpoint)\b/i.test(text)
}

// H15 — lightweight markdown renderer for chat bubbles
function renderMessageText(text: string): React.ReactNode {
  const imageLineRe = /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)\s*$/
  const inlineImageRe = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g
  const boldRe = /\*\*([^*]+)\*\*/g
  const codeBlockRe = /^```[\s\S]*?```$/m
  const inlineCodeRe = /`([^`]+)`/g

  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const end = lines.findIndex((l, j) => j > i && l.startsWith('```'))
      const codeLines = end > i ? lines.slice(i + 1, end) : lines.slice(i + 1)
      nodes.push(
        <pre key={i} style={{ background: '#1e293b', color: '#e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre', margin: '6px 0' }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i = end > i ? end + 1 : lines.length
      continue
    }

    // Image-only line → render as <img>
    const imgMatch = imageLineRe.exec(line)
    if (imgMatch) {
      nodes.push(
        <img key={i} src={imgMatch[2]} alt={imgMatch[1] || 'Imagem gerada'} style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px', display: 'block' }} />
      )
      i++
      continue
    }

    // Normal line — parse bold + inline code + inline images
    const renderInline = (s: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      let last = 0
      const combined = /(\*\*([^*]+)\*\*|`([^`]+)`|!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\))/g
      let m: RegExpExecArray | null
      while ((m = combined.exec(s)) !== null) {
        if (m.index > last) parts.push(s.slice(last, m.index))
        if (m[0].startsWith('**')) parts.push(<strong key={m.index}>{m[2]}</strong>)
        else if (m[0].startsWith('`')) parts.push(<code key={m.index} style={{ background: '#f1f5f9', borderRadius: '3px', padding: '1px 4px', fontSize: '11px', fontFamily: 'monospace' }}>{m[3]}</code>)
        else if (m[0].startsWith('!')) parts.push(<img key={m.index} src={m[5]} alt={m[4] || 'img'} style={{ maxWidth: '100%', borderRadius: '8px', display: 'block', marginTop: '6px' }} />)
        last = m.index + m[0].length
      }
      if (last < s.length) parts.push(s.slice(last))
      return parts
    }

    if (line === '') {
      nodes.push(<br key={i} />)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      nodes.push(<div key={i} style={{ paddingLeft: '12px', lineHeight: '1.6' }}>{'• '}{renderInline(line.slice(2))}</div>)
    } else if (/^\d+\.\s/.test(line)) {
      nodes.push(<div key={i} style={{ paddingLeft: '12px', lineHeight: '1.6' }}>{renderInline(line)}</div>)
    } else {
      nodes.push(<div key={i} style={{ lineHeight: '1.6' }}>{renderInline(line)}</div>)
    }
    i++
  }

  return <>{nodes}</>
}

function isPlatformEngineeringIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|checar|check|verificar|verify)\b/i.test(lower)
  const hasKeyword = /\b(status da plataforma|platform engineering|abrir pr|supabase status|status supabase|deploy status|deployment status|pull request|branch plan|plano de branch)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function classifyConnectorStatusIntent(text: string) {
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

function buildConnectorStatusFallback(_text: string) {
  // H5.0D: connector/tool status is now served by backend H5 tool router (api/copilot/chat)
  return ''
}

function isCodeSkillIntent(text: string) {
  return /\b(code skill|livre code|corrigir c[oó]digo)\b/i.test(text)
}

function isWindowsCareIntent(text: string) {
  return /\b(windows care|windows repair|meu pc est[aá] lento|pc est[aá] lento|pc lento|computador lento|diagn[oó]stico windows|diagnostico windows)\b/i.test(text)
}

function isRevitOperationalIntent(text: string) {
  return /\b(revit customization|revit plugin|pyrevit|revit templates?|configurar revit)\b/i.test(text)
}

function isSkillExportFactoryAlias(text: string) {
  return /\b(skill export factory|abrir skill export factory)\b/i.test(text)
}

function buildOperationalSkillResponse(text: string) {
  const pt = prefersPortuguese(text)
  if (isWindowsCareIntent(text)) {
    return pt
      ? 'Windows Care / Windows Repair acionado em Audit Only. Vou começar por diagnóstico somente leitura: versão/uptime do Windows, CPU/RAM/disco, processos pesados, inicialização, tarefas agendadas, Defender e persistências suspeitas. Não vou limpar, mover, deletar, parar serviço, editar registro ou alterar startup sem aprovação explícita do Owner.'
      : 'Windows Care / Windows Repair routed in Audit Only mode. I will start with read-only diagnostics: Windows version/uptime, CPU/RAM/disk, heavy processes, startup, scheduled tasks, Defender and suspicious persistence. I will not clean, move, delete, stop services, edit registry or alter startup without explicit Owner approval.'
  }
  if (isRevitOperationalIntent(text)) {
    return pt
      ? 'Revit Customization acionado em modo local-first. Posso preparar template Revit, parâmetros, view templates, schedules, pyRevit bundles, estrutura de plugin C#/.addin, estratégia MCP/conector local e fluxo IFC/GLB para Apex. Não vou fingir instalação, teste dentro do Revit, execução de script ou conexão MCP real sem evidência.'
      : 'Revit Customization routed in local-first mode. I can prepare Revit templates, parameters, view templates, schedules, pyRevit bundles, C#/.addin plugin structure, MCP/local connector strategy and IFC/GLB handoff to Apex. I will not claim installation, Revit-side testing, script execution or real MCP connection without evidence.'
  }
  if (isCodeSkillIntent(text)) {
    return 'Code execution is not connected yet. I can prepare the checkpoint, handoff, scope, validation plan and PR checklist.'
  }
  const connectorStatusAnswer = buildConnectorStatusFallback(text)
  if (connectorStatusAnswer) return connectorStatusAnswer
  if (isPlatformEngineeringIntent(text)) {
    return pt
      ? 'Platform Engineering acionado em modo LOCAL-FIRST / ROUTING IMPROVEMENT. Posso preparar status da plataforma, escopo, plano de branch/PR, checklist GitHub/Vercel/Supabase, diagnóstico de build e revisão de segurança a partir de evidência local. GitHub, Vercel e Supabase write/status remoto não serão fingidos: preciso de conector, URL, CLI/output ou conteúdo fornecido para confirmar estado externo.'
      : 'Platform Engineering routed in LOCAL-FIRST / ROUTING IMPROVEMENT mode. I can prepare platform status, scope, branch/PR plan, GitHub/Vercel/Supabase checklist, build diagnosis and security review from local evidence. GitHub, Vercel and Supabase remote write/status will not be faked: connector, URL, CLI/output or provided content is required for external confirmation.'
  }
  if (isCheckpointContinuationIntent(text)) {
    return pt
      ? 'Checkpoint manager acionado em modo de planejamento. Vou preparar continuidade, escopo, validações e checklist de PR sem executar shell livre, migration ou deploy. Para checks locais allowlisted, use Copilot Execution no Owner Console.'
      : 'Checkpoint manager routed in planning mode. I will prepare continuity, scope, validations and PR checklist without free shell, migrations or deploys. For local allowlisted checks, use Copilot Execution in Owner Console.'
  }
  return ''
}

function isOperationalGovernancePrompt(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return false
  const lineCount = trimmed.split(/\r?\n/).filter(line => line.trim()).length
  const hasGovernanceSignal = /\b(checkpoint|governança|governanca|governance|auditoria|audit|antes de push|before push|não faça|nao faca|não fazer|nao fazer|não executar|nao executar|não commitar|nao commitar|não fazer deploy|nao fazer deploy|não rodar migrations|nao rodar migrations|migration|migrations|tarefas|escopo autorizado|regras obrigatórias|regras obrigatorias|objetivo|critério green|criterio green|green|autorização|autorizacao|repo autorizado|repo|repository|branch obrigatória|branch obrigatoria|branch|commit|push|deploy|codex|claude|gemini|system prompt|instruções|instrucoes|relatório final|relatorio final)\b/i.test(trimmed)
  return hasGovernanceSignal && (lineCount >= 3 || trimmed.length > 450)
}

function prefersPortuguese(text: string) {
  return /\b(vc|voce|você|quem sou|o que|serviços|servicos|preciso|ajuda|ajudar|me ajuda|orçamento|orcamento|consultoria|arquivo|anexar|upload|cronograma|marketing|vendas|construcao|construção|alvara|alvará|contrato|proposta|financeiro|campo|obra)\b|[ãõçáéíóú]/i.test(text)
}

function buildCopilotFailureMessage(userText: string) {
  const pt = prefersPortuguese(userText) || true // default to Portuguese
  return pt
    ? 'Desculpe, não consegui processar sua mensagem agora. Tente novamente ou reformule o pedido.'
    : 'Sorry, I could not process your message right now. Please try again or rephrase your request.'
}

function isIdentityQuestion(text: string) {
  return /\b(vc sabe quem sou eu|você sabe quem sou eu|voce sabe quem sou eu|quem sou eu|do you know who i am|who am i)\b/i.test(text.trim())
}

function isTechnicalIdentityQuestion(text: string) {
  return /\b(role|workspace|tenant|persistence|sess[aã]o|session|email|dados t[eé]cnicos|technical|owner_admin)\b/i.test(text.trim())
}

function buildChatIdentityContext(accountState: SupabaseAccountState | null): ChatIdentityContext {
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

function buildIdentityAnswer(text: string, identity: ChatIdentityContext) {
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

function isCapabilitiesQuestion(text: string) {
  return /\b(o que (mais )?(vc|voce|você)?\s*sabe( fazer)?|o que (vc|voce|você)?\s*faz|o que mais (vc|voce|você)?\s*faz|quais (são os )?servi[cç]os|lista de servi[cç]os|seus servi[cç]os|funcionalidades|habilidades|capabilities|what else can you do|what can you do|what do you do|features)\b/i.test(text.trim())
}

function isContactQuestion(text: string) {
  return /\b(como entrar em contato|falar com o suporte|falar com a equipe|telefone de contato|e-mail de contato|consultoria de contato|falar com|contact information|how to contact|contact support)\b/i.test(text.trim())
}

function isUploadQuestion(text: string) {
  const trimmed = text.trim()
  if (/\b(pdf\.js|pdfjs|pdf-js)\b/i.test(trimmed)) return false
  return /\b(upload|arquivo|anexar|mandar imagem|enviar arquivo|screenshot|planta|pdf|file|attach)\b/i.test(trimmed)
}

function isGreeting(text: string) {
  return /^(ol[aá]|oi|hey|hello|hi|bom dia|boa tarde|boa noite|e a[ií]|eai|e a\?|salve|tudo bem|tudo bom|como vai|como est[aá]|boa|tamo junto|valeu|obrigad[oa]|ok|certo|entendi|sim|n[aã]o|pode|tá|ta|blz|bl[ée]z|👋|🙏)[\s!?]*$/i.test(text.trim())
}

function buildGreetingReply(text: string) {
  const lower = text.trim().toLowerCase()
  if (/obrigad|valeu|tamo junto/.test(lower)) return 'Por nada! Se precisar de mais alguma coisa, é só falar.'
  if (/bom dia/.test(lower)) return 'Bom dia! Como posso ajudar hoje? Pode enviar um arquivo, pedir análise de projeto ou qualquer outra tarefa da plataforma.'
  if (/boa tarde/.test(lower)) return 'Boa tarde! Em que posso ajudar?'
  if (/boa noite/.test(lower)) return 'Boa noite! Como posso ajudar?'
  if (/tudo bem|tudo bom|como vai|como est/.test(lower)) return 'Tudo ótimo! Pronto para ajudar. Pode me enviar um projeto, fazer uma pergunta ou pedir análise de BIM, contrato, orçamento, campo ou marketing.'
  return 'Olá! Como posso ajudar? Pode me enviar um arquivo, fazer uma pergunta ou pedir análise de BIM, contrato, orçamento, campo, imagem ou qualquer tarefa da plataforma.'
}

function buildProductFallbackAnswer(userText: string, identity: ChatIdentityContext) {
  // H5.1F: multi-line messages are handled by the backend conversational router.
  // Only apply local fallbacks for single-line messages to prevent interception.
  const nonEmptyLines = userText.trim().split(/\n/).filter(l => l.trim()).length
  if (nonEmptyLines === 1) {
    if (isGreeting(userText)) return buildGreetingReply(userText)
    const identityAnswer = buildIdentityAnswer(userText, identity)
    if (identityAnswer) return identityAnswer
    const operationalAnswer = buildOperationalSkillResponse(userText)
    if (operationalAnswer) return operationalAnswer
  }
  const pt = prefersPortuguese(userText)
  if (isCapabilitiesQuestion(userText)) {
    return pt
      ? 'A Apex AI Copilot ajuda em BIM 5D/6D/7D, visualizacao 3D e ArchViz, CFD e simulacoes, agentes de IA, DirectCut, vendas, marketing, contabilidade, financeiro, alvaras, contratos, juridico, documentos, propostas, engenharia e operacoes de campo. Voce pode conversar comigo, enviar arquivos, pedir analise de projeto e transformar isso em acoes dentro da plataforma.'
      : 'Apex AI Copilot helps with BIM 5D/6D/7D, 3D and ArchViz, CFD and simulations, AI agents, DirectCut, sales, marketing, accounting, finance, permits, contracts, legal, documents, proposals, engineering and field operations. You can chat, upload files, request project analysis and turn that into platform actions.'
  }
  if (isContactQuestion(userText)) {
    return pt
      ? 'Posso ajudar a preparar a consulta. Envie nome, email, telefone, cidade, tipo de projeto e o que precisa: BIM, 3D, contrato, alvara, proposta, financeiro, marketing ou operacao de campo.'
      : 'I can help prepare the consultation. Send name, email, phone, city, project type and what you need: BIM, 3D, contract, permit, proposal, finance, marketing or field operations.'
  }
  if (isUploadQuestion(userText)) {
    return pt
      ? 'Pode enviar arquivo, PDF, imagem, planta ou screenshot pelo botao de anexar. Eu uso o arquivo como contexto da conversa e sigo com uma resposta direta.'
      : 'You can upload a file, PDF, image, plan or screenshot with the attach button. I will use it as conversation context and continue with a direct answer.'
  }
  return ''
}

function inferBusinessFocus(text: string): BusinessOutput['focus'] {
  if (/\b(contabilidade|contador|documentos cont[aá]beis|relat[oó]rio cont[aá]bil|imposto|nota fiscal|receita|despesa|contas a pagar|contas a receber|financeiro|fatura|pagamento|invoice|payment|accounting|accountant|accounts receivable|accounts payable|tax|bookkeeping)\b/i.test(text)) return 'finance-accounting'
  if (/\b(crm|lead|pipeline|follow-up|vendas|proposta comercial|sales|proposal)\b/i.test(text)) return 'crm-sales'
  if (/\b(usu[aá]rio|usuarios|users|permiss[oõ]es|dashboard admin|dashboard cliente|client dashboard|plano saas|saas plan)\b/i.test(text)) return 'admin'
  return 'all'
}

function fileExtension(fileName: string) {
  return fileName.toLowerCase().split('.').pop() || ''
}

function isBim3DIntent(text: string, attachment?: IntakeFile) {
  if (attachment?.kind === 'bim-cad') return true
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|girar|carregar|load)\b/i.test(lower)
  const hasKeyword = /\b(ifc|glb|gltf|obj|stl|fbx|rvt|dwg|dxf|skp|bim|cad|3d studio|viewer|visualizar modelo|clash|compatibiliza[cç][aã]o)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isInternalViewerFormat(fileName: string) {
  return ['ifc', 'glb', 'gltf', 'obj', 'stl', 'fbx'].includes(fileExtension(fileName))
}

function isInternalImportFormat(fileName: string) {
  return ['rvt', 'dwg', 'dxf', 'skp'].includes(fileExtension(fileName))
}

function inferDirectCutConfig(text: string, attachment?: IntakeFile): DirectCutInitialConfig {
  const lower = text.toLowerCase()
  const config: DirectCutInitialConfig = {
    videoMode: attachment?.kind === 'image' ? 'image-to-video' : 'generate-videos',
    duration: '15s',
    aspectRatio: '16:9',
    audio: 'on',
    voice: 'narrator',
    style: 'professional-real-estate',
    lighting: 'keep-original',
    cameraMovement: 'dolly-in',
  }

  if (/(reels|short|story|stories|tiktok|instagram|vertical|9:16)/i.test(lower)) {
    config.videoMode = 'social-media-short'
    config.aspectRatio = '9:16'
    config.style = 'social-media'
    config.cameraMovement = 'dolly-in'
  }
  if (/(venda|sales|comercial|cliente|real estate|imobili[aá]rio)/i.test(lower)) {
    config.videoMode = config.videoMode === 'social-media-short' ? 'social-media-short' : 'real-estate-sales-video'
    config.style = config.style === 'social-media' ? 'social-media' : 'professional-real-estate'
  }
  if (/(transformar imagem em v[ií]deo|imagem em v[ií]deo|image to video|a partir dessa imagem|a partir da imagem)/i.test(lower)) {
    config.videoMode = 'image-to-video'
  }
  if (/(alterar luz|mudar luz|relight|reiluminar|transfer light|transferir luz)/i.test(lower)) {
    config.videoMode = 'relight-video'
    config.lighting = /transfer/i.test(lower) ? 'transfer-light' : 'relight'
  }
  if (/(adicionar voz|add voice|narra[cç][aã]o|narrador|voiceover)/i.test(lower)) {
    config.videoMode = 'add-voice'
    config.audio = 'on'
    config.voice = 'narrator'
  }
  if (/(tour|walkthrough|caminhada|3d scenes|movimento de c[aâ]mera|camera movement)/i.test(lower)) {
    config.videoMode = '3d-scenes-camera-movement'
    config.cameraMovement = 'walkthrough'
    config.style = 'cinematic'
  }
  if (/(cinematic|cinem[aá]tico|efeito cinematogr[aá]fico)/i.test(lower)) {
    config.videoMode = 'cinematic-effect'
    config.style = 'cinematic'
    config.cameraMovement = 'orbit'
  }
  if (/(mudar luz|noite|night)/i.test(lower)) config.lighting = 'night'
  if (/(daylight|dia|luz natural)/i.test(lower)) config.lighting = 'daylight'
  if (/(warm|quente|aconchegante)/i.test(lower)) config.lighting = 'warm'
  if (/(bim|t[eé]cnico|technical)/i.test(lower)) {
    config.videoMode = 'technical-walkthrough'
    config.style = 'technical-bim'
    config.cameraMovement = 'top-reveal'
  }
  return config
}

function asksExplicit3D(text: string) {
  return /\b(gerar 3d|gere 3d|3d|perspectiva|vista lateral|c[aâ]mera de lado|fachada|interior|ambiente real|walkthrough|eye-level|realistic room view|room render|render 3d)\b/i.test(text)
}

function isBimStudioCommand(text: string) {
  return /\b(marque esse problema|isso est[aá] errado|criar tour|fazer anima[cç][aã]o|gerar passeio|roteiro 3d|mandar para directcut|enviar para directcut|mandar para archvis|enviar para archvis|add issue|save view|tour|animation|directcut|archvis)\b/i.test(text)
}

function isProjectWorkspaceCommand(text: string) {
  return /\b(salvar projeto|novo projeto|exportar projeto|importar projeto|abrir projeto|renomear projeto|project workspace|save project|new project|export project|import project|open project|rename project)\b/i.test(text)
}

function fileToRecord(file: IntakeFile): ProjectFileRecord {
  return {
    id: `${file.file.name}-${file.file.size}-${file.file.lastModified || 0}`,
    name: file.file.name,
    type: file.file.type,
    size: file.file.size,
    kind: file.kind,
    dataUrl: file.kind === 'image' ? file.dataUrl : undefined,
    dimensions: file.dimensions,
    addedAt: new Date().toISOString(),
  }
}

function recordToIntakeFile(record?: ProjectFileRecord): IntakeFile | undefined {
  if (!record) return undefined
  // Non-image files (IFC, PDF, etc.) are not stored as dataUrl — skip restoring them
  // to avoid showing a "0 bytes" phantom file in the composer
  if (!record.dataUrl) return undefined
  const file = dataUrlToFile(record.dataUrl, record.name, record.type)
  return {
    file,
    kind: record.kind as IntakeFile['kind'],
    dataUrl: record.dataUrl,
    previewUrl: record.dataUrl,
    url: record.dataUrl,
    dimensions: record.dimensions,
  }
}

function dataUrlToFile(dataUrl: string, name: string, type: string) {
  const [header, base64 = ''] = dataUrl.split(',')
  const mime = type || header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new File([bytes], name, { type: mime })
}

type ChatConversation = {
  id: string
  title: string
  createdAt: string
  messages: Message[]
}

function App() {
  const fileInput = useRef<HTMLInputElement | null>(null)
  const composerTextarea = useRef<HTMLTextAreaElement | null>(null)
  const messagesEnd = useRef<HTMLDivElement | null>(null)
  const supabaseProvider = useMemo(() => getSupabaseProviderStatus(), [])
  const isSupabaseConfigured = supabaseProvider.providerStatus === 'supabase-connected'
  const [accountState, setAccountState] = useState<SupabaseAccountState | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [authMessage, setAuthMessage] = useState(supabaseProvider.message)
  const [clientMemory, setClientMemory] = useState<ClientMemory>(() => loadClientMemory())
  const [toolConfirmState, setToolConfirmState] = useState<Record<string, 'idle' | 'confirmed' | 'cancelled'>>({})
  const confirmToolAction = (msgId: string, action: 'confirmed' | 'cancelled') => {
    setToolConfirmState(prev => ({ ...prev, [msgId]: action }))
  }
  const initialProject = useMemo(() => loadActiveProject() || createProject('Apex Project'), [])
  const initialAppState = initialProject.appState || {}
  const restoredFile = recordToIntakeFile(initialProject.files.find(file => file.id === initialProject.activeFileId) || initialProject.files[initialProject.files.length - 1])
  const [input, setInput] = useState('')
  const [projects, setProjects] = useState<ProjectWorkspace[]>(() => {
    const existing = loadProjects()
    return existing.length ? existing : [initialProject]
  })
  const [activeProject, setActiveProject] = useState<ProjectWorkspace>(initialProject)
  const [workspaceSavedAt, setWorkspaceSavedAt] = useState('')
  const [activeFile, setActiveFile] = useState<IntakeFile | undefined>(restoredFile)
  const [archVisOutput, setArchVisOutput] = useState<ArchVisOutput | null>(() => {
    const stored = initialAppState.archVisOutput as { output?: string; conversationContext?: string[] } | undefined
    return stored && restoredFile?.kind === 'image'
      ? { source: restoredFile, output: stored.output || '', conversationContext: stored.conversationContext || [] }
      : null
  })
  const [directCutOutput, setDirectCutOutput] = useState<DirectCutOutput | null>(() => {
    const stored = initialAppState.directCutOutput as Omit<DirectCutOutput, 'source'> | undefined
    return stored ? { ...stored, source: restoredFile } : null
  })
  const [bim3DOutput, setBim3DOutput] = useState<Bim3DOutput | null>(() => {
    const stored = initialAppState.bim3DActive as boolean | undefined
    return stored && restoredFile?.kind === 'bim-cad' ? { source: restoredFile } : null
  })
  const [budgetOutput, setBudgetOutput] = useState<BudgetOutput | null>(() => {
    const stored = initialAppState.budgetOutput as Omit<BudgetOutput, 'source'> | undefined
    return stored ? { ...stored, source: restoredFile } : null
  })
  const [contractsOutput, setContractsOutput] = useState<ContractsOutput | null>(() => {
    const stored = initialAppState.contractsOutput as Omit<ContractsOutput, 'source'> | undefined
    return stored ? { ...stored, source: restoredFile } : null
  })
  const [researchOutput, setResearchOutput] = useState<ResearchOutput | null>(() => {
    const stored = initialAppState.researchOutput as ResearchOutput | undefined
    return stored || null
  })
  const [fieldOpsOutput, setFieldOpsOutput] = useState<FieldOpsOutput | null>(() => {
    const stored = initialAppState.fieldOpsOutput as Omit<FieldOpsOutput, 'source'> | undefined
    return stored ? { ...stored, source: restoredFile } : null
  })
  const [businessOutput, setBusinessOutput] = useState<BusinessOutput | null>(() => {
    const stored = initialAppState.businessOutput as BusinessOutput | undefined
    return stored || null
  })
  const [agentsOutput, setAgentsOutput] = useState<AgentsOutput | null>(() => {
    const stored = initialAppState.agentsOutput as AgentsOutput | undefined
    return stored || null
  })
  const [evmSchedulerComplianceOutput, setEvmSchedulerComplianceOutput] = useState<EvmSchedulerComplianceOutput | null>(() => {
    const stored = initialAppState.evmSchedulerComplianceOutput as EvmSchedulerComplianceOutput | undefined
    return stored || null
  })
  const [supplyChainOutput, setSupplyChainOutput] = useState<SupplyChainOutput | null>(() => {
    const stored = initialAppState.supplyChainOutput as SupplyChainOutput | undefined
    return stored || null
  })
  const [notificationsOutput, setNotificationsOutput] = useState<NotificationsOutput | null>(() => {
    const stored = initialAppState.notificationsOutput as NotificationsOutput | undefined
    return stored || null
  })
  const [aiCostOutput, setAiCostOutput] = useState<AiCostOutput | null>(() => {
    const stored = initialAppState.aiCostOutput as AiCostOutput | undefined
    return stored || null
  })
  const [multiTenantOutput, setMultiTenantOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.multiTenantOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [pwaMobileOutput, setPwaMobileOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.pwaMobileOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [digitalTwinOutput, setDigitalTwinOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.digitalTwinOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [knowledgeBaseOutput, setKnowledgeBaseOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.knowledgeBaseOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [metricsOutput, setMetricsOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.metricsOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [copilotExecutionOutput, setCopilotExecutionOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.copilotExecutionOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [executionRuns, setExecutionRuns] = useState<CopilotExecutionResult[]>(() => (
    Array.isArray(initialProject.executionRuns) ? initialProject.executionRuns as CopilotExecutionResult[] : []
  ))
  const [lastExecutionSummary, setLastExecutionSummary] = useState<unknown>(initialProject.lastExecutionSummary || null)
  const [authOutput, setAuthOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.authOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [bimCommand, setBimCommand] = useState<BimCommand | undefined>()
  const [workspaceOpenSignal, setWorkspaceOpenSignal] = useState('')
  const [skillUpdateOpenSignal, setSkillUpdateOpenSignal] = useState('')
  const [skillUpdateAutoAnalyzeSignal, setSkillUpdateAutoAnalyzeSignal] = useState('')
  const [skillUpdateAutoApplyProjectMemory, setSkillUpdateAutoApplyProjectMemory] = useState(false)
  const [skillUpdateAutoApplyGlobal, setSkillUpdateAutoApplyGlobal] = useState(false)
  const [skillExportOpenSignal, setSkillExportOpenSignal] = useState('')
  const [exportCenterOpen, setExportCenterOpen] = useState(false)
  const [ownerConsoleOpen, setOwnerConsoleOpen] = useState(false)
  const [voiceNotice, setVoiceNotice] = useState(false)
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>('EN')
  const [archVisRevisionConstraints, setArchVisRevisionConstraints] = useState<string[]>(initialProject.revisionConstraints || [])
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: id(),
      role: 'assistant',
      text: "Sou a Apex. Me diga o que quer fazer que eu começo por aqui.",
    },
  ])

  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const saved = localStorage.getItem('apex_conversations_v1')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return [
      {
        id: 'default',
        title: 'Conversa Inicial',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: id(),
            role: 'assistant' as const,
            text: "Sou a Apex. Me diga o que quer fazer que eu começo por aqui.",
          },
        ],
      },
    ]
  })
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return localStorage.getItem('apex_active_conversation_id') || 'default'
  })
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('apex_selected_model') || 'gpt-4o-mini'
  })
  const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([])
  const [modelProvider, setModelProvider] = useState<string>('')

  useEffect(() => {
    fetch('/api/copilot/models')
      .then(res => res.json())
      .then(data => {
        if (data?.ok && Array.isArray(data.models)) {
          setAvailableModels(data.models)
          if (data.provider) {
            setModelProvider(data.provider)
          }
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    localStorage.setItem('apex_selected_model', selectedModel)
  }, [selectedModel])

  // 1. Sync messages FROM activeConversation when activeConversationId changes
  useEffect(() => {
    const active = conversations.find(c => c.id === activeConversationId)
    if (active) {
      setMessages(active.messages)
    }
  }, [activeConversationId])

  // 2. Sync activeConversation messages TO conversations list when messages change
  useEffect(() => {
    if (!activeConversationId) return
    setConversations(prev => {
      let changed = false
      const next = prev.map(c => {
        if (c.id === activeConversationId) {
          if (JSON.stringify(c.messages) !== JSON.stringify(messages)) {
            changed = true
            let nextTitle = c.title
            if (c.title === 'Conversa Inicial' || c.title === 'Nova Conversa' || c.title === 'New Chat') {
              const firstUserMessage = messages.find(m => m.role === 'user')
              if (firstUserMessage) {
                const cleanText = firstUserMessage.text.replace(/^[A-Za-z0-9\s]+:\s*/, '')
                nextTitle = cleanText.slice(0, 24) + (cleanText.length > 24 ? '...' : '')
              }
            }
            return { ...c, title: nextTitle, messages }
          }
        }
        return c
      })
      if (changed) {
        localStorage.setItem('apex_conversations_v1', JSON.stringify(next))
        return next
      }
      return prev
    })
  }, [messages, activeConversationId])

  useEffect(() => {
    localStorage.setItem('apex_active_conversation_id', activeConversationId)
  }, [activeConversationId])

  function handleNewChat() {
    const newId = `chat-${Date.now()}`
    const newChat: ChatConversation = {
      id: newId,
      title: 'Nova Conversa',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: id(),
          role: 'assistant' as const,
          text: "Sou a Apex. Me diga o que quer fazer que eu começo por aqui.",
        },
      ],
    }
    setConversations(prev => {
      const next = [...prev, newChat]
      localStorage.setItem('apex_conversations_v1', JSON.stringify(next))
      return next
    })
    setActiveConversationId(newId)
  }

  function handleDeleteChat(chatId: string, event: React.MouseEvent) {
    event.stopPropagation()
    setConversations((prev: ChatConversation[]) => {
      const filtered = prev.filter(c => c.id !== chatId)
      const fallbackChat: ChatConversation = {
        id: 'default',
        title: 'Conversa Inicial',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: id(),
            role: 'assistant' as const,
            text: "Sou a Apex. Me diga o que quer fazer que eu começo por aqui.",
          },
        ],
      }
      const next: ChatConversation[] = filtered.length > 0 ? filtered : [fallbackChat]
      localStorage.setItem('apex_conversations_v1', JSON.stringify(next))
      if (activeConversationId === chatId) {
        setActiveConversationId(next[0].id)
      }
      return next
    })
  }

  // Type safe defaultChat
  function handleClearAllChats() {
    const defaultChat: ChatConversation = {
      id: 'default',
      title: 'Conversa Inicial',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: id(),
          role: 'assistant' as const,
          text: "Sou a Apex. Me diga o que quer fazer que eu começo por aqui.",
        },
      ],
    }
    setConversations([defaultChat])
    localStorage.setItem('apex_conversations_v1', JSON.stringify([defaultChat]))
    setActiveConversationId('default')
  }

  const activeTool = useMemo(() => selectTool(input, activeFile?.file.name), [input, activeFile])
  const debugEnabled = useMemo(() => isDebugEnabled(), [])
  const projectSummary = useMemo(() => ({
    files: activeProject.files.length,
    chatMessages: messages.length,
    archVisOutputs: archVisOutput ? Math.max(1, activeProject.archVisOutputs.length) : activeProject.archVisOutputs.length,
    directCutPlans: directCutOutput ? Math.max(1, activeProject.directCutPlans.length) : activeProject.directCutPlans.length,
    bim3dItems: bim3DOutput ? Math.max(1, activeProject.bim3dItems.length) : activeProject.bim3dItems.length,
    generatedImages: activeProject.generatedImages.length,
    tours: activeProject.tours.length,
    constraints: archVisRevisionConstraints.length,
    projectMemory: activeProject.projectMemory.length,
    skillUpdates: activeProject.skillUpdates.length,
    preferences: activeProject.preferences.length,
    suppliers: activeProject.suppliers.length,
    procurementItems: activeProject.procurementItems.length,
    alerts: activeProject.alerts.length,
    aiCostRecords: activeProject.aiCostRecords.length,
    tenants: activeProject.tenants.length,
    knowledgeItems: activeProject.knowledgeItems.length,
    metricsRecords: activeProject.metricsRecords.length,
    executionRuns: executionRuns.length,
  }), [activeProject, archVisOutput, archVisRevisionConstraints.length, bim3DOutput, directCutOutput, executionRuns.length, messages.length])

  const isSignedIn = !isSupabaseConfigured || accountState?.sessionStatus === 'signed-in'
  const authShellStatus = accountState?.bootstrapStatus || (isSupabaseConfigured ? 'needs-login' : 'local-demo')
  const isOwnerUser = accountState?.role === 'owner_admin' || accountState?.role === 'admin' || accountState?.role === 'developer' || !isSupabaseConfigured

  async function refreshAuthState() {
    if (!isSupabaseConfigured) {
      setAccountState(null)
      setAuthLoading(false)
      setAuthMessage('Local demo mode — Supabase not configured.')
      return null
    }

    try {
      const state = await loadSupabaseAccountState()
      setAccountState(state)
      setAuthMessage(state.message)
      return state
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load Supabase session.'
      setAuthMessage(message)
      return null
    } finally {
      setAuthLoading(false)
    }
  }

  function clearProtectedPanels() {
    setArchVisOutput(null)
    setDirectCutOutput(null)
    setBim3DOutput(null)
    setBudgetOutput(null)
    setContractsOutput(null)
    setResearchOutput(null)
    setFieldOpsOutput(null)
    setBusinessOutput(null)
    setAgentsOutput(null)
    setEvmSchedulerComplianceOutput(null)
    setSupplyChainOutput(null)
    setNotificationsOutput(null)
    setAiCostOutput(null)
    setMultiTenantOutput(null)
    setPwaMobileOutput(null)
    setDigitalTwinOutput(null)
    setKnowledgeBaseOutput(null)
    setMetricsOutput(null)
    setCopilotExecutionOutput(null)
    setAuthOutput(null)
    setExportCenterOpen(false)
    setActiveFile(undefined)
    setInput('')
  }

  function closeOtherPanels(except: string) {
    if (except !== 'archVis') setArchVisOutput(null)
    if (except !== 'directCut') setDirectCutOutput(null)
    if (except !== 'bim3D') setBim3DOutput(null)
    if (except !== 'budget') setBudgetOutput(null)
    if (except !== 'contracts') setContractsOutput(null)
    if (except !== 'research') setResearchOutput(null)
    if (except !== 'fieldOps') setFieldOpsOutput(null)
    if (except !== 'business') setBusinessOutput(null)
    if (except !== 'agents') setAgentsOutput(null)
    if (except !== 'evmScheduler') setEvmSchedulerComplianceOutput(null)
    if (except !== 'supplyChain') setSupplyChainOutput(null)
    if (except !== 'notifications') setNotificationsOutput(null)
    if (except !== 'aiCost') setAiCostOutput(null)
    if (except !== 'multiTenant') setMultiTenantOutput(null)
    if (except !== 'pwaMobile') setPwaMobileOutput(null)
    if (except !== 'digitalTwin') setDigitalTwinOutput(null)
    if (except !== 'knowledgeBase') setKnowledgeBaseOutput(null)
    if (except !== 'metrics') setMetricsOutput(null)
    if (except !== 'copilotExecution') setCopilotExecutionOutput(null)
    if (except !== 'auth') setAuthOutput(null)
    if (except !== 'exportCenter') setExportCenterOpen(false)
  }

  function handleActivateService(serviceId: string) {
    if (serviceId === 'svc-archvis') {
      closeOtherPanels('archVis')
      const sampleFloorPlanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><rect width="100%" height="100%" fill="#0f172a"/><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/><rect x="100" y="100" width="600" height="400" fill="none" stroke="#38bdf8" stroke-width="6"/><line x1="300" y1="100" x2="300" y2="500" stroke="#38bdf8" stroke-width="4"/><line x1="300" y1="300" x2="700" y2="300" stroke="#38bdf8" stroke-width="4"/><line x1="100" y1="350" x2="300" y2="350" stroke="#38bdf8" stroke-width="4"/><text x="200" y="225" font-family="sans-serif" font-size="18" fill="#cbd5e1" text-anchor="middle" font-weight="bold">SUITE MASTER</text><text x="200" y="425" font-family="sans-serif" font-size="18" fill="#cbd5e1" text-anchor="middle" font-weight="bold">GARAGEM</text><text x="500" y="200" font-family="sans-serif" font-size="18" fill="#cbd5e1" text-anchor="middle" font-weight="bold">SALA / COZINHA</text><text x="500" y="400" font-family="sans-serif" font-size="18" fill="#cbd5e1" text-anchor="middle" font-weight="bold">PISCINA / DECK</text></svg>`
      const sampleFloorPlanUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(sampleFloorPlanSvg)))
      const sampleFloorPlanFile = {
        file: new File([sampleFloorPlanSvg], 'planta_exemplo_apex.svg', { type: 'image/svg+xml' }),
        url: sampleFloorPlanUrl,
        dataUrl: sampleFloorPlanUrl,
        previewUrl: sampleFloorPlanUrl,
        kind: 'image' as const,
        dimensions: { width: 800, height: 600 }
      }
      setArchVisOutput({
        source: sampleFloorPlanFile,
        output: 'Modelo de planta de amostra carregado. Pronto para humanização ou render 3D.',
        conversationContext: ['assistant: Ativei o ArchVis Studio com um projeto de exemplo para você testar a renderização real.']
      })
    } else if (serviceId === 'svc-bim-revit') {
      closeOtherPanels('bim3D')
      const sampleBimFile = {
        file: new File([''], 'projeto_exemplo_apex.ifc', { type: 'application/x-ifc' }),
        url: 'mock-url',
        dataUrl: '',
        previewUrl: '',
        kind: 'bim-cad' as const
      }
      setBim3DOutput({ source: sampleBimFile })
    } else if (serviceId === 'svc-permit-docs') {
      closeOtherPanels('contracts')
      setContractsOutput({
        goal: 'Prepare permit documentation package',
        conversationContext: ['assistant: Ativei o Contracts / Permits Studio para você revisar e preparar o pacote de aprovação regional.']
      })
    } else if (serviceId === 'svc-video') {
      closeOtherPanels('directCut')
      setDirectCutOutput({
        goal: 'Prepare video draft for project sales',
        conversationContext: ['assistant: Ativei o DirectCut Studio com a configuração inicial de apresentação imobiliária.'],
        initialConfig: {
          videoMode: 'construction-presentation',
          duration: '30s',
          aspectRatio: '16:9',
          audio: 'on',
          voice: 'narrator',
          style: 'professional-real-estate',
          lighting: 'daylight',
          cameraMovement: 'dolly-in',
        }
      })
    } else if (serviceId === 'svc-saas') {
      setBusinessOutput({
        goal: 'Configure client workspace and user roles',
        focus: 'admin',
        conversationContext: []
      })
    }
  }

  async function signOutFromShell() {
    if (!isSupabaseConfigured) return
    const { client } = getBrowserSupabaseClient()
    if (!client) return
    await client.auth.signOut()
    clearProtectedPanels()
    await refreshAuthState()
  }

  useEffect(() => {
    let mounted = true
    if (!isSupabaseConfigured) {
      setAuthLoading(false)
      setAuthMessage('Local demo mode — Supabase not configured.')
      return
    }

    refreshAuthState().then(state => {
      if (mounted && state?.sessionStatus !== 'signed-in') clearProtectedPanels()
    })

    const { client } = getBrowserSupabaseClient()
    const subscription = client?.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session) clearProtectedPanels()
      refreshAuthState()
    }).data.subscription

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseConfigured])

  function buildProjectSnapshot() {
    const activeRecord = activeFile ? fileToRecord(activeFile) : undefined
    const files = activeRecord
      ? [
          ...activeProject.files.filter(file => file.id !== activeRecord.id),
          activeRecord,
        ]
      : activeProject.files
    const activeStudio: ProjectWorkspace['activeStudio'] = archVisOutput ? 'archvis' : directCutOutput ? 'directcut' : bim3DOutput ? 'bim3d' : budgetOutput ? 'budget' : contractsOutput ? 'contracts' : researchOutput ? 'research' : fieldOpsOutput ? 'fieldops' : businessOutput ? 'business' : agentsOutput ? 'agents' : evmSchedulerComplianceOutput ? 'evm-scheduler-compliance' : supplyChainOutput ? 'supply-chain' : notificationsOutput ? 'notifications' : aiCostOutput ? 'ai-cost' : multiTenantOutput ? 'multi-tenant' : pwaMobileOutput ? 'pwa-mobile' : digitalTwinOutput ? 'digital-twin' : knowledgeBaseOutput ? 'knowledge-base' : metricsOutput ? 'metrics-dashboard' : copilotExecutionOutput ? 'copilot-execution' : authOutput ? 'auth' : null
    return {
      ...activeProject,
      language: navigator.language || activeProject.language,
      files,
      chatMessages: messages.map(message => ({
        id: message.id,
        role: message.role,
        text: message.text,
        attachmentFileId: message.attachment ? activeRecord?.id : undefined,
      })),
      revisionConstraints: archVisRevisionConstraints,
      projectMemory: activeProject.projectMemory,
      skillUpdates: activeProject.skillUpdates,
      preferences: activeProject.preferences,
      generatedImages: activeProject.generatedImages,
      savedViews: activeProject.savedViews,
      tours: activeProject.tours,
      exports: activeProject.exports,
      suppliers: activeProject.suppliers,
      procurementItems: activeProject.procurementItems,
      alerts: activeProject.alerts,
      aiCostRecords: activeProject.aiCostRecords,
      tenants: activeProject.tenants,
      pwaSettings: activeProject.pwaSettings,
      digitalTwinItems: activeProject.digitalTwinItems,
      knowledgeItems: activeProject.knowledgeItems,
      metricsRecords: activeProject.metricsRecords,
      executionRuns,
      lastExecutionSummary,
      activeTool: activeTool.id,
      activeFileId: activeRecord?.id || activeProject.activeFileId,
      activeStudio,
      archVisOutputs: archVisOutput
        ? [{ output: archVisOutput.output, conversationContext: archVisOutput.conversationContext, updatedAt: new Date().toISOString() }]
        : activeProject.archVisOutputs,
      directCutPlans: directCutOutput
        ? [{ ...directCutOutput, updatedAt: new Date().toISOString() }]
        : activeProject.directCutPlans,
      bim3dItems: bim3DOutput
        ? [{ fileName: bim3DOutput.source.file.name, updatedAt: new Date().toISOString() }]
        : activeProject.bim3dItems,
      appState: {
        archVisOutput: archVisOutput ? { output: archVisOutput.output, conversationContext: archVisOutput.conversationContext } : null,
        directCutOutput: directCutOutput ? { ...directCutOutput, source: undefined } : null,
        bim3DActive: Boolean(bim3DOutput),
        budgetOutput: budgetOutput ? { ...budgetOutput, source: undefined } : null,
        contractsOutput: contractsOutput ? { ...contractsOutput, source: undefined } : null,
        researchOutput,
        fieldOpsOutput: fieldOpsOutput ? { ...fieldOpsOutput, source: undefined } : null,
        businessOutput,
        agentsOutput,
        evmSchedulerComplianceOutput,
        supplyChainOutput,
        notificationsOutput,
        aiCostOutput,
        multiTenantOutput,
        pwaMobileOutput,
        digitalTwinOutput,
        knowledgeBaseOutput,
        metricsOutput,
        copilotExecutionOutput,
        authOutput,
      },
    }
  }

  function saveWorkspaceNow() {
    const saved = upsertProject(buildProjectSnapshot())
    setActiveProject(saved)
    setProjects(loadProjects())
    setWorkspaceSavedAt(new Date().toLocaleTimeString())
  }

  async function syncWorkspaceToSupabase() {
    const saved = upsertProject(buildProjectSnapshot())
    setActiveProject(saved)
    setProjects(loadProjects())
    setWorkspaceSavedAt(new Date().toLocaleTimeString())
    const result = await syncProjectLocalToRemote(saved)
    const suffix = result.counts
      ? ` Files: ${result.counts.files}. Messages: ${result.counts.messages}. Exports: ${result.counts.exports}.`
      : ''
    return `${result.providerStatus}: ${result.message}${suffix}`
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = upsertProject(buildProjectSnapshot())
      setActiveProject(saved)
      setProjects(loadProjects())
      setWorkspaceSavedAt(new Date().toLocaleTimeString())
    }, 650)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, messages, archVisOutput, directCutOutput, bim3DOutput, budgetOutput, contractsOutput, researchOutput, fieldOpsOutput, businessOutput, agentsOutput, evmSchedulerComplianceOutput, supplyChainOutput, notificationsOutput, aiCostOutput, multiTenantOutput, pwaMobileOutput, digitalTwinOutput, knowledgeBaseOutput, metricsOutput, copilotExecutionOutput, authOutput, archVisRevisionConstraints, activeTool.id, executionRuns, lastExecutionSummary])

  useEffect(() => {
    const textarea = composerTextarea.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 320)}px`
  }, [input])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  async function askCopilot(text = input, attachment = activeFile) {
    const clean = text.trim()
    if ((!clean && !attachment) || loading) return
    setActiveFile(undefined)
    setInput('')
    const userText = clean || (attachment ? `Uploaded ${attachment.file.name}` : '')
    const modelText = clean || (attachment
      ? attachment.extractedText
        ? `O usuário enviou o arquivo "${attachment.file.name}" (tipo: ${attachment.kind}, extensão: ${attachment.file.name.toLowerCase().split('.').pop() || 'unknown'}). Conteúdo extraído:\n\n${attachment.extractedText}\n\nResponda de forma direta e conversacional com base no conteúdo acima. Não faça relatório nem lista de tópicos.`
        : 'User uploaded this file. Analyze it as project context and continue naturally in a short conversational reply. Do not write a report, heading, observations list, or capabilities list.'
      : '')
    const userMessage: Message = { id: id(), role: 'user', text: userText, attachment }
    if (!isSignedIn) {
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Please sign in first to use Apex Copilot, uploads and project tools.',
        },
      ])
      setInput('')
      return
    }
    const identityContext = buildChatIdentityContext(accountState)
    if (clean && isOwnerConsoleIntent(clean)) {
      if (!isOwnerUser) {
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'This tool is restricted to workspace owners/admins.' }])
        setInput('')
        return
      }
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Owner Console / Mission Control. Use as superfícies existentes: Project Workspace, Skill Update, Skill Export, Account e Platform Maintenance.' }])
      setOwnerConsoleOpen(true)
      setInput('')
      return
    }
    if (clean && isCheckpointContinuationIntent(clean)) {
      if (!isOwnerUser) {
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'This tool is restricted to workspace owners/admins.' }])
        setInput('')
        return
      }
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o checkpoint manager no Owner Console. Vou preparar continuidade, escopo, validações e checklist de PR sem executar shell livre, migration ou deploy.' }])
      setCopilotExecutionOutput({ goal: clean, conversationContext: [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`) })
      setOwnerConsoleOpen(true)
      setInput('')
      return
    }
    // Let natural conversations go to the server, so they are processed by the live AI agent (or fall back to local answers on failure)
    const shouldOpenArchVis = isArchVisIntent(clean || modelText, attachment)
    const shouldOpenDirectCut = clean && isDirectCutIntent(clean)
    const shouldOpenContracts = clean && isContractsIntent(clean)
    const shouldOpenBudget = clean && isBudgetIntent(clean)
    const shouldOpenResearch = clean && isResearchIntent(clean)
    const shouldOpenFieldOps = clean && isFieldOpsIntent(clean, attachment)
    const shouldOpenAuth = clean && isAuthIntent(clean)
    const shouldOpenBusiness = clean && isBusinessLayerIntent(clean)
    const shouldOpenControlsAgents = clean && isEvmSchedulerComplianceIntent(clean)
    const shouldOpenSupplyChain = clean && isSupplyChainIntent(clean)
    const shouldOpenNotifications = clean && isNotificationsIntent(clean)
    const shouldOpenAiCost = clean && isAiCostIntent(clean)
    const shouldOpenMultiTenant = clean && isMultiTenantIntent(clean)
    const shouldOpenPwaMobile = clean && isPwaMobileIntent(clean)
    const shouldOpenDigitalTwin = clean && isDigitalTwinIntent(clean)
    const shouldOpenKnowledgeBase = clean && isKnowledgeBaseIntent(clean)
    const shouldOpenMetrics = clean && isMetricsIntent(clean)
    const shouldOpenCopilotExecution = clean && isCopilotExecutionIntent(clean)
    const shouldOpenAgents = clean && isAgentIntent(clean)
    const shouldOpenBim3D = isBim3DIntent(clean || modelText, attachment)
    const shouldLockRevision = clean && archVisOutput && attachment?.kind === 'image' && isRevisionIntent(clean)
    const shouldTreatAsConversation = clean && isOperationalGovernancePrompt(clean)
    const shouldOpenSkillExport = clean && !shouldTreatAsConversation && (isSkillExportIntent(clean) || isSkillExportFactoryAlias(clean))
    const shouldOpenExportCenter = clean && isExportIntent(clean)
    if (shouldOpenExportCenter) {
      closeOtherPanels('exportCenter')
      setExportCenterOpen(true)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Export Center ao lado. Ele vai empacotar apenas dados que existem no Project Workspace local, com redaction de segredos e opção de excluir imagens/dataUrl.',
        },
      ])
      setInput('')
      return
    }
    if (shouldOpenSkillExport) {
      if (!isOwnerUser) {
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'This tool is restricted to workspace owners/admins.' }])
        setInput('')
        return
      }
      setSkillExportOpenSignal(id())
      setOwnerConsoleOpen(true)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Skill Export Panel. Escolha a plataforma, os domínios e gere o preview antes de baixar ou copiar o prompt.',
        },
      ])
      setInput('')
      return
    }
    const shouldOpenSkillUpdate = clean && isSkillUpdateIntent(clean)
    if (shouldOpenSkillUpdate) {
      if (!isOwnerUser) {
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'This tool is restricted to workspace owners/admins.' }])
        setInput('')
        return
      }
      setSkillUpdateOpenSignal(id())
      setOwnerConsoleOpen(true)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: attachment
            ? 'Vou analisar esse arquivo primeiro e te mostrar exatamente o que eu recomendo adicionar antes de alterar minha skill.'
            : 'Envie um TXT, MD, JSON, PDF, PY, JS, TS, TSX ou ZIP primeiro. Eu analiso e mostro o preview antes de alterar memória ou skill.',
        },
      ])
      setInput('')
      return
    }
    if (shouldOpenAuth) {
      closeOtherPanels('auth')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setAuthOutput({ goal: clean, conversationContext: context })
      if (isOwnerUser) setOwnerConsoleOpen(true)
      setMessages(prev => [...prev, userMessage])
      setInput('')
      return
    }
    if (clean && isProjectWorkspaceCommand(clean)) {
      const lower = clean.toLowerCase()
      setWorkspaceOpenSignal(id())
      if (/novo projeto|new project/i.test(lower)) {
        createNewProject()
      } else if (/exportar projeto|export project/i.test(lower)) {
        exportWorkspaceProject()
      } else if (/importar projeto|import project/i.test(lower)) {
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Project Workspace. Use Import JSON para carregar um arquivo de projeto local com segurança.' }])
        setInput('')
        return
      } else if (/salvar projeto|save project/i.test(lower)) {
        saveWorkspaceNow()
      } else if (/renomear projeto|rename project/i.test(lower)) {
        const nextName = clean.replace(/renomear projeto|rename project|para|to/gi, '').trim()
        if (nextName) renameProject(nextName)
      }
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Feito. Atualizei o Project Workspace e mantive o projeto ativo salvo localmente.' }])
      setInput('')
      return
    }
    if (shouldOpenBusiness) {
      closeOtherPanels('business')
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      const focus = inferBusinessFocus(clean)
      const responseText = focus === 'finance-accounting'
        ? 'Abri o Finance / Accounting layer ao lado. Vou preparar financeiro, contas a receber/pagar e pacote para contador em modo local, sem fingir pagamento, imposto ou compliance.'
        : focus === 'crm-sales'
          ? 'Abri o CRM / Sales layer ao lado. Vou estruturar leads, pipeline, proposta comercial e follow-up em modo local, sem banco de dados real ainda.'
          : focus === 'admin'
            ? 'Abri o SaaS Admin / Client Workspace ao lado. Vou modelar usuários, permissões, planos e dashboards em modo local, sem auth real ainda.'
            : 'Abri a camada SaaS/CRM/Finance ao lado. Tudo está em Local demo mode: sem auth, sem database e sem payment connector.'
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: responseText }])
      setBusinessOutput({ goal: clean, focus, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenSupplyChain) {
      closeOtherPanels('supplyChain')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Supply Chain / Suppliers Studio ao lado. Vou organizar fornecedores, cotações e compras em modo local, sem fingir preço, disponibilidade ou verificação de fornecedor.' }])
      setSupplyChainOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenNotifications) {
      closeOtherPanels('notifications')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Notifications / Alerts Center ao lado. Estes são alertas locais; conector de push, email ou SMS ainda não está conectado.' }])
      setNotificationsOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenAiCost) {
      closeOtherPanels('aiCost')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o AI Cost Dashboard ao lado. Vou mostrar estimativas locais de uso/custo, sem fingir billing real da OpenAI ou de outro provedor.' }])
      setAiCostOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenMultiTenant) {
      closeOtherPanels('multiTenant')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Multi-tenant Readiness ao lado. É planejamento local-first: sem fingir isolamento real de Supabase/auth/RLS.' }])
      setMultiTenantOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenPwaMobile) {
      closeOtherPanels('pwaMobile')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o PWA / Mobile Field Mode ao lado. Vou preparar checklist e fluxo mobile/offline, sem fingir PWA instalado.' }])
      setPwaMobileOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenDigitalTwin) {
      closeOtherPanels('digitalTwin')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Digital Twin UI ao lado. É estado local/planning-only: sem IoT em tempo real e sem sync vivo de modelo.' }])
      setDigitalTwinOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenKnowledgeBase) {
      closeOtherPanels('knowledgeBase')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri a Knowledge Base ao lado. Vou indexar conhecimento local/projeto sem executar conteúdo e sem marcar global sem aprovação do Owner.' }])
      setKnowledgeBaseOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenMetrics) {
      closeOtherPanels('metrics')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Metrics Dashboard ao lado. Métricas são LOCAL_DEMO/ESTIMATED_LOCAL até existir telemetria real.' }])
      setMetricsOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenCopilotExecution) {
      if (!isOwnerUser) {
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'This tool is restricted to workspace owners/admins.' }])
        setInput('')
        return
      }
      closeOtherPanels('copilotExecution')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Apex Copilot Local Execution v0. Ele executa comandos reais apenas pela allowlist do server.mjs, sem comando livre.' }])
      setCopilotExecutionOutput({ goal: clean, conversationContext: context })
      setOwnerConsoleOpen(true)
      setInput('')
      return
    }
    if (shouldOpenControlsAgents) {
      closeOtherPanels('evmScheduler')
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o painel CP11C com EVM Analyst, Scheduler e NR Compliance. Vou calcular somente com dados fornecidos/localizados e manter o restante como UNKNOWN, GENERAL_GUIDANCE ou NEEDS_SAFETY_REVIEW.',
        },
      ])
      setEvmSchedulerComplianceOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenAgents) {
      closeOtherPanels('agents')
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o painel dos 8 Cognitive Agents ao lado. EVM, Scheduler e NR Compliance agora aparecem como implementados local-first, com limites claros: sem dados em tempo real falsos e sem aprovação oficial de compliance.',
        },
      ])
      setAgentsOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (clean && bim3DOutput && isBimStudioCommand(clean)) {
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Feito. Adicionei isso no BIM / 3D Studio e atualizei o tour/correções ao lado.',
        },
      ])
      setBimCommand({ id: id(), text: clean })
      setInput('')
      return
    }
    if (shouldLockRevision) {
      const constraint = normalizeRevisionConstraint(clean)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: `Entendi. Travei essa correção no ArchVis: ${revisionChatLabel(clean)}. Gere novamente pelo painel ao lado.`,
        },
      ])
      setArchVisRevisionConstraints(prev => prev.includes(constraint) ? prev : [...prev, constraint])
      setInput('')
      return
    }
    if (shouldOpenDirectCut) {
      closeOtherPanels('directCut')
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o DirectCut Studio ao lado com o plano de vídeo, roteiro, shot list e prompt ajustável. Ainda não há conector de vídeo real, então vou trabalhar em modo planning-only.',
        },
      ])
      setDirectCutOutput({
        source: attachment,
        goal: clean,
        conversationContext: context,
        initialConfig: inferDirectCutConfig(clean, attachment),
      })
      setInput('')
      return
    }
    if (shouldOpenContracts) {
      closeOtherPanels('contracts')
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Contracts / Permits Studio ao lado. Vou preparar rascunho, checklist ou revisão com evidência por item, sem fingir aprovação jurídica.',
        },
      ])
      setContractsOutput({
        source: attachment,
        goal: clean,
        conversationContext: context,
      })
      setInput('')
      return
    }
    if (shouldOpenResearch) {
      closeOtherPanels('research')
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Research / Market Intelligence Studio ao lado. Vou montar um plano com fontes e confiança, sem inventar web, SINAPI, preços ou dados atuais.',
        },
      ])
      setResearchOutput({
        goal: clean,
        conversationContext: context,
      })
      setInput('')
      return
    }
    if (shouldOpenFieldOps) {
      closeOtherPanels('fieldOps')
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Field Operations / RDO Studio ao lado. Vou preparar RDO, progresso, segurança, qualidade e punch list com evidência por item, sem fingir clima ou aprovação de inspeção.',
        },
      ])
      setFieldOpsOutput({
        source: attachment,
        goal: clean,
        conversationContext: context,
      })
      setInput('')
      return
    }
    if (shouldOpenBudget) {
      closeOtherPanels('budget')
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Budget / Quantity Studio ao lado. Vou montar um orçamento preliminar com confiança e fonte por item, sem fingir precisão nem integração SINAPI.',
        },
      ])
      setBudgetOutput({
        source: attachment,
        goal: clean,
        conversationContext: context,
      })
      setInput('')
      return
    }
    if (shouldOpenBim3D && attachment?.kind === 'bim-cad') {
      const fileName = attachment.file.name
      const studioMessage = isInternalViewerFormat(fileName)
        ? 'Abri o BIM / 3D Studio ao lado. Vou visualizar, analisar, gerar relatório técnico e preparar imagens/tour do modelo dentro da Apex.'
        : isInternalImportFormat(fileName)
          ? 'Abri o fluxo de importação 3D da Apex. Este formato precisa ser convertido internamente para viewer web antes da visualização. Vou preparar a conversão interna e informar exatamente o que pode ou não ser lido.'
          : 'Abri o BIM / 3D Studio ao lado para revisar o arquivo e preparar o próximo fluxo interno.'
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: studioMessage }])
      closeOtherPanels('bim3D')
      setBim3DOutput({ source: attachment })
      setInput('')
      return
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: modelText,
          model: selectedModel,
          language: navigator.language || 'en',
          identityContext,
          clientMemory,
          messages: [
            ...messages.map(message => ({
              role: message.role,
              text: message.text,
            })),
            {
              role: userMessage.role,
              text: modelText,
            },
          ],
          file: attachment
            ? {
                name: attachment.file.name,
                type: attachment.file.type,
                size: attachment.file.size,
                kind: attachment.kind,
                dataUrl: attachment.kind === 'image' ? attachment.dataUrl : undefined,
                extractedText: attachment.extractedText || undefined,
                extractionStatus: attachment.extractedText ? 'ready' : undefined,
                pageCount: attachment.pageCount || undefined,
              }
            : null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      // H5.0D: log response mode so version is visible in browser console
      if (data?.mode) console.log('[Apex H5] response mode:', data.mode)
      if (data?.provider) console.log('[Apex H5] provider:', data.provider)
      if (data?.memoryPatch && typeof data.memoryPatch === 'object') {
        setClientMemory(current => {
          const next = { ...current, ...data.memoryPatch }
          saveClientMemory(next)
          return next
        })
      }
      const localFallback = buildProductFallbackAnswer(userText, identityContext)
      const reply = response.ok
        ? pickCanonicalReply(data, localFallback || buildCopilotFailureMessage(userText))
        : localFallback || buildCopilotFailureMessage(userText)
      // H5.1C/H5.1B: extract tool cards from H5 tool execution response
      const rawToolExec = (data?.operator as Record<string, unknown> | undefined)?.toolExecution
      const toolsArr = rawToolExec && typeof rawToolExec === 'object' ? (rawToolExec as Record<string, unknown>).tools : undefined
      const execsArr = rawToolExec && typeof rawToolExec === 'object' ? (rawToolExec as Record<string, unknown>).executions : undefined
      const toolCards: H5ToolCard[] | undefined = Array.isArray(toolsArr)
        ? toolsArr.map((t: Record<string, unknown>) => {
            const exec = Array.isArray(execsArr)
              ? (execsArr as Record<string, unknown>[]).find((e) => e.toolId === t.id)
              : undefined
            const connectorDetail = exec && (exec as Record<string, unknown>).executed
              ? ((exec as Record<string, unknown>).result as Record<string, unknown> | null) ?? undefined
              : undefined
            return {
              id: String(t.id || ''),
              label: String(t.label || t.id || ''),
              executionClass: String(t.executionClass || ''),
              status: String(t.status || ''),
              missing: Array.isArray(t.missing) ? (t.missing as unknown[]).map(String) : [],
              mutates: Boolean(t.mutates),
              available: Boolean(t.available),
              connectorDetail,
            }
          })
        : undefined

      if (shouldOpenArchVis && attachment?.kind === 'image') {
        const studioMessage = asksExplicit3D(clean)
          ? 'Abri o ArchVis Studio ao lado para render 3D/perspectiva. Você pode ajustar câmera, prompt e gerar pelo painel.'
          : 'Vou humanizar a planta baixa em vista superior. Se quiser render 3D em perspectiva, me peça 3D. Abri o ArchVis Studio ao lado com a imagem e o prompt ajustável.'
        setMessages(prev => [...prev, { id: id(), role: 'assistant', text: studioMessage }])
        closeOtherPanels('archVis')
        setArchVisOutput({
          source: attachment,
          output: reply,
          conversationContext: [...messages, userMessage, { id: id(), role: 'assistant', text: reply }]
            .slice(-8)
            .map(message => `${message.role}: ${message.text}`),
        })
      } else {
        // H7: attach confirmation UI metadata if present
        const confirmation = (data?.confirmation && typeof data.confirmation === 'object' && (data.confirmation as Record<string, unknown>).show)
          ? data.confirmation as H7Confirmation
          : null
        setMessages(prev => [...prev, { id: id(), role: 'assistant', text: reply, toolCards, confirmation }])
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: id(),
          role: 'assistant',
          text: buildProductFallbackAnswer(userText, identityContext) || buildCopilotFailureMessage(userText),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(file: File) {
    const kind = classifyFile(file)
    const dataUrl = kind === 'image' ? await readFileAsDataUrl(file) : undefined
    const previewUrl = kind === 'image' || kind === 'pdf' ? URL.createObjectURL(file) : undefined
    const extension = file.name.toLowerCase().split('.').pop() || ''

    let extractedText: string | undefined
    let pageCount: number | undefined
    if (kind === 'pdf') {
      const result = await extractPdfText(file).catch(() => null)
      if (result) {
        extractedText = result.text
        pageCount = result.pageCount
      }
    } else if (kind === 'document' || ['txt', 'py', 'rte', 'rta', 'md', 'json', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'xml', 'yaml', 'yml', 'ini'].includes(extension)) {
      try {
        extractedText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result || ''))
          reader.onerror = () => reject(reader.error || new Error('Error reading text file.'))
          reader.readAsText(file)
        })
      } catch (err) {
        console.error('Failed to extract text from file:', err)
      }
    }

    const intake: IntakeFile = {
      file,
      kind,
      sourcePath: file.webkitRelativePath || undefined,
      previewUrl,
      url: previewUrl,
      dataUrl,
      extractedText,
      pageCount,
      dimensions: dataUrl ? await readImageDimensions(dataUrl).catch(() => undefined) : undefined,
    }
    setActiveFile(intake)

    if (extension === 'md') {
      const signal = id()
      setSkillUpdateOpenSignal(signal)
      setSkillUpdateAutoAnalyzeSignal(signal)
      const trustedGlobal = isTrustedGlobalSkillSource(file.name, '', file.webkitRelativePath || '')
      setSkillUpdateAutoApplyProjectMemory(!trustedGlobal)
      setSkillUpdateAutoApplyGlobal(trustedGlobal)
      setMessages(prev => [...prev, { id: id(), role: 'assistant', text: trustedGlobal ? `Recebi ${file.name}. Vou analisar e aplicar como skill global automaticamente.` : `Recebi ${file.name}. Vou analisar e incorporar o conteúdo como memória do projeto automaticamente.` }])
      return
    }

    setSkillUpdateAutoAnalyzeSignal('')
    setSkillUpdateAutoApplyProjectMemory(false)
    setSkillUpdateAutoApplyGlobal(false)
  }

  async function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
    const items = Array.from(event.clipboardData?.items || [])
    const imageItem = items.find(item => item.kind === 'file' && /^image\/(png|jpeg|webp)$/i.test(item.type))
    if (!imageItem) return

    const blob = imageItem.getAsFile()
    if (!blob) return

    event.preventDefault()
    const extension = imageItem.type === 'image/jpeg' ? 'jpg' : imageItem.type.split('/')[1] || 'png'
    const file = new File([blob], `pasted-screenshot-${timestampForFileName()}.${extension}`, {
      type: imageItem.type,
      lastModified: Date.now(),
    })
    await handleFile(file)
  }

  async function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) await handleFile(file)
  }

  function handleBimTourToDirectCut(payload: BimTourOutput) {
    const goal = [
      payload.tourTitle,
      payload.objective,
      '',
      'Scene list:',
      ...payload.orderedSteps,
      '',
      'Camera path:',
      ...payload.cameraPath,
      '',
      'Narration:',
      ...payload.narration,
      '',
      payload.exportNotes,
    ].join('\n')
    closeOtherPanels('directCut')
    setDirectCutOutput({
      source: bim3DOutput?.source,
      goal,
      conversationContext: [`assistant: ${goal}`],
      initialConfig: {
        videoMode: 'technical-walkthrough',
        duration: '30s',
        aspectRatio: '16:9',
        audio: 'on',
        voice: 'narrator',
        style: 'technical-bim',
        lighting: 'daylight',
        cameraMovement: 'walkthrough',
      },
    })
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Feito. Enviei o tour BIM para o DirectCut Studio como roteiro técnico, camera path e storyboard planning-only.',
      },
    ])
  }

  function handleBimViewToArchVis(payload: BimArchVisOutput) {
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: `Preparei o prompt ArchVis para a cena "${payload.sceneName}". ${payload.note}`,
      },
      {
        id: id(),
        role: 'assistant',
        text: payload.prompt,
      },
    ])
  }

  function renameProject(name: string) {
    const saved = upsertProject({ ...activeProject, name })
    setActiveProject(saved)
    setProjects(loadProjects())
  }

  function createNewProject() {
    const project = createProject(`Apex Project ${projects.length + 1}`)
    const saved = upsertProject(project)
    setActiveProject(saved)
    setProjects(loadProjects())
    setActiveProjectId(saved.id)
    setActiveFile(undefined)
    setArchVisOutput(null)
    setDirectCutOutput(null)
    setBim3DOutput(null)
    setBudgetOutput(null)
    setContractsOutput(null)
    setResearchOutput(null)
    setFieldOpsOutput(null)
    setBusinessOutput(null)
    setAgentsOutput(null)
    setEvmSchedulerComplianceOutput(null)
    setSupplyChainOutput(null)
    setNotificationsOutput(null)
    setAiCostOutput(null)
    setMultiTenantOutput(null)
    setPwaMobileOutput(null)
    setDigitalTwinOutput(null)
    setKnowledgeBaseOutput(null)
    setMetricsOutput(null)
    setCopilotExecutionOutput(null)
    setAuthOutput(null)
    setExportCenterOpen(false)
    setArchVisRevisionConstraints([])
    setMessages([{ id: id(), role: 'assistant', text: 'New Apex project started. Upload a file or tell me what we are building.' }])
  }

  function applyProject(project: ProjectWorkspace) {
    setActiveProjectId(project.id)
    setActiveProject(project)
    const restored = recordToIntakeFile(project.files.find(file => file.id === project.activeFileId) || project.files[project.files.length - 1])
    setActiveFile(restored)
    setArchVisRevisionConstraints(project.revisionConstraints || [])
    setMessages(project.chatMessages.length ? project.chatMessages.map(message => ({
      id: message.id,
      role: message.role,
      text: message.text,
      attachment: message.attachmentFileId ? restored : undefined,
    })) : [{ id: id(), role: 'assistant', text: `Project "${project.name}" loaded.` }])
    const state = project.appState || {}
    const restoredArchVis = state.archVisOutput as { output?: string; conversationContext?: string[] } | null | undefined
    setArchVisOutput(restoredArchVis && restored?.kind === 'image'
      ? { source: restored, output: restoredArchVis.output || '', conversationContext: restoredArchVis.conversationContext || [] }
      : null)
    const restoredDirectCut = state.directCutOutput as Omit<DirectCutOutput, 'source'> | null | undefined
    setDirectCutOutput(restoredDirectCut ? { ...restoredDirectCut, source: restored } : null)
    setBim3DOutput(state.bim3DActive && restored?.kind === 'bim-cad' ? { source: restored } : null)
    const restoredBudget = state.budgetOutput as Omit<BudgetOutput, 'source'> | null | undefined
    setBudgetOutput(restoredBudget ? { ...restoredBudget, source: restored } : null)
    const restoredContracts = state.contractsOutput as Omit<ContractsOutput, 'source'> | null | undefined
    setContractsOutput(restoredContracts ? { ...restoredContracts, source: restored } : null)
    const restoredResearch = state.researchOutput as ResearchOutput | null | undefined
    setResearchOutput(restoredResearch || null)
    const restoredFieldOps = state.fieldOpsOutput as Omit<FieldOpsOutput, 'source'> | null | undefined
    setFieldOpsOutput(restoredFieldOps ? { ...restoredFieldOps, source: restored } : null)
    const restoredBusiness = state.businessOutput as BusinessOutput | null | undefined
    setBusinessOutput(restoredBusiness || null)
    const restoredAgents = state.agentsOutput as AgentsOutput | null | undefined
    setAgentsOutput(restoredAgents || null)
    const restoredEvmControls = state.evmSchedulerComplianceOutput as EvmSchedulerComplianceOutput | null | undefined
    setEvmSchedulerComplianceOutput(restoredEvmControls || null)
    const restoredSupplyChain = state.supplyChainOutput as SupplyChainOutput | null | undefined
    setSupplyChainOutput(restoredSupplyChain || null)
    const restoredNotifications = state.notificationsOutput as NotificationsOutput | null | undefined
    setNotificationsOutput(restoredNotifications || null)
    const restoredAiCost = state.aiCostOutput as AiCostOutput | null | undefined
    setAiCostOutput(restoredAiCost || null)
    setMultiTenantOutput((state.multiTenantOutput as SimpleStudioOutput | null | undefined) || null)
    setPwaMobileOutput((state.pwaMobileOutput as SimpleStudioOutput | null | undefined) || null)
    setDigitalTwinOutput((state.digitalTwinOutput as SimpleStudioOutput | null | undefined) || null)
    setKnowledgeBaseOutput((state.knowledgeBaseOutput as SimpleStudioOutput | null | undefined) || null)
    setMetricsOutput((state.metricsOutput as SimpleStudioOutput | null | undefined) || null)
    setCopilotExecutionOutput((state.copilotExecutionOutput as SimpleStudioOutput | null | undefined) || null)
    setExecutionRuns(Array.isArray(project.executionRuns) ? project.executionRuns as CopilotExecutionResult[] : [])
    setLastExecutionSummary(project.lastExecutionSummary || null)
    setAuthOutput((state.authOutput as SimpleStudioOutput | null | undefined) || null)
  }

  function switchProject(projectId: string) {
    const project = loadProjects().find(item => item.id === projectId)
    if (!project) return
    setProjects(loadProjects())
    applyProject(project)
  }

  function exportWorkspaceProject() {
    const snapshot = buildProjectSnapshot()
    const text = exportProject(snapshot)
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${snapshot.name.replace(/[^a-z0-9_-]+/gi, '-') || 'apex-project'}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function importWorkspaceProject(raw: string) {
    const imported = importProject(raw)
    setProjects(loadProjects())
    applyProject(imported)
  }

  function clearLocalWorkspace() {
    removeAllProjects()
    const project = createProject('Apex Project')
    upsertProject(project)
    setProjects([project])
    setActiveProject(project)
    setActiveFile(undefined)
    setArchVisOutput(null)
    setDirectCutOutput(null)
    setBim3DOutput(null)
    setBudgetOutput(null)
    setContractsOutput(null)
    setResearchOutput(null)
    setFieldOpsOutput(null)
    setBusinessOutput(null)
    setAgentsOutput(null)
    setEvmSchedulerComplianceOutput(null)
    setSupplyChainOutput(null)
    setNotificationsOutput(null)
    setAiCostOutput(null)
    setMultiTenantOutput(null)
    setPwaMobileOutput(null)
    setDigitalTwinOutput(null)
    setKnowledgeBaseOutput(null)
    setMetricsOutput(null)
    setCopilotExecutionOutput(null)
    setAuthOutput(null)
    setArchVisRevisionConstraints([])
    setMessages([{ id: id(), role: 'assistant', text: 'Local workspace cleared. New Apex project ready.' }])
  }

  function approveProjectMemory(update: ProjectMemoryUpdate) {
    const saved = upsertProject({
      ...activeProject,
      projectMemory: [...activeProject.projectMemory, update],
      skillUpdates: [...activeProject.skillUpdates, update],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: `Aprovado como memória do projeto. Salvei "${update.sourceFilename}" no Project Workspace local, sem alterar a skill global.`,
      },
    ])
  }

  function handleGlobalSkillApplied(result: SkillUpdateApplyResult) {
    const saved = upsertProject({
      ...activeProject,
      skillUpdates: [...activeProject.skillUpdates, result],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: `Aprovado pelo Owner e aplicado como update global. Registrei ${result.updateId} no log de skill update.`,
      },
    ])
  }

  function saveBudgetToProject(plan: BudgetPlan) {
    const saved = upsertProject({
      ...activeProject,
      exports: [
        ...activeProject.exports,
        {
          type: 'budget-estimate',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Salvei o orçamento preliminar no Project Workspace local como export de budget.',
      },
    ])
  }

  function saveContractsToProject(plan: ContractsPlan) {
    const saved = upsertProject({
      ...activeProject,
      exports: [
        ...activeProject.exports,
        {
          type: 'contracts-permits-review',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Salvei o relatório de Contracts / Permits no Project Workspace local.',
      },
    ])
  }

  function saveResearchToProject(plan: ResearchPlan) {
    const saved = upsertProject({
      ...activeProject,
      exports: [
        ...activeProject.exports,
        {
          type: 'research-market-intelligence',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Salvei o plano de pesquisa no Project Workspace local com as fontes e níveis de confiança.',
      },
    ])
  }

  function saveFieldOpsToProject(plan: FieldOpsPlan) {
    const saved = upsertProject({
      ...activeProject,
      exports: [
        ...activeProject.exports,
        {
          type: 'field-operations-rdo',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Salvei o RDO / Field Operations report no Project Workspace local.',
      },
    ])
  }

  function saveBusinessToProject(plan: BusinessPlan) {
    const saved = upsertProject({
      ...activeProject,
      exports: [
        ...activeProject.exports,
        {
          type: 'saas-crm-finance-business-layer',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Salvei a estrutura SaaS/CRM/Finance no Project Workspace local.',
      },
    ])
  }

  function saveEvmSchedulerComplianceToProject(plan: EvmSchedulerCompliancePlan) {
    const saved = upsertProject({
      ...activeProject,
      exports: [
        ...activeProject.exports,
        {
          type: 'evm-scheduler-nr-compliance',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Salvei o relatório CP11C de EVM, cronograma e NR Compliance no Project Workspace local.',
      },
    ])
  }

  function saveSupplyChainToProject(plan: SupplyChainPlan) {
    const saved = upsertProject({
      ...activeProject,
      suppliers: plan.suppliers,
      procurementItems: plan.procurementItems,
      exports: [
        ...activeProject.exports,
        {
          type: 'supply-chain-suppliers',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei fornecedores e itens de compra no Project Workspace local.' }])
  }

  function saveNotificationsToProject(plan: NotificationsPlan) {
    const saved = upsertProject({
      ...activeProject,
      alerts: plan.alerts,
      exports: [
        ...activeProject.exports,
        {
          type: 'notifications-alerts',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei os alertas locais no Project Workspace. Nenhum push/email/SMS foi enviado.' }])
  }

  function saveAiCostToProject(plan: AiCostPlan) {
    const saved = upsertProject({
      ...activeProject,
      aiCostRecords: plan.moduleBreakdown,
      exports: [
        ...activeProject.exports,
        {
          type: 'ai-cost-observability',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o dashboard de custo de IA no Project Workspace como estimativa local, não billing real.' }])
  }

  function saveMultiTenantToProject(plan: MultiTenantPlan) {
    const saved = upsertProject({ ...activeProject, tenants: plan.tenants, exports: [...activeProject.exports, { type: 'multi-tenant-readiness', timestamp: new Date().toISOString(), plan }] })
    setActiveProject(saved); setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o plano multi-tenant local-first no Project Workspace. Ainda não é isolamento real Supabase/Auth.' }])
  }

  function savePwaMobileToProject(plan: PwaMobilePlan) {
    const saved = upsertProject({ ...activeProject, pwaSettings: [plan], exports: [...activeProject.exports, { type: 'pwa-mobile-field-mode', timestamp: new Date().toISOString(), plan }] })
    setActiveProject(saved); setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o checklist PWA/mobile no Project Workspace. Nenhum PWA instalado foi alegado.' }])
  }

  function saveDigitalTwinToProject(plan: DigitalTwinPlan) {
    const saved = upsertProject({ ...activeProject, digitalTwinItems: [plan], exports: [...activeProject.exports, { type: 'digital-twin-local-state', timestamp: new Date().toISOString(), plan }] })
    setActiveProject(saved); setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o relatório Digital Twin local/planning-only no Project Workspace.' }])
  }

  function saveKnowledgeBaseToProject(plan: KnowledgeBasePlan) {
    const saved = upsertProject({ ...activeProject, knowledgeItems: plan.items, exports: [...activeProject.exports, { type: 'knowledge-base-index', timestamp: new Date().toISOString(), plan }] })
    setActiveProject(saved); setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o índice da Knowledge Base no Project Workspace. Conteúdo não foi executado.' }])
  }

  function saveMetricsToProject(plan: MetricsPlan) {
    const saved = upsertProject({ ...activeProject, metricsRecords: plan.moduleUsage, exports: [...activeProject.exports, { type: 'metrics-dashboard-local-demo', timestamp: new Date().toISOString(), plan }] })
    setActiveProject(saved); setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o relatório de métricas local demo no Project Workspace.' }])
  }

  const signedInEmail = accountState?.user?.email || accountState?.profile?.email || ''
  const signedInRole = accountState?.role || (accountState?.sessionStatus === 'signed-in' ? 'pending role' : '')
  const signedInWorkspace = accountState?.tenant?.name || (accountState?.sessionStatus === 'signed-in' ? 'pending workspace' : '')
  const signedInPersistence = accountState?.persistenceMode || (isSupabaseConfigured ? 'supabase-connected' : 'localStorage')
  const authHeader = (
    <div className="auth-header-state">
      <button className="language-pill" type="button" onClick={() => setUiLanguage(current => current === 'EN' ? 'PT' : 'EN')}>
        {uiLanguage}
      </button>
      {accountState?.sessionStatus === 'signed-in' && (
        <div className="auth-header-details" aria-label="Signed-in account status">
          <span>{signedInEmail || 'Signed in'}</span>
          <small>
            Role: {signedInRole} · Workspace: {signedInWorkspace} · Persistence: {signedInPersistence}
          </small>
        </div>
      )}
      {isOwnerUser && isSignedIn && (
        <button className="secondary-action owner-console-button" type="button" onClick={() => setOwnerConsoleOpen(true)}>
          <Settings size={15} /> {uiLanguage === 'EN' ? 'Owner Console' : 'Console Owner'}
        </button>
      )}
      {accountState?.sessionStatus === 'signed-in' && (
        <button className="secondary-action auth-signout" type="button" onClick={signOutFromShell}>
          <LogOut size={15} /> {uiLanguage === 'EN' ? 'Sign out' : 'Sair'}
        </button>
      )}
    </div>
  )
  const hasOperationalPanel = archVisOutput || directCutOutput || bim3DOutput || budgetOutput || contractsOutput || researchOutput || fieldOpsOutput || businessOutput || agentsOutput || evmSchedulerComplianceOutput || supplyChainOutput || notificationsOutput || aiCostOutput || multiTenantOutput || pwaMobileOutput || digitalTwinOutput || knowledgeBaseOutput || metricsOutput || exportCenterOpen
  const workspaceClass = hasOperationalPanel ? 'studio-open' : ''

  if (isSupabaseConfigured && (!isSignedIn || authLoading)) {
    return (
      <main className="app auth-only-app">
        <section className="auth-gate-shell" aria-label="Apex login">
          <AuthPanel onAuthStateChange={state => {
            setAccountState(state)
            setAuthMessage(state.message)
            setAuthLoading(false)
          }} />
        </section>
      </main>
    )
  }

  return (
    <main className="app" onPaste={handlePaste} onDragOver={event => event.preventDefault()} onDrop={handleDrop}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><img src="/apex-global-logo.png" alt="Apex Global" /></div>
          <div>
            <strong>APEX AI COPILOT</strong>
            <span>Full intelligence copilot platform</span>
          </div>
        </div>
        {authHeader}
      </header>

      {!isSupabaseConfigured && (
        <div className="demo-mode-banner">Local demo mode — Supabase not configured.</div>
      )}

      <section className={`workspace ${workspaceClass}`}>
        <nav className="tool-rail" aria-label="Apex tools">
          {['BIM', 'ArchVis', 'DirectCut', 'Budget', 'Contracts', 'Field', 'Marketing', 'Revit', 'Code', 'Data'].map(toolName => (
            <button key={toolName} type="button" title={toolName} onClick={() => setInput(current => current || `${toolName}: `)}>
              {toolName}
            </button>
          ))}
        </nav>

        <section className="chat-shell" aria-label="Apex AI Copilot chat" style={{ display: 'flex', flexDirection: 'row', minHeight: 'calc(100vh - 130px)' }}>
          {/* Conversation Sidebar */}
          <aside className="chat-sidebar" style={{ width: '220px', borderRight: '1px solid rgba(150, 164, 195, 0.15)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: '#121a2f' }}>
            <div className="chat-sidebar-header" style={{ padding: '16px', borderBottom: '1px solid rgba(150, 164, 195, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversas</span>
              <button
                type="button"
                onClick={handleNewChat}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={11} /> Novo
              </button>
            </div>
            <div className="chat-sidebar-model" style={{ padding: '12px 16px', borderBottom: '1px solid rgba(150, 164, 195, 0.15)' }}>
              <label style={{ color: 'rgba(150, 164, 195, 0.7)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                Modelo de IA {(() => {
                  const isDirectGemini = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'].includes(selectedModel);
                  const providerToShow = isDirectGemini ? 'gemini' : modelProvider;
                  return providerToShow ? `(${providerToShow === 'gemini' ? 'Google AI Studio' : providerToShow === 'openrouter' ? 'OpenRouter' : 'OpenAI'})` : '';
                })()}
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1a233d',
                  color: '#fff',
                  border: '1px solid rgba(150, 164, 195, 0.25)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {availableModels.length === 0 ? (
                  <>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4o">gpt-4o</option>
                  </>
                ) : (
                  availableModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name || m.id}</option>
                  ))
                )}
              </select>
            </div>
            <div className="chat-sidebar-list" style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {conversations.map(conv => {
                const isActive = conv.id === activeConversationId
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`conversation-list-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isActive ? '#fff' : '#b8c2d8',
                      background: isActive ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px', flex: 1 }}>{conv.title}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChat(conv.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(239, 68, 68, 0.7)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Excluir conversa"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
            {conversations.length > 1 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(150, 164, 195, 0.15)' }}>
                <button
                  type="button"
                  onClick={handleClearAllChats}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: '6px',
                    padding: '6px 0',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Limpar Histórico
                </button>
              </div>
            )}
          </aside>

          {/* Main Chat Area */}
          <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
            <div className="messages">
              {messages.map(message => (
                <article key={message.id} className={`message ${message.role}`}>
                  <div className="avatar">{message.role === 'assistant' ? <Bot size={18} /> : <Building2 size={18} />}</div>
                  <div className={`bubble ${message.text.length > 900 || message.text.includes('\n') ? 'long-text' : ''}`}>
                    <div className="message-body">{renderMessageText(message.text)}</div>
                    {message.attachment && (
                      <div className="attachment-chip">
                        <Paperclip size={15} />
                        {message.attachment.file.name}
                        <span>{message.attachment.kind} · {formatSize(message.attachment.file.size)}</span>
                      </div>
                    )}
                    {message.toolCards && message.toolCards.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {message.toolCards.map(card => {
                          const cls = card.executionClass
                          const isMutation = cls === 'mutation_requires_confirmation'
                          const isBlocked = cls === 'blocked'
                          const bg = card.available ? '#d1fae5' : isMutation ? '#fef3c7' : isBlocked ? '#fee2e2' : '#f3f4f6'
                          const border = card.available ? '#10b981' : isMutation ? '#f59e0b' : isBlocked ? '#ef4444' : '#9ca3af'
                          const badge = card.available ? 'disponível' : isMutation ? 'confirmação' : isBlocked ? 'bloqueado' : 'indisponível'
                          return (
                            <div key={card.id} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '6px', padding: '8px 10px', fontSize: '12px', lineHeight: '1.5' }}>
                              <div style={{ fontWeight: 600, marginBottom: '2px' }}>{card.label}</div>
                              <div style={{ color: '#6b7280', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ background: border, color: '#fff', borderRadius: '4px', padding: '1px 6px' }}>{badge}</span>
                                <span>{cls}</span>
                                {card.mutates && <span style={{ color: '#b45309' }}>⚠ mutação</span>}
                              </div>
                              {card.missing.length > 0 && (
                                <div style={{ marginTop: '3px', color: '#6b7280', fontSize: '11px' }}>
                                  Faltando: {card.missing.join(', ')}
                                </div>
                              )}
                              {card.id === 'github.status' && card.connectorDetail && (() => {
                                const d = card.connectorDetail as Record<string, unknown>
                                const commit = d.latestCommit as Record<string, unknown> | null
                                const prs = d.openPRs as unknown[] | undefined
                                const repo = String(d.repository || '')
                                const branch = String(d.branch || '')
                                const sha = commit ? String(commit.shortSha || '') : ''
                                const msg = commit ? String(commit.message || '').slice(0, 60) : ''
                                const author = commit ? String(commit.author || '') : ''
                                return (
                                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#374151' }}>
                                    {repo && <div>{'Repo: ' + repo + ' / ' + branch}</div>}
                                    {sha && <div>{'Commit: ' + sha + ' — ' + msg}</div>}
                                    {author && <div>{'Autor: ' + author}</div>}
                                    {prs && prs.length > 0 && <div>{'PRs abertos: ' + prs.length}</div>}
                                  </div>
                                )
                              })()}
                              {card.id === 'vercel.status' && card.connectorDetail && (() => {
                                const d = card.connectorDetail as Record<string, unknown>
                                const prod = d.latestProductionDeployment as Record<string, unknown> | null
                                const projectLabel = String(d.projectName || d.projectId || '')
                                const domain = String(d.productionDomain || '')
                                const deployState = prod ? String(prod.state || 'unknown') : ''
                                const deployUrl = prod ? String(prod.url || '') : ''
                                const deployAt = prod ? String(prod.createdAt || '').slice(0, 16).replace('T', ' ') : ''
                                return (
                                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#374151' }}>
                                    {projectLabel && <div>{'Projeto: ' + projectLabel}</div>}
                                    {domain && <div>{'Domínio: ' + domain}</div>}
                                    {deployState && <div>{'Deploy: ' + deployState + (deployUrl ? ' — ' + deployUrl : '')}</div>}
                                    {deployAt && <div>{'Em: ' + deployAt}</div>}
                                  </div>
                                )
                              })()}
                            </div>
                          )
                        })}
                        {(() => {
                          const confirmState = toolConfirmState[message.id] || 'idle'
                          const hasMutation = message.toolCards.some(c => c.executionClass === 'mutation_requires_confirmation')
                          if (!hasMutation) return null
                          if (confirmState === 'confirmed') return (
                            <div style={{ marginTop: '4px', padding: '8px 10px', background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '12px', color: '#92400e' }}>
                              ✓ Confirmação registrada, mas execução real ainda exige conector dedicado.
                            </div>
                          )
                          if (confirmState === 'cancelled') return (
                            <div style={{ marginTop: '4px', padding: '8px 10px', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
                              ✗ Ação cancelada.
                            </div>
                          )
                          return (
                            <div style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => confirmToolAction(message.id, 'confirmed')}
                                style={{ padding: '6px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => confirmToolAction(message.id, 'cancelled')}
                                style={{ padding: '6px 14px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                Cancelar
                              </button>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                    {/* H7 — Confirmation buttons for risk-gated actions */}
                    {message.confirmation?.show && message.confirmation.buttons?.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Apex aguarda confirmação
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {message.confirmation.buttons.map(btn => btn.message && (
                            <button
                              key={btn.id}
                              disabled={loading}
                              onClick={() => {
                                if (!btn.message) return
                                setInput('')
                                askCopilot(btn.message)
                              }}
                              style={{
                                padding: '8px 18px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.5 : 1,
                                border: btn.variant === 'secondary' ? '1px solid #d1d5db' : 'none',
                                background: btn.variant === 'primary' ? '#10b981' : btn.variant === 'secondary' ? '#f9fafb' : 'transparent',
                                color: btn.variant === 'primary' ? '#fff' : '#374151',
                                transition: 'opacity 0.15s',
                              }}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
              <div ref={messagesEnd} />
            </div>

            <div className="composer">
              {activeFile && (
                <div className="composer-file" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(150, 164, 195, 0.15)',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    {activeFile.kind === 'image' && activeFile.previewUrl ? (
                      <img
                        src={activeFile.previewUrl}
                        alt="Attachment Preview"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid rgba(150, 164, 195, 0.2)'
                        }}
                      />
                    ) : (
                      <Paperclip size={16} style={{ color: '#8fa2cf', flexShrink: 0 }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeFile.file.name}
                      </span>
                      <span style={{ fontSize: '9px', color: '#8fa2cf' }}>
                        {activeFile.kind.toUpperCase()} · {formatSize(activeFile.file.size)}
                        {activeFile.pageCount ? ` · ${activeFile.pageCount} pág.` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFile(undefined)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(239, 68, 68, 0.8)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      transition: 'background 0.2s'
                    }}
                    title={uiLanguage === 'EN' ? 'Remove file' : 'Remover arquivo'}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="composer-row">
                <textarea
                  ref={composerTextarea}
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      askCopilot()
                    }
                  }}
                  onPaste={handlePaste}
                  placeholder={
                    activeFile
                      ? `Ask about ${activeFile.file.name}...`
                      : uiLanguage === 'EN'
                        ? 'Type a message, run a command, or drag and drop files...'
                        : 'Escreva uma mensagem, execute um comando ou arraste arquivos...'
                  }
                  rows={1}
                />
                <button className="composer-language-button" type="button" onClick={() => setUiLanguage(current => current === 'EN' ? 'PT' : 'EN')}>
                  {uiLanguage}
                </button>
                <button className="icon-button" type="button" onClick={() => setVoiceNotice(current => !current)} aria-label={uiLanguage === 'EN' ? 'Voice input' : 'Entrada por voz'}>
                  <Mic size={19} />
                </button>
                <button className="send-button" onClick={() => askCopilot()} aria-label={loading ? 'Stop' : 'Send message'} disabled={!loading && !input.trim() && !activeFile}>
                  {loading ? <Square size={17} /> : <ArrowUp size={20} />}
                </button>
              </div>
              {voiceNotice && (
                <div className="voice-notice">{uiLanguage === 'EN' ? 'Voice input coming soon.' : 'Entrada por voz em breve.'}</div>
              )}
              <div className="composer-hint">
                {uiLanguage === 'EN'
                  ? 'Apex Copilot can make mistakes. Verify critical project, legal, financial and engineering information.'
                  : 'A Apex Copilot pode cometer erros. Verifique informações criticas de projeto, engenharia, legais e financeiras.'}
              </div>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="*/*"
              hidden
              {...({ webkitdirectory: '' } as any)}
              onChange={event => {
                const file = event.target.files?.[0]
                if (file) handleFile(file)
                event.currentTarget.value = ''
              }}
            />
            {debugEnabled && (
              <div className="debug-panel" aria-label="Debug mode">
                Debug mode is enabled. Internal prompt and memory details remain server-side and are hidden from the end-user experience.
              </div>
            )}
          </div>
        </section>

        {hasOperationalPanel && (
        <aside className="right-panel" aria-label="Active Apex tool">
          {archVisOutput && (
            <ArchVisPanel
              source={archVisOutput.source}
              output={archVisOutput.output}
              conversationContext={archVisOutput.conversationContext}
              revisionConstraints={archVisRevisionConstraints}
              onAddRevisionConstraint={constraint => setArchVisRevisionConstraints(prev => prev.includes(constraint) ? prev : [...prev, constraint])}
              onRemoveRevisionConstraint={constraint => setArchVisRevisionConstraints(prev => prev.filter(item => item !== constraint))}
              onClearRevisionConstraints={() => setArchVisRevisionConstraints([])}
              onClear={() => setArchVisOutput(null)}
            />
          )}

          {directCutOutput && (
            <DirectCutPanel
              source={directCutOutput.source}
              goal={directCutOutput.goal}
              conversationContext={directCutOutput.conversationContext}
              initialConfig={directCutOutput.initialConfig}
              onClear={() => setDirectCutOutput(null)}
            />
          )}

          {bim3DOutput && (
            <Bim3DPanel
              source={bim3DOutput.source}
              externalCommand={bimCommand}
              onSendTourToDirectCut={handleBimTourToDirectCut}
              onSendViewToArchVis={handleBimViewToArchVis}
              onClear={() => setBim3DOutput(null)}
            />
          )}

          {budgetOutput && (
            <BudgetPanel
              source={budgetOutput.source}
              goal={budgetOutput.goal}
              conversationContext={budgetOutput.conversationContext}
              onSaveToProject={saveBudgetToProject}
              onSendToDirectCut={summary => {
                closeOtherPanels('directCut')
                setDirectCutOutput({
                  source: budgetOutput.source,
                  goal: summary,
                  conversationContext: [`assistant: ${summary}`],
                  initialConfig: {
                    videoMode: 'construction-presentation',
                    duration: '30s',
                    aspectRatio: '16:9',
                    audio: 'on',
                    voice: 'narrator',
                    style: 'professional-real-estate',
                    lighting: 'daylight',
                    cameraMovement: 'dolly-in',
                  },
                })
                setMessages(prev => [
                  ...prev,
                  {
                    id: id(),
                    role: 'assistant',
                    text: 'Enviei o resumo de orçamento para o DirectCut Studio como base de apresentação comercial.',
                  },
                ])
              }}
              onClear={() => setBudgetOutput(null)}
            />
          )}

          {contractsOutput && (
            <ContractsPanel
              source={contractsOutput.source}
              goal={contractsOutput.goal}
              conversationContext={contractsOutput.conversationContext}
              onSaveToProject={saveContractsToProject}
              onSendToBudget={summary => {
                closeOtherPanels('budget')
                setBudgetOutput({
                  source: contractsOutput.source,
                  goal: summary,
                  conversationContext: [`assistant: ${summary}`],
                })
                setMessages(prev => [
                  ...prev,
                  {
                    id: id(),
                    role: 'assistant',
                    text: 'Enviei o escopo jurídico/contratual para o Budget Studio como base de orçamento e proposta.',
                  },
                ])
              }}
              onClear={() => setContractsOutput(null)}
            />
          )}

          {researchOutput && (
            <ResearchPanel
              goal={researchOutput.goal}
              conversationContext={researchOutput.conversationContext}
              onSaveToProject={saveResearchToProject}
              onClear={() => setResearchOutput(null)}
            />
          )}

          {fieldOpsOutput && (
            <FieldOpsPanel
              source={fieldOpsOutput.source}
              goal={fieldOpsOutput.goal}
              conversationContext={fieldOpsOutput.conversationContext}
              onSaveToProject={saveFieldOpsToProject}
              onSendToBudget={summary => {
                closeOtherPanels('budget')
                setBudgetOutput({
                  source: fieldOpsOutput.source,
                  goal: summary,
                  conversationContext: [`assistant: ${summary}`],
                })
                setMessages(prev => [
                  ...prev,
                  {
                    id: id(),
                    role: 'assistant',
                    text: 'Enviei os blockers de campo para o Budget Studio como impacto de custo/escopo.',
                  },
                ])
              }}
              onSendToContracts={summary => {
                closeOtherPanels('contracts')
                setContractsOutput({
                  source: fieldOpsOutput.source,
                  goal: summary,
                  conversationContext: [`assistant: ${summary}`],
                })
                setMessages(prev => [
                  ...prev,
                  {
                    id: id(),
                    role: 'assistant',
                    text: 'Enviei a pendência de campo para Contracts / Permits como possível tema de escopo, contrato ou evidência.',
                  },
                ])
              }}
              onSendToDirectCut={summary => {
                closeOtherPanels('directCut')
                setDirectCutOutput({
                  source: fieldOpsOutput.source,
                  goal: summary,
                  conversationContext: [`assistant: ${summary}`],
                  initialConfig: {
                    videoMode: 'construction-presentation',
                    duration: '30s',
                    aspectRatio: '16:9',
                    audio: 'on',
                    voice: 'narrator',
                    style: 'documentary',
                    lighting: 'keep-original',
                    cameraMovement: 'walkthrough',
                  },
                })
                setMessages(prev => [
                  ...prev,
                  {
                    id: id(),
                    role: 'assistant',
                    text: 'Enviei o progresso de campo para o DirectCut Studio como base de relatório visual para cliente.',
                  },
                ])
              }}
              onClear={() => setFieldOpsOutput(null)}
            />
          )}

          {businessOutput && (
            <div className="business-layer-stack">
              {(businessOutput.focus === 'admin' || businessOutput.focus === 'all') && (
                <SaasAdminPanel
                  goal={businessOutput.goal}
                  onClear={() => setBusinessOutput(null)}
                />
              )}
              {(businessOutput.focus === 'crm-sales' || businessOutput.focus === 'all') && (
                <CrmPanel
                  goal={businessOutput.goal}
                  conversationContext={businessOutput.conversationContext}
                  onSaveToProject={saveBusinessToProject}
                  onActivateService={handleActivateService}
                  onClear={() => setBusinessOutput(null)}
                />
              )}
              {(businessOutput.focus === 'finance-accounting' || businessOutput.focus === 'all') && (
                <FinancePanel
                  goal={businessOutput.goal}
                  conversationContext={businessOutput.conversationContext}
                  onSaveToProject={saveBusinessToProject}
                  onClear={() => setBusinessOutput(null)}
                />
              )}
              {businessOutput.focus !== 'admin' && (
                <button className="business-close-button" onClick={() => setBusinessOutput(null)}>Close business layer</button>
              )}
            </div>
          )}

          {evmSchedulerComplianceOutput && (
            <EvmSchedulerCompliancePanel
              goal={evmSchedulerComplianceOutput.goal}
              conversationContext={evmSchedulerComplianceOutput.conversationContext}
              onSaveToProject={saveEvmSchedulerComplianceToProject}
              onClear={() => setEvmSchedulerComplianceOutput(null)}
            />
          )}

          {supplyChainOutput && (
            <SupplyChainPanel
              goal={supplyChainOutput.goal}
              conversationContext={supplyChainOutput.conversationContext}
              onSaveToProject={saveSupplyChainToProject}
              onClear={() => setSupplyChainOutput(null)}
            />
          )}

          {notificationsOutput && (
            <NotificationsPanel
              goal={notificationsOutput.goal}
              conversationContext={notificationsOutput.conversationContext}
              onSaveToProject={saveNotificationsToProject}
              onClear={() => setNotificationsOutput(null)}
            />
          )}

          {aiCostOutput && (
            <AiCostDashboardPanel
              goal={aiCostOutput.goal}
              conversationContext={aiCostOutput.conversationContext}
              onSaveToProject={saveAiCostToProject}
              onCreateThresholdAlert={summary => {
                closeOtherPanels('notifications')
                setNotificationsOutput({
                  goal: summary,
                  conversationContext: [`assistant: ${summary}`],
                })
                setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Criei um alerta local de threshold de custo de IA. O conector de notificação ainda não está conectado.' }])
              }}
              onClear={() => setAiCostOutput(null)}
            />
          )}

          {multiTenantOutput && (
            <MultiTenantPanel
              goal={multiTenantOutput.goal}
              conversationContext={multiTenantOutput.conversationContext}
              onSaveToProject={saveMultiTenantToProject}
              onClear={() => setMultiTenantOutput(null)}
            />
          )}

          {pwaMobileOutput && (
            <PwaMobilePanel
              goal={pwaMobileOutput.goal}
              conversationContext={pwaMobileOutput.conversationContext}
              onSaveToProject={savePwaMobileToProject}
              onClear={() => setPwaMobileOutput(null)}
            />
          )}

          {digitalTwinOutput && (
            <DigitalTwinPanel
              goal={digitalTwinOutput.goal}
              conversationContext={digitalTwinOutput.conversationContext}
              onSaveToProject={saveDigitalTwinToProject}
              onClear={() => setDigitalTwinOutput(null)}
            />
          )}

          {knowledgeBaseOutput && (
            <KnowledgeBasePanel
              goal={knowledgeBaseOutput.goal}
              conversationContext={knowledgeBaseOutput.conversationContext}
              tenantId={accountState?.tenant?.id || accountState?.profile?.default_tenant_id || undefined}
              projectId={activeProject?.id}
              isOwnerAdmin={isOwnerUser}
              onSaveToProject={saveKnowledgeBaseToProject}
              onClear={() => setKnowledgeBaseOutput(null)}
            />
          )}

          {metricsOutput && (
            <MetricsDashboardPanel
              goal={metricsOutput.goal}
              conversationContext={metricsOutput.conversationContext}
              onSaveToProject={saveMetricsToProject}
              onClear={() => setMetricsOutput(null)}
            />
          )}

          {copilotExecutionOutput && (
            null
          )}

          {authOutput && (
            null
          )}

          {agentsOutput && (
            <AgentsPanel
              onClear={() => setAgentsOutput(null)}
              onOpenStudio={studio => {
                setMessages(prev => [
                  ...prev,
                  {
                    id: id(),
                    role: 'assistant',
                    text: `Agent routing note: ${studio} is connected to this agent. Open the related studio with a direct command when you want to work there.`,
                  },
                ])
              }}
            />
          )}

          {exportCenterOpen && (
            <ExportCenterPanel
              project={buildProjectSnapshot()}
              onClear={() => setExportCenterOpen(false)}
            />
          )}

        </aside>
        )}
      </section>

      {ownerConsoleOpen && isOwnerUser && (
        <div className="owner-console-backdrop" role="dialog" aria-modal="true" aria-label="Owner Console">
          <section className="owner-console-drawer">
            <div className="owner-console-head">
              <div>
                <span>{uiLanguage === 'EN' ? 'Owner workspace' : 'Area do owner'}</span>
                <h2>{uiLanguage === 'EN' ? 'Owner Console' : 'Console Owner'}</h2>
              </div>
              <button type="button" onClick={() => setOwnerConsoleOpen(false)} aria-label="Close Owner Console">
                <X size={18} />
              </button>
            </div>

            <div className="owner-console-status">
              <span>Email: {accountState?.user?.email || 'local'}</span>
              <span>Role: {accountState?.role || 'local-owner'}</span>
              <span>Workspace: {accountState?.tenant?.name || 'local workspace'}</span>
              <span>Persistence: {accountState?.persistenceMode || 'localStorage'}</span>
            </div>

            <div className="owner-console-actions">
              <button type="button" onClick={() => setCopilotExecutionOutput({ goal: 'Open Platform Maintenance', conversationContext: [] })}>
                <Terminal size={16} /> Platform Maintenance
              </button>
              <button type="button" onClick={() => setSkillUpdateOpenSignal(id())}>
                Skill Update
              </button>
              <button type="button" onClick={() => setSkillExportOpenSignal(id())}>
                Skill Export
              </button>
              <button type="button" onClick={() => setAuthOutput({ goal: 'Open account diagnostics', conversationContext: [] })}>
                Account
              </button>
            </div>

            <ProjectWorkspacePanel
              project={activeProject}
              projects={projects}
              summary={projectSummary}
              onRename={renameProject}
              onNewProject={createNewProject}
              onSwitchProject={switchProject}
              onSaveNow={saveWorkspaceNow}
              onSyncRemote={syncWorkspaceToSupabase}
              onExport={exportWorkspaceProject}
              onImport={importWorkspaceProject}
              onClear={clearLocalWorkspace}
              openSignal={workspaceOpenSignal}
            />
            {workspaceSavedAt && <div className="project-save-indicator">Project autosaved at {workspaceSavedAt}</div>}

            <SkillUpdatePanel
              source={activeFile}
              openSignal={skillUpdateOpenSignal}
              autoAnalyzeSignal={skillUpdateAutoAnalyzeSignal}
              autoApplyProjectMemory={skillUpdateAutoApplyProjectMemory}
              autoApplyGlobal={skillUpdateAutoApplyGlobal}
              onApproveProjectMemory={approveProjectMemory}
              onAppliedGlobal={handleGlobalSkillApplied}
              onClose={() => setSkillUpdateOpenSignal('')}
            />

            <SkillExportPanel
              openSignal={skillExportOpenSignal}
              onClose={() => setSkillExportOpenSignal('')}
            />

            {copilotExecutionOutput && (
              <CopilotExecutionPanel
                initialRuns={executionRuns}
                onRunComplete={(run, runs) => {
                  setExecutionRuns(runs)
                  setLastExecutionSummary({
                    commandId: run.commandId,
                    status: run.status,
                    exitCode: run.exitCode,
                    finishedAt: run.finishedAt,
                    durationMs: run.durationMs,
                  })
                }}
                onClear={() => setCopilotExecutionOutput(null)}
              />
            )}

            {authOutput && (
              <div className="business-layer-stack">
                <AuthPanel
                  onClear={() => setAuthOutput(null)}
                  onAuthStateChange={state => {
                    setAccountState(state)
                    setAuthMessage(state.message)
                  }}
                />
                <UserAccountPanel onClear={() => setAuthOutput(null)} />
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}


import { Auth0Provider } from '@auth0/auth0-react';
const _AUTH0_DOMAIN = (import.meta.env.VITE_AUTH0_DOMAIN || 'icfg-6yanelekncpdkv3rpxy4t1am.us.auth0.com');
const _AUTH0_CLIENT_ID = (import.meta.env.VITE_AUTH0_CLIENT_ID || 'Ldyth7MciFnivVvNzg9WZa8PoFd63lfo');
createRoot(document.getElementById('root')!).render(
  <Auth0Provider domain={_AUTH0_DOMAIN} clientId={_AUTH0_CLIENT_ID} authorizationParams={{ redirect_uri: window.location.origin }}>
    <App />
  </Auth0Provider>
)

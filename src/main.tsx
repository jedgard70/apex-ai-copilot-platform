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
import { isSkillUpdateIntent, ProjectMemoryUpdate, SkillUpdateApplyResult } from './lib/skillUpdateEngine'
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
  attachmentFileId?: string
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
  autoGenerate?: boolean
}

type ContractsOutput = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  autoGenerate?: boolean
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

function getFileRecordId(file: IntakeFile) {
  return `${file.file.name}-${file.file.size}-${file.file.lastModified || 0}`
}

function hasPersistentFileContext(record?: ProjectFileRecord) {
  if (!record) return false
  const extracted = String(record.extractedText || '').trim().length
  return Boolean(record.dataUrl || extracted >= 20)
}

function getActivePdfContext(file?: IntakeFile) {
  if (!file || file.kind !== 'pdf' || file.extractionStatus !== 'ready') return null
  const extractedText = String(file.extractedText || '').trim()
  if (extractedText.length < 20) return null
  return {
    fileName: file.file.name,
    pageCount: file.pageCount || 0,
    extractedText,
  }
}

function buildChatFilePayload(file?: IntakeFile | null) {
  if (!file) return null
  return {
    name: file.file.name,
    type: file.file.type,
    size: file.file.size,
    kind: file.kind,
    dataUrl: file.kind === 'image' ? file.dataUrl : undefined,
    pageCount: file.pageCount,
    extractionStatus: file.extractionStatus,
    extractedText: file.extractedText,
  }
}

function isPlatformCapabilitiesIntent(text: string) {
  return /\b(liste o que vc tem de funcionalidades|lista de funcionalidades|funcionalidades|o que (vc|voce|você) faz|quais módulos existem|quais modulos existem|quais funcionalidades|what can you do|what do you do|features)\b/i.test(text)
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
  if (attachment?.kind === 'image' && !text.trim()) return true
  if (attachment?.kind !== 'image') return false
  return /\b(gerar prompt de render|gere um prompt de render|prompt de render|crie uma planta humanizada|criar planta humanizada|planta humanizada|renderizar|renderize|renderize essa|renderizar essa|renderize esta|renderizar esta|área gourmet|area gourmet|refaz|refaça|regenera|regenerate|sem jardim|não crie|nao crie|deixa mais|usa madeira|melhorar imagem|editar imagem|trocar materiais|adicionar paisagismo|criar fachada|criar imagem de venda|humanize|image edit|edit image|render)\b/i.test(text)
}

function isDirectCutIntent(text: string) {
  return /\b(video|v[ií]deo|directcut|roteiro|reels|apresenta[cç][aã]o|tour|anima[cç][aã]o|v[ií]deo de venda|video de venda|timelapse|shot list|storyboard|cinematic|cinem[aá]tico|transformar imagem em v[ií]deo|imagem em v[ií]deo|image to video|adicionar voz|add voice|mudar luz|alterar luz|relight|melhorar v[ií]deo|improve video|clip editor|editar v[ií]deo|3d scenes|movimento de c[aâ]mera|camera movement)\b/i.test(text)
}

function isBudgetIntent(text: string) {
  return /\b(or[cç]amento|orcamento|quantitativo|estimativa|materiais|proposta|quanto custa|custo de obra|memorial de compra|budget|estimate|quantity|takeoff|materials|proposal|construction cost)\b/i.test(text)
}

function isBudgetXlsxIntent(text: string) {
  return /\b(xlsx|planilha.*or[cç]amento|or[cç]amento.*xlsx|bdi|sinapi|exportar.*or[cç]amento|gerar.*or[cç]amento|or[cç]amento.*sinapi|sinapi.*or[cç]amento|budget.*xlsx|xlsx.*budget|gerar.*planilha|planilha.*or[cç]amento)\b/i.test(text)
}

function isContractsIntent(text: string) {
  return /\b(contrato|contrato simples|revisar contrato|jur[ií]dico|juridico|cl[aá]usula|clausula|proposta jur[ií]dica|memorial|memorial descritivo|alvar[aá]|licen[cç]a|permits?|permits americanos|documentos para aprova[cç][aã]o nos eua|us permits?|european permits?|eu building permit|planning permission|ahj|certificate of occupancy|fire marshal|ada|building control|compliance|endossos|endosso|art|rrt|habite-se|scope agreement|addendum|lawyer|legal|contract)\b/i.test(text)
}

function isDocxGenerationIntent(text: string) {
  return /\b(docx|gerar.*docx|docx.*contrato|contrato.*docx|gerar.*proposta.*doc|proposta.*docx|gerar.*documento|exportar.*contrato|gerar.*contrato|download.*contrato|gerar.*proposta\b)\b/i.test(text)
}

function isPdfAnalysisIntent(text: string) {
  // Harden PDF analysis/summary intent detection. Accept common Portuguese verbs, light typos and
  // short requests like "resuma" or "resuma o pdf". Keep conservative to avoid capturing unrelated
  // text but permit common misspelling 'esuma'.
  return /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|analise este pdf|analise esse pdf|explique|o que tem neste documento|o que diz|o que tem no|me fale sobre o|quais s[aã]o os|pontos principais|lista os|summarize|sumarize|anali[sz]e o pdf|extraia|extract|key points|what does it say|tell me about the)\b/i.test(text)
}

function isResearchIntent(text: string) {
  return /\b(pesquisa de mercado|pesquisa na internet|faça uma pesquisa|faca uma pesquisa|concorrentes|pre[cç]o atualizado|sinapi|tabela sinapi|proposta comercial com pesquisa|estudo de mercado|market research|competitor|benchmark|pricing research|source check)\b/i.test(text)
}

function isFieldOpsIntent(text: string, attachment?: IntakeFile) {
  if (attachment?.kind === 'image' && /\b(obra|campo|rdo|di[aá]rio|relat[oó]rio|andamento|progresso|qualidade|seguran[cç]a|punch|pend[eê]ncia|foto de obra)\b/i.test(text)) return true
  return /\b(rdo|di[aá]rio de obra|relat[oó]rio de obra|andamento da obra|progresso da obra|checklist de qualidade|checklist de seguran[cç]a|equipe de obra|materiais entregues|pend[eê]ncia de obra|punch list|foto de obra|field operations|daily report|jobsite|site report|quality checklist|safety checklist|field photo)\b/i.test(text)
}

function isBusinessLayerIntent(text: string) {
  return /\b(crm|lead|leads|cliente|clientes|client workspace|vendas|sales|proposta comercial|financeiro|finance|fatura|invoice|pagamento|payment|plano saas|saas plan|dashboard admin|admin dashboard|dashboard cliente|client dashboard|pipeline|follow-up|cobran[cç]a|contabilidade|contador|documentos cont[aá]beis|relat[oó]rio cont[aá]bil|imposto|nota fiscal|receita|despesa|contas a pagar|contas a receber|accounting|accountant|accounts receivable|accounts payable|tax|bookkeeping)\b/i.test(text)
}

function isAuthIntent(text: string) {
  return /\b(login|entrar|cadastro|cadastrar|criar conta|sign in|signup|sign up|usu[aá]rio|usuarios|user account|sess[aã]o|session|permiss[oõ]es|permissions|auth|authentication|supabase)\b/i.test(text)
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
  return /\b(status da plataforma|platform engineering|abrir pr|supabase status|status supabase|deploy status|deployment status|pull request|branch plan|plano de branch)\b/i.test(text)
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
  return /\b(vc|voce|você|quem sou|o que|serviços|servicos|orçamento|orcamento|consultoria|arquivo|anexar|construcao|construção|alvara|alvará|contrato|proposta|financeiro|campo|obra)\b|[ãõçáéíóú]/i.test(text)
}

function buildCopilotFailureMessage(userText: string) {
  const preserved = userText.trim()
  const suffix = preserved ? `\n\n${prefersPortuguese(userText) ? 'Sua mensagem foi preservada:' : 'Your message was preserved:'}\n${preserved.slice(0, 2000)}` : ''
  return `Tive um problema ao gerar a resposta completa, mas posso continuar. Reformule o pedido ou envie um arquivo/screenshot para eu analisar.${suffix}`
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
  return /\b(o que (vc|voce|você) sabe fazer|o que faz|quais servi[cç]os|servi[cç]os|capabilities|what can you do|what do you do|features)\b/i.test(text.trim())
}

function isContactQuestion(text: string) {
  return /\b(or[cç]amento|consultoria|contato|falar com|proposal|quote|estimate|consultation|contact)\b/i.test(text.trim())
}

function isUploadQuestion(text: string) {
  return /\b(upload|arquivo|anexar|mandar imagem|enviar arquivo|screenshot|planta|pdf|file|attach)\b/i.test(text.trim())
}

function buildProductFallbackAnswer(userText: string, identity: ChatIdentityContext, attachment?: IntakeFile) {
  // H5.1F: multi-line messages are handled by the backend conversational router.
  // Only apply local fallbacks for single-line messages to prevent interception.
  const nonEmptyLines = userText.trim().split(/\n/).filter(l => l.trim()).length
  if (nonEmptyLines === 1) {
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
    return 'Pode enviar arquivo, PDF, imagem, planta ou screenshot pelo botao de anexar. Eu uso o arquivo como contexto da conversa e sigo com uma resposta direta.'
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

function isBim3DIntent(text: string) {
  return /\b(visualizar ifc|abrir bim 3d|abrir viewer ifc|viewer ifc|visualizar modelo|abrir modelo|open ifc|ifc viewer|open bim 3d|3d studio|clash|compatibiliza[cç][aã]o)\b/i.test(text)
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
  return /\b(marque esse problema|isso est[aá] errado|criar tour|fazer anima[cç][aã]o|gerar passeio|roteiro 3d|mandar para directcut|enviar para directcut|mandar para archvis|enviar para archvis|add issue|save view|tour|animation|directcut|archvis|rotacione|rotacionar|gire|girar|câmera|camera|isolar|isole|focar|foca|destacar|inconsistência|inconsistencia|zoom|viga|pilar|tubo|laje)\b/i.test(text)
}

function sameIntakeFile(left?: IntakeFile, right?: IntakeFile) {
  return Boolean(left && right && left.file.name === right.file.name && left.file.size === right.file.size && (left.file.lastModified || 0) === (right.file.lastModified || 0))
}

function isProjectWorkspaceCommand(text: string) {
  return /\b(salvar projeto|novo projeto|exportar projeto|importar projeto|abrir projeto|renomear projeto|project workspace|save project|new project|export project|import project|open project|rename project)\b/i.test(text)
}

function isUsableProjectFileRecord(record?: ProjectFileRecord): boolean {
  if (!record) return false
  const extractedText = String(record.extractedText || '').trim()
  const hasRealDataUrl = Boolean(record.dataUrl && record.dataUrl.includes(',') && record.dataUrl.length > 50)
  const hasUsefulPdfText = record.kind === 'pdf' && extractedText.length >= 20
  if (record.size === 0 && !hasRealDataUrl && !hasUsefulPdfText) return false
  if (record.kind === 'pdf') return hasUsefulPdfText || hasRealDataUrl
  return hasRealDataUrl || record.size > 0
}

function isUsableIntakeFile(file?: IntakeFile | null): boolean {
  if (!file) return false
  const extractedText = String(file.extractedText || '').trim()
  const hasRealDataUrl = Boolean(file.dataUrl && file.dataUrl.includes(',') && file.dataUrl.length > 50)
  const hasUsefulPdfText = file.kind === 'pdf' && extractedText.length >= 20
  if (file.file.size === 0 && !hasRealDataUrl && !hasUsefulPdfText) return false
  if (file.kind === 'pdf') return hasUsefulPdfText || file.file.size > 0
  return hasRealDataUrl || file.file.size > 0
}

function fileToRecord(file: IntakeFile): ProjectFileRecord {
  return {
    id: `${file.file.name}-${file.file.size}-${file.file.lastModified || 0}`,
    name: file.file.name,
    type: file.file.type,
    size: file.file.size,
    kind: file.kind,
    lastModified: file.file.lastModified || 0,
    dataUrl: file.kind === 'image' ? file.dataUrl : undefined,
    extractedText: file.extractedText,
    pageCount: file.pageCount,
    extractionStatus: file.extractionStatus,
    extractedAt: file.extractionStatus === 'ready' && file.extractedText ? new Date().toISOString() : undefined,
    dimensions: file.dimensions,
    addedAt: new Date().toISOString(),
  }
}

function recordToIntakeFile(record?: ProjectFileRecord): IntakeFile | undefined {
  if (!isUsableProjectFileRecord(record)) return undefined
  const extractedText = String(record!.extractedText || '').trim()
  const hasRealDataUrl = Boolean(record!.dataUrl && record!.dataUrl.includes(',') && record!.dataUrl.length > 50)
  const isPdfPlaceholder = record!.kind === 'pdf' && !hasRealDataUrl && extractedText.length >= 20

  const file = hasRealDataUrl
    ? dataUrlToFile(record!.dataUrl!, record!.name, record!.type, record!.lastModified)
    : new File([''], record!.name, { type: record!.type || 'application/octet-stream', lastModified: record!.lastModified || Date.now() })

  return {
    file,
    kind: record!.kind as IntakeFile['kind'],
    dataUrl: record!.dataUrl,
    previewUrl: record!.dataUrl,
    url: record!.dataUrl,
    extractedText: extractedText || undefined,
    pageCount: record!.pageCount,
    extractionStatus: record!.extractionStatus || (extractedText.length >= 20 ? 'ready' : 'idle'),
    dimensions: record!.dimensions,
    contextOnly: isPdfPlaceholder,
  }
}

function getProjectFileRecordById(project: ProjectWorkspace, fileId?: string) {
  if (!fileId) return undefined
  return project.files.find(file => file.id === fileId)
}

function dataUrlToFile(dataUrl: string, name: string, type: string, lastModified?: number) {
  const [header, base64 = ''] = dataUrl.split(',')
  const mime = type || header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new File([bytes], name, { type: mime, lastModified: lastModified || Date.now() })
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
  const restoredFile = recordToIntakeFile(
    initialProject.activeFileId
      ? initialProject.files.find(file => file.id === initialProject.activeFileId)
      : undefined
  )
  const [input, setInput] = useState('')
  const [projects, setProjects] = useState<ProjectWorkspace[]>(() => {
    const existing = loadProjects()
    return existing.length ? existing : [initialProject]
  })
  const [activeProject, setActiveProject] = useState<ProjectWorkspace>(initialProject)
  const [workspaceSavedAt, setWorkspaceSavedAt] = useState('')
  const [activeFile, setActiveFile] = useState<IntakeFile | undefined>(restoredFile)
  const [pendingAttachment, setPendingAttachment] = useState<IntakeFile | null>(null)
  const [pendingPdfIntent, setPendingPdfIntent] = useState<string | null>(null)

  // Auto-run pending PDF intent when extraction completes
  useEffect(() => {
    if (pendingPdfIntent && activeFile && activeFile.kind === 'pdf' && activeFile.extractionStatus === 'ready') {
      const intent = pendingPdfIntent
      setPendingPdfIntent(null)
      // askCopilot is a function declaration hoisted in this scope
      try { askCopilot(intent) } catch (err) { /* ignore if unavailable */ }
    }
  }, [pendingPdfIntent, activeFile && activeFile.extractionStatus])
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
      text: "I'm Apex Copilot. Upload a file, paste a screenshot, or tell me what you need.",
    },
  ])

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
    setPendingAttachment(null)
    setInput('')
  }

  function closeAllPanels() {
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
  }

  function beginPdfExtraction(file: IntakeFile) {
    if (file.kind !== 'pdf' || file.extractionStatus === 'extracting' || file.extractionStatus === 'ready') return
    const extractingFile: IntakeFile = { ...file, extractionStatus: 'extracting' }
    setActiveFile(current => sameIntakeFile(current, file) ? extractingFile : current)
    setMessages(prev => prev.map(message => sameIntakeFile(message.attachment, file) ? { ...message, attachment: extractingFile } : message))
    extractPdfText(file.file)
      .then(result => {
        const readyFile: IntakeFile = {
          ...extractingFile,
          extractedText: result.text,
          pageCount: result.pageCount,
          extractionStatus: 'ready',
        }
        setActiveFile(current => sameIntakeFile(current, file) ? readyFile : current)
        setMessages(prev => prev.map(message => sameIntakeFile(message.attachment, file) ? { ...message, attachment: readyFile } : message))
      })
      .catch(() => {
        const failedFile: IntakeFile = { ...extractingFile, extractionStatus: 'failed' }
        setActiveFile(current => sameIntakeFile(current, file) ? failedFile : current)
        setMessages(prev => prev.map(message => sameIntakeFile(message.attachment, file) ? { ...message, attachment: failedFile } : message))
      })
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
        attachmentFileId: message.attachmentFileId,
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

  async function askCopilot(text = input, explicitAttachment?: IntakeFile) {
    const clean = text.trim()
    const pendingForSend = explicitAttachment || pendingAttachment
    if ((!clean && !pendingForSend) || loading) return

    // Fast-path: Portuguese greeting — respond immediately without touching file context or calling API
    if (/^\s*(ol[aá]|oi|ola)\s*$/i.test(clean) && !pendingForSend) {
      const displayName = clientMemory.displayName ? `, ${clientMemory.displayName}` : ''
      const greetMsg: Message = { id: id(), role: 'user', text: clean }
      setMessages(prev => [...prev, greetMsg, { id: id(), role: 'assistant', text: `Olá${displayName}. Como posso ajudar agora?` }])
      setInput('')
      return
    }

    const isPlatformQuestion = Boolean(clean && isPlatformCapabilitiesIntent(clean))
    const wantsFileContext = Boolean(pendingForSend) || Boolean(clean && !isPlatformQuestion && (
      isPdfAnalysisIntent(clean)
      || isBimStudioCommand(clean)
      || isArchVisIntent(clean, activeFile)
      || isDirectCutIntent(clean)
      || isBudgetIntent(clean)
      || isContractsIntent(clean)
      || isFieldOpsIntent(clean, activeFile)
      || isResearchIntent(clean)
      || isBusinessLayerIntent(clean)
    ))
    const attachment = pendingForSend || (wantsFileContext ? activeFile : undefined)
    const sentAttachment = pendingForSend || undefined
    if (pendingForSend) {
      setActiveFile(pendingForSend)
      setPendingAttachment(null)
      if (pendingForSend.kind === 'pdf') beginPdfExtraction(pendingForSend)
    }
    const userText = clean || (sentAttachment ? `Uploaded ${sentAttachment.file.name}` : '')
    const activePdfContext = getActivePdfContext(attachment)
    const isFollowUpAboutPdf = clean && Boolean(activePdfContext) && isPdfAnalysisIntent(clean)
    const modelText = (() => {
      if (!clean) {
        // Initial upload — include PDF content if available
        if (activePdfContext) {
          return `O usuário enviou o arquivo PDF "${activePdfContext.fileName}" (${activePdfContext.pageCount} páginas). Conteúdo extraído:\n\n${activePdfContext.extractedText}\n\nResponda de forma direta e conversacional com base no conteúdo acima. Não faça relatório nem lista de tópicos.`
        }
        if (attachment) return 'User uploaded this file. Analyze it as project context and continue naturally in a short conversational reply. Do not write a report, heading, observations list, or capabilities list.'
        return ''
      }
      if (isFollowUpAboutPdf) {
        // Follow-up request (resuma, analise, etc.) — inject PDF context before the user question
        return `Arquivo PDF ativo: "${activePdfContext!.fileName}" (${activePdfContext!.pageCount} páginas)\nConteúdo extraído:\n\n${activePdfContext!.extractedText}\n\nPedido do usuário: ${clean}\n\nResponda somente com base no conteúdo real do PDF. Não diga que não tem acesso ao conteúdo.`
      }
      return clean
    })()
    const userMessage: Message = { id: id(), role: 'user', text: userText, attachment: sentAttachment, attachmentFileId: sentAttachment ? getFileRecordId(sentAttachment) : undefined }
    if (pendingForSend && !clean) {
      setMessages(prev => [...prev, userMessage])
      setInput('')
      return
    }
    if (pendingForSend && clean && sentAttachment?.kind === 'pdf' && isPdfAnalysisIntent(clean)) {
      // remember the intent and inform the user in Portuguese while extraction runs
      setPendingPdfIntent(clean)
      setMessages(prev => [
        ...prev,
        userMessage,
        { id: id(), role: 'assistant', text: 'Recebi o PDF e estou extraindo o texto. Assim que a extração concluir, vou resumir o conteúdo.' },
      ])
      setInput('')
      return
    }
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
    if (clean && attachment?.kind === 'pdf' && isPdfAnalysisIntent(clean) && attachment.extractionStatus === 'extracting') {
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Estou extraindo o PDF. Aguarde concluir e envie novamente.',
        },
      ])
      setInput('')
      return
    }
    if (clean && attachment?.kind === 'pdf' && isPdfAnalysisIntent(clean) && attachment.extractionStatus === 'ready' && !activePdfContext) {
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Falhei ao resumir o PDF apesar de o texto estar extraído. Tente novamente.',
        },
      ])
      setInput('')
      return
    }
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
    // Skip generic fallback when user is asking about an active ready PDF — let API handle it with injected context
    const shouldSkipFallback = Boolean(activePdfContext && isPdfAnalysisIntent(clean))
    const localProductAnswer = shouldSkipFallback ? null : buildProductFallbackAnswer(userText, identityContext, isPlatformQuestion ? undefined : attachment)
    if (localProductAnswer) {
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: localProductAnswer,
        },
      ])
      setInput('')
      return
    }
    // M3/M5 explicit product module intents — checked before generic business fallback
    const shouldGenerateDocx = clean && isDocxGenerationIntent(clean)
    const shouldOpenBudgetXlsx = clean && isBudgetXlsxIntent(clean)

    const shouldOpenArchVis = isArchVisIntent(clean || modelText, attachment)
    const shouldOpenDirectCut = clean && isDirectCutIntent(clean)
    // M3 DOCX intent takes priority over generic contracts intent
    const shouldOpenContracts = clean && !shouldGenerateDocx && /\b(abrir contracts|contracts studio|abrir contratos|abrir contrato|revisar contrato|revisar proposta|gerar contrato|gerar proposta|gerar proposta docx|gerar contrato docx)\b/i.test(clean) && isContractsIntent(clean)
    // M5 XLSX intent takes priority over generic budget intent
    const shouldOpenBudget = clean && !shouldOpenBudgetXlsx && /\b(abrir budget|budget studio|gerar or[cç]amento|or[cç]amento xlsx|bdi|sinapi|gerar planilha|planilha de or[cç]amento)\b/i.test(clean) && isBudgetIntent(clean)
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
    const shouldOpenBim3D = clean && isBim3DIntent(clean)
    const shouldLockRevision = clean && archVisOutput && attachment?.kind === 'image' && isRevisionIntent(clean)
    const shouldTreatAsConversation = clean && isOperationalGovernancePrompt(clean)
    const shouldOpenSkillExport = clean && !shouldTreatAsConversation && (isSkillExportIntent(clean) || isSkillExportFactoryAlias(clean))
    const shouldOpenExportCenter = clean && isExportIntent(clean)
    if (shouldOpenExportCenter) {
      closeAllPanels()
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
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
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
    // M3 — DOCX generation intent: open Contracts Studio and trigger draft + download
    if (shouldGenerateDocx) {
      const pdfContext = attachment?.kind === 'pdf' && attachment.extractionStatus === 'ready'
        ? `\n\nContexto do PDF ativo "${attachment.file.name}":\n${attachment.extractedText?.slice(0, 3000)}`
        : ''
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        { id: id(), role: 'assistant', text: `Abrindo Contracts Studio para gerar documento DOCX. Use o botão **Generate contract draft** e depois **Download DOCX** para baixar o arquivo.${pdfContext ? ' O conteúdo do PDF foi incluído como contexto.' : ''}` },
      ])
      closeAllPanels()
      setContractsOutput({ source: attachment, goal: clean, conversationContext: [...messages, userMessage].slice(-6).map(m => `${m.role}: ${m.text}`), autoGenerate: true })
      setInput('')
      return
    }

    // M5 — XLSX Budget intent: open Budget Studio with XLSX export focus
    if (shouldOpenBudgetXlsx) {
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        { id: id(), role: 'assistant', text: 'Abrindo Budget Studio com geração automática do orçamento. Use o botão **Download XLSX (com BDI)** para exportar a planilha.' },
      ])
      closeAllPanels()
      setBudgetOutput({ source: attachment, goal: clean, conversationContext: [...messages, userMessage].slice(-6).map(m => `${m.role}: ${m.text}`), autoGenerate: true })
      setInput('')
      return
    }

    if (shouldOpenBusiness) {
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
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: responseText }])
      closeAllPanels()
      setBusinessOutput({ goal: clean, focus, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenSupplyChain) {
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Supply Chain / Suppliers Studio ao lado. Vou organizar fornecedores, cotações e compras em modo local, sem fingir preço, disponibilidade ou verificação de fornecedor.' }])
      closeAllPanels()
      setSupplyChainOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenNotifications) {
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Notifications / Alerts Center ao lado. Estes são alertas locais; conector de push, email ou SMS ainda não está conectado.' }])
      closeAllPanels()
      setNotificationsOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenAiCost) {
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o AI Cost Dashboard ao lado. Vou mostrar estimativas locais de uso/custo, sem fingir billing real da OpenAI ou de outro provedor.' }])
      closeAllPanels()
      setAiCostOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenMultiTenant) {
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Multi-tenant Readiness ao lado. É planejamento local-first: sem fingir isolamento real de Supabase/auth/RLS.' }])
      closeAllPanels()
      setMultiTenantOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenPwaMobile) {
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o PWA / Mobile Field Mode ao lado. Vou preparar checklist e fluxo mobile/offline, sem fingir PWA instalado.' }])
      closeAllPanels()
      setPwaMobileOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenDigitalTwin) {
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Digital Twin UI ao lado. É estado local/planning-only: sem IoT em tempo real e sem sync vivo de modelo.' }])
      closeAllPanels()
      setDigitalTwinOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenKnowledgeBase) {
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri a Knowledge Base ao lado. Vou indexar conhecimento local/projeto sem executar conteúdo e sem marcar global sem aprovação do Owner.' }])
      closeAllPanels()
      setKnowledgeBaseOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenMetrics) {
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Metrics Dashboard ao lado. Métricas são LOCAL_DEMO/ESTIMATED_LOCAL até existir telemetria real.' }])
      closeAllPanels()
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
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Apex Copilot Local Execution v0. Ele executa comandos reais apenas pela allowlist do server.mjs, sem comando livre.' }])
      closeAllPanels()
      setCopilotExecutionOutput({ goal: clean, conversationContext: context })
      setOwnerConsoleOpen(true)
      setInput('')
      return
    }
    if (shouldOpenControlsAgents) {
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o painel CP11C com EVM Analyst, Scheduler e NR Compliance. Vou calcular somente com dados fornecidos/localizados e manter o restante como UNKNOWN, GENERAL_GUIDANCE ou NEEDS_SAFETY_REVIEW.',
        },
      ])
      closeAllPanels()
      setEvmSchedulerComplianceOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenAgents) {
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o painel dos 8 Cognitive Agents ao lado. EVM, Scheduler e NR Compliance agora aparecem como implementados local-first, com limites claros: sem dados em tempo real falsos e sem aprovação oficial de compliance.',
        },
      ])
      closeAllPanels()
      setAgentsOutput({ goal: clean, conversationContext: context })
      setInput('')
      return
    }
    if (clean && bim3DOutput && isBimStudioCommand(clean)) {
      let responseText = 'Feito. Adicionei isso no BIM / 3D Studio e atualizei o tour/correções ao lado.'
      const lower = clean.toLowerCase()
      if (lower.includes('rotacione') || lower.includes('rotacionar') || lower.includes('gire') || lower.includes('girar') || lower.includes('camera') || lower.includes('câmera')) {
        responseText = 'Rotacionando a câmera do visualizador 3D para ajustar a vista do modelo.'
      } else if (lower.includes('isolar') || lower.includes('isole') || lower.includes('focar') || lower.includes('foca') || lower.includes('inconsistencia') || lower.includes('inconsistência') || lower.includes('zoom') || lower.includes('destacar')) {
        responseText = 'Isolando os elementos do modelo em modo X-Ray e destacando a inconsistência.'
      }
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: responseText,
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
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o DirectCut Studio ao lado com o plano de vídeo, roteiro, shot list e prompt ajustável. Ainda não há conector de vídeo real, então vou trabalhar em modo planning-only.',
        },
      ])
      closeAllPanels()
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
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Contracts / Permits Studio ao lado. Vou preparar rascunho, checklist ou revisão com evidência por item, sem fingir aprovação jurídica.',
        },
      ])
      closeAllPanels()
      setContractsOutput({
        source: attachment,
        goal: clean,
        conversationContext: context,
      })
      setInput('')
      return
    }
    if (shouldOpenResearch) {
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Research / Market Intelligence Studio ao lado. Vou montar um plano com fontes e confiança, sem inventar web, SINAPI, preços ou dados atuais.',
        },
      ])
      closeAllPanels()
      setResearchOutput({
        goal: clean,
        conversationContext: context,
      })
      setInput('')
      return
    }
    if (shouldOpenFieldOps) {
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Field Operations / RDO Studio ao lado. Vou preparar RDO, progresso, segurança, qualidade e punch list com evidência por item, sem fingir clima ou aprovação de inspeção.',
        },
      ])
      closeAllPanels()
      setFieldOpsOutput({
        source: attachment,
        goal: clean,
        conversationContext: context,
      })
      setInput('')
      return
    }
    if (shouldOpenBudget) {
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      closeAllPanels()
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Budget / Quantity Studio ao lado. Vou montar um orçamento preliminar com confiança e fonte por item, sem fingir precisão nem integração SINAPI.',
        },
      ])
      closeAllPanels()
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
      closeAllPanels()
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: studioMessage }])
      closeAllPanels()
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
          file: buildChatFilePayload(attachment),
        }),
      })
      const data = await response.json().catch(() => ({}))
      // H5.0D: log response mode so version is visible in browser console
      if (data?.mode) console.log('[Apex H5] response mode:', data.mode)
      if (data?.memoryPatch && typeof data.memoryPatch === 'object') {
        setClientMemory(current => {
          const next = { ...current, ...data.memoryPatch }
          saveClientMemory(next)
          return next
        })
      }
      const reply = response.ok
        ? pickCanonicalReply(data, buildCopilotFailureMessage(userText))
        : (activePdfContext && isPdfAnalysisIntent(clean)
          ? 'Falhei ao resumir o PDF apesar de o texto estar extraído. Tente novamente.'
          : buildCopilotFailureMessage(userText))
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
        closeAllPanels()
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
          text: (activePdfContext && isPdfAnalysisIntent(clean)
            ? 'Falhei ao resumir o PDF apesar de o texto estar extraído. Tente novamente.'
            : buildProductFallbackAnswer(userText, identityContext, isPlatformQuestion ? undefined : attachment)) || buildCopilotFailureMessage(userText),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(file: File) {
    // Allow 0-byte size if file has a name/type — some browsers (Android, cloud pickers) report 0 for valid files
    if (file.size === 0 && !file.name && !file.type) return
    const kind = classifyFile(file)
    const dataUrl = kind === 'image' ? await readFileAsDataUrl(file) : undefined
    const previewUrl = kind === 'image' || kind === 'pdf' ? URL.createObjectURL(file) : undefined

    const intake: IntakeFile = {
      file,
      kind,
      previewUrl,
      url: previewUrl,
      dataUrl,
      extractionStatus: kind === 'pdf' ? 'idle' : undefined,
      dimensions: dataUrl ? await readImageDimensions(dataUrl).catch(() => undefined) : undefined,
    }
    setPendingAttachment(intake)
    if (fileInput.current) fileInput.current.value = ''
    return
  }

  async function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
    const pastedFile = Array.from(event.clipboardData?.files || [])[0]
    const items = Array.from(event.clipboardData?.items || [])
    const fileItem = !pastedFile ? items.find(item => item.kind === 'file') : undefined
    const blob = pastedFile || fileItem?.getAsFile()
    if (!blob) return
    event.preventDefault()
    const extension = blob.name?.split('.').pop() || (blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1] || 'file')
    const file = pastedFile && pastedFile.name
      ? pastedFile
      : new File([blob], `pasted-file-${timestampForFileName()}.${extension}`, {
          type: blob.type,
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
    closeAllPanels()
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
    setPendingAttachment(null)
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
    const restored = recordToIntakeFile(
      project.activeFileId
        ? project.files.find(file => file.id === project.activeFileId)
        : undefined
    )
    setActiveFile(isUsableIntakeFile(restored) ? restored : undefined)
    setArchVisRevisionConstraints(project.revisionConstraints || [])
    setMessages(project.chatMessages.length ? project.chatMessages.map(message => ({
      id: message.id,
      role: message.role,
      text: message.text,
      attachment: recordToIntakeFile(getProjectFileRecordById(project, message.attachmentFileId)),
      attachmentFileId: message.attachmentFileId,
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
    setPendingAttachment(null)
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

        <section className="chat-shell" aria-label="Apex AI Copilot chat">
          <div className="messages">
            {messages.map(message => (
              <article key={message.id} className={`message ${message.role}`}>
                <div className="avatar">{message.role === 'assistant' ? <Bot size={18} /> : <Building2 size={18} />}</div>
                <div className={`bubble ${message.text.length > 900 || message.text.includes('\n') ? 'long-text' : ''}`}>
                  <div className="message-body">{renderMessageText(message.text)}</div>
                  {message.attachment && !message.attachment.contextOnly && (
                    <div className="attachment-chip">
                      <Paperclip size={15} />
                      {message.attachment.file.name}
                      <span>
                        {message.attachment.kind} · {formatSize(message.attachment.file.size)}
                        {message.attachment.extractionStatus === 'extracting' ? ' · extraindo PDF' : ''}
                        {message.attachment.extractionStatus === 'failed' ? ' · extração falhou' : ''}
                        {message.attachment.pageCount ? ` · ${message.attachment.pageCount}p extraídas` : ''}
                      </span>
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
            {loading && (
              <article className="message assistant">
                <div className="avatar"><Bot size={18} /></div>
                <div className="bubble typing">Apex AI Copilot está pensando...</div>
              </article>
            )}
            <div ref={messagesEnd} className="messages-end" aria-hidden="true" />
          </div>

          <div className="composer">
            {pendingAttachment && (
              <div className="composer-file">
                <Paperclip size={16} />
                <span>{pendingAttachment.file.name}</span>
                <small>
                  {pendingAttachment.kind} · {formatSize(pendingAttachment.file.size)}
                </small>
                <button type="button" className="composer-file-remove" onClick={() => setPendingAttachment(null)} aria-label={uiLanguage === 'EN' ? 'Remove attachment' : 'Remover anexo'}>
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="input-row">
              <button className="icon-button" onClick={() => fileInput.current?.click()} aria-label={uiLanguage === 'EN' ? 'Attach file' : 'Anexar arquivo'}>
                <Plus size={20} />
              </button>
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
                placeholder={uiLanguage === 'EN' ? 'Ask Apex Copilot anything...' : 'Pergunte qualquer coisa à Apex Copilot...'}
                rows={1}
              />
              <button className="composer-language-button" type="button" onClick={() => setUiLanguage(current => current === 'EN' ? 'PT' : 'EN')}>
                {uiLanguage}
              </button>
              <button className="icon-button" type="button" onClick={() => setVoiceNotice(current => !current)} aria-label={uiLanguage === 'EN' ? 'Voice input' : 'Entrada por voz'}>
                <Mic size={19} />
              </button>
              <button className="send-button" onClick={() => askCopilot()} aria-label={loading ? 'Stop' : 'Send message'} disabled={!loading && !input.trim() && !pendingAttachment}>
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
              autoGenerate={budgetOutput.autoGenerate}
              onSaveToProject={saveBudgetToProject}
              onSendToDirectCut={summary => {
                closeAllPanels()
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
              autoGenerate={contractsOutput.autoGenerate}
              onSaveToProject={saveContractsToProject}
              onSendToBudget={summary => {
                closeAllPanels()
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
                closeAllPanels()
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
                closeAllPanels()
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
                closeAllPanels()
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
                />
              )}
              {(businessOutput.focus === 'finance-accounting' || businessOutput.focus === 'all') && (
                <FinancePanel
                  goal={businessOutput.goal}
                  conversationContext={businessOutput.conversationContext}
                  onSaveToProject={saveBusinessToProject}
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

createRoot(document.getElementById('root')!).render(<App />)

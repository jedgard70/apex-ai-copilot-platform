import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import {
  Activity,
  ArrowUp,
  BookOpen,
  Bot,
  Building2,
  ChevronDown,
  Compass,
  Copy,
  Cpu,
  Download,
  LogOut,
  Mic,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Square,
  Terminal,
  Volume2,
  X,
} from 'lucide-react'
import { ArchVisPanel } from './components/ArchVisPanel'
import { AgentsPanel } from './components/AgentsPanel'
import { CognitiveAgentsPanel } from './components/CognitiveAgentsPanel'
import { AiCostDashboardPanel } from './components/AiCostDashboardPanel'
import { AutoupgradePanel } from './components/AutoupgradePanel'
import { AvatarVoicePanel } from './components/AvatarVoicePanel'
import { AuthPanel } from './components/AuthPanel'
import { Bim3DPanel, BimArchVisOutput, BimTourOutput } from './components/Bim3DPanel'
import { BudgetPanel } from './components/BudgetPanel'
import { CampaignAutomationPanel } from './components/CampaignAutomationPanel'
import { PipelineProgressPanel } from './components/PipelineProgressPanel'
import { ContractsPanel } from './components/ContractsPanel'
import { CopilotExecutionPanel } from './components/CopilotExecutionPanel'
import { CrmPanel } from './components/CrmPanel'
import { DigitalTwinPanel } from './components/DigitalTwinPanel'
import { DirectCutInitialConfig, DirectCutPanel } from './components/DirectCutPanel'
import { EvmSchedulerCompliancePanel } from './components/EvmSchedulerCompliancePanel'
import { ExportCenterPanel } from './components/ExportCenterPanel'
import { FinancePanel } from './components/FinancePanel'
import { FieldOpsPanel } from './components/FieldOpsPanel'
import { GenerationHistoryPanel } from './components/GenerationHistoryPanel'
import { ApsPanel } from './components/ApsPanel'
import { KnowledgeBasePanel } from './components/KnowledgeBasePanel'
import { MetricsDashboardPanel } from './components/MetricsDashboardPanel'
import { MultiTenantPanel } from './components/MultiTenantPanel'
import { NotificationsPanel } from './components/NotificationsPanel'
import { ProjectPackagePanel } from './components/ProjectPackagePanel'
import { ProjectWorkspacePanel } from './components/ProjectWorkspacePanel'
import { PwaMobilePanel } from './components/PwaMobilePanel'
import { PwaInstallBanner, IosInstallBanner } from './components/PwaInstallBanner'
import { ResearchPanel } from './components/ResearchPanel'
import { SaasAdminPanel } from './components/SaasAdminPanel'
import { SkillExportPanel } from './components/SkillExportPanel'
import { SkillUpdatePanel } from './components/SkillUpdatePanel'
import { SupplyChainPanel } from './components/SupplyChainPanel'
import { PlatformMapPanel } from './components/PlatformMapPanel'
import { PublicVslLandingPage } from './components/PublicVslLandingPage'
import { UserAccountPanel } from './components/UserAccountPanel'
import AppLayout from './components/AppLayout'
import { ClientDashboard } from './components/ClientDashboard'
import { DashboardPage } from './components/DashboardPage'
import { DashboardByRolePanel } from './components/DashboardByRolePanel'
import { CrmPipelinePanel } from './components/CrmPipelinePanel'
import { BimClashPanel } from './components/BimClashPanel'
import { QualidadeNCIsPanel } from './components/QualidadeNCIsPanel'
import { WorkflowTasksPanel } from './components/WorkflowTasksPanel'
import { OwnerPage } from './components/OwnerPage'
import { ProviderDetailPanel } from './components/ProviderDetailPanel'
import { ProfessionalPromptPanel } from './components/ProfessionalPromptPanel'
import { DeploymentFlowPage } from './components/DeploymentFlowPage'
import { GovernanceHubPage } from './components/GovernanceHubPage'
import { MarketingAnalyticsPage } from './components/MarketingAnalyticsPage'
import { PlatformNavigatorPage } from './components/PlatformNavigatorPage'
import { ModelTrainingPage } from './components/ModelTrainingPage'
import { TechnicalDocumentationPage } from './components/TechnicalDocumentationPage'
import { StockMarketPanel } from './components/StockMarketPanel'
import { TripPlannerPanel } from './components/TripPlannerPanel'
import { NRCompliancePanel } from './components/NRCompliancePanel'
import { AccountingPanel } from './components/AccountingPanel'
import { AmericanPermitsPanel } from './components/AmericanPermitsPanel'
import { classifyFile, formatSize, IntakeFile, isVisionReady, readFileAsDataUrl, readImageDimensions } from './lib/fileIntake'
import { extractPdfText } from './lib/pdfExtractor'
import {
  createProjectProfile,
  createProject,
  exportProject,
  importProject,
  loadActiveProject,
  loadProjects,
  ProjectProfileDraft,
  ProjectFileRecord,
  ProjectWorkspace,
  removeAllProjects,
  setActiveProjectId,
  upsertProject,
} from './lib/projectWorkspace'
import { syncProjectLocalToRemote } from './lib/projectPersistenceAdapter'
import { SupabaseAccountState, attemptProfileBootstrap, loadSupabaseAccountState } from './lib/supabaseAuthBootstrap'
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from './lib/supabaseClient'
import { syncFieldOpsPlanRemote } from './lib/fieldOpsPersistence'
import { isSkillUpdateIntent, isTrustedGlobalSkillSource, ProjectMemoryUpdate, SkillUpdateApplyResult } from './lib/skillUpdateEngine'
import { isSkillExportIntent } from './lib/skillExportFactory'
import { BudgetPlan } from './lib/budgetKnowledge'
import type { CopilotExecutionResult } from './lib/copilotExecutionModel'
import { ContractsPlan } from './lib/contractsKnowledge'
import { useIsMobile } from './lib/useIsMobile'
import { BusinessPlan } from './lib/crmFinanceKnowledge'
import { isExportIntent } from './lib/exportCenter'
import { FieldOpsPlan, FieldRdoContext } from './lib/fieldOpsKnowledge'
import { ProjectPackagePlan } from './lib/projectPackageKnowledge'
import { GenerationHistoryEntry } from './lib/generationHistory'
import { ResearchPlan } from './lib/researchKnowledge'
import { selectTool, tools } from './lib/toolRegistry'
import { isAgentIntent } from './lib/apexAgents'
import { AiCostPlan, isAiCostIntent } from './lib/aiCostKnowledge'
import { AutoupgradePlan, isAutoupgradeIntent } from './lib/autoupgradeKnowledge'
import { AvatarVoicePlan, isAvatarVoiceIntent } from './lib/avatarVoiceKnowledge'
import { CampaignAutomationPlan, isCampaignAutomationIntent } from './lib/campaignAutomationKnowledge'
import { DigitalTwinPlan, isDigitalTwinIntent } from './lib/digitalTwinKnowledge'
import { EvmSchedulerCompliancePlan, isEvmSchedulerComplianceIntent } from './lib/evmSchedulerComplianceKnowledge'
import { KnowledgeBasePlan, isKnowledgeBaseIntent } from './lib/knowledgeBaseKnowledge'
import { MetricsPlan, isMetricsIntent } from './lib/metricsKnowledge'
import { MultiTenantPlan, isMultiTenantIntent } from './lib/multiTenantKnowledge'
import { isNotificationsIntent, NotificationsPlan } from './lib/notificationsKnowledge'
import { createPlatformMapSummary, isPlatformMapIntent } from './lib/platformMapKnowledge'
import { PwaMobilePlan, isPwaMobileIntent } from './lib/pwaMobileKnowledge'
import { isSupplyChainIntent, SupplyChainPlan } from './lib/supplyChainKnowledge'
import './lib/observability'
import './design-tokens.css'
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

type PendingLayerDecision = {
  label: string
  openCommand: string
  goal: string
}

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

type ModelOption = {
  id: string
  name: string
  provider: string
  modelId: string
}

type ManualModelProvider = 'all' | 'gemini' | 'gemini-interactions' | 'fal' | 'elevenlabs'

const DIRECT_GEMINI_MODELS = [
  // Flash (gratuito, 60 RPM) — padrão
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
  // Pro (10 RPM)
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
  // Imagem (gratuito)
  { id: 'gemini-3.1-flash-image', name: 'Gemini 3.1 Flash Image' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image' },
  // TTS / Áudio (gratuito)
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS' },
  { id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash TTS' },
  { id: 'gemini-2.5-pro-preview-tts', name: 'Gemini 2.5 Pro TTS' },
  { id: 'gemini-2.5-flash-native-audio-preview-12-2025', name: 'Gemini 2.5 Native Audio' },
]

const INTERACTION_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Interactions)' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Interactions)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Interactions)' },
  { id: 'gemini-3.1-flash-image', name: 'Gemini 3.1 Flash Image (Interactions)' },
  { id: 'gemini-3.1-flash-tts-preview', name: 'Gemini 3.1 Flash TTS (Interactions)' },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image (Interactions)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Interactions)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Interactions)' },
  { id: 'lyria-3-clip-preview', name: 'Lyria 3 Clip (Interactions)' },
  { id: 'lyria-3-pro-preview', name: 'Lyria 3 Pro (Interactions)' },
]

function composeModelValue(provider: string, modelId: string) {
  return `${provider}|${modelId}`
}

function splitModelValue(value: string) {
  const raw = String(value || '')
  const separatorIndex = raw.indexOf('|')
  if (separatorIndex === -1) {
    return { provider: null as string | null, modelId: raw, raw }
  }
  const provider = raw.slice(0, separatorIndex)
  const modelId = raw.slice(separatorIndex + 1)
  return { provider, modelId, raw }
}

function getProviderLabel(provider: string) {
  if (provider === 'all') return 'Todos'
  if (provider === 'gemini') return 'Google AI Studio'
  if (provider === 'gemini-interactions') return 'Gemini Interactions'
  if (provider === 'fal') return 'FAL.ai'
  if (provider === 'elevenlabs') return 'Eleven Labs'
  return provider || 'Gemini'
}

const FAL_CHAT_MODELS = [
  { id: 'fal-ai/llama-3.3-70b', name: 'LLaMA 3.3 70B (FAL)' },
  { id: 'fal-ai/llama-3.1-8b', name: 'LLaMA 3.1 8B (FAL)' },
  { id: 'fal-ai/llama-3.1-70b', name: 'LLaMA 3.1 70B (FAL)' },
  { id: 'fal-ai/llama-3.1-405b', name: 'LLaMA 3.1 405B (FAL)' },
  { id: 'fal-ai/llama-4-scout', name: 'Llama 4 Scout (FAL)' },
  { id: 'fal-ai/llama-4-maverick', name: 'Llama 4 Maverick (FAL)' },
  { id: 'fal-ai/mistral-large', name: 'Mistral Large (FAL)' },
  { id: 'fal-ai/mixtral-8x7b', name: 'Mixtral 8x7B (FAL)' },
  { id: 'fal-ai/mixtral-8x22b', name: 'Mixtral 8x22B (FAL)' },
  { id: 'fal-ai/deepseek-r1', name: 'DeepSeek R1 (FAL)' },
  { id: 'fal-ai/deepseek-v3', name: 'DeepSeek V3 (FAL)' },
  { id: 'fal-ai/qwen-2.5-72b', name: 'Qwen 2.5 72B (FAL)' },
  { id: 'fal-ai/qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B (FAL)' },
  { id: 'fal-ai/phi-4', name: 'Phi-4 (FAL)' },
  { id: 'fal-ai/phi-3-mini', name: 'Phi-3 Mini (FAL)' },
]

const ELEVENLABS_MODELS = [
  { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2' },
  { id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5' },
  { id: 'eleven_flash_v2_5', name: 'Eleven Flash v2.5' },
  { id: 'eleven_monolingual_v1', name: 'Eleven Monolingual v1' },
  { id: 'eleven_english_sts_v2', name: 'Eleven English STS v2' },
]

function buildStaticModelCatalog(): ModelOption[] {
  return [
    ...INTERACTION_MODELS.map(model => ({
      id: composeModelValue('gemini-interactions', model.id),
      name: model.name,
      provider: 'gemini-interactions',
      modelId: model.id,
    })),
    ...DIRECT_GEMINI_MODELS.map(model => ({
      id: composeModelValue('gemini', model.id),
      name: model.name,
      provider: 'gemini',
      modelId: model.id,
    })),
    ...FAL_CHAT_MODELS.map(model => ({
      id: composeModelValue('fal', model.id),
      name: model.name,
      provider: 'fal',
      modelId: model.id,
    })),
    ...ELEVENLABS_MODELS.map(model => ({
      id: composeModelValue('elevenlabs', model.id),
      name: model.name,
      provider: 'elevenlabs',
      modelId: model.id,
    })),
  ]
}

function resolveModelSelection(selectedValue: string, models: ModelOption[]) {
  const current = splitModelValue(selectedValue)
  if (current.provider) return current.raw
  const exactMatch = models.find(model => model.id === current.raw)
  if (exactMatch) return exactMatch.id

  const rawMatches = models.filter(model => model.modelId === current.raw)
  if (!rawMatches.length) {
    const normalized = String(current.raw || '').trim().toLowerCase()
    const legacyMap: Record<string, string> = {}
    // All models now route through Gemini
    const mapped = legacyMap[normalized]
    if (mapped) return 'gateway|' + mapped
    if (normalized.startsWith('gateway/')) return 'gateway|' + normalized
    return current.raw
  }

  const providerPriority = ['gemini', 'fal', 'elevenlabs']
  const bestMatch = [...rawMatches].sort((left, right) => {
    return providerPriority.indexOf(left.provider) - providerPriority.indexOf(right.provider)
  })[0]
  return bestMatch?.id || current.raw
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

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for older browsers or non-secure contexts
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

let currentSpeech: SpeechSynthesisUtterance | null = null

function speakMessage(text: string, messageId: string) {
  if (!('speechSynthesis' in window)) return

  // Stop current speech if same message clicked again
  if (currentSpeech && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel()
    currentSpeech = null
    return
  }

  // Strip markdown, HTML tags, and code blocks for cleaner speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()

  if (!cleanText) return

  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.rate = 1.1
  utterance.pitch = 1.0
  utterance.volume = 1.0

  // Try to use a Portuguese voice if available
  const voices = window.speechSynthesis.getVoices()
  const ptVoice = voices.find(v => v.lang.startsWith('pt'))
  if (ptVoice) utterance.voice = ptVoice
  else utterance.lang = 'pt-BR'

  utterance.onend = () => { currentSpeech = null }
  utterance.onerror = () => { currentSpeech = null }

  currentSpeech = utterance
  window.speechSynthesis.speak(utterance)
}

function isSpeaking() {
  return currentSpeech !== null && window.speechSynthesis.speaking
}

async function shareMessage(text: string) {
  const shareData = { text }
  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch {
      // User cancelled or share not supported
    }
  } else {
    // Fallback: copy to clipboard
    await copyToClipboard(text)
  }
}

function downloadConversation(messages: {id: string, role: string, text: string, timestamp?: string}[]) {
  const lines: string[] = []
  lines.push('# Apex AI Copilot — Conversa Exportada')
  lines.push(`# Data: ${new Date().toLocaleString('pt-BR')}`)
  lines.push('')
  messages.forEach(msg => {
    const role = msg.role === 'assistant' ? '🤖 Apex' : '👤 Você'
    const text = msg.text
      .replace(/```/g, '\n```\n')
      .trim()
    lines.push(`---`)
    lines.push(`### ${role}`)
    lines.push('')
    lines.push(text)
    lines.push('')
  })
  lines.push('---')
  lines.push(`*Exportado por Apex AI Copilot — ${messages.length} mensagens*`)

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `apex-conversa-${timestampForFileName()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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

function isLocalDemoAuthAllowed() {
  return import.meta.env.VITE_APEX_ALLOW_LOCAL_DEMO_AUTH === 'true'
}

function buildLocalDemoOwnerState(): SupabaseAccountState {
  return {
    providerStatus: 'supabase-not-configured',
    sessionStatus: 'signed-in',
    user: { id: 'local-demo-user', email: 'owner@apexglobalai.co' },
    profile: { id: 'local-demo-user', email: 'owner@apexglobalai.co', full_name: 'Owner Admin (Local)' },
    tenant: { id: 'local-demo-tenant', name: 'Apex Local Workspace' },
    role: 'owner_admin',
    permissions: ['*'],
    persistenceMode: 'localStorage',
    bootstrapStatus: 'ready',
    message: 'Local demo mode enabled by VITE_APEX_ALLOW_LOCAL_DEMO_AUTH.',
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
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|gere|crie|criar|renderizar|renderize|humanizar|humanize|refazer|refaça|editar|edit|quero|preciso|faça|faca|prepare|monte)\b/i.test(lower)
  const hasKeyword = /\b(archvis|render|planta humanizada|planta|fachada|interior|imagem|área gourmet|area gourmet|prompt de render)\b/i.test(lower)
  if (hasVerb && hasKeyword) return true

  if (attachment?.kind === 'image' && !text.trim()) return true
  if (attachment?.kind !== 'image') return false
  return /\b(gerar prompt de render|gere um prompt de render|prompt de render|crie uma planta humanizada|criar planta humanizada|planta humanizada|renderizar|renderize|renderize essa|renderizar essa|renderize esta|renderizar esta|área gourmet|area gourmet|refaz|refaça|regenera|regenerate|sem jardim|não crie|nao crie|deixa mais|usa madeira|melhorar imagem|editar imagem|trocar materiais|adicionar paisagismo|criar fachada|criar imagem de venda|humanize|image edit|edit image|render)\b/i.test(text)
}

function isDirectCutIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|criar|create|gerar|generate|fazer|make|editar|edit|cortar|cut|montar|quero|preciso|faça|faca|prepare)\b/i.test(lower)
  const hasKeyword = /\b(video|v[ií]deo|directcut|roteiro|reels|apresenta[cç][aã]o|tour|anima[cç][aã]o|v[ií]deo de venda|video de venda|timelapse|shot list|storyboard|cinematic|cinem[aá]tico|transformar imagem em v[ií]deo|imagem em v[ií]deo|image to video|adicionar voz|add voice|mudar luz|alterar luz|relight|melhorar v[ií]deo|improve video|clip editor|editar v[ií]deo|3d scenes|movimento de c[aâ]mera|camera movement)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isDirectVideoNoPanelIntent(text: string) {
  return /\b(sem directcut|without directcut|sem abrir|without opening|sem painel|sem studio|direto no chat|direct in chat|gerar agora)\b/i.test(text)
}

function isBudgetIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|fazer|make|calcular|calculate|estimar|estimate|montar|quero|preciso|faça|faca|prepare)\b/i.test(lower)
  const hasKeyword = /\b(or[cç]amento|orcamento|quantitativo|estimativa|materiais|proposta|quanto custa|custo de obra|memorial de compra|budget|estimate|quantity|takeoff|materials|proposal|construction cost)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isProjectPackageIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|criar|create|gerar|generate|montar|assemble|preparar|prepare|organizar|build|quero|preciso|faça|faca)\b/i.test(lower)
  const hasKeyword = /\b(pacote completo|pacote do projeto|project package|complete package|entrega completa|prancha|apresenta[cç][aã]o para cliente|client presentation|cronograma f[ií]sico|cronograma financeiro|cronograma f[ií]sico financeiro|execution docs|documentos de execu[cç][aã]o|contract package|proposal package|full delivery bundle)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isGenerationHistoryIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|listar|list|consultar|check|revisar|review|quero|preciso|faça|faca)\b/i.test(lower)
  const hasKeyword = /\b(fila de gera[cç][aã]o|historico de gera[cç][aã]o|hist[oó]rico de gera[cç][aã]o|generation queue|generation history|history of generations|fila de render|hist[oó]rico de render|queue de exporta[cç][aã]o|export history)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isContractsIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|revisar|review|criar|create|gerar|generate|analisar|analyze|validar|validate|quero|preciso|faça|faca|prepare|montar)\b/i.test(lower)
  const hasKeyword = /\b(contrato|contrato simples|revisar contrato|jur[ií]dico|juridico|cl[aá]usula|clausula|proposta jur[ií]dica|memorial|memorial descritivo|alvar[aá]|licen[cç]a|permits?|permits americanos|documentos para aprova[cç][aã]o nos eua|us permits?|european permits?|eu building permit|planning permission|ahj|certificate of occupancy|fire marshal|ada|building control|compliance|endossos|endosso|art|rrt|habite-se|scope agreement|addendum|lawyer|legal|contract)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isResearchIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|pesquisar|search|buscar|find|analisar|analyze|investigar|investigate|quero|preciso|faça|faca|prepare)\b/i.test(lower)
  const hasKeyword = /\b(pesquisa de mercado|pesquisa na internet|faça uma pesquisa|faca uma pesquisa|concorrentes|pre[cç]o atualizado|sinapi|tabela sinapi|proposta comercial com pesquisa|estudo de mercado|market research|competitor|benchmark|pricing research|source check)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isFieldOpsIntent(text: string, attachment?: IntakeFile) {
  if (attachment?.kind === 'image' && /\b(obra|campo|rdo|di[aá]rio|relat[oó]rio|andamento|progresso|qualidade|seguran[cç]a|punch|pend[eê]ncia|foto de obra)\b/i.test(text)) return true
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|criar|create|gerar|generate|preencher|fill|fazer|make|quero|preciso|faça|faca|prepare)\b/i.test(lower)
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

function suggestLayerOpenDecision(text: string, attachment?: IntakeFile): PendingLayerDecision | null {
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

function isExplicitPanelOpenRequest(text: string) {
  const lower = text.toLowerCase().trim()
  const hasOpenVerb = /\b(abrir|abra|abre|open|ativar|ative|activate|launch|iniciar|start)\b/.test(lower)
  const hasProductionVerb = /\b(renderizar|renderize|renderiza|render|gerar|gere|gera|generate|fazer|faça|faca|faz|criar|crie|cria|create|produzir|produza|prepare|monte|montar|humanizar|humanize|editar|edite|edit|refazer|refaça|regenerar|regenerate|melhorar|melhore|improve|transformar|transforme|converter|converta)\b/.test(lower)
  const hasKnownLayer = /\b(archvis|directcut|render|planta humanizada|v[ií]deo de venda|video|imagem|fachada|interior|shot list|storyboard|humaniza[cç][aã]o|planta baixa|apresenta[cç][aã]o|tour virtual|anima[cç][aã]o|prompt de render|direct.?cut|bolsa|stock market|a[cç][oõ]es|b3|trip|viagem|pipeline|nr crea|nr compliance|segurança do trabalho|contabilidade|accounting|crc|american permits|building permit)\b/.test(lower)

  if (hasOpenVerb) {
    const hasPanelWord = /\b(layer|painel|panel|studio|estudio|workspace|m[oó]dulo|modulo|console)\b/.test(lower)
    return hasPanelWord || hasKnownLayer
  }

  // Production verbs (renderizar, fazer, criar, etc.) + keyword = intenção clara de usar o estúdio
  if (hasProductionVerb && hasKnownLayer) return true

  return false
}

function isOwnerConsoleIntent(text: string) {
  return /\b(mission control|owner command|owner console|console owner|abrir console owner|abrir owner console)\b/i.test(text)
}

// ── Novos módulos profissionais ────────────────────────────────────────────────

function isStockIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|verificar|checar|check)\b/i.test(lower)
  const hasKeyword = /\b(bolsa|bolsa de valores|a[cç][oõ]es|stock market|stock|ações|acoes|b3|ibovespa|nasdaq|bitcoin|crypto|fii|fiis|fundo imobili[aá]rio|fii|financeiro|mercado financeiro|cota[cç][aã]o|cotações|cotacoes)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isTripIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|planejar|plan|criar|create)\b/i.test(lower)
  const hasKeyword = /\b(trip|viagem|travel|planejamento de viagem|planejar viagem|destino|destinos|roteiro|itiner[aá]rio|budget de viagem|travel budget|hospedagem|passagem|passagens)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isPipelineIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|verificar|check)\b/i.test(lower)
  const hasKeyword = /\b(pipeline|progresso|progress|tarefas? em execu[cç][aã]o|tasks? running|status de gera[cç][aã]o|generation status|o que est[aá] rodando|oque esta rodando|andamento|em execu[cç][aã]o|tarefas? ativas?|tasks? active|filas? de gera[cç][aã]o)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isNRIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|criar|create)\b/i.test(lower)
  const hasKeyword = /\b(nr compliance|nr crea|norma regulamentadora|normas regulamentadoras|segurança do trabalho|seguranca do trabalho|nr \d+|crea|oe|ordem dos engenheiros|engenharia de seguran[cç]a|documento nr|nr\b|compliance nr)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isAccountingIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|criar|create)\b/i.test(lower)
  const hasKeyword = /\b(contabilidade|accounting|crc|contador|cont[aá]bil|dre|balanço|balanco|irpj|imposto de renda|fiscal|obriga[cç][aõ]es fiscais|demonstrativo|demonstra[cç][aã]o cont[aá]bil|escritura[cç][aã]o|lançamento contabil|lancamento contabil|livro caixa|contas a pagar|contas a receber)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isPromptLibraryIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|buscar|search)\b/i.test(lower)
  const hasLibrary = /\b(biblioteca de prompts|prompt library|biblioteca de skills|skill library|prompts profission|professional prompt|presets?|categoria de prompt|mostrar prompts|ver prompts|buscar prompts)\b/i.test(lower)
  const hasDirect = /\b(prompt library|professional prompt|biblioteca de prompt)\b/i.test(lower)
  return hasDirect || (hasVerb && hasLibrary)
}

function getPromptLibraryModule(text: string): string | undefined {
  const lower = text.toLowerCase()
  if (/\b(arquitetura|archvis|architect|render|humaniza|planta)\b/i.test(lower)) return 'archvis'
  if (/\b(directcut|direct.?cut|cinematogr[aá]fico|cinematic|v[ií]deo|video|film|movie)\b/i.test(lower)) return 'directcut'
  if (/\b(marketing|campanha|campaign|social media|disparo)\b/i.test(lower)) return 'marketing'
  if (/\b(contrato|contract|jur[ií]dico|legal)\b/i.test(lower)) return 'contracts'
  if (/\b(export|canvas|template|design)\b/i.test(lower)) return 'export'
  return undefined
}

function isPermitsIntent(text: string) {
  const lower = text.toLowerCase()
  const hasVerb = /\b(abrir|open|show|visualizar|ver|exibir|mostrar|acessar|go to|view|gerar|generate|criar|create)\b/i.test(lower)
  const hasKeyword = /\b(american permits?|permits? americanos?|building permits?|us permits?|construction permits?|permits? eua|permits? usa|alvar[aá] americano|licença americana|licenca americana|permit americano|international permits?|exporta[cç][aã]o de serviço|exportacao de servico)\b/i.test(lower)
  return hasVerb && hasKeyword
}

function isCheckpointContinuationIntent(text: string) {
  return /\b(continuar checkpoint)\b/i.test(text)
}

// H15 — lightweight markdown renderer for chat bubbles
function renderMessageText(text: string): React.ReactNode {
  const imageLineRe = /^!\[([^\]]*)\]\(((?:https?:\/\/|data:image\/)[^\s)]+)\)\s*$/
  const inlineImageRe = /!\[([^\]]*)\]\(((?:https?:\/\/|data:image\/)[^\s)]+)\)/g
  const videoLineRe = /^<video\s+controls\s+src="((?:https?:\/\/|data:video\/)[^"]+)"><\/video>\s*$/
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

    const videoMatch = videoLineRe.exec(line)
    if (videoMatch) {
      nodes.push(
        <video key={i} controls src={videoMatch[1]} style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '8px', display: 'block' }} />
      )
      i++
      continue
    }

    // Normal line — parse bold + inline code + inline images
    const renderInline = (s: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      let last = 0
      const combined = /(\*\*([^*]+)\*\*|`([^`]+)`|!\[([^\]]*)\]\(((?:https?:\/\/|data:image\/)[^\s)]+)\))/g
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
      : 'Checkpoint manager ready. I will prepare continuity, scope, validations and PR checklist without free shell, migrations or deploys. For local allowlisted checks, use Copilot Execution in Owner Console.'
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
  const hasPtSignal = /\b(vc|voce|você|ola|oi|eai|salve|bom dia|boa tarde|boa noite|quem sou|o que|serviços|servicos|preciso|ajuda|ajudar|me ajuda|orçamento|orcamento|consultoria|arquivo|anexar|upload|cronograma|marketing|vendas|construcao|construção|alvara|alvará|contrato|proposta|financeiro|campo|obra|quem é você|quem e voce|quem e vc|quem e apex|quem é a apex)\b|[ãõçáéíóú]/i.test(text)
  if (hasPtSignal) return true
  if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('pt')) {
    return true
  }
  return false
}

function buildCopilotFailureMessage(userText: string) {
  const pt = prefersPortuguese(userText) || true
  return pt
    ? 'Pode repetir de outro jeito? Estou online e pronto pra ajudar — me diga o que quer fazer: analisar planta, gerar imagem, orçamento, contrato, pesquisa ou qualquer outra tarefa.'
    : 'Could you rephrase that? I am online and ready to help — just tell me what you need: analyze a plan, generate an image, budget, contract, research, or any other task.'
}

function isIdentityQuestion(text: string) {
  return /\b(vc sabe quem sou eu|você sabe quem sou eu|voce sabe quem sou eu|quem sou eu|do you know who i am|who am i)\b/i.test(text.trim())
}

function isAIIdentityQuestion(text: string) {
  const trimmed = text.trim()
  return /\b(quem [eé] (voc[eê]|vc|a apex)|o que (voc[eê]|vc) [eé]|quem [eé] apex|who are you|what is apex|quem e voce|quem e vc|o que e a apex)\b/i.test(trimmed)
}

function buildAIIdentityAnswer(text: string) {
  if (!isAIIdentityQuestion(text)) return ''
  const pt = prefersPortuguese(text)
  return pt
    ? 'Sou a Apex AI. Como posso te ajudar?'
    : 'I am Apex AI. How can I help you?'
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
  return /\b(o que (mais )?(vc|voce|você)?\s*sabe( fazer)?|o que (vc|voce|você)?\s*faz|o que mais (vc|voce|você)?\s*faz|quais (são os )?servi[cç]os|lista de servi[cç]os|seus servi[cç]os|funcionalidades|habilidades|vc sabe responder|voce sabe responder|você sabe responder|capabilities|what else can you do|what can you do|what do you do|features)\b/i.test(text.trim())
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
  const trimmed = text.trim()
  if (/^(ol[aá]|oi|hey|hello|hi|bom dia|boa tarde|boa noite|e a[ií]|eai|e a\?|salve|tudo bem|tudo bom|como vai|como est[aá]|👋|🙏)(\s+apex)?[\s!?,.]*(tudo bem|tudo bom|como vai|como est[aá])?[\s!?,.]*$/i.test(trimmed)) {
    return true
  }
  const shortResponseRegex = /^(boa|tamo junto|valeu|obrigad[oa]|ok|certo|entendi|sim|n[aã]o|pode|t[aá]|ta|blz|bl[ée]z)$/i
  const cleaned = trimmed.replace(/[\s!?,.]+$/, '')
  return shortResponseRegex.test(cleaned)
}

function buildGreetingReply(text: string) {
  const lower = text.trim().toLowerCase()
  if (/obrigad|valeu|tamo junto/.test(lower)) return 'Por nada! Se precisar de mais alguma coisa, é só falar.'
  const pt = prefersPortuguese(text)
  return pt
    ? 'Olá! 😊 Como posso ajudar no seu projeto hoje? Posso analisar plantas e documentos, gerar imagens e vídeos, revisar contratos, preparar orçamentos, criar campanhas de marketing, ou fazer pesquisas. É só me dizer o que precisa!'
    : 'Hello! 😊 How can I help with your project today? I can analyze plans and documents, generate images and videos, review contracts, prepare budgets, create marketing campaigns, or do research. Just tell me what you need!'
}

function isPanelContextMessage(text: string): string | null {
  const m = text.match(/usuário abriu o painel (.+?) — projeto:/i)
  return m ? m[1].trim() : null
}

function buildPanelContextReply(panelName: string): string {
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

function buildProductFallbackAnswer(userText: string, identity: ChatIdentityContext) {
  const panelName = isPanelContextMessage(userText)
  if (panelName) return buildPanelContextReply(panelName)

  // H5.1F: multi-line messages are handled by the backend conversational router.
  // Only apply local fallbacks for single-line messages to prevent interception.
  const nonEmptyLines = userText.trim().split(/\n/).filter(l => l.trim()).length
  if (nonEmptyLines === 1) {
    const aiIdentityAnswer = buildAIIdentityAnswer(userText)
    if (aiIdentityAnswer) return aiIdentityAnswer

    const identityAnswer = buildIdentityAnswer(userText, identity)
    if (identityAnswer) return identityAnswer
    const operationalAnswer = buildOperationalSkillResponse(userText)
    if (operationalAnswer) return operationalAnswer
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
  const pathname = useMemo(() => window.location.pathname, [])
  const isPublicVslRoute = useMemo(() => /^(\/(vsl|oferta|apresentacao|landing\/vsl|campaign\/vsl))\/?$/i.test(pathname), [pathname])
  const isMobile = useIsMobile()
  const fileInput = useRef<HTMLInputElement | null>(null)
  const composerTextarea = useRef<HTMLTextAreaElement | null>(null)
  const messagesEnd = useRef<HTMLDivElement | null>(null)
  const supabaseProvider = useMemo(() => getSupabaseProviderStatus(), [])
  const isSupabaseConfigured = supabaseProvider.providerStatus === 'supabase-connected'
  const localDemoAuthAllowed = useMemo(() => isLocalDemoAuthAllowed(), [])
  const [accountState, setAccountState] = useState<SupabaseAccountState | null>(() => {
    if (!isSupabaseConfigured && localDemoAuthAllowed) return buildLocalDemoOwnerState()
    return null
  })
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured || !localDemoAuthAllowed)
  const [authMessage, setAuthMessage] = useState(supabaseProvider.message)
  const [activeView, setActiveView] = useState('dashboard')
  /* A11.0 — Dashboard studio card + sidebar routing: directly opens panels instead of sending chat commands */
  useEffect(() => {
    // Full-page views: dashboard, owner, chat. Everything else goes to split layout.
    if (!activeView || activeView === 'dashboard' || activeView === 'owner' || activeView === 'chat' || activeView === 'client-dashboard' || activeView === 'provider-detail') return
    if (activeView === 'archvis') { closeOtherPanels('archVis'); setArchVisOutput({ source: null as any, output: '', conversationContext: [] }) }
    else if (activeView === 'directcut') { closeOtherPanels('directCut'); setDirectCutOutput({ goal: 'Novo projeto DirectCut', conversationContext: ['assistant: Ativei o DirectCut Studio.'], initialConfig: { duration: '10', aspectRatio: '16:9', style: 'hyper-real' as any, cameraMovement: 'dolly-in' } }) }
    else if (activeView === 'bim') { closeOtherPanels('bim3D'); setBim3DOutput({ source: null as any }) }
    // Inject panel context into chat so AI knows what's happening
    const panelLabels: Record<string, string> = {
      navigator: 'Platform Navigator', governance: 'Governance Hub', training: 'Model Training',
      deployment: 'Deployment Flow', docs: 'Technical Documentation',
      marketing: 'Marketing Analytics', crm: 'CRM Pipeline', finance: 'Financeiro',
      fieldops: 'Field Operations', budget: 'Budget Studio', contracts: 'Contracts Studio',
      research: 'Research Studio',
    }
    if (panelLabels[activeView]) {
      const projectName = typeof activeProject?.name === 'string' ? activeProject.name : 'Apex Project'
      handleCommand(`usuário abriu o painel ${panelLabels[activeView]} — projeto: "${projectName}"`)
    }
  }, [activeView])
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
  const [cognitiveAgentsOutput, setCognitiveAgentsOutput] = useState<boolean>(false)
  const [dashboardByRoleOutput, setDashboardByRoleOutput] = useState<boolean>(false)
  const [bimClashOutput, setBimClashOutput] = useState<boolean>(false)
  const [qualidadeOutput, setQualidadeOutput] = useState<boolean>(false)
  const [workflowOutput, setWorkflowOutput] = useState<boolean>(false)
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
  const [projectPackageOutput, setProjectPackageOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.projectPackageOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [generationHistoryOpen, setGenerationHistoryOpen] = useState(Boolean(initialAppState.generationHistoryOpen))
  const [apsOpen, setApsOpen] = useState(false)
  const [metricsOutput, setMetricsOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.metricsOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [avatarVoiceOutput, setAvatarVoiceOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.avatarVoiceOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [autoupgradeOutput, setAutoupgradeOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.autoupgradeOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [platformMapOutput, setPlatformMapOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.platformMapOutput as SimpleStudioOutput | undefined
    return stored || null
  })
  const [stockOutput, setStockOutput] = useState<boolean>(false)
  const [tripOutput, setTripOutput] = useState<boolean>(false)
  const [pipelineOutput, setPipelineOutput] = useState<boolean>(false)
  const [pipelineActiveCount, setPipelineActiveCount] = useState<number>(0)
  const [nrOutput, setNrOutput] = useState<boolean>(false)
  const [accountingOutput, setAccountingOutput] = useState<boolean>(false)
  const [permitsOutput, setPermitsOutput] = useState<boolean>(false)
  const [campaignAutomationOutput, setCampaignAutomationOutput] = useState<SimpleStudioOutput | null>(() => {
    const stored = initialAppState.campaignAutomationOutput as SimpleStudioOutput | undefined
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
  const [skillUpdateFile, setSkillUpdateFile] = useState<IntakeFile | undefined>()
  const [skillUpdateAutoAnalyzeSignal, setSkillUpdateAutoAnalyzeSignal] = useState('')
  const [skillUpdateAutoApplyProjectMemory, setSkillUpdateAutoApplyProjectMemory] = useState(false)
  const [skillUpdateAutoApplyGlobal, setSkillUpdateAutoApplyGlobal] = useState(false)
  const [skillExportOpenSignal, setSkillExportOpenSignal] = useState('')
  const [exportCenterOpen, setExportCenterOpen] = useState(false)
  const [ownerConsoleOpen, setOwnerConsoleOpen] = useState(false)
  const [voiceNotice, setVoiceNotice] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const recognitionRef = useRef<any>(null)

  function toggleSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus(uiLanguage === 'EN' ? 'Speech recognition is not supported in this browser.' : 'Reconhecimento de voz não é suportado neste navegador.')
      setVoiceNotice(true)
      return
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = uiLanguage === 'EN' ? 'en-US' : 'pt-BR'

      recognition.onstart = () => {
        setIsRecording(true)
        setVoiceStatus(uiLanguage === 'EN' ? 'Listening...' : 'Ouvindo...')
        setVoiceNotice(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setInput(prev => prev ? prev + ' ' + transcript : transcript)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setVoiceStatus(uiLanguage === 'EN' ? `Error: ${event.error}` : `Erro: ${event.error}`)
      }

      recognition.onend = () => {
        setIsRecording(false)
        setVoiceNotice(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setIsRecording(false)
      setVoiceNotice(false)
    }
  }

  const [pendingLayerDecision, setPendingLayerDecision] = useState<PendingLayerDecision | null>(null)
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>('EN')
  const [archVisRevisionConstraints, setArchVisRevisionConstraints] = useState<string[]>(initialProject.revisionConstraints || [])
  const [loading, setLoading] = useState(false)
  const [modelRuntimeState, setModelRuntimeState] = useState<'idle' | 'running' | 'ok' | 'fallback'>('idle')
  const [lastResponseMode, setLastResponseMode] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('apex_conversations_v1')
      const activeId = localStorage.getItem('apex_active_conversation_id') || 'default'
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const active = parsed.find((c: ChatConversation) => c.id === activeId)
          if (active?.messages?.length) return active.messages
        }
      }
    } catch {}
    return [
      {
        id: id(),
        role: 'assistant',
        text: "Sou a Apex AI. Como posso te ajudar?",
      },
    ]
  })

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
            text: "Sou a Apex AI. Como posso te ajudar?",
          },
        ],
      },
    ]
  })
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    return localStorage.getItem('apex_active_conversation_id') || 'default'
  })
  const [showPromptLibrary, setShowPromptLibrary] = useState(false)
  const [activePromptLibraryModule, setActivePromptLibraryModule] = useState<string | undefined>(undefined)
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('apex_selected_model') || composeModelValue('gemini', 'gemini-3.1-flash-lite')
  })
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([])
  const [modelProvider, setModelProvider] = useState<string>('')
  const [manualModelProvider, setManualModelProvider] = useState<ManualModelProvider>('gemini')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [isComposerFocused, setIsComposerFocused] = useState(false)
  const [modelSearchQuery, setModelSearchQuery] = useState('')
  const [providerLedStatuses, setProviderLedStatuses] = useState<Array<{ id: string; label: string; hasKey: boolean; tooltip?: string; topUpUrl?: string }>>(() => {
    // Default: 11 live providers; will be updated from /api/copilot/provider-status
    const defaults: Array<{ id: string; label: string; hasKey: boolean; tooltip?: string; topUpUrl?: string }> = [
      { id: 'gemini', label: 'Gemini', hasKey: false },
      { id: 'fal', label: 'FAL.ai', hasKey: false },
      { id: 'elevenlabs', label: 'ElevenLabs', hasKey: false },
      { id: 'firebase', label: 'Firebase', hasKey: false },
      { id: 'authkey', label: 'AuthKey', hasKey: false },
      { id: 'github', label: 'GitHub', hasKey: false },
      { id: 'stripe', label: 'Stripe', hasKey: false },
      { id: 'supabase', label: 'Supabase', hasKey: false },
      { id: 'tavily', label: 'Tavily', hasKey: false },
      { id: 'ffmpeg', label: 'FFmpeg', hasKey: false },
      { id: 'aps', label: 'Autodesk APS', hasKey: false },
    ]
    return defaults
  })

  // Fetch live provider status for LED indicators
  useEffect(() => {
    const fetchProviderStatus = async () => {
      try {
        const res = await fetch('/api/copilot/provider-status')
        if (!res.ok) return
        const data = await res.json()
        if (data?.providers && Array.isArray(data.providers)) {
          // Rebuild LED list from live data, preserving order but syncing with API
          setProviderLedStatuses(data.providers.map((p: any) => ({
            id: p.id,
            label: p.name || p.id,
            hasKey: p.status === 'ok' || p.status === 'warning',
            tooltip: p.message?.substring(0, 60) || p.status,
            topUpUrl: p.topUpUrl,
          })))
        }
      } catch {
        // silent — keep defaults
      }
    }
    fetchProviderStatus()
    const timer = window.setInterval(fetchProviderStatus, 120_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const loadModels = async () => {
      const maxAttempts = 6
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const primary = await fetch('/api/copilot/chat?models=1').catch(() => null)
        if (primary?.ok) return primary.json()

        const fallback = await fetch('/api/copilot/models').catch(() => null)
        if (fallback?.ok) return fallback.json()

        if (attempt < maxAttempts) {
          await new Promise(resolve => window.setTimeout(resolve, 450))
        }
      }
      return null
    }

    loadModels()
      .then(data => {
        if (data?.models && Array.isArray(data.models)) {
          const models = data.models.map((model: any) => {
            const split = splitModelValue(model.id)
            return {
              id: String(model.id),
              name: String(model.name || model.id),
              provider: String(model.provider || split.provider || 'gemini'),
              modelId: String(model.modelId || split.modelId || model.id),
            }
          })
          if (models.length > 0) {
            setAvailableModels(models)
          }
          if (data.provider && data.provider !== 'mixed') {
            setModelProvider(String(data.provider))
          }
        }
        // If API returned empty models, force static catalog
        if (!data?.models || !Array.isArray(data.models) || !data.models.length) {
          const staticModels = buildStaticModelCatalog()
          setAvailableModels(staticModels)
        }
      })
      .catch(() => {
        // API unreachable — use static catalog immediately
        const staticModels = buildStaticModelCatalog()
        setAvailableModels(staticModels)
      })
  }, [])

  useEffect(() => {
    const active = conversations.find(c => c.id === activeConversationId)
    if (active?.messages?.length) {
      setMessages(active.messages)
    }
  }, [])

  useEffect(() => {
    if (!availableModels.length) return
    const resolved = resolveModelSelection(selectedModel, availableModels)
    if (resolved !== selectedModel) {
      setSelectedModel(resolved)
    }
  }, [availableModels, selectedModel])

  const selectedModelInfo = useMemo(() => {
    const selected = splitModelValue(selectedModel)
    const exactMatch = availableModels.find(model => model.id === selectedModel)
    if (exactMatch) return exactMatch
    const modelMatch = availableModels.find(model => model.modelId === selected.modelId)
    if (modelMatch) return modelMatch
    return {
      id: selectedModel,
      name: selected.modelId || selectedModel,
      provider: selected.provider || modelProvider || '',
      modelId: selected.modelId || selectedModel,
    }
  }, [availableModels, selectedModel, modelProvider])

  const filteredModelOptions = useMemo(() => {
    const allModels = availableModels.length > 0 ? availableModels : buildStaticModelCatalog()
    if (manualModelProvider === 'all') return allModels
    return allModels.filter(m => m.provider === manualModelProvider)
  }, [availableModels, manualModelProvider])

  const modelOptions = useMemo(() => {
    const fallback = manualModelProvider === 'all'
      ? buildStaticModelCatalog()
      : buildStaticModelCatalog().filter(m => m.provider === manualModelProvider)
    const base = filteredModelOptions.length ? filteredModelOptions : fallback
    return base.some(model => model.id === selectedModelInfo.id)
      ? base
      : [...base, selectedModelInfo]
  }, [filteredModelOptions, selectedModelInfo, manualModelProvider])

  useEffect(() => {
    if (!selectedModelInfo?.modelId) return
    const provider = (selectedModelInfo.provider || 'gemini') as ManualModelProvider
    if (provider === 'gemini' || provider === 'gemini-interactions' || provider === 'fal' || provider === 'elevenlabs') {
      setManualModelProvider(provider)
    }
  }, [selectedModelInfo.id, selectedModelInfo.modelId, selectedModelInfo.provider])

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

  // 3. Force-save conversations to localStorage on unmount (logout/refresh)
  useEffect(() => {
    return () => {
      try {
        const current = localStorage.getItem('apex_conversations_v1')
        if (current) {
          // Already saved by effect #2 on every change - just verify integrity
          JSON.parse(current)
        }
      } catch {}
    }
  }, [])

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
          text: "Sou a Apex AI. Como posso te ajudar?",
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
            text: "Sou a Apex AI. Como posso te ajudar?",
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
          text: "Sou a Apex AI. Como posso te ajudar?",
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
    upgradePlans: activeProject.upgradePlans.length,
    executionRuns: executionRuns.length,
  }), [activeProject, archVisOutput, archVisRevisionConstraints.length, bim3DOutput, directCutOutput, executionRuns.length, messages.length])

  const isSignedIn = accountState?.sessionStatus === 'signed-in'
  const authShellStatus = accountState?.bootstrapStatus || (isSupabaseConfigured ? 'needs-login' : 'local-demo')
  const workspaceAuthReady = accountState?.bootstrapStatus === 'ready'
  const isLocalDemoOwner = !isSupabaseConfigured && localDemoAuthAllowed && workspaceAuthReady
  const isOwnerUser = Boolean(
    isSignedIn
    && workspaceAuthReady
    && (accountState?.role === 'owner_admin' || accountState?.role === 'admin' || accountState?.role === 'developer')
    && (isSupabaseConfigured || isLocalDemoOwner)
  )
  const isInternalUser = isOwnerUser || accountState?.role === 'Internal Team' || accountState?.role === 'Finance' || accountState?.role === 'Sales' || accountState?.user?.email?.includes('apexglobal')

  const currentRole = (() => {
    if (!accountState?.user) return 'owner_admin';
    if (accountState?.user?.email === 'jedgard70@gmail.com') return 'owner_admin';
    return accountState?.role || 'client';
  })();

  async function refreshAuthState() {
    if (!isSupabaseConfigured) {
      const defaultState = localDemoAuthAllowed ? buildLocalDemoOwnerState() : null
      setAccountState(prev => (prev && prev.sessionStatus === 'signed-out') ? prev : defaultState)
      setAuthLoading(false)
      setAuthMessage(localDemoAuthAllowed ? defaultState?.message || '' : 'Supabase is not configured for this build. Rebuild with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return defaultState
    }

    try {
      let state = await loadSupabaseAccountState()
      if (
        state.sessionStatus === 'signed-in'
        && (state.bootstrapStatus === 'needs-profile-bootstrap' || state.bootstrapStatus === 'needs-tenant-assignment')
      ) {
        state = await attemptProfileBootstrap()
      }
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
    setProjectPackageOutput(null)
    setGenerationHistoryOpen(false)
    setMetricsOutput(null)
    setAvatarVoiceOutput(null)
    setAutoupgradeOutput(null)
    setPlatformMapOutput(null)
    setCampaignAutomationOutput(null)
    setStockOutput(false)
    setTripOutput(false)
    setNrOutput(false)
    setAccountingOutput(false)
    setPermitsOutput(false)
    setCopilotExecutionOutput(null)
    setAuthOutput(null)
    setExportCenterOpen(false)
    setDashboardByRoleOutput(false)
    setBimClashOutput(false)
    setQualidadeOutput(false)
    setWorkflowOutput(false)
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
    if (except !== 'cognitiveAgents') setCognitiveAgentsOutput(false)
    if (except !== 'dashboardByRole') setDashboardByRoleOutput(false)
    if (except !== 'bimClash') setBimClashOutput(false)
    if (except !== 'qualidade') setQualidadeOutput(false)
    if (except !== 'workflow') setWorkflowOutput(false)
    if (except !== 'evmScheduler') setEvmSchedulerComplianceOutput(null)
    if (except !== 'supplyChain') setSupplyChainOutput(null)
    if (except !== 'notifications') setNotificationsOutput(null)
    if (except !== 'aiCost') setAiCostOutput(null)
    if (except !== 'multiTenant') setMultiTenantOutput(null)
    if (except !== 'pwaMobile') setPwaMobileOutput(null)
    if (except !== 'digitalTwin') setDigitalTwinOutput(null)
    if (except !== 'knowledgeBase') setKnowledgeBaseOutput(null)
    if (except !== 'projectPackage') setProjectPackageOutput(null)
    if (except !== 'generationHistory') setGenerationHistoryOpen(false)
    if (except !== 'aps') setApsOpen(false)
    if (except !== 'metrics') setMetricsOutput(null)
    if (except !== 'avatarVoice') setAvatarVoiceOutput(null)
    if (except !== 'autoupgrade') setAutoupgradeOutput(null)
    if (except !== 'platformMap') setPlatformMapOutput(null)
    if (except !== 'campaignAutomation') setCampaignAutomationOutput(null)
    if (except !== 'stock') setStockOutput(false)
    if (except !== 'trip') setTripOutput(false)
    if (except !== 'pipeline') setPipelineOutput(false)
    if (except !== 'copilotExecution') setCopilotExecutionOutput(null)
    if (except !== 'auth') setAuthOutput(null)
    if (except !== 'exportCenter') setExportCenterOpen(false)
    if (except !== 'ownerConsole') setOwnerConsoleOpen(false)
  }

  function openOwnerConsole() {
    closeOtherPanels('ownerConsole')
    setOwnerConsoleOpen(true)
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
          duration: '10',
          aspectRatio: '16:9',
          style: 'hyper-real',
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
    if (!isSupabaseConfigured) {
      setAccountState({
        providerStatus: 'supabase-not-configured',
        sessionStatus: 'signed-out',
        user: null,
        profile: null,
        tenant: null,
        role: null,
        permissions: [],
        persistenceMode: 'localStorage',
        bootstrapStatus: 'needs-login',
        message: 'Local demo mode — Signed out.'
      })
      clearProtectedPanels()
      return
    }
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
      setAuthMessage(localDemoAuthAllowed ? 'Local demo mode enabled.' : 'Supabase is not configured for this build.')
      return
    }

    refreshAuthState().then(state => {
      if (mounted && state?.sessionStatus !== 'signed-in') clearProtectedPanels()
    })

    const { client } = getBrowserSupabaseClient()
    const subscription = client?.auth.onAuthStateChange((_event: unknown, session: unknown) => {
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
    const activeStudio: ProjectWorkspace['activeStudio'] = archVisOutput ? 'archvis' : directCutOutput ? 'directcut' : bim3DOutput ? 'bim3d' : budgetOutput ? 'budget' : contractsOutput ? 'contracts' : researchOutput ? 'research' : fieldOpsOutput ? 'fieldops' : businessOutput ? 'business' : projectPackageOutput ? 'project-package' : generationHistoryOpen ? 'generation-history' : apsOpen ? 'aps' : agentsOutput ? 'agents' : cognitiveAgentsOutput ? 'cognitive-agents' : dashboardByRoleOutput ? 'dashboard-by-role' : bimClashOutput ? 'bim-clash' : qualidadeOutput ? 'qualidade' : workflowOutput ? 'workflow' : evmSchedulerComplianceOutput ? 'evm-scheduler-compliance' : supplyChainOutput ? 'supply-chain' : notificationsOutput ? 'notifications' : aiCostOutput ? 'ai-cost' : multiTenantOutput ? 'multi-tenant' : pwaMobileOutput ? 'pwa-mobile' : digitalTwinOutput ? 'digital-twin' : knowledgeBaseOutput ? 'knowledge-base' : metricsOutput ? 'metrics-dashboard' : avatarVoiceOutput ? 'avatar-voice' : autoupgradeOutput ? 'autoupgrade' : platformMapOutput ? 'platform-map' : stockOutput ? 'stock' : tripOutput ? 'trip' : pipelineOutput ? 'pipeline' : campaignAutomationOutput ? 'campaign-automation' : copilotExecutionOutput ? 'copilot-execution' : authOutput ? 'auth' : undefined
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
      projectProfile: activeProject.projectProfile,
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
      upgradePlans: activeProject.upgradePlans,
      executionRuns,
      lastExecutionSummary,
      generationHistory: activeProject.generationHistory,
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
        projectPackageOutput,
        generationHistoryOpen,
        metricsOutput,
        avatarVoiceOutput,
        autoupgradeOutput,
        platformMapOutput,
        campaignAutomationOutput,
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

  function updateProjectProfile(profile: ProjectProfileDraft) {
    const nextProfile = createProjectProfile(profile)
    const saved = upsertProject({
      ...activeProject,
      projectProfile: nextProfile,
    })
    setActiveProject(saved)
    setProjects(loadProjects())
    setWorkspaceSavedAt(new Date().toLocaleTimeString())
    if (nextProfile?.clientName) {
      setClientMemory(prev => {
        const next = {
          ...prev,
          displayName: nextProfile.clientName,
        }
        saveClientMemory(next)
        return next
      })
    }
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
  }, [activeFile, messages, archVisOutput, directCutOutput, bim3DOutput, budgetOutput, contractsOutput, researchOutput, fieldOpsOutput, businessOutput, agentsOutput, evmSchedulerComplianceOutput, supplyChainOutput, notificationsOutput, aiCostOutput, multiTenantOutput, pwaMobileOutput, digitalTwinOutput, knowledgeBaseOutput, projectPackageOutput, generationHistoryOpen, metricsOutput, avatarVoiceOutput, autoupgradeOutput, platformMapOutput, pipelineOutput, campaignAutomationOutput, copilotExecutionOutput, authOutput, archVisRevisionConstraints, activeTool.id, executionRuns, lastExecutionSummary])

  // ── Poll pipeline active count ──
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/pipeline/brief')
        const d = await res.json()
        if (d.brief) setPipelineActiveCount(d.brief.active + d.brief.queued)
      } catch { /* */ }
    }
    poll()
    const iv = setInterval(poll, 5000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const textarea = composerTextarea.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 320)}px`
  }, [input])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: loading ? 'auto' : 'smooth', block: 'end' })
  }, [messages, loading])

  async function askCopilot(text = input, attachment = activeFile) {
    const clean = text.trim()
    if ((!clean && !attachment) || loading) return
    setActiveFile(undefined)
    setInput('')
    const userText = clean || (attachment ? `Uploaded ${attachment.file.name}` : '')
    const panelName = isPanelContextMessage(clean)
    if (panelName) {
      const userMessage: Message = { id: id(), role: 'user', text: userText, attachment }
      const reply = buildPanelContextReply(panelName)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: reply }])
      return
    }
    const modelText = clean || (attachment
      ? attachment.extractedText
        ? `O usuário enviou o arquivo "${attachment.file.name}" (tipo: ${attachment.kind}, extensão: ${attachment.file.name.toLowerCase().split('.').pop() || 'unknown'}). Conteúdo extraído:\n\n${attachment.extractedText}\n\nResponda de forma direta e conversacional com base no conteúdo acima. Não faça relatório nem lista de tópicos.`
        : 'User uploaded this file. Analyze it as project context and continue naturally in a short conversational reply. Do not write a report, heading, observations list, or capabilities list.'
      : '')
    const userMessage: Message = { id: id(), role: 'user', text: userText, attachment }
    if (/^(en|english)$/i.test(clean)) {
      setUiLanguage('EN')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'English mode enabled. Tell me what you want to create, review or fix.' }])
      return
    }
    if (/^(pt|pt-br|portugues|português)$/i.test(clean)) {
      setUiLanguage('PT')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Modo em português ativado. Me diga o que você quer criar, revisar ou corrigir.' }])
      return
    }
    if (attachment && attachment.file.name.toLowerCase().endsWith('.md')) {
      if (!isOwnerUser) {
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'This tool is restricted to workspace owners/admins.' }])
        setInput('')
        return
      }
      setSkillUpdateFile(attachment)
      setActiveFile(undefined)
      const signal = id()
      setSkillUpdateOpenSignal(signal)
      setSkillUpdateAutoAnalyzeSignal(signal)
      const trustedGlobal = isTrustedGlobalSkillSource(attachment.file.name, '', attachment.sourcePath || attachment.file.webkitRelativePath || '')
      setSkillUpdateAutoApplyProjectMemory(!trustedGlobal)
      setSkillUpdateAutoApplyGlobal(trustedGlobal)
      openOwnerConsole()
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: trustedGlobal
            ? `Recebi ${attachment.file.name}. Vou analisar e aplicar como skill global automaticamente no painel Skill Update do Owner Console.`
            : `Recebi ${attachment.file.name}. Vou analisar e incorporar o conteúdo como memória do projeto automaticamente no painel Skill Update do Owner Console.`
        }
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
    const confirmationSignal = /^(sim|ok|pode|confirmo|yes|yep|manda|vai)$/i.test(clean)
    const cancelSignal = /^(nao|não|cancelar|cancela|no|deixa)$/i.test(clean)
    let routingText = clean
    let layerGoalText = clean
    if (pendingLayerDecision && clean) {
      if (confirmationSignal) {
        routingText = pendingLayerDecision.openCommand
        layerGoalText = pendingLayerDecision.goal
        setPendingLayerDecision(null)
      } else if (cancelSignal) {
        setPendingLayerDecision(null)
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Perfeito. Não abri nenhum layer/painel.' }])
        setInput('')
        return
      }
    }
    if (clean && isOwnerConsoleIntent(clean)) {
      if (!isOwnerUser) {
        setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'This tool is restricted to workspace owners/admins.' }])
        setInput('')
        return
      }
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Owner Console / Mission Control. Use as superfícies existentes: Project Workspace, Skill Update, Skill Export, Account e Platform Maintenance.' }])
      openOwnerConsole()
      setInput('')
      return
    }
    if (clean && isPromptLibraryIntent(clean)) {
      const module = getPromptLibraryModule(clean)
      const moduleLabel = module ? ` filtrada para ${module}` : ''
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: `Abri a Biblioteca de Prompts Profissionais${moduleLabel}. Explore as categorias, busque por palavras-chave ou clique em um preset para ver o prompt completo.` }])
      setActivePromptLibraryModule(module || undefined)
      setShowPromptLibrary(true)
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
      openOwnerConsole()
      setInput('')
      return
    }
    // Let natural conversations go to the server, so they are processed by the live AI agent (or fall back to local answers on failure)
    const explicitPanelOpen = Boolean(routingText) && isExplicitPanelOpenRequest(routingText)
    const archVisIntent = isArchVisIntent(routingText, attachment)
    const directCutIntent = isDirectCutIntent(routingText)
    const openArchVisOrDirect = explicitPanelOpen && (archVisIntent || directCutIntent)
    const shouldOpenArchVis = openArchVisOrDirect && archVisIntent
    const shouldOpenDirectCut = openArchVisOrDirect && directCutIntent
    const shouldRenderVideoDirectly = openArchVisOrDirect && directCutIntent && (isDirectVideoNoPanelIntent(routingText) || attachment?.kind === 'image')
    const shouldOpenContracts = explicitPanelOpen && isContractsIntent(routingText)
    const shouldOpenBudget = explicitPanelOpen && isBudgetIntent(routingText)
    const shouldOpenProjectPackage = isProjectPackageIntent(routingText)
    const shouldOpenGenerationHistory = isGenerationHistoryIntent(routingText)
    const shouldOpenResearch = explicitPanelOpen && isResearchIntent(routingText)
    const shouldOpenFieldOps = explicitPanelOpen && isFieldOpsIntent(routingText, attachment)
    const shouldOpenAuth = explicitPanelOpen && isAuthIntent(routingText)
    const shouldOpenBusiness = explicitPanelOpen && isBusinessLayerIntent(routingText)
    const shouldOpenControlsAgents = explicitPanelOpen && isEvmSchedulerComplianceIntent(routingText)
    const shouldOpenSupplyChain = explicitPanelOpen && isSupplyChainIntent(routingText)
    const shouldOpenNotifications = explicitPanelOpen && isNotificationsIntent(routingText)
    const shouldOpenAiCost = explicitPanelOpen && isAiCostIntent(routingText)
    const shouldOpenMultiTenant = explicitPanelOpen && isMultiTenantIntent(routingText)
    const shouldOpenPwaMobile = explicitPanelOpen && isPwaMobileIntent(routingText)
    const shouldOpenDigitalTwin = explicitPanelOpen && isDigitalTwinIntent(routingText)
    const shouldOpenKnowledgeBase = explicitPanelOpen && isKnowledgeBaseIntent(routingText)
    const shouldOpenAps = explicitPanelOpen && /\b(aps|autodesk platform services?|autodesk platform|bim360|acc.*hub|forge.*api|aps.*connector|autodesk.*connector)\b/i.test(routingText)
    const shouldOpenMetrics = explicitPanelOpen && (isMetricsIntent(routingText) || /\b(status da plataforma|status geral da plataforma|painel da plataforma|platform status|status geral|painel geral)\b/i.test(routingText))
    const shouldOpenPlatformMap = explicitPanelOpen && isPlatformMapIntent(routingText)
    const shouldOpenAutoupgrade = explicitPanelOpen && isAutoupgradeIntent(routingText)
    const shouldOpenAvatarVoice = explicitPanelOpen && isAvatarVoiceIntent(routingText)
    const shouldOpenStock = explicitPanelOpen && isStockIntent(routingText)
    const shouldOpenTrip = explicitPanelOpen && isTripIntent(routingText)
    const shouldOpenPipeline = explicitPanelOpen && isPipelineIntent(routingText)
    const shouldOpenNR = explicitPanelOpen && isNRIntent(routingText)
    const shouldOpenAccounting = explicitPanelOpen && isAccountingIntent(routingText)
    const shouldOpenPermits = explicitPanelOpen && isPermitsIntent(routingText)
    const shouldOpenCampaignAutomation = explicitPanelOpen && isCampaignAutomationIntent(routingText)
    const shouldOpenCopilotExecution = explicitPanelOpen && isCopilotExecutionIntent(routingText)
    const shouldOpenAgents = explicitPanelOpen && isAgentIntent(routingText)
    const shouldOpenBim3D = explicitPanelOpen && ((attachment?.kind === 'bim-cad') || explicitPanelOpen) && isBim3DIntent(routingText, attachment)
    const shouldLockRevision = clean && archVisOutput && attachment?.kind === 'image' && isRevisionIntent(clean)
    const shouldTreatAsConversation = clean && isOperationalGovernancePrompt(clean)
    const shouldOpenSkillExport = clean && !shouldTreatAsConversation && (isSkillExportIntent(clean) || isSkillExportFactoryAlias(clean))
    const shouldOpenExportCenter = clean && isExportIntent(clean)
    if (shouldOpenProjectPackage) {
      closeOtherPanels('projectPackage')
      setProjectPackageOutput({
        goal: clean || 'Montar pacote completo do projeto',
        conversationContext: [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`),
      })
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o Project Package Pipeline ao lado. Vou consolidar briefing, orçamento, pesquisa, contratos e cronograma em um pacote único baseado no que já existe no workspace.',
        },
      ])
      setInput('')
      return
    }
    if (shouldOpenGenerationHistory) {
      closeOtherPanels('generationHistory')
      setGenerationHistoryOpen(true)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri a fila e o histórico de gerações ao lado. Lá você acompanha imagens, planos de vídeo e pacotes já gerados neste projeto.',
        },
      ])
      setInput('')
      return
    }
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
      openOwnerConsole()
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
      if (attachment) {
        setSkillUpdateFile(attachment)
        setActiveFile(undefined)
      }
      setSkillUpdateOpenSignal(id())
      openOwnerConsole()
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
      setAuthOutput({ goal: layerGoalText, conversationContext: context })
      if (isOwnerUser) openOwnerConsole()
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
      const focus = inferBusinessFocus(layerGoalText)
      const responseText = focus === 'finance-accounting'
        ? 'Abri o Finance / Accounting layer ao lado. Vou preparar financeiro, contas a receber/pagar e pacote para contador em modo local, sem fingir pagamento, imposto ou compliance.'
        : focus === 'crm-sales'
          ? 'Abri o CRM / Sales layer ao lado. Vou estruturar leads, pipeline, proposta comercial e follow-up em modo local, sem banco de dados real ainda.'
          : focus === 'admin'
            ? 'Abri o SaaS Admin / Client Workspace ao lado. Vou modelar usuários, permissões, planos e dashboards em modo local, sem auth real ainda.'
            : 'Abri a camada SaaS/CRM/Finance ao lado. Tudo está em Local demo mode: sem auth, sem database e sem payment connector.'
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: responseText }])
      setBusinessOutput({ goal: layerGoalText, focus, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenSupplyChain) {
      closeOtherPanels('supplyChain')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Supply Chain / Suppliers Studio ao lado. Vou organizar fornecedores, cotações e compras em modo local, sem fingir preço, disponibilidade ou verificação de fornecedor.' }])
      setSupplyChainOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenNotifications) {
      closeOtherPanels('notifications')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Notifications / Alerts Center ao lado. Estes são alertas locais; conector de push, email ou SMS ainda não está conectado.' }])
      setNotificationsOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenAiCost) {
      closeOtherPanels('aiCost')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o AI Cost Dashboard ao lado. Vou mostrar estimativas locais de uso/custo, sem fingir billing real de provedor.' }])
      setAiCostOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenMultiTenant) {
      closeOtherPanels('multiTenant')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Multi-tenant Readiness ao lado. É planejamento local-first: sem fingir isolamento real de Supabase/auth/RLS.' }])
      setMultiTenantOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenPwaMobile) {
      closeOtherPanels('pwaMobile')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o PWA / Mobile Field Mode ao lado. Vou preparar checklist e fluxo mobile/offline, sem fingir PWA instalado.' }])
      setPwaMobileOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenDigitalTwin) {
      closeOtherPanels('digitalTwin')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Digital Twin UI ao lado. Estado: connected.' }])
      setDigitalTwinOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenKnowledgeBase) {
      closeOtherPanels('knowledgeBase')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri a Knowledge Base ao lado. Vou indexar conhecimento local/projeto sem executar conteúdo e sem marcar global sem aprovação do Owner.' }])
      setKnowledgeBaseOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenStock) {
      closeOtherPanels('stock')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o painel da Bolsa de Valores ao lado. Mostrando cotações ao vivo, watchlist e tendências do mercado.' }])
      setStockOutput(true)
      setInput('')
      return
    }
    if (shouldOpenTrip) {
      closeOtherPanels('trip')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Trip Planner ao lado. Vou ajudar a planejar sua viagem com destino, orçamento e roteiro.' }])
      setTripOutput(true)
      setInput('')
      return
    }
    if (shouldOpenPipeline) {
      closeOtherPanels('pipeline')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Pipeline Status ao lado. Mostrando tarefas em execução, progresso e histórico de geração.' }])
      setPipelineOutput(true)
      setInput('')
      return
    }
    if (shouldOpenNR) {
      closeOtherPanels('nr')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o NR Compliance CREA/OE ao lado. Disponivel: NR-6 EPI, NR-8 Edificacoes, NR-10 Eletrica, NR-12 Maquinas, NR-18 Construcao Civil, NR-20 Inflamaveis, NR-33 Espaco Confinado, NR-35 Altura. Preencha os dados e gere o documento.' }])
      setNrOutput(true)
      setInput('')
      return
    }
    if (shouldOpenAccounting) {
      closeOtherPanels('accounting')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri a Contabilidade CRC ao lado. Disponivel: DRE, IRPJ, obrigacoes fiscais e livro diario com assinatura CRC.' }])
      setAccountingOutput(true)
      setInput('')
      return
    }
    if (shouldOpenPermits) {
      closeOtherPanels('permits')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o American Permits ao lado. Disponivel: 8 tipos de permit americano com checklist, fee estimado e formulario padrao.' }])
      setPermitsOutput(true)
      setInput('')
      return
    }
    if (shouldOpenAps) {
      closeOtherPanels('aps')
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Conector Autodesk Platform Services disponível. Token 2-legged pode ser obtido via API.' }])
      setApsOpen(true)
      setInput('')
      return
    }
    if (shouldOpenMetrics) {
      closeOtherPanels('metrics')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Platform Status ao lado. Ele mostra o estado atual do chat, projeto, endpoints e conectores sem fingir telemetria externa.' }])
      setMetricsOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenPlatformMap) {
      closeOtherPanels('platformMap')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Platform Map ao lado. Ele funciona como manual interativo com os módulos, comandos naturais, status e entregas da Apex.' }])
      setPlatformMapOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenAutoupgrade) {
      closeOtherPanels('autoupgrade')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Autoupgrade Center ao lado. Ele audita a plataforma, monta a fila de melhorias e prepara execução aprovada com segurança.' }])
      setAutoupgradeOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenAvatarVoice) {
      closeOtherPanels('avatarVoice')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Avatar / Voice Pipeline ao lado. Ele organiza fotos, voz, roteiro e pacote de produção com consentimento explícito do owner.' }])
      setAvatarVoiceOutput({ goal: layerGoalText, conversationContext: context })
      setInput('')
      return
    }
    if (shouldOpenCampaignAutomation) {
      closeOtherPanels('campaignAutomation')
      const context = [...messages, userMessage].slice(-8).map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: 'Abri o Campaign Automation ao lado. Ele monta hooks, copies, CTAs, anúncios, storyboard e blueprint de landing VSL dentro da Apex.' }])
      setCampaignAutomationOutput({ goal: layerGoalText, conversationContext: context })
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
      setCopilotExecutionOutput({ goal: layerGoalText, conversationContext: context })
      openOwnerConsole()
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
          text: 'CP11C aberto.',
        },
      ])
      setEvmSchedulerComplianceOutput({ goal: layerGoalText, conversationContext: context })
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
          text: 'Painel de agentes aberto.',
        },
      ])
      setAgentsOutput({ goal: layerGoalText, conversationContext: context })
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
    if (shouldRenderVideoDirectly) {
      setMessages(prev => [...prev, userMessage])
      setInput('')
      setLoading(true)
      setModelRuntimeState('running')
      try {
        const renderConfig = inferDirectCutConfig(clean, attachment)
        const response = await fetch('/api/copilot/video-render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal: layerGoalText || clean,
            prompt: clean,
            duration: renderConfig.duration || '15s',
            aspectRatio: renderConfig.aspectRatio || '16:9',
            sourceImageDataUrl: attachment?.kind === 'image' ? attachment.dataUrl : undefined,
          }),
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok) {
          setModelRuntimeState('ok')
          const resultLine = String(data?.message || `Status: ${data?.providerStatus || 'unknown'}`)
          const videoLine = data?.videoDataUrl ? `\n<video controls src="${String(data.videoDataUrl)}"></video>` : ''
          setMessages(prev => [...prev, { id: id(), role: 'assistant', text: `Render direto concluído sem abrir o DirectCut.\n${resultLine}${videoLine}` }])
        } else {
          setModelRuntimeState('fallback')
          setMessages(prev => [...prev, { id: id(), role: 'assistant', text: String(data?.message || 'Não consegui renderizar o vídeo direto no chat.') }])
        }
      } catch (error) {
        setModelRuntimeState('fallback')
        setMessages(prev => [...prev, { id: id(), role: 'assistant', text: error instanceof Error ? error.message : 'Não consegui renderizar o vídeo direto no chat.' }])
      } finally {
        setLoading(false)
      }
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
          text: 'Abri o DirectCut Studio ao lado com plano de vídeo, roteiro, shot list, prompt ajustável e render híbrido (MediaConvert + fallback FFmpeg).',
        },
      ])
      setDirectCutOutput({
        source: attachment,
        goal: layerGoalText,
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
        goal: layerGoalText,
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
        goal: layerGoalText,
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
        goal: layerGoalText,
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
        goal: layerGoalText,
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
    if (isSupabaseConfigured) {
      getBrowserSupabaseClient().from('chat_history').insert({
        session_id: activeConversationId,
        role: 'user',
        content: userMessage.text
      }).catch(err => console.error('[Apex H5] Error saving user message:', err))
    }
    setInput('')
    setLoading(true)
    setModelRuntimeState('running')
    try {
      const workspaceContext = {
        projectId: activeProject.id,
        projectName: activeProject.name,
        activeStudio: activeProject.activeStudio,
        fileCount: activeProject.files.length,
        projectMemoryCount: activeProject.projectMemory.length,
        projectProfile: activeProject.projectProfile || null,
        recentProjectMemory: activeProject.projectMemory.slice(-3),
        platformMapSummary: createPlatformMapSummary(),
        avatarVoiceSummary: activeProject.exports.some(item => typeof item === 'object' && item && 'type' in item && String((item as { type?: unknown }).type) === 'avatar-voice-plan')
          ? 'Avatar/voice included in project exports with consent-gated workflow.'
          : '',
        campaignAutomationSummary: activeProject.exports.some(item => typeof item === 'object' && item && 'type' in item && String((item as { type?: unknown }).type) === 'campaign-automation-pack')
          ? 'Campaign automation pack exists in project exports with captions, CTAs, storyboard and ad variations.'
          : '',
      }
      const requestBody = JSON.stringify({
        message: modelText,
        model: selectedModel,
        language: navigator.language || 'en',
        identityContext,
        clientMemory,
        workspaceContext,
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
      })

      let response: Response | null = null
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const candidate = await fetch('/api/copilot/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
          })
          response = candidate
          if (candidate.ok || candidate.status < 500 || attempt === 2) break
        } catch {
          if (attempt === 2) throw new Error('Chat runtime unavailable.')
        }
        await new Promise(resolve => window.setTimeout(resolve, 300))
      }
      if (!response) {
        throw new Error('Chat runtime unavailable.')
      }
      const data = await response.json().catch(() => ({}))
      // H5.0D: log response mode so version is visible in browser console
      if (data?.mode) console.log('[Apex H5] response mode:', data.mode)
      if (data?.provider) console.log('[Apex H5] provider:', data.provider)
      const mode = String(data?.mode || '')
      if (mode) setLastResponseMode(mode)
      if (response.ok && !mode.startsWith('local-fallback')) {
        setModelRuntimeState('ok')
      } else {
        setModelRuntimeState('fallback')
      }
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
        if (isSupabaseConfigured) {
          getBrowserSupabaseClient().from('chat_history').insert({
            session_id: activeConversationId,
            role: 'assistant',
            content: reply
          }).catch(err => console.error('[Apex H5] Error saving assistant message:', err))
        }
      }
    } catch (error) {
      setModelRuntimeState('fallback')
      const fallbackText = buildProductFallbackAnswer(userText, identityContext)
      if (fallbackText) {
        setMessages(prev => [...prev, { id: id(), role: 'assistant', text: fallbackText }])
      } else {
        // Tenta novamente com o que tem — não mostra erro genérico
        const retryText = prefersPortuguese(userText)
          ? 'Pode repetir? Nao peguei totalmente. Quer tentar de outro jeito ou so falar o que precisa?'
          : 'Could you repeat that? I did not fully catch it. Want to try a different way or just tell me what you need?'
        setMessages(prev => [...prev, { id: id(), role: 'assistant', text: retryText }])
      }
    } finally {
      setLoading(false)
    }
  }

  const activeFiles = useRef<IntakeFile[]>([])

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

    // Add to active files list
    const currentFiles = activeFiles.current
    if (currentFiles.length === 0) {
      setActiveFile(intake)
    }
    activeFiles.current = [...currentFiles, intake]

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
        duration: '10',
        aspectRatio: '16:9',
        style: 'architectural',
        cameraMovement: 'walkthrough',
      },
    })
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Feito. Enviei o tour BIM para o DirectCut Studio como roteiro técnico, camera path e storyboard pronto.',
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
    setProjectPackageOutput(null)
    setGenerationHistoryOpen(false)
    setMetricsOutput(null)
    setAvatarVoiceOutput(null)
    setAutoupgradeOutput(null)
    setPlatformMapOutput(null)
    setCampaignAutomationOutput(null)
    setStockOutput(false)
    setTripOutput(false)
    setNrOutput(false)
    setAccountingOutput(false)
    setPermitsOutput(false)
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
    setProjectPackageOutput((state.projectPackageOutput as SimpleStudioOutput | null | undefined) || null)
    setGenerationHistoryOpen(Boolean(state.generationHistoryOpen))
    setMetricsOutput((state.metricsOutput as SimpleStudioOutput | null | undefined) || null)
    setAvatarVoiceOutput((state.avatarVoiceOutput as SimpleStudioOutput | null | undefined) || null)
    setAutoupgradeOutput((state.autoupgradeOutput as SimpleStudioOutput | null | undefined) || null)
    setPlatformMapOutput((state.platformMapOutput as SimpleStudioOutput | null | undefined) || null)
    setCampaignAutomationOutput((state.campaignAutomationOutput as SimpleStudioOutput | null | undefined) || null)
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
    setProjectPackageOutput(null)
    setGenerationHistoryOpen(false)
    setMetricsOutput(null)
    setAvatarVoiceOutput(null)
    setAutoupgradeOutput(null)
    setPlatformMapOutput(null)
    setCampaignAutomationOutput(null)
    setStockOutput(false)
    setTripOutput(false)
    setNrOutput(false)
    setAccountingOutput(false)
    setPermitsOutput(false)
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

  function saveProjectWithUpdate(nextProject: ProjectWorkspace) {
    const saved = upsertProject(nextProject)
    setActiveProject(saved)
    setProjects(loadProjects())
    return saved
  }

  function recordGenerationHistory(entry: GenerationHistoryEntry, patch?: Partial<ProjectWorkspace>) {
    const nextHistory = [entry, ...(activeProject.generationHistory || [])].slice(0, 60)
    return saveProjectWithUpdate({
      ...activeProject,
      ...patch,
      generationHistory: nextHistory,
    })
  }

  function handleArchVisGeneration(payload: { sourceName?: string; outputType: string; items: Array<{ id: string; timestamp?: string; prompt: string; imageDataUrl?: string; image?: string; imageUrl?: string; style: string }> }) {
    if (!payload.items.length) return
    recordGenerationHistory({
      id: `archvis-${payload.items[payload.items.length - 1].id}`,
      kind: 'archvis-image',
      title: `ArchVis ${payload.outputType}`,
      sourceName: payload.sourceName,
      createdAt: payload.items[payload.items.length - 1].timestamp || new Date().toISOString(),
      status: 'completed',
      summary: `${payload.items.length} image variation(s) generated from ${payload.sourceName}.`,
      artifactCount: payload.items.length,
      artifacts: payload.items.map(item => `${item.style} · ${item.timestamp}`),
      metadata: {
        outputType: payload.outputType,
        prompts: payload.items.map(item => item.prompt).slice(0, 4),
      },
    }, {
      generatedImages: [...activeProject.generatedImages, ...payload.items],
    })
  }

  function handleDirectCutGeneration(payload: { item: { id: string; modelId?: string; modelLabel?: string; videoUrl?: string; status?: string; startedAt?: string; title?: string; timestamp?: string; sourceMedia?: string; duration?: string; aspectRatio?: string; mode?: string; sceneList?: string[] } }) {
    const { item } = payload
    recordGenerationHistory({
      id: `directcut-${item.id}`,
      kind: 'directcut-plan',
      title: item.title || item.modelLabel || 'DirectCut render',
      sourceName: item.sourceMedia,
      createdAt: item.timestamp || item.startedAt || new Date().toISOString(),
      status: item.status === 'done' ? 'completed' : 'completed',
      summary: `${item.modelLabel || item.modelId || 'fal.ai'} render — ${item.duration || ''}s / ${item.aspectRatio || ''}.`,
      artifactCount: item.videoUrl ? 1 : 0,
      artifacts: item.sceneList || [],
      metadata: {
        duration: item.duration,
        aspectRatio: item.aspectRatio,
        mode: item.mode || item.modelId,
        videoUrl: item.videoUrl,
      },
    }, {
      directCutPlans: [...activeProject.directCutPlans, item],
    })
  }

  function handleExportCenterGeneration(payload: { result: { files: Array<{ filename: string }>; providerStatus?: string }; exportScope: string; format: string; selectedSections: string[] }) {
    recordGenerationHistory({
      id: `export-${Date.now()}`,
      kind: 'export-package',
      title: `Export Center ${payload.format.toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'completed',
      summary: `${payload.result.files.length} export file(s) generated for scope ${payload.exportScope}.`,
      artifactCount: payload.result.files.length,
      artifacts: payload.result.files.map(file => file.filename),
      metadata: {
        exportScope: payload.exportScope,
        format: payload.format,
        selectedSections: payload.selectedSections,
        providerStatus: payload.result.providerStatus,
      },
    })
  }

  function handleProjectPackageGeneration(plan: ProjectPackagePlan) {
    recordGenerationHistory({
      id: `project-package-${Date.now()}`,
      kind: 'project-package',
      title: 'Project Package Pipeline',
      sourceName: activeProject.name,
      createdAt: new Date().toISOString(),
      status: 'completed',
      summary: `Package status ${plan.packageStatus} for ${plan.projectName}.`,
      artifactCount: Array.isArray(plan.artifacts) ? plan.artifacts.length : 0,
      artifacts: Array.isArray(plan.artifacts) ? plan.artifacts.map(item => `${item.title}: ${item.status}`) : [],
      metadata: {
        packageStatus: plan.packageStatus,
        providerStatus: plan.providerStatus,
      },
    })
  }

  function saveBudgetToProject(plan: BudgetPlan) {
    saveProjectWithUpdate({
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
    saveProjectWithUpdate({
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
    saveProjectWithUpdate({
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
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Salvei o plano de pesquisa no Project Workspace local com as fontes e níveis de confiança.',
      },
    ])
  }

  function saveProjectPackageToProject(plan: ProjectPackagePlan) {
    saveProjectWithUpdate({
      ...activeProject,
      exports: [
        ...activeProject.exports,
        {
          type: 'project-package-pipeline',
          timestamp: new Date().toISOString(),
          plan,
        },
      ],
    })
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Salvei o pacote completo do projeto no Project Workspace local.',
      },
    ])
  }

  async function saveFieldOpsToProject(plan: FieldOpsPlan, context: FieldRdoContext) {
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
    const remoteResult = await syncFieldOpsPlanRemote({
      project: saved,
      context,
      plan,
      source: fieldOpsOutput?.source,
    })
    const savedMessage = remoteResult.providerStatus === 'synced'
      ? 'Salvei o RDO / Field Operations report no Project Workspace local e sincronizei no Supabase.'
      : remoteResult.providerStatus === 'supabase-not-connected'
        ? 'Salvei o RDO / Field Operations report no Project Workspace local. Supabase ainda não está conectado para persistência remota.'
        : `Salvei o RDO / Field Operations report no Project Workspace local. A sincronização Supabase ficou pendente: ${remoteResult.message}`
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: savedMessage,
      },
    ])
    return savedMessage
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
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o relatório Digital Twin no Project Workspace.' }])
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

  function saveAvatarVoiceToProject(plan: AvatarVoicePlan) {
    const saved = upsertProject({ ...activeProject, exports: [...activeProject.exports, { type: 'avatar-voice-plan', timestamp: new Date().toISOString(), plan }] })
    setActiveProject(saved); setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o plano de avatar/voz no Project Workspace com consentimento e pack de produção.' }])
  }

  function saveCampaignAutomationToProject(plan: CampaignAutomationPlan) {
    const saved = upsertProject({ ...activeProject, exports: [...activeProject.exports, { type: 'campaign-automation-pack', timestamp: new Date().toISOString(), plan }] })
    setActiveProject(saved); setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o pack de campanha no Project Workspace com copies, CTAs, anúncios e storyboard.' }])
  }

  function saveAutoupgradeToProject(plan: AutoupgradePlan) {
    const saved = upsertProject({ ...activeProject, upgradePlans: [plan], exports: [...activeProject.exports, { type: 'autoupgrade-plan', timestamp: new Date().toISOString(), plan }] })
    setActiveProject(saved); setProjects(loadProjects())
    setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Salvei o plano de Autoupgrade no Project Workspace como fila segura de melhoria aprovada.' }])
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
        <button className="secondary-action owner-console-button" type="button" onClick={() => openOwnerConsole()}>
          <Settings size={15} /> {uiLanguage === 'EN' ? 'Owner Console' : 'Console Owner'}
        </button>
      )}
      {isSignedIn && (
        <button className="secondary-action owner-console-button" type="button" onClick={() => {
          setAutoupgradeOutput({ goal: 'Melhorias automáticas da plataforma', conversationContext: ['assistant: Autoupgrade Center aberto manualmente.'] })
          setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Abri o Autoupgrade Center ao lado. Ele audita a plataforma, monta a fila de melhorias e prepara execução aprovada com segurança.' }])
        }}>
          <RefreshCw size={15} /> {uiLanguage === 'EN' ? 'Autoupgrade' : 'Autoupgrade'}
        </button>
      )}
      {isSignedIn && (
        <button className="secondary-action owner-console-button" type="button" onClick={() => {
          closeOtherPanels('pipeline')
          setPipelineOutput(true)
        }} style={{ position: 'relative' }}>
          <Cpu size={15} /> Pipeline
          {pipelineActiveCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#ef4444', color: '#fff',
              fontSize: '9px', fontWeight: 700,
              width: 16, height: 16,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>{pipelineActiveCount}</span>
          )}
        </button>
      )}
      {accountState?.sessionStatus === 'signed-in' && (
        <button className="secondary-action auth-signout" type="button" onClick={signOutFromShell}>
          <LogOut size={15} /> {uiLanguage === 'EN' ? 'Sign out' : 'Sair'}
        </button>
      )}
    </div>
  )
  const isRightPanelSameAsLeft = Boolean(
    (activeView === 'archvis' && archVisOutput) ||
    (activeView === 'directcut' && directCutOutput) ||
    (activeView === 'bim' && bim3DOutput) ||
    (activeView === 'fieldops' && fieldOpsOutput) ||
    (activeView === 'budget' && budgetOutput) ||
    (activeView === 'contracts' && contractsOutput) ||
    (activeView === 'research' && researchOutput) ||
    (activeView === 'finance' && (accountingOutput || aiCostOutput)) ||
    (activeView === 'marketing' && campaignAutomationOutput) ||
    (activeView === 'crm' && pipelineOutput)
  )

  const hasOperationalPanel = Boolean(
    archVisOutput || directCutOutput || bim3DOutput || budgetOutput || contractsOutput || researchOutput || fieldOpsOutput || businessOutput || agentsOutput || cognitiveAgentsOutput || dashboardByRoleOutput || bimClashOutput || qualidadeOutput || workflowOutput || evmSchedulerComplianceOutput || supplyChainOutput || notificationsOutput || aiCostOutput || multiTenantOutput || pwaMobileOutput || digitalTwinOutput || knowledgeBaseOutput || projectPackageOutput || generationHistoryOpen || metricsOutput || avatarVoiceOutput || autoupgradeOutput || platformMapOutput || stockOutput || tripOutput || pipelineOutput || nrOutput || accountingOutput || permitsOutput || campaignAutomationOutput || exportCenterOpen
  ) && !isRightPanelSameAsLeft
  const workspaceClass = hasOperationalPanel ? 'studio-open' : ''

  if (isPublicVslRoute) {
    return <PublicVslLandingPage />
  }

  if ((!isSignedIn || authLoading) && !isLocalDemoOwner) {
    return (
      <main
        className="app"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: '#051424',
          backgroundImage: 'radial-gradient(#122131 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        <AuthPanel onAuthStateChange={state => {
          setAccountState(state)
          setAuthMessage(state.message)
          setAuthLoading(false)
        }} />
      </main>
    )
  }

  // Client users see a simplified view
  if (isSignedIn && !isInternalUser) {
    return (
      <div style={{ background: '#0f172a', minHeight: '100vh' }}>
        <ClientDashboard email={accountState?.user?.email || accountState?.profile?.email} onBack={() => {}} />
      </div>
    )
  }

  const handleCommand = (cmd: string) => {
    if (cmd) { setInput(cmd); setTimeout(() => askCopilot(cmd), 50) }
  }

  const [hasTriggeredFridayReport, setHasTriggeredFridayReport] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Friday (5) at 12:00 PM
      if (now.getDay() === 5 && now.getHours() === 12 && !hasTriggeredFridayReport) {
        setHasTriggeredFridayReport(true);
        handleCommand('SYSTEM_EVENT: TRIGGER_FIELDOPS_REPORT');
      }
      // Reset trigger on Saturday
      if (now.getDay() === 6 && hasTriggeredFridayReport) {
        setHasTriggeredFridayReport(false);
      }
    }, 60000); // verify every minute
    return () => clearInterval(timer);
  }, [hasTriggeredFridayReport]);

  useEffect(() => {
    const email = accountState?.user?.email || accountState?.profile?.email;
    if (!email) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/copilot/reminders?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.reminders && data.reminders.length > 0) {
            data.reminders.forEach((rem: any) => {
              handleCommand(`SYSTEM_EVENT: PERSONAL_REMINDER "${rem.text}"`);
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch personal reminders", err);
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [accountState?.user?.email, accountState?.profile?.email]);

  // Render painel ativo no split 80/20
  function renderPanelContent(panelView: string) {
    switch (panelView) {
      case 'navigator': return <PlatformNavigatorPage onNavigate={setActiveView} userRole={currentRole} />;
      case 'governance': return <GovernanceHubPage />;
      case 'training': return <ModelTrainingPage />;
      case 'deployment': return <DeploymentFlowPage />;
      case 'docs': return <TechnicalDocumentationPage />;
      case 'marketing': return <MarketingAnalyticsPage onNewCampaign={() => setCampaignAutomationOutput({ goal: 'Nova campanha', conversationContext: [] })} />;
      case 'archvis': return (
        <ArchVisPanel
          source={archVisOutput?.source || undefined}
          output={archVisOutput?.output || undefined}
          conversationContext={archVisOutput?.conversationContext || undefined}
          revisionConstraints={archVisRevisionConstraints}
          onAddRevisionConstraint={c => setArchVisRevisionConstraints(p => p.includes(c) ? p : [...p, c])}
          onRemoveRevisionConstraint={c => setArchVisRevisionConstraints(p => p.filter(i => i !== c))}
          onClearRevisionConstraints={() => setArchVisRevisionConstraints([])}
          onRecordGeneration={handleArchVisGeneration}
          onSendToDirectCut={img => { closeOtherPanels('directCut'); setDirectCutOutput({ goal: 'Imagem ArchVis p/ DirectCut', conversationContext: [`assistant: Imagem enviada: ${img?.substring(0, 80)}...`], source: archVisOutput?.source || undefined }) }}
          onClear={() => setArchVisOutput(null)}
        />
      );
      case 'directcut': return (
        <DirectCutPanel
          source={directCutOutput?.source || undefined}
          goal={directCutOutput?.goal || 'Planejamento de Vídeo'}
          conversationContext={directCutOutput?.conversationContext || []}
          initialConfig={directCutOutput?.initialConfig}
          onRecordGeneration={handleDirectCutGeneration}
          onClear={() => setDirectCutOutput(null)}
        />
      );
      case 'bim': return bim3DOutput ? (
        <Bim3DPanel source={bim3DOutput.source} onClear={() => setBim3DOutput(null)} />
      ) : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0b1326', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
          <div style={{ textAlign: 'center', maxWidth: 450, background: '#171f33', padding: 32, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#3b82f6' }}>architecture</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>BIM / 3D Studio</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px' }}>
              Carregue modelos 3D diretamente no visualizador Apex. Suporta arquivos nos formatos <strong>.ifc</strong>, <strong>.glb</strong>, <strong>.gltf</strong>, <strong>.obj</strong> ou <strong>.stl</strong>.
            </p>
            <label style={{
              display: 'inline-block', background: '#2563eb', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
            >
              Selecionar Modelo 3D
              <input type="file" accept=".ifc,.glb,.gltf,.obj,.stl" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const mockIntakeFile = { file, name: file.name, size: file.size, type: file.type, kind: 'document' as const };
                  setBim3DOutput({ source: mockIntakeFile });
                }
              }} />
            </label>
          </div>
        </div>
      );
      case 'fieldops': return <FieldOpsPanel goal="" conversationContext={[]} onClear={() => {}} />;
      case 'budget': return <BudgetPanel goal="" conversationContext={[]} onClear={() => {}} />;
      case 'contracts': return <ContractsPanel goal="" conversationContext={[]} onClear={() => {}} />;
      case 'research': return <ResearchPanel goal="" conversationContext={[]} onClear={() => {}} />;
      case 'crm': return <CrmPipelinePanel onClear={() => {}} />;
      case 'finance': return <FinancePanel goal="" conversationContext={[]} onClear={() => {}} />;
      default: return <EmptyPanel />;
    }
  }

  function EmptyPanel() {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: '#c3c6d7', fontSize: 13, background: '#0b1326' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>dashboard</span>
          <p>Selecione um painel na barra lateral</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      activeNav={activeView}
      onNavChange={setActiveView}
      projectName="Apex Platform"
      projectStatus={accountState?.providerStatus === 'supabase-connected' ? 'Live' : 'Ready'}
      providerLeds={providerLedStatuses}
      onProfileClick={() => {
        if (currentRole === 'owner_admin') {
          setActiveView('owner')
        } else {
          setAuthOutput({ goal: 'Open client account', conversationContext: [] })
        }
      }}
      avatarUrl={(accountState as any)?.user?.user_metadata?.avatar_url}
      userRole={currentRole}
    >
      {activeView === 'dashboard' ? (
        currentRole === 'client' ? (
          <div className="h-full" style={{ background: '#0f172a', minHeight: '100vh' }}>
            <ClientDashboard email={accountState?.user?.email} onBack={() => setActiveView('chat')} />
          </div>
        ) : (
          <DashboardPage onNavigate={(view) => {
            if (view === 'owner' && currentRole !== 'owner_admin') {
              setAuthOutput({ goal: 'Open client account', conversationContext: [] })
            } else {
              setActiveView(view)
            }
          }} />
        )
      ) : activeView === 'client-dashboard' ? (
        <div className="h-full" style={{ background: '#0f172a', minHeight: '100vh' }}>
          <ClientDashboard email={accountState?.user?.email} onBack={() => setActiveView('chat')} />
        </div>
      ) : activeView === 'owner' ? (
        <OwnerPage onNavigate={setActiveView} onOpenChat={handleCommand} />
      ) : activeView === 'provider-detail' ? (
        <ProviderDetailPanel onClear={() => setActiveView('dashboard')} />
      ) : (
        // ── Split 70/30 — Painel + Chat lado a lado ──
        <div className="h-full" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden', height: '100%' }}>
          {/* Panel — hidden on mobile, 70% on desktop */}
          {activeView !== 'chat' && activeView !== 'client-dashboard' && !hasOperationalPanel && (
          <section className={isMobile ? 'fixed inset-0 z-[60] bg-[#0f172a] overflow-auto' : ''} style={{ flex: isMobile ? undefined : '1 1 70%', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
            {isMobile && (
              <div style={{ padding: '12px', background: '#1e293b', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button onClick={() => setActiveView('chat')} style={{ background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                  Voltar ao Chat
                </button>
              </div>
            )}
            {renderPanelContent(activeView)}
          </section>
          )}
          {/* Chat — 30% when panel open, 100% when chat-only mode, support mobile */}
          {(activeView === 'chat' || !isMobile || hasOperationalPanel) && (
          <section className="chat-shell" aria-label="Apex AI Copilot chat" style={{ flex: (activeView === 'chat' && !hasOperationalPanel) ? '1 1 100%' : '0 0 30%', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0, borderLeft: (activeView === 'chat' && !hasOperationalPanel) ? 'none' : '1px solid rgba(150, 164, 195, 0.15)' }}>
            {/* ── Top Bar: Actions ── */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(150, 164, 195, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#121a2f', flexShrink: 0, minHeight: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={14} style={{ color: '#60a5fa' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
                  {currentRole === 'client' ? 'Apex AI Personal Assistant' : 'Apex AI Copilot'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={handleNewChat} title="Nova conversa"
                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Plus size={10} /> Novo
                </button>
                <button type="button" onClick={() => setShowPromptLibrary(p => !p)} title={showPromptLibrary ? 'Conversas' : 'Prompts'}
                  style={{ background: showPromptLibrary ? '#8b5cf6' : '#1f2937', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <BookOpen size={10} /> {showPromptLibrary ? 'Chat' : 'Prompts'}
                </button>
              </div>
            </div>

            {/* ── Prompt Library or Messages ── */}
            {showPromptLibrary ? (
              <div style={{ flex: 1, overflow: 'auto', background: '#0f172a' }}>
                <ProfessionalPromptPanel
                  onClear={() => { setShowPromptLibrary(false); setActivePromptLibraryModule(undefined) }}
                  initialModule={activePromptLibraryModule}
                  onSelectPrompt={(promptText) => {
                    setInput(promptText);
                    setShowPromptLibrary(false);
                  }}
                />
              </div>
            ) : (
          <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, position: 'relative', height: '100%', overflow: 'hidden' }}>
            <div className="messages" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
              {messages.map(message => (
                <article key={message.id} className={`message ${message.role}`}>
                  <div className="avatar">{message.role === 'assistant' ? <Bot size={18} /> : <Building2 size={18} />}</div>
                  <div className={`bubble ${message.text.length > 900 || message.text.includes('\n') ? 'long-text' : ''}`}>
                    <div className="message-body">{renderMessageText(message.text)}</div>
                    <div className="message-actions" style={{ display: 'flex', gap: '6px', marginTop: '10px', opacity: 0.6 }}>
                      <button
                        onClick={() => copyToClipboard(message.text)}
                        title="Copiar mensagem"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: 'transparent', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', color: 'inherit', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Copy size={13} />
                        Copiar
                      </button>
                      <button
                        onClick={() => shareMessage(message.text)}
                        title="Compartilhar mensagem"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: 'transparent', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', color: 'inherit', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Share2 size={13} />
                        {'Compartilhar'}
                      </button>
                      <button
                        onClick={() => speakMessage(message.text, message.id)}
                        title={isSpeaking() ? 'Parar leitura' : 'Ouvir mensagem'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: 'transparent', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', color: 'inherit', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Volume2 size={13} />
                        {'Ouvir'}
                      </button>
                      <button
                        onClick={() => downloadConversation(messages)}
                        title="Exportar conversa como .md"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: 'transparent', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', color: 'inherit', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Download size={13} />
                        {'Derivar'}
                      </button>
                    </div>
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
              <div className="composer-card" style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '920px',
                margin: '0 auto',
                border: isComposerFocused ? '1px solid #2563eb' : '1px solid #dfe5ee',
                borderRadius: '16px',
                padding: '8px 12px 12px 12px',
                background: '#ffffff',
                boxShadow: isComposerFocused ? '0 4px 12px rgba(37, 99, 235, 0.08), 0 0 0 2px rgba(37, 99, 235, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease-in-out'
              }}>
                {/* Textarea Row */}
                <div style={{ display: 'flex', width: '100%' }}>
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
                    onFocus={() => setIsComposerFocused(true)}
                    onBlur={() => setIsComposerFocused(false)}
                    onPaste={handlePaste}
                    placeholder={
                      activeFile
                        ? `Ask about ${activeFile.file.name}...`
                        : uiLanguage === 'EN'
                          ? 'Type a message, run a command, or drag and drop files...'
                          : 'Escreva uma mensagem, execute um comando ou arraste arquivos...'
                    }
                    rows={1}
                    style={{
                      width: '100%',
                      minHeight: '40px',
                      maxHeight: '220px',
                      border: '0',
                      resize: 'none',
                      padding: '8px 0px',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  />
                </div>

                {/* Bottom Actions Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(15, 23, 42, 0.05)'
                }}>
                  {/* Left side actions: Attachment & Language */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => fileInput.current?.click()} 
                      title={uiLanguage === 'EN' ? 'Attach file' : 'Anexar arquivo'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        border: 'none',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      <Paperclip size={16} />
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setUiLanguage(current => current === 'EN' ? 'PT' : 'EN')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '16px',
                        background: '#f1f5f9',
                        border: 'none',
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                    >
                      {uiLanguage}
                    </button>
                  </div>

                  {/* Right side actions: Model dropdown, Mic/Voice, Send */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Model dropdown button integrated */}
                    {currentRole !== 'client' && (
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            height: '32px',
                            padding: '0 12px',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '16px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            outline: 'none',
                            maxWidth: '220px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                        >
                          {selectedModelInfo.provider === 'gemini' || selectedModelInfo.provider === 'gemini-interactions' ? (
                            <Sparkles size={12} style={{ color: '#2563eb' }} />
                          ) : selectedModelInfo.provider === 'fal' ? (
                            <Cpu size={12} style={{ color: '#d97706' }} />
                          ) : selectedModelInfo.provider === 'elevenlabs' ? (
                            <Volume2 size={12} style={{ color: '#059669' }} />
                          ) : (
                            <Bot size={12} style={{ color: '#7c3aed' }} />
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {selectedModelInfo.name || selectedModelInfo.modelId}
                          </span>
                          <ChevronDown size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                        </button>

                        {modelDropdownOpen && (
                          <>
                            <div 
                              onClick={() => setModelDropdownOpen(false)} 
                              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 0,
                                width: 320,
                                marginBottom: 8,
                                background: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 8,
                                boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.5), 0 -8px 10px -6px rgba(0, 0, 0, 0.5)',
                                zIndex: 1000,
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: 300,
                                overflow: 'hidden'
                              }}
                            >
                              {/* Search box inside model dropdown */}
                              <div style={{ padding: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Search size={11} style={{ opacity: 0.5, marginLeft: 4 }} />
                                <input
                                  type="text"
                                  placeholder="Buscar modelo..."
                                  value={modelSearchQuery}
                                  onChange={e => setModelSearchQuery(e.target.value)}
                                  style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: 10,
                                    outline: 'none',
                                    padding: '4px 0'
                                  }}
                                />
                                {modelSearchQuery && (
                                  <button 
                                    onClick={() => setModelSearchQuery('')}
                                    style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', display: 'flex', padding: 2 }}
                                  >
                                    <X size={9} />
                                  </button>
                                )}
                              </div>

                              {/* Provider Tabs inside model dropdown */}
                              <div style={{ display: 'flex', padding: '4px 8px', gap: 4, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(0, 0, 0, 0.2)' }}>
                                {[
                                  { id: 'all', label: 'Todos' },
                                  { id: 'gemini', label: 'Gemini' },
                                  { id: 'gemini-interactions', label: 'Interact' },
                                  { id: 'fal', label: 'FAL' },
                                  { id: 'elevenlabs', label: 'Eleven' }
                                ].map(prov => (
                                  <button
                                    key={prov.id}
                                    type="button"
                                    onClick={() => setManualModelProvider(prov.id as ManualModelProvider)}
                                    style={{
                                      background: manualModelProvider === prov.id ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                                      color: manualModelProvider === prov.id ? '#60a5fa' : '#94a3b8',
                                      border: 'none',
                                      borderRadius: 4,
                                      padding: '3px 6px',
                                      fontSize: 8,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {prov.label}
                                  </button>
                                ))}
                              </div>

                              {/* Model lists with scrolling */}
                              <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                                {(() => {
                                  const query = modelSearchQuery.toLowerCase();
                                  const filtered = modelOptions.filter(m => 
                                    m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query)
                                  );
                                  
                                  if (filtered.length === 0) {
                                    return (
                                      <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
                                        Nenhum modelo encontrado.
                                      </div>
                                    );
                                  }

                                  const groups: Record<string, ModelOption[]> = {};
                                  filtered.forEach(m => {
                                    const p = m.provider || 'other';
                                    if (!groups[p]) groups[p] = [];
                                    groups[p].push(m);
                                  });

                                  return Object.entries(groups).map(([prov, models]) => (
                                    <div key={prov} style={{ marginBottom: 8 }}>
                                      <div style={{ 
                                        padding: '4px 12px', 
                                        fontSize: 8, 
                                        fontWeight: 700, 
                                        color: '#64748b', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '0.05em' 
                                      }}>
                                        {getProviderLabel(prov)}
                                      </div>
                                      {models.map(m => {
                                        const isSelected = selectedModel === m.id;
                                        return (
                                          <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => {
                                              setSelectedModel(m.id);
                                              try { localStorage.setItem('apex_selected_model', m.id) } catch {}
                                              setModelDropdownOpen(false);
                                            }}
                                            style={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              width: '100%',
                                              padding: '6px 12px',
                                              background: isSelected ? 'rgba(96, 165, 250, 0.08)' : 'transparent',
                                              border: 'none',
                                              color: isSelected ? '#60a5fa' : '#f1f5f9',
                                              textAlign: 'left',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => {
                                              if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                            }}
                                            onMouseLeave={e => {
                                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                                            }}
                                          >
                                            <span style={{ fontSize: 10, fontWeight: isSelected ? 700 : 500 }}>
                                              {m.name || m.modelId}
                                            </span>
                                            <span style={{ fontSize: 8, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {m.modelId}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Microphone / Speech recognition button */}
                    <button 
                      type="button" 
                      onClick={toggleSpeechRecognition} 
                      aria-label={uiLanguage === 'EN' ? 'Voice input' : 'Entrada por voz'} 
                      title={uiLanguage === 'EN' ? 'Voice input' : 'Entrada por voz'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isRecording ? '#ef4444' : '#f1f5f9',
                        border: 'none',
                        color: isRecording ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = isRecording ? '#dc2626' : '#e2e8f0'}
                      onMouseLeave={e => e.currentTarget.style.background = isRecording ? '#ef4444' : '#f1f5f9'}
                    >
                      <Mic size={16} />
                    </button>

                    {/* Send Button */}
                    <button 
                      onClick={() => askCopilot()} 
                      aria-label={loading ? 'Stop' : 'Send message'} 
                      disabled={!loading && !input.trim() && !activeFile}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: (!loading && !input.trim() && !activeFile) ? '#cbd5e1' : '#2563eb',
                        border: 'none',
                        color: '#ffffff',
                        cursor: (!loading && !input.trim() && !activeFile) ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => {
                        if (!(!loading && !input.trim() && !activeFile)) {
                          e.currentTarget.style.background = '#1d4ed8';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!(!loading && !input.trim() && !activeFile)) {
                          e.currentTarget.style.background = '#2563eb';
                        }
                      }}
                    >
                      {loading ? <Square size={14} /> : <ArrowUp size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              {loading && (
                <div className="model-working-inline">
                  <span className="runtime-dot" />
                  {uiLanguage === 'EN' ? 'Model is processing your request...' : 'Modelo está processando sua solicitação...'}
                </div>
              )}
              {voiceNotice && (
                <div className="voice-notice">{voiceStatus}</div>
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
              multiple
              hidden
              onChange={event => {
                const files = event.target.files
                if (files?.length) {
                  for (let i = 0; i < Math.min(files.length, 20); i++) {
                    const f = files[i];
                    (async () => { await handleFile(f); })();
                  }
                }
                event.currentTarget.value = ''
              }}
            />
            {debugEnabled && (
              <div className="debug-panel" aria-label="Debug mode">
                Debug mode is enabled. Internal prompt and memory details remain server-side and are hidden from the end-user experience.
              </div>
            )}
          </div>
          )}
        </section>
        )}

        {hasOperationalPanel && (
        <aside className={`right-panel ${isMobile ? 'fixed inset-0 z-[60] bg-[#0f172a]' : ''}`} aria-label="Active Apex tool" style={{ flex: isMobile ? undefined : '1 1 65%', minWidth: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {isMobile && (
            <div style={{ padding: '12px', background: '#1e293b', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => closeOtherPanels('none')} style={{ background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                Voltar ao Chat
              </button>
            </div>
          )}
          {archVisOutput && (
            <ArchVisPanel
              source={archVisOutput.source}
              output={archVisOutput.output}
              conversationContext={archVisOutput.conversationContext}
              revisionConstraints={archVisRevisionConstraints}
              onAddRevisionConstraint={constraint => setArchVisRevisionConstraints(prev => prev.includes(constraint) ? prev : [...prev, constraint])}
              onRemoveRevisionConstraint={constraint => setArchVisRevisionConstraints(prev => prev.filter(item => item !== constraint))}
              onClearRevisionConstraints={() => setArchVisRevisionConstraints([])}
              onRecordGeneration={handleArchVisGeneration}
              onSendToDirectCut={imageUrl => {
                closeOtherPanels('directCut')
                setDirectCutOutput({
                  goal: 'Imagem gerada no ArchVis enviada para o DirectCut',
                  conversationContext: [`assistant: Imagem do ArchVis enviada para o DirectCut: ${imageUrl?.substring(0, 80)}...`],
                  source: archVisOutput.source || undefined,
                })
              }}
              onClear={() => setArchVisOutput(null)}
            />
          )}
          {directCutOutput && (
            <DirectCutPanel
              source={directCutOutput.source}
              goal={directCutOutput.goal}
              conversationContext={directCutOutput.conversationContext}
              initialConfig={directCutOutput.initialConfig}
              onRecordGeneration={handleDirectCutGeneration}
              onClear={() => setDirectCutOutput(null)}
            />
          )}
          {avatarVoiceOutput && (
            <AvatarVoicePanel
              goal={avatarVoiceOutput.goal}
              conversationContext={avatarVoiceOutput.conversationContext}
              onSaveToProject={saveAvatarVoiceToProject}
              onClear={() => setAvatarVoiceOutput(null)}
            />
          )}

          {autoupgradeOutput && (
            <AutoupgradePanel
              goal={autoupgradeOutput.goal}
              conversationContext={autoupgradeOutput.conversationContext}
              project={buildProjectSnapshot()}
              runtimeSummary={{
                selectedModel: selectedModelInfo.name || selectedModel,
                modelState: loading ? 'running' : modelRuntimeState,
                lastResponseMode: lastResponseMode || 'n/a',
                persistenceMode: signedInPersistence,
              }}
              isOwnerAdmin={isOwnerUser}
              onSaveToProject={saveAutoupgradeToProject}
              onOpenExecution={recommendation => {
                if (!isOwnerUser) {
                  setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Autoupgrade pode sugerir execução, mas apenas Owner/Admin pode abrir a fila de execução aprovada.' }])
                  return
                }
                closeOtherPanels('copilotExecution')
                setCopilotExecutionOutput({
                  goal: recommendation.suggestedCommand || recommendation.title,
                  conversationContext: [
                    `assistant: Approved autoupgrade handoff`,
                    `assistant: ${recommendation.title}`,
                    `assistant: ${recommendation.action}`,
                  ],
                })
                setMessages(prev => [...prev, { id: id(), role: 'assistant', text: `Enviei "${recommendation.title}" para a área de execução aprovada.` }])
              }}
              onExecuteRecommendation={async recommendation => {
                if (!isOwnerUser || !recommendation.commandId) {
                  setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Somente Owner/Admin pode executar ações aprovadas do Autoupgrade.' }])
                  return
                }
                try {
                  const response = await fetch('/api/copilot/execution/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      commandId: recommendation.commandId,
                      note: `Autoupgrade approved action: ${recommendation.title}`,
                    }),
                  })
                  const data = await response.json().catch(() => ({}))
                  if (!response.ok || !data.result) throw new Error(data.error || 'Autoupgrade execution failed.')
                  const result = data.result as CopilotExecutionResult
                  setExecutionRuns(prev => [result, ...prev].slice(0, 12))
                  setLastExecutionSummary({
                    commandId: result.commandId,
                    status: result.status,
                    exitCode: result.exitCode,
                    finishedAt: result.finishedAt,
                    durationMs: result.durationMs,
                  })
                  openOwnerConsole()
                  setCopilotExecutionOutput({
                    goal: recommendation.title,
                    conversationContext: [
                      `assistant: Autoupgrade executed`,
                      `assistant: ${recommendation.title}`,
                    ],
                  })
                  setMessages(prev => [...prev, { id: id(), role: 'assistant', text: `Executei a ação aprovada "${recommendation.title}" e registrei o resultado no Owner Console.` }])
                } catch (error) {
                  setMessages(prev => [...prev, { id: id(), role: 'assistant', text: error instanceof Error ? error.message : 'Autoupgrade execution failed.' }])
                }
              }}
              onClear={() => setAutoupgradeOutput(null)}
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
                    duration: '10',
                    aspectRatio: '16:9',
                    style: 'hyper-real',
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
                    duration: '10',
                    aspectRatio: '16:9',
                    style: 'documentary',
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
              project={buildProjectSnapshot()}
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

          {projectPackageOutput && (
            <ProjectPackagePanel
              project={buildProjectSnapshot()}
              goal={projectPackageOutput.goal}
              conversationContext={projectPackageOutput.conversationContext}
              onSaveToProject={saveProjectPackageToProject}
              onRecordGeneration={handleProjectPackageGeneration}
              onClear={() => setProjectPackageOutput(null)}
            />
          )}

          {generationHistoryOpen && (
            <GenerationHistoryPanel
              project={buildProjectSnapshot()}
              onClear={() => setGenerationHistoryOpen(false)}
            />
          )}

          {metricsOutput && (
            <MetricsDashboardPanel
              goal={metricsOutput.goal}
              conversationContext={metricsOutput.conversationContext}
              project={buildProjectSnapshot()}
              runtimeSummary={{
                selectedModel: selectedModelInfo.name || selectedModel,
                modelState: loading ? 'running' : modelRuntimeState,
                lastResponseMode: lastResponseMode || 'n/a',
                persistenceMode: signedInPersistence,
              }}
              onSaveToProject={saveMetricsToProject}
              onClear={() => setMetricsOutput(null)}
            />
          )}

          {platformMapOutput && (
            <PlatformMapPanel
              onClear={() => setPlatformMapOutput(null)}
            />
          )}

          {campaignAutomationOutput && (
            <CampaignAutomationPanel
              goal={campaignAutomationOutput.goal}
              conversationContext={campaignAutomationOutput.conversationContext}
              onSaveToProject={saveCampaignAutomationToProject}
              onSendToDirectCut={summary => {
                closeOtherPanels('directCut')
                setDirectCutOutput({
                  goal: summary,
                  conversationContext: [`assistant: ${summary}`],
                  initialConfig: {
                    duration: '10',
                    aspectRatio: '9:16',
                    style: 'hyper-real',
                    cameraMovement: 'dolly-in',
                  },
                })
                setMessages(prev => [...prev, { id: id(), role: 'assistant', text: 'Enviei o pack de campanha para o DirectCut Studio como base de vídeo curto para redes sociais.' }])
              }}
              onClear={() => setCampaignAutomationOutput(null)}
            />
          )}

          {copilotExecutionOutput && (
            null
          )}

          {authOutput && (
            null
          )}

          {apsOpen && (
            <ApsPanel onClear={() => setApsOpen(false)} />
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

          {cognitiveAgentsOutput && (
            <CognitiveAgentsPanel onClear={() => setCognitiveAgentsOutput(false)} />
          )}

          {dashboardByRoleOutput && (
            <DashboardByRolePanel onClear={() => setDashboardByRoleOutput(false)} />
          )}

          {bimClashOutput && (
            <BimClashPanel onClear={() => setBimClashOutput(false)} />
          )}

          {qualidadeOutput && (
            <QualidadeNCIsPanel onClear={() => setQualidadeOutput(false)} />
          )}

          {workflowOutput && (
            <WorkflowTasksPanel onClear={() => setWorkflowOutput(false)} />
          )}

          {exportCenterOpen && (
            <ExportCenterPanel
              project={buildProjectSnapshot()}
              onRecordExport={handleExportCenterGeneration}
              onClear={() => setExportCenterOpen(false)}
            />
          )}

          {pipelineOutput && (
            <PipelineProgressPanel onClear={() => setPipelineOutput(false)} />
          )}

        </aside>
        )}

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
              <span>Auth mode: {accountState?.providerStatus === 'supabase-not-configured' ? 'local demo' : 'supabase'}</span>
            </div>
            <div className="owner-console-actions" style={{ marginBottom: 0 }}>
              <button type="button" onClick={() => { setPlatformMapOutput({ goal: 'status das keys', conversationContext: [] }); setOwnerConsoleOpen(false) }}>
                <Activity size={16} /> Status das Keys / Provedores
              </button>
              <button type="button" onClick={() => { setStockOutput(true); setOwnerConsoleOpen(false) }}>Bolsa de Valores</button>
              <button type="button" onClick={() => { setTripOutput(true); setOwnerConsoleOpen(false) }}>Trip Planner</button>
              <button type="button" onClick={() => { setNrOutput(true); setOwnerConsoleOpen(false) }}>NR CREA/OE</button>
              <button type="button" onClick={() => { setAccountingOutput(true); setOwnerConsoleOpen(false) }}>Contabilidade CRC</button>
              <button type="button" onClick={() => { setPermitsOutput(true); setOwnerConsoleOpen(false) }}>American Permits</button>
              <button type="button" onClick={() => { setNrOutput(true); setOwnerConsoleOpen(false) }}>NR CREA/OE</button>
              <button type="button" onClick={() => { setAccountingOutput(true); setOwnerConsoleOpen(false) }}>Contabilidade CRC</button>
              <button type="button" onClick={() => { setPermitsOutput(true); setOwnerConsoleOpen(false) }}>American Permits</button>
              <button type="button" onClick={() => { setPlatformMapOutput({ goal: 'mapa da plataforma', conversationContext: [] }); setOwnerConsoleOpen(false) }}>
                <Compass size={16} /> Mapa da Plataforma
              </button>
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
              onUpdateProfile={updateProjectProfile}
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
             source={skillUpdateFile}
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
      </div>
      )}
    </AppLayout>
  )
}


import { Auth0Provider } from '@auth0/auth0-react';
const _AUTH0_DOMAIN = (import.meta.env.VITE_AUTH0_DOMAIN || 'icfg-6yanelekncpdkv3rpxy4t1am.us.auth0.com');
const _AUTH0_CLIENT_ID = (import.meta.env.VITE_AUTH0_CLIENT_ID || 'Ldyth7MciFnivVvNzg9WZa8PoFd63lfo');
createRoot(document.getElementById('root')!).render(
  <Auth0Provider domain={_AUTH0_DOMAIN} clientId={_AUTH0_CLIENT_ID} authorizationParams={{ redirect_uri: window.location.origin }}>
    <>
      <App />
      <Analytics />
      <SpeedInsights />
    </>
  </Auth0Provider>
)



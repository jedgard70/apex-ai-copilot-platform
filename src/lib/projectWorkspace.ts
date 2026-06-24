import { GenerationHistoryEntry } from './generationHistory'

export type ProjectFileRecord = {
  id: string
  name: string
  type: string
  size: number
  kind: string
  lastModified?: number
  dataUrl?: string
  extractedText?: string
  pageCount?: number
  extractionStatus?: 'idle' | 'extracting' | 'ready' | 'failed'
  extractedAt?: string
  dimensions?: {
    width: number
    height: number
  }
  addedAt: string
}

export type ProjectChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  attachmentFileId?: string
}

export type ProjectProfileDraft = {
  clientName: string
  projectType: string
  brief: string
  styleNotes: string
  brandingNotes: string
  preferredOutputs: string
  lockedConstraints: string
}

export type ProjectProfile = ProjectProfileDraft & {
  updatedAt: string
}

export type ProjectWorkspace = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  language: string
  files: ProjectFileRecord[]
  chatMessages: ProjectChatMessage[]
  archVisOutputs: unknown[]
  directCutPlans: unknown[]
  bim3dItems: unknown[]
  revisionConstraints: string[]
  generatedImages: unknown[]
  savedViews: unknown[]
  tours: unknown[]
  exports: unknown[]
  suppliers: unknown[]
  procurementItems: unknown[]
  alerts: unknown[]
  aiCostRecords: unknown[]
  tenants: unknown[]
  pwaSettings: unknown[]
  digitalTwinItems: unknown[]
  knowledgeItems: unknown[]
  metricsRecords: unknown[]
  upgradePlans: unknown[]
  executionRuns: unknown[]
  lastExecutionSummary?: unknown
  generationHistory: GenerationHistoryEntry[]
  projectMemory: unknown[]
  projectProfile?: ProjectProfile | null
  skillUpdates: unknown[]
  preferences: unknown[]
  activeTool?: string
  activeFileId?: string
  activeStudio?: 'archvis' | 'directcut' | 'bim3d' | 'budget' | 'contracts' | 'research' | 'fieldops' | 'business' | 'project-package' | 'generation-history' | 'aps' | 'agents' | 'cognitive-agents' | 'dashboard-by-role' | 'evm-scheduler-compliance' | 'supply-chain' | 'notifications' | 'ai-cost' | 'multi-tenant' | 'pwa-mobile' | 'digital-twin' | 'knowledge-base' | 'metrics-dashboard' | 'platform-map' | 'autoupgrade' | 'avatar-voice' | 'stock' | 'trip' | 'pipeline' | 'nr' | 'accounting' | 'permits' | 'export-center' | 'campaign-automation' | 'copilot-execution' | 'auth' | null
  appState?: Record<string, unknown>
}

const PROJECTS_KEY = 'apex_project_workspace_projects'
const ACTIVE_PROJECT_KEY = 'apex_project_workspace_active_id'

function now() {
  return new Date().toISOString()
}

function id() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function createEmptyProjectProfileDraft(): ProjectProfileDraft {
  return {
    clientName: '',
    projectType: '',
    brief: '',
    styleNotes: '',
    brandingNotes: '',
    preferredOutputs: '',
    lockedConstraints: '',
  }
}

function normalizeProjectProfileFields(value: unknown): ProjectProfileDraft {
  const source = value && typeof value === 'object' ? value as Partial<ProjectProfileDraft> : {}
  const empty = createEmptyProjectProfileDraft()
  return {
    clientName: String(source.clientName || empty.clientName).trim(),
    projectType: String(source.projectType || empty.projectType).trim(),
    brief: String(source.brief || empty.brief).trim(),
    styleNotes: String(source.styleNotes || empty.styleNotes).trim(),
    brandingNotes: String(source.brandingNotes || empty.brandingNotes).trim(),
    preferredOutputs: String(source.preferredOutputs || empty.preferredOutputs).trim(),
    lockedConstraints: String(source.lockedConstraints || empty.lockedConstraints).trim(),
  }
}

function hasProjectProfileContent(value: ProjectProfileDraft) {
  return Object.values(value).some(field => field.trim())
}

export function projectProfileToDraft(value: ProjectProfile | null | undefined): ProjectProfileDraft {
  return normalizeProjectProfileFields(value)
}

export function createProjectProfile(value: Partial<ProjectProfileDraft> | null | undefined): ProjectProfile | null {
  const normalized = normalizeProjectProfileFields(value)
  if (!hasProjectProfileContent(normalized)) return null
  return {
    ...normalized,
    updatedAt: now(),
  }
}

function validateProjectProfile(value: unknown): ProjectProfile | null {
  const normalized = normalizeProjectProfileFields(value)
  if (!hasProjectProfileContent(normalized)) return null
  const source = value && typeof value === 'object' ? value as Partial<ProjectProfile> : {}
  return {
    ...normalized,
    updatedAt: typeof source.updatedAt === 'string' && source.updatedAt.trim() ? source.updatedAt : now(),
  }
}

export function createProject(name = 'Apex Project'): ProjectWorkspace {
  const createdAt = now()
  return {
    id: id(),
    name,
    createdAt,
    updatedAt: createdAt,
    language: typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en',
    files: [],
    chatMessages: [],
    archVisOutputs: [],
    directCutPlans: [],
    bim3dItems: [],
    revisionConstraints: [],
    generatedImages: [],
    savedViews: [],
    tours: [],
    exports: [],
    suppliers: [],
    procurementItems: [],
    alerts: [],
    aiCostRecords: [],
    tenants: [],
    pwaSettings: [],
    digitalTwinItems: [],
    knowledgeItems: [],
    metricsRecords: [],
    upgradePlans: [],
    executionRuns: [],
    lastExecutionSummary: null,
    generationHistory: [],
    projectMemory: [],
    projectProfile: null,
    skillUpdates: [],
    preferences: [],
    activeStudio: null,
    appState: {},
  }
}

export function validateProjectWorkspace(value: unknown): ProjectWorkspace | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<ProjectWorkspace>
  if (!candidate.id || !candidate.name || !candidate.createdAt) return null
  return {
    ...createProject(candidate.name),
    ...candidate,
    updatedAt: candidate.updatedAt || now(),
    files: Array.isArray(candidate.files) ? candidate.files : [],
    chatMessages: Array.isArray(candidate.chatMessages) ? candidate.chatMessages : [],
    archVisOutputs: Array.isArray(candidate.archVisOutputs) ? candidate.archVisOutputs : [],
    directCutPlans: Array.isArray(candidate.directCutPlans) ? candidate.directCutPlans : [],
    bim3dItems: Array.isArray(candidate.bim3dItems) ? candidate.bim3dItems : [],
    revisionConstraints: Array.isArray(candidate.revisionConstraints) ? candidate.revisionConstraints : [],
    generatedImages: Array.isArray(candidate.generatedImages) ? candidate.generatedImages : [],
    savedViews: Array.isArray(candidate.savedViews) ? candidate.savedViews : [],
    tours: Array.isArray(candidate.tours) ? candidate.tours : [],
    exports: Array.isArray(candidate.exports) ? candidate.exports : [],
    suppliers: Array.isArray(candidate.suppliers) ? candidate.suppliers : [],
    procurementItems: Array.isArray(candidate.procurementItems) ? candidate.procurementItems : [],
    alerts: Array.isArray(candidate.alerts) ? candidate.alerts : [],
    aiCostRecords: Array.isArray(candidate.aiCostRecords) ? candidate.aiCostRecords : [],
    tenants: Array.isArray(candidate.tenants) ? candidate.tenants : [],
    pwaSettings: Array.isArray(candidate.pwaSettings) ? candidate.pwaSettings : [],
    digitalTwinItems: Array.isArray(candidate.digitalTwinItems) ? candidate.digitalTwinItems : [],
    knowledgeItems: Array.isArray(candidate.knowledgeItems) ? candidate.knowledgeItems : [],
    metricsRecords: Array.isArray(candidate.metricsRecords) ? candidate.metricsRecords : [],
    upgradePlans: Array.isArray(candidate.upgradePlans) ? candidate.upgradePlans : [],
    executionRuns: Array.isArray(candidate.executionRuns) ? candidate.executionRuns : [],
    lastExecutionSummary: candidate.lastExecutionSummary || null,
    generationHistory: Array.isArray(candidate.generationHistory) ? candidate.generationHistory as GenerationHistoryEntry[] : [],
    projectMemory: Array.isArray(candidate.projectMemory) ? candidate.projectMemory : [],
    projectProfile: validateProjectProfile(candidate.projectProfile),
    skillUpdates: Array.isArray(candidate.skillUpdates) ? candidate.skillUpdates : [],
    preferences: Array.isArray(candidate.preferences) ? candidate.preferences : [],
    appState: candidate.appState && typeof candidate.appState === 'object' ? candidate.appState : {},
  }
}

export function loadProjects() {
  if (!storageAvailable()) return []
  const parsed = safeParse<unknown[]>(localStorage.getItem(PROJECTS_KEY), [])
  return parsed.map(validateProjectWorkspace).filter((project): project is ProjectWorkspace => Boolean(project))
}

export function saveProjects(projects: ProjectWorkspace[]) {
  if (!storageAvailable()) return
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function getActiveProjectId() {
  if (!storageAvailable()) return ''
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || ''
}

export function setActiveProjectId(projectId: string) {
  if (!storageAvailable()) return
  localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
}

export function loadActiveProject() {
  const projects = loadProjects()
  const activeId = getActiveProjectId()
  return projects.find(project => project.id === activeId) || projects[0] || null
}

export function upsertProject(project: ProjectWorkspace) {
  const projects = loadProjects()
  const nextProject = { ...project, updatedAt: now() }
  const exists = projects.some(item => item.id === project.id)
  const next = exists
    ? projects.map(item => item.id === project.id ? nextProject : item)
    : [...projects, nextProject]
  saveProjects(next)
  setActiveProjectId(project.id)
  return nextProject
}

export function removeAllProjects() {
  if (!storageAvailable()) return
  localStorage.removeItem(PROJECTS_KEY)
  localStorage.removeItem(ACTIVE_PROJECT_KEY)
}

function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets)
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value
    return value
      .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED_OPENAI_KEY]')
      .replace(/ghp_[A-Za-z0-9_]{12,}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/github_pat_[A-Za-z0-9_]{12,}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s,}]+/gi, '$1=[REDACTED]')
      .replace(/\.env\.local/gi, '[REDACTED_ENV_FILE]')
  }

  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/(api[_-]?key|token|secret|password|env)/i.test(key)) return [key, '[REDACTED]']
    return [key, redactSecrets(item)]
  }))
}

export function exportProject(project: ProjectWorkspace) {
  const safeProject = redactSecrets({
    ...project,
    updatedAt: now(),
  })
  return JSON.stringify(safeProject, null, 2)
}

export function importProject(raw: string) {
  const parsed = JSON.parse(raw) as unknown
  const project = validateProjectWorkspace(parsed)
  if (!project) throw new Error('Invalid Apex project JSON.')
  const imported = {
    ...project,
    id: project.id || id(),
    updatedAt: now(),
  }
  upsertProject(imported)
  return imported
}

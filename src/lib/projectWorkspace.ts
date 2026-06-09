export type ProjectFileRecord = {
  id: string
  name: string
  type: string
  size: number
  kind: string
  dataUrl?: string
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
  projectMemory: unknown[]
  skillUpdates: unknown[]
  preferences: unknown[]
  activeTool?: string
  activeFileId?: string
  activeStudio?: 'archvis' | 'directcut' | 'bim3d' | 'budget' | 'contracts' | 'research' | 'fieldops' | 'business' | 'agents' | 'evm-scheduler-compliance' | 'supply-chain' | 'notifications' | 'ai-cost' | 'multi-tenant' | 'pwa-mobile' | 'digital-twin' | 'knowledge-base' | 'metrics-dashboard' | null
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
    projectMemory: [],
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
    projectMemory: Array.isArray(candidate.projectMemory) ? candidate.projectMemory : [],
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

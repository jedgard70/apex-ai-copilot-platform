export type AutoupgradePriority = 'critical' | 'high' | 'medium'
export type AutoupgradeStatus = 'ready-now' | 'needs-connector' | 'planned'

export type AutoupgradeRecommendation = {
  id: string
  title: string
  area: string
  priority: AutoupgradePriority
  status: AutoupgradeStatus
  why: string
  action: string
  suggestedCommand?: string
  commandId?: string
  requiresApproval: boolean
  evidence: string[]
}

export type AutoupgradePlan = {
  providerStatus: string
  generatedAt: string
  cadence: string
  postureSummary: string
  platformSignals: string[]
  safeAutomationRules: string[]
  executionQueue: string[]
  recommendations: AutoupgradeRecommendation[]
  report: string
}

type ProjectSummary = {
  name?: string
  files?: number
  messages?: number
  exports?: number
  activeStudio?: string
  generationHistory?: number
}

type RuntimeSummary = {
  selectedModel?: string
  modelState?: string
  lastResponseMode?: string
  persistenceMode?: string
}

export function isAutoupgradeIntent(text: string) {
  return /\b(autoupgrade|auto upgrade|self upgrade|self-improvement|auto melhorias|analisar upgrades da plataforma|melhorias autom[aá]ticas|auditoria da plataforma|upgrade da plataforma|evoluir a plataforma|pr[oó]ximo m[oó]dulo de melhoria)\b/i.test(text)
}

export function createAutoupgradePlan(goal = '', projectSummary: ProjectSummary = {}, runtimeSummary: RuntimeSummary = {}): AutoupgradePlan {
  const modelState = String(runtimeSummary.modelState || 'ready')
  const lastResponseMode = String(runtimeSummary.lastResponseMode || 'n/a')
  const persistenceMode = String(runtimeSummary.persistenceMode || 'localStorage')
  const modelName = String(runtimeSummary.selectedModel || 'unknown')
  const fileCount = Number(projectSummary.files || 0)
  const exportCount = Number(projectSummary.exports || 0)
  const generationCount = Number(projectSummary.generationHistory || 0)

  const recommendations: AutoupgradeRecommendation[] = [
    {
      id: 'upgrade-observability',
      title: 'Connect observability stack',
      area: 'Platform reliability',
      priority: 'high',
      status: 'needs-connector',
      why: 'Platform Status and runtime health are local/shared only; there is no real external error and performance telemetry connected yet.',
      action: 'Connect Sentry + Vercel logs/analytics + end-to-end checks so the platform can suggest upgrades from real incidents instead of only local evidence.',
      commandId: 'code_analyze',
      requiresApproval: true,
      evidence: [
        `Persistence mode: ${persistenceMode}`,
        `Model state: ${modelState}`,
        'Platform Status currently reports connector gaps instead of live telemetry.',
      ],
    },
    {
      id: 'upgrade-owner-execution',
      title: 'Convert autoupgrade into approved execution queue',
      area: 'Owner operations',
      priority: 'high',
      status: 'ready-now',
      why: 'The platform can inspect itself, but approved execution still needs a cleaner handoff flow for the owner.',
      action: 'Use a reviewed queue that turns approved recommendations into build/test/check runs without exposing unrestricted backend shell.',
      suggestedCommand: 'abrir copilot execution panel',
      commandId: 'build',
      requiresApproval: true,
      evidence: [
        'Owner execution exists with guardrails.',
        'Public unrestricted shell is intentionally not exposed.',
      ],
    },
    {
      id: 'upgrade-remote-files',
      title: 'Persist full remote file blobs',
      area: 'Project persistence',
      priority: 'medium',
      status: 'planned',
      why: 'Remote restore is still metadata-first for files, which limits full recovery of image/BIM-heavy workflows.',
      action: 'Add blob upload/storage references for project files so remote restore can fully reconstruct active workspaces.',
      requiresApproval: true,
      evidence: [
        `Current project files: ${fileCount}`,
        'Remote sync currently preserves file metadata before full blob sync.',
      ],
    },
    {
      id: 'upgrade-provider-validation',
      title: 'Validate model/provider runtime continuously',
      area: 'AI runtime quality',
      priority: modelState === 'fallback' || /fallback/i.test(lastResponseMode) ? 'critical' : 'medium',
      status: 'ready-now',
      why: 'Provider drift or fallback behavior is one of the fastest ways to degrade the user experience.',
      action: 'Run recurring health checks on selected models, track fallback frequency and prioritize connector/provider fixes before adding more features.',
      suggestedCommand: 'status geral da plataforma',
      commandId: 'check_server',
      requiresApproval: false,
      evidence: [
        `Selected model: ${modelName}`,
        `Last response mode: ${lastResponseMode}`,
        `Model state: ${modelState}`,
      ],
    },
    {
      id: 'upgrade-growth-pipelines',
      title: 'Stage next expansion pipelines',
      area: 'Product roadmap',
      priority: 'medium',
      status: generationCount > 0 || exportCount > 0 ? 'ready-now' : 'planned',
      why: 'The foundation is strong enough to start orchestrating higher-value pipelines such as avatar/voice, campaigns and full project delivery.',
      action: 'Sequence the next modules as approved work packages: autoupgrade -> owner execution handoff -> avatar/voice -> campaign automation.',
      commandId: 'skill_audit',
      requiresApproval: true,
      evidence: [
        `Generation history items: ${generationCount}`,
        `Exports created: ${exportCount}`,
        `Active studio: ${String(projectSummary.activeStudio || 'none')}`,
      ],
    },
  ]

  const platformSignals = [
    `Project: ${String(projectSummary.name || 'Apex Project')}`,
    `Model: ${modelName}`,
    `Runtime: ${modelState} / ${lastResponseMode}`,
    `Persistence: ${persistenceMode}`,
    `Files: ${fileCount} · Exports: ${exportCount} · Generations: ${generationCount}`,
  ]

  const safeAutomationRules = [
    'Never execute unrestricted public shell from autoupgrade.',
    'Only queue reviewed changes that the owner can inspect and approve.',
    'Use real telemetry when connected; otherwise label recommendations as local/shared evidence only.',
    'Prefer build/test/check automation before any code-changing automation.',
  ]

  const executionQueue = recommendations
    .filter(item => item.status === 'ready-now')
    .sort((a, b) => ['critical', 'high', 'medium'].indexOf(a.priority) - ['critical', 'high', 'medium'].indexOf(b.priority))
    .map(item => `${item.priority.toUpperCase()} · ${item.title}`)

  const postureSummary = `Autoupgrade is running as a safe recommendation engine for ${goal || 'the Apex platform'}: it can inspect, prioritize and prepare execution, but final mutating steps still require explicit approval.`

  const report = [
    `Autoupgrade report`,
    `Generated: ${new Date().toISOString()}`,
    `Posture: ${postureSummary}`,
    '',
    'Platform signals:',
    ...platformSignals.map(signal => `- ${signal}`),
    '',
    'Priority queue:',
    ...executionQueue.map(item => `- ${item}`),
  ].join('\n')

  return {
    providerStatus: 'LOCAL_SAFE_AUTOGRADE',
    generatedAt: new Date().toISOString(),
    cadence: 'Every 30 minutes while panel is open; owner approval required for execution.',
    postureSummary,
    platformSignals,
    safeAutomationRules,
    executionQueue,
    recommendations,
    report,
  }
}

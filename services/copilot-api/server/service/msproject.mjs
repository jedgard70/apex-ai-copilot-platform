/**
 * server/service/msproject.mjs
 *
 * Core service for MS Project integration.
 * Parses MSPDI XML format (Microsoft Project Data Interchange),
 * syncs tasks, resources, calendars, and baselines.
 *
 * MSPDI is the standard XML format for MS Project interchange.
 * Reference: https://learn.microsoft.com/en-us/office-project/xml-data-interchange-schema
 */

import { XMLParser } from 'fast-xml-parser'

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} MspTask
 * @property {string}  uid          - Unique ID in MS Project
 * @property {string}  id           - Outline number / WBS
 * @property {string}  name         - Task name
 * @property {number}  duration     - Duration in minutes
 * @property {string}  [start]      - ISO start date
 * @property {string}  [finish]     - ISO finish date
 * @property {number}  [percentComplete]
 * @property {string}  [wbs]        - WBS code
 * @property {number}  [outlineLevel]
 * @property {string[]} predecessors - Predecessor task UIDs
 * @property {number}  [baselineDuration]
 * @property {number}  [baselineCost]
 * @property {number}  [actualCost]
 * @property {number}  [actualDuration]
 * @property {string}  [status]     - 'complete' | 'on-schedule' | 'delayed' | 'not-started'
 */

/**
 * @typedef {Object} MspResource
 * @property {string} uid
 * @property {string} name
 * @property {string} [type]     - 'work' | 'material' | 'cost'
 * @property {number} [maxUnits]
 * @property {number} [standardRate]
 * @property {number} [overtimeRate]
 * @property {number} [costPerUse]
 * @property {string} [email]
 * @property {string} [group]
 */

/**
 * @typedef {Object} MspCalendar
 * @property {string} uid
 * @property {string} name
 * @property {boolean} isBaseCalendar
 * @property {Array}  [weekDays]
 */

/**
 * @typedef {Object} MspProject
 * @property {string}      name
 * @property {string}      [startDate]
 * @property {string}      [finishDate]
 * @property {string}      [statusDate]
 * @property {MspTask[]}   tasks
 * @property {MspResource[]} resources
 * @property {MspCalendar[]} calendars
 * @property {number}      [baselineDuration]
 * @property {number}      [baselineCost]
 * @property {number}      [actualDuration]
 * @property {number}      [actualCost]
 * @property {number}      [durationVariance]
 * @property {number}      [costVariance]
 * @property {Date}        parsedAt
 */

// ─── Parser ──────────────────────────────────────────────────────────────────

const xmlOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) =>
    ['Task', 'Resource', 'Calendar', 'ExtendedAttribute', 'PredecessorLink',
     'Baseline', 'TimephasedData', 'WeekDay', 'Exception', 'WorkWeek',
     'Assignment'].includes(name),
}

/**
 * Parse MSPDI XML string into a structured MspProject object.
 * @param {string} xml - The raw MSPDI XML content
 * @param {Object} [options]
 * @param {boolean} [options.includeCalendars=true]
 * @param {boolean} [options.includeResources=true]
 * @returns {MspProject}
 */
export function parseMsProjectXml(xml, options = {}) {
  const { includeCalendars = true, includeResources = true } = options
  const parser = new XMLParser(xmlOptions)
  const doc = parser.parse(xml)

  const project = doc?.Project || doc?.project || {}

  // ── Calendars ──
  let calendars = []
  if (includeCalendars && project.Calendars?.Calendar) {
    const rawCalendars = Array.isArray(project.Calendars.Calendar)
      ? project.Calendars.Calendar
      : [project.Calendars.Calendar]
    calendars = rawCalendars.map(cal => ({
      uid: String(cal['@_UID'] || ''),
      name: String(cal['@_Name'] || cal.Name || ''),
      isBaseCalendar: cal['@_IsBaseCalendar'] === 'true',
      weekDays: parseWeekDays(cal.WeekDays?.WeekDay),
    }))
  }

  // ── Resources ──
  let resources = []
  if (includeResources && project.Resources?.Resource) {
    const rawResources = Array.isArray(project.Resources.Resource)
      ? project.Resources.Resource
      : [project.Resources.Resource]
    resources = rawResources.map(r => ({
      uid: String(r['@_UID'] || ''),
      name: String(r['@_Name'] || r.Name || ''),
      type: parseResourceType(String(r['@_Type'] || r.Type || '0')),
      maxUnits: Number(r['@_MaxUnits'] || r.MaxUnits || 100),
      standardRate: parseRate(r['@_StandardRate'] || r.StandardRate),
      overtimeRate: parseRate(r['@_OvertimeRate'] || r.OvertimeRate),
      costPerUse: Number(r['@_CostPerUse'] || r.CostPerUse || 0),
      email: String(r['@_Email'] || r.Email || ''),
      group: String(r['@_Group'] || r.Group || ''),
    }))
  }

  // ── Tasks ──
  let tasks = []
  if (project.Tasks?.Task) {
    const rawTasks = Array.isArray(project.Tasks.Task)
      ? project.Tasks.Task
      : [project.Tasks.Task]
    tasks = rawTasks.map(t => ({
      uid: String(t['@_UID'] || t.UID || ''),
      id: String(t['@_ID'] || t.ID || ''),
      name: String(t['@_Name'] || t.Name || ''),
      duration: parseDuration(t['@_Duration'] || t.Duration),
      start: t['@_Start'] || t.Start || '',
      finish: t['@_Finish'] || t.Finish || '',
      percentComplete: Number(t['@_PercentComplete'] || t.PercentComplete || 0),
      wbs: String(t['@_WBS'] || t.WBS || ''),
      outlineLevel: Number(t['@_OutlineLevel'] || t.OutlineLevel || 0),
      predecessors: parsePredecessors(t.PredecessorLinks?.PredecessorLink),
      baselineDuration: parseDuration(t['@_BaselineDuration'] || t.BaselineDuration),
      baselineCost: Number(t['@_BaselineCost'] || t.BaselineCost || 0),
      baselineWork: parseDuration(t['@_BaselineWork'] || t.BaselineWork),
      actualCost: Number(t['@_ActualCost'] || t.ActualCost || 0),
      actualDuration: parseDuration(t['@_ActualDuration'] || t.ActualDuration),
      remainingDuration: parseDuration(t['@_RemainingDuration'] || t.RemainingDuration),
      constraintType: String(t['@_ConstraintType'] || t.ConstraintType || '0'),
      constraintDate: t['@_ConstraintDate'] || t.ConstraintDate || '',
      status: computeTaskStatus(Number(t['@_PercentComplete'] || t.PercentComplete || 0)),
      milestones: t['@_Milestone'] === 'true' || t.Milestone === true || String(t.Milestone) === 'true',
      summary: t['@_Summary'] === 'true' || t.Summary === 'true',
      notes: String(t.Notes || ''),
      resourceNames: String(t['@_ResourceNames'] || t.ResourceNames || ''),
    }))
  }

  return {
    name: String(project['@_Name'] || project.Name || ''),
    startDate: project['@_StartDate'] || project.StartDate || '',
    finishDate: project['@_FinishDate'] || project.FinishDate || '',
    statusDate: project['@_StatusDate'] || project.StatusDate || '',
    tasks,
    resources,
    calendars,
    baselineDuration: parseDuration(project['@_BaselineDuration'] || ''),
    baselineCost: Number(project['@_BaselineCost'] || 0),
    actualDuration: parseDuration(project['@_ActualDuration'] || ''),
    actualCost: Number(project['@_ActualCost'] || 0),
    durationVariance: parseDuration(project['@_DurationVariance'] || ''),
    costVariance: Number(project['@_CostVariance'] || 0),
    parsedAt: new Date(),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse MSP duration format (PTxhymins, PT8H, etc.) into minutes.
 * Handles: PT8H0M0S → 480, P1DT4H → 1680, 8h → 480
 */
function parseDuration(raw) {
  if (!raw) return 0
  const s = String(raw).trim()
  if (!s) return 0

  // Try MSP ISO format: PT8H0M0S or PT4.5H
  const iso = s.match(/^P(?:(\d+)D)?T?(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/)
  if (iso) {
    const days = Number(iso[1] || 0)
    const hours = Number(iso[2] || 0)
    const mins = Number(iso[3] || 0)
    const secs = Number(iso[4] || 0)
    return (days * 8 * 60) + (hours * 60) + mins + Math.round(secs / 60)
  }

  // Try plain format: 8h, 4.5h, 30m
  const plain = s.match(/^(\d+(?:\.\d+)?)\s*([hdms])$/i)
  if (plain) {
    const val = Number(plain[1])
    switch (plain[2].toLowerCase()) {
      case 'h': return Math.round(val * 60)
      case 'd': return Math.round(val * 8 * 60)
      case 'm': return Math.round(val)
      case 's': return Math.round(val / 60)
    }
  }

  return 0
}

/**
 * Parse predecessor links into an array of predecessor UIDs.
 */
function parsePredecessors(links) {
  if (!links) return []
  const arr = Array.isArray(links) ? links : [links]
  return arr
    .map(l => String(l['@_PredecessorUID'] || l.PredecessorUID || ''))
    .filter(Boolean)
}

/**
 * Parse resource type code.
 * MSP: 0=work, 1=material, 2=cost
 */
function parseResourceType(code) {
  const map = { '0': 'work', '1': 'material', '2': 'cost' }
  return map[String(code)] || 'work'
}

/**
 * Parse rate string like "$50.00/h" or "50" to hourly number.
 */
function parseRate(raw) {
  if (!raw) return 0
  const s = String(raw).replace(/[$,]/g, '').trim()
  const num = parseFloat(s)
  if (isNaN(num)) return 0
  // If rate includes /h, /hr, /hour, it's already hourly
  if (/\/h(ou)?r?$/i.test(String(raw))) return num
  return num
}

/**
 * Parse week days from calendar definition.
 */
function parseWeekDays(rawDays) {
  if (!rawDays) return []
  const arr = Array.isArray(rawDays) ? rawDays : [rawDays]
  return arr.map(d => ({
    dayType: String(d['@_DayType'] || d.DayType || ''),
    dayWorking: d['@_DayWorking'] === 'true' || d.DayWorking === 'true',
  }))
}

/**
 * Compute task status from percent complete.
 */
function computeTaskStatus(pct) {
  if (pct >= 100) return 'complete'
  if (pct > 0) return 'in-progress'
  return 'not-started'
}

// ─── Analysis ────────────────────────────────────────────────────────────────

/**
 * Analyze a parsed project and return scheduling/compliance insights.
 * @param {MspProject} project
 * @returns {Object}
 */
export function analyzeProject(project) {
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.status === 'complete').length
  const inProgressTasks = project.tasks.filter(t => t.status === 'in-progress').length
  const notStartedTasks = project.tasks.filter(t => t.status === 'not-started').length
  const milestoneTasks = project.tasks.filter(t => t.milestones)
  const summaryTasks = project.tasks.filter(t => t.summary)

  // Critical path detection: tasks with no successors
  const allUids = new Set(project.tasks.map(t => t.uid))
  const successorUids = new Set()
  for (const t of project.tasks) {
    for (const pred of t.predecessors) successorUids.add(pred)
  }
  const leafTasks = project.tasks.filter(t => !successorUids.has(t.uid) && !t.summary && !t.milestones)

  // Delayed tasks
  const delayedTasks = project.tasks.filter(t =>
    t.status !== 'complete' && t.percentComplete > 0 &&
    t.finish && new Date(t.finish) < new Date()
  )

  // Overdue milestones
  const overdueMilestones = milestoneTasks.filter(t =>
    t.status !== 'complete' && t.finish && new Date(t.finish) < new Date()
  )

  const pctComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    summary: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      milestones: milestoneTasks.length,
      summaryTasks: summaryTasks.length,
      percentComplete: pctComplete,
    },
    baseline: {
      hasBaseline: project.baselineDuration > 0,
      baselineDuration: project.baselineDuration,
      baselineCost: project.baselineCost,
      actualDuration: project.actualDuration,
      actualCost: project.actualCost,
      durationVariance: project.durationVariance,
      costVariance: project.costVariance,
    },
    criticalPath: {
      leafCount: leafTasks.length,
      leafTasks: leafTasks.map(t => ({ uid: t.uid, name: t.name, finish: t.finish })),
    },
    alerts: {
      delayedTasks: delayedTasks.length,
      delayedTaskNames: delayedTasks.map(t => t.name).slice(0, 10),
      overdueMilestones: overdueMilestones.length,
      overdueMilestoneNames: overdueMilestones.map(t => t.name).slice(0, 10),
    },
  }
}

/**
 * Generate a scheduling health report.
 * @param {MspProject} project
 * @returns {string}
 */
export function generateSchedulingReport(project) {
  const analysis = analyzeProject(project)
  const lines = []

  lines.push(`# Relatório de Planejamento — ${project.name}`)
  lines.push(`Gerado em: ${project.parsedAt.toISOString()}`)
  lines.push('')
  lines.push('## Resumo')
  lines.push(`- Total de tarefas: ${analysis.summary.totalTasks}`)
  lines.push(`- Concluídas: ${analysis.summary.completedTasks}`)
  lines.push(`- Em andamento: ${analysis.summary.inProgressTasks}`)
  lines.push(`- Não iniciadas: ${analysis.summary.notStartedTasks}`)
  lines.push(`- Progresso geral: ${analysis.summary.percentComplete}%`)
  lines.push(`- Marcos: ${analysis.summary.milestones}`)
  lines.push('')

  lines.push('## Linha de Base (Baseline)')
  if (analysis.baseline.hasBaseline) {
    const durVariance = analysis.baseline.durationVariance
    const costVariance = analysis.baseline.costVariance
    lines.push(`- Duração planejada: ${Math.round(analysis.baseline.baselineDuration / 480)} dias úteis`)
    lines.push(`- Custo planejado: $${analysis.baseline.baselineCost.toFixed(2)}`)
    lines.push(`- Variação de duração: ${durVariance > 0 ? `+${Math.round(durVariance / 480)} dias (atraso)` : `${Math.round(durVariance / 480)} dias (adiantado)`}`)
    lines.push(`- Variação de custo: $${costVariance > 0 ? `+${costVariance.toFixed(2)} (acima)` : `${costVariance.toFixed(2)} (abaixo)`}`)
  } else {
    lines.push('- Nenhuma baseline definida.')
  }
  lines.push('')

  if (analysis.alerts.delayedTasks > 0 || analysis.alerts.overdueMilestones > 0) {
    lines.push('## Alertas')
    if (analysis.alerts.delayedTasks > 0) {
      lines.push(`- ${analysis.alerts.delayedTasks} tarefa(s) atrasada(s): ${analysis.alerts.delayedTaskNames.join(', ')}`)
    }
    if (analysis.alerts.overdueMilestones > 0) {
      lines.push(`- ${analysis.alerts.overdueMilestones} marco(s) vencido(s): ${analysis.alerts.overdueMilestoneNames.join(', ')}`)
    }
    lines.push('')
  }

  lines.push('## Caminho Crítico')
  lines.push(`- ${analysis.criticalPath.leafCount} tarefa(s) folha identificada(s)`)
  for (const t of analysis.criticalPath.leafTasks.slice(0, 15)) {
    lines.push(`  - ${t.name} (término: ${t.finish || 'não definido'})`)
  }
  lines.push('')
  lines.push('---')
  lines.push('Gerado por Apex AI Copilot — MS Project Integration')

  return lines.join('\n')
}

/**
 * Convert a parsed project to a simplified JSON for frontend consumption.
 * @param {MspProject} project
 * @returns {Object}
 */
export function projectToSimplifiedJson(project) {
  return {
    name: project.name,
    startDate: project.startDate,
    finishDate: project.finishDate,
    statusDate: project.statusDate,
    analysis: analyzeProject(project),
    tasks: project.tasks.map(t => ({
      uid: t.uid,
      id: t.id,
      name: t.name,
      duration: t.duration,
      start: t.start,
      finish: t.finish,
      pct: t.percentComplete,
      wbs: t.wbs,
      level: t.outlineLevel,
      predecessors: t.predecessors,
      status: t.status,
      milestone: t.milestones,
      summary: t.summary,
      resourceNames: t.resourceNames,
      constraintType: t.constraintType,
      constraintDate: t.constraintDate,
    })),
    resources: project.resources.map(r => ({
      uid: r.uid,
      name: r.name,
      type: r.type,
      maxUnits: r.maxUnits,
    })),
  }
}

/**
 * In-memory store for MS Project data (local runtime).
 * In production, this would be persisted to Supabase.
 */
const projectStore = new Map()

export function storeProject(id, project) {
  projectStore.set(id, { ...project, storedAt: new Date().toISOString() })
}

export function getProject(id) {
  return projectStore.get(id) || null
}

export function listProjects() {
  return Array.from(projectStore.entries()).map(([id, p]) => ({
    id,
    name: p.name,
    storedAt: p.storedAt,
    taskCount: p.tasks?.length || 0,
  }))
}

export function deleteProject(id) {
  return projectStore.delete(id)
}

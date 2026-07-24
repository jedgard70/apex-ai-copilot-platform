export type EvidenceLevel = 'CONFIRMED' | 'ESTIMATED' | 'UNKNOWN' | 'GENERAL_GUIDANCE' | 'NEEDS_SAFETY_REVIEW'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

export type EvmInputs = {
  plannedValue?: number
  earnedValue?: number
  actualCost?: number
  budgetAtCompletion?: number
}

export type EvmKpis = {
  pv: number | null
  ev: number | null
  ac: number | null
  bac: number | null
  cpi: number | null
  spi: number | null
  cv: number | null
  sv: number | null
  eac: number | null
  etc: number | null
  vac: number | null
  tcpi: number | null
  evidence: EvidenceLevel
}

export type ScheduleTask = {
  id: string
  name: string
  start: string
  finish: string
  durationDays: number
  dependencies: string[]
  responsible: string
  plannedPercent: number
  actualPercent: number
  evidence: EvidenceLevel
  status: 'Not started' | 'In progress' | 'Delayed' | 'Complete' | 'Unknown'
}

export type Milestone = {
  id: string
  name: string
  date: string
  evidence: EvidenceLevel
}

export type SchedulePlan = {
  tasks: ScheduleTask[]
  milestones: Milestone[]
  dependencies: string[]
  delayLog: string[]
  lookaheadPlan: string[]
  physicalFinancialSchedule: {
    period: string
    physicalProgress: number
    financialProgress: number
    evidence: EvidenceLevel
  }[]
  criticalPath: string[]
  summary: string
}

export type NrChecklistItem = {
  id: string
  norm: 'NR-6' | 'NR-10' | 'NR-18' | 'NR-33' | 'NR-35'
  item: string
  riskLevel: Priority
  evidence: EvidenceLevel
  status: 'Open' | 'In Review' | 'Resolved' | 'Needs qualified review'
  responsible: string
  dueDate: string
  correctiveAction: string
}

export type EvmSchedulerCompliancePlan = {
  providerStatus: 'local-analysis'
  evmSummary: string
  kpis: EvmKpis
  varianceTable: {
    metric: string
    value: number | null
    evidence: EvidenceLevel
    interpretation: string
  }[]
  forecastPanel: string[]
  missingData: string[]
  schedulePlan: SchedulePlan
  milestones: Milestone[]
  criticalPath: string[]
  nrChecklist: NrChecklistItem[]
  riskMatrix: {
    norm: string
    risk: Priority
    count: number
    evidence: EvidenceLevel
  }[]
  correctiveActions: NrChecklistItem[]
  safetyReportDraft: string
  exports: {
    evmReport: string
    scheduleReport: string
    nrComplianceReport: string
    correctiveActionPlan: string
  }
}

function cleanNumber(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function divide(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator === 0) return null
  return Number((numerator / denominator).toFixed(3))
}

function subtract(left: number | null, right: number | null) {
  if (left === null || right === null) return null
  return Number((left - right).toFixed(2))
}

function money(value: number | null) {
  return value === null ? 'UNKNOWN' : value.toFixed(2)
}

export function calculateEvmKpis(inputs: EvmInputs): EvmKpis {
  const pv = cleanNumber(inputs.plannedValue)
  const ev = cleanNumber(inputs.earnedValue)
  const ac = cleanNumber(inputs.actualCost)
  const bac = cleanNumber(inputs.budgetAtCompletion)
  const cpi = divide(ev, ac)
  const spi = divide(ev, pv)
  const cv = subtract(ev, ac)
  const sv = subtract(ev, pv)
  const eac = cpi && bac ? Number((bac / cpi).toFixed(2)) : null
  const etc = subtract(eac, ac)
  const vac = subtract(bac, eac)
  const tcpi = bac !== null && ev !== null && bac - ev > 0 && bac !== ac
    ? Number(((bac - ev) / ((bac || 0) - (ac || 0))).toFixed(3))
    : null
  const evidence: EvidenceLevel = pv !== null && ev !== null && ac !== null ? 'CONFIRMED' : 'UNKNOWN'
  return { pv, ev, ac, bac, cpi, spi, cv, sv, eac, etc, vac, tcpi, evidence }
}

export function createSchedulePlan(goal = ''): SchedulePlan {
  const tasks: ScheduleTask[] = [
    {
      id: 'sch-mobilization',
      name: 'Mobilization and project setup',
      start: '',
      finish: '',
      durationDays: 3,
      dependencies: [],
      responsible: 'Project lead',
      plannedPercent: 0,
      actualPercent: 0,
      evidence: 'ESTIMATED',
      status: 'Unknown',
    },
    {
      id: 'sch-documentation',
      name: 'Documentation / permit / production package',
      start: '',
      finish: '',
      durationDays: 10,
      dependencies: ['sch-mobilization'],
      responsible: 'Doc Manager / BIM team',
      plannedPercent: 0,
      actualPercent: 0,
      evidence: 'ESTIMATED',
      status: 'Unknown',
    },
    {
      id: 'sch-execution',
      name: 'Execution / production / field work',
      start: '',
      finish: '',
      durationDays: 20,
      dependencies: ['sch-documentation'],
      responsible: 'Production / field team',
      plannedPercent: 0,
      actualPercent: 0,
      evidence: 'ESTIMATED',
      status: 'Unknown',
    },
    {
      id: 'sch-review-delivery',
      name: 'QA review and delivery package',
      start: '',
      finish: '',
      durationDays: 5,
      dependencies: ['sch-execution'],
      responsible: 'Quality QA / Owner',
      plannedPercent: 0,
      actualPercent: 0,
      evidence: 'ESTIMATED',
      status: 'Unknown',
    },
  ]
  return {
    tasks,
    milestones: [
      { id: 'ms-kickoff', name: 'Kickoff', date: '', evidence: 'ESTIMATED' },
      { id: 'ms-package-ready', name: 'Production package ready', date: '', evidence: 'ESTIMATED' },
      { id: 'ms-delivery', name: 'Client delivery', date: '', evidence: 'ESTIMATED' },
    ],
    dependencies: tasks.flatMap(task => task.dependencies.map(dep => `${dep} -> ${task.id}`)),
    delayLog: ['No confirmed delay log provided yet. FieldOps delay notes can be connected here.'],
    lookaheadPlan: [
      'Confirm baseline dates, dependencies and responsible parties.',
      'Collect FieldOps progress and blockers.',
      'Update planned vs actual before claiming schedule variance.',
    ],
    physicalFinancialSchedule: [
      { period: 'Phase 1', physicalProgress: 0, financialProgress: 0, evidence: 'ESTIMATED' },
      { period: 'Phase 2', physicalProgress: 0, financialProgress: 0, evidence: 'ESTIMATED' },
      { period: 'Phase 3', physicalProgress: 0, financialProgress: 0, evidence: 'ESTIMATED' },
    ],
    criticalPath: tasks.map(task => task.name),
    summary: goal ? `Local schedule scaffold prepared for: ${goal}` : 'Local schedule scaffold prepared. No MS Project integration is connected.',
  }
}

export const defaultNrChecklist: NrChecklistItem[] = [
  {
    id: 'nr6-ppe',
    norm: 'NR-6',
    item: 'Confirm PPE/EPI list, delivery records, training and usage evidence.',
    riskLevel: 'High',
    evidence: 'GENERAL_GUIDANCE',
    status: 'Needs qualified review',
    responsible: 'Safety lead',
    dueDate: '',
    correctiveAction: 'Collect PPE/EPI records and validate with qualified safety professional.',
  },
  {
    id: 'nr10-electrical',
    norm: 'NR-10',
    item: 'Review electrical safety, lockout/tagout, qualified workers and energized work controls.',
    riskLevel: 'Critical',
    evidence: 'GENERAL_GUIDANCE',
    status: 'Needs qualified review',
    responsible: 'Electrical / safety lead',
    dueDate: '',
    correctiveAction: 'Prepare NR-10 checklist and require qualified review before execution.',
  },
  {
    id: 'nr18-construction',
    norm: 'NR-18',
    item: 'Review construction site conditions, access, housekeeping, collective protection and work fronts.',
    riskLevel: 'High',
    evidence: 'GENERAL_GUIDANCE',
    status: 'Needs qualified review',
    responsible: 'Site manager',
    dueDate: '',
    correctiveAction: 'Create site safety action list from FieldOps photos/notes and qualified review.',
  },
  {
    id: 'nr33-confined',
    norm: 'NR-33',
    item: 'Identify whether confined spaces exist and whether permits, monitoring and rescue plan are required.',
    riskLevel: 'Critical',
    evidence: 'NEEDS_SAFETY_REVIEW',
    status: 'Needs qualified review',
    responsible: 'Safety lead',
    dueDate: '',
    correctiveAction: 'Do not authorize confined-space work without qualified assessment and permit workflow.',
  },
  {
    id: 'nr35-height',
    norm: 'NR-35',
    item: 'Review work-at-height exposure, fall protection, anchorage, training and rescue plan.',
    riskLevel: 'Critical',
    evidence: 'GENERAL_GUIDANCE',
    status: 'Needs qualified review',
    responsible: 'Safety lead',
    dueDate: '',
    correctiveAction: 'Prepare work-at-height control plan and require qualified review before execution.',
  },
]

export function createEvmSchedulerCompliancePlan(goal = '', inputs: EvmInputs = {}): EvmSchedulerCompliancePlan {
  const kpis = calculateEvmKpis(inputs)
  const missingData = [
    kpis.pv === null ? 'Planned Value (PV)' : '',
    kpis.ev === null ? 'Earned Value (EV)' : '',
    kpis.ac === null ? 'Actual Cost (AC)' : '',
    kpis.bac === null ? 'Budget at Completion (BAC)' : '',
  ].filter(Boolean)
  const schedulePlan = createSchedulePlan(goal)
  const riskMatrix = defaultNrChecklist.reduce((acc, item) => {
    const existing = acc.find(row => row.norm === item.norm && row.risk === item.riskLevel)
    if (existing) existing.count += 1
    else acc.push({ norm: item.norm, risk: item.riskLevel, count: 1, evidence: item.evidence })
    return acc
  }, [] as EvmSchedulerCompliancePlan['riskMatrix'])
  const correctiveActions = defaultNrChecklist.filter(item => item.status !== 'Resolved')
  const varianceTable = [
    { metric: 'CPI', value: kpis.cpi, evidence: kpis.evidence, interpretation: kpis.cpi === null ? 'UNKNOWN: needs EV and AC.' : kpis.cpi >= 1 ? 'Cost performance at or above baseline.' : 'Cost overrun risk.' },
    { metric: 'SPI', value: kpis.spi, evidence: kpis.evidence, interpretation: kpis.spi === null ? 'UNKNOWN: needs EV and PV.' : kpis.spi >= 1 ? 'Schedule performance at or above baseline.' : 'Schedule delay risk.' },
    { metric: 'CV', value: kpis.cv, evidence: kpis.evidence, interpretation: kpis.cv === null ? 'UNKNOWN: needs EV and AC.' : kpis.cv >= 0 ? 'Positive/neutral cost variance.' : 'Negative cost variance.' },
    { metric: 'SV', value: kpis.sv, evidence: kpis.evidence, interpretation: kpis.sv === null ? 'UNKNOWN: needs EV and PV.' : kpis.sv >= 0 ? 'Positive/neutral schedule variance.' : 'Negative schedule variance.' },
  ]
  const evmSummary = missingData.length
    ? `EVM local analysis is incomplete. Missing: ${missingData.join(', ')}. Apex will not fake CPI/SPI/EAC.`
    : `EVM local analysis complete from supplied values. CPI ${kpis.cpi}, SPI ${kpis.spi}, EAC ${money(kpis.eac)}.`
  const safetyReportDraft = [
    'NR Compliance draft - GENERAL GUIDANCE / NEEDS_SAFETY_REVIEW.',
    'No official compliance approval, legal certification or safety release is claimed.',
    ...defaultNrChecklist.map(item => `- ${item.norm}: ${item.item} Evidence: ${item.evidence}. Action: ${item.correctiveAction}`),
  ].join('\n')
  const scheduleReport = [
    'Schedule report draft',
    schedulePlan.summary,
    '',
    'Tasks:',
    ...schedulePlan.tasks.map(task => `- ${task.name}: ${task.durationDays} days, dependencies ${task.dependencies.join(', ') || 'none'}, evidence ${task.evidence}`),
  ].join('\n')
  const evmReport = [
    'EVM report draft',
    evmSummary,
    `PV: ${money(kpis.pv)} | EV: ${money(kpis.ev)} | AC: ${money(kpis.ac)} | BAC: ${money(kpis.bac)}`,
    `CPI: ${kpis.cpi ?? 'UNKNOWN'} | SPI: ${kpis.spi ?? 'UNKNOWN'} | EAC: ${money(kpis.eac)} | VAC: ${money(kpis.vac)} | TCPI: ${kpis.tcpi ?? 'UNKNOWN'}`,
  ].join('\n')
  const correctiveActionPlan = correctiveActions
    .map(item => `${item.norm} / ${item.riskLevel}: ${item.correctiveAction} Responsible: ${item.responsible}. Evidence: ${item.evidence}.`)
    .join('\n')
  return {
    providerStatus: 'local-analysis',
    evmSummary,
    kpis,
    varianceTable,
    forecastPanel: [
      kpis.eac === null ? 'EAC is UNKNOWN until BAC, EV and AC exist.' : `EAC forecast: ${money(kpis.eac)}.`,
      kpis.vac === null ? 'VAC is UNKNOWN until BAC and EAC exist.' : `VAC forecast: ${money(kpis.vac)}.`,
      kpis.tcpi === null ? 'TCPI is UNKNOWN until BAC, EV and AC support it.' : `TCPI required performance: ${kpis.tcpi}.`,
    ],
    missingData,
    schedulePlan,
    milestones: schedulePlan.milestones,
    criticalPath: schedulePlan.criticalPath,
    nrChecklist: defaultNrChecklist,
    riskMatrix,
    correctiveActions,
    safetyReportDraft,
    exports: {
      evmReport,
      scheduleReport,
      nrComplianceReport: safetyReportDraft,
      correctiveActionPlan,
    },
  }
}

export function isEvmSchedulerComplianceIntent(text: string) {
  return /\b(evm|cpi|spi|eac|vac|tcpi|planned value|earned value|actual cost|cronograma|gantt|caminho cr[ií]tico|atraso|lookahead|cronograma f[ií]sico-financeiro|schedule|critical path|nr-18|nr-35|nr-10|nr-6|nr-33|seguran[cç]a do trabalho|compliance nr|nr compliance)\b/i.test(text)
}

export type ApexAgentStatus = 'implemented' | 'partial' | 'planned'

export type ApexAgent = {
  id: string
  name: string
  domain: string
  responsibilities: string[]
  connectedStudios: string[]
  evidenceRules: string[]
  status: ApexAgentStatus
  gaps: string[]
  recommendedCheckpoint: string
}

export const apexAgents: ApexAgent[] = [
  {
    id: 'maestro-ai',
    name: 'Maestro AI',
    domain: 'Orchestration',
    responsibilities: [
      'Orchestrate all studios and cognitive agents from the chat command center.',
      'Route user intent to the right studio without forcing department-first navigation.',
      'Keep project context, files, outputs and exports connected.',
    ],
    connectedStudios: ['Apex Copilot Chat', 'Project Workspace', 'Export Center', 'All Studios'],
    evidenceRules: [
      'Never claim an external connector ran unless it was actually called.',
      'Separate implemented modules from planned modules.',
      'Keep chat primary; panels are supporting workspaces.',
    ],
    status: 'partial',
    gaps: ['Needs deeper autonomous multi-agent task planning and cross-studio execution memory.'],
    recommendedCheckpoint: 'CP11B now, then autonomous orchestration in a later agent runtime checkpoint.',
  },
  {
    id: 'bim-manager',
    name: 'BIM Manager Agent',
    domain: 'BIM / 3D / Coordination',
    responsibilities: [
      'Manage BIM/3D Studio, IFC/viewer workflow, import/conversion workflow and model review.',
      'Prepare corrections, saved views, tours, camera paths and technical reports.',
      'Route BIM scene outputs to ArchVis and DirectCut.',
    ],
    connectedStudios: ['BIM / 3D Studio', 'ArchVis Studio', 'DirectCut Studio', 'Export Center'],
    evidenceRules: [
      'Use CONFIRMED only for parser/viewer-detected facts.',
      'Use ASSUMPTION for metadata-based inference.',
      'Use UNKNOWN when geometry/model content is not readable.',
      'No fake viewer and no external-software-first answer.',
    ],
    status: 'partial',
    gaps: ['Real IFC parser/viewer extraction and clash/quantity automation are still foundation-level.'],
    recommendedCheckpoint: 'BIM parser/viewer hardening and real model evidence extraction.',
  },
  {
    id: 'evm-analyst',
    name: 'EVM Analyst Agent',
    domain: 'Earned Value / Project Controls',
    responsibilities: [
      'Analyze CPI, SPI, EAC, VAC, TCPI, planned value, earned value and actual cost.',
      'Connect schedule, budget and field progress into executive project controls.',
      'Identify cost/schedule variance and recovery actions.',
    ],
    connectedStudios: ['Budget Studio', 'Field Operations Studio', 'Future Schedule Studio', 'Future EVM Dashboard'],
    evidenceRules: [
      'Do not calculate CPI/SPI/EAC as confirmed without PV, EV and AC inputs.',
      'Label missing project controls data as UNKNOWN.',
      'Label user-entered values as USER_ENTERED until source-backed.',
    ],
    status: 'planned',
    gaps: ['No dedicated EVM engine yet. Needs CP11C for PV/EV/AC data model, formulas and dashboard.'],
    recommendedCheckpoint: 'CP11C EVM / Scheduler / NR controls foundation.',
  },
  {
    id: 'nr-compliance',
    name: 'NR Compliance Agent',
    domain: 'Safety / Brazilian NR Compliance',
    responsibilities: [
      'Support NR-6, NR-10, NR-18, NR-33 and NR-35 safety/compliance workflows.',
      'Prepare safety checklists, reports and evidence packages.',
      'Connect field photos, RDO notes and safety observations.',
    ],
    connectedStudios: ['Field Operations Studio', 'Contracts / Permits Studio', 'Export Center'],
    evidenceRules: [
      'Do not claim inspection approval.',
      'Use PHOTO_CONFIRMED only for visible photo evidence.',
      'Use USER_REPORTED for site notes.',
      'Use NEEDS_SPECIALIST_REVIEW for jurisdiction/safety compliance certainty.',
    ],
    status: 'planned',
    gaps: ['FieldOps has safety checklists, but no dedicated NR compliance rules engine or legal/source verification.'],
    recommendedCheckpoint: 'CP11C NR Compliance Studio / safety source confidence.',
  },
  {
    id: 'cost-controller',
    name: 'Cost Controller Agent',
    domain: 'Budget / Cost / Finance',
    responsibilities: [
      'Control budget assumptions, estimate confidence, project cost/profit and finance handoff.',
      'Connect Budget Studio, Finance layer, SINAPI/source confidence and accounting exports.',
      'Flag placeholder pricing and missing source verification.',
    ],
    connectedStudios: ['Budget Studio', 'Finance Panel', 'Research Studio', 'Export Center'],
    evidenceRules: [
      'No fake SINAPI or live pricing.',
      'Use PLACEHOLDER until source/user data exists.',
      'Use USER_PROVIDED for manually entered prices.',
      'No fake paid invoices or confirmed revenue.',
    ],
    status: 'partial',
    gaps: ['Budget/Finance scaffolding exists, but real price-source ingestion and accounting/payment connectors are not connected.'],
    recommendedCheckpoint: 'Pricing source ingestion, SINAPI upload parser and finance connector checkpoint.',
  },
  {
    id: 'doc-manager',
    name: 'Doc Manager Agent',
    domain: 'Documents / Project Memory / Exports',
    responsibilities: [
      'Organize project files, contracts, RDOs, reports, exports and client packages.',
      'Maintain source/evidence labels and avoid leaking secrets.',
      'Prepare project/accountant/client handoff packages.',
    ],
    connectedStudios: ['Project Workspace', 'Export Center', 'Contracts / Permits Studio', 'Field Operations Studio', 'Finance Panel'],
    evidenceRules: [
      'Export only data/assets present in local Project Workspace.',
      'Redact secrets and never include .env.local.',
      'Do not invent missing documents.',
    ],
    status: 'implemented',
    gaps: ['Needs future database-backed document permissions and versioning.'],
    recommendedCheckpoint: 'Future database/auth document permissions checkpoint.',
  },
  {
    id: 'scheduler',
    name: 'Scheduler Agent',
    domain: 'Schedule / Gantt / Critical Path',
    responsibilities: [
      'Create milestones, Gantt structure, physical-financial schedules and delay analysis.',
      'Connect field progress to planned vs actual timeline.',
      'Support critical path and recovery sequencing.',
    ],
    connectedStudios: ['Field Operations Studio', 'Budget Studio', 'DirectCut Studio', 'Future Schedule Studio'],
    evidenceRules: [
      'Do not claim critical path without task network/durations/dependencies.',
      'Label schedule dates as USER_ENTERED or ASSUMPTION until source-backed.',
      'Separate delays observed in field from forecasted schedule risk.',
    ],
    status: 'planned',
    gaps: ['No dedicated Gantt, milestone, dependency or physical-financial schedule engine yet.'],
    recommendedCheckpoint: 'CP11C Scheduler / Gantt / physical-financial planning.',
  },
  {
    id: 'quality-qa',
    name: 'Quality QA Agent',
    domain: 'Quality / Punch List / NCIs',
    responsibilities: [
      'Manage quality checklist, punch list, rework items and NCI-style issue tracking.',
      'Support PBQP-H/ISO awareness without fake certification.',
      'Prepare client/internal quality reports.',
    ],
    connectedStudios: ['Field Operations Studio', 'Contracts / Permits Studio', 'Export Center'],
    evidenceRules: [
      'Use PHOTO_CONFIRMED only for visible defects.',
      'Use USER_REPORTED for manual punch items.',
      'Do not claim PBQP-H/ISO compliance certification.',
      'Label unavailable inspection data as UNKNOWN.',
    ],
    status: 'partial',
    gaps: ['Quality/punch list exists in FieldOps, but NCIs and PBQP-H/ISO workflows need deeper dedicated tracking.'],
    recommendedCheckpoint: 'Quality QA / NCI workflow expansion.',
  },
]

export function agentRegistrySummary() {
  return apexAgents
    .map(agent => `${agent.name} (${agent.status}): ${agent.domain} -> ${agent.connectedStudios.join(', ')}`)
    .join('\n')
}

export function isAgentIntent(text: string) {
  return /\b(agentes|8 agentes|cognitive agents|maestro|bim manager|evm|nr compliance|cost controller|doc manager|scheduler|quality qa|qa agent|agente cognitivo|agentes cognitivos)\b/i.test(text)
}

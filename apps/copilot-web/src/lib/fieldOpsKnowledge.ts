export type FieldEvidence = 'PHOTO_CONFIRMED' | 'USER_REPORTED' | 'ASSUMPTION' | 'UNKNOWN'
export type FieldSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type FieldIssueStatus = 'Open' | 'In Progress' | 'Resolved'
export type FieldRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type FieldAcceptanceStatus = 'Accepted' | 'Needs review' | 'Rejected' | 'Unknown'

export type FieldRdoContext = {
  date: string
  project: string
  weather: string
  crew: string
  activitiesPerformed: string
  equipment: string
  materialsDeliveredUsed: string
  visitors: string
  delays: string
  incidents: string
  safetyNotes: string
  qualityNotes: string
}

export type FieldActivity = {
  id: string
  description: string
  responsibleParty: string
  evidence: FieldEvidence
  status: 'Planned' | 'In Progress' | 'Completed' | 'Blocked'
}

export type FieldIssue = {
  id: string
  issue: string
  location: string
  severity: FieldSeverity
  evidence: FieldEvidence
  assignedTo: string
  dueDate: string
  status: FieldIssueStatus
}

export type FieldSafetyItem = {
  id: string
  item: string
  status: FieldAcceptanceStatus
  riskLevel: FieldRiskLevel
  evidence: FieldEvidence
  notes: string
}

export type FieldPhotoLog = {
  id: string
  fileName: string
  caption: string
  location: string
  relatedActivity: string
  evidence: FieldEvidence
}

export type FieldOpsPlan = {
  providerStatus: 'report-draft'
  rdoDraft: string
  activities: FieldActivity[]
  crew: string[]
  materials: string[]
  issues: FieldIssue[]
  safetyItems: FieldSafetyItem[]
  qualityItems: FieldSafetyItem[]
  photoLog: FieldPhotoLog[]
  clientSummary: string
  internalFieldReport: string
  safetyReport: string
  qualityPunchList: string
  materialsLog: string
  nextDayPlan: string
  confidenceSummary: string
  message: string
}

export const defaultFieldContext: FieldRdoContext = {
  date: new Date().toISOString().slice(0, 10),
  project: 'Apex field project',
  weather: '',
  crew: '',
  activitiesPerformed: '',
  equipment: '',
  materialsDeliveredUsed: '',
  visitors: '',
  delays: '',
  incidents: '',
  safetyNotes: '',
  qualityNotes: '',
}

export const safetyChecklistDefaults = [
  'PPE / EPI',
  'fall protection',
  'electrical safety',
  'housekeeping',
  'access/circulation',
  'machinery/equipment',
]

export const qualityChecklistDefaults = [
  'dimensions',
  'finishes',
  'waterproofing',
  'concrete/structure',
  'MEP',
  'rework items',
]

export const fieldEvidenceOptions: FieldEvidence[] = [
  'PHOTO_CONFIRMED',
  'USER_REPORTED',
  'ASSUMPTION',
  'UNKNOWN',
]

export const fieldSeverityOptions: FieldSeverity[] = ['Low', 'Medium', 'High', 'Critical']
export const fieldIssueStatusOptions: FieldIssueStatus[] = ['Open', 'In Progress', 'Resolved']
export const fieldRiskLevelOptions: FieldRiskLevel[] = ['Low', 'Medium', 'High', 'Critical']
export const fieldAcceptanceStatusOptions: FieldAcceptanceStatus[] = ['Accepted', 'Needs review', 'Rejected', 'Unknown']

export function emptyFieldOpsPlan(): FieldOpsPlan {
  return {
    providerStatus: 'report-draft',
    rdoDraft: 'Generate an RDO / daily report first.',
    activities: [],
    crew: [],
    materials: [],
    issues: [],
    safetyItems: safetyChecklistDefaults.map((item, index) => ({
      id: `safety-${index + 1}`,
      item,
      status: 'Unknown',
      riskLevel: 'Medium',
      evidence: 'UNKNOWN',
      notes: 'Not checked yet.',
    })),
    qualityItems: qualityChecklistDefaults.map((item, index) => ({
      id: `quality-${index + 1}`,
      item,
      status: 'Unknown',
      riskLevel: 'Medium',
      evidence: 'UNKNOWN',
      notes: 'Not checked yet.',
    })),
    photoLog: [],
    clientSummary: '',
    internalFieldReport: '',
    safetyReport: '',
    qualityPunchList: '',
    materialsLog: '',
    nextDayPlan: '',
    confidenceSummary: 'No field report generated yet. No site condition is verified until supported by user data or visible photo evidence.',
    message: 'Field Operations Studio is ready.',
  }
}

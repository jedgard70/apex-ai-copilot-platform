export type PwaMobilePlan = {
  providerStatus: 'planning-checklist'
  mobileFieldWorkflow: string[]
  offlineFirstPlan: string[]
  installabilityChecklist: string[]
  syncQueuePlan: string[]
  fieldUserUx: string[]
  exportChecklist: string
}

export function isPwaMobileIntent(text: string) {
  return /\b(pwa|mobile|app de campo|offline|modo mobile|field mode|installable|service worker|manifest)\b/i.test(text)
}

export function createPwaMobilePlan(goal = ''): PwaMobilePlan {
  return {
    providerStatus: 'planning-checklist',
    mobileFieldWorkflow: ['Open project', 'Capture RDO', 'Upload photos', 'Add punch item', 'Complete safety checklist', 'Queue sync when offline'],
    offlineFirstPlan: ['Cache shell after PWA implementation.', 'Store drafts locally.', 'Sync when connector/database is available.', 'Show conflict review before overwriting records.'],
    installabilityChecklist: ['manifest.webmanifest not verified here.', 'Service worker not verified here.', 'Icons/offline route needed.', 'Validate install prompt in browser before claiming PWA installed.'],
    syncQueuePlan: ['Queue RDO drafts', 'Queue photo metadata', 'Queue punch list updates', 'Retry with visible status and errors'],
    fieldUserUx: ['Large tap targets', 'Photo-first RDO', 'Offline badge', 'Simple pending sync queue', 'Safety checklist shortcuts'],
    exportChecklist: `PWA / mobile field mode checklist for: ${goal || 'Apex field users'}`,
  }
}

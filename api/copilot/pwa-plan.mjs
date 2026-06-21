function sendJson(res, status, body) {
  res.status(status).json(body)
}

function createPwaPlan(goal = '') {
  return {
    providerStatus: 'planning-checklist',
    mobileFieldWorkflow: [
      'Open project',
      'Capture RDO',
      'Upload photos',
      'Add punch item',
      'Complete safety checklist',
      'Queue sync when offline',
    ],
    offlineFirstPlan: [
      'Cache shell after PWA implementation.',
      'Store drafts locally.',
      'Sync when connector/database is available.',
      'Show conflict review before overwriting records.',
    ],
    installabilityChecklist: [
      'manifest.webmanifest not verified here.',
      'Service worker not verified here.',
      'Icons/offline route needed.',
      'Validate install prompt in browser before claiming PWA installed.',
    ],
    syncQueuePlan: [
      'Queue RDO drafts',
      'Queue photo metadata',
      'Queue punch list updates',
      'Retry with visible status and errors',
    ],
    fieldUserUx: [
      'Large tap targets',
      'Photo-first RDO',
      'Offline badge',
      'Simple pending sync queue',
      'Safety checklist shortcuts',
    ],
    exportChecklist: `PWA / mobile field mode checklist for: ${goal || 'Apex field users'}`,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'planning-checklist' })
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    return sendJson(res, 200, { plan: createPwaPlan(String(body.goal || '')) })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'pwa_plan_failed', providerStatus: 'planning-checklist' })
  }
}

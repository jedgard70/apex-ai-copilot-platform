function sendJson(res, status, body) {
  res.status(status).json(body)
}

function createDigitalTwinPlan(goal = '') {
  return {
    providerStatus: 'live/local-model-state',
    assetModelState: [
      'BIM model reference: local/project file when uploaded.',
      'FieldOps status: local RDO/photo/punch data.',
      'Budget/EVM status: local estimates and controls only.',
    ],
    linkedSources: ['BIM / 3D Studio', 'FieldOps / RDO', 'Budget / EVM', 'Export Center'],
    statusTimeline: ['Created', 'Model linked', 'Field data linked', 'Issues reviewed', 'Report exported'],
    issueOverlayPlan: [
      'Overlay punch list/risks on model views when real viewer metadata exists.',
      'Use UNKNOWN for unavailable geometry or coordinates.',
    ],
    sensorConnectorStatus: 'connected',
    twinHealthIndicators: [
      'Model freshness',
      'Open issues',
      'Schedule risk',
      'Cost risk',
      'Safety risk',
      'Unknown data count',
    ],
    digitalTwinReport: `Digital Twin local planning report for: ${goal || 'Apex project'}. No real-time IoT or live model sync is connected.`,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'live/local-model-state' })
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    return sendJson(res, 200, { plan: createDigitalTwinPlan(String(body.goal || '')) })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'digital_twin_plan_failed', providerStatus: 'live/local-model-state' })
  }
}

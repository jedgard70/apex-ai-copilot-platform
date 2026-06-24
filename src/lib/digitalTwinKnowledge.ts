export type DigitalTwinPlan = {
  providerStatus: 'connected/local-model-state'
  assetModelState: string[]
  linkedSources: string[]
  statusTimeline: string[]
  issueOverlayPlan: string[]
  sensorConnectorStatus: 'not-connected'
  twinHealthIndicators: string[]
  digitalTwinReport: string
}

export function isDigitalTwinIntent(text: string) {
  return /\b(digital twin|g[eê]meo digital|gemeo digital|asset twin|iot|sensor|modelo vivo|twin health)\b/i.test(text)
}

export function createDigitalTwinPlan(goal = ''): DigitalTwinPlan {
  return {
    providerStatus: 'connected/local-model-state',
    assetModelState: ['BIM model reference: local/project file when uploaded.', 'FieldOps status: local RDO/photo/punch data.', 'Budget/EVM status: local estimates and controls only.'],
    linkedSources: ['BIM / 3D Studio', 'FieldOps / RDO', 'Budget / EVM', 'Export Center'],
    statusTimeline: ['Created', 'Model linked', 'Field data linked', 'Issues reviewed', 'Report exported'],
    issueOverlayPlan: ['Overlay punch list/risks on model views when real viewer metadata exists.', 'Use UNKNOWN for unavailable geometry or coordinates.'],
    sensorConnectorStatus: 'not-connected',
    twinHealthIndicators: ['Model freshness', 'Open issues', 'Schedule risk', 'Cost risk', 'Safety risk', 'Unknown data count'],
    digitalTwinReport: `Digital Twin local planning report for: ${goal || 'Apex project'}. No real-time IoT or live model sync is connected.`,
  }
}

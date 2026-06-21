export type SourceConfidence =
  | 'CONFIRMED_SOURCE'
  | 'USER_PROVIDED'
  | 'ASSUMPTION'
  | 'PLACEHOLDER'
  | 'NEEDS_WEB_VERIFICATION'

export type SourceEvidence = {
  citationId?: string
  title: string
  sourceName: string
  url?: string
  dateChecked: string
  evidenceLevel: SourceConfidence
  note: string
}

export function sourceConfidenceLabel(level: SourceConfidence) {
  switch (level) {
    case 'CONFIRMED_SOURCE':
      return 'Confirmed source'
    case 'USER_PROVIDED':
      return 'User provided'
    case 'ASSUMPTION':
      return 'Assumption'
    case 'PLACEHOLDER':
      return 'Placeholder'
    case 'NEEDS_WEB_VERIFICATION':
      return 'Needs web verification'
    default:
      return 'Needs verification'
  }
}

export const noLiveSourceWarning =
  'Live web/source connector is not connected. Do not treat this as current market data, current pricing, current law, SINAPI value or supplier quote.'

export const liveSourceConnectedMessage =
  'Live web research is active. Apex searched current public web sources for this request and attached citations you can inspect, export and reuse in the app or online.'

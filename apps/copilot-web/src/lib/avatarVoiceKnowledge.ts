export type AvatarVoiceUseCase = 'internal-demo' | 'client-presentation' | 'real-estate-sales' | 'social-campaign'

export type AvatarVoicePlan = {
  providerStatus: string
  generatedAt: string
  useCase: AvatarVoiceUseCase
  consentRequired: boolean
  summary: string
  identityGuidelines: string[]
  assetChecklist: string[]
  scriptOutline: string[]
  productionSteps: string[]
  deliveryPack: string[]
  safetyRules: string[]
  report: string
}

export function isAvatarVoiceIntent(text: string) {
  return /\b(avatar|clone exato|clonar avatar|clonar voz|voice clone|voiceover|minha voz|minhas fotos|apresentador|corretor live|video de propaganda|demonstra[cç][aã]o interna|porta-voz)\b/i.test(text)
}

export function createAvatarVoicePlan(
  goal = '',
  useCase: AvatarVoiceUseCase = 'internal-demo',
  mediaSummary: { photos: number; audio: number; videos: number } = { photos: 0, audio: 0, videos: 0 },
): AvatarVoicePlan {
  const useCaseLabel = {
    'internal-demo': 'internal demo',
    'client-presentation': 'client presentation',
    'real-estate-sales': 'real-estate sales',
    'social-campaign': 'social campaign',
  }[useCase]

  const assetChecklist = [
    `Reference photos: ${mediaSummary.photos} uploaded`,
    `Voice references: ${mediaSummary.audio} uploaded`,
    `Supporting videos: ${mediaSummary.videos} uploaded`,
    'Owner consent confirmation for image and voice use',
    'Approved brand/style instructions',
  ]

  const identityGuidelines = [
    'Use only owner-provided photos/audio/video with explicit consent.',
    'Do not present generated media as real/live without disclosure when required.',
    'Keep avatar appearance, tone and script aligned with approved business use.',
    'Block public impersonation or third-party identity cloning workflows.',
  ]

  const scriptOutline = [
    `Opening hook for ${useCaseLabel}`,
    'Short owner introduction / authority statement',
    'Project or offer value proposition',
    'Feature walkthrough or property highlights',
    'Clear CTA for next action',
  ]

  const productionSteps = [
    'Curate best frontal and side photos with consistent lighting.',
    'Select clean voice samples with low background noise.',
    'Approve script and speaking style before generation.',
    'Generate avatar/voice pack through a connected media provider when available.',
    'Review final media before publication or client delivery.',
  ]

  const deliveryPack = [
    'Talking-head script',
    'Shot list / animation brief',
    'Voice style brief',
    'Caption / CTA pack',
    'Approval checklist',
  ]

  const safetyRules = [
    'Owner consent is mandatory.',
    'This panel prepares and organizes the workflow; final synthesis depends on provider connection.',
    'No third-party face or voice cloning without permission.',
    'Use internal/legal review before public campaign deployment.',
  ]

  const summary = `Avatar/voice workflow prepared for ${useCaseLabel}: Apex can organize assets, script, production steps and delivery, while final voice/avatar synthesis stays connector-dependent and consent-gated.`
  const report = [
    'Avatar / Voice plan',
    `Generated: ${new Date().toISOString()}`,
    `Use case: ${useCaseLabel}`,
    summary,
    '',
    'Assets:',
    ...assetChecklist.map(item => `- ${item}`),
  ].join('\n')

  return {
    providerStatus: 'CONSENT_GATED_PROVIDER_PENDING',
    generatedAt: new Date().toISOString(),
    useCase,
    consentRequired: true,
    summary,
    identityGuidelines,
    assetChecklist,
    scriptOutline,
    productionSteps,
    deliveryPack,
    safetyRules,
    report,
  }
}

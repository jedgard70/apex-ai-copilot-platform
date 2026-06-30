export type CampaignChannel = 'instagram' | 'facebook' | 'instagram-facebook' | 'whatsapp'
export type CampaignGoal = 'lead-generation' | 'client-approval' | 'property-sales' | 'brand-awareness'
export type CampaignFormat = 'social-pack' | 'vsl-landing'

export type VslLandingPlan = {
  urgencyBar: string
  autoplayPrompt: string
  heroHeadline: string
  heroSubheadline: string
  playerBehavior: string[]
  ctaLabel: string
  ctaDestinationHint: string
  pageSections: string[]
  trustElements: string[]
  trackingChecklist: string[]
}

export type CampaignAutomationPlan = {
  providerStatus: string
  generatedAt: string
  goal: CampaignGoal
  channel: CampaignChannel
  format: CampaignFormat
  audience: string
  offerSummary: string
  hookOptions: string[]
  primaryCaption: string
  alternateCaptions: string[]
  ctaOptions: string[]
  adVariations: { title: string; copy: string; creativeDirection: string }[]
  storyboard: string[]
  publishingChecklist: string[]
  vslLanding: VslLandingPlan
  report: string
}

export function isCampaignAutomationIntent(text: string) {
  return /\b(campanha|social media|instagram|facebook|an[uú]ncio|anuncios|ads|copy de campanha|roteiro de campanha|cta|campanha pronta|marketing pack|marketing|campanha de marketing|midia social|vsl|video sales letter|v[ií]deo de vendas|landing page|p[aá]gina de vendas|webinar)\b/i.test(text)
}

export function createCampaignAutomationPlan(
  prompt = '',
  goal: CampaignGoal = 'lead-generation',
  channel: CampaignChannel = 'instagram-facebook',
  format: CampaignFormat = 'social-pack',
  audience = '',
  offer = '',
): CampaignAutomationPlan {
  const resolvedAudience = audience.trim() || 'Prospective clients evaluating architecture/design/build services'
  const resolvedOffer = offer.trim() || prompt.trim() || 'Apex-enabled architecture, project delivery and presentation package'
  const channelLabel = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    'instagram-facebook': 'Instagram + Facebook',
    whatsapp: 'WhatsApp',
  }[channel]

  const hookOptions = [
    `See how ${resolvedOffer} becomes a clear, client-ready presentation in minutes.`,
    `From concept to approval pack: a faster way to present ${resolvedOffer}.`,
    `Turn project complexity into a simple decision with a complete visual and technical package.`,
  ]

  const primaryCaption = `Present ${resolvedOffer} with a cleaner story, faster approvals and stronger client confidence. ${channelLabel} campaign draft prepared for ${resolvedAudience}.`
  const alternateCaptions = [
    `A complete project and sales presentation flow for ${resolvedAudience}.`,
    `Show the design, explain the value and move the client to the next step with one campaign package.`,
    `From image to budget, contract and presentation: one campaign, one message, one CTA.`,
  ]

  const ctaOptions = [
    'Request your project presentation pack',
    'Book a discovery call',
    'Send your floor plan to start',
    'Approve the next design step',
  ]

  const vslLanding: VslLandingPlan = {
    urgencyBar: 'This presentation should use a real urgency rule only when you have a true deadline configured.',
    autoplayPrompt: 'Autoplay muted video with a clear click-to-unmute prompt and immediate CTA below the player.',
    heroHeadline: `Present ${resolvedOffer} with a premium video-first conversion page.`,
    heroSubheadline: `Use a VSL-style page for ${resolvedAudience} with a direct path from interest to contact or checkout.`,
    playerBehavior: [
      'Open with video above the fold and CTA visible without scrolling.',
      'Start muted when browser policy requires it, then prompt the user to enable audio.',
      'Keep a persistent CTA below the player while the offer is explained.',
    ],
    ctaLabel: ctaOptions[0],
    ctaDestinationHint: 'Connect CTA to Hotmart, WhatsApp, Stripe checkout or booking flow.',
    pageSections: [
      'Urgency / availability bar at the top.',
      'Hero block with headline, subheadline and VSL player.',
      'Primary CTA immediately below the video.',
      'Proof / trust / deliverables section after the hero.',
      'FAQ, terms and privacy links in the footer.',
    ],
    trustElements: [
      'Real deadline or availability statement only when verified.',
      'Clear terms of use and privacy policy links.',
      'Visible brand and support/contact destination.',
    ],
    trackingChecklist: [
      'Preserve UTMs and campaign source parameters.',
      'Track CTA click, video play, audio enable and checkout start.',
      'A/B test urgency copy, headline and CTA label.',
    ],
  }

  const adVariations = [
    {
      title: 'Fast client approval',
      copy: `Use Apex to transform ${resolvedOffer} into a presentation the client understands quickly.`,
      creativeDirection: 'Before/after, clean overlays, approval-focused messaging',
    },
    {
      title: 'Complete delivery package',
      copy: `Show concept, scope and next steps in one campaign asset instead of fragmented files and explanations.`,
      creativeDirection: 'Carousel or short vertical clip with package highlights',
    },
    {
      title: 'Premium visual + technical flow',
      copy: `Combine visuals, technical clarity and business-ready messaging for ${resolvedAudience}.`,
      creativeDirection: 'High-trust, premium branding, direct CTA',
    },
  ]

  const storyboard = [
    'Hook in first 3 seconds with clear project value.',
    'Show hero visual or result preview.',
    'Highlight package components: visual, technical, commercial.',
    'Reinforce client benefit and clarity.',
    'End with direct CTA.',
  ]

  const publishingChecklist = [
    `Confirm target channel: ${channelLabel}`,
    'Approve brand tone, logo and visual identity',
    'Review legal/commercial claims before publishing',
    'Prepare landing page, WhatsApp or contact destination',
    'Create A/B test variants for hook and CTA',
  ]

  const report = [
    'Campaign Automation Pack',
    `Generated: ${new Date().toISOString()}`,
    `Goal: ${goal}`,
    `Channel: ${channelLabel}`,
    `Audience: ${resolvedAudience}`,
    `Offer: ${resolvedOffer}`,
    `Format: ${format}`,
    '',
    'Primary CTA options:',
    ...ctaOptions.map(item => `- ${item}`),
    '',
    'VSL landing essentials:',
    `- Headline: ${vslLanding.heroHeadline}`,
    `- CTA: ${vslLanding.ctaLabel}`,
    `- Destination: ${vslLanding.ctaDestinationHint}`,
  ].join('\n')

  return {
    providerStatus: 'LOCAL_CAMPAIGN_PACK',
    generatedAt: new Date().toISOString(),
    goal,
    channel,
    format,
    audience: resolvedAudience,
    offerSummary: resolvedOffer,
    hookOptions,
    primaryCaption,
    alternateCaptions,
    ctaOptions,
    adVariations,
    storyboard,
    publishingChecklist,
    vslLanding,
    report,
  }
}

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function createCampaignAutomationPlan(goal = '', campaignGoal = 'lead-generation', channel = 'instagram-facebook', format = 'social-pack', audience = '', offer = '') {
  const resolvedAudience = String(audience || '').trim() || 'Prospective architecture / construction clients'
  const resolvedOffer = String(offer || '').trim() || String(goal || '').trim() || 'Apex architecture and project delivery package'
  const channelLabel = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    'instagram-facebook': 'Instagram + Facebook',
    whatsapp: 'WhatsApp',
  }[String(channel)] || 'Instagram + Facebook'

  const hookOptions = [
    `See how ${resolvedOffer} becomes a client-ready presentation faster.`,
    `From concept to approval pack: one clearer path for ${resolvedOffer}.`,
    `Turn project complexity into an easy yes with a stronger visual and commercial story.`,
  ]

  const ctaOptions = [
    'Request your presentation pack',
    'Book a discovery call',
    'Send your plan to start',
    'Approve the next design step',
  ]

  const primaryCaption = `Present ${resolvedOffer} with faster approvals, clearer visuals and a stronger next step. Campaign drafted for ${resolvedAudience} on ${channelLabel}.`
  const alternateCaptions = [
    `A cleaner campaign flow for ${resolvedAudience}.`,
    'One message connecting design, technical clarity and commercial value.',
    'Show the project, explain the benefit and move the client to action.',
  ]

  const adVariations = [
    {
      title: 'Fast approval angle',
      copy: `Use Apex to transform ${resolvedOffer} into a presentation that clients understand quickly.`,
      creativeDirection: 'Before/after, value-first messaging, premium visuals',
    },
    {
      title: 'Complete package angle',
      copy: 'Bundle visuals, technical clarity and next steps in one campaign asset instead of fragmented files.',
      creativeDirection: 'Carousel or vertical short with package sequence',
    },
    {
      title: 'Trust and premium angle',
      copy: `Position ${resolvedOffer} as a premium, organized and decision-ready service.`,
      creativeDirection: 'Minimalist premium design with direct CTA',
    },
  ]

  const storyboard = [
    'Open with the strongest result or benefit in 3 seconds.',
    'Show the hero visual or transformed outcome.',
    'Highlight package components and client clarity.',
    'Reinforce urgency or convenience.',
    'End with a direct CTA.',
  ]

  const publishingChecklist = [
    `Confirm channel and format for ${channelLabel}.`,
    'Approve brand tone and legal/commercial wording.',
    'Prepare landing page, WhatsApp or booking destination.',
    'Generate A/B hook and CTA variants.',
    'If needed, hand off to marketing_generate or DirectCut for execution assets.',
  ]

  const vslLanding = {
    urgencyBar: 'Use a real deadline banner only when the launch, price change or closing window is verified.',
    autoplayPrompt: 'Open with muted autoplay when needed and show a visible click-to-unmute prompt.',
    heroHeadline: `Present ${resolvedOffer} with a premium VSL conversion page.`,
    heroSubheadline: `Use a direct video-first page for ${resolvedAudience} with a clear CTA to checkout, WhatsApp or booking.`,
    playerBehavior: [
      'Keep the video above the fold with CTA visible immediately below it.',
      'Prompt the user to enable audio when browser autoplay starts muted.',
      'Maintain a conversion CTA while the video explains the offer.',
    ],
    ctaLabel: ctaOptions[0],
    ctaDestinationHint: 'Connect to Hotmart, Stripe, WhatsApp or a booking URL.',
    pageSections: [
      'Urgency / availability bar at the top.',
      'Hero section with headline, video player and CTA.',
      'Trust and deliverables section below the fold.',
      'Secondary CTA after proof / objections handling.',
      'Footer with terms and privacy links.',
    ],
    trustElements: [
      'Real urgency only when true.',
      'Visible terms of use and privacy links.',
      'Support/contact destination and brand signature.',
    ],
    trackingChecklist: [
      'Preserve UTM and source parameters.',
      'Track video play, audio enable, CTA click and checkout start.',
      'Create A/B variants for headline, urgency copy and CTA.',
    ],
  }

  return {
    providerStatus: 'LOCAL_CAMPAIGN_PACK',
    generatedAt: new Date().toISOString(),
    goal: String(campaignGoal || 'lead-generation'),
    channel: String(channel || 'instagram-facebook'),
    format: String(format || 'social-pack'),
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
    report: [
      'Campaign Automation Pack',
      `Generated: ${new Date().toISOString()}`,
      `Goal: ${String(campaignGoal || 'lead-generation')}`,
      `Channel: ${channelLabel}`,
      `Audience: ${resolvedAudience}`,
      `Offer: ${resolvedOffer}`,
      `Format: ${String(format || 'social-pack')}`,
      '',
      'CTA options:',
      ...ctaOptions.map(item => `- ${item}`),
      '',
      'VSL landing essentials:',
      `- Headline: ${vslLanding.heroHeadline}`,
      `- CTA: ${vslLanding.ctaLabel}`,
      `- Destination: ${vslLanding.ctaDestinationHint}`,
    ].join('\n'),
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'LOCAL_CAMPAIGN_PACK' })
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    return sendJson(res, 200, {
      plan: createCampaignAutomationPlan(
        String(body.goal || ''),
        String(body.campaignGoal || 'lead-generation'),
        String(body.channel || 'instagram-facebook'),
        String(body.format || 'social-pack'),
        String(body.audience || ''),
        String(body.offer || ''),
      ),
    })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'campaign_plan_failed', providerStatus: 'LOCAL_CAMPAIGN_PACK' })
  }
}

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

function scrubError(value) {
  return String(value || 'Request failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/Key_[A-Za-z0-9_-]+/g, '[redacted]')
    .slice(0, 800)
}

async function callGemini(apiKey, model, prompt) { if (!model) model = 'gemini-3.5-flash'
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1800, responseMimeType: 'application/json' },
      }),
    }
  )
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(scrubError(data?.error?.message || `Gemini HTTP ${resp.status}`))
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function parseAiResponse(text) {
  const clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(clean) } catch { return null }
}

function buildSystemPrompt() {
  return `You are a senior marketing strategist specialized in architecture, construction, real estate, and design industries. You create high-converting social media campaign packs.

Your output MUST be valid JSON matching the exact structure requested. Be specific, action-oriented, and write for a Latin American / Brazilian Portuguese-speaking market unless the audience clearly points to another market. Keep all text in the same language as the goal/offer provided.`
}

function buildUserPrompt(goal, campaignGoal, channel, format, audience, offer) {
  const channelLabel = { instagram: 'Instagram', facebook: 'Facebook', 'instagram-facebook': 'Instagram + Facebook', whatsapp: 'WhatsApp' }[channel] || channel
  return `Create a complete campaign pack for this project:

PROJECT GOAL: ${String(goal || '').slice(0, 500)}
CAMPAIGN GOAL: ${campaignGoal}
CHANNEL: ${channelLabel}
FORMAT: ${format}
AUDIENCE: ${String(audience || '').slice(0, 300)}
OFFER / FOCUS: ${String(offer || '').slice(0, 400)}

Return ONLY this JSON structure, no markdown:
{
  "primaryCaption": "one ready-to-post caption for the primary channel",
  "alternateCaptions": ["caption variant 2", "caption variant 3", "caption variant 4"],
  "hookOptions": ["attention hook 1", "hook 2", "hook 3"],
  "ctaOptions": ["CTA text 1", "CTA text 2", "CTA text 3", "CTA text 4"],
  "storyboard": ["scene 1 description", "scene 2", "scene 3", "scene 4", "scene 5"],
  "adVariations": [
    { "title": "angle name", "copy": "ad text", "creativeDirection": "visual direction" },
    { "title": "angle 2", "copy": "...", "creativeDirection": "..." },
    { "title": "angle 3", "copy": "...", "creativeDirection": "..." }
  ],
  "publishingChecklist": ["step 1", "step 2", "step 3", "step 4", "step 5"],
  "vslLanding": {
    "urgencyBar": "urgency bar text",
    "heroHeadline": "main headline",
    "heroSubheadline": "subheadline",
    "autoplayPrompt": "video autoplay instruction",
    "ctaLabel": "CTA button text",
    "ctaDestinationHint": "destination hint",
    "playerBehavior": ["behavior 1", "behavior 2", "behavior 3"],
    "pageSections": ["section 1", "section 2", "section 3", "section 4", "section 5"],
    "trustElements": ["trust 1", "trust 2", "trust 3"],
    "trackingChecklist": ["track 1", "track 2", "track 3"]
  }
}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'LOCAL_CAMPAIGN_PACK' })
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const goal = String(body.goal || '')
    const campaignGoal = String(body.campaignGoal || 'lead-generation')
    const channel = String(body.channel || 'instagram-facebook')
    const format = String(body.format || 'social-pack')
    const audience = String(body.audience || '')
    const offer = String(body.offer || '')

    const geminiKey = process.env.GEMINI_API_KEY

    const localPlan = createCampaignAutomationPlan(goal, campaignGoal, channel, format, audience, offer)

    let rawText = ''
    let providerStatus = 'LOCAL_CAMPAIGN_PACK'

    if (geminiKey) {
      rawText = await callGemini(geminiKey, 'gemini-3.5-flash', `${buildSystemPrompt()}\n\n${buildUserPrompt(goal, campaignGoal, channel, format, audience, offer)}`)
      providerStatus = 'gemini'
    }

    if (rawText) {
      const aiData = parseAiResponse(rawText)
      if (aiData) {
        const merged = {
          ...localPlan,
          providerStatus,
          primaryCaption: aiData.primaryCaption || localPlan.primaryCaption,
          alternateCaptions: aiData.alternateCaptions || localPlan.alternateCaptions,
          hookOptions: aiData.hookOptions || localPlan.hookOptions,
          ctaOptions: aiData.ctaOptions || localPlan.ctaOptions,
          storyboard: aiData.storyboard || localPlan.storyboard,
          adVariations: aiData.adVariations || localPlan.adVariations,
          publishingChecklist: aiData.publishingChecklist || localPlan.publishingChecklist,
          vslLanding: aiData.vslLanding ? { ...localPlan.vslLanding, ...aiData.vslLanding } : localPlan.vslLanding,
        }
        merged.report = [
          'Campaign Automation Pack (AI)',
          `Generated: ${new Date().toISOString()}`,
          `Goal: ${campaignGoal} | Channel: ${channel} | Format: ${format}`,
          `Audience: ${merged.audience}`,
          `Offer: ${merged.offerSummary}`,
          '',
          'Primary caption:',
          merged.primaryCaption,
          '',
          'CTAs:',
          ...merged.ctaOptions.map(c => `- ${c}`),
          '',
          'VSL Headline:',
          merged.vslLanding.heroHeadline,
        ].join('\n')
        return sendJson(res, 200, { plan: merged })
      }
    }

    return sendJson(res, 200, { plan: localPlan })
  } catch (error) {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    return sendJson(res, 200, {
      plan: createCampaignAutomationPlan(
        String(body.goal || ''), String(body.campaignGoal || 'lead-generation'),
        String(body.channel || 'instagram-facebook'), String(body.format || 'social-pack'),
        String(body.audience || ''), String(body.offer || ''),
      ),
    })
  }
}

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function scrubError(value) {
  return String(value || 'DirectCut planning failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/Key_[A-Za-z0-9_-]+/g, '[redacted]')
    .slice(0, 800)
}

function normalizeModeLabel(videoMode) {
  const modeLabels = {
    'generate-videos': 'Generated video concept',
    'image-to-video': 'Image-to-video motion plan',
    'video-editor': 'Video editor plan',
    'clip-editor': 'Clip editor plan',
    'relight-video': 'Relight video plan',
    'add-voice': 'Voiceover video plan',
    'improve-video': 'Video improvement plan',
    'cinematic-effect': 'Cinematic effect plan',
    '3d-scenes-camera-movement': '3D scenes and camera movement plan',
    'construction-presentation': 'Construction presentation',
    'real-estate-sales-video': 'Real estate sales video',
    'technical-walkthrough': 'Technical construction walkthrough',
    'social-media-short': 'Short-form social video',
  }
  return modeLabels[videoMode] || videoMode.replace(/-/g, ' ')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    const fullEnabled = String(process.env.DIRECTCUT_ENABLE_FULL || 'true').toLowerCase() !== 'false'
    const hasAiProvider = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY)
    const providerStatus = hasAiProvider && fullEnabled ? 'connector-ready' : 'planning-only'
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus })
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const goal = String(body.goal || 'Project video').slice(0, 500)
    const planEditor = String(body.planEditor || '').slice(0, 3000)
    const file = body.file && typeof body.file === 'object' ? body.file : null
    const videoMode = String(body.videoMode || 'generate-videos')
    const duration = String(body.duration || '15s')
    const aspectRatio = String(body.aspectRatio || '16:9')
    const model = String(body.model || 'auto')
    const audio = String(body.audio || 'on')
    const voice = String(body.voice || 'narrator')
    const style = String(body.style || 'professional-real-estate')
    const lighting = String(body.lighting || 'keep-original')
    const cameraMovement = String(body.cameraMovement || 'dolly-in')
    const references = Array.isArray(body.references)
      ? body.references.map(item => ({
          role: String(item?.role || 'additional').slice(0, 40),
          name: String(item?.name || 'reference media').slice(0, 180),
        })).slice(0, 8)
      : []
    const lockedConstraints = Array.isArray(body.lockedConstraints)
      ? body.lockedConstraints.map(item => String(item).slice(0, 400)).filter(Boolean).slice(0, 12)
      : []

    const sourceLine = file?.name
      ? `Reference media: ${file.name} (${file.kind || file.type || 'unknown'}).`
      : 'Reference media: none supplied.'
    const referencesLine = references.length
      ? `References: ${references.map(item => `${item.role}=${item.name}`).join(' | ')}.`
      : 'References: no additional references.'
    const constraintLine = lockedConstraints.length
      ? `Locked constraints: ${lockedConstraints.join(' | ')}.`
      : 'Locked constraints: none.'

    const modeLabel = normalizeModeLabel(videoMode)
    const styleLabel = style.replace(/-/g, ' ')
    const isSocial = videoMode === 'social-media-short' || aspectRatio === '9:16'
    const isRelight = videoMode === 'relight-video'
    const isVoice = videoMode === 'add-voice' || voice !== 'none'
    const isTechnical = videoMode === 'technical-walkthrough' || style === 'technical-bim'
    const isImageToVideo = videoMode === 'image-to-video'

    const objective = [
      `Create a ${duration} ${styleLabel} ${modeLabel.toLowerCase()} for: ${goal}`,
      `Model: ${model}.`,
      `Aspect: ${aspectRatio}.`,
      `Audio: ${audio}.`,
      `Voice: ${voice.replace(/-/g, ' ')}.`,
      `Lighting: ${lighting.replace(/-/g, ' ')}.`,
      `Camera movement: ${cameraMovement.replace(/-/g, ' ')}.`,
      sourceLine,
      referencesLine,
      constraintLine,
      planEditor ? `User prompt/plan editor: ${planEditor}` : '',
    ].filter(Boolean).join(' ')

    const sceneList = isSocial
      ? [
          'Hook frame: open with the strongest project image and a short sales phrase.',
          'Motion frame: create a vertical reveal with clean movement and readable project context.',
          'Lifestyle/value frame: show what the buyer/client gains from the project.',
          'Detail frame: highlight pool, facade, plan, material, BIM model or visual differentiator from the reference media.',
          'Closing frame: show CTA, project name and next action in a clean final composition.',
        ]
      : isRelight
        ? [
            'Reference frame: show the original media and preserve the subject, framing and timing.',
            'Lighting analysis frame: identify where the relight direction should change.',
            'Relight pass: apply the selected light mood without changing project geometry.',
            'Comparison beat: show before/after intent or visual continuity.',
            'Final hold: keep the best lit frame readable for approval.',
          ]
        : isTechnical
          ? [
              'Technical opening: show the plan/model/project context clearly.',
              'Layer reveal: introduce BIM/CAD/technical information with controlled overlays.',
              'Coordination beat: show circulation, clash, quantity or execution logic.',
              'Detail callout: focus on a critical construction or documentation point.',
              'Final overview: return to the full project for decision or technical review.',
            ]
          : [
              'Opening establishing shot: reveal the project context and strongest selling angle.',
              'Context shot: show the plan, facade, render or construction material as the project anchor.',
              'Value shot: highlight the main benefit, lifestyle, technical feature or delivery promise.',
              'Detail shot: focus on materials, space organization, BIM/technical clarity or commercial differentiator.',
              'Closing shot: call to action, project name, next step or premium final frame.',
            ]

    const movementPhrase = cameraMovement.replace(/-/g, ' ')
    const cameraMovements = isTechnical
      ? ['clean top reveal', 'slow pan across technical areas', 'layer comparison', 'callout zoom', 'final overview']
      : cameraMovement === 'static'
        ? ['static hold', 'subtle push-in only if needed', 'clean title-safe frame', 'detail crop', 'final hold']
        : [movementPhrase, 'controlled secondary pan', 'detail push-in', 'clean transition', 'final premium hold']

    const narrationScript = voice === 'none'
      ? 'No narration selected. Use visual pacing, text-safe frames and music-driven cuts.'
      : [
          isVoice ? 'Scene 1: Start with a confident narrator line that names the project value immediately.' : 'Scene 1: This project is presented as a clear, high-value opportunity.',
          isImageToVideo ? 'Scene 2: Transform the source image into motion while preserving the original composition.' : 'Scene 2: The layout and visual material reveal the strongest spatial and commercial qualities.',
          isRelight ? 'Scene 3: Explain the lighting mood change and why it improves the presentation.' : 'Scene 3: Materials, light, circulation and presentation details reinforce the project value.',
          'Scene 4: The final frame invites the client to approve the next step or request a full presentation package.',
        ].join('\n')

    const videoPrompt = [
      `Create a ${duration} ${aspectRatio} DirectCut ${modeLabel.toLowerCase()}.`,
      `Model: ${model}.`,
      `Style: ${styleLabel}.`,
      `Audio: ${audio}.`,
      `Voice: ${voice.replace(/-/g, ' ')}.`,
      `Lighting mode: ${lighting.replace(/-/g, ' ')}.`,
      `Primary camera movement: ${movementPhrase}.`,
      sourceLine,
      referencesLine,
      constraintLine,
      isRelight ? 'Relight the media without changing the subject, geometry, camera framing or project identity.' : '',
      isImageToVideo ? 'Use the initial image as the visual anchor and create motion from it without inventing unrelated architecture.' : '',
      isSocial ? 'Optimize pacing for social media: fast hook, clean rhythm, vertical-safe composition and clear CTA.' : '',
      'Use cinematic but controlled movement. Keep the project readable. Do not invent unsupported details.',
      `Goal: ${goal}`,
      planEditor ? `User editable plan/prompt:\n${planEditor}` : '',
    ].join('\n')

    const negativePrompt = [
      'fake generated video',
      'claiming video was generated',
      'unreadable text',
      'warped architecture',
      videoMode === 'add-voice' ? '' : 'random people',
      'fast chaotic camera',
      'low quality',
      'wrong project context',
      'distorted plan',
      isRelight ? 'changed subject, changed geometry, changed framing, new scene, different project' : '',
      isImageToVideo ? 'unrelated architecture, redesigned source image, missing original reference' : '',
      ...lockedConstraints.map(item => `violate constraint: ${item}`),
    ].filter(Boolean).join(', ')

    const hasAiProvider = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY)
    const fullEnabled = String(process.env.DIRECTCUT_ENABLE_FULL || 'true').toLowerCase() !== 'false'
    const providerStatus = hasAiProvider && fullEnabled ? 'connector-ready' : 'planning-only'

    return sendJson(res, 200, {
      providerStatus,
      message: 'DirectCut planner is enabled and ready for connector execution.',
      title: modeLabel,
      objective,
      audience: videoMode.includes('sales') || videoMode.includes('social') ? 'prospective buyer / client' : 'project stakeholder / technical reviewer',
      sceneList,
      cameraMovements,
      narrationScript,
      videoPrompt,
      negativePrompt,
      recommendedAspectRatio: aspectRatio,
      recommendedDuration: duration,
    })
  } catch (error) {
    const fullEnabled = String(process.env.DIRECTCUT_ENABLE_FULL || 'true').toLowerCase() !== 'false'
    return sendJson(res, 500, {
      providerStatus: fullEnabled ? 'connector-ready' : 'planning-only',
      message: scrubError(error?.message || error),
    })
  }
}

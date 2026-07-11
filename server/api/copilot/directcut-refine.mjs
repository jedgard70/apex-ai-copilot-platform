// DirectCut Node Refinement — refine a single scene node with AI
// Used by the Node Board to improve individual scenes without regenerating the full plan

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

function scrubError(value) {
  return String(value || 'Refinement failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/Key_[A-Za-z0-9_-]+/g, '[redacted]')
    .slice(0, 800)
}

async function callOpenAI(apiKey, apiBase, model, messages) {
  const resp = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 600, temperature: 0.7 }),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(scrubError(data?.error?.message || `HTTP ${resp.status}`))
  return data?.choices?.[0]?.message?.content || ''
}

async function callGemini(apiKey, model, prompt) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 600 } }),
    }
  )
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(scrubError(data?.error?.message || `Gemini HTTP ${resp.status}`))
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function buildSystemPrompt() {
  return `You are a professional film director and video production expert specializing in architectural and real estate video content. 
Your task is to refine a single scene description from a video storyboard to make it more cinematic, specific, and production-ready.

Rules:
- Keep the scene's core intent and location intact
- Make it more vivid, specific, and actionable for a video production crew
- Suggest the optimal camera movement if the current one seems wrong for the scene
- Suggest the optimal visual style if appropriate
- Add a brief director's note explaining the key visual effect to achieve
- Return ONLY valid JSON, no markdown or extra text`
}

function buildUserPrompt(scene, camera, style, goal, videoMode, duration, aspectRatio) {
  return `Refine this video scene for a ${duration} ${aspectRatio} ${videoMode} video.

PROJECT GOAL: ${String(goal || '').slice(0, 400)}
CURRENT SCENE: ${String(scene || '').slice(0, 600)}
CURRENT CAMERA: ${camera}
CURRENT STYLE: ${style}

Return this exact JSON structure:
{
  "refinedScene": "<improved scene description, 1-3 sentences, specific and production-ready>",
  "suggestedCamera": "<one of: static|dolly-in|dolly-out|orbit|pan|tilt|flyover|walkthrough|top-reveal>",
  "suggestedStyle": "<one of: cinematic|professional-real-estate|technical-bim|social-media|documentary>",
  "aiNote": "<one-line director's note: the key visual effect or emotion to achieve in this scene>"
}`
}

function parseRefineResponse(text) {
  const clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    // Try to extract JSON object from text
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch { /* fall through */ }
    }
    // Return partial result with raw text as refinedScene
    return { refinedScene: clean.slice(0, 400), aiNote: 'AI returned non-JSON response.' }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const scene = String(body.scene || '').trim()
  if (!scene) return sendJson(res, 400, { error: 'scene is required' })

  const camera = String(body.camera || 'dolly-in')
  const style = String(body.style || 'cinematic')
  const goal = String(body.goal || '').slice(0, 400)
  const videoMode = String(body.videoMode || 'generate-videos')
  const duration = String(body.duration || '15s')
  const aspectRatio = String(body.aspectRatio || '16:9')

  const geminiModel = 'gemini-3.5-flash'

  const userPrompt = buildUserPrompt(scene, camera, style, goal, videoMode, duration, aspectRatio)
  const systemPrompt = buildSystemPrompt()

  let rawText = ''

  try {

  }  if (geminiKey) {
    rawText = await callGemini(geminiKey, geminiModel, `${systemPrompt}\n\n${userPrompt}`)
  } else {
    return sendJson(res, 200, {
      refinedScene: scene,
      suggestedCamera: camera,
      suggestedStyle: style,
      aiNote: 'No AI provider configured. Add GEMINI_API_KEY to enable node refinement.',
    })
  }

  const result = parseRefineResponse(rawText)
  return sendJson(res, 200, {
    refinedScene: result.refinedScene || scene,
    suggestedCamera: result.suggestedCamera || camera,
    suggestedStyle: result.suggestedStyle || style,
    aiNote: result.aiNote || '',
  })
} catch (error) {
  return sendJson(res, 500, {
    refinedScene: scene,
    suggestedCamera: camera,
    suggestedStyle: style,
    aiNote: `Refinement error: ${scrubError(error.message)}`,
  })
}
}

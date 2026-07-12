// Gemini TTS API — Text-to-Speech via Gemini Interactions
// POST /api/copilot/tts — { text: string, model?: string, voice?: string }

import { generateSpeech, isGeminiTtsAvailable } from '../../server/agent/geminiTtsConnector.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true })
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')
    const text = String(body.text || '').trim()
    if (!text) return sendJson(res, 400, { ok: false, error: 'text is required' })

    const result = await generateSpeech(text, { model: body.model, voice: body.voice })
    if (!result.ok) return sendJson(res, 502, result)

    return sendJson(res, 200, {
      ok: true,
      audio: result.audioBase64,
      mimeType: result.mimeType,
      provider: 'gemini-tts',
    })
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message })
  }
}

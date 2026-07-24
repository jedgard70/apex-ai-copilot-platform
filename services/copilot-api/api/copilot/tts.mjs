// Gemini TTS API — Text-to-Speech via Gemini Interactions
// POST /api/copilot/tts — { text: string, model?: string, voice?: string }

import { generateSpeech as generateGeminiSpeech, isGeminiTtsAvailable } from '../../server/agent/geminiTtsConnector.mjs'
import { generateSpeech as generateElevenLabsSpeech, isElevenLabsAvailable } from '../../server/agent/elevenlabsConnector.mjs'
import { uploadMediaAndRegister } from '../../server/lib/supabaseMedia.mjs'

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

    const provider = String(body.provider || 'gemini').toLowerCase()
    let result

    if (provider === 'elevenlabs' || provider === 'eleven_labs') {
      result = await generateElevenLabsSpeech(text, { model: body.model, voice: body.voice })
    } else {
      result = await generateGeminiSpeech(text, { model: body.model, voice: body.voice })
    }

    if (!result.ok) return sendJson(res, 502, result)

    let file_id = null
    let mediaUrl = null

    if (body.projectId && result.audioBase64) {
      try {
        const buffer = Buffer.from(result.audioBase64, 'base64')
        const mimeType = result.mimeType || 'audio/mpeg'
        const ext = mimeType.split('/')[1] || 'mp3'
        const fileName = `tts_${Date.now()}.${ext}`
        
        const uploadRes = await uploadMediaAndRegister(buffer, mimeType, fileName, body.projectId, body.tenantId)
        file_id = uploadRes.file_id
        mediaUrl = uploadRes.url
      } catch (err) {
        console.error('[tts] Erro ao fazer upload para o Supabase:', err.message)
      }
    }

    return sendJson(res, 200, {
      ok: true,
      audio: result.audioBase64,
      mimeType: result.mimeType,
      file_id,
      mediaUrl
    })
  } catch (err) {
    console.error('[tts] Unexpected error:', err)
    return sendJson(res, 500, { error: err.message || 'Internal error' })
  }
}

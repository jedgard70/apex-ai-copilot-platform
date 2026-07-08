import { generateSpeech, isGeminiTtsAvailable } from '../../server/agent/geminiTtsConnector.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
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

    const customVoiceId = body.voiceId || body.voice
    const isElevenLabs = String(body.model || '').includes('elevenlabs') || (customVoiceId && process.env.ELEVENLABS_API_KEY)
    
    if (isElevenLabs && process.env.ELEVENLABS_API_KEY) {
      const voiceId = customVoiceId && customVoiceId.length > 5 ? customVoiceId : "EXAVITQu4vr4xnSDxMaL"
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.5 }
        })
      })

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return sendJson(res, 200, {
          ok: true,
          audio: buffer.toString('base64'),
          mimeType: 'audio/mpeg',
          provider: 'elevenlabs',
        })
      }
    }

    const result = await generateSpeech(text, { model: body.model, voice: customVoiceId })
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

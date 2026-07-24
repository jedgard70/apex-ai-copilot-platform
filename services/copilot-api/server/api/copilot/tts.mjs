import { generateSpeech, isGeminiTtsAvailable } from '../../agent/geminiTtsConnector.mjs'
import { logUsage } from '../../service/costOrchestrator.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

// ─── Provider: Open Source TTS (Hugging Face / Coqui / Bark) Fallback ──────
async function generateWithOpenSourceTTS({ text, voiceId }) {
  const hfToken = process.env.HUGGINGFACE_API_KEY
  if (!hfToken) throw new Error('HUGGINGFACE_API_KEY missing for Open Source TTS fallback')

  // Example using a popular open source TTS model on Hugging Face Inference API
  const modelId = 'suno/bark-small'
  const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Open Source TTS Fallback failed: ${response.status} ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return {
    ok: true,
    audio: buffer.toString('base64'),
    mimeType: 'audio/flac', // HF often returns flac for bark
    provider: 'huggingface-bark'
  }
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

    const identity = JSON.parse(req.headers['x-apex-identity'] || '{}')
    const tenantId = identity.tenantId || 'demo-tenant'

    const customVoiceId = body.voiceId || body.voice
    const isElevenLabs = String(body.model || '').includes('elevenlabs') || (customVoiceId && process.env.ELEVENLABS_API_KEY)
    
    // --- FALLBACK CASCADE ---
    let lastError = null

    // 1. Primary Provider: ElevenLabs
    if (isElevenLabs && process.env.ELEVENLABS_API_KEY) {
      try {
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

        if (!response.ok) throw new Error(`ElevenLabs API failed with status ${response.status}`)
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        logUsage(tenantId, 'elevenlabs', 'eleven_multilingual_v2', { characters: text.length }).catch(console.error)

        return sendJson(res, 200, {
          ok: true,
          audio: buffer.toString('base64'),
          mimeType: 'audio/mpeg',
          provider: 'elevenlabs',
        })
      } catch (err) {
        lastError = err
        console.error('ElevenLabs failed, trying next:', err.message)
      }
    }

    // 2. Secondary Provider: Gemini TTS
    if (isGeminiTtsAvailable()) {
      try {
        const result = await generateSpeech(text, { model: body.model, voice: customVoiceId })
        if (result.ok) {
          logUsage(tenantId, 'gemini', 'gemini-tts', { characters: text.length }).catch(console.error)
          return sendJson(res, 200, {
            ok: true,
            audio: result.audioBase64,
            mimeType: result.mimeType,
            provider: 'gemini-tts',
          })
        } else {
          throw new Error(result.error || 'Gemini TTS returned not OK')
        }
      } catch (err) {
        lastError = err
        console.error('Gemini TTS failed, trying next:', err.message)
      }
    }

    // 3. Tertiary Provider: Open Source TTS (Voicebox alternative via Hugging Face)
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const result = await generateWithOpenSourceTTS({ text, voiceId: customVoiceId })
        return sendJson(res, 200, result)
      } catch (err) {
        lastError = err
        console.error('Open Source TTS failed, trying next:', err.message)
      }
    }

    // If we reach here, all providers failed or none were configured.
    if (lastError) {
      throw lastError
    }

    return sendJson(res, 400, { ok: false, error: 'No TTS provider configured or available. Please add ELEVENLABS_API_KEY, GEMINI_API_KEY, or HUGGINGFACE_API_KEY.' })
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message || error })
  }
}

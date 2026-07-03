import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

export async function gerarImagemFAL(prompt, projectPath) {
  const apiKey = process.env.FAL_KEY
  if (!apiKey) throw new Error('FAL_KEY não configurada no .env')

  // Exemplo de integração usando fetch nativo para a API do FAL.ai (modelo FLUX)
  const response = await fetch('https://fal.run/fal-ai/flux/dev', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: prompt,
      image_size: "landscape_4_3",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Falha na API do FAL: ${err}`)
  }

  const data = await response.json()
  const imageUrl = data.images[0].url

  // Baixa a imagem gerada
  const imgRes = await fetch(imageUrl)
  const arrayBuffer = await imgRes.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const mediaDir = path.join(projectPath, 'docs', 'media_output')
  await fs.mkdir(mediaDir, { recursive: true })

  const filename = `fal_${crypto.randomUUID().slice(0, 8)}.jpg`
  const filepath = path.join(mediaDir, filename)
  await fs.writeFile(filepath, buffer)

  return filepath
}

export async function gerarVozElevenLabs(texto, projectPath) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY não configurada no .env')

  // Usa a voz predefinida do Brian (ou qualquer outra de sua escolha)
  const voiceId = "EXAVITQu4vr4xnSDxMaL"
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: texto,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Falha na API da ElevenLabs: ${err}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const mediaDir = path.join(projectPath, 'docs', 'media_output')
  await fs.mkdir(mediaDir, { recursive: true })

  const filename = `voice_${crypto.randomUUID().slice(0, 8)}.mp3`
  const filepath = path.join(mediaDir, filename)
  await fs.writeFile(filepath, buffer)

  return filepath
}

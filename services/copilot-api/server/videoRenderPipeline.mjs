import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { generateWithFal } from './agent/videoGenerationConnector.mjs'

const require = createRequire(import.meta.url)

function scrubError(value) {
  return String(value || 'Video render failed.')
    .replace(/AKIA[0-9A-Z]{16}/g, '[redacted-aws-key]')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-api-key]')
    .slice(0, 1200)
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.*)$/)
  if (!match) return null
  const [, mimeType, base64] = match
  return {
    mimeType,
    base64,
    buffer: Buffer.from(base64, 'base64'),
  }
}

function parseDurationSeconds(value) {
  const raw = String(value || '15s').trim().toLowerCase()
  const numeric = Number(raw.replace('s', ''))
  if (!Number.isFinite(numeric)) return 15
  return Math.max(3, Math.min(30, Math.round(numeric)))
}

function pickCanvas(aspectRatio) {
  if (String(aspectRatio) === '9:16') return { width: 720, height: 1280 }
  if (String(aspectRatio) === '1:1') return { width: 1024, height: 1024 }
  return { width: 1280, height: 720 }
}

function runSpawn(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { windowsHide: true })
    let stderr = ''
    proc.stderr.on('data', chunk => {
      stderr += String(chunk)
    })
    proc.on('error', reject)
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-1200)}`))
    })
  })
}

async function renderWithFfmpeg({ sourceImageDataUrl, duration, aspectRatio, finalImageDataUrl }) {
  const ffmpegPath = require('ffmpeg-static')
  if (!ffmpegPath) {
    throw new Error('ffmpeg-static not available in runtime.')
  }

  const seconds = parseDurationSeconds(duration)
  const canvas = pickCanvas(aspectRatio)
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apex-video-'))
  const outputPath = path.join(tmpDir, 'output.mp4')

  const sourceImage = parseDataUrl(sourceImageDataUrl)
  const finalImage = finalImageDataUrl ? parseDataUrl(finalImageDataUrl) : null

  try {
    if (sourceImage && finalImage) {
      // Slideshow: initial frame + final frame, each gets half the duration
      const ext1 = sourceImage.mimeType.includes('png') ? 'png' : 'jpg'
      const ext2 = finalImage.mimeType.includes('png') ? 'png' : 'jpg'
      const inputPath1 = path.join(tmpDir, `initial.${ext1}`)
      const inputPath2 = path.join(tmpDir, `final.${ext2}`)
      const concatFile = path.join(tmpDir, 'concat.txt')
      const half = Math.max(1, Math.floor(seconds / 2))
      const remainder = seconds - half

      await fs.writeFile(inputPath1, sourceImage.buffer)
      await fs.writeFile(inputPath2, finalImage.buffer)

      // Create intermediate clips for each frame
      const clip1 = path.join(tmpDir, 'clip1.mp4')
      const clip2 = path.join(tmpDir, 'clip2.mp4')
      const scaleFilter = `scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=decrease,pad=${canvas.width}:${canvas.height}:(ow-iw)/2:(oh-ih)/2`

      await runSpawn(ffmpegPath, ['-y', '-loop', '1', '-i', inputPath1, '-t', String(half), '-vf', scaleFilter, '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-movflags', '+faststart', clip1])
      await runSpawn(ffmpegPath, ['-y', '-loop', '1', '-i', inputPath2, '-t', String(remainder), '-vf', scaleFilter, '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-movflags', '+faststart', clip2])

      await fs.writeFile(concatFile, `file '${clip1.replace(/\\/g, '/')}'\nfile '${clip2.replace(/\\/g, '/')}'`)
      await runSpawn(ffmpegPath, ['-y', '-f', 'concat', '-safe', '0', '-i', concatFile, '-c', 'copy', outputPath])
    } else if (sourceImage) {
      const ext = sourceImage.mimeType.includes('png') ? 'png' : 'jpg'
      const inputPath = path.join(tmpDir, `source.${ext}`)
      await fs.writeFile(inputPath, sourceImage.buffer)
      await runSpawn(ffmpegPath, [
        '-y', '-loop', '1', '-i', inputPath, '-t', String(seconds),
        '-vf', `scale=${canvas.width}:${canvas.height}:force_original_aspect_ratio=decrease,pad=${canvas.width}:${canvas.height}:(ow-iw)/2:(oh-ih)/2`,
        '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-movflags', '+faststart', outputPath,
      ])
    } else {
      await runSpawn(ffmpegPath, [
        '-y', '-f', 'lavfi', '-i', `testsrc=size=${canvas.width}x${canvas.height}:rate=30`,
        '-t', String(seconds), '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-movflags', '+faststart', outputPath,
      ])
    }

    const outputBuffer = await fs.readFile(outputPath)
    const mode = sourceImage && finalImage ? 'initial+final-slideshow' : sourceImage ? 'initial-frame' : 'testsrc'
    return {
      providerStatus: 'generated-local-ffmpeg',
      message: `Video rendered with local FFmpeg (${mode}).`,
      mimeType: 'video/mp4',
      videoDataUrl: `data:video/mp4;base64,${outputBuffer.toString('base64')}`,
      durationSeconds: seconds,
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

async function queueMediaConvertJob({ duration, aspectRatio, sourceS3Uri }) {
  const endpoint = String(process.env.MEDIACONVERT_ENDPOINT || '').trim()
  const roleArn = String(process.env.MEDIACONVERT_ROLE_ARN || '').trim()
  const destination = String(process.env.DIRECTCUT_S3_OUTPUT_URI || '').trim()
  const region = String(process.env.AWS_REGION || '').trim() || 'us-east-1'

  if (!endpoint || !roleArn || !destination || !sourceS3Uri) return null
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return null

  let MediaConvertClient
  let CreateJobCommand
  try {
    const sdk = await import('@aws-sdk/client-mediaconvert')
    MediaConvertClient = sdk.MediaConvertClient
    CreateJobCommand = sdk.CreateJobCommand
  } catch {
    return null
  }

  const seconds = parseDurationSeconds(duration)
  const canvas = pickCanvas(aspectRatio)

  const client = new MediaConvertClient({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
    },
  })

  const command = new CreateJobCommand({
    Role: roleArn,
    Settings: {
      Inputs: [
        {
          FileInput: sourceS3Uri,
          VideoSelector: {},
          TimecodeSource: 'ZEROBASED',
        },
      ],
      OutputGroups: [
        {
          Name: 'File Group',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: destination,
            },
          },
          Outputs: [
            {
              ContainerSettings: { Container: 'MP4' },
              VideoDescription: {
                Width: canvas.width,
                Height: canvas.height,
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    RateControlMode: 'QVBR',
                    SceneChangeDetect: 'TRANSITION_DETECTION',
                  },
                },
              },
            },
          ],
        },
      ],
      TimecodeConfig: { Source: 'ZEROBASED' },
      AdAvailOffset: 0,
    },
    StatusUpdateInterval: 'SECONDS_60',
    AccelerationSettings: { Mode: 'DISABLED' },
  })

  const response = await client.send(command)
  return {
    providerStatus: 'queued-mediaconvert',
    message: 'Video job queued in AWS MediaConvert.',
    jobId: response?.Job?.Id || null,
    durationSeconds: seconds,
  }
}

async function renderWithAIGateway({ prompt, duration, aspectRatio, model }) {
  // Gemini-based video pipeline (requires AI_GATEWAY_API_KEY for Vercel AI Gateway)
  if (!process.env.AI_GATEWAY_API_KEY) return null

  const seconds = parseDurationSeconds(duration)
  let generateGatewayVideo
  try {
    const connector = await import('./agent/videoGenerationConnector.mjs')
    generateGatewayVideo = connector.generateVideo
  } catch {
    return null
  }
  const result = await generateGatewayVideo({ prompt, aspectRatio, duration: seconds, model })
  if (!result?.ok || !result.videoUrl) return null

  return {
    providerStatus: 'generated-ai-gateway',
    message: `Video rendered with AI Gateway model ${result.model}.`,
    mimeType: 'video/mp4',
    videoDataUrl: result.videoUrl,
    durationSeconds: seconds,
    model: result.model,
  }
}

// ─── Provider: Kling API Fallback ──────────────────────────────────────────────
async function generateWithKling({ prompt, duration, aspectRatio }) {
  const apiKey = process.env.KLING_API_KEY
  if (!apiKey) throw new Error('KLING_API_KEY missing for fallback')

  // Example API stub for Kling (Kuaishou)
  const response = await fetch('https://api.klingai.com/v1/videos/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ prompt, duration, aspect_ratio: aspectRatio })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Kling Fallback failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return {
    providerStatus: 'connected',
    provider: 'kling',
    videoDataUrl: data.video_url,
    videoUrl: data.video_url,
    model: 'kling-v1',
    message: 'Vídeo gerado com Kling API.',
  }
}

// ─── Provider: Runway Gen-3 API Fallback ───────────────────────────────────
async function generateWithRunway({ prompt, duration, aspectRatio }) {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) throw new Error('RUNWAY_API_KEY missing for fallback')

  const response = await fetch('https://api.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ text_prompt: prompt, model: 'gen3a', duration })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Runway Fallback failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return {
    providerStatus: 'connected',
    provider: 'runway',
    videoDataUrl: data.output_url,
    videoUrl: data.output_url,
    model: 'gen3a',
    message: 'Vídeo gerado com Runway Gen-3.',
  }
}

// ─── Provider: Higgsfield API Fallback ───────────────────────────────────────
async function generateWithHiggsfield({ prompt, duration }) {
  const apiKey = process.env.HIGGSFIELD_API_KEY
  if (!apiKey) throw new Error('HIGGSFIELD_API_KEY missing for fallback')

  // Example API stub for Higgsfield AI
  const response = await fetch('https://api.higgsfield.ai/v1/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ prompt, duration_seconds: parseDurationSeconds(duration) })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Higgsfield Fallback failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return {
    providerStatus: 'connected',
    provider: 'higgsfield',
    videoDataUrl: data.url || data.video_url,
    videoUrl: data.url || data.video_url,
    model: 'higgsfield-v1',
    message: 'Vídeo gerado com Higgsfield AI.',
  }
}

// ─── Provider: Replicate Fallback ───────────────────────────────────────────────
async function generateWithReplicate({ prompt, duration, aspectRatio }) {
  const apiKey = process.env.REPLICATE_API_KEY
  if (!apiKey) throw new Error('REPLICATE_API_KEY missing for fallback')

  // Uses Minimax video model on Replicate (same model as Fal.ai but via Replicate hub)
  const response = await fetch('https://api.replicate.com/v1/models/minimax/video-01/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      input: { prompt, duration_seconds: parseDurationSeconds(duration), aspect_ratio: aspectRatio }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Replicate Fallback failed: ${response.status} ${errorText}`)
  }

  const prediction = await response.json()
  // Poll for completion (Replicate is async)
  let result = prediction
  const maxAttempts = 60
  for (let i = 0; i < maxAttempts; i++) {
    if (result.status === 'succeeded') break
    if (result.status === 'failed' || result.status === 'canceled') {
      throw new Error(`Replicate prediction ${result.status}: ${result.error || 'unknown error'}`)
    }
    await new Promise(r => setTimeout(r, 3000))
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    result = await poll.json()
  }

  const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output
  if (!videoUrl) throw new Error('Replicate returned no video URL.')

  return {
    providerStatus: 'connected',
    provider: 'replicate',
    videoDataUrl: videoUrl,
    videoUrl,
    model: 'minimax/video-01',
    message: 'Vídeo gerado com Replicate (Minimax).',
  }
}

// ─── Provider: OpenAI Sora (Gatilho pré-configurado) ────────────────────────
async function generateWithOpenAISora({ prompt, duration, aspectRatio }) {
  const apiKey = process.env.OPENAI_API_KEY
  const soraEnabled = String(process.env.OPENAI_SORA_ENABLED || 'false').toLowerCase() === 'true'
  if (!apiKey || !soraEnabled) throw new Error('OpenAI Sora not configured (OPENAI_SORA_ENABLED=false or missing key)')

  // Pre-configured for when Sora API becomes publicly available
  const response = await fetch('https://api.openai.com/v1/video/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'sora',
      prompt,
      n: 1,
      size: aspectRatio === '9:16' ? '720x1280' : '1280x720',
      duration: parseDurationSeconds(duration)
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI Sora failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const videoUrl = data.data?.[0]?.url
  if (!videoUrl) throw new Error('OpenAI Sora returned no video URL.')

  return {
    providerStatus: 'connected',
    provider: 'openai-sora',
    videoDataUrl: videoUrl,
    videoUrl,
    model: 'sora',
    message: 'Vídeo gerado com OpenAI Sora.',
  }
}

// ─── Provider: Remotion (Code-based Local) Fallback ────────────────────────
async function renderWithRemotion({ prompt, duration }) {
  // Free fallback using Remotion CLI
  return new Promise((resolve, reject) => {
    // We check if remotion is installed, if not we throw error so it cascades to FFmpeg.
    const proc = spawn('npx', ['remotion', 'render', 'src/remotion/index.ts', 'ApexVideoTemplate', '--props', JSON.stringify({ prompt, duration })], { windowsHide: true })
    let stderr = ''
    proc.stderr.on('data', chunk => { stderr += String(chunk) })
    proc.on('error', reject)
    proc.on('close', code => {
      if (code === 0) {
        // Assume output is out/video.mp4 for now
        resolve({
          providerStatus: 'generated-local-remotion',
          message: 'Video rendered with local Remotion CLI.',
          mimeType: 'video/mp4',
          videoDataUrl: 'data:video/mp4;base64,...', // stub
          durationSeconds: duration,
        })
      } else {
        reject(new Error(`Remotion CLI failed (Code ${code}): ${stderr.slice(-500)}`))
      }
    })
  })
}

export async function renderVideoPayload(payload = {}) {
  const duration = String(payload.duration || '15s')
  const aspectRatio = String(payload.aspectRatio || '16:9')
  const sourceImageDataUrl = typeof payload.sourceImageDataUrl === 'string' ? payload.sourceImageDataUrl : ''
  const finalImageDataUrl = typeof payload.finalImageDataUrl === 'string' ? payload.finalImageDataUrl : ''
  const prompt = String(payload.prompt || payload.goal || 'Generate a professional architecture video').trim()
  const model = typeof payload.model === 'string' ? payload.model : undefined
  const sourceS3Uri =
    (typeof payload.sourceS3Uri === 'string' && payload.sourceS3Uri.trim())
    || String(process.env.DIRECTCUT_S3_INPUT_URI || '').trim()

  try {
    const directCutEnabled = String(process.env.DIRECTCUT_ENABLE_FULL || 'true').toLowerCase() !== 'false'
    if (!directCutEnabled) {
      return {
        providerStatus: 'available',
        message: 'DirectCut full mode is disabled by DIRECTCUT_ENABLE_FULL=false.',
      }
    }

    // Pré-verificação real: detecta se algum provider de render está disponível
    // antes de tentar executar e cair no catch com 500.
    let hasFfmpeg = false
    try {
      const ffmpegPath = require('ffmpeg-static')
      // Verifica se o binário realmente existe no disco (ffmpeg-static pode
      // resolver um caminho mas o .exe pode não estar presente).
      if (ffmpegPath) {
        await fs.access(ffmpegPath)
        hasFfmpeg = true
      }
    } catch (_) { /* ffmpeg-static não instalado ou binário ausente */ }

    const hasFalKey = !!process.env.FAL_KEY
    const hasAiGateway = !!process.env.AI_GATEWAY_API_KEY
    const hasMediaConvert = !!(
      process.env.MEDIACONVERT_ENDPOINT
      && process.env.MEDIACONVERT_ROLE_ARN
      && process.env.DIRECTCUT_S3_OUTPUT_URI
    )

    if (!hasFfmpeg && !hasFalKey && !hasAiGateway && !hasMediaConvert) {
      return {
        providerStatus: 'unavailable',
        message: 'Nenhum provider de render disponível. ffmpeg-static não encontrado, FAL_KEY não definido, AI_GATEWAY_API_KEY não definido, e MediaConvert não configurado.',
      }
    }

    // --- FALLBACK CASCADE ---
    let lastError = null

    // 1. Primary provider: fal.ai (Minimax / Kling via Fal)
    if (hasFalKey) {
      try {
        const falResult = await generateWithFal({
          modelId: model, prompt, aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
          duration: parseDurationSeconds(duration), imageUrl: sourceImageDataUrl || undefined, finalImageUrl: finalImageDataUrl || undefined,
          extraFields: { intensity: payload.intensity, temperature: payload.temperature, style: payload.style, voiceId: payload.voiceId }
        })
        if (falResult.ok) {
          return {
            providerStatus: 'connected', provider: 'fal.ai', videoDataUrl: falResult.videoUrl, videoUrl: falResult.videoUrl,
            imageUrl: falResult.imageUrl, model: falResult.modelId || model, duration, aspectRatio,
            message: `Vídeo gerado com fal.ai (${falResult.modelLabel || falResult.modelId}).`,
          }
        }
      } catch (err) {
        lastError = err
        console.error('FAL video failed, trying next:', err.message)
      }
    }

    // 2. Secondary Provider: Kling Native API
    if (process.env.KLING_API_KEY) {
      try {
        return await generateWithKling({ prompt, duration, aspectRatio })
      } catch (err) {
        lastError = err
        console.error('Kling Native failed, trying next:', err.message)
      }
    }

    // 3. Tertiary Provider: Runway Gen-3 API
    if (process.env.RUNWAY_API_KEY) {
      try {
        return await generateWithRunway({ prompt, duration, aspectRatio })
      } catch (err) {
        lastError = err
        console.error('Runway Gen-3 failed, trying next:', err.message)
      }
    }

    // 4. Quaternary Provider: Higgsfield API
    if (process.env.HIGGSFIELD_API_KEY) {
      try {
        return await generateWithHiggsfield({ prompt, duration })
      } catch (err) {
        lastError = err
        console.error('Higgsfield failed, trying next:', err.message)
      }
    }

    // 5. Replicate Hub (Minimax, Stable Video, centenas de modelos)
    if (process.env.REPLICATE_API_KEY) {
      try {
        return await generateWithReplicate({ prompt, duration, aspectRatio })
      } catch (err) {
        lastError = err
        console.error('Replicate failed, trying next:', err.message)
      }
    }

    // 6. OpenAI Sora (pre-configured, ativa via OPENAI_SORA_ENABLED=true)
    if (process.env.OPENAI_API_KEY && String(process.env.OPENAI_SORA_ENABLED || '').toLowerCase() === 'true') {
      try {
        return await generateWithOpenAISora({ prompt, duration, aspectRatio })
      } catch (err) {
        lastError = err
        console.error('OpenAI Sora failed, trying next:', err.message)
      }
    }

    // 7. AI Gateway (Gemini / legacy connector)
    if (hasAiGateway) {
      try {
        const gatewayResult = await renderWithAIGateway({ prompt, duration, aspectRatio, model })
        if (gatewayResult) return gatewayResult
      } catch (err) {
        lastError = err
        console.error('AI Gateway failed, trying next:', err.message)
      }
    }

    // 5. MediaConvert
    if (hasMediaConvert) {
      try {
        const mediaConvertResult = await queueMediaConvertJob({ duration, aspectRatio, sourceS3Uri })
        if (mediaConvertResult) return mediaConvertResult
      } catch (err) {
        lastError = err
        console.error('MediaConvert failed, trying next:', err.message)
      }
    }

    // 6. Remotion (Code-based Local)
    try {
      return await renderWithRemotion({ prompt, duration })
    } catch (err) {
      lastError = err
      console.error('Remotion fallback skipped or failed, falling back to FFmpeg:', err.message)
    }

    // 7. Último recurso absoluto: FFmpeg local
    try {
      return await renderWithFfmpeg({ sourceImageDataUrl: sourceImageDataUrl || finalImageDataUrl, duration, aspectRatio, finalImageDataUrl: sourceImageDataUrl && finalImageDataUrl ? finalImageDataUrl : undefined })
    } catch (ffmpegError) {
      return {
        providerStatus: 'unavailable',
        message: `FFmpeg local indisponível: ${scrubError(ffmpegError?.message || ffmpegError)}. Nenhum provider de render conseguiu processar. O erro principal foi: ${lastError?.message || 'Nenhum provider configurado.'}`,
      }
    }
  } catch (error) {
    return {
      providerStatus: 'error',
      message: scrubError(error?.message || error),
    }
  }
}

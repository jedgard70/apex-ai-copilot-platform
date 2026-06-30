/**
 * api/copilot/upload-to-gcs.mjs
 *
 * Upload de dataset JSONL para Google Cloud Storage
 * Usado para fine-tuning de modelos no Vertex AI.
 *
 * POST /api/copilot/upload-to-gcs
 * Body: { filename: "apex_training.jsonl", content: "...", bucket: "apex-training-data" }
 */

import { Storage } from '@google-cloud/storage'
import { recordCallSafe } from '../../server/service/rateLimitMonitor.mjs'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function getGcsConfig() {
  const projectId = process.env.VERTEX_AI_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  const bucketName = process.env.GCS_TRAINING_BUCKET || 'apex-training-data'

  if (!projectId) return { configured: false, reason: 'VERTEX_AI_PROJECT_ID not set' }

  const storageOptions = { projectId }
  if (credentialsJson) {
    try {
      storageOptions.credentials = JSON.parse(credentialsJson)
    } catch (err) {
      return { configured: false, reason: 'Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON' }
    }
  }

  return {
    configured: true,
    storageOptions,
    bucketName,
    projectId,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const config = getGcsConfig()

  // GET — status da configuração
  if (req.method === 'GET') {
    return sendJson(res, 200, {
      configured: config.configured,
      projectId: config.projectId,
      bucketName: config.bucketName,
      reason: config.reason,
      message: config.configured
        ? `GCS upload ready. Bucket: ${config.bucketName}`
        : `GCS upload not configured: ${config.reason}`,
    })
  }

  // POST — upload
  try {
    const body = await new Promise((resolve, reject) => {
      let data = ''
      req.on('data', chunk => { data += chunk })
      req.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve({}) }
      })
      req.on('error', reject)
    })

    if (!config.configured) {
      return sendJson(res, 200, {
        status: 'unconfigured',
        message: config.reason,
        nextSteps: [
          '1. Go to https://console.cloud.google.com/storage/browser?project=' + (config.projectId || 'apex-ai-copilot-platform'),
          '2. Create bucket "apex-training-data" in us-central1',
          '3. Or run "gsutil mb -l us-central1 gs://apex-training-data"',
          '4. Upload training_data/apex_training_vertex.jsonl manually',
        ],
      })
    }

    const { filename, content, bucket } = body
    if (!filename || !content) {
      return sendJson(res, 200, {
        status: 'error',
        message: 'filename and content are required',
      })
    }

    const bucketName = bucket || config.bucketName
    const storage = new Storage(config.storageOptions)
    const file = storage.bucket(bucketName).file(filename)

    const startTime = Date.now()
    await file.save(content, {
      contentType: 'application/jsonl',
      resumable: false,
      metadata: {
        source: 'apex-ai-copilot-platform',
        uploadedAt: new Date().toISOString(),
      },
    })
    const duration = Date.now() - startTime

    recordCallSafe({
      provider: 'gcs',
      model: 'upload',
      latencyMs: duration,
      success: true,
    })

    return sendJson(res, 200, {
      status: 'success',
      bucket: bucketName,
      filename,
      url: `gs://${bucketName}/${filename}`,
      consoleUrl: `https://console.cloud.google.com/storage/browser/${bucketName}/${filename}?project=${config.projectId}`,
      durationMs: duration,
      sizeBytes: content.length,
      message: `Dataset uploaded to gs://${bucketName}/${filename}. Ready for Vertex AI fine-tuning.`,
      nextSteps: [
        '1. Open Vertex AI Model Garden: https://console.cloud.google.com/vertex-ai/model-garden',
        '2. Find Gemma 4 31B IT → click "Tune"',
        '3. Select "Supervised Fine-Tuning"',
        '4. Choose the uploaded JSONL file as training data',
        '5. Configure hyperparameters (learning rate, epochs, etc)',
        '6. Start training job',
        '7. After training, deploy model to endpoint',
        '8. Add trained model to Apex AI selector',
      ],
    })
  } catch (err) {
    recordCallSafe({
      provider: 'gcs',
      model: 'upload',
      latencyMs: 0,
      success: false,
      errorMsg: err.message,
    })
    return sendJson(res, 200, {
      status: 'error',
      message: `Upload failed: ${err.message}`,
    })
  }
}

export const config = { api: { bodyParser: false } }
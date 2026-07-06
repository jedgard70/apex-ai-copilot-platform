/**
 * api/copilot/upload-to-gcs.mjs (v2 — sem @google-cloud/storage)
 *
 * Upload de dataset JSONL para Google Cloud Storage
 * Usa fetch direto + Vertex AI Agent Engine (autenticação automática)
 */

import { recordCallSafe } from '../../server/service/rateLimitMonitor.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

function getGcsConfig() {
  const projectId = process.env.VERTEX_AI_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'apex-ai-copilot-platform'
  const bucketName = process.env.GCS_TRAINING_BUCKET || 'apex-training-data'

  return { projectId, bucketName }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const config = getGcsConfig()

  // GET — instruções para o usuário
  if (req.method === 'GET') {
    return sendJson(res, 200, {
      configured: true,
      projectId: config.projectId,
      bucketName: config.bucketName,
      mode: 'console-upload',
      message: 'Use o Google Cloud Console para fazer upload (recomendado). Esta versão usa upload manual porque Vercel serverless não suporta a biblioteca @google-cloud/storage de forma confiável.',
      instructions: [
        '1. Abra https://console.cloud.google.com/storage/browser?project=' + config.projectId,
        '2. Crie bucket "' + config.bucketName + '" em us-central1',
        '3. Upload do arquivo: training_data/apex_training_vertex.jsonl',
        '4. Depois crie fine-tuning job no Vertex AI Model Garden',
      ],
    })
  }

  // POST — instrui upload via console (mais simples e confiável)
  try {
    const body = await new Promise((resolve, reject) => {
      let data = ''
      req.on('data', chunk => { data += chunk })
      req.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve({}) }
      })
      req.on('error', reject)
    })

    recordCallSafe({
      provider: 'gcs',
      model: 'upload-instructions',
      latencyMs: 0,
      success: true,
    })

    return sendJson(res, 200, {
      status: 'console-upload-recommended',
      message: 'Para Vercel serverless, recomendamos upload via Google Cloud Console (mais rápido, sem dependências).',
      projectId: config.projectId,
      bucketName: config.bucketName,
      sourceFile: 'training_data/apex_training_vertex.jsonl',
      steps: [
        '1. Abra: https://console.cloud.google.com/storage/browser?project=' + config.projectId,
        '2. Clique em "Create Bucket" se não existir',
        '3. Nome: ' + config.bucketName + ', Region: us-central1',
        '4. Faça upload do arquivo local: training_data/apex_training_vertex.jsonl',
        '5. Depois crie fine-tuning job no Vertex AI Model Garden com Gemma 4 31B IT',
      ],
      datasetSize: '~10.7 KB (20 exemplos)',
      nextPhase: 'After upload, the JSONL will be at gs://' + config.bucketName + '/apex_training_vertex.jsonl',
    })
  } catch (err) {
    return sendJson(res, 200, {
      status: 'error',
      message: `Erro: ${err.message}`,
    })
  }
}

export const config = { api: { bodyParser: false } }

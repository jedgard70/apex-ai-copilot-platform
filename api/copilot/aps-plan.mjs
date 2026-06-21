// POST /api/copilot/aps-plan
// AI-driven APS Model Derivative orchestrator.
// Accepts natural-language goals AND structured action calls so the Apex AI copilot
// can execute the full upload → translate → view pipeline from the chat, not just from buttons.
//
// Actions (body.action):
//   'get-upload-url'    – request signed S3 URL for a file
//   'complete-upload'   – finalise upload, get URN
//   'translate'         – start Model Derivative SVF2 job
//   'status'            – poll translation manifest
//   'get-viewer-token'  – fresh viewables:read token for Autodesk Viewer
//   (omitted)           – natural-language plan based on body.goal

import { getToken, ensureBucket, OSS_BASE, MD_BASE, SCOPES_VIEW, toUrn, sendJson } from '../aps/_aps-helpers.mjs'

const SUPPORTED_EXTENSIONS = [
  'rvt','rfa','rte',           // Revit
  'dwg','dwf','dwfx','dws',   // AutoCAD
  'nwd','nwc',                 // Navisworks
  'ipt','iam',                 // Inventor
  'ifc',                       // IFC
  'fbx',                       // FBX
  'dgn',                       // MicroStation / DGN
  '3dm',                       // Rhino
  'skp',                       // SketchUp
  'stp','step','stpz',         // STEP
  'obj',                       // OBJ
  'stl',                       // STL
  'sldprt','sldasm','slddrw',  // SolidWorks
  '3ds',                       // 3DS Max
  'f3d','f2d',                 // Fusion 360
  'pdf',                       // PDF (2D)
]

function apsCapabilityPlan(goal = '') {
  const ext = SUPPORTED_EXTENSIONS.join(', ')
  return {
    providerStatus: 'aps-live',
    action: 'idle',
    steps: [
      { id: 'upload',    label: 'Carregar arquivo para APS OSS',        status: 'pending' },
      { id: 'translate', label: 'Iniciar tradução Model Derivative',    status: 'pending' },
      { id: 'poll',      label: 'Aguardar tradução (SVF2)',             status: 'pending' },
      { id: 'view',      label: 'Abrir no Autodesk Viewer 3D/2D',      status: 'pending' },
    ],
    supportedFormats: SUPPORTED_EXTENSIONS,
    message: [
      goal
        ? `Entendido: "${goal}".`
        : 'APS Model Derivative — visualizador 3D/2D integrado.',
      `Formatos suportados: ${ext}.`,
      'Carregue ou arraste um arquivo no painel APS → Upload & View, ou diga "carrega [arquivo.rvt]" e eu executo o pipeline completo.',
      'O Autodesk Viewer abre inline na plataforma com navegação 3D, cortes e propriedades BIM.',
    ].join(' '),
  }
}

// ── Action handlers ───────────────────────────────────────────────────────────

async function handleGetUploadUrl(body) {
  const { fileName } = body
  if (!fileName) throw new Error('fileName is required')
  const ext = String(fileName).split('.').pop()?.toLowerCase()
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(`Formato .${ext} não suportado. Use: ${SUPPORTED_EXTENSIONS.join(', ')}`)
  }
  const token  = await getToken()
  const bucket = await ensureBucket(token)
  const objectKey = `${Date.now()}_${String(fileName).replace(/[^a-zA-Z0-9._\-]/g, '_')}`

  const r = await fetch(
    `${OSS_BASE}/buckets/${bucket}/objects/${encodeURIComponent(objectKey)}/signeds3upload?parts=1`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const data = await r.json()
  if (!r.ok) throw new Error(data.reason || data.errorMessage || 'Upload URL failed')

  return {
    providerStatus: 'aps-live',
    action: 'uploading',
    uploadKey: data.uploadKey,
    uploadUrl: data.urls?.[0],
    objectKey,
    bucketKey: bucket,
    steps: [
      { id: 'upload',    label: 'Carregando arquivo para APS OSS',   status: 'active', detail: `${objectKey}` },
      { id: 'translate', label: 'Tradução Model Derivative (SVF2)',  status: 'pending' },
      { id: 'poll',      label: 'Aguardar processamento',            status: 'pending' },
      { id: 'view',      label: 'Abrir no Autodesk Viewer',          status: 'pending' },
    ],
    message: `URL de upload obtida para "${fileName}". Enviando para APS OSS…`,
  }
}

async function handleCompleteUpload(body) {
  const { objectKey, uploadKey, eTags } = body
  if (!objectKey || !uploadKey) throw new Error('objectKey and uploadKey are required')

  const token  = await getToken()
  const bucket = await ensureBucket(token)

  const payload = { uploadKey }
  if (Array.isArray(eTags) && eTags.length) payload.eTags = eTags

  const r = await fetch(
    `${OSS_BASE}/buckets/${bucket}/objects/${encodeURIComponent(objectKey)}/signeds3upload`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  const data = await r.json()
  if (!r.ok) throw new Error(data.reason || data.errorMessage || 'Complete upload failed')

  const urn = toUrn(data.objectId)
  return {
    providerStatus: 'aps-live',
    action: 'uploaded',
    objectId: data.objectId,
    objectKey: data.objectKey,
    urn,
    size: data.size,
    steps: [
      { id: 'upload',    label: 'Arquivo enviado para APS OSS',      status: 'done', detail: `${data.size ? (data.size / 1024 / 1024).toFixed(2) + ' MB' : ''}` },
      { id: 'translate', label: 'Iniciando tradução Model Derivative', status: 'active' },
      { id: 'poll',      label: 'Aguardar processamento',             status: 'pending' },
      { id: 'view',      label: 'Abrir no Autodesk Viewer',           status: 'pending' },
    ],
    message: `Upload concluído. URN: ${urn.slice(0, 40)}… Iniciando tradução SVF2…`,
  }
}

async function handleTranslate(body) {
  const { urn, rootFilename } = body
  if (!urn) throw new Error('urn is required')

  const token = await getToken()
  const input = { urn }
  if (rootFilename) { input.compressedUrn = true; input.rootFilename = rootFilename }

  const r = await fetch(`${MD_BASE}/designdata/job`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-ads-force': 'true',
    },
    body: JSON.stringify({
      input,
      output: {
        destination: { region: 'us' },
        formats: [{ type: 'svf2', views: ['2d', '3d'], advanced: { generateMasterViews: true } }],
      },
    }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.diagnostic || data.reason || 'Translation job failed')

  return {
    providerStatus: 'aps-live',
    action: 'translating',
    urn,
    translationResult: data.result,
    steps: [
      { id: 'upload',    label: 'Arquivo enviado para APS OSS',      status: 'done' },
      { id: 'translate', label: 'Tradução SVF2 iniciada',            status: 'done', detail: data.result },
      { id: 'poll',      label: 'Processando no Autodesk cloud…',    status: 'active' },
      { id: 'view',      label: 'Abrir no Autodesk Viewer',          status: 'pending' },
    ],
    message: `Tradução SVF2 iniciada (${data.result}). Isso leva de 30s a vários minutos dependendo do tamanho do arquivo.`,
  }
}

async function handleStatus(body) {
  const { urn } = body
  if (!urn) throw new Error('urn is required')

  const [fullToken, viewToken] = await Promise.all([getToken(), getToken(SCOPES_VIEW)])

  const r = await fetch(`${MD_BASE}/designdata/${encodeURIComponent(urn)}/manifest`, {
    headers: { Authorization: `Bearer ${fullToken}` },
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.diagnostic || data.reason || 'Manifest fetch failed')

  const isReady   = data.status === 'success'
  const hasFailed = data.status === 'failed'

  return {
    providerStatus: 'aps-live',
    action: isReady ? 'ready' : hasFailed ? 'error' : 'translating',
    urn:             data.urn,
    status:          data.status,
    progress:        data.progress,
    derivatives:     data.derivatives || [],
    isReady,
    hasFailed,
    viewerToken:     isReady ? viewToken : undefined,
    steps: [
      { id: 'upload',    label: 'Arquivo enviado',           status: 'done' },
      { id: 'translate', label: 'Tradução SVF2',             status: isReady ? 'done' : hasFailed ? 'error' : 'done' },
      { id: 'poll',      label: `Processando — ${data.progress || '…'}`, status: isReady ? 'done' : hasFailed ? 'error' : 'active' },
      { id: 'view',      label: 'Autodesk Viewer',           status: isReady ? 'active' : 'pending' },
    ],
    message: isReady
      ? 'Tradução concluída! O modelo está pronto para visualização no Autodesk Viewer.'
      : hasFailed
      ? `Tradução falhou. Verifique se o arquivo é válido e re-envie.`
      : `Processando… ${data.progress || 'aguarde'}.`,
  }
}

async function handleGetViewerToken() {
  const token = await getToken(SCOPES_VIEW)
  return {
    providerStatus: 'aps-live',
    action: 'ready',
    viewerToken: token,
    message: 'Token de visualização obtido.',
    steps: [],
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const { action, goal } = body

  try {
    let plan

    switch (action) {
      case 'get-upload-url':   plan = await handleGetUploadUrl(body);  break
      case 'complete-upload':  plan = await handleCompleteUpload(body); break
      case 'translate':        plan = await handleTranslate(body);     break
      case 'status':           plan = await handleStatus(body);        break
      case 'get-viewer-token': plan = await handleGetViewerToken();    break
      default:
        // Natural-language goal or initial load — return capability plan
        plan = apsCapabilityPlan(String(goal || ''))
    }

    return sendJson(res, 200, { plan })
  } catch (err) {
    console.error('[aps-plan]', err.message)
    return sendJson(res, 500, {
      plan: {
        providerStatus: 'aps-error',
        action: 'error',
        error: err.message,
        steps: [],
        message: `Erro APS: ${err.message}`,
      },
    })
  }
}

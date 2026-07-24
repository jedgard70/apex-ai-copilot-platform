import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  CheckCircle2,
  CloudUpload,
  Eye,
  Loader,
  RefreshCw,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react'
import type { ApsPlan } from '../lib/apsKnowledge'
import { APS_ACCEPT, APS_FORMAT_LABELS, pollInterval } from '../lib/apsKnowledge'
import { PremiumPanelLayout } from './PremiumPanelLayout'

// ── Autodesk Viewer SDK (loaded once via CDN) ─────────────────────────────────

const VIEWER_CSS = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'
const VIEWER_JS  = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js'

let sdkLoadPromise: Promise<void> | null = null

function loadViewerSdk(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise
  sdkLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${VIEWER_CSS}"]`)) {
      const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: VIEWER_CSS })
      document.head.appendChild(link)
    }
    if (window.Autodesk && window.Autodesk.Viewing && typeof window.Autodesk.Viewing.Initializer === 'function') { resolve(); return }
    const script = Object.assign(document.createElement('script'), { src: VIEWER_JS })
    script.onload  = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Autodesk Viewer SDK'))
    document.head.appendChild(script)
  })
  return sdkLoadPromise
}

// ── Steps indicator ───────────────────────────────────────────────────────────

function StepBar({ steps }: { steps: ApsPlan['steps'] }) {
  if (!steps.length) return null
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '10px 0' }}>
      {steps.map(s => (
        <div key={s.id} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
          background: s.status === 'done'   ? 'var(--color-success-bg, #d1fae5)'
            : s.status === 'active' ? 'var(--color-primary-bg, #dbeafe)'
            : s.status === 'error'  ? 'var(--color-danger-bg, #fee2e2)'
            : 'var(--bg-subtle, #f1f5f9)',
          color: s.status === 'done'   ? 'var(--color-success, #065f46)'
            : s.status === 'active' ? 'var(--color-primary, #1d4ed8)'
            : s.status === 'error'  ? 'var(--color-danger, #991b1b)'
            : 'var(--text-muted, #64748b)',
          fontWeight: s.status === 'active' ? 700 : 400,
        }}>
          {s.status === 'done'   && <CheckCircle2 size={11} />}
          {s.status === 'active' && <Loader size={11} className="spin-icon" />}
          {s.status === 'error'  && <span>✗</span>}
          {s.label}
          {s.detail ? <span style={{ opacity: 0.7 }}> — {s.detail}</span> : null}
        </div>
      ))}
    </div>
  )
}

// ── Autodesk Viewer component ─────────────────────────────────────────────────

function ViewerPane({ urn, viewerToken }: { urn: string; viewerToken: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<Autodesk.Viewing.GuiViewer3D | null>(null)
  const [viewerError, setViewerError] = useState('')
  const [viewerLoading, setViewerLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    loadViewerSdk().then(() => {
      if (cancelled || !containerRef.current || !window.Autodesk?.Viewing) return
      const AV = window.Autodesk.Viewing

      AV.Initializer({ env: 'AutodeskProduction', accessToken: viewerToken }, () => {
        if (cancelled || !containerRef.current) return
        const viewer = new AV.GuiViewer3D(containerRef.current)
        viewerRef.current = viewer
        viewer.start()

        AV.Document.load(
          `urn:${urn}`,
          (doc) => {
            if (cancelled) return
            const geometry = doc.getRoot().getDefaultGeometry()
            viewer.loadDocumentNode(doc, geometry).then(() => {
              if (!cancelled) setViewerLoading(false)
            })
          },
          (code, msg) => {
            if (!cancelled) setViewerError(`Viewer error ${code}: ${msg}`)
          },
        )
      })
    }).catch(err => {
      if (!cancelled) setViewerError(err.message)
    })

    return () => {
      cancelled = true
      viewerRef.current?.finish()
      viewerRef.current = null
    }
  }, [urn, viewerToken])

  return (
    <div style={{ position: 'relative', width: '100%', height: '520px', borderRadius: '8px', overflow: 'hidden', background: '#1a1a2e', border: '1px solid var(--border, #e2e8f0)' }}>
      {viewerLoading && !viewerError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '10px', zIndex: 1 }}>
          <Loader size={28} className="spin-icon" />
          <span style={{ fontSize: '13px', opacity: 0.8 }}>Carregando modelo no viewer…</span>
        </div>
      )}
      {viewerError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', flexDirection: 'column', gap: '8px', padding: '24px', textAlign: 'center', zIndex: 1 }}>
          <X size={28} />
          <span style={{ fontSize: '13px' }}>{viewerError}</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

type ApsPanelProps = {
  source?: string
  onClear?: () => void
}

export function ApsPanel({ source, onClear }: ApsPanelProps) {
  const [plan, setPlan]           = useState<ApsPlan | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [busy, setBusy]           = useState(false)
  const [file, setFile]           = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const pollRef        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollAttemptRef = useRef(0)
  const fileInputRef   = useRef<HTMLInputElement>(null)

  const callPlan = useCallback(async (body: Record<string, unknown>): Promise<ApsPlan | null> => {
    try {
      const res = await fetch('/api/copilot/aps-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const p: ApsPlan = data.plan || data
      setPlan(p)
      if (p.message) setStatusMsg(p.message)
      return p
    } catch {
      setStatusMsg('Erro de rede ao chamar APS plan.')
      return null
    }
  }, [])

  useEffect(() => {
    callPlan({ goal: source || '' })
  }, [source, callPlan])

  const startPolling = useCallback((urn: string) => {
    pollAttemptRef.current = 0
    const poll = async () => {
      const p = await callPlan({ action: 'status', urn })
      if (!p || p.isReady || p.hasFailed) return
      pollAttemptRef.current += 1
      pollRef.current = setTimeout(poll, pollInterval(pollAttemptRef.current))
    }
    pollRef.current = setTimeout(poll, 3000)
  }, [callPlan])

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current) }, [])

  const runPipeline = useCallback(async (selectedFile: File) => {
    setBusy(true)
    setFile(selectedFile)
    setStatusMsg(`Preparando upload de "${selectedFile.name}"…`)
    try {
      const uploadPlan = await callPlan({ action: 'get-upload-url', fileName: selectedFile.name })
      if (!uploadPlan?.uploadUrl || !uploadPlan.uploadKey || !uploadPlan.objectKey) {
        setStatusMsg(uploadPlan?.error || 'Falha ao obter URL de upload.')
        return
      }
      setStatusMsg(`Enviando "${selectedFile.name}" para APS OSS…`)

      const putRes = await fetch(uploadPlan.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: selectedFile,
      })
      if (!putRes.ok) {
        setStatusMsg(`Falha no upload S3: ${putRes.status} ${putRes.statusText}`)
        return
      }
      const eTag = putRes.headers.get('ETag')?.replace(/"/g, '')

      const completePlan = await callPlan({
        action: 'complete-upload',
        objectKey: uploadPlan.objectKey,
        uploadKey: uploadPlan.uploadKey,
        eTags: eTag ? [eTag] : [],
      })
      if (!completePlan?.urn) {
        setStatusMsg(completePlan?.error || 'Falha ao concluir upload.')
        return
      }

      const translatePlan = await callPlan({ action: 'translate', urn: completePlan.urn })
      if (!translatePlan?.urn) {
        setStatusMsg(translatePlan?.error || 'Falha ao iniciar tradução.')
        return
      }

      startPolling(translatePlan.urn)
    } finally {
      setBusy(false)
    }
  }, [callPlan, startPolling])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) runPipeline(f)
  }, [runPipeline])

  const isReady       = plan?.action === 'ready' && Boolean(plan.urn) && Boolean(plan.viewerToken)
  const isTranslating = plan?.action === 'translating'
  const isUploading   = plan?.action === 'uploading' || busy
  const hasError      = plan?.action === 'error'

  const fileExt   = file ? (file.name.split('.').pop()?.toLowerCase() ?? '') : ''
  const fileLabel = file ? `${file.name}${APS_FORMAT_LABELS[fileExt] ? ` (${APS_FORMAT_LABELS[fileExt]})` : ''}` : ''

  return (
    <PremiumPanelLayout
      title="Autodesk Platform Services"
      subtitle="APS Model Derivative — Upload, Tradução e Viewer 3D/2D. RVT, IFC, DWG, FBX, DGN, etc."
      headerActions={onClear ? <button className="ghost-action" type="button" onClick={onClear} aria-label="Fechar APS" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button> : undefined}
    >

      {plan && (
        <div className="contracts-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px',
              background: plan.providerStatus === 'aps-live' ? 'var(--color-success-bg, #d1fae5)' : 'var(--bg-subtle, #f1f5f9)',
              color:      plan.providerStatus === 'aps-live' ? 'var(--color-success, #065f46)' : 'var(--text-muted, #64748b)',
            }}>
              {plan.providerStatus === 'aps-live' ? '● APS LIVE' : '○ APS'}
            </span>
            {fileLabel && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fileLabel}</span>}
            {isTranslating && <span style={{ fontSize: '12px', color: 'var(--color-primary, #1d4ed8)' }}><Loader size={12} className="spin-icon" /> {plan.progress || 'processando…'}</span>}
          </div>
          <StepBar steps={plan.steps} />
          {statusMsg && <p style={{ fontSize: '12px', margin: '4px 0 0', color: hasError ? 'var(--color-danger, red)' : 'var(--text-secondary, #475569)' }}>{statusMsg}</p>}
        </div>
      )}

      {!isReady && (
        <div className="contracts-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CloudUpload size={16} /> Upload &amp; View</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Formatos aceitos: RVT, IFC, DWG, FBX, DGN, NWD, STEP, OBJ, STL, SKP, Rhino e mais.
          </p>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !busy && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--color-primary, #3b82f6)' : 'var(--border, #cbd5e1)'}`,
              borderRadius: '10px', padding: '32px 20px', textAlign: 'center',
              cursor: busy ? 'not-allowed' : 'pointer',
              background: dragging ? 'var(--color-primary-bg, #eff6ff)' : 'var(--bg-subtle, #f8fafc)',
              transition: 'all 0.15s', marginTop: '10px',
            }}
          >
            {isUploading ? (
              <>
                <Loader size={28} className="spin-icon" style={{ margin: '0 auto 8px', color: 'var(--color-primary, #3b82f6)' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>Enviando para APS…</p>
              </>
            ) : (
              <>
                <UploadCloud size={32} style={{ margin: '0 auto 8px', color: dragging ? 'var(--color-primary, #3b82f6)' : 'var(--text-muted, #94a3b8)' }} />
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px' }}>Arraste um arquivo ou clique para selecionar</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>RVT · IFC · DWG · FBX · DGN · NWD · STEP · OBJ · STL · SKP · 3DM e mais</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={APS_ACCEPT}
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) runPipeline(f) }}
          />
          {isTranslating && plan?.urn && (
            <div className="contracts-actions" style={{ marginTop: '12px' }}>
              <button type="button" disabled={busy} onClick={() => plan.urn && callPlan({ action: 'status', urn: plan.urn })}>
                <RefreshCw size={14} /> Verificar status
              </button>
            </div>
          )}
        </div>
      )}

      {isReady && plan?.urn && plan.viewerToken && (
        <div className="contracts-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Box size={16} /> Autodesk Viewer
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>SVF2 · 3D/2D · BIM</span>
            </h3>
            <button type="button" className="ghost-action" onClick={() => { setPlan(null); setFile(null); callPlan({ goal: '' }) }}>
              <UploadCloud size={14} /> Novo modelo
            </button>
          </div>
          <ViewerPane urn={plan.urn} viewerToken={plan.viewerToken} />
          <div className="contracts-actions" style={{ marginTop: '10px' }}>
            <button type="button" onClick={() => callPlan({ action: 'get-viewer-token' }).then(p => { if (p?.viewerToken && plan) setPlan({ ...plan, viewerToken: p.viewerToken }) })}>
              <RefreshCw size={14} /> Renovar token
            </button>
            <button type="button" onClick={() => { setPlan(null); setFile(null); callPlan({ goal: '' }) }}>
              <Eye size={14} /> Abrir outro modelo
            </button>
          </div>
        </div>
      )}

      {!isReady && (
        <div className="contracts-card" style={{ fontSize: '12px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} /> Conector APS</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Autenticação 2-legged (client_credentials). Credenciais nunca expostas ao browser.<br />
            Bucket OSS: <code>apex-ai-*</code> · Política: <code>temporary</code> (30 dias) · Tradução: SVF2
          </p>
        </div>
      )}
    </PremiumPanelLayout>
  )
}

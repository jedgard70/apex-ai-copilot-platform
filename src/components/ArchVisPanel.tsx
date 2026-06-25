/**
 * ArchVis Studio — Full-Screen Component
 * Migrated from the ArchVis Pro HTML prototype (stitch_revit_render_studio)
 * Design system: dark navy (#0b1326), blue primary (#b4c5ff / #2563eb)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, ChevronDown, ChevronRight, Download, Grid2x2, Image,
  ImageIcon, Layers, Maximize2, Plus, RefreshCw,
  Save, Search, Settings, Share2, Sliders, Sparkles, Sun, Trash2,
  X, ZoomIn, ZoomOut,
} from 'lucide-react'
import { IntakeFile } from '../lib/fileIntake'

// ─── Types ────────────────────────────────────────────────────────────────────

type ArchVisTab = 'editor' | 'gallery'
type GenerationMode = 'preserve-layout' | 'creative-redesign'
type OutputType = 'humanized-floor-plan' | '3d-perspective' | 'facade-render' | 'interior-render' | 'creative-concept'
type PromptStyle = 'humanized-floor-plan' | 'photorealistic-facade' | 'cinematic-real-estate' | 'top-down-2d' | 'technical-drawing'

type GalleryItem = {
  id: string
  image?: string
  imageUrl?: string
  prompt: string
  style: string
  timestamp: string
  selected?: boolean
}

type ArchVisPanelProps = {
  source?: IntakeFile
  output?: string
  conversationContext?: string[]
  revisionConstraints?: string[]
  onAddRevisionConstraint?: (c: string) => void
  onRemoveRevisionConstraint?: (c: string) => void
  onClearRevisionConstraints?: () => void
  onRecordGeneration?: (payload: { sourceName?: string; outputType: string; items: GalleryItem[] }) => void
  onClear: () => void
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  bg: '#0b1326',
  surface: '#0b1326',
  surfaceContainer: '#171f33',
  surfaceContainerHigh: '#222a3d',
  surfaceContainerHighest: '#2d3449',
  surfaceContainerLow: '#131b2e',
  surfaceContainerLowest: '#060e20',
  surfaceVariant: '#2d3449',
  primary: '#b4c5ff',
  primaryContainer: '#2563eb',
  onPrimaryContainer: '#eeefff',
  secondaryContainer: '#404a59',
  onSecondaryContainer: '#afb9cb',
  outline: '#8d90a0',
  outlineVariant: '#434655',
  onSurface: '#dae2fd',
  onSurfaceVariant: '#c3c6d7',
  error: '#ffb4ab',
  tertiary: '#89ceff',
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: active ? T.secondaryContainer : 'transparent',
        color: active ? T.onSecondaryContainer : T.onSurfaceVariant,
        fontSize: 12, fontWeight: 500, textAlign: 'left',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = T.surfaceContainerHighest }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// ─── Rendering Editor Tab ─────────────────────────────────────────────────────

function RenderingEditor({ source, output, conversationContext, revisionConstraints = [], onAddRevisionConstraint, onRemoveRevisionConstraint, onClearRevisionConstraints, onRecordGeneration }: Omit<ArchVisPanelProps, 'onClear'>) {
  const [mode, setMode] = useState<GenerationMode>('preserve-layout')
  const [outputType, setOutputType] = useState<OutputType>('humanized-floor-plan')
  const [promptStyle, setPromptStyle] = useState<PromptStyle>('humanized-floor-plan')
  const [cameraPreset, setCameraPreset] = useState('Top-Down (Vista Superior 2D)')
  const [lockBoundaries, setLockBoundaries] = useState(true)
  const [preserveLabels, setPreserveLabels] = useState(true)
  const [noInventedAreas, setNoInventedAreas] = useState(true)
  const [fidelity, setFidelity] = useState(75)
  const [outputCount, setOutputCount] = useState(1)
  const [referenceMode, setReferenceMode] = useState<'original' | 'selected'>('original')
  const [prompt, setPrompt] = useState(() => output || '')
  const [negativePrompt, setNegativePrompt] = useState('cartoon, anime, 3d model look, low quality, blurry, distorted, deformed, wrong perspective, text, watermark, logo, extra rooms, different layout')
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [manualCorrection, setManualCorrection] = useState('')
  const [samples, setSamples] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState(false)
  const [presets, setPresets] = useState<{ name: string; prompt: string; categoryName?: string }[]>([])
  const samplesRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selected = gallery.find(g => g.id === selectedId)
  const currentImage = selected?.image || selected?.imageUrl || source?.dataUrl

  async function generate() {
    setLoading(true)
    setSamples(0)
    if (samplesRef.current) clearInterval(samplesRef.current)
    // Loading animation — actual API progress unknown, increments as elapsed time indicator
    samplesRef.current = setInterval(() => setSamples(s => Math.min(s + 1, 499)), 2000)

    try {
      const res = await fetch('/api/copilot/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          outputType,
          promptStyle,
          cameraPreset,
          mode,
          lockBoundaries,
          preserveLabels,
          noInventedAreas,
          strength: fidelity,
          outputCount,
          referenceMode,
          revisionConstraints,
          conversationContext,
          sourceImageDataUrl: source?.dataUrl,
          file: source ? { name: source.file.name, type: source.file.type, kind: source.kind, size: source.file.size } : undefined,
        }),
      })
      if (samplesRef.current) clearInterval(samplesRef.current)

      if (!res.ok) {
        setError(`Erro do servidor: ${res.status}`)
        setSamples(500)
        setLoading(false)
        return
      }

      const data = await res.json().catch(() => ({}))
      setSamples(500)

      if (data.providerStatus === 'not-configured' || data.providerStatus === 'not-connected') {
        setError(data.message || 'Provedor de geração de imagem não configurado.')
        setLoading(false)
        return
      }

      const rawImages = data.images || []
      if (data.image || data.imageUrl) {
        rawImages.push({ image: data.image, imageUrl: data.imageUrl })
      }
      const newItems: GalleryItem[] = rawImages.map((img: { image?: string; imageUrl?: string }) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        image: img.image,
        imageUrl: img.imageUrl,
        prompt,
        style: promptStyle,
        timestamp: new Date().toISOString(),
      }))

      if (newItems.length) {
        setGallery(prev => [...prev, ...newItems])
        setSelectedId(newItems[0].id)
        onRecordGeneration?.({ sourceName: source?.file.name, outputType, items: newItems })
      } else if (data.providerStatus) {
        setError(`Status: ${data.providerStatus}. Nenhuma imagem retornada.`)
      }
    } catch (err) {
      if (samplesRef.current) clearInterval(samplesRef.current)
      setError(err instanceof Error ? err.message : 'Erro na geração')
    } finally {
      setLoading(false)
    }
  }

  function addConstraint() {
    if (manualCorrection.trim()) {
      onAddRevisionConstraint?.(manualCorrection.trim())
      setManualCorrection('')
    }
  }

  // Fetch presets from prompt library
  useEffect(() => {
    fetch('/api/prompts/module/archvis')
      .then(r => r.json())
      .then(d => { if (d?.presets) setPresets(d.presets) })
      .catch(() => {})
  }, [])

  const progressPct = Math.round((samples / 500) * 100)

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* ── Left: Source + Preview + Gallery ────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${T.outlineVariant}` }}>
        {/* Source image */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.outlineVariant}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Imagem original (referência)
          </div>
          <div style={{ height: 220, background: T.surfaceContainerLowest, borderRadius: 8, overflow: 'hidden', position: 'relative', border: `1px solid ${T.outlineVariant}` }}>
            {source?.dataUrl ? (
              <img src={source.dataUrl} alt="Source" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.onSurfaceVariant, gap: 6 }}>
                <ImageIcon size={24} />
                <span style={{ fontSize: 11 }}>Nenhuma imagem enviada</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(11,19,38,0.8)', backdropFilter: 'blur(8px)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: T.onSurfaceVariant }}>
              1024 × 1024
            </div>
          </div>
        </div>

        {/* Current generation preview */}
        <div style={{ padding: '12px 16px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Preview atual (geração) — {cameraPreset.split('(')[1]?.replace(')', '') || cameraPreset}
            </div>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.tertiary }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.tertiary, animation: 'pulse 1s infinite' }} />
                Samples: {samples} / 500
              </div>
            )}
          </div>
          <div style={{ flex: 1, background: T.surfaceContainerLowest, borderRadius: 8, overflow: 'hidden', position: 'relative', border: `1px solid ${T.outlineVariant}`, minHeight: 200 }}>
            {currentImage ? (
              <img src={currentImage} alt="Generation" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.onSurfaceVariant, gap: 8 }}>
                {loading
                  ? <><RefreshCw size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 11 }}>Gerando...</span></>
                  : <><Sparkles size={22} color={T.onSurfaceVariant} style={{ opacity: 0.4 }} /><span style={{ fontSize: 11 }}>Nenhuma geração ainda</span></>}
              </div>
            )}
            {loading && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: T.surfaceVariant }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg, ${T.tertiary}, ${T.primary})`, transition: 'width 0.4s ease' }} />
              </div>
            )}
            {error && (
              <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, background: `${T.error}22`, border: `1px solid ${T.error}44`, borderRadius: 6, padding: '8px 12px', fontSize: 11, color: T.error }}>
                {error}
                <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: T.error, fontSize: 12 }}>×</button>
              </div>
            )}
          </div>
        </div>

        {/* Gallery strip */}
        {gallery.length > 0 && (
          <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.outlineVariant}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Galeria de iterações ({gallery.length})
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { const g = gallery.find(i => i.id === selectedId); if (g?.image || g?.imageUrl) { const a = document.createElement('a'); a.href = g.image || g.imageUrl!; a.download = `archvis-${g.id}.png`; a.click() }}} style={{ fontSize: 10, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}><Download size={10} /> Download selecionada</button>
                <button onClick={() => { window.open(gallery.find(i => i.id === selectedId)?.image || gallery.find(i => i.id === selectedId)?.imageUrl || '') }} style={{ fontSize: 10, color: T.primary, background: 'none', border: 'none', cursor: 'pointer' }}>Ver original</button>
                <button onClick={() => setGallery([])} style={{ fontSize: 10, color: T.error, background: 'none', border: 'none', cursor: 'pointer' }}>Limpar galeria</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {gallery.map(item => (
                <div key={item.id} onClick={() => setSelectedId(item.id)}
                  style={{ flexShrink: 0, width: 80, height: 60, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${item.id === selectedId ? T.primaryContainer : T.outlineVariant}`, position: 'relative' }}>
                  <img src={item.image || item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {item.id === selectedId && (
                    <div style={{ position: 'absolute', top: 3, right: 3, width: 14, height: 14, borderRadius: '50%', background: T.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 8, color: T.onPrimaryContainer, fontWeight: 700 }}>✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompt editor */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.outlineVariant}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Prompt editor</div>
          <textarea
            value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
            style={{ width: '100%', fontSize: 12, background: T.surfaceContainerLow, color: T.onSurface, border: `1px solid ${T.outlineVariant}`, borderRadius: 6, padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
          />

          {/* Revision constraints */}
          {revisionConstraints.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 10, color: T.onSurfaceVariant, marginBottom: 4 }}>Restrições do usuário (correções travadas):</div>
              {revisionConstraints.map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.primary, marginBottom: 2 }}>
                  <span style={{ color: T.primary, fontSize: 10 }}>✓</span>
                  <span style={{ flex: 1 }}>{c}</span>
                  <button onClick={() => onRemoveRevisionConstraint?.(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error, padding: 0, fontSize: 12 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input value={manualCorrection} onChange={e => setManualCorrection(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addConstraint()}
              placeholder="+ Adicionar correção..."
              style={{ flex: 1, fontSize: 11, background: T.surfaceContainerLow, color: T.onSurface, border: `1px solid ${T.outlineVariant}`, borderRadius: 4, padding: '4px 8px' }} />
            <button onClick={addConstraint} style={{ fontSize: 11, padding: '4px 10px', background: T.surfaceContainerHighest, border: `1px solid ${T.outlineVariant}`, borderRadius: 4, color: T.onSurface, cursor: 'pointer' }}>Add</button>
            {revisionConstraints.length > 0 && <button onClick={onClearRevisionConstraints} style={{ fontSize: 11, padding: '4px 10px', background: 'none', border: `1px solid ${T.error}33`, borderRadius: 4, color: T.error, cursor: 'pointer' }}>Limpar todas</button>}
          </div>

          <div style={{ fontSize: 10, color: T.onSurfaceVariant, marginTop: 6, opacity: 0.7 }}>
            {prompt.length} / 4000
            <button onClick={() => navigator.clipboard.writeText(prompt)} style={{ marginLeft: 12, fontSize: 10, color: T.primary, background: 'none', border: 'none', cursor: 'pointer' }}>Copiar prompt</button>
          </div>
        </div>

        {/* Negative prompt */}
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.outlineVariant}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Negative prompt editor</span>
            <button onClick={() => navigator.clipboard.writeText(negativePrompt)} style={{ fontSize: 10, color: T.primary, background: 'none', border: 'none', cursor: 'pointer' }}>Copiar negativo</button>
          </div>
          <textarea value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} rows={2}
            style={{ width: '100%', fontSize: 11, background: T.surfaceContainerLow, color: T.onSurfaceVariant, border: `1px solid ${T.outlineVariant}`, borderRadius: 6, padding: '6px 8px', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4 }} />
        </div>

        {/* Gallery actions */}
        {gallery.length > 0 && (
          <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.outlineVariant}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Ações da galeria</div>
            <button onClick={() => { if (selected) setReferenceMode('selected') }} style={{ fontSize: 11, padding: '5px 8px', background: 'none', border: `1px solid ${T.outlineVariant}`, borderRadius: 4, color: T.onSurface, cursor: 'pointer', textAlign: 'left' }}>Usar selecionada como referência</button>
            <button onClick={() => setReferenceMode('original')} style={{ fontSize: 11, padding: '5px 8px', background: 'none', border: `1px solid ${T.outlineVariant}`, borderRadius: 4, color: T.onSurface, cursor: 'pointer', textAlign: 'left' }}>Voltar para imagem original</button>
            <button onClick={() => gallery.forEach(g => { const a = document.createElement('a'); a.href = g.image || g.imageUrl || ''; a.download = `archvis-${g.id}.png`; a.click() })}
              style={{ fontSize: 11, padding: '5px 8px', background: 'none', border: `1px solid ${T.outlineVariant}`, borderRadius: 4, color: T.onSurface, cursor: 'pointer', textAlign: 'left' }}>Download todas</button>
            <button onClick={() => { setGallery([]); setSelectedId('') }} style={{ fontSize: 11, padding: '5px 8px', background: `${T.error}22`, border: `1px solid ${T.error}44`, borderRadius: 4, color: T.error, cursor: 'pointer', textAlign: 'left' }}>Limpar galeria</button>
          </div>
        )}
      </div>

      {/* ── Right: Controls ─────────────────────────────────────── */}
      <div style={{ width: 280, background: T.surfaceContainer, borderLeft: `1px solid ${T.outlineVariant}`, display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.outlineVariant}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Controles principais</div>

          {/* Mode */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: T.onSurfaceVariant, display: 'block', marginBottom: 4 }}>Modo</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['preserve-layout', 'creative-redesign'] as GenerationMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ flex: 1, padding: '6px 4px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: mode === m ? 700 : 400, background: mode === m ? T.primaryContainer : 'transparent', color: mode === m ? T.onPrimaryContainer : T.onSurfaceVariant, border: `1px solid ${mode === m ? T.primaryContainer : T.outlineVariant}` }}>
                  {m === 'preserve-layout' ? 'Preserve exact plan' : 'Creative redesign'}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt style */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: T.onSurfaceVariant, display: 'block', marginBottom: 4 }}>Prompt style</label>
            <select value={promptStyle} onChange={e => setPromptStyle(e.target.value as PromptStyle)}
              style={{ width: '100%', fontSize: 12, background: T.surfaceContainerHighest, color: T.onSurface, border: `1px solid ${T.outlineVariant}`, borderRadius: 6, padding: '6px 8px' }}>
              <option value="humanized-floor-plan">Humanized floor plan</option>
              <option value="photorealistic-facade">Photorealistic facade</option>
              <option value="cinematic-real-estate">Cinematic real estate</option>
              <option value="top-down-2d">Top-Down 2D</option>
              <option value="technical-drawing">Technical drawing</option>
            </select>
          </div>

          {/* Camera preset */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: T.onSurfaceVariant, display: 'block', marginBottom: 4 }}>Câmera / movement preset</label>
            <select value={cameraPreset} onChange={e => setCameraPreset(e.target.value)}
              style={{ width: '100%', fontSize: 12, background: T.surfaceContainerHighest, color: T.onSurface, border: `1px solid ${T.outlineVariant}`, borderRadius: 6, padding: '6px 8px' }}>
              {['Top-Down (Vista Superior 2D)', 'Eye-level (Fachada)', 'Perspective 3/4', 'Cinematic orbit', 'Flyover', 'Interior walkthrough'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Checkboxes */}
          {[
            { key: 'lockBoundaries', label: 'Lock original boundaries', value: lockBoundaries, set: setLockBoundaries },
            { key: 'preserveLabels', label: 'Preserve labels where possible', value: preserveLabels, set: setPreserveLabels },
            { key: 'noInventedAreas', label: 'Do not invent new areas', value: noInventedAreas, set: setNoInventedAreas },
          ].map(({ key, label, value, set }) => (
            <div key={key} onClick={() => set(!value)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: value ? T.primaryContainer : 'transparent', border: `1.5px solid ${value ? T.primaryContainer : T.outlineVariant}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {value && <span style={{ fontSize: 10, color: T.onPrimaryContainer, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 11, color: T.onSurface }}>{label}</span>
            </div>
          ))}

          {/* Fidelity slider */}
          <div style={{ marginBottom: 12, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, color: T.onSurfaceVariant }}>Fidelity / Fidelidade</label>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.onSurface }}>{(fidelity / 100).toFixed(2)}</span>
            </div>
            <input type="range" min={30} max={100} value={fidelity} onChange={e => setFidelity(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.primaryContainer }} />
          </div>

          {/* Output count */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, color: T.onSurfaceVariant }}>Output count</label>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.onSurface }}>{outputCount}</span>
            </div>
            <input type="range" min={1} max={4} value={outputCount} onChange={e => setOutputCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: T.primaryContainer }} />
          </div>

          {/* Reference image */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: T.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Reference image</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setReferenceMode('original')}
                style={{ flex: 1, padding: '6px', fontSize: 11, borderRadius: 6, cursor: 'pointer', background: referenceMode === 'original' ? T.primaryContainer : 'transparent', color: referenceMode === 'original' ? T.onPrimaryContainer : T.onSurfaceVariant, border: `1px solid ${referenceMode === 'original' ? T.primaryContainer : T.outlineVariant}`, fontWeight: referenceMode === 'original' ? 700 : 400 }}>
                Original upload
              </button>
              <button onClick={() => selected && setReferenceMode('selected')}
                style={{ flex: 1, padding: '6px', fontSize: 11, borderRadius: 6, cursor: 'pointer', background: referenceMode === 'selected' ? T.secondaryContainer : 'transparent', color: referenceMode === 'selected' ? T.onSecondaryContainer : T.onSurfaceVariant, border: `1px solid ${referenceMode === 'selected' ? T.secondaryContainer : T.outlineVariant}`, fontWeight: referenceMode === 'selected' ? 700 : 400 }}>
                Current generation
              </button>
            </div>
          </div>

          {/* 🎨 Presets de estilo */}
          {presets.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowPresets(!showPresets)}
                style={{ width: '100%', padding: '8px 10px', background: showPresets ? T.secondaryContainer : T.surfaceContainerHighest, color: showPresets ? T.onSecondaryContainer : T.onSurface, border: `1px solid ${T.outlineVariant}`, borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>🎨 Presets Profissionais ({presets.length})</span>
                <span>{showPresets ? '▲' : '▼'}</span>
              </button>
              {showPresets && (
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {presets.map((p, i) => (
                    <button key={i} onClick={() => setPrompt(p.prompt)}
                      style={{ padding: '6px 8px', fontSize: 11, background: T.surfaceContainerLowest, color: T.onSurface, border: `1px solid ${T.outlineVariant}`, borderRadius: 4, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      {p.categoryName && <span style={{ fontSize: 9, color: T.primary, marginLeft: 6 }}>{p.categoryName}</span>}
                      <span style={{ fontSize: 10, color: T.onSurfaceVariant, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.prompt.slice(0, 80)}...</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regenerate button */}
          <button onClick={generate} disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? T.surfaceContainerHighest : T.primaryContainer, color: loading ? T.onSurfaceVariant : T.onPrimaryContainer, border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading
              ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
              : <><Sparkles size={15} /> Regenerate image</>}
          </button>
        </div>

        {/* Revision constraints panel */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Revision constraints</span>
            {revisionConstraints.length > 0 && (
              <button onClick={onClearRevisionConstraints} style={{ fontSize: 10, color: T.error, background: 'none', border: 'none', cursor: 'pointer' }}>Limpar todas</button>
            )}
          </div>
          {revisionConstraints.length === 0 && (
            <p style={{ fontSize: 11, color: T.onSurfaceVariant, opacity: 0.6 }}>Estas correções serão aplicadas em todas as próximas gerações.</p>
          )}
          {revisionConstraints.map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, background: T.surfaceContainerHighest, borderRadius: 6, padding: '7px 10px' }}>
              <span style={{ color: T.primary, fontSize: 14, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 11, color: T.onSurface, flex: 1, lineHeight: 1.4 }}>{c}</span>
              <button onClick={() => onRemoveRevisionConstraint?.(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.error, padding: 0, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>×</button>
            </div>
          ))}
          <p style={{ fontSize: 10, color: T.onSurfaceVariant, opacity: 0.6, marginTop: 4 }}>Estas correções serão aplicadas em todas as próximas gerações.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Gallery Tab ──────────────────────────────────────────────────────────────

function ResultsGallery() {
  return (
    <div style={{ flex: 1, padding: 24, overflowY: 'auto', color: T.onSurface }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em' }}>Results Gallery</h2>
      <p style={{ fontSize: 13, color: T.onSurfaceVariant, marginBottom: 20 }}>Review, compare, and export your high-fidelity architectural visualizations.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', background: T.surfaceContainerHighest, borderRadius: 8, padding: 2, gap: 2 }}>
          {[{ icon: <Grid2x2 size={14} />, label: 'Grid' }, { icon: <Layers size={14} />, label: 'Timeline' }].map((b, i) => (
            <button key={b.label} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: i === 0 ? T.secondaryContainer : 'transparent', color: i === 0 ? T.onSecondaryContainer : T.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: T.surfaceContainerHighest, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.outlineVariant}` }}>
            <div style={{ height: 140, background: T.surfaceContainerLowest, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={28} color={T.onSurfaceVariant} style={{ opacity: 0.3 }} />
            </div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.onSurface, marginBottom: 2 }}>Render iteration #{i + 1}</div>
              <div style={{ fontSize: 10, color: T.onSurfaceVariant }}>1024×1024 · PNG</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>Gere imagens no Rendering Editor para populá-las aqui.</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArchVisPanel({ source, output, conversationContext, revisionConstraints, onAddRevisionConstraint, onRemoveRevisionConstraint, onClearRevisionConstraints, onRecordGeneration, onClear }: ArchVisPanelProps) {
  const [tab, setTab] = useState<ArchVisTab>(source ? 'editor' : 'editor')
  const projectName = source?.file.name?.replace(/\.[^.]+$/, '') || 'Projeto Apex'

  return (
    <div style={{
      width: '100%', height: '100%',
      background: T.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden',
    }}>
      {/* ── Top App Bar ─────────────────────────────────────────── */}
      <header style={{
        height: 48, background: `${T.surface}cc`, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.outlineVariant}`, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '4px 6px', borderRadius: 6 }}>
            <ArrowLeft size={15} /> Fechar studio
          </button>
          <div style={{ width: 1, height: 20, background: T.outlineVariant }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color={T.primary} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.onSurface }}>{projectName}</span>
          </div>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${T.primary}20`, color: T.primary, fontWeight: 700, letterSpacing: '0.05em' }}>ATIVO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ padding: '5px 12px', border: `1px solid ${T.outlineVariant}`, borderRadius: 6, background: 'transparent', color: T.onSurface, fontSize: 12, cursor: 'pointer' }}>
            + Fechar studio
          </button>
          <button style={{ padding: '5px 12px', background: T.primaryContainer, color: T.onPrimaryContainer, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={13} /> Novo projeto
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Left Sidebar Navigation ─────────────────────────── */}
        <aside style={{
          width: 220, background: T.surfaceContainer, borderRight: `1px solid ${T.outlineVariant}`,
          display: 'flex', flexDirection: 'column', padding: '16px 12px', flexShrink: 0, overflowY: 'auto',
        }}>
          {/* Brand */}
          <div style={{ padding: '4px 12px 16px', borderBottom: `1px solid ${T.outlineVariant}`, marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.primary, letterSpacing: '-0.01em' }}>ArchVis Studio</div>
            <div style={{ fontSize: 10, color: T.onSurfaceVariant, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>AI Rendering Engine</div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon={<Settings size={16} />} label="Rendering Editor" active={tab === 'editor'} onClick={() => setTab('editor')} />
            <NavItem icon={<ImageIcon size={16} />} label="Results Gallery" active={tab === 'gallery'} onClick={() => setTab('gallery')} />
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${T.outlineVariant}` }}>
            <NavItem icon={<Search size={16} />} label="Documentation" active={false} onClick={() => {}} />
            <NavItem icon={<Settings size={16} />} label="Support" active={false} onClick={() => {}} />
            <button onClick={() => setTab('editor')} style={{
              width: '100%', marginTop: 10, padding: '10px', background: T.primaryContainer, color: T.onPrimaryContainer,
              border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              + New Render
            </button>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {tab === 'editor' && (
            <RenderingEditor
              source={source} output={output} conversationContext={conversationContext}
              revisionConstraints={revisionConstraints} onAddRevisionConstraint={onAddRevisionConstraint}
              onRemoveRevisionConstraint={onRemoveRevisionConstraint} onClearRevisionConstraints={onClearRevisionConstraints}
              onRecordGeneration={onRecordGeneration}
            />
          )}
          {tab === 'gallery' && <ResultsGallery />}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        input[type=range] { cursor: pointer; }
        textarea, input, select { outline: none; }
        textarea:focus, input:focus, select:focus { border-color: ${T.primaryContainer} !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.outlineVariant}; border-radius: 2px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  )
}

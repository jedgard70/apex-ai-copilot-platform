/**
 * DirectCut Studio — Full-Screen Component
 * Migrated from the Director's Cut HTML prototype (stitch_director_s_cut_ai_studio)
 * Design system: dark charcoal (#131313), electric cyan (#00f0ff), purple (#cf5cff)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PremiumPanelLayout } from './PremiumPanelLayout'
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronRight,
  Download, ExternalLink, Film, Folder, GripVertical,
  Layers, Lock, Maximize2, Mic, Monitor,
  Move, Pause, Play, Plus, RefreshCw, Search, Send,
  Settings, Share2, Sparkles, Trash2, Unlock, Upload,
  Video, Volume2, X, ZoomIn, ZoomOut,
} from 'lucide-react'
import { IntakeFile } from '../lib/fileIntake'

// ─── Design Tokens (Director's Cut system) ───────────────────────────────────

const D = {
  bg: '#131313',
  surface: '#131313',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerLow: '#1c1b1b',
  surfaceContainer: '#201f1f',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerHighest: '#353534',
  primary: '#dbfcff',
  primaryContainer: '#00f0ff',
  onPrimaryContainer: '#006970',
  secondary: '#ecb2ff',
  secondaryContainer: '#cf5cff',
  onSecondaryContainer: '#1a0029',
  tertiary: '#fed639',
  tertiaryContainer: '#fed639',
  outline: '#5a6e6f',
  outlineVariant: '#3b494b',
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#b9cacb',
  error: '#cf6679',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DCTab = 'storyboard' | '3d-workspace' | 'library' | 'review'
type StylePreset = 'hyper-real' | 'cyberpunk' | 'cinematic' | 'architectural' | 'documentary'
type TrackType = 'frames' | 'video' | 'audio'

type SceneLayer = {
  id: string
  name: string
  type: 'image' | 'video' | 'render' | 'audio'
  visible: boolean
  opacity: number
  blendMode?: string
  active: boolean
}

type TimelineClip = {
  id: string
  track?: TrackType
  label: string
  startPct: number
  widthPct: number
  color: string
  thumbnail?: string
  status?: 'ready' | 'syncing' | 'error'
}

type TimelineTrack = {
  id: string
  label: string
  iconName: string
  clips: TimelineClip[]
  height: number
}

type RenderJob = {
  id: string
  modelId: string
  modelLabel: string
  prompt: string
  status: 'submitting' | 'queued' | 'generating' | 'done' | 'error'
  progress: number
  videoUrl?: string
  imageUrl?: string
  error?: string
  startedAt: string
}

export type DirectCutInitialConfig = Partial<{
  duration: string
  aspectRatio: string
  style: StylePreset
  cameraMovement: string
}>

type DirectCutPanelProps = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  initialConfig?: DirectCutInitialConfig
  onRecordGeneration?: (payload: { item: { id: string; modelId?: string; modelLabel?: string; videoUrl?: string; status?: string; startedAt?: string; [key: string]: unknown } }) => void
  onClear: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

// ─── Icon Sidebar ─────────────────────────────────────────────────────────────

function IconSidebar({ tab, onTab, onClose }: { tab: DCTab; onTab: (t: DCTab) => void; onClose: () => void }) {
  const items: { id: DCTab; icon: React.ReactNode; label: string }[] = [
    { id: 'storyboard', icon: <Video size={18} />, label: 'Editor' },
    { id: '3d-workspace', icon: <Monitor size={18} />, label: 'Render' },
    { id: 'library', icon: <Folder size={18} />, label: 'Assets' },
    { id: 'review', icon: <Share2 size={18} />, label: 'Review' },
  ]
  return (
    <aside style={{
      width: 64, background: D.surfaceContainerLowest, borderRight: `1px solid ${D.outlineVariant}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', flexShrink: 0,
    }}>
      {/* Project thumb */}
      <div style={{ width: 40, height: 40, borderRadius: 6, background: `${D.primaryContainer}18`, border: `1px solid ${D.primaryContainer}30`, marginBottom: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Film size={18} color={D.primaryContainer} />
      </div>

      {/* Nav items */}
      {items.map(item => (
        <button key={item.id} onClick={() => onTab(item.id)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            width: '100%', padding: '8px 0', background: tab === item.id ? `${D.primaryContainer}12` : 'none',
            borderLeft: tab === item.id ? `2px solid ${D.primaryContainer}` : '2px solid transparent',
            border: `none`, borderLeftStyle: 'solid',
            borderLeftWidth: 2, borderLeftColor: tab === item.id ? D.primaryContainer : 'transparent',
            cursor: 'pointer', color: tab === item.id ? D.primaryContainer : D.onSurfaceVariant, fontSize: 9, fontWeight: tab === item.id ? 700 : 400,
          }}>
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}

      <div style={{ marginTop: 'auto', width: '100%' }}>
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: D.onSurfaceVariant, fontSize: 9 }}>
          <Settings size={18} />
        </button>
      </div>
    </aside>
  )
}

// ─── Scene Layers Panel ───────────────────────────────────────────────────────

function SceneLayers({ layers, onToggle, onAdd, onUpdateLayer }: {
  layers: SceneLayer[]
  onToggle: (id: string) => void
  onAdd: () => void
  onUpdateLayer: (id: string, updates: Partial<SceneLayer>) => void
}) {
  const ICONS: Record<string, React.ReactNode> = {
    image: <span style={{ fontSize: 14 }}>🖼️</span>,
    video: <Film size={14} />,
    render: <Monitor size={14} />,
    audio: <Volume2 size={14} />,
  }
  return (
    <aside style={{ width: 220, background: D.surfaceContainerLowest, borderRight: `1px solid ${D.outlineVariant}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${D.outlineVariant}`, background: D.surfaceContainerLow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: D.onSurfaceVariant, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scene Layers</span>
        <button onClick={onAdd} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.onSurfaceVariant, display: 'flex', alignItems: 'center' }}>
          <Plus size={14} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {layers.map(layer => (
          <div key={layer.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              onClick={() => onUpdateLayer(layer.id, { active: !layer.active })}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 4, cursor: 'pointer',
                background: layer.active ? D.surfaceContainerHigh : 'transparent',
                border: `1px solid ${layer.active ? `${D.primaryContainer}40` : 'transparent'}`,
                transition: 'all 0.1s',
              }}>
              <span style={{ color: layer.active ? D.primaryContainer : D.onSurfaceVariant, flexShrink: 0, opacity: layer.visible ? 1 : 0.4 }}>{ICONS[layer.type]}</span>
              <div style={{ flex: 1, minWidth: 0, opacity: layer.visible ? 1 : 0.4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: D.onSurface, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.name}</div>
                <div style={{ fontSize: 9, color: D.onSurfaceVariant }}>{layer.blendMode || 'Normal'} • {layer.opacity}%</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onToggle(layer.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: layer.visible ? 0 : 1, color: layer.visible ? D.onSurfaceVariant : D.error, fontSize: 12, padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = layer.visible ? '0' : '1')}>
                {layer.visible ? '👁' : '🚫'}
              </button>
            </div>
            {layer.active && (
              <div style={{ padding: '8px 8px 8px 30px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: D.onSurfaceVariant, width: 35 }}>Opac</span>
                  <input type="range" min={0} max={100} value={layer.opacity} onChange={e => onUpdateLayer(layer.id, { opacity: Number(e.target.value) })} style={{ flex: 1, accentColor: D.primaryContainer, cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: D.onSurfaceVariant, width: 35 }}>Blend</span>
                  <select value={layer.blendMode || 'Normal'} onChange={e => onUpdateLayer(layer.id, { blendMode: e.target.value })} style={{ flex: 1, fontSize: 10, background: D.surfaceContainerHighest, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 3, padding: 2, outline: 'none', cursor: 'pointer' }}>
                    {['Normal', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten'].map(m => <option key={m} value={m === 'Normal' ? '' : m}>{m}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}

// ─── Central Canvas ────────────────────────────────────────────────────────────

function CentralCanvas({ source, currentImage, currentVideo, timecode, fps, loading, videoRef, onTimeUpdate, onLoadedMetadata, onPlay, onPause }: {
  source?: IntakeFile
  currentImage?: string
  currentVideo?: string
  timecode: string
  fps: number
  loading: boolean
  videoRef?: React.RefObject<HTMLVideoElement | null>
  onTimeUpdate?: () => void
  onLoadedMetadata?: () => void
  onPlay?: () => void
  onPause?: () => void
}) {
  const [zoom, setZoom] = useState(85)
  const displayImg = currentImage || source?.dataUrl

  return (
    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', background: D.surface, overflow: 'hidden', position: 'relative', minWidth: 0 }}>
      {/* Live badge */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, background: `${D.surfaceContainerHighest}cc`, backdropFilter: 'blur(10px)', padding: '3px 10px', borderRadius: 20, border: `1px solid ${D.outlineVariant}`, fontSize: 10, color: D.onSurface }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: D.error, animation: 'pulse 1.5s infinite' }} />
        Live Viewport • 4K
      </div>

      {/* Canvas frame */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
        <div style={{
          position: 'relative', width: '100%', maxWidth: 800,
          aspectRatio: '16/9', background: D.surfaceContainerLowest,
          border: `1px solid ${D.outlineVariant}`, overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          transform: `scale(${zoom / 100})`, transition: 'transform 0.2s',
        }}>
          {currentVideo ? (
            <video
              ref={videoRef}
              src={currentVideo}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onPlay={onPlay}
              onPause={onPause}
              controls
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : displayImg ? (
            <img src={displayImg} alt="Canvas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: D.onSurfaceVariant }}>
              {loading
                ? <><RefreshCw size={28} color={D.primaryContainer} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 12 }}>Gerando...</span></>
                : <><Film size={28} style={{ opacity: 0.3 }} /><span style={{ fontSize: 12 }}>Carregue mídia ou gere via AI</span></>}
            </div>
          )}

          {/* TC overlay */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: D.primaryContainer, background: 'rgba(0,0,0,0.5)', padding: '1px 4px' }}>TC: {timecode}</span>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: D.onSurfaceVariant, background: 'rgba(0,0,0,0.5)', padding: '1px 4px' }}>FPS: {fps.toFixed(2)}</span>
          </div>

          {/* Border overlay */}
          <div style={{ position: 'absolute', inset: 0, border: '10px solid rgba(0,0,0,0.08)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Canvas toolbar */}
      <div style={{ height: 38, background: D.surfaceContainerLow, borderTop: `1px solid ${D.outlineVariant}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: D.onSurfaceVariant }}>
          <button onClick={() => setZoom(z => Math.min(z + 10, 150))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.onSurfaceVariant, display: 'flex' }}><ZoomIn size={16} /></button>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: D.onSurface, minWidth: 32, textAlign: 'center' }}>{zoom}%</span>
          <button onClick={() => setZoom(z => Math.max(z - 10, 30))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.onSurfaceVariant, display: 'flex' }}><ZoomOut size={16} /></button>
        </div>
        <div style={{ width: 1, height: 14, background: D.outlineVariant }} />
        <div style={{ display: 'flex', gap: 8, color: D.onSurfaceVariant }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.onSurfaceVariant, display: 'flex' }}><Layers size={15} /></button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.onSurfaceVariant, display: 'flex' }}><Maximize2 size={15} /></button>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: D.onSurfaceVariant, fontStyle: 'italic' }}>Press [V] to select, [H] to pan</span>
      </div>
    </section>
  )
}

// ─── AI Generation Panel ──────────────────────────────────────────────────────

function AIGenerationPanel({ onGenerate, loading, source, initialImage, setInitialImage, finalImage, setFinalImage }: {
  onGenerate: (prompt: string, style: StylePreset, settings: { intensity: number; temperature: number }) => void
  loading: boolean
  source?: IntakeFile
  initialImage?: string
  setInitialImage: (img: string | undefined) => void
  finalImage?: string
  setFinalImage: (img: string | undefined) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<StylePreset>('hyper-real')
  const [intensity, setIntensity] = useState(75)
  const [temperature, setTemperature] = useState(33)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const styles: { id: StylePreset; label: string; color: string }[] = [
    { id: 'hyper-real', label: 'Hyper-Real', color: D.primaryContainer },
    { id: 'cyberpunk', label: 'Cyberpunk', color: D.secondaryContainer },
    { id: 'cinematic', label: 'Cinematic', color: D.tertiary },
    { id: 'architectural', label: 'Arch', color: D.primary },
    { id: 'documentary', label: 'Documentary', color: D.onSurfaceVariant },
  ]

  return (
    <aside style={{ width: 260, background: D.surfaceContainerLowest, borderLeft: `1px solid ${D.outlineVariant}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${D.outlineVariant}`, background: D.surfaceContainerLow }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: D.onSurfaceVariant, letterSpacing: '0.12em', textTransform: 'uppercase' }}>AI Generation</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Prompt */}
        <div>
          <label style={{ fontSize: 10, color: D.onSurfaceVariant, display: 'block', marginBottom: 6 }}>AI Prompt</label>
          <textarea
            value={prompt} onChange={e => setPrompt(e.target.value)} rows={5}
            placeholder="Describe your shot... e.g. Cinematic wide shot of brutalist architecture, dusk lighting, volumetric fog..."
            style={{ width: '100%', fontSize: 11, background: D.surfaceContainerHigh, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 4, padding: '8px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, outline: 'none' }}
          />
        </div>

          {/* 🌟 Automações Master J. Edgard */}
          <div style={{ marginBottom: 16, marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#f59e0b" /> Automações J. Edgard
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => {
                setPrompt('PROMPT MASTER (J. EDGARD - TIMELAPSE REVERSO): Gere um timelapse hiper-realista reverso. Inicie com o edifício 100% construído e finalizado. Em um movimento fluido e acelerado (dolly out + pan right), vá "desconstruindo" a obra através de suas fases construtivas estruturais, até chegar na marcação original do terreno e terraplenagem. Câmera: Drone FPV. Iluminação: Transição de dia para entardecer. Arquivo: 100MB+ Quality.');
                // @ts-ignore
                if(typeof setStyle === 'function') setStyle('documentary');
              }}
                style={{ padding: '8px 10px', fontSize: 11, background: '#f59e0b22', color: '#fbbf24', border: '1px solid #f59e0b44', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                ⏪ Engenharia Reversa (Timelapse Automático)
              </button>
              
              <button onClick={() => {
                setPrompt('PROMPT MASTER (J. EDGARD - CINEMATIC): Gere uma cena em movimento cinematográfico hiper-realista. Câmera: Slow pan (Panorâmica lenta) com Dolly In (aproximação suave) focando na fachada de alto padrão. Iluminação: Golden Hour (Entardecer dourado), reflexos HDR nos vidros, sombras dramáticas longas. Texturas 8k, Unreal Engine 5 vibe, detalhamento arquitetônico premium.');
                // @ts-ignore
                if(typeof setStyle === 'function') setStyle('cinematic');
              }}
                style={{ padding: '8px 10px', fontSize: 11, background: '#0ea5e922', color: '#38bdf8', border: '1px solid #0ea5e944', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                🎬 Movimento Cinematográfico (Director's Cut)
              </button>
            </div>
          </div>

        {/* Reference Images */}
        <div style={{ background: `${D.surfaceContainerHigh}80`, borderRadius: 6, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 10, color: D.onSurfaceVariant, display: 'block' }}>Reference Images (FFmpeg slideshow)</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Initial Reference Slot */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 9, color: D.onSurfaceVariant }}>Initial Frame</span>
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '1/1', background: D.surfaceContainerHighest,
                border: `1px dashed ${D.outline}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                {initialImage ? (
                  <>
                    <img src={initialImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Initial" />
                    <button onClick={() => setInitialImage(undefined)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 8 }}>×</button>
                  </>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: D.onSurfaceVariant }}>
                    <Upload size={14} />
                    <span style={{ fontSize: 8 }}>Upload</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const r = new FileReader()
                        r.onload = () => setInitialImage(r.result as string)
                        r.readAsDataURL(file)
                      }
                    }} />
                  </label>
                )}
              </div>
            </div>

            {/* Final Reference Slot */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 9, color: D.onSurfaceVariant }}>Final Frame</span>
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '1/1', background: D.surfaceContainerHighest,
                border: `1px dashed ${D.outline}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                {finalImage ? (
                  <>
                    <img src={finalImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Final" />
                    <button onClick={() => setFinalImage(undefined)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 8 }}>×</button>
                  </>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: D.onSurfaceVariant }}>
                    <Upload size={14} />
                    <span style={{ fontSize: 8 }}>Upload</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const r = new FileReader()
                        r.onload = () => setFinalImage(r.result as string)
                        r.readAsDataURL(file)
                      }
                    }} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Style presets */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 10, color: D.onSurfaceVariant }}>Style Preset</label>
            <span style={{ fontSize: 10, color: D.primaryContainer, cursor: 'pointer' }}>See All</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {styles.map(s => (
              <button key={s.id} onClick={() => setStyle(s.id)}
                style={{
                  padding: '4px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: style === s.id ? 700 : 400,
                  background: style === s.id ? `${s.color}22` : D.surfaceContainerHigh,
                  color: style === s.id ? s.color : D.onSurfaceVariant,
                  border: `1px solid ${style === s.id ? `${s.color}60` : D.outlineVariant}`,
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lighting & Mood */}
        <div style={{ background: `${D.surfaceContainerHigh}80`, borderRadius: 6, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 10, color: D.onSurfaceVariant }}>Lighting & Mood</label>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: D.onSurfaceVariant }}>Intensity</span>
              <span style={{ fontSize: 10, color: D.primaryContainer, fontWeight: 600 }}>{intensity}%</span>
            </div>
            <div style={{ position: 'relative', height: 4, background: D.surfaceContainerHighest, borderRadius: 2 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${intensity}%`, background: D.primaryContainer, borderRadius: 2 }} />
              <input type="range" min={0} max={100} value={intensity} onChange={e => setIntensity(Number(e.target.value))}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: D.onSurfaceVariant }}>Temperature</span>
              <span style={{ fontSize: 10, color: D.tertiary, fontWeight: 600 }}>{Math.round(2500 + (temperature / 100) * 8000)}K</span>
            </div>
            <div style={{ position: 'relative', height: 4, background: 'linear-gradient(to right, #60a5fa, white, #fb923c)', borderRadius: 2 }}>
              <div style={{ position: 'absolute', top: '50%', left: `${temperature}%`, transform: 'translate(-50%, -50%)', width: 10, height: 10, background: '#fff', border: `1px solid ${D.outlineVariant}`, borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
              <input type="range" min={0} max={100} value={temperature} onChange={e => setTemperature(Number(e.target.value))}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        {/* Advanced */}
        <button onClick={() => setAdvancedOpen(!advancedOpen)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', borderTop: `1px solid ${D.outlineVariant}`, padding: '8px 0', cursor: 'pointer', color: D.onSurfaceVariant, fontSize: 11 }}>
          <span>Advanced Config</span>
          <ChevronDown size={14} style={{ transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {advancedOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
            {[
              { label: 'Negative space', placeholder: 'Elements to avoid...' },
              { label: 'Camera angle', placeholder: 'Wide, close-up, POV...' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 10, color: D.onSurfaceVariant, display: 'block', marginBottom: 3 }}>{f.label}</label>
                <input placeholder={f.placeholder} style={{ width: '100%', fontSize: 11, background: D.surfaceContainerHigh, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 4, padding: '5px 8px', outline: 'none' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render button */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${D.outlineVariant}`, background: D.surfaceContainerLow }}>
        <button
          onClick={() => onGenerate(prompt, style, { intensity, temperature })}
          disabled={loading}
          style={{
            width: '100%', padding: '11px', background: loading ? D.surfaceContainerHighest : D.primaryContainer,
            color: loading ? D.onSurfaceVariant : D.onPrimaryContainer, border: 'none', borderRadius: 4,
            fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: loading ? 'none' : `0 4px 20px ${D.primaryContainer}30`,
          }}>
          {loading
            ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
            : <><Sparkles size={14} /> Render Current Shot</>}
        </button>
      </div>
    </aside>
  )
}

// ─── Multi-Track Timeline ─────────────────────────────────────────────────────

function MultiTrackTimeline({
  tracks, timecode, playing, playheadPct, onSeek, onTogglePlay
}: {
  tracks: any[]
  timecode: string
  playing: boolean
  playheadPct: number
  onSeek: (pct: number) => void
  onTogglePlay: () => void
}) {
  const timelineRef = useRef<HTMLDivElement>(null)

  const getIcon = (name: string) => {
    switch (name) {
      case 'Layers': return <Layers size={14} />
      case 'Video': return <Video size={14} />
      case 'Sparkles': return <Sparkles size={14} />
      case 'Mic': return <Mic size={14} />
      case 'Volume2': return <Volume2 size={14} />
      default: return <Video size={14} />
    }
  }

  function handlePointer(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons > 0 || e.type === 'pointerdown') {
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetLeft = 112
      const usableWidth = rect.width - offsetLeft
      const x = e.clientX - rect.left - offsetLeft
      const pct = Math.max(0, Math.min(100, (x / usableWidth) * 100))
      onSeek(pct)
      if (e.type === 'pointerdown') {
        e.currentTarget.setPointerCapture(e.pointerId)
      }
    }
  }

  const timeMarkers = ['00:00:00', '00:00:05', '00:00:10', '00:00:15', '00:00:20', '00:00:25', '00:00:30', '00:00:35', '00:00:40']

  return (
    <footer style={{ height: 220, background: D.surfaceContainerLowest, borderTop: `1px solid ${D.outlineVariant}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Timeline header */}
      <div style={{ height: 32, background: D.surfaceContainerLow, borderBottom: `1px solid ${D.outlineVariant}`, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: D.onSurfaceVariant, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Timeline</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'monospace', color: D.primaryContainer }}>
            <span>⏱</span> {timecode}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={onTogglePlay}
              style={{ background: D.surfaceContainerHigh, border: `1px solid ${D.outlineVariant}`, borderRadius: 3, padding: '2px 6px', cursor: 'pointer', color: D.onSurface, display: 'flex', alignItems: 'center', gap: 3 }}>
              {playing ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: D.onSurfaceVariant }}>
          {[<Layers size={14} />, <Settings size={14} />, <Maximize2 size={14} />].map((icon, i) => (
            <button key={i} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.onSurfaceVariant, display: 'flex' }}>{icon}</button>
          ))}
        </div>
      </div>

      {/* Tracks area */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        <div ref={timelineRef} style={{ minWidth: 1400, position: 'relative', padding: '6px 0', cursor: 'text' }}
             onPointerDown={handlePointer} onPointerMove={handlePointer}>
          {/* Time markers */}
          <div style={{ display: 'flex', marginLeft: 112, marginBottom: 4 }}>
            {timeMarkers.map(m => (
              <div key={m} style={{ width: 160, flexShrink: 0, borderLeft: `1px solid ${D.outlineVariant}`, paddingLeft: 4, fontSize: 9, color: D.onSurfaceVariant, fontFamily: 'monospace' }}>{m}</div>
            ))}
          </div>

          {/* Tracks */}
          {tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              {/* Track label */}
              <div style={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: D.onSurfaceVariant, paddingLeft: 12 }}>
                {getIcon(track.iconName)}
                <span>{track.label}</span>
              </div>
              {/* Clips */}
              <div style={{ flex: 1, position: 'relative', height: track.height, background: D.surfaceContainerHighest, borderRadius: 4, overflow: 'hidden' }}>
                {track.clips.map((clip: any) => (
                  <div key={clip.id} style={{
                    position: 'absolute', top: 0, height: '100%',
                    left: `${clip.startPct}%`, width: `${clip.widthPct}%`,
                    background: `${clip.color}18`, border: `1px solid ${clip.color}50`,
                    borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 6px', overflow: 'hidden',
                  }}>
                    {clip.status === 'syncing' && (
                      <RefreshCw size={10} color={clip.color} style={{ animation: 'spin 1.5s linear infinite', marginRight: 4, flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: clip.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clip.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Playhead */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(112px + ${playheadPct}% * (100% - 112px) / 100)`, width: 2, background: D.primaryContainer, zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -4, left: -5, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `8px solid ${D.primaryContainer}` }} />
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Render History ───────────────────────────────────────────────────────────

function RenderHistory({ jobs }: { jobs: RenderJob[] }) {
  if (jobs.length === 0) return (
    <div style={{ padding: 24, textAlign: 'center', color: D.onSurfaceVariant, fontSize: 12 }}>
      <Film size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
      <p>Nenhum render ainda. Use AI Generate para começar.</p>
    </div>
  )
  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
      {jobs.map(job => {
        const statusColor = job.status === 'done' ? '#22c55e' : job.status === 'error' ? D.error : D.tertiary
        return (
          <div key={job.id} style={{ background: D.surfaceContainerHigh, border: `1px solid ${statusColor}33`, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: D.onSurface }}>{job.modelLabel}</span>
              <span style={{ fontSize: 9, color: statusColor, fontWeight: 700, textTransform: 'uppercase' }}>{job.status}</span>
            </div>
            <div style={{ fontSize: 10, color: D.onSurfaceVariant, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 5 }}>{job.prompt.slice(0, 60)}</div>
            {job.status !== 'done' && job.status !== 'error' && (
              <div style={{ height: 2, background: D.surfaceContainerHighest, borderRadius: 1, marginBottom: 5 }}>
                <div style={{ height: '100%', width: `${job.progress}%`, background: D.primaryContainer, borderRadius: 1, transition: 'width 0.5s' }} />
              </div>
            )}
            {job.videoUrl && <video controls src={job.videoUrl} style={{ width: '100%', borderRadius: 4, maxHeight: 140, marginTop: 5 }} />}
            {job.imageUrl && !job.videoUrl && <img src={job.imageUrl} alt="" style={{ width: '100%', borderRadius: 4, maxHeight: 140, objectFit: 'cover', marginTop: 5 }} />}
            {job.error && <div style={{ fontSize: 10, color: D.error, marginTop: 4 }}>{job.error}</div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function DirectCutPanel({ source, goal, conversationContext, initialConfig, onRecordGeneration, onClear }: DirectCutPanelProps) {
  const [tab, setTab] = useState<DCTab>('storyboard')
  const [loading, setLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | undefined>(source?.dataUrl)
  const [currentVideo, setCurrentVideo] = useState<string | undefined>()
  const [initialImage, setInitialImage] = useState<string | undefined>(source?.dataUrl)
  const [finalImage, setFinalImage] = useState<string | undefined>(undefined)
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([])
  const [models, setModels] = useState<{ all: { id: string; label: string; category: string }[] } | null>(null)
  const [selectedModelId, setSelectedModelId] = useState('kling-video/v1.6/standard/text-to-video')
  const [cinematicPresets, setCinematicPresets] = useState<{ name: string; prompt: string; categoryName?: string }[]>([])
  const [showDCPresets, setShowDCPresets] = useState(false)
  const pollTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  // Timeline / Video Sync state
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [playheadPct, setPlayheadPct] = useState(0)
  const [duration, setDuration] = useState(8) // Default 8s, updates on video load

  const [layers, setLayers] = useState<SceneLayer[]>(() => [
    { id: uid(), name: source?.file.name || 'Photo_Background_01', type: 'image', visible: true, opacity: 100, active: true },
    { id: uid(), name: 'Video_Overlay_Grain', type: 'video', visible: true, opacity: 45, blendMode: 'Multiply', active: false },
    { id: uid(), name: 'Revit_Render_Final', type: 'render', visible: true, opacity: 100, active: false },
  ])

  const [tracks, setTracks] = useState<TimelineTrack[]>(() => [
    {
      id: 'video2', label: 'V2 (Overlay)', iconName: 'Layers',
      clips: [
        { id: 'v2_1', label: 'LENS_FLARE.mov', startPct: 20, widthPct: 15, color: D.secondaryContainer, status: 'ready' },
        { id: 'v2_2', label: 'TEXT_INTRO.png', startPct: 5, widthPct: 10, color: D.primaryContainer, status: 'ready' },
      ],
      height: 30,
    },
    {
      id: 'video1', label: 'V1 (Primary)', iconName: 'Video',
      clips: [
        { id: 'v1_1', label: 'B_ROLL_DRONE_PAN.mp4', startPct: 0, widthPct: 28, color: D.primary, status: 'ready' },
        { id: 'v1_2', label: 'DETAIL_MACRO.mp4', startPct: 28, widthPct: 30, color: D.primary, status: 'ready' },
      ],
      height: 48,
    },
    {
      id: 'fx', label: 'FX / Presets', iconName: 'Sparkles',
      clips: [
        { id: 'fx1', label: 'Cinematic Color Grade', startPct: 0, widthPct: 58, color: D.tertiary, status: 'ready' },
        { id: 'fx2', label: 'Slow Zoom (Ecossistema IA)', startPct: 58, widthPct: 20, color: D.tertiaryContainer, status: 'ready' },
      ],
      height: 24,
    },
    {
      id: 'audio1', label: 'A1 (Dialogue)', iconName: 'Mic',
      clips: [
        { id: 'a1_1', label: 'VOICE_OVER_AI.wav', startPct: 0, widthPct: 40, color: D.outline, status: 'ready' },
      ],
      height: 30,
    },
    {
      id: 'audio2', label: 'A2 (SFX/Music)', iconName: 'Volume2',
      clips: [
        { id: 'a2_1', label: 'AMBIENT_STREET_01.wav', startPct: 0, widthPct: 80, color: D.outline, status: 'ready' },
      ],
      height: 30,
    },
  ])

  useEffect(() => { fetch('/api/fal/models').then(r => r.json()).then(setModels).catch(() => null) }, [])
  useEffect(() => { fetch('/api/prompts/module/directcut').then(r => r.json()).then(d => { if (d?.presets) setCinematicPresets(d.presets) }).catch(() => {}) }, [])
  useEffect(() => { return () => { Object.values(pollTimers.current).forEach(clearInterval) } }, [])
  useEffect(() => {
    if (source?.dataUrl) {
      setCurrentImage(source.dataUrl)
      setInitialImage(source.dataUrl)
    }
  }, [source])

  const videoModels = useMemo(() => models?.all.filter(m => m.category.startsWith('video')) || [], [models])

  function toggleLayer(id: string) {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l))
  }
  function updateLayer(id: string, updates: Partial<SceneLayer>) {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : (updates.active !== undefined && updates.active ? { ...l, active: false } : l)))
  }
  function addLayer() {
    setLayers(prev => [...prev, { id: uid(), name: `Layer_${prev.length + 1}`, type: 'image', visible: true, opacity: 100, active: false }])
  }

  function startPollJob(jobId: string, requestId: string) {
    let attempts = 0
    pollTimers.current[jobId] = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/fal/webhook-status?request_id=${requestId}`)
        const data = await res.json()
        if (data.status === 'completed') {
          clearInterval(pollTimers.current[jobId])
          delete pollTimers.current[jobId]
          setRenderJobs(prev => prev.map(j => j.id !== jobId ? j : { ...j, status: 'done', progress: 100, videoUrl: data.videoUrl, imageUrl: data.imageUrl }))
          setTracks(prev => prev.map(t => {
            if (t.id === 'video1') {
              const clips = t.clips.map(c => c.id === jobId ? { ...c, status: 'ready' as const } : c)
              return { ...t, clips }
            }
            return t
          }))
          if (data.videoUrl) setCurrentVideo(data.videoUrl)
          setLoading(false)
        } else if (data.status === 'error') {
          clearInterval(pollTimers.current[jobId])
          delete pollTimers.current[jobId]
          setRenderJobs(prev => prev.map(j => j.id !== jobId ? j : { ...j, status: 'error', error: data.error || 'Erro.' }))
          setTracks(prev => prev.map(t => {
            if (t.id === 'video1') return { ...t, clips: t.clips.map(c => c.id === jobId ? { ...c, status: 'error' as const } : c) }
            return t
          }))
          setLoading(false)
        } else {
          setRenderJobs(prev => prev.map(j => j.id !== jobId ? j : { ...j, status: 'generating', progress: Math.min(90, attempts * 3) }))
        }
        if (attempts > 120) {
          clearInterval(pollTimers.current[jobId])
          delete pollTimers.current[jobId]
          setRenderJobs(prev => prev.map(j => j.id !== jobId ? j : { ...j, status: 'error', error: 'Timeout 10min.' }))
          setTracks(prev => prev.map(t => {
            if (t.id === 'video1') return { ...t, clips: t.clips.map(c => c.id === jobId ? { ...c, status: 'error' as const } : c) }
            return t
          }))
          setLoading(false)
        }
      } catch { /* hiccup */ }
    }, 5000)
  }

  async function handleGenerate(prompt: string, style: StylePreset, settings: { intensity: number; temperature: number }) {
    const activeModel = videoModels.find(m => m.id === selectedModelId) || { id: selectedModelId, label: selectedModelId }
    const jobId = uid()
    const job: RenderJob = {
      id: jobId, modelId: activeModel.id, modelLabel: activeModel.label,
      prompt: prompt || goal, status: 'submitting', progress: 5,
      startedAt: new Date().toISOString(),
    }
    setRenderJobs(prev => [job, ...prev])
    setTracks(prev => prev.map(t => {
      if (t.id === 'video1') {
        const newClip = { id: jobId, label: '🎬 ' + activeModel.label, startPct: 58, widthPct: 20, color: D.primaryContainer, status: 'syncing' as const }
        return { ...t, clips: [...t.clips, newClip] }
      }
      return t
    }))
    setLoading(true)

    try {
      const savedProfileStr = localStorage.getItem('apex_user_profile_data')
      let voiceId = undefined
      if (savedProfileStr) {
        try { voiceId = JSON.parse(savedProfileStr).voiceId } catch (_) {}
      }

      const res = await fetch('/api/copilot/video-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          prompt: prompt || goal,
          duration: initialConfig?.duration || '8',
          aspectRatio: initialConfig?.aspectRatio || '16:9',
          modelId: activeModel.id,
          sourceImageDataUrl: initialImage,
          finalImageDataUrl: finalImage,
          intensity: settings.intensity,
          temperature: settings.temperature,
          style: style,
          voiceId, // Clone voice from user profile
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRenderJobs(prev => prev.map(j => j.id !== jobId ? j : { ...j, status: 'error', error: data?.message || 'Render failed.' }))
        setTracks(prev => prev.map(t => {
          if (t.id === 'video1') return { ...t, clips: t.clips.map(c => c.id === jobId ? { ...c, status: 'error' as const } : c) }
          return t
        }))
        setLoading(false)
        return
      }
      if (data?.async && data?.requestId) {
        setRenderJobs(prev => prev.map(j => j.id !== jobId ? j : { ...j, status: 'queued', progress: 10, requestId: data.requestId }))
        startPollJob(jobId, data.requestId)
      } else {
        const videoUrl = data?.videoDataUrl || data?.videoUrl
        setRenderJobs(prev => prev.map(j => j.id !== jobId ? j : { ...j, status: 'done', progress: 100, videoUrl }))
        setTracks(prev => prev.map(t => {
          if (t.id === 'video1') return { ...t, clips: t.clips.map(c => c.id === jobId ? { ...c, status: 'ready' as const } : c) }
          return t
        }))
        if (videoUrl) setCurrentVideo(videoUrl)
        setLoading(false)
        onRecordGeneration?.({ item: { id: jobId, modelId: job.modelId, modelLabel: job.modelLabel, status: 'done', videoUrl, startedAt: job.startedAt } })
      }
    } catch (err) {
      setRenderJobs(prev => prev.map(j => j.id !== jobId ? j : { ...j, status: 'error', error: err instanceof Error ? err.message : 'Error' }))
      setTracks(prev => prev.map(t => {
        if (t.id === 'video1') return { ...t, clips: t.clips.map(c => c.id === jobId ? { ...c, status: 'error' as const } : c) }
        return t
      }))
      setLoading(false)
    }
  }

  const doneJob = renderJobs.find(j => j.status === 'done' && j.videoUrl)

  // Auto-playhead for when there is no video loaded yet, or to keep timeline moving
  useEffect(() => {
    if (!currentVideo && playing) {
      const interval = setInterval(() => {
        setPlayheadPct(p => {
          if (p >= 100) {
            setPlaying(false)
            return 100
          }
          return p + (100 / (duration * 24)) // ~24fps fallback
        })
      }, 1000 / 24)
      return () => clearInterval(interval)
    }
  }, [currentVideo, playing, duration])

  // Sync callbacks
  const handleTimeUpdate = () => {
    if (videoRef.current) setPlayheadPct((videoRef.current.currentTime / videoRef.current.duration) * 100 || 0)
  }
  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration)
  }
  const handleSeek = (pct: number) => {
    setPlayheadPct(pct)
    if (videoRef.current) {
      videoRef.current.currentTime = (pct / 100) * duration
    }
  }
  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) videoRef.current.pause()
      else videoRef.current.play()
    } else {
      setPlaying(!playing)
    }
  }

  // Calculate Timecode
  const currentSeconds = (playheadPct / 100) * duration || 0
  const hh = String(Math.floor(currentSeconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((currentSeconds % 3600) / 60)).padStart(2, '0')
  const ss = String(Math.floor(currentSeconds % 60)).padStart(2, '0')
  const ff = String(Math.floor((currentSeconds % 1) * 24)).padStart(2, '0')
  const calculatedTimecode = `${hh}:${mm}:${ss}:${ff}`

  return (
    <PremiumPanelLayout title="Director's Cut Studio" subtitle="Configurações e monitoramento" onClose={onClear}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <header style={{
          height: 48, background: D.surfaceContainerLowest, borderBottom: `1px solid ${D.outlineVariant}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', flexShrink: 0, zIndex: 10,
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          <nav style={{ display: 'flex', gap: 12 }}>
            {[
              { id: 'storyboard', label: 'Storyboard' },
              { id: '3d-workspace', label: '3D Workspace' },
              { id: 'library', label: 'Library' },
            ].map(item => (
              <button key={item.id} onClick={() => setTab(item.id as DCTab)}
                style={{
                  fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
                  color: tab === item.id ? D.primaryContainer : D.onSurfaceVariant,
                  borderBottom: `2px solid ${tab === item.id ? D.primaryContainer : 'transparent'}`,
                  paddingBottom: 2,
                }}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 🎬 Cinematic Presets */}
          {cinematicPresets.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowDCPresets(!showDCPresets)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: showDCPresets ? D.primaryContainer : D.surfaceContainerHigh, color: showDCPresets ? D.onPrimaryContainer : D.onSurfaceVariant, border: `1px solid ${D.outlineVariant}`, borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>
                🎬 Presets {showDCPresets ? '▲' : '▼'}
              </button>
              {showDCPresets && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 280, maxHeight: 300, overflowY: 'auto', background: D.surfaceContainerHigh, border: `1px solid ${D.outlineVariant}`, borderRadius: 8, padding: 8, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: D.onSurfaceVariant, marginBottom: 8, letterSpacing: '0.05em' }}>🎬 PRESETS CINEMATOGRÁFICOS</div>
                  {cinematicPresets.map((p, i) => (
                    <button key={i} onClick={() => handleGenerate(p.prompt, 'cinematic', { intensity: 75, temperature: 33 })}
                      style={{ width: '100%', padding: '6px 8px', fontSize: 11, background: D.surfaceContainerLowest, color: D.onSurface, border: `1px solid ${D.outlineVariant}`, borderRadius: 4, cursor: 'pointer', textAlign: 'left', marginBottom: 4, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600, color: D.primaryContainer }}>{p.name}</span>
                      {p.categoryName && <span style={{ fontSize: 9, color: D.onSurfaceVariant, marginLeft: 6 }}>{p.categoryName}</span>}
                      <span style={{ fontSize: 10, color: D.onSurfaceVariant, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.prompt.slice(0, 60)}...</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Generate button (primary action) */}
          <button onClick={() => handleGenerate('', 'hyper-real', { intensity: 75, temperature: 33 })} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: D.primaryContainer, color: D.onPrimaryContainer, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <Sparkles size={12} /> AI Generate
          </button>
          {/* Model selector */}
          {videoModels.length > 0 && (
            <select value={selectedModelId} onChange={e => setSelectedModelId(e.target.value)}
              style={{ fontSize: 10, background: D.surfaceContainerHigh, color: D.onSurfaceVariant, border: `1px solid ${D.outlineVariant}`, borderRadius: 4, padding: '4px 6px', maxWidth: 160 }}>
              {videoModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          )}
          <div style={{ width: 1, height: 16, background: D.outlineVariant }} />
          <Settings size={15} color={D.onSurfaceVariant} style={{ cursor: 'pointer' }} />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Icon sidebar */}
        <IconSidebar tab={tab} onTab={setTab} onClose={onClear} />

        {/* Main workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {tab === 'storyboard' && (
            <>
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <SceneLayers layers={layers} onToggle={toggleLayer} onAdd={addLayer} onUpdateLayer={updateLayer} />
                <CentralCanvas
                  source={source}
                  currentImage={currentImage}
                  currentVideo={currentVideo}
                  timecode={calculatedTimecode}
                  fps={24}
                  loading={loading}
                  videoRef={videoRef}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />
                <AIGenerationPanel
                  onGenerate={handleGenerate}
                  loading={loading}
                  source={source}
                  initialImage={initialImage}
                  setInitialImage={setInitialImage}
                  finalImage={finalImage}
                  setFinalImage={setFinalImage}
                />
              </div>
              <MultiTrackTimeline
                tracks={tracks}
                timecode={calculatedTimecode}
                playing={playing}
                playheadPct={playheadPct}
                onSeek={handleSeek}
                onTogglePlay={togglePlay}
              />
            </>
          )}

          {tab === '3d-workspace' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <CentralCanvas
                  source={source}
                  currentImage={currentImage}
                  currentVideo={currentVideo}
                  timecode={calculatedTimecode}
                  fps={24}
                  loading={loading}
                  videoRef={videoRef}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />
              </div>
              <MultiTrackTimeline
                tracks={tracks}
                timecode={calculatedTimecode}
                playing={playing}
                playheadPct={playheadPct}
                onSeek={handleSeek}
                onTogglePlay={togglePlay}
              />
            </div>
          )}

          {tab === 'library' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${D.outlineVariant}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Render History</span>
                <span style={{ fontSize: 11, color: D.onSurfaceVariant }}>{renderJobs.length} renders</span>
              </div>
              <RenderHistory jobs={renderJobs} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        * { box-sizing: border-box; }
        textarea, input, select { outline: none; }
        textarea:focus, input:focus { border-color: ${D.primaryContainer} !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${D.outlineVariant}; border-radius: 2px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>
      </div>
    </PremiumPanelLayout>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, Eraser, Film, Play, Save, Video } from 'lucide-react'
import { formatSize, IntakeFile } from '../lib/fileIntake'

type VideoMode =
  | 'image-to-video'
  | 'text-to-video'
  | 'construction-presentation'
  | 'real-estate-sales-video'
  | 'technical-walkthrough'
  | 'social-media-short'

type Duration = '5s' | '10s' | '15s' | '30s'
type AspectRatio = '16:9' | '9:16' | '1:1'
type Voice = 'none' | 'narrator' | 'presenter-script'
type VideoStyle = 'cinematic' | 'professional-real-estate' | 'technical-bim' | 'social-media' | 'documentary'

type DirectCutPlan = {
  providerStatus?: string
  title?: string
  objective?: string
  audience?: string
  sceneList?: string[]
  cameraMovements?: string[]
  narrationScript?: string
  videoPrompt?: string
  negativePrompt?: string
  recommendedAspectRatio?: AspectRatio
  recommendedDuration?: Duration
  message?: string
}

type GalleryItem = DirectCutPlan & {
  id: string
  timestamp: string
  sourceMedia?: string
  mode: VideoMode
  duration: Duration
  aspectRatio: AspectRatio
  voice: Voice
  style: VideoStyle
  lockedConstraints: string[]
}

type DirectCutPanelProps = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  onClear: () => void
}

const modeLabels: Record<VideoMode, string> = {
  'image-to-video': 'Image to video',
  'text-to-video': 'Text to video',
  'construction-presentation': 'Construction presentation',
  'real-estate-sales-video': 'Real estate sales video',
  'technical-walkthrough': 'Technical walkthrough',
  'social-media-short': 'Social media short',
}

const styleLabels: Record<VideoStyle, string> = {
  cinematic: 'cinematic',
  'professional-real-estate': 'professional real estate',
  'technical-bim': 'technical BIM',
  'social-media': 'social media',
  documentary: 'documentary',
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeVideoConstraint(text: string) {
  const lower = text.toLowerCase()
  if (/(não|nao).*(pessoa|people|person)/i.test(lower)) return 'Do not show people or presenters in the video.'
  if (/(começar|comecar|iniciar|start).*(fachada|facade)/i.test(lower)) return 'Start the video with the facade/exterior establishing shot.'
  if (/(c[aâ]mera lenta|slow motion|slow)/i.test(lower)) return 'Use slow camera movement and slower pacing.'
  if (/(vertical|reels|story|9:16)/i.test(lower)) return 'Use vertical 9:16 social-video framing.'
  if (/(mais comercial|more commercial|venda|sales)/i.test(lower)) return 'Make the video more commercial, persuasive and real-estate-sales focused.'
  return `Apply this locked video correction: ${text.trim()}`
}

export function DirectCutPanel({ source, goal, conversationContext, onClear }: DirectCutPanelProps) {
  const [videoMode, setVideoMode] = useState<VideoMode>(source ? 'image-to-video' : 'text-to-video')
  const [duration, setDuration] = useState<Duration>('15s')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [voice, setVoice] = useState<Voice>('narrator')
  const [style, setStyle] = useState<VideoStyle>('professional-real-estate')
  const [plan, setPlan] = useState<DirectCutPlan | null>(null)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [manualCorrection, setManualCorrection] = useState('')
  const [lockedConstraints, setLockedConstraints] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const selected = gallery.find(item => item.id === selectedId)
  const activePlan = selected || plan

  const sourceMeta = useMemo(() => {
    if (!source) return 'No source media uploaded.'
    return `${source.file.name} · ${source.kind} · ${formatSize(source.file.size)}`
  }, [source])

  async function requestPlan() {
    setLoading(true)
    try {
      const response = await fetch('/api/copilot/video-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          file: source ? {
            name: source.file.name,
            type: source.file.type,
            size: source.file.size,
            kind: source.kind,
            dataUrl: source.kind === 'image' ? source.dataUrl : undefined,
          } : null,
          videoMode,
          duration,
          aspectRatio,
          voice,
          style,
          lockedConstraints,
          conversationContext,
        }),
      })
      const data: DirectCutPlan = await response.json().catch(() => ({
        providerStatus: 'planning-only',
        message: 'DirectCut planner returned a non-JSON response.',
      }))
      setPlan(data)
      const item: GalleryItem = {
        ...data,
        id: id(),
        timestamp: new Date().toISOString(),
        sourceMedia: source?.file.name,
        mode: videoMode,
        duration,
        aspectRatio,
        voice,
        style,
        lockedConstraints: [...lockedConstraints],
      }
      setGallery(prev => [...prev, item])
      setSelectedId(item.id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    requestPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function copyText(value = '') {
    navigator.clipboard.writeText(value)
  }

  function exportPlan(item = selected || gallery[gallery.length - 1]) {
    if (!item) return
    const text = [
      `Title: ${item.title || ''}`,
      `Objective: ${item.objective || ''}`,
      `Audience: ${item.audience || ''}`,
      '',
      'Scene list:',
      ...(item.sceneList || []).map((scene, index) => `${index + 1}. ${scene}`),
      '',
      'Camera movements:',
      ...(item.cameraMovements || []).map((movement, index) => `${index + 1}. ${movement}`),
      '',
      'Narration:',
      item.narrationScript || '',
      '',
      'Video prompt:',
      item.videoPrompt || '',
      '',
      'Negative prompt:',
      item.negativePrompt || '',
    ].join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `directcut-plan-${item.timestamp.replace(/[:.]/g, '-')}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function addCorrection() {
    const text = manualCorrection.trim()
    if (!text) return
    const constraint = normalizeVideoConstraint(text)
    setLockedConstraints(prev => prev.includes(constraint) ? prev : [...prev, constraint])
    setManualCorrection('')
  }

  return (
    <section className="directcut-studio" aria-label="DirectCut Studio">
      <div className="directcut-heading">
        <div>
          <span>DirectCut Studio</span>
          <h2>Video planning workspace</h2>
        </div>
        <button className="ghost-action" onClick={onClear} type="button"><Eraser size={16} /> Close</button>
      </div>

      <div className="directcut-layout">
        <aside className="directcut-controls">
          <div className="directcut-source">
            <strong>Reference media</strong>
            <span>{sourceMeta}</span>
            {source?.kind === 'image' && source.dataUrl && <img src={source.dataUrl} alt={source.file.name} />}
          </div>

          <label><span>Video mode</span><select value={videoMode} onChange={event => setVideoMode(event.target.value as VideoMode)}>{Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Duration</span><select value={duration} onChange={event => setDuration(event.target.value as Duration)}>{['5s', '10s', '15s', '30s'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Aspect ratio</span><select value={aspectRatio} onChange={event => setAspectRatio(event.target.value as AspectRatio)}>{['16:9', '9:16', '1:1'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Voice</span><select value={voice} onChange={event => setVoice(event.target.value as Voice)}>{['none', 'narrator', 'presenter-script'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><span>Style</span><select value={style} onChange={event => setStyle(event.target.value as VideoStyle)}>{Object.entries(styleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

          <div className="video-constraints-panel">
            <strong>Video constraints</strong>
            {lockedConstraints.length ? lockedConstraints.map(item => (
              <span key={item}>{item}<button type="button" onClick={() => setLockedConstraints(prev => prev.filter(value => value !== item))}>Remove</button></span>
            )) : <p>No locked corrections yet.</p>}
            <div>
              <input value={manualCorrection} onChange={event => setManualCorrection(event.target.value)} placeholder="Add correction, e.g. não mostrar pessoa" />
              <button type="button" onClick={addCorrection}>Add</button>
            </div>
          </div>

          <button className="directcut-primary" onClick={requestPlan} disabled={loading} type="button"><Play size={16} /> {loading ? 'Planning...' : 'Generate video plan'}</button>
        </aside>

        <div className="directcut-main">
          <div className="directcut-preview">
            <Video size={36} />
            <strong>Preview placeholder</strong>
            <span>No real video connector is connected yet. This workspace exports planning prompts only.</span>
            <small>Provider status: {activePlan?.providerStatus || 'planning-only'}</small>
          </div>

          <div className="directcut-plan">
            <h3>{activePlan?.title || 'Current video plan'}</h3>
            <p>{activePlan?.objective || 'DirectCut will generate a plan from your project goal.'}</p>
            <small>Audience: {activePlan?.audience || 'not set'}</small>

            <h4>Shot list</h4>
            <ol>{(activePlan?.sceneList || []).map(scene => <li key={scene}>{scene}</li>)}</ol>

            <h4>Scene-by-scene script</h4>
            <pre>{activePlan?.narrationScript || 'No script generated yet.'}</pre>

            <h4>Prompt for video generator</h4>
            <pre>{activePlan?.videoPrompt || ''}</pre>

            <h4>Negative prompt / avoid list</h4>
            <pre>{activePlan?.negativePrompt || ''}</pre>

            <div className="directcut-actions">
              <button type="button" onClick={() => copyText(activePlan?.videoPrompt)}><Copy size={16} /> Copy prompt</button>
              <button type="button" onClick={() => copyText(activePlan?.narrationScript)}><Copy size={16} /> Copy script</button>
              <button type="button" onClick={() => exportPlan()}><Download size={16} /> Export plan</button>
              <button type="button" onClick={() => localStorage.setItem('apex_directcut_last_plan', JSON.stringify(activePlan))}><Save size={16} /> Save plan</button>
            </div>
          </div>

          <div className="directcut-gallery">
            <div><strong>Iteration gallery</strong><span>{gallery.length} plan{gallery.length === 1 ? '' : 's'}</span></div>
            <div className="directcut-gallery-list">
              {gallery.map(item => (
                <button type="button" key={item.id} className={item.id === selectedId ? 'active' : ''} onClick={() => setSelectedId(item.id)}>
                  <Film size={16} />
                  <span>{item.title || item.mode}</span>
                  <small>{item.duration} · {item.aspectRatio} · {item.style}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

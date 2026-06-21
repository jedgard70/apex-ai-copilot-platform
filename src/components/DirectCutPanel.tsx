import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera,
  Clapperboard,
  Copy,
  Download,
  Eraser,
  Film,
  Lightbulb,
  Mic,
  Play,
  Save,
  UploadCloud,
  Video,
  Wand2,
} from 'lucide-react'
import { formatSize, IntakeFile } from '../lib/fileIntake'

type VideoMode =
  | 'generate-videos'
  | 'image-to-video'
  | 'video-editor'
  | 'clip-editor'
  | 'relight-video'
  | 'add-voice'
  | 'improve-video'
  | 'cinematic-effect'
  | '3d-scenes-camera-movement'
  | 'construction-presentation'
  | 'real-estate-sales-video'
  | 'technical-walkthrough'
  | 'social-media-short'

type Duration = '5s' | '10s' | '15s' | '30s'
type AspectRatio = '16:9' | '9:16' | '1:1'
type AudioMode = 'on' | 'off'
type Voice = 'none' | 'narrator' | 'presenter-script'
type VideoStyle = 'cinematic' | 'professional-real-estate' | 'technical-bim' | 'social-media' | 'documentary'
type Lighting = 'keep-original' | 'relight' | 'transfer-light' | 'warm' | 'night' | 'daylight'
type CameraMovement = 'static' | 'dolly-in' | 'dolly-out' | 'orbit' | 'pan' | 'tilt' | 'flyover' | 'walkthrough' | 'top-reveal'

export type DirectCutInitialConfig = Partial<{
  videoMode: VideoMode
  duration: Duration
  aspectRatio: AspectRatio
  audio: AudioMode
  voice: Voice
  style: VideoStyle
  lighting: Lighting
  cameraMovement: CameraMovement
}>

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

type MediaReference = {
  id: string
  role: 'initial' | 'final' | 'additional'
  name: string
  type: string
  size: number
  dataUrl?: string
}

type GalleryItem = DirectCutPlan & {
  id: string
  timestamp: string
  sourceMedia?: string
  mode: VideoMode
  duration: Duration
  aspectRatio: AspectRatio
  audio: AudioMode
  voice: Voice
  style: VideoStyle
  lighting: Lighting
  cameraMovement: CameraMovement
  model: 'auto'
  lockedConstraints: string[]
  planEditor: string
  references: MediaReference[]
}

type DirectCutPanelProps = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  initialConfig?: DirectCutInitialConfig
  onRecordGeneration?: (payload: { item: GalleryItem }) => void
  onClear: () => void
}

const modeLabels: Record<VideoMode, string> = {
  'generate-videos': 'Generate videos',
  'image-to-video': 'Image to video',
  'video-editor': 'Video editor',
  'clip-editor': 'Clip editor',
  'relight-video': 'Relight video',
  'add-voice': 'Add voice',
  'improve-video': 'Improve video',
  'cinematic-effect': 'Cinematic effect',
  '3d-scenes-camera-movement': '3D scenes / camera movement',
  'construction-presentation': 'Construction presentation',
  'real-estate-sales-video': 'Real estate sales video',
  'technical-walkthrough': 'Technical walkthrough',
  'social-media-short': 'Social media short',
}

const styleLabels: Record<VideoStyle, string> = {
  cinematic: 'cinematic',
  'professional-real-estate': 'real estate',
  'technical-bim': 'technical BIM',
  'social-media': 'social',
  documentary: 'documentary',
}

const lightingLabels: Record<Lighting, string> = {
  'keep-original': 'keep original',
  relight: 'relight',
  'transfer-light': 'transfer light',
  warm: 'warm',
  night: 'night',
  daylight: 'daylight',
}

const cameraMovementLabels: Record<CameraMovement, string> = {
  static: 'static',
  'dolly-in': 'dolly in',
  'dolly-out': 'dolly out',
  orbit: 'orbit',
  pan: 'pan',
  tilt: 'tilt',
  flyover: 'flyover',
  walkthrough: 'walkthrough',
  'top-reveal': 'top reveal',
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
  if (/(luz|light|relight|ilumina)/i.test(lower)) return `Apply this lighting correction: ${text.trim()}`
  return `Apply this locked video correction: ${text.trim()}`
}

function readFileReference(file: File, role: MediaReference['role']): Promise<MediaReference> {
  return new Promise(resolve => {
    const reference: MediaReference = {
      id: id(),
      role,
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
    }
    if (!/^image\/|^video\//i.test(file.type || '')) {
      resolve(reference)
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve({ ...reference, dataUrl: String(reader.result || '') })
    reader.onerror = () => resolve(reference)
    reader.readAsDataURL(file)
  })
}

function downloadTextFile(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function DirectCutPanel({ source, goal, conversationContext, initialConfig, onRecordGeneration, onClear }: DirectCutPanelProps) {
  const addMediaInput = useRef<HTMLInputElement | null>(null)
  const [videoMode, setVideoMode] = useState<VideoMode>(initialConfig?.videoMode || (source ? 'image-to-video' : 'generate-videos'))
  const [duration, setDuration] = useState<Duration>(initialConfig?.duration || '15s')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialConfig?.aspectRatio || '16:9')
  const [audio, setAudio] = useState<AudioMode>(initialConfig?.audio || 'on')
  const [voice, setVoice] = useState<Voice>(initialConfig?.voice || 'narrator')
  const [style, setStyle] = useState<VideoStyle>(initialConfig?.style || 'professional-real-estate')
  const [lighting, setLighting] = useState<Lighting>(initialConfig?.lighting || 'keep-original')
  const [cameraMovement, setCameraMovement] = useState<CameraMovement>(initialConfig?.cameraMovement || 'dolly-in')
  const [planEditor, setPlanEditor] = useState(goal)
  const [plan, setPlan] = useState<DirectCutPlan | null>(null)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [manualCorrection, setManualCorrection] = useState('')
  const [lockedConstraints, setLockedConstraints] = useState<string[]>([])
  const [mediaReferences, setMediaReferences] = useState<MediaReference[]>([])
  const [loading, setLoading] = useState(false)

  const selected = gallery.find(item => item.id === selectedId)
  const activePlan = selected || plan
  const referenceList = useMemo(() => {
    const initial: MediaReference[] = source
      ? [{
          id: 'source',
          role: 'initial',
          name: source.file.name,
          type: source.file.type || source.kind,
          size: source.file.size,
          dataUrl: source.dataUrl,
        }]
      : []
    return [...initial, ...mediaReferences]
  }, [mediaReferences, source])

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
          planEditor,
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
          model: 'auto',
          audio,
          voice,
          style,
          lighting,
          cameraMovement,
          references: referenceList.map(reference => ({
            role: reference.role,
            name: reference.name,
            type: reference.type,
            size: reference.size,
            hasPreview: Boolean(reference.dataUrl),
          })),
          lockedConstraints,
          conversationContext,
        }),
      })
      const data: DirectCutPlan = await response.json().catch(() => ({
        providerStatus: 'planning-only',
        message: 'DirectCut planner returned a non-JSON response.',
      }))
      setPlan(data)
      if (data.videoPrompt) setPlanEditor(data.videoPrompt)
      const item: GalleryItem = {
        ...data,
        id: id(),
        timestamp: new Date().toISOString(),
        sourceMedia: source?.file.name,
        mode: videoMode,
        duration,
        aspectRatio,
        audio,
        voice,
        style,
        lighting,
        cameraMovement,
        model: 'auto',
        lockedConstraints: [...lockedConstraints],
        planEditor: data.videoPrompt || planEditor,
        references: referenceList,
      }
      setGallery(prev => [...prev, item])
      setSelectedId(item.id)
      onRecordGeneration?.({ item })
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
      `Mode: ${modeLabels[item.mode]}`,
      `Model: ${item.model}`,
      `Duration: ${item.duration}`,
      `Aspect: ${item.aspectRatio}`,
      `Audio: ${item.audio}`,
      `Voice: ${item.voice}`,
      `Style: ${item.style}`,
      `Lighting: ${item.lighting}`,
      `Camera movement: ${item.cameraMovement}`,
      `Objective: ${item.objective || ''}`,
      `Audience: ${item.audience || ''}`,
      '',
      'References:',
      ...(item.references || []).map(reference => `- ${reference.role}: ${reference.name} (${reference.type}, ${formatSize(reference.size)})`),
      '',
      'Storyboard / shot list:',
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
    downloadTextFile(`directcut-plan-${item.timestamp.replace(/[:.]/g, '-')}.txt`, text)
  }

  function exportStoryboard() {
    const list = activePlan?.sceneList || []
    if (!list.length) return
    downloadTextFile('directcut-storyboard.txt', list.map((scene, index) => `${index + 1}. ${scene}`).join('\n'))
  }

  function addCorrection() {
    const text = manualCorrection.trim()
    if (!text) return
    const constraint = normalizeVideoConstraint(text)
    setLockedConstraints(prev => prev.includes(constraint) ? prev : [...prev, constraint])
    setManualCorrection('')
  }

  async function handleReferenceUpload(file: File, role: MediaReference['role']) {
    const reference = await readFileReference(file, role)
    setMediaReferences(prev => [...prev, reference])
  }

  return (
    <section className="directcut-studio" aria-label="DirectCut Studio">
      <div className="directcut-heading">
        <div>
          <span>DirectCut Studio</span>
          <h2>Video generation planner</h2>
        </div>
        <button className="ghost-action" onClick={onClear} type="button"><Eraser size={16} /> Close</button>
      </div>

      <div className="directcut-layout">
        <aside className="directcut-controls">
          <div className="directcut-source">
            <strong>Reference media</strong>
            <span>{sourceMeta}</span>
            {source?.kind === 'image' && source.dataUrl && <img src={source.dataUrl} alt={source.file.name} />}
            <div className="directcut-reference-grid">
              <button type="button" className="directcut-reference-tile active">
                <UploadCloud size={16} />
                <span>Initial reference</span>
                <small>{source ? source.file.name : 'none'}</small>
              </button>
              <button type="button" className="directcut-reference-tile">
                <Film size={16} />
                <span>Final reference</span>
                <small>{referenceList.find(item => item.role === 'final')?.name || 'not set'}</small>
              </button>
              <button type="button" className="directcut-reference-tile" onClick={() => addMediaInput.current?.click()}>
                <UploadCloud size={16} />
                <span>Add media</span>
                <small>{mediaReferences.length ? `${mediaReferences.length} added` : 'image/video/file'}</small>
              </button>
              <input
                ref={addMediaInput}
                hidden
                type="file"
                accept="*/*"
                onChange={event => {
                  const file = event.target.files?.[0]
                  if (file) handleReferenceUpload(file, file.type.startsWith('video/') ? 'final' : 'additional')
                  event.currentTarget.value = ''
                }}
              />
            </div>
          </div>

          <label><span>Model</span><select value="auto" disabled><option value="auto">Auto</option></select></label>
          <label><span>Tool mode</span><select value={videoMode} onChange={event => setVideoMode(event.target.value as VideoMode)}>{Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="directcut-select-grid">
            <label><span>Duration</span><select value={duration} onChange={event => setDuration(event.target.value as Duration)}>{['5s', '10s', '15s', '30s'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span>Aspect</span><select value={aspectRatio} onChange={event => setAspectRatio(event.target.value as AspectRatio)}>{['16:9', '9:16', '1:1'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
          <div className="directcut-select-grid">
            <label><span>Audio</span><select value={audio} onChange={event => setAudio(event.target.value as AudioMode)}>{['on', 'off'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
            <label><span>Voice</span><select value={voice} onChange={event => setVoice(event.target.value as Voice)}>{['none', 'narrator', 'presenter-script'].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
          <label><span>Style</span><select value={style} onChange={event => setStyle(event.target.value as VideoStyle)}>{Object.entries(styleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Lighting</span><select value={lighting} onChange={event => setLighting(event.target.value as Lighting)}>{Object.entries(lightingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Camera movement</span><select value={cameraMovement} onChange={event => setCameraMovement(event.target.value as CameraMovement)}>{Object.entries(cameraMovementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

          <div className="video-constraints-panel">
            <strong>Video revision constraints</strong>
            {lockedConstraints.length ? lockedConstraints.map(item => (
              <span key={item}>{item}<button type="button" onClick={() => setLockedConstraints(prev => prev.filter(value => value !== item))}>Remove</button></span>
            )) : <p>No locked corrections yet.</p>}
            <div>
              <input value={manualCorrection} onChange={event => setManualCorrection(event.target.value)} placeholder="e.g. começar pela fachada" />
              <button type="button" onClick={addCorrection}>Add</button>
            </div>
          </div>

          <button className="directcut-primary" onClick={requestPlan} disabled={loading} type="button"><Play size={16} /> {loading ? 'Planning...' : 'Generate / Regenerate plan'}</button>
        </aside>

        <div className="directcut-main">
          <div className="directcut-preview">
            <div className="directcut-preview-icon"><Video size={34} /></div>
            <strong>Preview placeholder</strong>
            <span>Planning only — video generation connector not connected yet.</span>
            <small>Provider status: {activePlan?.providerStatus || 'planning-only'}</small>
          </div>

          <div className="directcut-plan">
            <div className="directcut-plan-head">
              <div>
                <h3>{activePlan?.title || 'Current video plan'}</h3>
                <p>{activePlan?.objective || 'DirectCut will generate a plan from your project goal.'}</p>
                <small>Audience: {activePlan?.audience || 'not set'}</small>
              </div>
              <div className="directcut-status-pill"><Clapperboard size={15} /> planning-only</div>
            </div>

            <label className="directcut-editor-label">
              <span><Wand2 size={15} /> Prompt / plan editor</span>
              <textarea value={planEditor} onChange={event => setPlanEditor(event.target.value)} />
            </label>

            <h4>Storyboard / shot list</h4>
            <ol>{(activePlan?.sceneList || []).map(scene => <li key={scene}>{scene}</li>)}</ol>

            <h4>Scene-by-scene narration script</h4>
            <pre>{activePlan?.narrationScript || 'No script generated yet.'}</pre>

            <h4>Video generator prompt</h4>
            <pre>{activePlan?.videoPrompt || ''}</pre>

            <h4>Negative prompt / avoid list</h4>
            <pre>{activePlan?.negativePrompt || ''}</pre>

            <div className="directcut-actions">
              <button type="button" onClick={() => copyText(activePlan?.videoPrompt)}><Copy size={16} /> Copy prompt</button>
              <button type="button" onClick={() => copyText(activePlan?.narrationScript)}><Mic size={16} /> Copy script</button>
              <button type="button" onClick={() => copyText((activePlan?.sceneList || []).join('\n'))}><Camera size={16} /> Copy storyboard</button>
              <button type="button" onClick={exportStoryboard}><Download size={16} /> Export storyboard</button>
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
                  <span>{item.title || modeLabels[item.mode]}</span>
                  <small>{item.duration} · {item.aspectRatio} · {styleLabels[item.style]} · {lightingLabels[item.lighting]} · {cameraMovementLabels[item.cameraMovement]}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

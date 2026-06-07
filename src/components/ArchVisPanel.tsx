import { useEffect, useMemo, useState } from 'react'
import { Copy, Download, Eraser, ImagePlus, Layers, RotateCcw, Save, Sparkles, Wand2 } from 'lucide-react'
import {
  archvisCameraPresets,
  archvisPromptStyleLabels,
  ArchVisCameraPreset,
  ArchVisPromptStyle,
  getArchVisNegativePrompt,
  getArchVisStylePrompt,
} from '../lib/archvisPromptLibrary'
import { formatSize, IntakeFile } from '../lib/fileIntake'

type GenerationMode = 'preserve-layout' | 'creative-redesign'
type ReferenceMode = 'original' | 'selected-generation'

type ArchVisPanelProps = {
  source: IntakeFile
  output: string
  conversationContext: string[]
  revisionConstraints: string[]
  onAddRevisionConstraint: (constraint: string) => void
  onRemoveRevisionConstraint: (constraint: string) => void
  onClearRevisionConstraints: () => void
  onClear: () => void
}

type GeneratedImageResponse = {
  providerStatus?: string
  message?: string
  image?: string
  imageUrl?: string
  revisedPrompt?: string
  model?: string
  warning?: string
  images?: {
    image?: string
    imageUrl?: string
    revisedPrompt?: string
  }[]
}

type GalleryItem = {
  id: string
  imageDataUrl: string
  prompt: string
  negativePrompt: string
  revisionConstraints: string[]
  mode: GenerationMode
  style: ArchVisPromptStyle
  cameraPreset: ArchVisCameraPreset
  timestamp: string
  sourceUsed: ReferenceMode
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function preservePlanPrompt(lockBoundaries: boolean, preserveLabels: boolean, noInventedAreas: boolean) {
  return [
    getArchVisStylePrompt('humanized-floor-plan'),
    'Transform this exact uploaded architectural floor plan into a high-quality humanized floor plan visualization.',
    'Preserve the original geometry, walls, room positions, pool location, garage location, road/access, lot shape, proportions and top-down camera.',
    preserveLabels ? 'Preserve labels where possible and do not create misspelled labels.' : '',
    lockBoundaries ? 'Preserve exact lot boundary, building footprint, exterior/service areas and blank/technical zones.' : '',
    noInventedAreas ? 'Do not invent gardens, patios, decks, walls, openings, sidewalks or landscaping outside areas shown in the source image. Treat unclear areas as neutral.' : '',
    'Do not redesign the plan. Do not add/remove rooms. Do not change layout.',
    'Only improve materials, floor textures, furniture, existing landscaping, shadows, water, lighting and presentation quality.',
  ].filter(Boolean).join('\n')
}

function creativePrompt(style: ArchVisPromptStyle, cameraPreset: ArchVisCameraPreset) {
  return [
    getArchVisStylePrompt(style),
    'Creative redesign mode. This is an exploratory concept, not a faithful construction plan.',
    cameraPreset === 'auto' ? '' : `Camera / movement: ${cameraPreset}.`,
    'Use the active project image as inspiration, but allow stronger architecture, mood, materials and presentation.',
  ].filter(Boolean).join('\n')
}

function buildRevisionConstraintBlock(revisionConstraints: string[]) {
  if (!revisionConstraints.length) return ''
  return [
    'User correction constraints from previous failed outputs:',
    ...revisionConstraints.map((constraint, index) => `${index + 1}. ${constraint}`),
  ].join('\n')
}

function mergeRevisionConstraintBlock(prompt: string, revisionConstraints: string[]) {
  const withoutOldBlock = prompt
    .replace(/\n*User correction constraints from previous failed outputs:\n(?:\d+\.\s.*\n?)*/i, '')
    .trim()
  const block = buildRevisionConstraintBlock(revisionConstraints)
  return [withoutOldBlock, block].filter(Boolean).join('\n\n')
}

function buildInitialPrompt(
  mode: GenerationMode,
  style: ArchVisPromptStyle,
  camera: ArchVisCameraPreset,
  lock: boolean,
  labels: boolean,
  noInvented: boolean,
  copilotOutput: string,
  revisionConstraints: string[],
) {
  const base = mode === 'preserve-layout'
    ? preservePlanPrompt(lock, labels, noInvented)
    : creativePrompt(style, camera)
  return [
    base,
    buildRevisionConstraintBlock(revisionConstraints),
    copilotOutput ? `Copilot context:\n${copilotOutput}` : '',
  ].filter(Boolean).join('\n\n').trim()
}

export function ArchVisPanel({
  source,
  output,
  conversationContext,
  revisionConstraints,
  onAddRevisionConstraint,
  onRemoveRevisionConstraint,
  onClearRevisionConstraints,
  onClear,
}: ArchVisPanelProps) {
  const [generationMode, setGenerationMode] = useState<GenerationMode>('preserve-layout')
  const [promptStyle, setPromptStyle] = useState<ArchVisPromptStyle>('humanized-floor-plan')
  const [cameraPreset, setCameraPreset] = useState<ArchVisCameraPreset>("bird's-eye / top-down")
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>('original')
  const [lockBoundaries, setLockBoundaries] = useState(true)
  const [preserveLabels, setPreserveLabels] = useState(true)
  const [noInventedAreas, setNoInventedAreas] = useState(true)
  const [strength, setStrength] = useState(85)
  const [outputCount, setOutputCount] = useState(1)
  const [prompt, setPrompt] = useState(() => buildInitialPrompt('preserve-layout', 'humanized-floor-plan', "bird's-eye / top-down", true, true, true, output, revisionConstraints))
  const [negativePrompt, setNegativePrompt] = useState(() => getArchVisNegativePrompt('humanized-floor-plan', true))
  const [manualCorrection, setManualCorrection] = useState('')
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [imageLoading, setImageLoading] = useState(false)
  const [providerMessage, setProviderMessage] = useState('')
  const [providerWarning, setProviderWarning] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedItem = gallery.find(item => item.id === selectedId)
  const selectedImage = selectedItem?.imageDataUrl
  const activeReference = referenceMode === 'selected-generation' && selectedImage ? selectedImage : source.dataUrl
  const currentPreview = selectedImage || gallery[gallery.length - 1]?.imageDataUrl

  const sourceMeta = useMemo(() => {
    const parts = [source.file.type || 'unknown type', formatSize(source.file.size)]
    if (source.dimensions) parts.push(`${source.dimensions.width}x${source.dimensions.height}`)
    return parts.join(' · ')
  }, [source])

  useEffect(() => {
    const nextPrompt = buildInitialPrompt(generationMode, promptStyle, cameraPreset, lockBoundaries, preserveLabels, noInventedAreas, output, revisionConstraints)
    setPrompt(nextPrompt)
    setNegativePrompt(getArchVisNegativePrompt(generationMode === 'preserve-layout' ? 'humanized-floor-plan' : promptStyle, generationMode === 'preserve-layout' && lockBoundaries))
  }, [generationMode, promptStyle, cameraPreset, lockBoundaries, preserveLabels, noInventedAreas, output])

  useEffect(() => {
    setPrompt(value => mergeRevisionConstraintBlock(value, revisionConstraints))
  }, [revisionConstraints])

  function addManualCorrection() {
    const correction = manualCorrection.trim()
    if (!correction) return
    onAddRevisionConstraint(correction)
    setManualCorrection('')
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function saveBriefing() {
    const payload = {
      savedAt: new Date().toISOString(),
      source: source.file.name,
      prompt,
      negativePrompt,
      revisionConstraints,
      generationMode,
      promptStyle,
      cameraPreset,
      gallery,
    }
    localStorage.setItem('apex_archvis_studio_briefing', JSON.stringify(payload))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  function downloadImage(image: string, name = `apex-archvis-${Date.now()}.png`) {
    const link = document.createElement('a')
    link.href = image
    link.download = name
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  function downloadSelected() {
    const item = selectedItem || gallery[gallery.length - 1]
    if (item) downloadImage(item.imageDataUrl, `apex-archvis-selected-${item.timestamp.replace(/[:.]/g, '-')}.png`)
  }

  function downloadAll() {
    gallery.forEach((item, index) => {
      window.setTimeout(() => downloadImage(item.imageDataUrl, `apex-archvis-${index + 1}-${item.timestamp.replace(/[:.]/g, '-')}.png`), index * 250)
    })
  }

  async function generateImage() {
    setImageLoading(true)
    setProviderMessage('')
    setProviderWarning('')
    try {
      const response = await fetch('/api/copilot/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          sourceImageDataUrl: activeReference,
          referenceMode,
          mode: generationMode,
          promptStyle,
          cameraPreset,
          lockBoundaries,
          preserveLabels,
          noInventedAreas,
          revisionConstraints,
          strength,
          outputCount,
          file: {
            name: source.file.name,
            type: source.file.type,
            size: source.file.size,
            dimensions: source.dimensions,
          },
          conversationContext,
        }),
      })
      const data: GeneratedImageResponse = await response.json().catch(() => ({
        providerStatus: 'not-connected',
        message: 'Image connector returned a non-JSON response.',
      }))
      setProviderMessage(data.message || '')
      setProviderWarning(data.warning || '')
      const results = data.images?.length ? data.images : [{ image: data.image, imageUrl: data.imageUrl, revisedPrompt: data.revisedPrompt }]
      const newItems = results
        .map(result => result.image || result.imageUrl)
        .filter(Boolean)
        .map(image => ({
          id: id(),
          imageDataUrl: image as string,
          prompt,
          negativePrompt,
          revisionConstraints: [...revisionConstraints],
          mode: generationMode,
          style: promptStyle,
          cameraPreset,
          timestamp: new Date().toISOString(),
          sourceUsed: referenceMode,
        }))
      if (newItems.length) {
        setGallery(prev => [...prev, ...newItems])
        setSelectedId(newItems[newItems.length - 1].id)
      }
    } finally {
      setImageLoading(false)
    }
  }

  return (
    <section className="archvis-studio" aria-label="ArchVis Studio">
      <div className="archvis-heading">
        <div>
          <span>ArchVis Studio</span>
          <h2>Side-by-side image workflow</h2>
        </div>
        <button className="ghost-action" onClick={onClear} type="button">
          <Eraser size={16} /> Close
        </button>
      </div>

      <div className="archvis-studio-grid">
        <div className="archvis-preview-stack">
          <div className="archvis-source">
            <img src={source.previewUrl || source.url || source.dataUrl || ''} alt={source.file.name} />
            <div>
              <strong>Original reference</strong>
              <span>{source.file.name}</span>
              <span>{sourceMeta}</span>
            </div>
          </div>

          <div className="archvis-current-preview">
            <strong>Current generated image</strong>
            {currentPreview ? <img src={currentPreview} alt="Selected ArchVis generation" /> : <p>No generated image yet.</p>}
          </div>

          <div className="archvis-gallery">
            <div className="archvis-gallery-head">
              <strong>Iteration gallery</strong>
              <span>{gallery.length} item{gallery.length === 1 ? '' : 's'}</span>
            </div>
            <div className="archvis-thumbs">
              {gallery.map(item => (
                <button
                  key={item.id}
                  className={item.id === selectedId ? 'active' : ''}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  title={`${item.style} · ${item.timestamp}`}
                >
                  <img src={item.imageDataUrl} alt="ArchVis iteration thumbnail" />
                </button>
              ))}
              {!gallery.length && <span className="empty-gallery">Generated images will stay here for iteration.</span>}
            </div>
          </div>
        </div>

        <div className="archvis-controls">
          <label className="archvis-style-selector">
            <span>Mode</span>
            <select value={generationMode} onChange={event => setGenerationMode(event.target.value as GenerationMode)}>
              <option value="preserve-layout">Preserve exact plan</option>
              <option value="creative-redesign">Creative redesign</option>
            </select>
          </label>

          <label className="archvis-style-selector">
            <span>Prompt style</span>
            <select value={promptStyle} onChange={event => setPromptStyle(event.target.value as ArchVisPromptStyle)}>
              {Object.entries(archvisPromptStyleLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="archvis-style-selector">
            <span>Camera / movement preset</span>
            <select value={cameraPreset} onChange={event => setCameraPreset(event.target.value as ArchVisCameraPreset)}>
              {archvisCameraPresets.map(preset => <option key={preset} value={preset}>{preset}</option>)}
            </select>
          </label>

          <div className="archvis-checks">
            <label><input type="checkbox" checked={lockBoundaries} onChange={event => setLockBoundaries(event.target.checked)} /> Lock original boundaries</label>
            <label><input type="checkbox" checked={preserveLabels} onChange={event => setPreserveLabels(event.target.checked)} /> Preserve labels where possible</label>
            <label><input type="checkbox" checked={noInventedAreas} onChange={event => setNoInventedAreas(event.target.checked)} /> Do not invent new areas</label>
          </div>

          <div className="revision-constraints-panel">
            <div className="revision-head">
              <strong>Revision constraints</strong>
              <button type="button" onClick={onClearRevisionConstraints} disabled={!revisionConstraints.length}>Clear corrections</button>
            </div>
            {revisionConstraints.length ? (
              <ul>
                {revisionConstraints.map(constraint => (
                  <li key={constraint}>
                    <span>{constraint}</span>
                    <button type="button" onClick={() => onRemoveRevisionConstraint(constraint)}>Remove</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No locked revision constraints yet.</p>
            )}
            <div className="revision-add-row">
              <input
                value={manualCorrection}
                onChange={event => setManualCorrection(event.target.value)}
                placeholder="Add correction, e.g. do not create garden behind the suite"
              />
              <button type="button" onClick={addManualCorrection}>Add correction</button>
            </div>
          </div>

          <div className="archvis-range-grid">
            <label>
              <span>Strength / fidelity</span>
              <input type="range" min="30" max="100" value={strength} onChange={event => setStrength(Number(event.target.value))} />
              <small>{strength}%</small>
            </label>
            <label>
              <span>Output count</span>
              <input type="number" min="1" max="4" value={outputCount} onChange={event => setOutputCount(Math.max(1, Math.min(4, Number(event.target.value) || 1)))} />
            </label>
          </div>

          <label className="archvis-style-selector">
            <span>Reference source</span>
            <select value={referenceMode} onChange={event => setReferenceMode(event.target.value as ReferenceMode)}>
              <option value="original">Original uploaded image</option>
              <option value="selected-generation" disabled={!selectedImage}>Selected generated image</option>
            </select>
          </label>

          <label className="archvis-editor-label">
            <span>Prompt editor</span>
            <textarea value={prompt} onChange={event => setPrompt(event.target.value)} />
          </label>

          <label className="archvis-editor-label">
            <span>Negative prompt editor</span>
            <textarea value={negativePrompt} onChange={event => setNegativePrompt(event.target.value)} />
          </label>

          <p className="archvis-fidelity-warning">
            Preserve mode keeps layout, walls, rooms, pool, road, lot shape and proportions. Creative mode may redesign.
          </p>

          <div className="archvis-actions">
            <button onClick={generateImage} type="button" disabled={imageLoading}><Wand2 size={16} /> {imageLoading ? 'Generating...' : 'Regenerate with corrections'}</button>
            <button onClick={() => setReferenceMode('selected-generation')} type="button" disabled={!selectedImage}><ImagePlus size={16} /> Use current generated image as new reference</button>
            <button onClick={() => setReferenceMode('original')} type="button"><RotateCcw size={16} /> Reuse original image as reference</button>
            <button onClick={copyPrompt} type="button"><Copy size={16} /> {copied ? 'Copied' : 'Copy prompt'}</button>
            <button onClick={saveBriefing} type="button"><Save size={16} /> {saved ? 'Saved' : 'Save briefing'}</button>
            <button onClick={downloadSelected} type="button" disabled={!gallery.length}><Download size={16} /> Download selected</button>
            <button onClick={downloadAll} type="button" disabled={!gallery.length}><Download size={16} /> Download all</button>
            <button onClick={() => { setGallery([]); setSelectedId('') }} type="button" disabled={!gallery.length}><Eraser size={16} /> Clear gallery</button>
            <button onClick={() => setPrompt(value => `${value}\n\n${creativePrompt(promptStyle, cameraPreset)}`)} type="button"><Sparkles size={16} /> Generate variations</button>
          </div>

          {providerMessage && (
            <div className="provider-error">
              <strong>{providerMessage}</strong>
              {providerWarning && <span>{providerWarning}</span>}
              <span>AI image editing may still vary details; verify against the original plan.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

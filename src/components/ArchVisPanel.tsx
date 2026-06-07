import { useMemo, useState } from 'react'
import { Copy, Eraser, ImagePlus, Layers, Save, Sparkles } from 'lucide-react'
import { formatSize, IntakeFile } from '../lib/fileIntake'

type ArchVisPanelProps = {
  source: IntakeFile
  output: string
  conversationContext: string[]
  onClear: () => void
}

type EditPlanResponse = {
  imageEditPlan?: string
  recommendedPrompt?: string
  providerStatus?: string
  message?: string
  connectorReadiness?: {
    provider: string
    status: string
  }[]
}

function defaultEditInstruction(file: IntakeFile) {
  const dimensions = file.dimensions ? ` The source image is ${file.dimensions.width}x${file.dimensions.height}.` : ''
  return `Humanize this architectural floor plan with realistic materials, furniture, landscaping, lighting and sales-ready presentation.${dimensions} Preserve the original layout logic, improve visual clarity, and make the result suitable for a client presentation.`
}

function buildRenderBrief(file: IntakeFile, output: string) {
  return [
    'Scene type: residential ArchVis based on the uploaded plan/image.',
    'Camera: clean sales-oriented view; use aerial, facade or interior perspective depending on the selected variant.',
    'Style: modern, realistic, warm, client-ready.',
    'Materials: natural wood accents, neutral plaster, glass, stone or concrete details where appropriate.',
    'Lighting: soft daylight or golden-hour lighting with clear shadows and realistic reflections.',
    'Landscaping: organized garden areas, pool surroundings if present, clean paths and outdoor living cues.',
    'Output format: high-resolution photorealistic render or humanized floor plan for sales presentation.',
    'Negative prompt: low quality, distorted geometry, incorrect walls, extra rooms, warped furniture, unreadable plan, bad lighting, blurry textures, unrealistic materials, unwanted people.',
    '',
    'Base output:',
    output,
    '',
    `Source: ${file.file.name}`,
  ].join('\n')
}

function buildVariations(file: IntakeFile, output: string) {
  const base = output || `Use the uploaded image ${file.file.name} as the source project context.`
  return [
    `Realistic sales render: ${base} Create a photorealistic real estate render with warm daylight, refined landscaping, premium materials, realistic shadows, clean composition and sales-ready atmosphere.`,
    `Humanized floor plan: ${base} Transform the source plan into a humanized architectural presentation with readable rooms, furniture layout, soft textures, greenery, circulation clarity and polished client-board styling.`,
    `Social media marketing image: ${base} Create a vertical marketing visual for social media with strong composition, inviting outdoor/pool or facade focus, premium lifestyle cues, clean text-safe space and high-end real estate mood.`,
  ]
}

export function ArchVisPanel({ source, output, conversationContext, onClear }: ArchVisPanelProps) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [variations, setVariations] = useState<string[]>([])
  const [renderBrief, setRenderBrief] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editInstruction, setEditInstruction] = useState(() => defaultEditInstruction(source))
  const [editPlan, setEditPlan] = useState<EditPlanResponse | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const sourceMeta = useMemo(() => {
    const parts = [source.file.type || 'unknown type', formatSize(source.file.size)]
    if (source.dimensions) parts.push(`${source.dimensions.width}x${source.dimensions.height}`)
    return parts.join(' · ')
  }, [source])

  async function copyPrompt() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function saveBriefing() {
    const payload = {
      savedAt: new Date().toISOString(),
      file: {
        name: source.file.name,
        type: source.file.type,
        size: source.file.size,
        dimensions: source.dimensions,
      },
      output,
      renderBrief,
      variations,
    }
    localStorage.setItem('apex_archvis_last_briefing', JSON.stringify(payload))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  async function sendEditRequest() {
    setEditLoading(true)
    setEditPlan(null)
    try {
      const response = await fetch('/api/copilot/image-edit-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: source.dataUrl,
          file: {
            name: source.file.name,
            type: source.file.type,
            size: source.file.size,
            dimensions: source.dimensions,
          },
          editInstruction,
          conversationContext,
        }),
      })
      const data = await response.json().catch(() => ({}))
      setEditPlan(data)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <section className="archvis-panel" aria-label="ArchVis output">
      <div className="archvis-heading">
        <div>
          <span>ArchVis output</span>
          <h2>Image workflow</h2>
        </div>
        <button className="ghost-action" onClick={onClear} type="button">
          <Eraser size={16} /> Clear output
        </button>
      </div>

      <div className="archvis-source">
        <img src={source.previewUrl || source.url || source.dataUrl || ''} alt={source.file.name} />
        <div>
          <strong>{source.file.name}</strong>
          <span>{sourceMeta}</span>
        </div>
      </div>

      <div className="archvis-output">
        <h3>Generated prompt / output</h3>
        <pre>{output}</pre>
      </div>

      <div className="archvis-actions">
        <button onClick={copyPrompt} type="button"><Copy size={16} /> {copied ? 'Copied' : 'Copy prompt'}</button>
        <button onClick={saveBriefing} type="button"><Save size={16} /> {saved ? 'Saved' : 'Save briefing'}</button>
        <button onClick={() => setVariations(buildVariations(source, output))} type="button"><Sparkles size={16} /> Generate variations</button>
        <button onClick={() => setEditOpen(value => !value)} type="button"><ImagePlus size={16} /> Prepare image edit</button>
        <button onClick={() => setRenderBrief(buildRenderBrief(source, output))} type="button"><Layers size={16} /> Prepare render brief</button>
      </div>

      {variations.length > 0 && (
        <div className="archvis-output">
          <h3>Prompt variations</h3>
          {variations.map((variation, index) => (
            <p key={variation}><strong>{index + 1}.</strong> {variation}</p>
          ))}
        </div>
      )}

      {editOpen && (
        <div className="archvis-edit">
          <h3>Image edit request</h3>
          <textarea value={editInstruction} onChange={event => setEditInstruction(event.target.value)} />
          <button onClick={sendEditRequest} type="button" disabled={editLoading}>
            {editLoading ? 'Preparing...' : 'Send edit request'}
          </button>
          {editPlan && (
            <div className="archvis-output">
              <h3>Edit plan</h3>
              <p>{editPlan.message}</p>
              <pre>{editPlan.imageEditPlan}</pre>
              <h3>Recommended prompt</h3>
              <pre>{editPlan.recommendedPrompt}</pre>
              <small>Provider status: {editPlan.providerStatus}</small>
              {editPlan.connectorReadiness && (
                <div className="connector-list">
                  {editPlan.connectorReadiness.map(connector => (
                    <span key={connector.provider}>{connector.provider}: {connector.status}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {renderBrief && (
        <div className="archvis-output">
          <h3>Render brief</h3>
          <pre>{renderBrief}</pre>
        </div>
      )}
    </section>
  )
}

import { useMemo, useRef, useState } from 'react'
import { Clipboard, Download, Mic, Save, Sparkles, UploadCloud, UserSquare2, X } from 'lucide-react'
import { AvatarVoicePlan, AvatarVoiceUseCase, createAvatarVoicePlan } from '../lib/avatarVoiceKnowledge'
import { PremiumPanelLayout } from './PremiumPanelLayout'

type Props = {
  goal: string
  conversationContext: string[]
  onSaveToProject?: (plan: AvatarVoicePlan) => void
  onClear: () => void
}

type AssetRef = {
  id: string
  name: string
  type: string
  size: number
  kind: 'photo' | 'audio' | 'video'
}

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function AvatarVoicePanel({ goal, conversationContext, onSaveToProject, onClear }: Props) {
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const [useCase, setUseCase] = useState<AvatarVoiceUseCase>('internal-demo')
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [brandNotes, setBrandNotes] = useState(goal)
  const [assets, setAssets] = useState<AssetRef[]>([])
  const [plan, setPlan] = useState<AvatarVoicePlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const assetSummary = useMemo(() => ({
    photos: assets.filter(item => item.kind === 'photo').length,
    audio: assets.filter(item => item.kind === 'audio').length,
    videos: assets.filter(item => item.kind === 'video').length,
  }), [assets])

  function appendFiles(list: FileList | null, kind: AssetRef['kind']) {
    if (!list?.length) return
    const next = Array.from(list).map(file => ({
      id: nextId(),
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      kind,
    }))
    setAssets(prev => [...prev, ...next])
  }

  async function generatePlan() {
    if (!consentConfirmed) {
      setMessage('Owner consent must be confirmed before preparing avatar/voice workflow.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/copilot/avatar-voice-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, conversationContext, useCase, brandNotes, assetSummary, consentConfirmed }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.plan) throw new Error(data.error || 'Avatar/voice planner failed.')
      setPlan(data.plan)
      setMessage('Avatar/voice workflow prepared from current assets and use case.')
    } catch (error) {
      setPlan(createAvatarVoicePlan(goal, useCase, assetSummary))
      setMessage(error instanceof Error ? error.message : 'Avatar/voice planner failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PremiumPanelLayout
      title="Avatar / Voice Pipeline"
      subtitle="Consent-gated media presenter workflow. Prepare owner avatar, voice, script and campaign/demonstration package for app and web."
      headerActions={<button className="ghost-action" onClick={onClear} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button>}
    >
      <div className="contracts-layout">
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Use case</strong>
            <select value={useCase} onChange={event => setUseCase(event.target.value as AvatarVoiceUseCase)}>
              <option value="internal-demo">Internal demo</option>
              <option value="client-presentation">Client presentation</option>
              <option value="real-estate-sales">Real-estate sales</option>
              <option value="social-campaign">Social campaign</option>
            </select>
            <label>
              <span>Brand / style notes</span>
              <textarea value={brandNotes} onChange={event => setBrandNotes(event.target.value)} />
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={consentConfirmed} onChange={event => setConsentConfirmed(event.target.checked)} />
              <span>I confirm owner consent for image and voice use in this workflow.</span>
            </label>
          </div>

          <div className="contracts-card">
            <strong>Asset intake</strong>
            <button type="button" onClick={() => photoInputRef.current?.click()}><UploadCloud size={15} /> Add photos</button>
            <button type="button" onClick={() => audioInputRef.current?.click()}><Mic size={15} /> Add voice samples</button>
            <button type="button" onClick={() => videoInputRef.current?.click()}><Sparkles size={15} /> Add support videos</button>
            <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={event => appendFiles(event.target.files, 'photo')} />
            <input ref={audioInputRef} type="file" accept="audio/*" multiple hidden onChange={event => appendFiles(event.target.files, 'audio')} />
            <input ref={videoInputRef} type="file" accept="video/*" multiple hidden onChange={event => appendFiles(event.target.files, 'video')} />
            <small>{assetSummary.photos} photos · {assetSummary.audio} audio · {assetSummary.videos} videos</small>
          </div>

          <div className="contracts-card">
            <strong>Actions</strong>
            <button className="contracts-primary" onClick={generatePlan} disabled={loading}>{loading ? 'Preparing...' : 'Prepare workflow'}</button>
            <button onClick={() => plan && copy(plan.report)} disabled={!plan}><Clipboard size={15} /> Copy report</button>
            <button onClick={() => plan && download('apex-avatar-voice-plan.json', JSON.stringify(plan, null, 2))} disabled={!plan}><Download size={15} /> Export JSON</button>
            <button onClick={() => plan && onSaveToProject?.(plan)} disabled={!plan}><Save size={15} /> Save to Project Workspace</button>
          </div>
        </aside>

        <div className="contracts-main">
          {message && <div className="contracts-card"><strong>Status</strong><span>{message}</span></div>}

          <div className="contracts-card">
            <div className="contracts-section-head">
              <strong>Loaded assets</strong>
              <span>{assets.length}</span>
            </div>
            {!assets.length && <p>No media loaded yet.</p>}
            {!!assets.length && <ul>{assets.map(asset => <li key={asset.id}>{asset.kind} · {asset.name}</li>)}</ul>}
          </div>

          {plan && (
            <>
              <div className="contracts-card">
                <strong>Summary</strong>
                <p>{plan.summary}</p>
              </div>
              <Grid title="Identity guidelines" items={plan.identityGuidelines} />
              <Grid title="Asset checklist" items={plan.assetChecklist} />
              <Grid title="Script outline" items={plan.scriptOutline} />
              <Grid title="Production steps" items={plan.productionSteps} />
              <Grid title="Delivery pack" items={plan.deliveryPack} />
              <Grid title="Safety rules" items={plan.safetyRules} />
            </>
          )}
        </div>
      </div>
    </PremiumPanelLayout>
  )
}

function Grid({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="contracts-card">
      <div className="contracts-section-head">
        <strong>{title}</strong>
        <span>{items.length}</span>
      </div>
      <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>
  )
}

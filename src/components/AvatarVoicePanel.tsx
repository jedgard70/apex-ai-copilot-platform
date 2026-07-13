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
    <div className="fixed inset-0 z-50 bg-[#0b1326] flex flex-col text-[#dae2fd] overflow-hidden font-sans">
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-[#2d3449]/50 bg-[#131b2e]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onClear}>
            <div className="w-8 h-8 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] group-hover:border-cyan-500 transition-colors">
              <span className="material-symbols-outlined text-sm text-[#afb9cb] group-hover:text-cyan-400">arrow_back</span>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2 border-l border-[#2d3449] pl-4">
            <span className="material-symbols-outlined text-cyan-500">mic</span>
            Voice & Avatar Studio <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 ml-2">PRO</span>
          </h1>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 lg:p-10 gap-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131b2e] via-[#0b1326] to-[#060e20]">
        
        {/* Painel de Controle (Esquerda) */}
        <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto shrink-0 pr-2 custom-scrollbar">
          
          <div className="bg-[#171f33]/80 backdrop-blur-xl border border-[#2d3449] rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            <h2 className="text-sm font-semibold text-white mb-4">Configuração da Voz</h2>
            
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-[#afb9cb]">Caso de Uso</label>
              <select 
                value={useCase} 
                onChange={event => setUseCase(event.target.value as AvatarVoiceUseCase)}
                className="w-full bg-[#0b1326] border border-[#2d3449] text-sm text-white p-2.5 rounded-xl outline-none focus:border-cyan-500"
              >
                <option value="internal-demo">Apresentação Interna</option>
                <option value="client-presentation">Apresentação p/ Cliente</option>
                <option value="real-estate-sales">Vendas Imobiliárias</option>
                <option value="social-campaign">Campanha Redes Sociais</option>
              </select>

              <label className="text-xs font-medium text-[#afb9cb] mt-2">Instruções de Tom de Voz</label>
              <textarea 
                value={brandNotes} 
                onChange={event => setBrandNotes(event.target.value)} 
                className="w-full bg-[#0b1326] border border-[#2d3449] text-sm text-white p-2.5 rounded-xl outline-none focus:border-cyan-500 h-24 resize-none"
                placeholder="Ex: Voz confiante, pausada, com tom cinematográfico..."
              />

              <label className="flex items-start gap-3 mt-2 cursor-pointer group">
                <input type="checkbox" checked={consentConfirmed} onChange={event => setConsentConfirmed(event.target.checked)} className="mt-1" />
                <span className="text-xs text-[#8d90a0] group-hover:text-white transition-colors">Confirmo que possuo autorização para uso da voz e imagem neste projeto.</span>
              </label>
            </div>
          </div>

          <div className="bg-[#171f33]/80 backdrop-blur-xl border border-[#2d3449] rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-semibold text-white mb-4">Assets Base (Clonagem)</h2>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => audioInputRef.current?.click()} className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0b1326] border border-[#2d3449] hover:bg-[#222a3d] text-[#c3c6d7] text-xs font-medium transition-colors">
                <span className="material-symbols-outlined text-[16px]">mic</span> Amostras de Voz
              </button>
              <button onClick={() => photoInputRef.current?.click()} className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0b1326] border border-[#2d3449] hover:bg-[#222a3d] text-[#c3c6d7] text-xs font-medium transition-colors">
                <span className="material-symbols-outlined text-[16px]">image</span> Fotos do Apresentador
              </button>
            </div>
            <div className="mt-4 text-xs text-[#8d90a0] text-center">
              {assetSummary.photos} fotos · {assetSummary.audio} áudios adicionados
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple hidden onChange={event => appendFiles(event.target.files, 'photo')} />
            <input ref={audioInputRef} type="file" accept="audio/*" multiple hidden onChange={event => appendFiles(event.target.files, 'audio')} />
            <input ref={videoInputRef} type="file" accept="video/*" multiple hidden onChange={event => appendFiles(event.target.files, 'video')} />
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

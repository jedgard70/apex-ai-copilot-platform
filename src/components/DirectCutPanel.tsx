import React, { useState } from 'react'

export type DirectCutInitialConfig = any

type DirectCutPanelProps = {
  source?: any
  goal?: any
  conversationContext?: any
  initialConfig?: any
  onRecordGeneration?: (payload: any) => void
  onClear: () => void
}

export default function DirectCutPanel({ source, goal, conversationContext, initialConfig, onRecordGeneration, onClear }: DirectCutPanelProps) {
  const [activeTab, setActiveTab] = useState<'board' | 'timeline'>('board')
  
  const [scriptText, setScriptText] = useState('Bem-vindo ao novo empreendimento de luxo no coração da cidade. Fachadas de vidro e design imponente.')
  const [isRewriting, setIsRewriting] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('JBFqnCBcs611MxpwweFS') // Marcus
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')


  const handleRewriteScript = async () => {
    setIsRewriting(true)
    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Reescreva este roteiro de vídeo para que fique mais atraente, cinematográfico e persuasivo para venda de imóveis de luxo: "${scriptText}"` }],
          modelId: 'gemini-3.5-pro'
        })
      })
      const data = await response.json()
      if (data && data.text) {
        setScriptText(data.text)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsRewriting(false)
    }
  }

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true)
    setAudioUrl('')
    try {
      const response = await fetch('/api/copilot/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          provider: 'elevenlabs',
          voice: selectedVoice,
          projectId: conversationContext?.project_id,
          tenantId: conversationContext?.tenant_id
        })
      })
      const data = await response.json()
      if (data.ok && (data.mediaUrl || data.audio)) {
        setAudioUrl(data.mediaUrl || `data:${data.mimeType || 'audio/mpeg'};base64,${data.audio}`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true)
    setVideoUrl('')
    try {
      const response = await fetch('/api/copilot/video-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scriptText,
          model: 'fal-ai/kling-video/v1.6/standard/text-to-video',
          duration: '5s',
          aspectRatio: '16:9',
          projectId: conversationContext?.project_id,
          tenantId: conversationContext?.tenant_id
        })
      })
      const data = await response.json()
      if (data.providerStatus === 'connected' && data.videoUrl) {
        setVideoUrl(data.videoUrl)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingVideo(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 bg-[#0b1326] flex flex-col text-[#dae2fd] overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-[#2d3449]/50 bg-[#131b2e]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onClear}>
            <div className="w-8 h-8 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] group-hover:border-purple-500 transition-colors">
              <span className="material-symbols-outlined text-sm text-[#afb9cb] group-hover:text-purple-400">arrow_back</span>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2 border-l border-[#2d3449] pl-4">
            <span className="material-symbols-outlined text-purple-500">movie_edit</span>
            Director's Cut <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 ml-2">NODE BOARD</span>
          </h1>
        </div>
        
        <div className="flex bg-[#171f33] p-1 rounded-xl border border-[#2d3449]">
          <button 
            onClick={() => setActiveTab('board')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'board' ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'text-[#8d90a0] hover:text-white'}`}
          >
            Node Board
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'timeline' ? 'bg-purple-600/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'text-[#8d90a0] hover:text-white'}`}
          >
            Timeline / Editor
          </button>
        </div>

        <div className="flex gap-3">
          <button className="h-9 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium text-sm flex items-center gap-2 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            Renderizar Vídeo
          </button>
        </div>
      </header>

      {/* INFINITE CANVAS / BOARD */}
      <div className="flex-1 relative bg-[#060e20] overflow-hidden" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #2d3449 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        
        {/* Node 1: Script */}
        <div className="absolute top-20 left-20 w-80 bg-[#131b2e]/90 backdrop-blur-xl border border-[#2d3449] rounded-2xl shadow-2xl flex flex-col overflow-hidden hover:border-blue-500/50 transition-colors">
          <div className="h-2 w-full bg-blue-500"></div>
          <div className="p-4 border-b border-[#2d3449] flex justify-between items-center bg-[#171f33]/50">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <span className="material-symbols-outlined text-blue-400 text-[18px]">description</span>
              1. Roteiro (Script)
            </div>
            <span className="material-symbols-outlined text-[#8d90a0] text-[16px] cursor-pointer hover:text-white">more_vert</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <select 
              onChange={e => e.target.value && setScriptText(e.target.value)}
              className="bg-[#0b1326] border border-[#2d3449] text-[10px] text-[#afb9cb] p-1.5 rounded outline-none w-full"
            >
              <option value="">Ideias de Roteiro (Templates)...</option>
              <optgroup label="Cinematic & Walkthrough">
                <option value="Descubra o novo padrão de luxo. (Pausa) Este é o Residencial Aurora. (Corte rápido) Acabamentos premium e vista definitiva.">Cinematic Trailer Curto</option>
                <option value="Bem-vindos ao apartamento decorado. Notem a integração perfeita entre living e varanda gourmet.">Walkthrough Imobiliário</option>
                <option value="Construção inteligente. Sustentabilidade. Eficiência. Acompanhe a evolução da nossa obra em tempo real.">Acompanhamento de Obra</option>
              </optgroup>
              <optgroup label="Campanhas & Hooks (Marketing)">
                <option value="Sua nova vida começa aqui. (Música inspiradora sobe) Aproveite as condições especiais de lançamento.">Campanha Vendas</option>
                <option value="See how Apex-enabled architecture becomes a clear, client-ready presentation in minutes.">Hook: Client-Ready Presentation</option>
                <option value="From concept to approval pack: a faster way to present your projects.">Hook: Faster Approval Pack</option>
                <option value="Stop losing time on manual rendering. Discover the automated workflow for your architecture projects.">Hook: Automated Workflow</option>
              </optgroup>
              <optgroup label="VSL & Landing Pages">
                <option value="[URGENCY] Oferta por tempo limitado. [HERO] Transforme a apresentação do seu escritório de arquitetura. [CTA] Agende uma demonstração hoje.">Estrutura VSL Básica</option>
                <option value="[INTRO] Você está perdendo vendas por não encantar seus clientes? [PROVA SOCIAL] Veja como nossos parceiros aumentaram o VGV em 30%. [OFFER] Conheça o Apex Copilot.">VSL Lead Generation</option>
              </optgroup>
            </select>
            <textarea 
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full h-24 bg-[#0b1326] border border-[#2d3449] rounded-lg p-2 text-xs text-[#dae2fd] resize-none focus:border-blue-500 focus:outline-none"
              placeholder="Digite seu roteiro..."
            />
            <button 
              onClick={handleRewriteScript}
              disabled={isRewriting}
              className="w-full py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRewriting ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">auto_awesome</span>}
              {isRewriting ? 'Reescrevendo...' : 'Reescrever com Apex IA'}
            </button>
          </div>
          {/* Node Output Port */}
          <div className="absolute right-[-6px] top-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#131b2e] shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
        </div>

        {/* Node 2: Voiceover (ElevenLabs) */}
        <div className="absolute top-20 left-[450px] w-72 bg-[#131b2e]/90 backdrop-blur-xl border border-[#2d3449] rounded-2xl shadow-2xl flex flex-col overflow-hidden hover:border-green-500/50 transition-colors">
          <div className="h-2 w-full bg-green-500"></div>
          {/* Node Input Port */}
          <div className="absolute left-[-6px] top-[30px] w-3 h-3 bg-blue-500 rounded-full border-2 border-[#131b2e]"></div>
          
          <div className="p-4 border-b border-[#2d3449] flex justify-between items-center bg-[#171f33]/50">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <span className="material-symbols-outlined text-green-400 text-[18px]">record_voice_over</span>
              2. Narração (ElevenLabs)
            </div>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#afb9cb] font-semibold uppercase">Voz Selecionada</label>
              <select 
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="bg-[#0b1326] border border-[#2d3449] text-xs text-white p-2 rounded-lg outline-none"
              >
                <option value="JBFqnCBcs611MxpwweFS">Marcus (Profundo, Comercial)</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Sarah (Suave, Real Estate)</option>
              </select>
            </div>
            {audioUrl ? (
              <div className="h-10 bg-[#0b1326] rounded-lg border border-green-500/50 flex items-center justify-between px-3 text-green-400">
                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                <span className="text-xs">Áudio Gerado</span>
                <audio src={audioUrl} controls className="hidden" id="directcut-audio-preview" />
                <button 
                  onClick={() => {
                    const el = document.getElementById('directcut-audio-preview') as HTMLAudioElement
                    if (el) el.play()
                  }} 
                  className="hover:text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">volume_up</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio}
                className="h-10 bg-[#0b1326] rounded-lg border border-[#2d3449] hover:bg-green-500/10 hover:border-green-500/30 flex items-center justify-center gap-2 text-[#8d90a0] hover:text-green-400 transition-colors disabled:opacity-50"
              >
                {isGeneratingAudio ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">graphic_eq</span>}
                <span className="text-xs">{isGeneratingAudio ? 'Gerando áudio...' : 'Gerar Voiceover'}</span>
              </button>
            )}
          </div>
          {/* Node Output Port */}
          <div className="absolute right-[-6px] top-[30px] w-3 h-3 bg-green-500 rounded-full border-2 border-[#131b2e] shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
        </div>

        {/* Node 3: Video Gen (FAL / Sora) */}
        <div className="absolute top-[320px] left-20 w-80 bg-[#131b2e]/90 backdrop-blur-xl border border-[#2d3449] rounded-2xl shadow-2xl flex flex-col overflow-hidden hover:border-purple-500/50 transition-colors">
          <div className="h-2 w-full bg-purple-500"></div>
          <div className="p-4 border-b border-[#2d3449] flex justify-between items-center bg-[#171f33]/50">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <span className="material-symbols-outlined text-purple-400 text-[18px]">movie</span>
              3. Geração de Cenas (FAL)
            </div>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {videoUrl ? (
                <div className="col-span-2 aspect-video bg-[#0b1326] rounded-lg border border-purple-500/50 flex items-center justify-center relative overflow-hidden group">
                  <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                </div>
              ) : (
                <>
                  <div className="aspect-video bg-[#0b1326] rounded-lg border border-[#2d3449] flex items-center justify-center relative overflow-hidden group">
                    <span className="material-symbols-outlined text-[#434655]">image</span>
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-xs text-white cursor-pointer">Vazio</div>
                  </div>
                  <div className="aspect-video bg-[#0b1326] rounded-lg border border-[#2d3449] flex items-center justify-center relative overflow-hidden group">
                    <span className="material-symbols-outlined text-[#434655]">image</span>
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-xs text-white cursor-pointer">Vazio</div>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo}
              className="w-full py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors flex justify-center items-center gap-1 disabled:opacity-50"
            >
              {isGeneratingVideo ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">add</span>}
              {isGeneratingVideo ? 'Gerando cena...' : 'Adicionar Cena (FAL)'}
            </button>
          </div>
          {/* Node Output Port */}
          <div className="absolute right-[-6px] top-1/2 w-3 h-3 bg-purple-500 rounded-full border-2 border-[#131b2e] shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
        </div>

        {/* Node 4: Timeline Merger */}
        <div className="absolute top-[200px] left-[850px] w-72 bg-[#131b2e]/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden">
          <div className="h-2 w-full bg-cyan-500"></div>
          
          {/* Inputs */}
          <div className="absolute left-[-6px] top-[30px] w-3 h-3 bg-green-500 rounded-full border-2 border-[#131b2e]"></div>
          <div className="absolute left-[-6px] top-[100px] w-3 h-3 bg-purple-500 rounded-full border-2 border-[#131b2e]"></div>
          
          <div className="p-4 border-b border-[#2d3449] flex justify-between items-center bg-[#171f33]/50">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">layers</span>
              4. Master Render
            </div>
          </div>
          <div className="p-4 flex flex-col gap-3 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 mb-2">
              <span className="material-symbols-outlined text-cyan-400 text-3xl">play_circle</span>
            </div>
            <h3 className="text-sm text-white font-medium">Pronto para compilar</h3>
            <p className="text-[11px] text-[#8d90a0]">Roteiro, áudio e 2 cenas conectadas no fluxo final.</p>
          </div>
        </div>

        {/* Cords (SVGs to connect nodes visually) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {/* Roteiro -> Voz */}
          <path d="M 390 140 C 420 140, 420 100, 450 100" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
          {/* Voz -> Master */}
          <path d="M 732 100 C 790 100, 790 230, 850 230" fill="none" stroke="#22c55e" strokeWidth="2" />
          {/* Video -> Master */}
          <path d="M 390 440 C 600 440, 600 300, 850 300" fill="none" stroke="#a855f7" strokeWidth="2" />
        </svg>
        
        {/* Floating Toolbar bottom center */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#171f33]/90 backdrop-blur-md border border-[#2d3449] rounded-full px-6 py-3 flex gap-6 shadow-2xl">
          <button className="flex flex-col items-center gap-1 text-[#8d90a0] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Novo Node</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#8d90a0] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">pan_tool</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Mover</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#8d90a0] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Auto-Layout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

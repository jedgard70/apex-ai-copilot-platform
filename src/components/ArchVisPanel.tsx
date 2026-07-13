import React, { useState } from 'react'
import { IntakeFile } from '../lib/fileIntake'

type GalleryItem = {
  id: string
  imageUrl?: string
  prompt: string
  style: string
  timestamp: string
}

type ArchVisPanelProps = {
  source?: any
  output?: any
  conversationContext?: any[]
  revisionConstraints?: any[]
  onAddRevisionConstraint?: (c: any) => void
  onRemoveRevisionConstraint?: (c: any) => void
  onClearRevisionConstraints?: () => void
  onRecordGeneration?: (payload: any) => void
  onSendToDirectCut?: (img: any) => void
  onClear: () => void
}

export default function ArchVisPanel({ source, output, onClear, onSendToDirectCut, onRecordGeneration }: ArchVisPanelProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'gallery'>('editor')
  const [prompt, setPrompt] = useState('Edifício residencial de luxo com fachada de vidro, iluminação noturna dramática, render hiper-realista, 8k, octane render.')
  const [isGenerating, setIsGenerating] = useState(false)
  const [gallery, setGallery] = useState<GalleryItem[]>([
    {
      id: '1',
      imageUrl: output,
      prompt: 'Design atual gerado',
      style: 'Photorealistic',
      timestamp: new Date().toISOString()
    }
  ])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setGallery(prev => [{
        id: Math.random().toString(),
        prompt,
        style: 'Modern',
        timestamp: new Date().toISOString()
      }, ...prev])
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1326] flex text-[#dae2fd] overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR (Glassmorphic) */}
      <div className="w-20 lg:w-64 border-r border-[#2d3449] bg-[#0b1326]/80 backdrop-blur-md flex flex-col p-4 shrink-0 shadow-[0_0_30px_rgba(37,99,235,0.05)]">
        
        <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer group" onClick={onClear}>
          <div className="w-8 h-8 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] group-hover:border-cyan-500 transition-colors">
            <span className="material-symbols-outlined text-sm text-[#afb9cb] group-hover:text-cyan-400">arrow_back</span>
          </div>
          <span className="hidden lg:block font-semibold text-[#eeefff] tracking-wide text-sm group-hover:text-cyan-400 transition-colors">
            Voltar ao Hub
          </span>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'editor' 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                : 'text-[#afb9cb] hover:bg-[#171f33] border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">architecture</span>
            <span className="hidden lg:block font-medium text-sm">Studio de Render</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'gallery' 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                : 'text-[#afb9cb] hover:bg-[#171f33] border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">gallery_thumbnail</span>
            <span className="hidden lg:block font-medium text-sm">Galeria de Assets</span>
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131b2e] via-[#0b1326] to-[#060e20]">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-[#2d3449]/50 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">photo_camera</span>
              ArchVis Studio <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 ml-2">PRO</span>
            </h1>
          </div>
          
          <div className="flex gap-3">
            <button className="h-9 w-9 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] hover:bg-[#2d3449] hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 p-6 lg:p-10 flex flex-col lg:flex-row gap-6 overflow-hidden">
          
          {/* Viewport Principal (Esquerda) */}
          <div className="flex-1 rounded-2xl bg-[#060e20] border border-[#2d3449] overflow-hidden flex flex-col relative shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
            {/* Toolbar do Viewport */}
            <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
              <div className="flex gap-2 pointer-events-auto">
                <button className="h-8 px-3 rounded-lg bg-[#0b1326]/80 backdrop-blur-md border border-[#2d3449] text-xs font-medium text-[#c3c6d7] hover:text-white hover:border-[#434655] transition-all">
                  Original
                </button>
                <button className="h-8 px-3 rounded-lg bg-blue-600/80 backdrop-blur-md border border-blue-500/50 text-xs font-medium text-white shadow-[0_0_10px_rgba(37,99,235,0.3)] transition-all">
                  Resultado
                </button>
              </div>
              <div className="flex gap-2 pointer-events-auto">
                <button className="h-8 w-8 rounded-lg bg-[#0b1326]/80 backdrop-blur-md border border-[#2d3449] flex items-center justify-center hover:bg-[#171f33] transition-all">
                  <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                </button>
                <button className="h-8 w-8 rounded-lg bg-[#0b1326]/80 backdrop-blur-md border border-[#2d3449] flex items-center justify-center hover:bg-[#171f33] transition-all">
                  <span className="material-symbols-outlined text-[16px]">zoom_out</span>
                </button>
              </div>
            </div>

            {/* Imagem */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              {source?.dataUrl || output ? (
                <img 
                  src={output || source?.dataUrl} 
                  alt="Viewport" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                />
              ) : (
                <div className="text-center text-[#434655] flex flex-col items-center">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">imagesmode</span>
                  <p className="text-sm font-medium">Nenhuma imagem carregada</p>
                </div>
              )}
            </div>
            
            {/* Status Bar */}
            <div className="h-8 bg-[#0b1326] border-t border-[#2d3449] flex items-center px-4 gap-4 text-[10px] font-mono text-[#8d90a0]">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_#22c55e]" /> Render Engine: Stable Diffusion XL</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_4px_#06b6d4]" /> Mode: Img2Img</span>
              <span>Res: 1024x1024</span>
            </div>
          </div>

          {/* Painel de Controle (Direita) - GLASSMORPHISM */}
          <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto shrink-0 pr-2 custom-scrollbar">
            
            {/* Bloco 1: Controle Criativo */}
            <div className="bg-[#171f33]/80 backdrop-blur-xl border border-[#2d3449] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
              
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-400">tune</span>
                Controle Criativo
              </h2>
              
              <div className="flex flex-col gap-3">
                <label className="text-xs font-medium text-[#afb9cb]">Estilo Arquitetônico</label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-medium text-left">
                    Hiper-Realista
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-[#0b1326] border border-[#2d3449] text-[#c3c6d7] hover:bg-[#222a3d] text-xs font-medium text-left transition-colors">
                    Esboço / Lápis
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-[#0b1326] border border-[#2d3449] text-[#c3c6d7] hover:bg-[#222a3d] text-xs font-medium text-left transition-colors">
                    Cyberpunk
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-[#0b1326] border border-[#2d3449] text-[#c3c6d7] hover:bg-[#222a3d] text-xs font-medium text-left transition-colors">
                    Humanizada (Planta)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-5">
                <label className="text-xs font-medium text-[#afb9cb]">Prompt de Renderização</label>
                <textarea 
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="w-full bg-[#060e20] border border-[#2d3449] rounded-xl p-3 text-sm text-[#dae2fd] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none h-24"
                  placeholder="Descreva o que você quer ver..."
                />
              </div>
            </div>

            {/* Bloco 2: Ações */}
            <div className="bg-[#171f33]/60 backdrop-blur-md border border-[#2d3449] rounded-2xl p-5 shadow-lg">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                    Renderizando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                    Gerar Novo Render (FAL)
                  </>
                )}
              </button>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0b1326] border border-[#2d3449] hover:bg-[#222a3d] text-[#c3c6d7] text-xs font-medium transition-colors">
                  <span className="material-symbols-outlined text-[16px]">download</span> Salvar Alta Res
                </button>
                <button className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0b1326] border border-[#2d3449] hover:bg-[#222a3d] text-[#c3c6d7] text-xs font-medium transition-colors">
                  <span className="material-symbols-outlined text-[16px]">send</span> Enviar DirectCut
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* GLOBAL SCROLLBAR STYLES injected for the panel */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d3449; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #434655; }
      `}</style>
    </div>
  )
}

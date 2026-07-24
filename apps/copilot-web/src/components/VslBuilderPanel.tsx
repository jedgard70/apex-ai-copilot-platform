import React, { useState } from 'react'

type VslBuilderPanelProps = {
  onClear: () => void
}

export default function VslBuilderPanel({ onClear }: VslBuilderPanelProps) {
  const [activeTab, setActiveTab] = useState<'storyboard' | 'export'>('storyboard')

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1326] flex flex-col text-[#dae2fd] overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-[#2d3449]/50 bg-[#131b2e]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onClear}>
            <div className="w-8 h-8 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] group-hover:border-rose-500 transition-colors">
              <span className="material-symbols-outlined text-sm text-[#afb9cb] group-hover:text-rose-400">arrow_back</span>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2 border-l border-[#2d3449] pl-4">
            <span className="material-symbols-outlined text-rose-500">movie_filter</span>
            VSL Builder <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 ml-2">DRAG & DROP STUDIO</span>
          </h1>
        </div>
        
        <div className="flex bg-[#171f33] p-1 rounded-xl border border-[#2d3449]">
          <button 
            onClick={() => setActiveTab('storyboard')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'storyboard' ? 'bg-rose-600/20 text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.2)]' : 'text-[#8d90a0] hover:text-white'}`}
          >
            Storyboard
          </button>
          <button 
            onClick={() => setActiveTab('export')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'export' ? 'bg-rose-600/20 text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.2)]' : 'text-[#8d90a0] hover:text-white'}`}
          >
            Configurações de Exportação
          </button>
        </div>

        <div className="flex gap-3">
          <button className="h-9 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-medium text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)] transition-all">
            <span className="material-symbols-outlined text-[18px]">publish</span>
            Publicar VSL
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: Library */}
        <div className="w-80 bg-[#131b2e] border-r border-[#2d3449] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#2d3449]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0] text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Buscar assets..." 
                className="w-full bg-[#0b1326] border border-[#2d3449] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            
            {/* Category: Renders */}
            <div>
              <h3 className="text-xs font-bold text-[#afb9cb] uppercase tracking-wider mb-3">Meus Renders</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-video bg-[#0b1326] rounded-lg border border-[#2d3449] hover:border-rose-500/50 cursor-grab flex items-center justify-center relative group overflow-hidden">
                  <span className="material-symbols-outlined text-[#434655]">image</span>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white">drag_indicator</span>
                  </div>
                </div>
                <div className="aspect-video bg-[#0b1326] rounded-lg border border-[#2d3449] hover:border-rose-500/50 cursor-grab flex items-center justify-center relative group overflow-hidden">
                  <span className="material-symbols-outlined text-[#434655]">image</span>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white">drag_indicator</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category: Audios */}
            <div>
              <h3 className="text-xs font-bold text-[#afb9cb] uppercase tracking-wider mb-3">Áudios e Trilhas</h3>
              <div className="flex flex-col gap-2">
                <div className="bg-[#0b1326] border border-[#2d3449] hover:border-rose-500/50 rounded-lg p-2 flex items-center gap-3 cursor-grab group">
                  <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-400 text-[18px]">record_voice_over</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-white font-medium">Locução Principal</div>
                    <div className="text-[10px] text-[#8d90a0]">0:45 • Marcus (11Labs)</div>
                  </div>
                  <span className="material-symbols-outlined text-[#434655] group-hover:text-white">drag_indicator</span>
                </div>
                
                <div className="bg-[#0b1326] border border-[#2d3449] hover:border-rose-500/50 rounded-lg p-2 flex items-center gap-3 cursor-grab group">
                  <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-400 text-[18px]">music_note</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-white font-medium">Trilha Cinematográfica</div>
                    <div className="text-[10px] text-[#8d90a0]">2:30 • Epic Ambient</div>
                  </div>
                  <span className="material-symbols-outlined text-[#434655] group-hover:text-white">drag_indicator</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT PANE: Storyboard Canvas */}
        <div className="flex-1 bg-[#060e20] flex flex-col relative"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #2d3449 1px, transparent 0)', backgroundSize: '40px 40px' }}>
          
          {/* Viewport Preview */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="aspect-video w-full max-w-[800px] bg-black rounded-xl shadow-2xl border border-[#2d3449] relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 flex items-center justify-center text-[#434655]">
                 <span className="material-symbols-outlined text-6xl">play_circle</span>
               </div>
               {/* Safe area guides */}
               <div className="absolute inset-4 border border-dashed border-white/20 pointer-events-none"></div>
            </div>
          </div>

          {/* Timeline / Storyboard Track */}
          <div className="h-64 bg-[#0b1326] border-t border-[#2d3449] flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10 shrink-0">
            {/* Timeline Toolbar */}
            <div className="h-10 border-b border-[#2d3449] flex items-center justify-between px-4 bg-[#131b2e]">
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  <button className="text-white hover:text-rose-400 transition-colors"><span className="material-symbols-outlined">play_arrow</span></button>
                  <button className="text-[#8d90a0] hover:text-white transition-colors"><span className="material-symbols-outlined">pause</span></button>
                  <button className="text-[#8d90a0] hover:text-white transition-colors"><span className="material-symbols-outlined">stop</span></button>
                </div>
                <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">00:00:15:00</span>
              </div>
              <div className="flex gap-2 text-[#8d90a0]">
                 <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-white">content_cut</span>
                 <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-white">content_copy</span>
                 <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-white">delete</span>
              </div>
            </div>

            {/* Tracks */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex flex-col bg-[#060e20] relative">
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 left-[200px] w-px bg-rose-500 z-20">
                <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-rose-500 rotate-45"></div>
              </div>

              {/* Video Track */}
              <div className="flex h-16 border-b border-[#2d3449] items-center relative pl-4 bg-[#131b2e]/50">
                <div className="w-24 shrink-0 text-[10px] text-[#afb9cb] font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">movie</span> Vídeo
                </div>
                <div className="flex-1 flex gap-1 h-12 relative px-2">
                  <div className="h-full w-48 bg-purple-500/20 border border-purple-500/50 rounded flex items-center justify-center cursor-pointer hover:bg-purple-500/30">
                    <span className="text-xs font-medium text-purple-300">Cena 1 (Fade)</span>
                  </div>
                  <div className="h-full w-32 bg-purple-500/20 border border-purple-500/50 rounded flex items-center justify-center cursor-pointer hover:bg-purple-500/30">
                    <span className="text-xs font-medium text-purple-300">Cena 2</span>
                  </div>
                </div>
              </div>

              {/* Voice Track */}
              <div className="flex h-12 border-b border-[#2d3449] items-center relative pl-4">
                <div className="w-24 shrink-0 text-[10px] text-[#afb9cb] font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">record_voice_over</span> Voz
                </div>
                <div className="flex-1 flex gap-1 h-8 relative px-2">
                  <div className="h-full w-[350px] bg-blue-500/20 border border-blue-500/50 rounded flex items-center px-2 cursor-pointer hover:bg-blue-500/30">
                    {/* Fake waveform */}
                    <svg width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0 15 Q 10 5, 20 15 T 40 15 T 60 15 T 80 15 T 100 15" stroke="rgba(96,165,250,0.5)" fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                    </svg>
                    <span className="absolute text-[10px] text-blue-300 font-medium z-10 left-2">Locução_01.wav</span>
                  </div>
                </div>
              </div>

              {/* Music Track */}
              <div className="flex h-12 items-center relative pl-4">
                <div className="w-24 shrink-0 text-[10px] text-[#afb9cb] font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">music_note</span> Trilha
                </div>
                <div className="flex-1 flex gap-1 h-8 relative px-2">
                  <div className="h-full w-[600px] bg-green-500/20 border border-green-500/50 rounded flex items-center px-2 cursor-pointer hover:bg-green-500/30">
                    <span className="absolute text-[10px] text-green-300 font-medium z-10 left-2">Epic_Ambient_Loop.mp3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Scrollbar styling */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d3449; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #434655; }
      `}</style>
    </div>
  )
}

import React, { useState } from 'react'

export type BimArchVisOutput = any
export type BimTourOutput = any

type Bim3DPanelProps = {
  source?: any
  externalCommand?: any
  onSendTourToDirectCut?: (payload: any) => void
  onSendViewToArchVis?: (payload: any) => void
  onClear: () => void
}

export default function Bim3DPanel({ source, externalCommand, onSendTourToDirectCut, onSendViewToArchVis, onClear }: Bim3DPanelProps) {
  const [activeTab, setActiveTab] = useState<'viewer' | 'clash'>('viewer')
  
  return (
    <div className="fixed inset-0 z-50 bg-[#0b1326] flex flex-col text-[#dae2fd] overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-[#2d3449]/50 bg-[#131b2e]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onClear}>
            <div className="w-8 h-8 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] group-hover:border-orange-500 transition-colors">
              <span className="material-symbols-outlined text-sm text-[#afb9cb] group-hover:text-orange-400">arrow_back</span>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2 border-l border-[#2d3449] pl-4">
            <span className="material-symbols-outlined text-orange-500">architecture</span>
            BIM 3D Studio <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20 ml-2">IFC / REVIT</span>
          </h1>
        </div>
        
        <div className="flex bg-[#171f33] p-1 rounded-xl border border-[#2d3449]">
          <button 
            onClick={() => setActiveTab('viewer')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'viewer' ? 'bg-orange-600/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'text-[#8d90a0] hover:text-white'}`}
          >
            Visualizador 3D
          </button>
          <button 
            onClick={() => setActiveTab('clash')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'clash' ? 'bg-orange-600/20 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'text-[#8d90a0] hover:text-white'}`}
          >
            Clash Detection (IA)
          </button>
        </div>

        <div className="flex gap-3">
          <button className="h-9 w-9 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] hover:bg-[#2d3449] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
          <button className="h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm flex items-center gap-2 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Importar IFC
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: Model Tree & Filters */}
        <div className="w-72 bg-[#0b1326]/80 backdrop-blur-md border-r border-[#2d3449] flex flex-col p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 shrink-0">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-400 text-[18px]">account_tree</span>
            Estrutura do Modelo
          </h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
            {/* Tree Item */}
            <div className="flex items-center justify-between text-sm text-white group cursor-pointer">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-[#8d90a0]">arrow_drop_down</span>
                <span className="material-symbols-outlined text-[16px] text-blue-400">domain</span>
                <span className="font-medium">Edifício Torre Sul</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#8d90a0] hover:text-white">visibility</span>
            </div>
            
            {/* Child Tree Item */}
            <div className="flex items-center justify-between text-sm text-[#dae2fd] pl-5 group cursor-pointer">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-[#8d90a0]">arrow_drop_down</span>
                <span className="material-symbols-outlined text-[16px] text-gray-400">layers</span>
                <span>Arquitetura</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#8d90a0] hover:text-white">visibility</span>
            </div>

            {/* Grandchild Items */}
            <div className="flex items-center justify-between text-xs text-[#afb9cb] pl-10 py-1 hover:bg-[#171f33] rounded px-2 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                Paredes Básicas
              </div>
              <span className="material-symbols-outlined text-[14px] text-white">visibility</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#afb9cb] pl-10 py-1 hover:bg-[#171f33] rounded px-2 cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                Vidros e Esquadrias
              </div>
              <span className="material-symbols-outlined text-[14px] text-white">visibility</span>
            </div>

            {/* Child Tree Item 2 */}
            <div className="flex items-center justify-between text-sm text-[#dae2fd] pl-5 mt-2 group cursor-pointer">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-[#8d90a0]">arrow_right</span>
                <span className="material-symbols-outlined text-[16px] text-green-500">plumbing</span>
                <span>Hidráulica (MEP)</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#8d90a0] hover:text-white">visibility_off</span>
            </div>

            {/* Child Tree Item 3 */}
            <div className="flex items-center justify-between text-sm text-[#dae2fd] pl-5 mt-2 group cursor-pointer">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-[#8d90a0]">arrow_right</span>
                <span className="material-symbols-outlined text-[16px] text-yellow-500">electric_bolt</span>
                <span>Elétrica (MEP)</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#8d90a0] hover:text-white">visibility_off</span>
            </div>
          </div>
        </div>

        {/* 3D VIEWPORT */}
        <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#171f33] to-[#060e20] flex items-center justify-center">
          
          {/* Mockup 3D Representation */}
          <div className="absolute inset-0 flex items-center justify-center opacity-40 mix-blend-screen pointer-events-none">
            <svg width="400" height="400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-500 animate-[spin_60s_linear_infinite]">
              <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" />
              <path d="M50 10 L50 50 L90 30" />
              <path d="M50 50 L90 70" />
              <path d="M50 50 L50 90" />
              <path d="M50 50 L10 70" />
              <path d="M50 50 L10 30" />
              
              <path d="M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z" stroke="rgba(249,115,22,0.8)" strokeWidth="0.2" />
              <path d="M50 20 L50 50 L80 35" stroke="rgba(249,115,22,0.8)" strokeWidth="0.2" />
              
              {/* Clash Marker */}
              <circle cx="65" cy="42" r="3" fill="rgba(239,68,68,0.8)" stroke="none" className="animate-pulse" />
            </svg>
          </div>

          {/* 3D Toolbar (Floating) */}
          <div className="absolute right-6 top-6 bg-[#0b1326]/80 backdrop-blur-md border border-[#2d3449] rounded-xl shadow-lg flex flex-col p-1 gap-1">
            <button className="h-8 w-8 rounded-lg text-[#afb9cb] hover:text-white hover:bg-[#171f33] transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">3d_rotation</span>
            </button>
            <button className="h-8 w-8 rounded-lg text-[#afb9cb] hover:text-white hover:bg-[#171f33] transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">pan_tool</span>
            </button>
            <button className="h-8 w-8 rounded-lg text-[#afb9cb] hover:text-white hover:bg-[#171f33] transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
            </button>
            <button className="h-8 w-8 rounded-lg text-[#afb9cb] hover:text-white hover:bg-[#171f33] transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">layers_clear</span>
            </button>
            <div className="h-[1px] w-full bg-[#2d3449] my-1"></div>
            <button className="h-8 w-8 rounded-lg text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
            </button>
          </div>

          {/* CLASH DETECTION PANEL (Floating if activeTab === 'clash') */}
          {activeTab === 'clash' && (
            <div className="absolute left-6 bottom-6 w-[400px] bg-[#131b2e]/90 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#2d3449] flex justify-between items-center bg-[#171f33]/50">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
                  Conflitos Detectados (IA)
                </div>
                <div className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                  3 Issues
                </div>
              </div>
              
              <div className="flex flex-col p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                
                {/* Clash Item 1 */}
                <div className="p-3 bg-[#0b1326] border border-red-500/40 rounded-xl mb-2 cursor-pointer hover:bg-[#171f33] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-white">Tubulação vs Viga Estrutural</span>
                    <span className="text-[10px] text-[#8d90a0]">Hard Clash</span>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">MEP (Tubo_PVC_100mm)</span>
                    <span className="text-[#8d90a0]">X</span>
                    <span className="bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded border border-gray-500/20">ARQ (Viga_Aço_W200)</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button className="text-xs font-medium text-blue-400 hover:text-blue-300">Resolução Automática Apex</button>
                  </div>
                </div>

                {/* Clash Item 2 */}
                <div className="p-3 bg-[#0b1326] border border-orange-500/40 rounded-xl cursor-pointer hover:bg-[#171f33] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-white">Duto de Ar vs Porta</span>
                    <span className="text-[10px] text-[#8d90a0]">Soft Clash (Clearance)</span>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">HVAC (Duto_Ret)</span>
                    <span className="text-[#8d90a0]">X</span>
                    <span className="bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded border border-gray-500/20">ARQ (Porta_Madeira)</span>
                  </div>
                </div>

              </div>
              
              <div className="p-3 bg-[#171f33] border-t border-[#2d3449]">
                <button className="w-full py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-semibold hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">
                  Executar Nova Análise de Colisão
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

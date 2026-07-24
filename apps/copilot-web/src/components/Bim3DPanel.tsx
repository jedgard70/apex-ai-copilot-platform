import React, { useState, Suspense, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Edges, Html } from '@react-three/drei'
import { CloudUpload, UploadCloud, Loader } from 'lucide-react'
import { ApsPanel } from './ApsPanel'
import { IfcViewer } from './IfcViewer'

export type BimArchVisOutput = any
export type BimTourOutput = any

type Bim3DPanelProps = {
  source?: any
  externalCommand?: any
  onSendTourToDirectCut?: (payload: any) => void
  onSendViewToArchVis?: (payload: any) => void
  onClear: () => void
}

function NativeIfcStudio({ source, externalCommand, onSendTourToDirectCut, onSendViewToArchVis, onClear }: Bim3DPanelProps) {
  const [activeTab, setActiveTab] = useState<'viewer' | 'clash'>('viewer')
  
  // 3D UI State
  const [isXRay, setIsXRay] = useState(false)
  const [isExploded, setIsExploded] = useState(false)
  
  // Layer Visibility State
  const [layers, setLayers] = useState({
    architecture: true,
    structural: true,
    mep: true
  })

  // File state
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.toLowerCase().endsWith('.ifc')) {
      setFile(f)
    } else {
      alert("Por favor, selecione um arquivo .ifc")
    }
  }, [])

  const activeControls = []
  if (isXRay) activeControls.push('X-Ray')
  if (isExploded) activeControls.push('Exploded View')
  if (activeTab === 'clash') activeControls.push('Clash Detection (Interferências)')

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
            BIM 3D Studio <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20 ml-2">IFC (Nativo WebGL)</span>
          </h1>
        </div>
        
        {file && (
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
        )}

        <div className="flex gap-3">
          <button className="h-9 w-9 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] hover:bg-[#2d3449] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm flex items-center gap-2 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {file ? 'Trocar Arquivo' : 'Importar IFC'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ifc"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}
          />
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANEL: Model Tree & Filters */}
        {file && (
          <div className="w-72 bg-[#0b1326]/80 backdrop-blur-md border-r border-[#2d3449] flex flex-col p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 shrink-0 absolute left-0 top-0 bottom-0 pointer-events-auto">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400 text-[18px]">account_tree</span>
              Estrutura do Modelo
            </h2>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-white group cursor-pointer">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-[#8d90a0]">arrow_drop_down</span>
                  <span className="material-symbols-outlined text-[16px] text-blue-400">domain</span>
                  <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-[#dae2fd] pl-5 group cursor-pointer mt-2" onClick={() => toggleLayer('architecture')}>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-[#8d90a0]">arrow_right</span>
                  <span className="material-symbols-outlined text-[16px] text-gray-400">layers</span>
                  <span>Arquitetura</span>
                </div>
                <span className={`material-symbols-outlined text-[16px] ${layers.architecture ? 'text-white' : 'text-[#8d90a0]'}`}>
                  {layers.architecture ? 'visibility' : 'visibility_off'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-[#dae2fd] pl-5 group cursor-pointer mt-2" onClick={() => toggleLayer('structural')}>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-[#8d90a0]">arrow_right</span>
                  <span className="material-symbols-outlined text-[16px] text-orange-400">foundation</span>
                  <span>Estrutural</span>
                </div>
                <span className={`material-symbols-outlined text-[16px] ${layers.structural ? 'text-white' : 'text-[#8d90a0]'}`}>
                  {layers.structural ? 'visibility' : 'visibility_off'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-[#dae2fd] pl-5 group cursor-pointer mt-2" onClick={() => toggleLayer('mep')}>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-[#8d90a0]">arrow_right</span>
                  <span className="material-symbols-outlined text-[16px] text-green-500">plumbing</span>
                  <span>Instalações (MEP)</span>
                </div>
                <span className={`material-symbols-outlined text-[16px] ${layers.mep ? 'text-white' : 'text-[#8d90a0]'}`}>
                  {layers.mep ? 'visibility' : 'visibility_off'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3D VIEWPORT */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#171f33] to-[#060e20] flex items-center justify-center">
          {!file ? (
             <div 
               onDragOver={e => { e.preventDefault(); setDragging(true) }}
               onDragLeave={() => setDragging(false)}
               onDrop={onDrop}
               onClick={() => fileInputRef.current?.click()}
               style={{
                 border: `2px dashed ${dragging ? '#ea580c' : '#2d3449'}`,
                 borderRadius: '12px', padding: '48px', textAlign: 'center',
                 cursor: 'pointer',
                 background: dragging ? 'rgba(234, 88, 12, 0.1)' : 'rgba(23, 31, 51, 0.5)',
                 transition: 'all 0.2s', width: '400px', maxWidth: '90%'
               }}
             >
               <UploadCloud size={48} style={{ margin: '0 auto 16px', color: dragging ? '#ea580c' : '#8d90a0' }} />
               <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600, color: '#fff' }}>Arraste um arquivo IFC aqui</h3>
               <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                 Para visualização nativa WebGL local sem envio para nuvem. <br/><br/>
                 (Para RVT, DWG e modelos pesados, use a aba APS)
               </p>
             </div>
          ) : (
            <IfcViewer file={file} activeControls={activeControls} />
          )}
        </div>

        {/* 3D Toolbar (Floating on right) */}
        {file && (
          <div className="absolute right-6 top-6 bg-[#0b1326]/80 backdrop-blur-md border border-[#2d3449] rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col p-1 gap-1 z-10 pointer-events-auto">
            <div className="p-2 border-b border-[#2d3449] mb-1">
              <span className="text-[10px] uppercase font-bold text-[#8d90a0] block text-center">Tools</span>
            </div>
            <button 
              onClick={() => setIsXRay(!isXRay)}
              className={`h-10 w-10 rounded-lg transition-colors flex items-center justify-center group relative
                ${isXRay ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/30' : 'text-[#afb9cb] hover:text-white hover:bg-[#171f33] border border-transparent'}`}
              title="Modo Raio-X"
            >
              <span className="material-symbols-outlined text-[20px]">view_in_ar</span>
              <div className="absolute right-full mr-2 bg-[#171f33] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                Visão Raio-X
              </div>
            </button>
            
            <button 
              onClick={() => setIsExploded(!isExploded)}
              className={`h-10 w-10 rounded-lg transition-colors flex items-center justify-center group relative
                ${isExploded ? 'text-orange-400 bg-orange-500/20 border border-orange-500/30' : 'text-[#afb9cb] hover:text-white hover:bg-[#171f33] border border-transparent'}`}
              title="Vista Explodida"
            >
              <span className="material-symbols-outlined text-[20px]">layers_clear</span>
              <div className="absolute right-full mr-2 bg-[#171f33] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                Vista Explodida
              </div>
            </button>
          </div>
        )}

        {/* CLASH DETECTION PANEL */}
        {activeTab === 'clash' && file && (
          <div className="absolute left-72 ml-6 bottom-6 w-[400px] bg-[#131b2e]/90 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden z-20 pointer-events-auto">
            <div className="p-4 border-b border-[#2d3449] flex justify-between items-center bg-[#171f33]/50">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
                Conflitos Detectados (IA)
              </div>
              <div className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                1 Issue
              </div>
            </div>
            
            <div className="flex flex-col p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              <div className="p-3 bg-[#0b1326] border border-red-500/40 rounded-xl mb-2 cursor-pointer hover:bg-[#171f33] transition-colors" onClick={() => { setIsXRay(true); setLayers({architecture: false, structural: true, mep: true}) }}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-white">Elemento IFC ID 42 vs ID 89</span>
                  <span className="text-[10px] text-[#8d90a0]">Hard Clash</span>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">MEP</span>
                  <span className="text-[#8d90a0]">X</span>
                  <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">ESTRUTURAL</span>
                </div>
                <div className="mt-3 flex justify-end">
                  <button className="text-[10px] font-medium text-blue-400 hover:text-blue-300">Isolar Conflito</button>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-[#171f33] border-t border-[#2d3449]">
              <button className="w-full py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-semibold hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">
                Executar Nova Análise
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function Bim3DPanel(props: Bim3DPanelProps) {
  const [engine, setEngine] = useState<'aps' | 'native'>('aps')
  
  // Floating engine switcher
  const engineSwitcher = (
    <div style={{ position: 'fixed', top: '16px', right: '120px', zIndex: 99999, display: 'flex', gap: '8px', background: 'rgba(11, 19, 38, 0.8)', padding: '6px', borderRadius: '12px', border: '1px solid #2d3449', backdropFilter: 'blur(10px)' }}>
      <button 
        onClick={() => setEngine('aps')} 
        style={{ background: engine === 'aps' ? '#2563eb' : 'transparent', color: engine === 'aps' ? '#fff' : '#94a3b8', border: 'none', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s' }}
      >
        APS (Produção)
      </button>
      <button 
        onClick={() => setEngine('native')} 
        style={{ background: engine === 'native' ? '#ea580c' : 'transparent', color: engine === 'native' ? '#fff' : '#94a3b8', border: 'none', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s' }}
      >
        IFC Nativo (P&D)
      </button>
    </div>
  )

  return (
    <>
      {engineSwitcher}
      {engine === 'aps' ? (
        <ApsPanel {...props} />
      ) : (
        <NativeIfcStudio {...props} />
      )}
    </>
  )
}

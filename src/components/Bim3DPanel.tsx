import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Edges } from '@react-three/drei'

export type BimArchVisOutput = any
export type BimTourOutput = any

type Bim3DPanelProps = {
  source?: any
  externalCommand?: any
  onSendTourToDirectCut?: (payload: any) => void
  onSendViewToArchVis?: (payload: any) => void
  onClear: () => void
}

function BuildingModel({ isXRay, isExploded, visibleLayers }: { isXRay: boolean, isExploded: boolean, visibleLayers: any }) {
  const floors = [0, 1, 2];
  const floorHeight = 3;
  const explodedOffset = isExploded ? 4 : 0;

  const archMatProps = isXRay 
    ? { transparent: true, opacity: 0.15, wireframe: false } 
    : { transparent: false, opacity: 1, wireframe: false };
    
  const structMatProps = isXRay 
    ? { transparent: true, opacity: 0.3, wireframe: true } 
    : { transparent: false, opacity: 1, wireframe: false };

  return (
    <group position={[0, -2, 0]}>
      {floors.map(floor => {
        const yBase = floor * (floorHeight + explodedOffset);
        return (
          <group key={floor} position={[0, yBase, 0]}>
            {/* Architecture (Floors and Walls) */}
            {visibleLayers.architecture && (
              <>
                <mesh position={[0, 0, 0]} receiveShadow castShadow>
                  <boxGeometry args={[10, 0.2, 10]} />
                  <meshStandardMaterial color="#8d90a0" {...archMatProps} />
                </mesh>
                {/* External Walls with Windows (Gaps) */}
                <mesh position={[-4.9, 1.5, 2]} receiveShadow castShadow>
                  <boxGeometry args={[0.2, 3, 6]} />
                  <meshStandardMaterial color="#dae2fd" {...archMatProps} />
                </mesh>
                <mesh position={[-4.9, 1.5, -4]} receiveShadow castShadow>
                  <boxGeometry args={[0.2, 3, 2]} />
                  <meshStandardMaterial color="#dae2fd" {...archMatProps} />
                </mesh>
                <mesh position={[4.9, 1.5, 0]} receiveShadow castShadow>
                  <boxGeometry args={[0.2, 3, 10]} />
                  <meshStandardMaterial color="#dae2fd" {...archMatProps} />
                </mesh>
              </>
            )}

            {/* Structural (Columns and Beams) */}
            {visibleLayers.structural && (
              <>
                {[-4, 0, 4].map(x => 
                  [-4, 4].map(z => (
                    <mesh key={`col-${x}-${z}`} position={[x, 1.5, z]} castShadow>
                      <boxGeometry args={[0.4, 3, 0.4]} />
                      <meshStandardMaterial color="#475569" {...structMatProps} />
                      <Edges threshold={15} color={isXRay ? "#38bdf8" : "#1e293b"} />
                    </mesh>
                  ))
                )}
                {/* Beams */}
                {[-4, 4].map(z => (
                  <mesh key={`beam-${z}`} position={[0, 2.9, z]} castShadow>
                    <boxGeometry args={[10, 0.3, 0.4]} />
                    <meshStandardMaterial color="#475569" {...structMatProps} />
                  </mesh>
                ))}
              </>
            )}

            {/* MEP (Pipes/Ducts) */}
            {visibleLayers.mep && (
              <>
                {/* Hot Water Pipe */}
                <mesh position={[0, 2.5, 2]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.1, 0.1, 8, 16]} />
                  <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.8} />
                </mesh>
                {/* Cold Water Pipe */}
                <mesh position={[0, 2.5, 2.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.1, 0.1, 8, 16]} />
                  <meshStandardMaterial color="#3b82f6" roughness={0.2} metalness={0.8} />
                </mesh>
                {/* HVAC Duct */}
                <mesh position={[1, 2.7, -2]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <boxGeometry args={[0.4, 8, 0.8]} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.5} />
                </mesh>
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

export default function Bim3DPanel({ source, externalCommand, onSendTourToDirectCut, onSendViewToArchVis, onClear }: Bim3DPanelProps) {
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

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

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
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANEL: Model Tree & Filters */}
        <div className="w-72 bg-[#0b1326]/80 backdrop-blur-md border-r border-[#2d3449] flex flex-col p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 shrink-0 absolute left-0 top-0 bottom-0 pointer-events-auto">
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
            </div>
            
            {/* Layer Toggles */}
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

        {/* 3D VIEWPORT (Canvas) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#171f33] to-[#060e20]">
          <Canvas shadows camera={{ position: [15, 10, 15], fov: 45 }}>
            <color attach="background" args={['#060e20']} />
            <fog attach="fog" args={['#060e20', 20, 60]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <directionalLight position={[-10, 10, -10]} intensity={0.5} color="#38bdf8" />
            
            <Suspense fallback={null}>
              <BuildingModel isXRay={isXRay} isExploded={isExploded} visibleLayers={layers} />
              <Environment preset="city" />
              <ContactShadows position={[0, -2.1, 0]} opacity={0.5} scale={40} blur={2} far={4} />
            </Suspense>

            <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.1} />
            <gridHelper args={[40, 40, '#2d3449', '#171f33']} position={[0, -2.05, 0]} />
          </Canvas>
        </div>

        {/* 3D Toolbar (Floating on right) */}
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

        {/* CLASH DETECTION PANEL (Floating if activeTab === 'clash') */}
        {activeTab === 'clash' && (
          <div className="absolute left-72 ml-6 bottom-6 w-[400px] bg-[#131b2e]/90 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden z-20 pointer-events-auto">
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
              <div className="p-3 bg-[#0b1326] border border-red-500/40 rounded-xl mb-2 cursor-pointer hover:bg-[#171f33] transition-colors" onClick={() => { setIsXRay(true); setLayers({architecture: false, structural: true, mep: true}) }}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-white">Tubulação vs Pilar Estrutural</span>
                  <span className="text-[10px] text-[#8d90a0]">Hard Clash</span>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">MEP (Tubo_PVC)</span>
                  <span className="text-[#8d90a0]">X</span>
                  <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">ESTRUTURAL (Pilar)</span>
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

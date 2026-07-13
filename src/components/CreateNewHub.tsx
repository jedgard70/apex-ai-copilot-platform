import React, { useState } from 'react';

export const CreateNewHub: React.FC<{ isOpen: boolean; onClose: () => void; onSelectTool?: (navId: string) => void }> = ({ isOpen, onClose, onSelectTool }) => {
  const [activeTab, setActiveTab] = useState('Imagem');

  if (!isOpen) return null;

  const tabs = ['Imagem', 'Video', 'Áudio', 'Espaços', 'Projeto', '3D', 'Fluxos', 'Conexões'];

  const toolsMap: Record<string, { title: string; subtitle: string; icon: string; navId?: string; isNew?: boolean; isPinned?: boolean; isLegacy?: boolean }[]> = {
    'Imagem': [
      { title: 'Assistente', subtitle: 'Converse, crie e edite com IA.', icon: '✨', navId: 'chat', isPinned: true },
      { title: 'Gerador de Imagens', subtitle: 'Criar imagens a partir de instruções de...', icon: '🖼️', navId: 'archvis', isPinned: true },
      { title: 'Ampliador de imagem', subtitle: 'Melhore a resolução e os detalhes.', icon: '🔍', navId: 'archvis', isPinned: true },
      { title: 'Editor de Imagens', subtitle: 'Editar e modificar imagens existentes', icon: '✏️', navId: 'archvis', isPinned: true },
      { title: 'Plano cinematográfico', subtitle: 'Gerar composições cinematográficas', icon: '🎬', navId: 'archvis', isPinned: true },
      { title: 'Melhorador de Pele', subtitle: 'Retoque e aprimore os detalhes da pele.', icon: '💆', navId: 'archvis', isPinned: true },
      { title: 'Variações', subtitle: 'Criar variações de uma imagem', icon: '🔄', navId: 'archvis', isPinned: true },
      { title: 'Alterar câmera', subtitle: 'Ajuste o ângulo da câmera e a lente.', icon: '📷', navId: 'archvis' },
      { title: 'Gerador de Maquetes', subtitle: 'Insira os designs nas maquetes dos pr...', icon: '📦', navId: 'archvis' },
      { title: 'Remover fundo', subtitle: 'Isolar os indivíduos do fundo', icon: '✂️', navId: 'archvis' },
      { title: 'Reacender', subtitle: 'Alterar a iluminação e a atmosfera', icon: '💡', navId: 'archvis' }
    ],
    'Projeto': [
      { title: 'Designer', subtitle: 'Crie e desenhe com modelos.', icon: '📐', navId: 'bim' },
      { title: 'Explore modelos', subtitle: 'Navegue por modelos de design prontos', icon: '🎨', navId: 'bim' },
      { title: 'Camadas automáticas', subtitle: 'Transforme qualquer imagem em um d...', icon: '🥞', navId: 'archvis', isNew: true },
      { title: 'Editor de Design', subtitle: 'Projete com controle total', icon: '🖌️', navId: 'archvis', isLegacy: true }
    ],
    '3D': [
      { title: 'Gerador 3D', subtitle: 'Gere objetos e personagens em 3D.', icon: '🧊', navId: 'bim', isPinned: true },
      { title: 'Cenas 3D', subtitle: 'Crie ambientes e cenas em 3D.', icon: '🏙️', navId: 'bim', isNew: true, isPinned: true },
      { title: 'Gerador de 360º', subtitle: 'Gere imagens panorâmicas de 360º', icon: '🌐', navId: 'bim', isNew: true }
    ],
    // Placeholders for others
    'Video': [
      { title: 'DirectCut', subtitle: 'Gerador de Vídeos Baseado em Nodes', icon: '🎥', navId: 'directcut' }
    ],
    'Áudio': [
      { title: 'ElevenLabs Voice', subtitle: 'Clonagem e Síntese de Voz Text-to-Speech', icon: '🎙️', navId: 'avatarvoice' }
    ],
    'Espaços': [
      { title: 'Project Workspace', subtitle: 'Gestão de pastas e arquivos de obra', icon: '📁', navId: 'fieldops' }
    ],
    'Fluxos': [
      { title: 'Automação n8n', subtitle: 'Integrações e workflows empresariais', icon: '⚙️', navId: 'global-workflow' }
    ],
    'Conexões': [
      { title: 'SAP & CRM', subtitle: 'Integração de dados externos', icon: '🔗', navId: 'crm' }
    ]
  };

  const currentTools = toolsMap[activeTab] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-5xl bg-[#0b1326]/90 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
          <h2 className="text-2xl font-bold text-white tracking-tight">Criar novo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Search & Tabs Row */}
        <div className="flex items-center justify-between px-8 py-4 bg-black/20">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative ml-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Pesquise ferramentas e fluxos" 
              className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 w-64 transition-all"
            />
          </div>
        </div>

        {/* Tools Grid */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTools.map((tool, idx) => (
              <button 
                key={idx} 
                onClick={() => {
                  if (tool.navId) {
                    onSelectTool?.(tool.navId);
                    onClose();
                  }
                }}
                className="flex items-start text-left p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all group relative"
              >
                {tool.isPinned && (
                  <svg className="absolute top-4 right-4 w-4 h-4 text-gray-500 group-hover:text-cyan-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                )}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-500/10 text-xl group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                <div className="ml-4 pr-6">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white">{tool.title}</h3>
                    {tool.isNew && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-400">Novo</span>
                    )}
                    {tool.isLegacy && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">Legado</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400 group-hover:text-gray-300 leading-relaxed line-clamp-2">
                    {tool.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {currentTools.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              Nenhuma ferramenta encontrada para esta categoria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

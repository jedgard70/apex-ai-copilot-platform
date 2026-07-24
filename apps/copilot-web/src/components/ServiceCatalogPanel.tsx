import React, { useState } from 'react';

const VIP_SERVICES = [
  {
    id: 'marketing-completo',
    category: 'Marketing & Growth',
    icon: 'campaign',
    title: 'Campanha de Marketing Completa',
    description: 'Delega para o Squad de Marketing a criação de Copy, Imagens e Calendário Editorial.',
    skill: 'agent-squad-marketing',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10'
  },
  {
    id: 'defesa-penal',
    category: 'Jurídico',
    icon: 'gavel',
    title: 'Análise e Defesa Penal',
    description: 'Aciona Advogados Criminais IA para analisar processos ou desenhar estratégias.',
    skill: 'advogado-criminal',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10'
  },
  {
    id: 'contrato-venda',
    category: 'Jurídico',
    icon: 'contract',
    title: 'Revisão de Contratos Complexos',
    description: 'Especialistas jurídicos analisam cláusulas e riscos em segundos.',
    skill: 'advogado-especialista',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10'
  },
  {
    id: 'renderizacao-3d',
    category: 'Engenharia & Design',
    icon: 'view_in_ar',
    title: 'Renderização 3D (Estúdio)',
    description: 'Arquitetos e designers geram vistas realistas a partir do seu rascunho.',
    skill: '3d-render-studio',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    id: 'humanizacao-plantas',
    category: 'Engenharia & Design',
    icon: 'architecture',
    title: 'Humanização de Plantas Baixas',
    description: 'Delega para o Squad de Arquitetura a vetorização e humanização.',
    skill: 'floor-plan-humanizer',
    color: 'text-teal-400',
    bg: 'bg-teal-400/10'
  },
  {
    id: 'activecampaign',
    category: 'Automação',
    icon: 'mail',
    title: 'Funil ActiveCampaign',
    description: 'Squad técnico monta automações de e-mail marketing conectadas.',
    skill: 'activecampaign-automation',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  }
];

export function ServiceCatalogPanel() {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [requestText, setRequestText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDispatch = async () => {
    if (!requestText.trim()) return alert('Por favor, descreva sua necessidade.');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/copilot/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Auto: ${selectedService.title}`,
          goal: requestText,
          skill: selectedService.skill,
          autoStart: true // Flag that backend could use to jumpstart
        })
      });
      if (response.ok) {
        alert('✅ Squad despachado com sucesso! Eles começarão a trabalhar em background.');
        setSelectedService(null);
        setRequestText('');
      } else {
        alert('❌ Erro ao despachar squad.');
      }
    } catch (err) {
      alert('❌ Erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-[#060d20] to-[#0b1326] flex flex-col overflow-hidden text-[#dbe2fd]">
      {/* Header */}
      <header className="bg-[#0b1326]/90 backdrop-blur-xl border-b border-white/10 p-6 shrink-0 shadow-sm flex items-center justify-between z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cardápio de Serviços Autônomos</h1>
          <p className="text-[#c3c6d7] text-sm mt-1">Selecione o serviço e nossos Squads de IA assumem o controle instantaneamente.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#7df4ff] text-3xl">auto_awesome</span>
        </div>
      </header>

      {/* Main Catalog */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          {/* Categories grouping */}
          {['Marketing & Growth', 'Jurídico', 'Engenharia & Design', 'Automação'].map(category => {
            const services = VIP_SERVICES.filter(s => s.category === category);
            if (services.length === 0) return null;
            return (
              <div key={category} className="mb-12 relative z-10">
                <h2 className="text-sm uppercase tracking-widest text-[#a78bfa] mb-6 font-semibold flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-[#a78bfa]/50"></span>
                  {category}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map(service => (
                    <div 
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="group relative rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      style={{
                        background: 'rgba(23,31,51,0.6)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderTopColor: 'rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className={`w-12 h-12 rounded-xl ${service.bg} flex items-center justify-center mb-4 border border-white/5`}>
                        <span className={`material-symbols-outlined ${service.color}`}>{service.icon}</span>
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2 group-hover:text-[#7df4ff] transition-colors">{service.title}</h3>
                      <p className="text-[#94a3b8] text-sm leading-relaxed">{service.description}</p>
                      
                      <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#475569]">
                        <span className="material-symbols-outlined text-[14px]">memory</span>
                        Skill: {service.skill}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal / Side Panel for Request */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-2xl rounded-2xl p-8 flex flex-col shadow-2xl relative"
            style={{
              background: 'linear-gradient(145deg, #111827 0%, #060d20 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-6 right-6 text-[#94a3b8] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-xl ${selectedService.bg} flex items-center justify-center border border-white/10`}>
                <span className={`material-symbols-outlined ${selectedService.color} text-2xl`}>{selectedService.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedService.title}</h2>
                <p className="text-[#a78bfa] text-sm">Squad Orquestrado: {selectedService.skill}</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <label className="block text-sm font-medium text-[#c3c6d7]">
                Descreva sua necessidade ou cole o conteúdo base:
              </label>
              <textarea 
                className="w-full h-40 bg-[#060d20] border border-white/10 rounded-xl p-4 text-white placeholder:text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#7df4ff]/50 transition-all resize-none"
                placeholder="Ex: Preciso de uma campanha completa para o lançamento do produto ApexOS. Foco em B2B..."
                value={requestText}
                onChange={e => setRequestText(e.target.value)}
              />
              <div className="flex items-center gap-2 text-xs text-[#64748b] bg-white/5 p-3 rounded-lg">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Não se preocupe com prompts perfeitos. O Agente Líder do Squad irá interpretar e delegar as tarefas.
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button 
                onClick={() => setSelectedService(null)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-[#94a3b8] hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDispatch}
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-lg text-sm font-medium bg-[#2563eb] text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                )}
                {isSubmitting ? 'Despachando Squad...' : 'Despachar Auto-Squad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

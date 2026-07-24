import React, { useState, useEffect } from 'react';
import { SplitAuthScreen } from './SplitAuthScreen';
import { SupabaseAccountState } from '../lib/supabaseAuthBootstrap';
import {
  BrainCircuit, LayoutGrid, Box, Building, BarChart, CheckCircle2, ArrowRight,
  Database, LineChart, Globe, Zap, Network, ShieldCheck
} from 'lucide-react';

type FlowStep = 'vsl' | 'auth';

const PILLARS = [
  {
    id: 'intelligence_core',
    title: 'Intelligence Core Dashboard',
    desc: 'Núcleo cognitivo central, onde dados, agentes e decisões se conectam.',
    icon: <Database className="w-6 h-6 text-cyan-400" />,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80'
  },
  {
    id: 'bim_intelligence',
    title: 'BIM Intelligence Layer',
    desc: 'Coordenação BIM e detecção automatizada de conflitos (Clash Detection).',
    icon: <Box className="w-6 h-6 text-indigo-400" />,
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80'
  },
  {
    id: 'visual_intelligence',
    title: 'Visual Intelligence Layer',
    desc: 'Geração visual com IA para renderizações cinemáticas e premium.',
    icon: <LayoutGrid className="w-6 h-6 text-fuchsia-400" />,
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09c15468?auto=format&fit=crop&q=80'
  },
  {
    id: 'predictive_analytics',
    title: 'Predictive Analytics',
    desc: 'Antecipação de atrasos, riscos financeiros e gargalos operacionais.',
    icon: <LineChart className="w-6 h-6 text-emerald-400" />,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80'
  },
  {
    id: 'autonomous_decision',
    title: 'Autonomous Decision',
    desc: 'Sistema de alertas e recomendações automatizadas para apoio rápido.',
    icon: <BrainCircuit className="w-6 h-6 text-rose-400" />,
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80'
  },
  {
    id: 'digital_twin',
    title: 'Digital Twin Layer',
    desc: 'Modelo vivo integrando dados reais, IoT e evolução física.',
    icon: <Globe className="w-6 h-6 text-blue-400" />,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80'
  },
  {
    id: 'financial_intelligence',
    title: 'Financial Intelligence',
    desc: 'Valuation, Curva S, fluxo de caixa e análise de viabilidade.',
    icon: <BarChart className="w-6 h-6 text-amber-400" />,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80'
  },
  {
    id: 'hyperautomation',
    title: 'Hyperautomation Layer',
    desc: 'Automação invisível de workflows, e-mails, WhatsApp e integrações.',
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80'
  }
];

export function BusinessOnboardingFlow({ onComplete }: { onComplete: (state: SupabaseAccountState) => void }) {
  const [step, setStep] = useState<FlowStep>('vsl');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleStartGeneral = () => {
    setStep('auth');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex overflow-y-auto overflow-x-hidden bg-[#020617] text-white font-sans transition-opacity duration-1000 scrollbar-hide"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Dynamic Backgrounds (Dark Navy / Cyan gradient mesh) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#081b3d] via-[#020617] to-black opacity-90" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/20 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      </div>

      {step === 'vsl' && (
        <div className="relative z-10 w-full min-h-screen flex flex-col">
          {/* Top Navigation */}
          <nav className="w-full px-8 md:px-16 py-6 flex justify-between items-center border-b border-white/5 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
              <img src="/apex-global-logo.png" alt="Apex AI Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">Apex AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <a href="#suite" className="hover:text-cyan-400 transition-colors">Plataforma</a>
              <a href="#pillars" className="hover:text-cyan-400 transition-colors">8 Pilares</a>
              <a href="#enterprise" className="hover:text-cyan-400 transition-colors">Enterprise</a>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleStartGeneral} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Login
              </button>
              <button onClick={handleStartGeneral} className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105 border border-cyan-400/30">
                Acessar Plataforma
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 md:py-32">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-xs font-semibold text-cyan-300 mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Apex AI 2.0 — O Ecossistema Cognitivo
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[84px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 mb-8 leading-[1.05] max-w-5xl">
              A Sala de Controle Inteligente da <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Construção Moderna.</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-400 mb-12 max-w-3xl leading-relaxed font-medium">
              Da concepção à execução. Da obra ao investimento. Do BIM à decisão executiva. Orquestre 13 agentes especializados em paralelo.
            </p>
            
            <button 
              onClick={handleStartGeneral}
              className="group relative flex items-center justify-center gap-3 bg-white text-slate-950 font-bold text-lg px-10 py-5 rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10">Comece a Criar</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Cinematic Hero Image/Mockup placeholder */}
            <div className="mt-20 w-full max-w-[1200px] aspect-video relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(8,145,178,0.15)] group ring-1 ring-white/5 backdrop-blur-sm">
               <img 
                 src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" 
                 alt="Apex AI Dashboard App" 
                 className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-1000"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 backdrop-blur-md bg-black/40 px-6 py-3 rounded-full border border-white/10">
                 {['ArchVis', 'Director’s Cut', 'BIM Clash Detection', 'Digital Twin'].map(tag => (
                   <span key={tag} className="flex items-center gap-2 text-sm font-medium text-slate-300">
                     <CheckCircle2 className="w-4 h-4 text-cyan-400" /> {tag}
                   </span>
                 ))}
               </div>
            </div>
          </main>

          {/* The 8 Pillars Section */}
          <section id="pillars" className="w-full max-w-[1400px] mx-auto px-6 py-32">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">As 8 Camadas de Inteligência</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Transforme projetos em apresentações premium, decisões executivas e controle operacional de alto nível.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PILLARS.map((pillar, idx) => (
                <div 
                  key={pillar.id}
                  className="group relative flex flex-col h-[400px] rounded-3xl overflow-hidden bg-slate-900/50 border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_40px_rgba(8,145,178,0.15)]"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={pillar.image} 
                      alt={pillar.title}
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent"></div>
                  </div>
                  
                  <div className="relative z-10 flex flex-col justify-end h-full p-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                      {pillar.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-cyan-300 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="w-full px-6 py-32 text-center relative border-t border-white/5 bg-slate-950/30 backdrop-blur-xl">
             <h2 className="text-4xl md:text-5xl font-black mb-8">Pronto para assumir o controle?</h2>
             <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">Junte-se a escritórios, engenheiros e construtoras operando no mais alto nível de inteligência e automação.</p>
             <button 
               onClick={handleStartGeneral}
               className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg px-12 py-5 rounded-full hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all transform hover:scale-105 border border-cyan-400/50"
             >
               Acessar Plataforma Agora
             </button>
          </section>
        </div>
      )}

      {step === 'auth' && (
        <SplitAuthScreen 
          onComplete={onComplete}
          onBack={() => setStep('vsl')}
        />
      )}
    </div>
  );
}

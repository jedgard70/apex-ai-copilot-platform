import React, { FormEvent, useState } from 'react';
import { attemptProfileBootstrap, loadSupabaseAccountState, SupabaseAccountState } from '../lib/supabaseAuthBootstrap';
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from '../lib/supabaseClient';

export function SplitAuthScreen({ 
  onComplete, 
  contextMetadata,
  onBack
}: { 
  onComplete: (state: SupabaseAccountState) => void,
  contextMetadata?: Record<string, any>,
  onBack: () => void
}) {
  const provider = getSupabaseProviderStatus();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusText, setStatusText] = useState('');
  const [busy, setBusy] = useState(false);

  const PILARES = [
    {
      id: 'orcamento',
      title: 'Orçamento Inteligente',
      desc: 'Previsibilidade financeira com IA avançada. Do briefing ao produto final. Sem espera.',
      img: '/pillars/pilar_1_orcamento.png'
    },
    {
      id: 'bim',
      title: 'Projetos Integrados (BIM)',
      desc: 'Compatibilização automática e análise de interferências em tempo real.',
      img: '/pillars/pilar_2_projetos_bim.png'
    },
    {
      id: 'execucao',
      title: 'Controle de Execução',
      desc: 'Acompanhamento de obra preciso com relatórios fotográficos automatizados.',
      img: '/pillars/pilar_3_controle_execucao.png'
    },
    {
      id: 'evm',
      title: 'Inteligência EVM',
      desc: 'Análise de valor agregado para métricas e KPIs precisos em qualquer escala.',
      img: '/pillars/pilar_4_inteligencia_evm.png'
    },
    {
      id: 'risco',
      title: 'Análise Preditiva',
      desc: 'Mitigação de riscos com dashboards antecipando intempéries e atrasos.',
      img: '/pillars/pilar_5_risco_preditiva.png'
    },
    {
      id: 'generativo',
      title: 'Design Generativo',
      desc: 'Do rascunho de papel à renderização 3D fotorrealista em milissegundos.',
      img: '/pillars/pilar_6_design_generativo.png'
    },
    {
      id: 'autonomos',
      title: 'Copilotos Autônomos',
      desc: 'Modelagem da informação potencializada por agentes neurais de alta performance.',
      img: '/pillars/pilar_7_copilotos_autonomos.png'
    },
    {
      id: 'sustentabilidade',
      title: 'Eficiência e ESG',
      desc: 'Integração de natureza e análises energéticas de green buildings de ponta.',
      img: '/pillars/pilar_8_sustentabilidade.png'
    }
  ];

  const FEATURES = [
    {
      id: 'humanizacao',
      title: 'Humanização de Plantas Baixas',
      desc: 'Transformação automática de plantas técnicas 2D em perspectivas 3D humanizadas fotorrealistas.',
      img: '/pillars/humanizacao_plantas.png'
    },
    {
      id: 'timelapse',
      title: 'Construção em Timelapse 4D',
      desc: 'Geração de vídeos e hologramas holográficos do avanço físico da obra integrado ao cronograma.',
      img: '/pillars/timelapse_construcao.png'
    },
    {
      id: 'decoracao',
      title: 'Edição e Decoração de Ambientes',
      desc: 'Agentes virtuais redesenhando texturas, mobiliário e iluminação global com um clique.',
      img: '/pillars/decoracao_ambientes.png'
    },
    {
      id: 'clash',
      title: 'Clash Detection Inteligente',
      desc: 'Identificação preditiva de colisões estruturais e MEP no ambiente BIM antes de chegar na obra.',
      img: '/pillars/clash_3d.png'
    }
  ];

  async function refreshAccount(autoBootstrap = false) {
    const state = await loadSupabaseAccountState();
    if (
      autoBootstrap && 
      (state.bootstrapStatus === 'needs-profile-bootstrap' || state.bootstrapStatus === 'needs-tenant-assignment')
    ) {
      const bootstrapped = await attemptProfileBootstrap();
      setStatusText('');
      onComplete(bootstrapped);
      return bootstrapped;
    }
    setStatusText('');
    onComplete(state);
    return state;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (provider.providerStatus !== 'supabase-connected') {
      setStatusText('Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const { client } = getBrowserSupabaseClient();
    if (!client) return;
    setBusy(true);
    setStatusText('');
    try {
      const result = mode === 'login'
        ? await client.auth.signInWithPassword({ email, password })
        : await client.auth.signUp({ 
            email, 
            password, 
            options: contextMetadata ? { data: contextMetadata } : undefined 
          });
          
      if (result.error) {
        setStatusText(result.error.message);
      } else {
        await refreshAccount(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#F6F5F2] text-black animate-[fadeIn_0.5s_ease-out] overflow-y-auto font-sans relative">
      {/* Top Fixed Header with Back Button */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none">
        <button 
          onClick={onBack}
          className="pointer-events-auto bg-black/10 hover:bg-black/20 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center text-black transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
      </div>

      {/* Hero Section with Form */}
      <section className="relative w-full min-h-[90vh] flex flex-col lg:flex-row items-center justify-center pt-24 pb-12 px-8 lg:px-24 gap-16 overflow-hidden">
        
        {/* Left side: Copy & Title */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center max-w-2xl z-10">
          <img src="/apex-global-logo.png" alt="Apex Logo" className="w-16 h-16 mb-6 invert" />
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 leading-[1.1] text-[#222]">
            Da concepção do projeto ao <span className="text-black underline decoration-4 decoration-orange-600 underline-offset-4">controle absoluto</span>
          </h1>
          <p className="text-lg text-gray-700 mb-8 max-w-lg font-medium leading-relaxed">
            Campanhas de projetos integrados, acompanhamento em tempo real e orçamentos guiados por IA de altíssima precisão. Tudo o que uma construtora precisa para se destacar no mais alto nível, sempre.
          </p>
        </div>

        {/* Right side: Auth Form */}
        <div className="w-full lg:w-[450px] bg-white rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 z-10">
          <h2 className="text-[28px] font-bold tracking-tight mb-8">
            {mode === 'signup' ? 'Criar uma conta' : 'Iniciar sessão'}
          </h2>

          <div className="w-full space-y-3 mb-6">
            <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3.5 hover:bg-gray-50 transition-colors font-semibold text-sm">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue com Google
            </button>
            <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3.5 hover:bg-gray-50 transition-colors font-semibold text-sm">
              <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="w-5 h-5" />
              Continue com a Apple
            </button>
          </div>

          <div className="w-full flex items-center gap-4 mb-6 opacity-60">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-xs font-semibold uppercase tracking-wider">Ou</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <form onSubmit={submit} className="w-full space-y-4">
            <div>
              <input 
                type="email"
                placeholder="Insira seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
              />
            </div>
            <div>
              <input 
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 bg-gray-50 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black focus:bg-white transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={busy}
              className="w-full bg-black text-white font-bold py-4 rounded-xl border border-transparent hover:bg-gray-900 transition-all disabled:opacity-50 mt-4 shadow-md hover:shadow-lg hover:-translate-y-[1px]"
            >
              {busy ? 'Processando...' : (mode === 'signup' ? 'Comece a criar' : 'Entrar')}
            </button>
          </form>

          {statusText && (
             <p className="mt-4 text-sm text-red-500 font-medium text-center bg-red-50 py-2 rounded-lg">
               {statusText}
             </p>
          )}

          <div className="mt-8 text-center text-sm">
            {mode === 'signup' ? (
              <span className="text-gray-500 font-medium">
                Já tem uma conta? <button onClick={() => setMode('login')} className="text-black font-bold hover:underline">Iniciar sessão</button>
              </span>
            ) : (
              <span className="text-gray-500 font-medium">
                Não tem uma conta? <button onClick={() => setMode('signup')} className="text-black font-bold hover:underline">Criar uma conta</button>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 8 Pillars Grid Section */}
      <section className="w-full py-16 px-8 lg:px-24 max-w-[1600px] mx-auto border-t border-gray-200">
        <h2 className="text-4xl font-extrabold mb-12 tracking-tight text-center">Os 8 Pilares Fundamentais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILARES.map((pilar, idx) => {
            const isFeatured = idx === 0 || idx === 3; 
            return (
              <div 
                key={pilar.id} 
                className={`relative group rounded-[2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 h-[450px] ${isFeatured ? 'md:col-span-2' : ''}`}
              >
                <div className="absolute inset-0 bg-gray-900">
                   <img 
                      src={pilar.img} 
                      alt={pilar.title}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 ease-out"
                      onError={(e) => { e.currentTarget.src = '/scifi_bg.png' }}
                   />
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none transition-opacity group-hover:opacity-90"></div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-8 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-2xl font-extrabold mb-3 tracking-tight">{pilar.title}</h3>
                  <p className="text-sm font-medium text-gray-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {pilar.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="w-full py-16 px-8 lg:px-24 max-w-[1600px] mx-auto">
        <h2 className="text-4xl font-extrabold mb-12 tracking-tight text-center">Do rascunho ao detalhamento técnico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FEATURES.map(feature => (
             <div key={feature.id} className="relative rounded-3xl overflow-hidden h-[350px] group shadow-lg">
                <img 
                  src={feature.img} 
                  alt={feature.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s] ease-out"
                  onError={(e) => { e.currentTarget.src = '/scifi_bg.png' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-300 font-medium max-w-md">{feature.desc}</p>
                </div>
             </div>
          ))}
        </div>
      </section>

      {/* Cinematic Production Banner */}
      <section className="w-full py-12 px-8 lg:px-24 max-w-[1600px] mx-auto">
        <div className="relative w-full h-[500px] rounded-[2rem] overflow-hidden group shadow-2xl">
          <img 
            src="/pillars/cinematic_production.png" 
            alt="Produção cinematográfica" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[20s]"
            onError={(e) => { e.currentTarget.src = '/scifi_bg.png' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
          
          <div className="absolute top-0 left-0 w-full h-full p-12 lg:p-20 flex flex-col justify-end max-w-2xl text-white">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tighter drop-shadow-lg">Produção cinematográfica</h2>
            <p className="text-lg text-gray-300 font-medium leading-relaxed drop-shadow-md">
              Personagens, storyboards e conceitos complexos renderizados instantaneamente. Ferramentas cinematográficas de IA criadas exclusivamente para acelerar a entrega da cena final na construção civil e arquitetura.
            </p>
          </div>
        </div>
      </section>

      {/* Apex Originals */}
      <section className="w-full py-20 px-8 lg:px-24 bg-black text-white relative mt-12 rounded-t-[3rem]">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/3 z-10">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">Feito com Apex AI</h2>
            <p className="text-xl text-gray-400 mb-8 font-medium">
              Projetos imobiliários e de infraestrutura criados por escritórios talentosos do mundo todo.
            </p>
            <button className="border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-3 rounded-full font-bold transition-colors flex items-center gap-3">
              Explore a Galeria <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 z-10">
            <div className="relative h-[400px] rounded-3xl overflow-hidden group">
              <img src="/pillars/apex_originals.png" alt="Originals 1" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" onError={(e) => { e.currentTarget.src = '/scifi_bg.png' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-2 block">Apex Originals</span>
                <h3 className="text-2xl font-bold mb-2">Residencial Orion</h3>
                <p className="text-sm text-gray-400 font-medium">Apresentado na ExpoDubai 2026. Design concebido 100% pelos copilotos autônomos da plataforma Apex.</p>
                <button className="mt-4 flex items-center gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors backdrop-blur-md">
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span> Assistir ao case
                </button>
              </div>
            </div>

            <div className="relative h-[400px] rounded-3xl overflow-hidden group hidden md:block">
              <img src="/scifi_bg.png" alt="Originals 2" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 hue-rotate-90 grayscale brightness-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-2 block">Apex Originals</span>
                <h3 className="text-2xl font-bold mb-2">Hospital Maternidade</h3>
                <p className="text-sm text-gray-400 font-medium">Compatibilização hospitalar crítica executada e planejada pela IA com zero erros em obra.</p>
                <button className="mt-4 flex items-center gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors backdrop-blur-md">
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span> Assistir ao case
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#111] text-white py-12 px-8 lg:px-24">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10 pt-12">
          <div className="flex items-center gap-4">
            <img src="/apex-global-logo.png" alt="Apex Logo" className="w-8 h-8 invert opacity-50" />
            <span className="text-sm text-gray-500 font-medium">© 2026 Apex Global LLC. Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

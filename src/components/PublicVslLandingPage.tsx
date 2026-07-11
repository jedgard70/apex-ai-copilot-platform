import React, { useState, useMemo, useEffect } from 'react'
import {
  Menu, X, Play, BrainCircuit, Building,
  Users, CheckCircle2, ChevronDown, Zap, ShieldCheck,
  BarChart, ArrowRight, Layers, LayoutGrid, FileText, Image as ImageIcon, Sparkles, Box
} from 'lucide-react'

const RESERVED_PARAMS = new Set([
  'headline', 'subheadline', 'urgency', 'video', 'cta', 'ctalabel',
  'proof', 'terms', 'privacy', 'brand', 'support'
])

function normalizeYoutubeEmbed(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/\//g, '')
      return id ? `https://www.youtube.com/embed/${id}` : url
    }
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`
    }
    return url
  } catch {
    return url
  }
}

function buildCtaUrl(baseUrl: string, searchParams: URLSearchParams, defaultService = 'premium') {
  if (!baseUrl) return '#'
  try {
    const url = new URL(baseUrl, window.location.origin)
    for (const [key, value] of searchParams.entries()) {
      if (RESERVED_PARAMS.has(key.toLowerCase())) continue
      if (!url.searchParams.has(key)) url.searchParams.set(key, value)
    }
    if (!url.searchParams.has('service')) {
      url.searchParams.set('service', defaultService)
    }
    return url.toString()
  } catch {
    return baseUrl
  }
}

export function PublicVslLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const config = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      brand: params.get('brand') || 'Apex AI',
      headline: params.get('headline') || 'A plataforma de IA número 1 para Engenharia e Construção.',
      subheadline: params.get('subheadline') || 'Todos os modelos de IA e agentes especialistas para projetos, orçamentos e obras. Fluxos de trabalho inteligentes para controle e colaboração profissionais em qualquer escala.',
      urgency: params.get('urgency') || 'OFERTA DE LANÇAMENTO EXCLUSIVA',
      video: params.get('video') || '',
      ctaLabel: params.get('ctaLabel') || 'Comece a criar',
      cta: buildCtaUrl(params.get('cta') || '/checkout', params, 'premium'),
      terms: params.get('terms') || '#',
      privacy: params.get('privacy') || '#',
      params
    }
  }, [])

  const embedVideo = config.video ? normalizeYoutubeEmbed(config.video) : ''
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(embedVideo)

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* Absolute ambient lights */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />
      
      {/* Navbar Luxury Style */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#030712]/60 backdrop-blur-2xl border-b border-cyan-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <a href="#" className="text-2xl font-black tracking-tighter text-white flex items-center gap-3 group">
              <div className="bg-gradient-to-tr from-cyan-400 to-violet-500 rounded-xl p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-shadow">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{config.brand}</span>
            </a>
            
            <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-300">
              <a href="#suite" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><LayoutGrid className="w-4 h-4"/> Suíte Criativa</a>
              <a href="#features" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Box className="w-4 h-4"/> Recursos</a>
              <a href="#enterprise" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><Building className="w-4 h-4"/> Empresa</a>
              <a href="#pricing" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><BarChart className="w-4 h-4"/> Preços</a>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <a href="/login" className="text-[15px] font-medium text-slate-300 hover:text-white transition-colors">Conecte-se</a>
            <a href={config.cta} className="text-[15px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-7 py-3 rounded-full hover:scale-105 transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] border border-cyan-400/30">
              Inscrever-se
            </a>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-slate-300 p-2">
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[80px] z-40 bg-[#030712]/95 backdrop-blur-3xl border-t border-cyan-500/10 p-8 flex flex-col gap-8 lg:hidden overflow-y-auto">
          <a href="#suite" className="text-2xl font-bold text-white flex items-center gap-4"><LayoutGrid className="w-7 h-7 text-cyan-400"/> Suíte Criativa</a>
          <a href="#features" className="text-2xl font-bold text-white flex items-center gap-4"><Box className="w-7 h-7 text-cyan-400"/> Recursos</a>
          <a href="#enterprise" className="text-2xl font-bold text-white flex items-center gap-4"><Building className="w-7 h-7 text-cyan-400"/> Empresa</a>
          <a href="#pricing" className="text-2xl font-bold text-white flex items-center gap-4"><BarChart className="w-7 h-7 text-cyan-400"/> Preços</a>
          <div className="h-px bg-slate-800/50 my-2"></div>
          <a href="/login" className="text-2xl font-bold text-slate-300">Conecte-se</a>
          <a href={config.cta} className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-center py-5 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] mt-4">Inscrever-se</a>
        </div>
      )}

      {/* Cinematic Hero - Premium Redesign */}
      <section className="relative pt-48 pb-24 px-6 overflow-hidden flex flex-col items-center text-center min-h-[90vh] justify-center">
        <div className="relative z-10 max-w-[1100px] mx-auto flex flex-col items-center">
          <a href="#features" className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/60 border border-cyan-500/30 text-sm font-medium text-cyan-300 mb-10 hover:bg-slate-800/80 transition-all backdrop-blur-xl shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Inovação Premium em Engenharia <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
          </a>
          
          <h1 className="text-5xl md:text-7xl lg:text-[88px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-500 mb-8 leading-[1.05] drop-shadow-sm">
            {config.headline}
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 max-w-4xl leading-relaxed mb-14 font-light">
            {config.subheadline}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
            <a href={config.cta} className="inline-flex justify-center items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-12 py-5 rounded-full text-xl font-bold hover:scale-105 transition-all shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] border border-cyan-400/30 group">
              {config.ctaLabel} <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
            </a>
          </div>

          <div className="mt-20 flex flex-wrap justify-center gap-4 opacity-90 max-w-5xl">
             {['Fluxos de IA Avançados', 'BIM 3D Nativo', 'Análise Preditiva', 'Avatares & Voz HD', 'Automação Corporativa'].map((tag, i) => (
               <div key={i} className="px-6 py-3 bg-slate-900/40 border border-slate-700/50 rounded-full text-sm font-medium text-slate-300 backdrop-blur-md hover:bg-slate-800/60 hover:border-cyan-500/40 hover:text-white transition-all cursor-pointer flex items-center gap-2.5 shadow-lg">
                 <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" /> {tag}
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Video / Showcase Area */}
      <section className="relative z-20 max-w-[1200px] mx-auto px-6 pb-32">
        <div className="rounded-[32px] overflow-hidden border border-cyan-500/20 bg-[#070b19] shadow-[0_30px_100px_rgba(6,182,212,0.15)] relative group ring-1 ring-white/5 p-2 backdrop-blur-2xl">
          <div className="rounded-[24px] overflow-hidden aspect-video relative bg-black flex items-center justify-center">
            {embedVideo ? (
              isDirectVideo ? (
                <video controls playsInline autoPlay muted className="w-full h-full object-cover" src={embedVideo} />
              ) : (
                <iframe src={embedVideo} title="Apex VSL" allow="autoplay; fullscreen" className="w-full h-full border-none" />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black flex flex-col items-center justify-center p-8 text-center border border-slate-800 rounded-[24px]">
                <div className="w-24 h-24 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mb-8 backdrop-blur-md animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                  <Play className="w-10 h-10 text-cyan-400 ml-2" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">Sua obra de arte começa aqui</h3>
                <p className="text-slate-400 max-w-lg text-lg font-light">Adicione um vídeo promocional para converter ainda mais. (Parâmetro `?video=URL`)</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bento Grid Features - Premium */}
      <section id="features" className="py-32 bg-transparent relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-20 text-center md:text-left">
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-6">Controle Profissional.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Escala de Engenharia.</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl font-light">A suíte criativa completa para direcionar seus melhores projetos e fluxos de trabalho com Inteligência Artificial de elite.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bento Box 1: Engineering */}
            <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-all duration-500 group relative shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="p-10 relative z-10 w-full h-full flex flex-col justify-between">
                <div>
                  <div className="bg-cyan-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.2)] border border-cyan-500/20 backdrop-blur-md">
                    <Building className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white tracking-tight">Engenharia, BIM e Obras</h3>
                  <div className="space-y-4 text-slate-300 text-lg font-light">
                    {['Integração SINAPI (Orçamentos)', 'Visualizador BIM 3D (IfcOpenShell)', 'Integração MS Project (Cronograma)', 'Autodesk Platform Services (APS)', 'Detecção de Conflitos (BIM Clash)'].map((item, i) => (
                      <div key={i} className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div> {item}</div>
                    ))}
                  </div>
                </div>
                <div className="mt-12 relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl group-hover:shadow-[0_20px_50px_rgba(6,182,212,0.2)] transition-all duration-700 transform group-hover:-translate-y-2 group-hover:scale-[1.02]">
                  <img src="/assets/vsl/vsl_engineering_bim.png" alt="Engineering and BIM Dashboard" className="w-full h-auto max-h-[320px] object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Bento Box 2: Accounting */}
            <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden hover:border-violet-500/50 transition-all duration-500 group relative shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-violet-500/20 transition-colors"></div>
              <div className="p-10 flex flex-col relative z-10 flex-1">
                <div className="bg-violet-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.2)] border border-violet-500/20 backdrop-blur-md">
                  <BarChart className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white tracking-tight">Suíte Contábil</h3>
                <div className="space-y-4 text-slate-300 text-base font-light mb-8 flex-1">
                  {['Controle Financeiro Corporativo', 'Módulo Contábil CRC', 'Gateways de Pagamento (Stripe)', 'Emissão de Notas e OS'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"></div> {item}</div>
                  ))}
                </div>
                <div className="mt-auto relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl group-hover:shadow-[0_20px_50px_rgba(139,92,246,0.2)] transition-all duration-700 transform group-hover:scale-105">
                  <img src="/assets/vsl/vsl_accounting_dashboard.png" alt="Accounting Dashboard" className="w-full h-48 object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Other bento boxes can follow same pattern, keeping it concise for brevity */}
            {/* Bento Box 3: ArchVis */}
            <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-500 group relative shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col">
              <div className="p-10 flex flex-col relative z-10 flex-1">
                <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/20 backdrop-blur-md">
                  <ImageIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white tracking-tight">ArchVis & Video</h3>
                <div className="space-y-4 text-slate-300 text-base font-light mb-8 flex-1">
                  {['Renderização IA (FAL/Flux)', 'Edição de Vídeo (DirectCut)', 'Avatares e Voz (ElevenLabs)'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div> {item}</div>
                  ))}
                </div>
                <div className="mt-auto relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl group-hover:shadow-[0_20px_50px_rgba(16,185,129,0.2)] transition-all duration-700 transform group-hover:scale-105">
                  <img src="/assets/vsl/vsl_archvis_directcut.png" alt="ArchVis" className="w-full h-48 object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Bento Box 4: Agents */}
            <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 group relative shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col">
              <div className="p-10 flex flex-col relative z-10 flex-1">
                <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.2)] border border-blue-500/20 backdrop-blur-md">
                  <BrainCircuit className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white tracking-tight">Agentes & APIs</h3>
                <div className="space-y-4 text-slate-300 text-base font-light mb-8 flex-1">
                  {['13 Agentes Cognitivos', 'Pesquisa Profunda', 'Biblioteca de Prompts', 'Modelos Nativos Otimizados'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div> {item}</div>
                  ))}
                </div>
                <div className="mt-auto relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl group-hover:shadow-[0_20px_50px_rgba(59,130,246,0.2)] transition-all duration-700 transform group-hover:scale-105">
                  <img src="/assets/vsl/vsl_cognitive_agents.png" alt="Cognitive Agents" className="w-full h-48 object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
            
            {/* Bento Box 5: RDO */}
            <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all duration-500 group relative shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col">
              <div className="p-10 flex flex-col relative z-10 flex-1">
                <div className="bg-amber-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.2)] border border-amber-500/20 backdrop-blur-md">
                  <ShieldCheck className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white tracking-tight">RDO & Operações</h3>
                <div className="space-y-4 text-slate-300 text-base font-light mb-8 flex-1">
                  {['Diário de Obras (RDO)', 'Time Tracker e Ponto', 'Gestão de NCI', 'Conformidade NR-18'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div> {item}</div>
                  ))}
                </div>
                <div className="mt-auto relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl group-hover:shadow-[0_20px_50px_rgba(245,158,11,0.2)] transition-all duration-700 transform group-hover:scale-105">
                  <img src="/assets/vsl/vsl_rdo_fieldops.png" alt="RDO" className="w-full h-48 object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Massive Feature Wall */}
      <section className="py-32 bg-[#02040a] relative overflow-hidden border-t border-slate-800/50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-cyan-600/5 blur-[150px] pointer-events-none rounded-full"></div>
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-white">
              Poder na Escala Máxima. <br className="hidden md:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Mais de 85 módulos.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto font-light">
              Nenhuma outra plataforma chega perto do que construímos. Nossa arquitetura modular entrega funcionalidades nativas desenhadas especificamente para quem constrói o mundo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Exportação PDF Avançada", "Visualizador IFC Nativo", "Cálculo SINAPI", "Webhooks Stripe",
              "Checkout B2B Custom", "Node Board Video", "Clash Detection", "13 Agentes Cognitivos",
              "Sintetizador Gemini TTS", "RDO Híbrido", "Time Tracker", "Gestão de NCI",
              "Auditoria de Segurança", "Integração MS Project", "Analytics Preditivo", "Sensores IoT",
              "Workflow Tasks", "Filas em Massa", "Avatares ElevenLabs", "Pipeline Kanban",
              "Radar de Mercado", "Automação CRM", "Integração APIs", "Dashboards Custos IA",
              "Custom BI", "Módulo Contábil", "Financeiro Multi-Empresa", "Geração VSL",
              "Segurança de Dados", "Fluxos Repetíveis"
            ].map((feature, i) => (
              <div key={i} className="bg-slate-900/30 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-5 flex items-center gap-4 hover:bg-slate-800/60 hover:border-cyan-500/40 transition-all duration-300 group shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700 group-hover:bg-cyan-400 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.9)] transition-all"></div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section id="pricing" className="py-32 relative overflow-hidden bg-[#030712]">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-8 text-white">Escala sem limites</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">Infraestrutura pronta para produção corporativa e controle administrativo inigualável.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
            {/* Premium */}
            <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-[40px] p-10 flex flex-col hover:bg-slate-800/40 transition-all shadow-xl">
              <h3 className="text-2xl font-bold mb-3 text-white">Premium</h3>
              <p className="text-slate-400 mb-10 font-light">Para profissionais individuais explorando fluxos de IA.</p>
              <div className="mb-12">
                <span className="text-5xl font-black text-white">R$ 80</span><span className="text-slate-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-5 text-slate-300 flex-1 mb-12 font-light">
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Modelos base de IA</li>
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Automação Inicial</li>
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Suporte comunitário</li>
              </ul>
              <a href={buildCtaUrl(config.cta, config.params, 'premium')} className="w-full text-center py-5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl transition-colors border border-slate-600 shadow-md">
                Selecionar Premium
              </a>
            </div>

            {/* Premium+ */}
            <div className="bg-gradient-to-b from-slate-900/80 to-slate-950 border border-cyan-500/50 rounded-[40px] p-10 flex flex-col relative shadow-[0_20px_60px_rgba(6,182,212,0.15)] transform md:-translate-y-6 backdrop-blur-2xl">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                Recomendado
              </div>
              <h3 className="text-3xl font-bold mb-3 text-white">Premium+</h3>
              <p className="text-cyan-200/70 mb-10 font-light">Para equipes de engenharia que precisam de acesso total.</p>
              <div className="mb-12">
                <span className="text-6xl font-black text-white">R$ 180</span><span className="text-slate-400 font-medium">/mês</span>
              </div>
              <ul className="space-y-5 text-slate-200 flex-1 mb-12 font-light">
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-cyan-400" /> Ilimitado, o ano todo</li>
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-cyan-400" /> Licença comercial</li>
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-cyan-400" /> Automação Contábil</li>
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-6 h-6 text-cyan-400" /> Engenharia & Obras</li>
              </ul>
              <a href={buildCtaUrl(config.cta, config.params, 'premium_plus')} className="w-full text-center py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-105 font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                Começar agora
              </a>
            </div>

            {/* Pro */}
            <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-700/50 rounded-[40px] p-10 flex flex-col hover:bg-slate-800/40 transition-all shadow-xl">
              <h3 className="text-2xl font-bold mb-3 text-white">Pro Enterprise</h3>
              <p className="text-slate-400 mb-10 font-light">Para empresas expandindo e integrando via API.</p>
              <div className="mb-12">
                <span className="text-5xl font-black text-white">R$ 1.150</span><span className="text-slate-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-5 text-slate-300 flex-1 mb-12 font-light">
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> 4 milhões de créditos</li>
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> Acesso total à API</li>
                <li className="flex gap-4 items-center"><CheckCircle2 className="w-5 h-5 text-cyan-500" /> SLA e Suporte VIP</li>
              </ul>
              <a href={buildCtaUrl(config.cta, config.params, 'pro')} className="w-full text-center py-5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl transition-colors border border-slate-600 shadow-md">
                Contatar Vendas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="border-t border-slate-800/60 bg-[#02040a] pt-24 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 md:col-span-2 pr-12">
            <a href="#" className="text-2xl font-black tracking-tighter text-white flex items-center gap-3 mb-8">
              <div className="bg-gradient-to-tr from-cyan-400 to-violet-500 rounded-xl p-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{config.brand}</span>
            </a>
            <p className="text-slate-400 text-lg leading-relaxed font-light">
              A plataforma corporativa número 1. Modelos de IA integrados para Engenharia, Construção Civil e Automação de Negócios.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">Plataforma</h4>
            <ul className="space-y-4 text-slate-400 font-light">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Suíte Criativa</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Enterprise</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide">Legal</h4>
            <ul className="space-y-4 text-slate-400 font-light">
              <li><a href={config.terms} className="hover:text-cyan-400 transition-colors">Termos de Uso</a></li>
              <li><a href={config.privacy} className="hover:text-cyan-400 transition-colors">Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm font-light">
          <p>© 2026 {config.brand}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

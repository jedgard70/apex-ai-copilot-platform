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
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Navbar Magnific Style */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <a href="#" className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg p-1">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
              {config.brand}
            </a>
            
            <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-300">
              <a href="#suite" className="hover:text-white transition-colors flex items-center gap-1.5"><LayoutGrid className="w-4 h-4"/> Suíte Criativa</a>
              <a href="#features" className="hover:text-white transition-colors flex items-center gap-1.5"><Box className="w-4 h-4"/> Recursos</a>
              <a href="#enterprise" className="hover:text-white transition-colors flex items-center gap-1.5"><Building className="w-4 h-4"/> Empresa</a>
              <a href="#pricing" className="hover:text-white transition-colors flex items-center gap-1.5"><BarChart className="w-4 h-4"/> Preços</a>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <a href="/login" className="text-[15px] font-medium text-slate-300 hover:text-white transition-colors">Conecte-se</a>
            <a href={config.cta} className="text-[15px] font-bold bg-white text-black px-6 py-2.5 rounded-full hover:scale-105 hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Inscrever-se
            </a>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-slate-300 p-2">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[70px] z-40 bg-[#0a0a0a] border-t border-white/5 p-6 flex flex-col gap-6 lg:hidden overflow-y-auto">
          <a href="#suite" className="text-xl font-bold text-white flex items-center gap-3"><LayoutGrid className="w-6 h-6 text-indigo-400"/> Suíte Criativa</a>
          <a href="#features" className="text-xl font-bold text-white flex items-center gap-3"><Box className="w-6 h-6 text-indigo-400"/> Recursos</a>
          <a href="#enterprise" className="text-xl font-bold text-white flex items-center gap-3"><Building className="w-6 h-6 text-indigo-400"/> Empresa</a>
          <a href="#pricing" className="text-xl font-bold text-white flex items-center gap-3"><BarChart className="w-6 h-6 text-indigo-400"/> Preços</a>
          <div className="h-px bg-white/10 my-2"></div>
          <a href="/login" className="text-xl font-bold text-slate-300">Conecte-se</a>
          <a href={config.cta} className="text-xl font-bold bg-white text-black text-center py-4 rounded-xl mt-4">Inscrever-se</a>
        </div>
      )}

      {/* Cinematic Hero */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center text-center min-h-[90vh] justify-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-[120px] rounded-[100%] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        
        <div className="relative z-10 max-w-[1000px] mx-auto flex flex-col items-center">
          <a href="#features" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-indigo-300 mb-8 hover:bg-white/10 transition-colors backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> Leia o relatório de impacto e inovação em engenharia
          </a>
          
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 mb-8 leading-[1.1]">
            {config.headline}
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 max-w-3xl leading-relaxed mb-12 font-medium">
            {config.subheadline}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a href={config.cta} className="inline-flex justify-center items-center gap-2 bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] group">
              {config.ctaLabel} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Feature Badges - Magnific Style */}
          <div className="mt-16 flex flex-wrap justify-center gap-3 opacity-80 max-w-4xl">
             {['Criar fluxos de trabalho', 'Gestão de Obras', 'Personagens e Equipes', 'Aprimoramento 4K', 'Esboços BIM', 'Campanhas de escala', 'Automação Contábil'].map((tag, i) => (
               <div key={i} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-slate-300 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-indigo-400" /> {tag}
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Video / Showcase Area */}
      <section className="relative z-20 max-w-[1200px] mx-auto px-6 pb-32">
        <div className="rounded-[32px] overflow-hidden border border-white/10 bg-[#111] shadow-[0_0_100px_rgba(79,70,229,0.15)] relative group ring-1 ring-white/5 p-2 backdrop-blur-sm">
          <div className="rounded-[24px] overflow-hidden aspect-video relative bg-black flex items-center justify-center">
            {embedVideo ? (
              isDirectVideo ? (
                <video controls playsInline autoPlay muted className="w-full h-full object-cover" src={embedVideo} />
              ) : (
                <iframe
                  src={embedVideo}
                  title="Apex VSL"
                  allow="autoplay; fullscreen"
                  className="w-full h-full border-none"
                />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-black flex flex-col items-center justify-center p-8 text-center border border-white/5 rounded-[24px]">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md animate-pulse">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <h3 className="text-3xl font-bold mb-3 text-white">Sua obra de arte começa aqui</h3>
                <p className="text-slate-400 max-w-lg text-lg">Adicione um vídeo promocional para converter ainda mais. (Parâmetro `?video=URL`)</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Magnific-Style Bento Grid Features */}
      <section id="features" className="py-24 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Controle Profissional.<br/><span className="text-indigo-400">Escala de Engenharia.</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl">A suíte criativa completa para direcionar seus melhores projetos e fluxos de trabalho com IA.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Bento Box 1 */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#161616] to-[#0a0a0a] border border-white/5 rounded-3xl p-10 hover:border-indigo-500/30 transition-colors group">
              <div className="bg-indigo-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Building className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-white">Engenharia, BIM e Obras</h3>
              <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-xl">
                Extraia quantitativos, leia memoriais descritivos e gere orçamentos de engenharia em segundos. Integração direta e fluxos de trabalho alinhados ao canteiro.
              </p>
              <div className="h-48 rounded-xl bg-gradient-to-r from-black to-[#111] border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                {/* Mock UI lines */}
                <div className="p-6 space-y-4">
                  <div className="h-4 w-1/3 bg-white/10 rounded-full"></div>
                  <div className="h-4 w-2/3 bg-white/5 rounded-full"></div>
                  <div className="flex gap-4 pt-4">
                    <div className="h-20 w-32 bg-indigo-500/20 rounded-lg border border-indigo-500/30"></div>
                    <div className="h-20 w-32 bg-white/5 rounded-lg border border-white/10"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Box 2 */}
            <div className="bg-gradient-to-br from-[#161616] to-[#0a0a0a] border border-white/5 rounded-3xl p-10 hover:border-purple-500/30 transition-colors group">
              <div className="bg-purple-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <BarChart className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Suíte Contábil</h3>
              <p className="text-slate-400 leading-relaxed">
                Integração nativa para notas, contratos e conciliações em todas as pontas da empresa.
              </p>
            </div>

            {/* Bento Box 3 */}
            <div className="bg-gradient-to-br from-[#161616] to-[#0a0a0a] border border-white/5 rounded-3xl p-10 hover:border-blue-500/30 transition-colors group">
              <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Agentes & APIs</h3>
              <p className="text-slate-400 leading-relaxed">
                Da automação de marketing ao atendimento. Utilize a API MCP para criar conectores poderosos.
              </p>
            </div>

            {/* Bento Box 4 */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#161616] to-[#0a0a0a] border border-white/5 rounded-3xl p-10 hover:border-white/20 transition-colors group flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Fluxos Inteligentes</h3>
                <p className="text-lg text-slate-400 leading-relaxed mb-8">
                  Salve qualquer fluxo de trabalho complexo como um aplicativo repetível. Perfeito para escalar a produção do seu escritório.
                </p>
              </div>
              <div className="w-full md:w-64 h-64 rounded-2xl bg-black border border-white/10 relative flex items-center justify-center overflow-hidden">
                <div className="w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] absolute"></div>
                <div className="relative z-10 flex flex-col gap-3 items-center">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
                  <ArrowRight className="text-white/30 rotate-90" />
                  <div className="w-16 h-12 bg-indigo-500 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Models Bar */}
      <section className="py-12 border-y border-white/5 bg-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto px-6 overflow-hidden">
          <p className="text-center text-sm font-bold tracking-widest text-slate-500 uppercase mb-8">Modelos Integrados Nativos</p>
          <div className="flex space-x-12 overflow-x-auto pb-4 justify-center items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['Gemini 1.5 Pro', 'GPT-4o', 'Claude 3.5', 'Fal.ai', 'ElevenLabs', 'Supabase'].map((model, i) => (
              <span key={i} className="text-2xl font-black tracking-tighter shrink-0">{model}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA Section */}
      <section id="pricing" className="py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black tracking-tight mb-6 text-white">Escala sem limites</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Proteção legal completa, controle administrativo e infraestrutura pronta para produção corporativa.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
            {/* Premium */}
            <div className="bg-[#111] border border-white/5 rounded-[32px] p-10 flex flex-col hover:bg-[#161616] transition-colors">
              <h3 className="text-2xl font-bold mb-2 text-white">Premium</h3>
              <p className="text-slate-400 mb-8 min-h-[48px]">Para profissionais individuais explorando fluxos de IA.</p>
              <div className="mb-10">
                <span className="text-5xl font-black text-white">R$ 80</span><span className="text-slate-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 text-slate-300 flex-1 mb-10">
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Modelos base de IA</li>
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Automação Inicial</li>
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Suporte comunitário</li>
              </ul>
              <a href={buildCtaUrl(config.cta, config.params, 'premium')} className="w-full text-center py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors border border-white/10">
                Selecionar Premium
              </a>
            </div>

            {/* Premium+ */}
            <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111] border border-indigo-500/50 rounded-[32px] p-10 flex flex-col relative shadow-[0_0_50px_rgba(79,70,229,0.15)] transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
                Recomendado
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Premium+</h3>
              <p className="text-indigo-200/70 mb-8 min-h-[48px]">Para equipes de engenharia que precisam de acesso total.</p>
              <div className="mb-10">
                <span className="text-5xl font-black text-white">R$ 180</span><span className="text-slate-400 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 text-slate-200 flex-1 mb-10">
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Ilimitado, o ano todo</li>
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Licença comercial</li>
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Automação Contábil completa</li>
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-400" /> Ferramentas de Engenharia</li>
              </ul>
              <a href={buildCtaUrl(config.cta, config.params, 'premium_plus')} className="w-full text-center py-4 bg-white text-black hover:bg-slate-200 font-bold rounded-2xl transition-colors shadow-xl">
                Começar agora
              </a>
            </div>

            {/* Pro */}
            <div className="bg-[#111] border border-white/5 rounded-[32px] p-10 flex flex-col hover:bg-[#161616] transition-colors">
              <h3 className="text-2xl font-bold mb-2 text-white">Pro Enterprise</h3>
              <p className="text-slate-400 mb-8 min-h-[48px]">Para empresas expandindo e integrando via API.</p>
              <div className="mb-10">
                <span className="text-5xl font-black text-white">R$ 1.150</span><span className="text-slate-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 text-slate-300 flex-1 mb-10">
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> 4 milhões de créditos</li>
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Acesso total à API</li>
                <li className="flex gap-3 items-center"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Indenização legal</li>
              </ul>
              <a href={buildCtaUrl(config.cta, config.params, 'pro')} className="w-full text-center py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-colors border border-white/10">
                Contatar Vendas
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="border-t border-white/5 bg-[#050505] pt-24 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 md:col-span-2 pr-12">
            <a href="#" className="text-2xl font-black tracking-tighter text-white flex items-center gap-2 mb-6">
              <div className="bg-white/10 rounded-lg p-1">
                <BrainCircuit className="text-white w-6 h-6" />
              </div>
              {config.brand}
            </a>
            <p className="text-slate-400 text-lg leading-relaxed">
              A plataforma corporativa número 1. Modelos de IA integrados para Engenharia, Construção Civil e Automação de Negócios.
            </p>
          </div>
          <div>
            <strong className="block text-white mb-6 font-bold">Ecossistema</strong>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Engenharia e BIM</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Automação Contábil</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Agentes MCP</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Workflows Visuais</a></li>
            </ul>
          </div>
          <div>
            <strong className="block text-white mb-6 font-bold">Empresa</strong>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Casos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>
          <div>
            <strong className="block text-white mb-6 font-bold">Legal</strong>
            <ul className="space-y-4 text-slate-400 font-medium">
              <li><a href={config.terms} className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href={config.privacy} className="hover:text-white transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Segurança (SOC2)</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-sm font-medium text-slate-500">
          <span>Copyright © 2026 {config.brand}. Todos os direitos reservados.</span>
          <span className="mt-4 md:mt-0">Suporte: contato@apexglobalai.com</span>
        </div>
      </footer>
    </div>
  )
}

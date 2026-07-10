import React, { useState, useMemo } from 'react'
import {
  Menu, X, Play, BrainCircuit, Building,
  Users, CheckCircle2, ChevronDown, Zap, ShieldCheck,
  BarChart, ArrowRight, Layers
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
  const [activeTab, setActiveTab] = useState('Engenharia')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const config = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      brand: params.get('brand') || 'Apex AI',
      headline: params.get('headline') || 'A plataforma de IA número 1 para o seu negócio.',
      subheadline: params.get('subheadline') || 'Especialistas em Engenharia e Construção Civil. Todos os modelos de IA e agentes especialistas em um só lugar. Produção e escala alinhada à sua construtora ou escritório.',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 text-center py-2 text-xs font-bold tracking-widest uppercase">
        {config.urgency}
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <a href="#" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <BrainCircuit className="text-blue-500" />
                {config.brand}
              </a>
              <div className="hidden md:flex space-x-6 text-sm font-medium text-slate-300">
                <a href="#suite" className="hover:text-white transition-colors">Suíte Corporativa</a>
                <a href="#enterprise" className="hover:text-white transition-colors">Empresa</a>
                <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <a href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Conecte-se</a>
              <a href={config.cta} className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
                Inscrever-se
              </a>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300">
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-white/10 p-4 space-y-4">
          <a href="#suite" className="block text-slate-300 font-medium">Suíte Corporativa</a>
          <a href="#enterprise" className="block text-slate-300 font-medium">Empresa</a>
          <a href="#pricing" className="block text-slate-300 font-medium">Preços</a>
          <hr className="border-white/10" />
          <a href="/login" className="block text-slate-300 font-medium">Conecte-se</a>
          <a href={config.cta} className="block text-center bg-white text-black font-bold py-2 rounded-lg">Inscrever-se</a>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-6 leading-tight">
            {config.headline.split(' ').map((word, i) => (
              <React.Fragment key={i}>
                {word} {i === 2 && <br className="hidden md:block" />}
              </React.Fragment>
            ))}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {config.subheadline}
          </p>
          <div className="mt-10">
            <a href={config.cta} className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform">
              {config.ctaLabel} <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Marquee Tags */}
          <div className="mt-16 overflow-hidden relative w-full flex flex-col gap-3 opacity-60">
             <div className="flex space-x-4 animate-pulse whitespace-nowrap overflow-x-auto pb-4 justify-center">
                {['Engenharia Civil', 'Gestão de Obras', 'Automação Contábil', 'Orçamentos em Segundos', 'Modelagem BIM', 'Integração Revit', 'Agentes MCP'].map((tag, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Video Player */}
      <section className="max-w-6xl mx-auto px-4 relative z-20 -mt-10 mb-24">
        <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl shadow-blue-900/20 relative group">
          <div className="aspect-video relative bg-slate-950 flex items-center justify-center">
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
              <div className="text-center p-8 max-w-md">
                <Play className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-2xl font-bold mb-2">Seu vídeo começa aqui</h3>
                <p className="text-slate-500">Adicione o parâmetro `?video=` na URL para carregar a apresentação oficial de vendas e conversão.</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-slate-500 mt-8 font-medium tracking-wide">
          Com a confiança de mais de 1 milhão de assinantes — engenharias, construtoras, empresas e agências.
        </p>
      </section>

      {/* Ecosystem Tabs */}
      <section id="suite" className="py-24 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Um lugar para automatizar qualquer coisa</h2>
            <p className="text-slate-400 text-lg">Escolha seu ponto de partida. Todas as ferramentas, todos os modelos, prontos para a sua equipe de engenharia e negócios.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-64 flex flex-col gap-2">
              {['Engenharia', 'Contabilidade', 'Agentes & APIs', 'Workflows'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-left px-6 py-4 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 lg:p-12 transition-all">
              {activeTab === 'Engenharia' && (
                <div className="animate-in fade-in duration-500">
                  <Building className="w-12 h-12 text-blue-400 mb-6" />
                  <h3 className="text-3xl font-bold mb-4">Engenharia, Revit e Obras</h3>
                  <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Nossa especialidade: Extraia quantitativos, leia memoriais descritivos e gere orçamentos de engenharia em segundos com a análise espacial do Apex AI. Controle do canteiro à entrega final.
                  </p>
                  <a href={buildCtaUrl(config.cta, config.params, 'engineering')} className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300">
                    Conhecer módulo <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
              {activeTab === 'Contabilidade' && (
                <div className="animate-in fade-in duration-500">
                  <BarChart className="w-12 h-12 text-blue-400 mb-6" />
                  <h3 className="text-3xl font-bold mb-4">Suíte Contábil Integrada</h3>
                  <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Acompanha as construtoras e agências. Gere, edite, audite e amplie seus processos fiscais. Mantenha a consistência de notas, contratos e conciliações em todas as pontas da empresa com integração REDESIM nativa.
                  </p>
                  <a href={buildCtaUrl(config.cta, config.params, 'accounts')} className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300">
                    Conhecer módulo <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}>
                </div>
              )}
              {activeTab === 'Agentes & APIs' && (
                <div className="animate-in fade-in duration-500">
                  <BrainCircuit className="w-12 h-12 text-blue-400 mb-6" />
                  <h3 className="text-3xl font-bold mb-4">Agentes Autônomos</h3>
                  <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Da automação de marketing (copy e SEO) ao atendimento. Utilize a API MCP para criar conectores poderosos diretamente na sua infraestrutura.
                  </p>
                  <a href={buildCtaUrl(config.cta, config.params, 'premium')} className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300">
                    Conhecer módulo <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
              {activeTab === 'Workflows' && (
                <div className="animate-in fade-in duration-500">
                  <Layers className="w-12 h-12 text-blue-400 mb-6" />
                  <h3 className="text-3xl font-bold mb-4">Fluxo de trabalho em um clique</h3>
                  <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Salve qualquer fluxo de trabalho complexo e personalizado como um aplicativo. A próxima pessoa poderá executá-lo com um único clique.
                  </p>
                  <a href={buildCtaUrl(config.cta, config.params, 'premium')} className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300">
                    Conhecer módulo <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Models Banner */}
      <section className="py-16 overflow-hidden bg-blue-600/10 border-y border-blue-500/10">
        <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
          <h2 className="text-2xl font-bold">Com todos os modelos mais recentes</h2>
          <p className="text-slate-400 mt-2">Tenha acesso às principais empresas de IA do mundo para que você nunca precise escolher entre os melhores modelos.</p>
        </div>
        <div className="flex space-x-8 overflow-x-auto pb-4 justify-center opacity-80 max-w-7xl mx-auto">
          {['Gemini 1.5 Pro', 'GPT-4o', 'Claude 3.5', 'Fal.ai', 'ElevenLabs', 'Stripe', 'Supabase'].map((model, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-900 px-6 py-3 rounded-2xl border border-slate-700 shrink-0">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-bold text-lg">{model}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise / Features */}
      <section id="enterprise" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Funcionalidades empresariais criadas para escalabilidade</h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Segurança, conformidade e controle administrativo para equipes de qualquer tamanho. Da foto do produto ao fechamento fiscal, tudo o que uma marca precisa no mais alto nível.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <ShieldCheck className="w-8 h-8 text-blue-400 shrink-0" />
                  <div>
                    <strong className="text-xl block mb-1">Indenização Legal e Conformidade</strong>
                    <span className="text-slate-400">Proteção legal completa para conteúdo gerado por IA. Em conformidade com RGPD, ISO 27001 e SOC 2.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Users className="w-8 h-8 text-blue-400 shrink-0" />
                  <div>
                    <strong className="text-xl block mb-1">Controle administrativo</strong>
                    <span className="text-slate-400">Usuários, permissões, créditos e acesso a modelos — um único painel de controle, visibilidade total.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Zap className="w-8 h-8 text-blue-400 shrink-0" />
                  <div>
                    <strong className="text-xl block mb-1">Escala sem limites</strong>
                    <span className="text-slate-400">Usuários ilimitados, gerações paralelas e infraestrutura baseada no uso flexível.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-1 border border-slate-700">
              <div className="bg-slate-950 rounded-[22px] p-8 h-full">
                <div className="space-y-6">
                  <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-32 bg-slate-800/50 rounded-xl border border-slate-800"></div>
                  <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                  <div className="flex gap-4 pt-4">
                    <div className="h-10 w-24 bg-blue-600/20 rounded-lg"></div>
                    <div className="h-10 w-24 bg-slate-800 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-900/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Planos que atendem às suas necessidades</h2>
            <p className="text-slate-400 text-lg">Economize assinando o plano anual ou explore as ferramentas por mês.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Premium */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-slate-400 mb-6">Para pessoas que exploram ferramentas de IA e conteúdo.</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold">R$ 80</span><span className="text-slate-500">/mês</span>
              </div>
              <a href={buildCtaUrl(config.cta, config.params, 'premium')} className="w-full text-center py-3 px-4 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl transition-colors mb-8">
                Obter Premium
              </a>
              <ul className="space-y-4 text-sm text-slate-300 flex-1">
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Acesso a todos os modelos de IA</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Automação Contábil inicial</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Espaços: tela compartilhada</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> MCP e plugins básicos</li>
              </ul>
            </div>

            {/* Premium+ */}
            <div className="bg-slate-900 border-2 border-blue-600 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
                Melhor custo-benefício
              </div>
              <h3 className="text-2xl font-bold mb-2">Premium+</h3>
              <p className="text-slate-400 mb-6">Para criativos e empresas que precisam de acesso total à IA.</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold">R$ 180</span><span className="text-slate-500">/mês</span>
              </div>
              <a href={buildCtaUrl(config.cta, config.params, 'premium_plus')} className="w-full text-center py-3 px-4 bg-white text-black hover:bg-slate-200 font-bold rounded-xl transition-colors mb-8">
                Obter Premium+
              </a>
              <ul className="space-y-4 text-sm text-slate-300 flex-1">
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Ilimitado, o ano todo</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Licença comercial de IA</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Automação Contábil completa + Extensão</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Ferramentas profissionais de edição/engenharia</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Acesso antecipado a recursos</li>
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-slate-400 mb-6">Escolha dos especialistas. Para profissionais expandindo produção.</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold">R$ 1.150</span><span className="text-slate-500">/mês</span>
              </div>
              <a href={buildCtaUrl(config.cta, config.params, 'pro')} className="w-full text-center py-3 px-4 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl transition-colors mb-8">
                Obter nível Pro
              </a>
              <ul className="space-y-4 text-sm text-slate-300 flex-1">
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Ilimitado, o ano todo</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> 4 milhões de créditos inclusos</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Acesso à API com uso flexível</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Indenização legal completa</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Suporte dedicado VIP</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">Respostas às suas principais perguntas</h2>
          <div className="space-y-4">
            {[
              { q: 'A plataforma da Apex AI é a mesma do Freepik/Magnific?', a: 'Não. Nossa VSL é inspirada nos padrões visuais das ferramentas SaaS de ponta como a Magnific, mas oferecemos um ecossistema nativo voltado para negócios (Engenharia, Contabilidade e MCPs).' },
              { q: 'Eu já tenho um plano pago. O que acontece com ele?', a: 'Sua assinatura e histórico continuam ativos. Acesse o portal /accounts ou os módulos correspondentes com o mesmo e-mail.' },
              { q: 'Quem é o proprietário do conteúdo gerado por IA?', a: 'Todos os recursos, modelos financeiros, automações fiscais e fluxos gerados pertencem exclusivamente a você. Nunca usamos seus dados confidenciais para treinar nossos modelos globais.' }
            ].map((faq, i) => (
              <div key={i} className="border border-slate-800 rounded-xl bg-slate-900/50 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 font-medium flex justify-between items-center hover:bg-slate-800/50"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-slate-400">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-2">
            <a href="#" className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <BrainCircuit className="text-blue-500" />
              {config.brand}
            </a>
            <p className="text-slate-400 text-sm max-w-sm">
              A plataforma criativa e corporativa para direcionar seus melhores trabalhos. Modelos de ponta em um só lugar.
            </p>
          </div>
          <div>
            <strong className="block text-white mb-4">Produtos</strong>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white">Contabilidade</a></li>
              <li><a href="#" className="hover:text-white">Engenharia</a></li>
              <li><a href="#" className="hover:text-white">MCP para Claude</a></li>
              <li><a href="#" className="hover:text-white">Agentes & APIs</a></li>
              <li><a href="#" className="hover:text-white">Aplicativo Móvel</a></li>
            </ul>
          </div>
          <div>
            <strong className="block text-white mb-4">Empresa</strong>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white">Sobre nós</a></li>
              <li><a href="#pricing" className="hover:text-white">Preços</a></li>
              <li><a href="#" className="hover:text-white">Tendências de pesquisa</a></li>
              <li><a href="#" className="hover:text-white">Contato</a></li>
            </ul>
          </div>
          <div>
            <strong className="block text-white mb-4">Legal</strong>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href={config.terms} className="hover:text-white">Termos de Uso</a></li>
              <li><a href={config.privacy} className="hover:text-white">Privacidade</a></li>
              <li><a href="#" className="hover:text-white">Documentação</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800 text-sm text-slate-500">
          <span>Copyright © 2026 {config.brand}. Todos os direitos reservados.</span>
          <span>{config.support}</span>
        </div>
      </footer>
    </div>
  )
}

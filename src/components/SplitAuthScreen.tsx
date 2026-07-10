import React, { FormEvent, useMemo, useState, useEffect } from 'react';
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
  const provider = useMemo(() => getSupabaseProviderStatus(), []);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusText, setStatusText] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const SLIDES = [
    { id: 'orcamento', label: 'ORÇAMENTO', title: 'Orçamento Inteligente', desc: 'Previsibilidade financeira com IA avançada.', bg: 'radial-gradient(circle at 50% 50%, #1a2a6c, #112 100%)' },
    { id: 'projetos', label: 'PROJETOS', title: 'Projetos Integrados', desc: 'Compatibilização automática e análise de interferências.', bg: 'radial-gradient(circle at 50% 50%, #b21f1f, #112 100%)' },
    { id: 'execucao', label: 'EXECUÇÃO', title: 'Controle de Execução', desc: 'Acompanhamento de obra em tempo real.', bg: 'radial-gradient(circle at 50% 50%, #fdbb2d, #112 100%)' },
    { id: 'bim', label: 'BIM', title: 'Gestão BIM', desc: 'Modelagem da informação com copilotos autônomos.', bg: 'radial-gradient(circle at 50% 50%, #22c1c3, #112 100%)' },
    { id: 'evm', label: 'EVM', title: 'Inteligência EVM', desc: 'Análise de valor agregado para métricas precisas.', bg: 'radial-gradient(circle at 50% 50%, #f12711, #112 100%)' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [SLIDES.length]);

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
    <div className="fixed inset-0 z-50 flex w-full h-full bg-white text-black animate-[fadeIn_0.5s_ease-out]">
      {/* Back button overlay */}
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 text-white hover:text-gray-300 flex items-center gap-2 transition-colors font-bold z-20 drop-shadow-md"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      {/* Left side: Image and Text Slider */}
      <div className="hidden lg:flex w-1/2 h-full relative flex-col justify-end p-12 overflow-hidden bg-black transition-all duration-1000" style={{ background: SLIDES[activeSlide].bg }}>
        {/* Usando uma imagem genérica como base, mas a cor de fundo muda */}
        <img 
          src="/scifi_bg.png" 
          alt="Cinematic background" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 text-white max-w-xl mb-6">
          <h2 className="text-4xl font-extrabold mb-2 tracking-tight transition-all duration-500 transform translate-y-0 opacity-100" key={SLIDES[activeSlide].title}>
            {SLIDES[activeSlide].title}
          </h2>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed font-medium transition-all duration-500 delay-100 transform translate-y-0 opacity-100" key={SLIDES[activeSlide].desc}>
            {SLIDES[activeSlide].desc}
          </p>
          
          <div className="flex items-center gap-6 text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-12">
            {SLIDES.map((slide, idx) => (
              <div 
                key={slide.id} 
                className="flex flex-col gap-2 cursor-pointer"
                onClick={() => setActiveSlide(idx)}
              >
                <span className={`transition-colors duration-300 ${activeSlide === idx ? 'text-white' : 'hover:text-gray-200'}`}>
                  {slide.label}
                </span>
                <div className="h-[2px] w-full bg-gray-700 overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-white transition-all duration-[5000ms] ease-linear"
                    style={{ 
                      width: activeSlide === idx ? '100%' : '0%',
                      opacity: activeSlide === idx ? 1 : 0
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: White Auth Form */}
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center bg-white p-8 overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col items-center">
          
          <img src="/apex-global-logo.png" alt="Logo" className="w-12 h-12 mb-8 invert" />
          
          <h1 className="text-[28px] font-extrabold tracking-tight mb-8">
            {mode === 'signup' ? 'Criar uma conta' : 'Iniciar sessão'}
          </h1>

          {/* Social Buttons */}
          <div className="w-full space-y-3 mb-6">
            <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 hover:bg-gray-50 transition-colors font-semibold text-sm">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            <button type="button" className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 hover:bg-gray-50 transition-colors font-semibold text-sm">
              <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="w-5 h-5" />
              Continue com a Apple
            </button>
          </div>

          <div className="w-full flex items-center gap-4 mb-6 opacity-60">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-xs font-medium">Ou continue por e-mail.</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="w-full space-y-4">
            <div>
              <input 
                type="email"
                placeholder="Insira seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
            <div>
              <input 
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={busy}
              className="w-full bg-[#f9f9f9] text-gray-500 font-semibold py-3 rounded-lg border border-gray-100 hover:bg-black hover:text-white transition-colors disabled:opacity-50 mt-2"
            >
              {busy ? 'Aguarde...' : 'Continuar'}
            </button>
          </form>

          {statusText && (
            <p className="mt-4 text-sm text-red-500 font-medium text-center">
              {statusText}
            </p>
          )}

          {/* Terms & Footer */}
          {mode === 'signup' && (
            <>
              <div className="flex items-start gap-3 mt-6">
                <input type="checkbox" id="newsletter" className="mt-1 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                <label htmlFor="newsletter" className="text-xs text-gray-500 leading-tight cursor-pointer">
                  Não desejo receber notícias e promoções da Apex AI por e-mail.
                </label>
              </div>

              <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
                Ao continuar, você concorda com os <a href="#" className="underline hover:text-black">Termos de Uso</a> e a <a href="#" className="underline hover:text-black">Política de Privacidade</a> da Apex AI.
              </p>
            </>
          )}

          <div className="mt-8 text-sm">
            {mode === 'signup' ? (
              <span className="text-gray-600">
                Já tem uma conta? <button onClick={() => setMode('login')} className="text-black font-semibold hover:underline">Iniciar sessão</button>
              </span>
            ) : (
              <span className="text-gray-600">
                Não tem uma conta? <button onClick={() => setMode('signup')} className="text-black font-semibold hover:underline">Criar uma conta</button>
              </span>
            )}
          </div>

          <div className="mt-8 text-xs text-gray-400 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Este site está protegido por reCAPTCHA.
          </div>
        </div>
      </div>
    </div>
  );
}

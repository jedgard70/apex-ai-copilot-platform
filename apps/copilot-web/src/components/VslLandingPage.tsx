import React, { useState } from 'react';
import { AuthPanel } from './AuthPanel';

export function VslLandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // If AuthPanel says we're authenticated, we can enter the app
  const handleAuthStateChange = (state: any) => {
    if (state?.user) {
      onEnterApp();
    }
  };

  return (
    <div className="min-h-screen bg-[#040814] text-white selection:bg-[#2563eb] selection:text-white font-sans overflow-x-hidden">
      
      {/* Auth Modal Overlay */}
      {showAuth && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <AuthPanel 
            onClear={() => setShowAuth(false)} 
            onAuthStateChange={handleAuthStateChange} 
          />
        </div>
      )}

      {/* Background Glow Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#2563eb]/20 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#a78bfa]/20 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[30%] bg-[#7df4ff]/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Navigation Bar */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/apex-global-logo.png" alt="Apex Global Logo" className="w-10 h-10 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
          <span className="text-xl font-bold tracking-tight text-white">Apex Global</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#94a3b8]">
          <a href="#solucoes" className="hover:text-white transition-colors">Soluções IA</a>
          <a href="#depoimentos" className="hover:text-white transition-colors">Casos de Sucesso</a>
          <a href="#precos" className="hover:text-white transition-colors">Planos Corporativos</a>
        </div>
        <button 
          onClick={() => setShowAuth(true)}
          className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-20 pb-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            A Nova Era da Gestão Corporativa Autônoma
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-tight">
            Multiplique sua Força de Trabalho com <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7df4ff] via-[#b4c5ff] to-[#ecb2ff]">
              Squads de Inteligência Artificial
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#94a3b8] mb-12 max-w-2xl mx-auto leading-relaxed">
            Delegue Marketing, Engenharia, Finanças e Contratos para Agentes de IA hiper-especializados. Eles não dormem, não erram e reduzem o custo operacional da sua empresa em até 80%.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button 
              onClick={() => setShowAuth(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] active:scale-95 flex items-center justify-center gap-2"
            >
              Acessar a Plataforma
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[#7df4ff]">calendar_month</span>
              Agendar Consultoria
            </button>
          </div>
        </div>

        {/* VSL Video Container */}
        <div className="w-full max-w-5xl mx-auto relative group">
          {/* Decorative glowing border effect behind video */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#2563eb] via-[#ecb2ff] to-[#7df4ff] rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative bg-[#0b1326] rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-2xl flex items-center justify-center">
            {isVideoPlaying ? (
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" // Placeholder video URL
                title="VSL Apex Global" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                onClick={() => setIsVideoPlaying(true)}
              >
                {/* Fake Thumbnail */}
                <div className="absolute inset-0 bg-[#060d20] flex items-center justify-center opacity-80 group-hover:opacity-60 transition-opacity">
                   <div className="absolute inset-0 bg-gradient-to-t from-[#060d20] via-transparent to-transparent"></div>
                </div>
                
                {/* Play Button */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2"></div>
                </div>
                
                <div className="absolute bottom-6 left-8 text-left z-10">
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded mb-2 inline-block border border-red-500/30 uppercase tracking-widest">
                    Assista à Demonstração
                  </span>
                  <h3 className="text-2xl font-bold text-white">Como a Apex reduz custos em 80%</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 py-24 bg-[#060d20]/50 border-t border-white/5" id="solucoes">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Um Ecossistema, Infinitas Possibilidades</h2>
            <p className="text-[#94a3b8] max-w-2xl mx-auto">Nossos modelos de linguagem privados e agentes especializados se integram perfeitamente para substituir dezenas de ferramentas e fluxos lentos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#111827]/60 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <span className="material-symbols-outlined text-3xl text-blue-400">group_work</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Squads Autônomos</h3>
              <p className="text-[#94a3b8] leading-relaxed">Mais de 4.000 prompts e skills exclusivas para orquestrar agentes virtuais (Advogados, Engenheiros, Marketers) de forma coordenada.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#111827]/60 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <span className="material-symbols-outlined text-3xl text-purple-400">dns</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">SaaS Infrastructure Privada</h3>
              <p className="text-[#94a3b8] leading-relaxed">Conexão redundante (Vault) com Groq, OpenAI, Gemini e HuggingFace. Secrecy total dos dados corporativos com fallback automático.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#111827]/60 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
                <span className="material-symbols-outlined text-3xl text-green-400">monitoring</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Auditoria e Controle</h3>
              <p className="text-[#94a3b8] leading-relaxed">Dashboards de altíssimo nível para Owner e Finanças rastrearem o custo (Tokens / USD) e lucro gerado por cada modelo operacional.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/20"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8">Sua empresa preparada <br/>para a Era da IA.</h2>
          <button 
            onClick={() => setShowAuth(true)}
            className="px-10 py-5 rounded-2xl font-bold text-lg text-white bg-[#2563eb] hover:bg-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all hover:scale-105 active:scale-95"
          >
            Começar a Operar Agora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-10 bg-[#040814]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/apex-global-logo.png" alt="Apex Global Logo" className="w-6 h-6 rounded-md grayscale opacity-50" />
            <span className="text-[#64748b] text-sm font-medium">© 2026 Apex Global Copilot. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-[#64748b]">
            <a href="#" className="hover:text-white transition-colors">Termos de Serviço</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

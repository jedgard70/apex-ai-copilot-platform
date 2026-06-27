import React, { useEffect } from 'react';
import { Bot, Zap, Shield, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';

export function ApexPremiumSalesPage() {
  // Inject the Hotmart Widget script on mount
  useEffect(() => {
    // Prevent duplicate injections
    if (!document.querySelector('script[src="https://static.hotmart.com/checkout/widget.min.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://static.hotmart.com/checkout/widget.min.js';
      script.async = true;
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = 'https://static.hotmart.com/css/hotmart-fb.min.css';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <main style={{ 
      height: '100vh', 
      overflowY: 'auto',
      background: '#020617', 
      color: '#f8fafc', 
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowX: 'hidden'
    }}>
      {/* Top Warning/Urgency Bar */}
      <div style={{ 
        background: 'linear-gradient(90deg, #ea580c 0%, #dc2626 100%)', 
        textAlign: 'center', 
        padding: '12px 16px', 
        fontWeight: 700, 
        letterSpacing: '0.05em', 
        textTransform: 'uppercase', 
        fontSize: 13,
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
      }}>
        🔥 OFERTA FUNDADOR: ACESSO VITALÍCIO COM DESCONTO EXCLUSIVO NESTA PÁGINA
      </div>

      {/* Hero Section */}
      <section style={{ 
        maxWidth: 1120, 
        margin: '0 auto', 
        padding: '60px 24px', 
        display: 'grid', 
        gap: 32,
        position: 'relative'
      }}>
        {/* Background Glow */}
        <div style={{
          position: 'absolute',
          top: -100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: 400,
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(2,6,23,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ textAlign: 'center', display: 'grid', gap: 20, zIndex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <strong style={{ 
              fontSize: 16, 
              letterSpacing: '0.15em', 
              color: '#fbbf24',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #fde68a, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ★ PREMIUM EBOOK 2026 ★
            </strong>
          </div>
          
          <h1 style={{ 
            margin: 0, 
            fontSize: 'clamp(40px, 6vw, 68px)', 
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-0.02em'
          }}>
            Seu Imóvel <br/>
            <span style={{ color: '#fbbf24' }}>Sem Arrependimento</span>
          </h1>
          
          <p style={{ 
            margin: '0 auto', 
            fontSize: 'clamp(18px, 2.5vw, 24px)', 
            color: '#94a3b8', 
            maxWidth: 800,
            lineHeight: 1.5,
            fontWeight: 400
          }}>
            O guia definitivo que as construtoras não querem que você leia. 25 anos de canteiro de obras destilados para você não perder dinheiro.
          </p>
        </div>

        {/* Action Button - Hotmart Widget Integration */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, zIndex: 1, position: 'relative' }}>
          <a 
            href="https://pay.hotmart.com/E105852820L" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24, #d97706)', 
              color: '#ffffff', 
              textDecoration: 'none', 
              padding: '20px 48px', 
              borderRadius: 16, 
              fontWeight: 800, 
              fontSize: 22,
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 10px 30px rgba(217, 119, 6, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(217, 119, 6, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(217, 119, 6, 0.4)';
            }}
          >
            <Shield size={26} fill="#fff" color="#d97706" />
            PROTEGER MEU PATRIMÔNIO - R$ 147
            <ChevronRight size={26} />
          </a>
        </div>
        
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: -8, zIndex: 1 }}>
          Pagamento 100% seguro processado pela Hotmart.
        </p>

        {/* Video or VSL Section */}
        <div style={{ 
          marginTop: 40,
          background: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(12px)',
          borderRadius: 24, 
          overflow: 'hidden', 
          border: '1px solid rgba(251, 191, 36, 0.2)', 
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          zIndex: 1,
          position: 'relative'
        }}>
          <video 
            src="/assets/vendas/ebook.mp4" 
            poster="/assets/vendas/capa-ebook.png" 
            controls 
            playsInline 
            style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
          ></video>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 16 }}>Você está prestes a perder dinheiro sem perceber</h2>
          <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 800, margin: '0 auto' }}>
            Todos os anos, brasileiros entram numa obra achando que vão economizar e saem endividados, traídos por fornecedores e morando num imóvel cheio de vícios ocultos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { icon: <Shield size={32} color="#fbbf24" />, title: 'Preço de Custo Real', desc: 'Aprenda a pagar só o custo real dos materiais. Zero taxas ocultas. Cada centavo rastreado.' },
            { icon: <Sparkles size={32} color="#fbbf24" />, title: 'BIM + IA na Prática', desc: 'Veja sua casa em 3D antes de gastar um real. Elimine erros no papel, não no concreto.' },
            { icon: <CheckCircle2 size={32} color="#fbbf24" />, title: 'Contratos Blindados', desc: 'Regras de ouro para nunca ser enganado por fornecedor, pedreiro ou empreiteiro.' },
          ].map((feature, i) => (
            <div key={i} style={{ 
              background: 'rgba(30, 41, 59, 0.4)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: 20, 
              padding: 32,
              transition: 'transform 0.3s, background 0.3s',
              cursor: 'default'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)';
              e.currentTarget.style.transform = 'none';
            }}>
              <div style={{ 
                background: 'rgba(251, 191, 36, 0.1)', 
                width: 64, height: 64, 
                borderRadius: 16, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                marginBottom: 20 
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>{feature.title}</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Author Section */}
      <section style={{ maxWidth: 1120, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ 
          background: 'linear-gradient(90deg, #0f172a, #1e293b)', 
          borderRadius: 24, 
          padding: 40, 
          display: 'flex', 
          gap: 40, 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <img src="/assets/vendas/0131ewb.png" alt="Dr. José Edgard" style={{ width: 250, borderRadius: 16, border: '2px solid #fbbf24' }} />
          <div style={{ flex: 1, minWidth: 300 }}>
            <h3 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, color: '#f8fafc' }}>Dr. José Edgard de Oliveira</h3>
            <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.6, marginBottom: 24 }}>
              Engenheiro Civil (CREA 5071162007) com mais de 25 anos de experiência em obras. PhD em Business, Embaixador da Paz pela ONU e especialista em BIM + Inteligência Artificial.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ padding: '8px 16px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>Engenheiro Civil</span>
              <span style={{ padding: '8px 16px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>25 Anos de Obra</span>
              <span style={{ padding: '8px 16px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>PhD Business</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee */}
      <section style={{ background: '#0f172a', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '12px 24px', borderRadius: 999, fontWeight: 700, marginBottom: 32 }}>
            <Shield size={24} />
            GARANTIA INCONDICIONAL DE 7 DIAS
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 20 }}>Risco Zero.</h2>
          <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.6, marginBottom: 40 }}>
            Se por qualquer motivo você não ficar 100% satisfeito, devolvemos cada centavo. Sem perguntas. Sem burocracia.
          </p>

          <a 
            href="https://pay.hotmart.com/E105852820L" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              background: 'transparent', 
              color: '#fbbf24', 
              border: '2px solid #fbbf24',
              textDecoration: 'none', 
              padding: '18px 40px', 
              borderRadius: 16, 
              fontWeight: 800, 
              fontSize: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#fbbf24';
              e.currentTarget.style.color = '#000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#fbbf24';
            }}
          >
            QUERO ACESSAR O EBOOK AGORA
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#020617', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', color: '#64748b' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ color: '#f8fafc' }}>J. Edgard Engenharia & Gestão</strong>
          </div>
          <span>© {new Date().getFullYear()} Todos os direitos reservados.</span>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Termos de Uso</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Política de Privacidade</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

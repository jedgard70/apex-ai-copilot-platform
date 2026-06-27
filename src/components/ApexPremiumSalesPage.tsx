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
      minHeight: '100vh', 
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
            <Bot size={36} color="#3b82f6" />
            <strong style={{ 
              fontSize: 22, 
              letterSpacing: '0.15em', 
              color: '#3b82f6',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Apex AI
            </strong>
          </div>
          
          <h1 style={{ 
            margin: 0, 
            fontSize: 'clamp(40px, 6vw, 68px)', 
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-0.02em'
          }}>
            Automatize sua Engenharia <br/>
            <span style={{ color: '#3b82f6' }}>com Inteligência Artificial</span>
          </h1>
          
          <p style={{ 
            margin: '0 auto', 
            fontSize: 'clamp(18px, 2.5vw, 24px)', 
            color: '#94a3b8', 
            maxWidth: 800,
            lineHeight: 1.5,
            fontWeight: 400
          }}>
            A primeira plataforma all-in-one de engenharia, arquitetura e gestão, controlada por agentes autônomos. Elimine tarefas repetitivas e escale seus lucros.
          </p>
        </div>

        {/* Action Button - Hotmart Widget Integration */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, zIndex: 1, position: 'relative' }}>
          <a 
            href="https://pay.hotmart.com/E105852820L?checkoutMode=2" 
            style={{ 
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
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
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(37, 99, 235, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(37, 99, 235, 0.4)';
            }}
          >
            <Zap size={26} fill="#fbbf24" color="#fbbf24" />
            COMEÇAR AGORA - R$ 97,00
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
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          zIndex: 1,
          position: 'relative'
        }}>
          <div style={{ 
            aspectRatio: '16 / 9', 
            background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.1), rgba(2, 6, 23, 1))', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
              <div style={{ textAlign: 'center', padding: 24, maxWidth: 520 }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  background: 'rgba(59, 130, 246, 0.2)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  border: '2px solid rgba(59, 130, 246, 0.5)',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{ width: 0, height: 0, borderTop: '15px solid transparent', borderBottom: '15px solid transparent', borderLeft: '24px solid currentColor', marginLeft: 8 }} />
                </div>
                <strong style={{ display: 'block', fontSize: 24, marginBottom: 8, color: '#f1f5f9' }}>Veja a Inteligência Artificial em Ação</strong>
                <span style={{ color: '#94a3b8' }}>Nossa VSL oficial será renderizada aqui.</span>
              </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 16 }}>Por que escolher a Apex AI?</h2>
          <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>Esqueça ferramentas soltas. Tenha um ecossistema completo que trabalha por você 24 horas por dia.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { icon: <Bot size={32} color="#60a5fa" />, title: 'Agentes Autônomos', desc: 'Atendentes, analistas e assistentes virtuais trabalhando em paralelo para o seu negócio.' },
            { icon: <Sparkles size={32} color="#a78bfa" />, title: 'Ecossistema Integrado', desc: 'Marketing, Vendas, Engenharia e Jurídico rodando no mesmo painel unificado.' },
            { icon: <Shield size={32} color="#34d399" />, title: 'Estrutura Completa', desc: 'Geração de contratos, vistos (EB2-NIW) e compliance automático com um clique.' },
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
                background: 'rgba(15, 23, 42, 0.6)', 
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

      {/* Trust & Guarantee */}
      <section style={{ background: '#0f172a', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '12px 24px', borderRadius: 999, fontWeight: 700, marginBottom: 32 }}>
            <Shield size={24} />
            GARANTIA INCONDICIONAL DE 7 DIAS
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 20 }}>Risco Zero. Resultados Imediatos.</h2>
          <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.6, marginBottom: 40 }}>
            Se você não economizar pelo menos 20 horas de trabalho na primeira semana usando nossa plataforma, nós devolvemos 100% do seu dinheiro. Sem perguntas.
          </p>

          <a 
            href="https://pay.hotmart.com/E105852820L?checkoutMode=2" 
            style={{ 
              background: 'transparent', 
              color: '#3b82f6', 
              border: '2px solid #3b82f6',
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
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#3b82f6';
            }}
          >
            QUERO ACESSAR AGORA MESMO
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#020617', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', color: '#64748b' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={24} />
            <strong style={{ color: '#f8fafc' }}>Apex AI Copilot</strong>
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

import React, { useEffect } from 'react';
import { Bot, Zap, Shield, Sparkles, ChevronRight, CheckCircle2, AlertTriangle, Gift, BookOpen, Star, HelpCircle } from 'lucide-react';

export function ApexPremiumSalesPage() {
  useEffect(() => {
    // Unlock global scrolling for the sales page
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const root = document.getElementById('root');
    if (root) root.style.overflow = 'auto';

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

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (root) root.style.overflow = '';
    };
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
        ⚡ OFERTA DE LANÇAMENTO — SOMENTE R$ 147 — PREÇO SOBE SEM AVISO PRÉVIO
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
        <div style={{
          position: 'absolute',
          top: -100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: 400,
          background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(2,6,23,0) 70%)',
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

        {/* Action Button */}
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
          >
            <Shield size={26} fill="#fff" color="#d97706" />
            PROTEGER MEU PATRIMÔNIO - R$ 147
            <ChevronRight size={26} />
          </a>
        </div>

        {/* Video Section */}
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

      {/* Stats Row */}
      <section style={{ borderTop: '1px solid rgba(251, 191, 36, 0.2)', borderBottom: '1px solid rgba(251, 191, 36, 0.2)', background: 'rgba(15, 23, 42, 0.5)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
          <div style={{ padding: '32px 16px', borderRight: '1px solid rgba(251, 191, 36, 0.1)' }}>
            <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#fbbf24' }}>25+</div>
            <div style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>Anos de Obra</div>
          </div>
          <div style={{ padding: '32px 16px', borderRight: '1px solid rgba(251, 191, 36, 0.1)' }}>
            <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#fbbf24' }}>14</div>
            <div style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>Capítulos</div>
          </div>
          <div style={{ padding: '32px 16px' }}>
            <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#fbbf24' }}>PhD</div>
            <div style={{ fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>Business & Mkt</div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ display: 'inline-block', background: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', padding: '8px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14, letterSpacing: 2, marginBottom: 20 }}>O PROBLEMA</span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 16 }}>Você está prestes a perder <span style={{ color: '#ef4444' }}>muito dinheiro</span> sem perceber</h2>
          <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 800, margin: '0 auto', lineHeight: 1.6 }}>
            Todos os anos, brasileiros entram numa obra achando que vão economizar e saem endividados, traídos por fornecedores e morando num imóvel cheio de problemas que a tinta fresca escondia.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800, margin: '0 auto' }}>
          {[
            { title: 'O orçamento dobra no meio da obra', desc: 'A construtora embute "gordura" de risco e lucro que você paga sem saber o que é.' },
            { title: 'Você compra um imóvel "lindo" e descobre pesadelos', desc: 'Infiltração, elétrica subdimensionada, fundação sem sondagem de solo.' },
            { title: 'O acordo de boca vai te prejudicar', desc: 'Sem escopo técnico contratual, você fica refém da palavra do empreiteiro.' },
            { title: 'Você paga 30% a 50% de lucro alheio', desc: 'Esse dinheiro poderia estar no seu patrimônio, não no bolso da construtora.' },
            { title: 'Sem BIM, os erros aparecem no concreto', desc: 'E aí o prejuízo já está feito e custa caro para corrigir.' }
          ].map((pain, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                ✕
              </div>
              <div>
                <strong style={{ fontSize: 18, color: '#f8fafc', display: 'block', marginBottom: 4 }}>{pain.title}</strong>
                <span style={{ color: '#94a3b8', lineHeight: 1.5 }}>{pain.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The Solution */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ display: 'inline-block', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '8px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14, letterSpacing: 2, marginBottom: 20 }}>A SOLUÇÃO</span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 16 }}>25 anos de canteiro destilados em <span style={{ color: '#fbbf24' }}>1 guia definitivo</span></h2>
          <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 800, margin: '0 auto', lineHeight: 1.6 }}>
            Cada capítulo foi escrito para eliminar o amadorismo e colocar você no controle absoluto do seu investimento — com método, tecnologia e transparência.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 60 }}>
          {[
            { icon: <Shield size={32} color="#fbbf24" />, title: 'Preço de Custo Real', desc: 'Você paga só o custo real dos materiais. Zero taxas ocultas. Cada centavo rastreado.' },
            { icon: <Sparkles size={32} color="#fbbf24" />, title: 'BIM + Inteligência Artificial', desc: 'Veja sua casa em 3D antes de gastar um real. Elimine erros no papel, não no concreto.' },
            { icon: <CheckCircle2 size={32} color="#fbbf24" />, title: 'Contratos Blindados', desc: 'Regras de ouro para nunca ser enganado por fornecedor, pedreiro ou empreiteiro.' },
            { icon: <Zap size={32} color="#fbbf24" />, title: 'Raio-X Vícios Ocultos', desc: 'O que está dentro das paredes antes de comprar. A tinta fresca esconde mais do que você imagina.' },
            { icon: <AlertTriangle size={32} color="#fbbf24" />, title: 'Do Terreno ao Habite-se', desc: 'Cada fase da obra com cronograma financeiro claro — semana a semana.' },
            { icon: <Bot size={32} color="#fbbf24" />, title: 'Decorar Gastando Pouco', desc: 'A regra 80/20 dos acabamentos: onde investir e onde economizar sem perder padrão.' }
          ].map((feature, i) => (
            <div key={i} style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(251, 191, 36, 0.2)', borderTop: '4px solid #fbbf24', borderRadius: 16, padding: 32 }}>
              <div style={{ background: 'rgba(251, 191, 36, 0.1)', width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#f8fafc' }}>{feature.title}</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Chapters */}
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'rgba(15, 23, 42, 0.4)', padding: 40, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1 }}>Conteúdo Completo — 14 Capítulos:</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {[
              "01 - O Sonho que Não Pode Virar Pesadelo",
              "03 - O Alerta Real: O Barato que Sai Caro",
              "04 - Os 4 Maiores Mitos da Construção Civil",
              "05 - Do Papel à Realidade: O Método J. Edgard",
              "06 - Comprar Pronto ou Construir? Veredito Real",
              "07 - O Cofre da Obra: Blindagem do Preço de Custo",
              "08 - Vícios Ocultos: O que a Tinta Fresca Esconde",
              "09 - Escolha Inteligente do Terreno",
              "10 - Do Terreno ao Habite-se: O Mapa Completo",
              "11 - Contratos e Fornecedores: Blindagem Jurídica",
              "12 - Decorando com Economia",
              "13 - O Refúgio e a Máquina: Galpão Industrial",
              "14 - Seu Novo Capítulo Começa Aqui"
            ].map((cap, i) => {
              const [num, title] = cap.split(' - ');
              return (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                  <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 18 }}>{num}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 16 }}>{title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Author Section */}
      <section style={{ maxWidth: 1120, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ background: 'linear-gradient(90deg, #0f172a, #1e293b)', borderRadius: 24, padding: 40, display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
          <img src="/assets/vendas/0131ewb.png" alt="Dr. José Edgard" style={{ width: 250, borderRadius: 16, border: '2px solid #fbbf24' }} />
          <div style={{ flex: 1, minWidth: 300 }}>
            <h3 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, color: '#f8fafc' }}>Dr. José Edgard de Oliveira</h3>
            <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.6, marginBottom: 24 }}>
              Engenheiro Civil (CREA 5071162007) com mais de 25 anos de experiência em obras. PhD em Business, Embaixador da Paz pela ONU e especialista em BIM + Inteligência Artificial.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ padding: '8px 16px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 8, fontWeight: 600, fontSize: 14, border: '1px solid rgba(251,191,36,0.3)' }}>Engenheiro Civil</span>
              <span style={{ padding: '8px 16px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 8, fontWeight: 600, fontSize: 14, border: '1px solid rgba(251,191,36,0.3)' }}>25 Anos de Obra</span>
              <span style={{ padding: '8px 16px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 8, fontWeight: 600, fontSize: 14, border: '1px solid rgba(251,191,36,0.3)' }}>PhD Business</span>
              <span style={{ padding: '8px 16px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderRadius: 8, fontWeight: 600, fontSize: 14, border: '1px solid rgba(251,191,36,0.3)' }}>Comendador Ordem JK</span>
            </div>
          </div>
        </div>
      </section>

      {/* Warning Box */}
      <section style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)', border: '2px solid #ef4444', borderRadius: 24, padding: '32px 40px', textAlign: 'center' }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            ⚡ Atenção — Cada Dia Sem Isso Te Custa Dinheiro
          </h3>
          <p style={{ color: '#fca5a5', fontSize: 18, lineHeight: 1.6 }}>
            Um único erro de fundação pode custar <strong style={{ color: '#fff' }}>R$ 30.000 em correções</strong>. Uma elétrica subdimensionada pode causar <strong style={{ color: '#fff' }}>incêndio</strong>. Vícios ocultos numa compra pronta podem virar <strong style={{ color: '#fff' }}>anos na justiça</strong>.<br/><br/>
            O preço deste guia é menor do que <strong style={{ color: '#fff' }}>uma hora de consultoria de engenharia.</strong>
          </p>
        </div>
      </section>

      {/* Bonus Section */}
      <section style={{ maxWidth: 1120, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ background: '#0f172a', border: '1px solid rgba(251, 191, 36, 0.3)', borderTop: '4px solid #fbbf24', borderRadius: 24, padding: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <Gift size={32} color="#fbbf24" />
            <h2 style={{ fontSize: 32, fontWeight: 800 }}>Bônus Exclusivos</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 32 }}>Além do ebook principal, você terá ferramentas práticas para aplicar o método hoje mesmo.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { title: 'Calculadora de Custos', desc: 'Planilha prática para você entender se o preço que estão cobrando faz sentido matemático.' },
              { title: 'Checklist de Contratação', desc: 'O que perguntar para o pedreiro, arquiteto ou construtora antes de assinar qualquer papel.' },
              { title: 'Guia Completo em PDF', desc: 'Tudo documentado para consultar offline ou no celular no meio da obra.' }
            ].map((bonus, i) => (
              <div key={i} style={{ background: '#020617', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>{bonus.title}</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{bonus.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 1120, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 16 }}>Quem leu, blindou seu patrimônio</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { name: "Carlos A.", role: "Construindo primeira casa", text: "Eu estava prestes a fechar com um empreiteiro no 'acordo de boca'. O capítulo 11 de contratos me salvou de um prejuízo de pelo menos R$ 40 mil." },
            { name: "Marina Silva", role: "Compradora de Imóvel Pronto", text: "Queria comprar um apartamento recém reformado. Graças ao guia, exigi o laudo e descobrimos que a elétrica antiga estava escondida sob gesso novo. Desisti da compra a tempo." },
            { name: "Ricardo T.", role: "Investidor de Imóveis", text: "Trabalho com imóveis há 5 anos e o Dr. Edgard trouxe conceitos sobre BIM e gestão de custos que eu não via nem em cursos de R$ 2.000. Essencial." }
          ].map((t, i) => (
            <div key={i} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: 32, borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={20} fill="#fbbf24" color="#fbbf24" />)}
              </div>
              <p style={{ fontSize: 16, color: '#f8fafc', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 24 }}>"{t.text}"</p>
              <div>
                <strong style={{ display: 'block', color: '#fbbf24', fontSize: 16 }}>{t.name}</strong>
                <span style={{ color: '#64748b', fontSize: 14 }}>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing & CTA */}
      <section style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '2px solid #fbbf24', borderRadius: 24, padding: 48, textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, fontSize: 14, marginBottom: 16 }}>Investimento único — acesso vitalício</p>
          <div style={{ textDecoration: 'line-through', color: '#64748b', fontSize: 20, marginBottom: 8 }}>De R$ 297,00</div>
          <div style={{ fontSize: 80, fontWeight: 800, color: '#fbbf24', lineHeight: 1, marginBottom: 16 }}>
            <span style={{ fontSize: 32, verticalAlign: 'super' }}>R$</span>147
          </div>
          <p style={{ color: '#94a3b8', marginBottom: 40 }}>PDF Completo — Acesso Imediato — Leia em Qualquer Dispositivo</p>

          <a 
            href="https://pay.hotmart.com/E105852820L" 
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24, #d97706)', 
              color: '#ffffff', 
              textDecoration: 'none', 
              padding: '24px 40px', 
              borderRadius: 16, 
              fontWeight: 800, 
              fontSize: 24,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: '100%',
              boxShadow: '0 10px 30px rgba(217, 119, 6, 0.4)',
              transition: 'transform 0.2s',
            }}
          >
            🔓 PROTEGER MEU PATRIMÔNIO AGORA
          </a>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 16 }}>Pix · Cartão de Crédito (até 12x) · Boleto — Pagamento 100% seguro via Hotmart</p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 24px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>Dúvidas Frequentes</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {[
            { q: 'Precisa de conhecimento técnico para ler?', a: 'Não. O livro foi escrito para leigos e técnicos. Linguagem direta, exemplos reais e visuais em cada capítulo.' },
            { q: 'Vale para quem vai comprar imóvel pronto também?', a: 'Sim. O capítulo sobre vícios ocultos e o dilema "comprar vs. construir" foram feitos exatamente para esse perfil.' },
            { q: 'Como recebo após a compra?', a: 'Imediatamente. Confirmado o pagamento, você recebe o link de download no e-mail cadastrado.' },
            { q: 'Vale para galpão e imóvel comercial?', a: 'Sim. O capítulo 13 trata especificamente de galpões industriais, com foco em BIM, estrutura e Retorno sobre Investimento (ROI).' },
            { q: 'E se eu não gostar?', a: 'Você tem garantia de 7 dias. Peça reembolso sem nenhuma justificativa e receba 100% de volta. Risco zero.' }
          ].map((faq, i) => (
            <div key={i} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <strong style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 18, color: '#f8fafc', marginBottom: 8 }}>
                <HelpCircle size={20} color="#fbbf24" /> {faq.q}
              </strong>
              <p style={{ color: '#94a3b8', paddingLeft: 32, lineHeight: 1.6 }}>{faq.a}</p>
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
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, marginBottom: 20 }}>Risco Zero.</h2>
          <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.6, marginBottom: 40 }}>
            Se por qualquer motivo você não ficar 100% satisfeito, devolvemos cada centavo. Sem perguntas. Sem burocracia.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#020617', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', color: '#64748b' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ color: '#f8fafc' }}>J. Edgard Engenharia & Gestão</strong>
          </div>
          <span style={{ fontSize: 14 }}>© {new Date().getFullYear()} Todos os direitos reservados. Dr. José Edgard de Oliveira — CREA 5071162007</span>
        </div>
      </footer>
    </main>
  );
}

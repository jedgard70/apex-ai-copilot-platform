import React, { useEffect } from 'react';
import './ApexPremiumSalesPage.css';

export function ApexPremiumSalesPage() {
  useEffect(() => {
    // Unlock global scrolling for the sales page
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const root = document.getElementById('root');
    if (root) root.style.overflow = 'auto';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (root) root.style.overflow = '';
    };
  }, []);

  return (
    <div className="ebook-wrapper">
      <div className="pg">
        <div className="ticker">
          <span>CREA 5071162007 • CONSTRUÇÃO CIVIL • MÉTODO 100% BLINDADO • CREA 5071162007 • CONSTRUÇÃO CIVIL</span>
        </div>
        
        <div className="urgency-bar">
          <p>⚡ ATENÇÃO: PREÇO DE LANÇAMENTO EXPIRA EM BREVE <span>(DE R$ 297 POR R$ 147)</span></p>
        </div>

        <div className="hero-block">
          <img src="/assets/vendas/cartaoebook.png" alt="Capa Ebook Seu Imóvel" className="hero-img" />
          <div className="hero-img-overlay"></div>
          <div className="hero-text">
            <span className="hero-eyebrow">PREMIUM EBOOK 2026</span>
            <h1 className="hero-h">Seu Imóvel<br/><em>Sem Arrependimento</em></h1>
            <p className="hero-tagline">O guia definitivo que as construtoras não querem que você leia.</p>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat">
            <div className="stat-n">25+</div>
            <div className="stat-l">Anos de Obra</div>
          </div>
          <div className="stat">
            <div className="stat-n">14</div>
            <div className="stat-l">Capítulos</div>
          </div>
          <div className="stat">
            <div className="stat-n">PhD</div>
            <div className="stat-l">Business/Mkt</div>
          </div>
        </div>

        <div className="hook-band">
          <blockquote>"Construir ou comprar sem esse conhecimento é assinar um cheque em branco de <em>risco patrimonial.</em>"</blockquote>
          <small>— Dr. José Edgard</small>
        </div>

        <div className="video-sec">
          <div className="video-shell">
            <video src="/assets/vendas/ebook.mp4" poster="/assets/vendas/capa-ebook-pdf.png" controls playsInline></video>
          </div>
          <div className="video-caption">
            <strong>Assista ao Vídeo Acima</strong>
            <span>Descubra porque orçamentos dobram e como as construtoras embutem lucros absurdos nas entrelinhas.</span>
          </div>
        </div>

        <div className="sec">
          <span className="tag">O PROBLEMA REAL</span>
          <h2 className="sec-h">Você vai perder <span className="r">MUITO dinheiro</span> sem perceber</h2>
          <p className="body-txt">Todos os anos, brasileiros entram numa obra achando que vão economizar e saem endividados, traídos por fornecedores e morando num imóvel cheio de problemas que a tinta fresca escondia.</p>

          <div className="pain-list">
            <div className="pain-item"><div className="pain-x">✕</div><p><strong>O orçamento dobra no meio da obra</strong>A construtora embute "gordura" de risco e lucro que você paga sem saber.</p></div>
            <div className="pain-item"><div className="pain-x">✕</div><p><strong>Imóvel lindo, pesadelo por trás</strong>Infiltração, elétrica fraca, fundação mal feita.</p></div>
            <div className="pain-item"><div className="pain-x">✕</div><p><strong>O acordo de boca te prejudica</strong>Sem escopo técnico contratual, você fica refém.</p></div>
          </div>
        </div>

        <div className="gold-line"></div>

        <div className="sec">
          <span className="tag gold">A SOLUÇÃO BLINDADA</span>
          <h2 className="sec-h">25 anos de canteiro destilados num <span className="g">método único</span></h2>
          <p className="body-txt">Cada capítulo foi escrito para eliminar o amadorismo e colocar você no controle absoluto do seu investimento — com método, tecnologia e transparência total.</p>
          
          <div className="ben-grid">
            <div className="ben-card">
              <div className="ben-ico">💰</div>
              <h3 className="ben-h">Preço de Custo</h3>
              <p className="ben-p">Pague só material e mão de obra real. Zero taxas ocultas.</p>
            </div>
            <div className="ben-card">
              <div className="ben-ico">🚀</div>
              <h3 className="ben-h">BIM + Inteligência</h3>
              <p className="ben-p">Erre no papel e no 3D, nunca no concreto e no seu bolso.</p>
            </div>
            <div className="ben-card">
              <div className="ben-ico">⚖️</div>
              <h3 className="ben-h">Contratos Blindados</h3>
              <p className="ben-p">Regras de ouro para não ser enganado por empreiteiros.</p>
            </div>
            <div className="ben-card">
              <div className="ben-ico">🔍</div>
              <h3 className="ben-h">Raio-X de Vícios</h3>
              <p className="ben-p">O que a tinta fresca esconde num imóvel pronto.</p>
            </div>
          </div>

          <div className="caps-label">Conteúdo do Ebook</div>
          <div className="cap-list">
            <div className="cap-row"><span className="cap-n">01</span><strong>O Sonho x Pesadelo</strong> <span>(Introdução)</span></div>
            <div className="cap-row"><span className="cap-n">05</span><strong>Método J. Edgard</strong> <span>(Do Papel à Realidade)</span></div>
            <div className="cap-row"><span className="cap-n">06</span><strong>Comprar x Construir</strong> <span>(Veredito Financeiro)</span></div>
            <div className="cap-row"><span className="cap-n">07</span><strong>O Cofre da Obra</strong> <span>(Preço de Custo Real)</span></div>
            <div className="cap-row"><span className="cap-n">08</span><strong>Vícios Ocultos</strong> <span>(Blindagem Total)</span></div>
            <div className="cap-row"><span className="cap-n">10</span><strong>O Mapa Completo</strong> <span>(Do Terreno ao Habite-se)</span></div>
            <div className="cap-row"><span className="cap-n">11</span><strong>Fornecedores</strong> <span>(O Fator Jurídico)</span></div>
          </div>
        </div>

        <div className="alert-box">
          <h3>Cada dia sem isso te custa dinheiro</h3>
          <p>Um único erro de fundação pode custar <strong>R$ 30.000</strong> em correções. O preço deste guia é menor que <strong>uma hora de consultoria.</strong></p>
        </div>

        <img src="/assets/vendas/0131ewb.png" alt="Dr. José Edgard" className="author-img" />
        <div className="cred-bar">
          <span className="cred">DR. JOSÉ EDGARD</span>
          <span className="cred">ENG. CIVIL</span>
          <span className="cred">PHD BUSINESS</span>
        </div>

        <div className="bonus-wrap">
          <div className="bonus-panel">
            <h3 className="bonus-head">Bônus <span>Inclusos</span></h3>
            <p className="bonus-intro">Comprando hoje, você leva gratuitamente 3 ferramentas de alto valor agregado:</p>
            
            <div className="bonus-list">
              <div className="bonus-item">
                <div className="bonus-ico">📊</div>
                <div>
                  <h3>Calculadora de Custos</h3>
                  <p>Planilha prática para você entender se o orçamento que te passaram faz sentido.</p>
                </div>
              </div>
              <div className="bonus-item">
                <div className="bonus-ico">📋</div>
                <div>
                  <h3>Checklist Blindado</h3>
                  <p>O que perguntar antes de assinar contrato com construtores e engenheiros.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="price-wrap">
          <div className="price-card">
            <div className="from-price">De R$ 297,00 por</div>
            <div className="by-label">Investimento Único</div>
            <div className="price-big"><small>R$</small>147</div>
            <p className="price-note">PDF Completo • Acesso Imediato • Risco Zero</p>
            
            <a href="https://pay.hotmart.com/E105852820L" target="_blank" rel="noopener noreferrer" className="cta">
              Quero Proteger Meu Patrimônio
            </a>
            
            <p className="cta-sub">Você será redirecionado para a Hotmart (Ambiente 100% Seguro)</p>

            <div className="guar">
              <div className="guar-ico">🛡️</div>
              <div>
                <h4>Garantia Incondicional de 7 Dias</h4>
                <p>Se você não gostar do material por qualquer motivo, devolvemos 100% do seu dinheiro. Sem perguntas.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-block">
          <h2 className="faq-h">Dúvidas Frequentes</h2>
          <div className="faq-item">
            <h4 className="faq-q">É muito técnico? Vou entender?</h4>
            <p className="faq-a">O livro foi escrito com linguagem direta e simples, voltada para leigos que querem fugir de armadilhas, embora engenheiros também amem as estratégias.</p>
          </div>
          <div className="faq-item">
            <h4 className="faq-q">Vale para imóvel pronto?</h4>
            <p className="faq-a">Sim. Há um capítulo inteiro sobre como fazer o "Raio-X" de vícios ocultos num imóvel recém pintado antes de fechar a compra.</p>
          </div>
        </div>

        <div className="foot">
          © 2026 Dr. José Edgard de Oliveira<br/>CREA 5071162007 • Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}

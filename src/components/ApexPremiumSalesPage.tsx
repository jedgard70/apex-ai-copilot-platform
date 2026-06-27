import React, { useEffect } from 'react';
import './ApexPremiumSalesPage.css';

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
    <div className="ebook-sales-wrapper">
      <div className="pg">
        
        <div className="ticker">
          <span>★ DR. JOSÉ EDGARD DE OLIVEIRA ★ CREA 5071162007 ★ 25 ANOS DE OBRA ★ PHD BUSINESS MARKETING ★ BIM + INTELIGÊNCIA ARTIFICIAL ★ EMBAIXADOR DA PAZ — ONU ★ COMENDADOR ORDEM JK ★ MASTER PNL ★ 70 COLABORADORES GERENCIADOS ★ J. EDGARD ENGENHARIA &amp; GESTÃO ★</span>
        </div>

        <div className="urgency-bar">
          <p>⚡ OFERTA DE LANÇAMENTO — SOMENTE <span>R$ 147</span> — PREÇO SOBE SEM AVISO PRÉVIO</p>
        </div>

        <div className="hero-block">
          <img className="hero-img" src="/assets/vendas/cartaoebook.png" alt="Seu Imóvel Sem Arrependimento — Dr. José Edgard de Oliveira" />
          <div className="hero-img-overlay"></div>
          <div className="hero-text">
            <div className="hero-eyebrow">★ PREMIUM EBOOK 2026</div>
            <div className="hero-h">Seu Imóvel<br /><em>Sem Arrependimento</em></div>
            <p className="hero-tagline">O guia que as construtoras não querem que você leia</p>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat"><div className="stat-n">25+</div><div className="stat-l">Anos de Obra</div></div>
          <div className="stat"><div className="stat-n">14</div><div className="stat-l">Capítulos</div></div>
          <div className="stat"><div className="stat-n">PhD</div><div className="stat-l">Business &amp; Mkt</div></div>
        </div>

        <div className="hook-band">
          <blockquote>"Obra a gente sabe quando começa,<br />mas <em>não quando termina.</em>"<br /><span style={{ color: '#fff', fontSize: '18px' }}>— Isso é mentira. E este guia prova.</span></blockquote>
          <small>Dr. José Edgard de Oliveira — Engenheiro Civil &amp; Gestor</small>
        </div>

        <div className="video-sec">
          <div className="tag gold">ASSISTA PRIMEIRO</div>
          <h2 className="sec-h">Antes de comprar ou construir,<br />entenda o <span className="g">risco invisível</span></h2>
          <p className="body-txt">Em poucos minutos, veja por que tantos proprietários só descobrem o prejuízo quando ele já está dentro da parede, do contrato ou do orçamento.</p>
          <div className="video-shell">
            <video src="/assets/vendas/ebook.mp4" poster="/assets/vendas/capa-ebook.png" controls preload="metadata" playsInline></video>
            <div className="video-caption">
              <strong>Mensagem direta do Dr. José Edgard</strong>
              <span>Use este vídeo como ponto de virada: primeiro gera consciência do problema, depois a página mostra a solução completa.</span>
            </div>
          </div>
        </div>

        <div className="sec">
          <div className="tag">O PROBLEMA</div>
          <h2 className="sec-h">Você está prestes a<br />perder <span className="r">muito dinheiro</span><br />sem perceber</h2>
          <p className="body-txt">Todos os anos, brasileiros entram numa obra achando que vão economizar — e saem endividados, traídos por fornecedores e morando num imóvel cheio de problemas que a tinta fresca escondia.</p>
          <div className="pain-list">
            <div className="pain-item"><div className="pain-x">✕</div><p><strong>O orçamento dobra no meio da obra</strong> — a construtora embute "gordura" de risco e lucro que você paga sem saber o que é</p></div>
            <div className="pain-item"><div className="pain-x">✕</div><p><strong>Você compra um imóvel "lindo" e descobre pesadelos</strong> — infiltração, elétrica subdimensionada, fundação sem sondagem de solo</p></div>
            <div className="pain-item"><div className="pain-x">✕</div><p><strong>O acordo de boca vai te prejudicar</strong> — sem escopo técnico contratual, você fica refém da palavra do empreiteiro</p></div>
            <div className="pain-item"><div className="pain-x">✕</div><p><strong>Você paga 30% a 50% de lucro alheio</strong> — esse dinheiro poderia estar no seu patrimônio, não no bolso da construtora</p></div>
            <div className="pain-item"><div className="pain-x">✕</div><p><strong>Sem BIM, os erros aparecem no concreto</strong> — e aí o prejuízo já está feito e custa caro para corrigir</p></div>
          </div>
        </div>

        <div className="gold-line"></div>

        <div className="sec">
          <div className="tag gold">A SOLUÇÃO</div>
          <h2 className="sec-h">25 anos de canteiro<br />destilados em <span className="g">1 guia definitivo</span></h2>
          <p className="body-txt">Cada capítulo foi escrito para eliminar o amadorismo e colocar você no controle absoluto do seu investimento — com método, tecnologia e transparência.</p>
          <div className="ben-grid">
            <div className="ben-card"><div className="ben-ico">🛡️</div><div className="ben-h">Preço de Custo</div><div className="ben-p">Você paga só o custo real dos materiais. Zero taxas ocultas. Cada centavo rastreado.</div></div>
            <div className="ben-card"><div className="ben-ico">🔬</div><div className="ben-h">BIM + Inteligência Artificial</div><div className="ben-p">Veja sua casa em 3D antes de gastar um real. Elimine erros no papel, não no concreto.</div></div>
            <div className="ben-card"><div className="ben-ico">⚖️</div><div className="ben-h">Contratos Blindados</div><div className="ben-p">Regras de ouro para nunca ser enganado por fornecedor, pedreiro ou empreiteiro.</div></div>
            <div className="ben-card"><div className="ben-ico">🔍</div><div className="ben-h">Raio-X Vícios Ocultos</div><div className="ben-p">O que está dentro das paredes antes de comprar. A tinta fresca esconde mais do que você imagina.</div></div>
            <div className="ben-card"><div className="ben-ico">🗺️</div><div className="ben-h">Do Terreno ao Habite-se</div><div className="ben-p">Cada fase da obra com cronograma financeiro claro — semana a semana.</div></div>
            <div className="ben-card"><div className="ben-ico">💰</div><div className="ben-h">Decorar Gastando Pouco</div><div className="ben-p">A regra 80/20 dos acabamentos: onde investir e onde economizar sem perder padrão.</div></div>
          </div>
          <p className="caps-label">Conteúdo completo — 14 capítulos:</p>
          <div className="cap-list">
            <div className="cap-row"><span className="cap-n">01</span><p><strong>O Sonho que Não Pode Virar Pesadelo</strong></p></div>
            <div className="cap-row"><span className="cap-n">03</span><p><strong>O Alerta Real:</strong> <span>O Barato que Sai Caro</span></p></div>
            <div className="cap-row"><span className="cap-n">04</span><p><strong>Os 4 Maiores Mitos</strong> <span>da Construção Civil — desmontados com provas</span></p></div>
            <div className="cap-row"><span className="cap-n">05</span><p><strong>Do Papel à Realidade:</strong> <span>O Método J. Edgard de Construir</span></p></div>
            <div className="cap-row"><span className="cap-n">06</span><p><strong>Comprar Pronto ou Construir?</strong> <span>O veredito definitivo com matemática real</span></p></div>
            <div className="cap-row"><span className="cap-n">07</span><p><strong>O Cofre da Obra:</strong> <span>Blindagem Total do Preço de Custo</span></p></div>
            <div className="cap-row"><span className="cap-n">08</span><p><strong>Vícios Ocultos:</strong> <span>O que a Tinta Fresca Esconde</span></p></div>
            <div className="cap-row"><span className="cap-n">09</span><p><strong>Escolha Inteligente do Terreno:</strong> <span>Onde o Projeto Nasce</span></p></div>
            <div className="cap-row"><span className="cap-n">10</span><p><strong>Do Terreno ao Habite-se:</strong> <span>O Mapa Completo da Construção</span></p></div>
            <div className="cap-row"><span className="cap-n">11</span><p><strong>Contratos e Fornecedores:</strong> <span>Blindagem Jurídica Total</span></p></div>
            <div className="cap-row"><span className="cap-n">12</span><p><strong>Decorando com Economia:</strong> <span>Segredos de Designer de Alto Padrão</span></p></div>
            <div className="cap-row"><span className="cap-n">13</span><p><strong>O Refúgio e a Máquina:</strong> <span>Residência vs. Galpão Industrial</span></p></div>
            <div className="cap-row"><span className="cap-n">14</span><p><strong>Seu Novo Capítulo Começa Aqui</strong></p></div>
          </div>
        </div>

        <div className="gold-line"></div>

        <img className="author-img" src="/assets/vendas/0131ewb.png" alt="Dr. José Edgard de Oliveira — A Engenharia Aliada à Alta Gestão" />

        <div className="cred-bar">
          <span className="cred">ENGENHEIRO CIVIL</span>
          <span className="cred">CREA 5071162007</span>
          <span className="cred">25 ANOS DE OBRA</span>
          <span className="cred">PHD BUSINESS — LONDRES</span>
          <span className="cred">MBA INTERNACIONAL</span>
          <span className="cred">BIM + IA</span>
          <span className="cred">MASTER PNL</span>
          <span className="cred">EMBAIXADOR DA PAZ — ONU</span>
          <span className="cred">COMENDADOR ORDEM JK</span>
        </div>

        <div className="alert-box">
          <h3>⚡ Atenção — Cada Dia Sem Isso Te Custa Dinheiro</h3>
          <p>Um único erro de fundação pode custar <strong>R$ 30.000 em correções</strong>. Uma elétrica subdimensionada pode causar <strong>incêndio</strong>. Vícios ocultos numa compra pronta podem virar <strong>anos na justiça</strong>.<br /><br />O preço deste guia é menor do que <strong>uma hora de consultoria de engenharia.</strong></p>
        </div>

        <div className="bonus-wrap">
          <div className="bonus-panel">
            <h2 className="bonus-head">Você também recebe <span>materiais práticos</span></h2>
            <p className="bonus-intro">Além do ebook principal, você terá ferramentas para decidir melhor, configurar a venda e consultar tudo sem depender de internet.</p>
            <div className="bonus-list">
              <div className="bonus-item">
                <div className="bonus-ico">💰</div>
                <div>
                  <h3>Cálculo de custos</h3>
                  <p>Compare quanto você recebe líquido por venda no Hotmart versus Systeme.io, já considerando taxas e impacto no lucro final.</p>
                </div>
              </div>
              <div className="bonus-item">
                <div className="bonus-ico">✅</div>
                <div>
                  <h3>Checklist de configuração</h3>
                  <p>Passo a passo para colocar a estrutura no ar com página, pagamento, entrega do PDF e conferência antes de divulgar.</p>
                </div>
              </div>
              <div className="bonus-item">
                <div className="bonus-ico">📄</div>
                <div>
                  <h3>Guia em PDF</h3>
                  <p>Tudo documentado em um arquivo organizado para consultar offline sempre que precisar revisar a implantação.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="price-wrap">
          <div className="price-card">
            <p className="by-label">Investimento único — acesso vitalício</p>
            <p className="from-price">De R$ 297,00</p>
            <p className="price-big"><small>R$</small> 147</p>
            <p className="price-note">PDF completo — acesso imediato — leia em qualquer dispositivo</p>
            
            {/* The actual Hotmart integration anchor */}
            <a 
              className="cta hotmart-fb" 
              href="https://pay.hotmart.com/E105852820L?checkoutMode=2"
              onClick={(e) => {
                // The Hotmart widget intercepts this
              }}
            >
              🔓 PROTEGER MEU PATRIMÔNIO AGORA
            </a>

            <p className="cta-sub">Pix · Cartão de Crédito (até 12x) · Boleto — Pagamento 100% seguro via Hotmart</p>
            <div className="guar">
              <div className="guar-ico">🔒</div>
              <div>
                <h4>Garantia Incondicional de 7 Dias</h4>
                <p>Se por qualquer motivo você não ficar 100% satisfeito, devolvemos cada centavo. Sem perguntas. Sem burocracia. Risco zero.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-block">
          <h2 className="faq-h">Dúvidas frequentes</h2>
          <div className="faq-item"><p className="faq-q">Precisa de conhecimento técnico para ler?</p><p className="faq-a">Não. Escrito para leigos e técnicos. Linguagem direta, exemplos reais, visuais em cada capítulo.</p></div>
          <div className="faq-item"><p className="faq-q">Vale para quem vai comprar imóvel pronto também?</p><p className="faq-a">Sim. O capítulo sobre vícios ocultos e o dilema comprar vs. construir foram feitos exatamente para esse perfil.</p></div>
          <div className="faq-item"><p className="faq-q">Como recebo após a compra?</p><p className="faq-a">Imediatamente. Confirmado o pagamento, você recebe o link de download no e-mail cadastrado.</p></div>
          <div className="faq-item"><p className="faq-q">Vale para galpão e imóvel comercial?</p><p className="faq-a">Sim. O capítulo 13 trata especificamente de galpões industriais, com foco em BIM, estrutura e ROI.</p></div>
          <div className="faq-item"><p className="faq-q">E se eu não gostar?</p><p className="faq-a">Garantia de 7 dias. Peça reembolso sem nenhuma justificativa e receba 100% de volta. Risco zero.</p></div>
        </div>

        <div className="foot">
          © {new Date().getFullYear()} J. Edgard Engenharia &amp; Gestão — Todos os direitos reservados<br />
          Dr. José Edgard de Oliveira — CREA 5071162007<br />
          Nenhuma parte desta publicação pode ser reproduzida sem autorização prévia por escrito do autor.
        </div>

      </div>
    </div>
  );
}

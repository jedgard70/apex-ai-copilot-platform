import { useMemo } from 'react'

const RESERVED_PARAMS = new Set([
  'headline',
  'subheadline',
  'urgency',
  'video',
  'cta',
  'ctalabel',
  'proof',
  'terms',
  'privacy',
  'brand',
  'support',
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

function buildCtaUrl(baseUrl: string, searchParams: URLSearchParams) {
  if (!baseUrl) return '#'
  try {
    const url = new URL(baseUrl, window.location.origin)
    for (const [key, value] of searchParams.entries()) {
      if (RESERVED_PARAMS.has(key.toLowerCase())) continue
      if (!url.searchParams.has(key)) url.searchParams.set(key, value)
    }
    return url.toString()
  } catch {
    return baseUrl
  }
}

export function PublicVslLandingPage() {
  const config = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const brand = params.get('brand') || 'Apex AI Copilot'
    const headline = params.get('headline') || 'Transforme sua apresentação técnica em uma página VSL pronta para conversão.'
    const subheadline = params.get('subheadline') || 'Vídeo acima da dobra, CTA claro, prova, termos e rastreamento preservado para campanhas reais.'
    const urgency = params.get('urgency') || 'APRESENTAÇÃO DISPONÍVEL NESTA JANELA DE CAMPANHA'
    const video = params.get('video') || ''
    const ctaLabel = params.get('ctaLabel') || 'QUERO GARANTIR MINHA VAGA'
    const cta = buildCtaUrl(params.get('cta') || (import.meta.env.VITE_VSL_PRIMARY_CTA_URL || ''), params)
    const proof = params.get('proof') || 'Vídeo-first page com CTA persistente, preservação de UTM e estrutura pronta para Hotmart, Stripe, WhatsApp ou booking.'
    const terms = params.get('terms') || '#'
    const privacy = params.get('privacy') || '#'
    const support = params.get('support') || 'Suporte e contato via Apex'
    return {
      brand,
      headline,
      subheadline,
      urgency,
      video,
      ctaLabel,
      cta,
      proof,
      terms,
      privacy,
      support,
    }
  }, [])

  const embedVideo = config.video ? normalizeYoutubeEmbed(config.video) : ''
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(embedVideo)

  return (
    <main style={{ minHeight: '100vh', background: '#050b18', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: '#7f1d1d', textAlign: 'center', padding: '10px 16px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 12 }}>
        {config.urgency}
      </div>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 16px 48px', display: 'grid', gap: 24 }}>
        <div style={{ textAlign: 'center', display: 'grid', gap: 12 }}>
          <strong style={{ fontSize: 14, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.72)' }}>{config.brand}</strong>
          <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 58px)', lineHeight: 1.05 }}>{config.headline}</h1>
          <p style={{ margin: 0, fontSize: 'clamp(16px, 2vw, 22px)', color: 'rgba(255,255,255,0.78)', maxWidth: 900, justifySelf: 'center' }}>
            {config.subheadline}
          </p>
        </div>

        <div style={{ background: '#0f172a', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' }}>
          <div style={{ aspectRatio: '16 / 9', background: 'radial-gradient(circle at center, rgba(59,130,246,0.18), rgba(2,6,23,1))', display: 'grid', placeItems: 'center' }}>
            {embedVideo ? (
              isDirectVideo ? (
                <video controls playsInline autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={embedVideo} />
              ) : (
                <iframe
                  src={embedVideo}
                  title="Apex VSL video"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )
            ) : (
              <div style={{ textAlign: 'center', padding: 24, maxWidth: 520 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>▶</div>
                <strong style={{ display: 'block', fontSize: 24, marginBottom: 8 }}>Seu vídeo começa aqui</strong>
                <span style={{ color: 'rgba(255,255,255,0.72)' }}>Use o parâmetro `video=` para publicar a VSL final com autoplay compatível e CTA abaixo do player.</span>
              </div>
            )}
          </div>
          <div style={{ padding: 18, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ color: 'rgba(255,255,255,0.72)' }}>
                <strong style={{ display: 'block', color: '#fff', marginBottom: 4 }}>Seu vídeo já começou</strong>
                Clique para ouvir e siga para o CTA principal.
              </div>
              <a
                href={config.cta}
                style={{ background: '#22c55e', color: '#04130a', textDecoration: 'none', padding: '14px 22px', borderRadius: 999, fontWeight: 800, letterSpacing: '0.03em' }}
              >
                {config.ctaLabel}
              </a>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, color: 'rgba(255,255,255,0.82)' }}>
              {config.proof}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32 }}>
          <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: 'center' }}>Ecossistema de Serviços Apex AI</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Serviço: Contabilidade */}
            <div style={{ border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(15,23,42,0.6)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 22, color: '#60a5fa' }}>Contabilidade Integrada</h3>
                <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.5 }}>
                  Automação fiscal REDESIM, emissão e captura de NFs, legalização de CNPJ e integração contínua na plataforma web + extensão.
                </p>
              </div>
              <a href="/checkout?service=accounts" style={{ marginTop: 'auto', background: '#3b82f6', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>
                Assinar Contabilidade
              </a>
            </div>

            {/* Serviço: Marketing */}
            <div style={{ border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 22 }}>Marketing & SEO</h3>
                <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.5 }}>
                  Agentes geradores de campanhas completas, VSL dinâmico e copy adaptada ao seu funil de vendas.
                </p>
              </div>
              <a href="/premium" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>
                Em breve
              </a>
            </div>

            {/* Serviço: Engenharia */}
            <div style={{ border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 22 }}>Engenharia Civil</h3>
                <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.5 }}>
                  Integração Revit, gestão de canteiro de obras, relatórios fotográficos de medição e automação de orçamentos.
                </p>
              </div>
              <a href="/premium" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', padding: '12px', borderRadius: 8, textAlign: 'center', fontWeight: 600 }}>
                Em breve
              </a>
            </div>
          </div>
        </div>
      </section>
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 16px 32px', color: 'rgba(255,255,255,0.65)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span>{config.brand} © Todos os direitos reservados</span>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a href={config.terms} style={{ color: 'inherit' }}>Termos de uso</a>
            <a href={config.privacy} style={{ color: 'inherit' }}>Política de privacidade</a>
            <span>{config.support}</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

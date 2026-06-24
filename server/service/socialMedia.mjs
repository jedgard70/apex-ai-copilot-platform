/**
 * server/service/socialMedia.mjs
 *
 * Marketing & Social Media Pipeline
 * Gera plano, imagens, carrosseis, reels, posts e ads.
 * Usa FAL.ai para gerar imagens e videos.
 */

import { randomUUID } from 'node:crypto'

const CAMPAIGNS = new Map()

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** @typedef {'instagram-feed'|'instagram-reels'|'facebook-feed'|'linkedin'|'google-ads'|'carousel'} Platform */

// ─── Criar campanha ───────────────────────────────────────────────────────────

export function createCampaign(data) {
  const id = randomUUID()
  const campaign = {
    id,
    product: String(data.product || '').trim(),
    theme: String(data.theme || '').trim(),
    description: String(data.description || '').trim(),
    targetAudience: String(data.targetAudience || '').trim(),
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plan: null,
    content: { images: [], videos: [], carousels: [], posts: [], ads: [] },
    generated: false,
  }
  CAMPAIGNS.set(id, campaign)
  return campaign
}

export function getCampaign(id) { return CAMPAIGNS.get(id) || null }
export function listCampaigns() {
  return Array.from(CAMPAIGNS.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
export function deleteCampaign(id) { return CAMPAIGNS.delete(id) }

// ─── Gerar Plano de Marketing ─────────────────────────────────────────────────

export function generateMarketingPlan(product, theme, description, targetAudience) {
  const p = product || 'Produto'
  const t = theme || 'geral'
  const d = description || ''
  const ta = targetAudience || 'publico geral'

  const plan = {
    product: p,
    theme: t,
    summary: `Campanha de marketing digital para ${p} com tema "${t}". Foco em gerar leads e vendas atraves de conteudo organico e ads.`,
    targetAudience: ta,
    platforms: [
      { name: 'Instagram Feed', type: 'organic', frequency: '3x/semana', content: ['Carrosseis educativos', 'Antes/depois', 'Depoimentos'] },
      { name: 'Instagram Reels', type: 'organic', frequency: '5x/semana', content: ['Dicas rapidas', 'Tutoriais', 'Bastidores'] },
      { name: 'Facebook', type: 'organic', frequency: '3x/semana', content: ['Posts compartilhados do IG', 'Artigos', 'Eventos'] },
      { name: 'LinkedIn', type: 'organic', frequency: '2x/semana', content: ['Artigos profissionais', 'Cases', 'Networking'] },
      { name: 'Google Ads', type: 'paid', budget: 'Sob aprovacao', content: ['Search Ads', 'Display Ads', 'Remarketing'] },
    ],
    funnel: {
      top: `Conteudo educativo sobre ${p}`,
      middle: `Demonstracoes e cases de ${p}`,
      bottom: `Ofertas e CTAs para ${p}`,
    },
    timeline: [
      { week: 1, action: 'Lancamento - teaser e aquecimento' },
      { week: 2, action: 'Conteudo educativo e engajamento' },
      { week: 3, action: 'Provas sociais e cases' },
      { week: 4, action: 'Ofertas e conversao' },
    ],
    hashtags: ['#' + p.replace(/\s+/g, ''), '#apexglobal', '#construcaocivil', '#engenharia', '#bim', '#arquitetura'],
    generatedAt: new Date().toISOString(),
  }
  return plan
}

// ─── Gerar Conteudo (imagens via FAL) ─────────────────────────────────────────

export async function generateCampaignContent(campaignId, falApiKey) {
  const campaign = CAMPAIGNS.get(campaignId)
  if (!campaign) return null
  if (!falApiKey) return { error: 'FAL_KEY nao configurada' }

  const product = campaign.product
  const results = { images: [], videos: [], carousels: [], posts: [], ads: [] }

  // ── Gerar imagens para carrossel (3-5 imagens) ──
  const carouselThemes = [
    `Professional marketing image for "${product}" - clean product shot, premium look, white background, photorealistic, 4k`,
    `Lifestyle shot showing "${product}" in use by happy customers, modern environment, warm lighting, professional photography`,
    `Split image showing before/after or problem/solution related to "${product}", infographic style, clean design, modern`,
    `Detail shot of "${product}" highlighting features, macro photography, depth of field, premium quality`,
    `Call to action image for "${product}" with "Saiba Mais" text overlay area, gradient background, modern, professional`,
  ]

  for (let i = 0; i < Math.min(carouselThemes.length, 5); i++) {
    try {
      const prompt = carouselThemes[i]
      const res = await fetch('https://fal.run/fal-ai/flux/dev', {
        method: 'POST',
        headers: { Authorization: `Key ${falApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, image_size: 'square_hd', num_images: 1 }),
        signal: AbortSignal.timeout(60000),
      })
      if (res.ok) {
        const data = await res.json()
        const imgUrl = data.images?.[0]?.url || data.image?.url
        if (imgUrl) {
          results.images.push({ url: imgUrl, prompt, slide: i + 1, type: 'carousel' })
        }
      }
    } catch (err) {
      console.error(`[socialMedia] Erro gerando imagem ${i + 1}:`, err.message)
    }
  }

  // ── Se tiver imagens, montar carrossel ──
  if (results.images.length >= 2) {
    results.carousels.push({
      id: randomUUID(),
      platform: 'instagram-feed',
      title: `Carrossel: ${product}`,
      slides: results.images.map(img => ({
        imageUrl: img.url,
        caption: `Slide ${img.slide} - ${product}`,
        notes: img.slide === 1 ? `Capa: ${product}` : img.slide === results.images.length ? `CTA final com link na bio` : `Conteudo ${img.slide}`,
      })),
      caption: [
        `🔥 ${product} - Descubra como transformar seus projetos!`,
        '',
        '💡 O que voce encontrara:',
        ...results.images.map((_, i) => `  • Dica ${i + 1}`),
        '',
        '📲 Link na bio para mais informacoes',
        '',
        `${campaign.plan?.hashtags?.join(' ') || '#apexglobal'}`,
      ].join('\n'),
    })
  }

  // ── Gerar posts para LinkedIn ──
  results.posts.push({
    platform: 'linkedin',
    title: `${product} - Inovacao para sua empresa`,
    body: [
      `**${product}** - A solucao que sua empresa precisa.`,
      '',
      `Estamos revolucionando o mercado com ${product}. Nossa abordagem combina tecnologia de ponta com expertise de mercado para entregar resultados excepcionais.`,
      '',
      '✅ Por que escolher?',
      '• Resultados comprovados',
      '• Equipe especializada',
      '• Suporte dedicado',
      '',
      '👉 Saiba mais: [link]',
      '',
      `#inovacao #${product.replace(/\s+/g, '').toLowerCase()} #apexglobal #construcaocivil`,
    ].join('\n'),
    imageUrl: results.images[0]?.url || '',
    scheduled: false,
  })

  // ── Gerar Google Ads ──
  results.ads.push({
    platform: 'google-ads',
    campaignName: `Campanha - ${product}`,
    headlines: [
      `${product} - Solucao Completa`,
      `Transforme seus projetos com ${product}`,
      `${product} - Qualidade e Inovacao`,
      `Conheca ${product} agora`,
      `Resultados comprovados com ${product}`,
    ],
    descriptions: [
      `Descubra como ${product} pode transformar seus projetos. Equipe especializada e suporte dedicado. Saiba mais!`,
      `Solucao completa em ${product}. Atendimento personalizado e resultados que superam expectativas. Entre em contato!`,
    ],
    keywords: [product, product.toLowerCase().replace(/\s+/g, ''), 'construcao civil', 'engenharia', 'arquitetura', 'bim', 'apex global'],
    budget: 'A definir - aguardando aprovacao',
    status: 'draft',
    destinationUrl: 'https://www.apexglobalai.com',
  })

  campaign.content = results
  campaign.generated = true
  campaign.updatedAt = new Date().toISOString()
  CAMPAIGNS.set(campaignId, campaign)

  return results
}

// ─── Prompt de video para Reels ──────────────────────────────────────────────

export function generateReelScript(product) {
  return {
    platform: 'instagram-reels',
    duration: '15-30s',
    script: [
      `[HOOK - 3s] Voce sabia que ${product} pode revolucionar seus projetos?`,
      `[PROBLEMA - 5s] Chega de perder tempo com processos ineficientes.`,
      `[SOLUCAO - 10s] Com ${product}, voce tem: agilidade, qualidade e suporte especializado.`,
      `[PROVA - 5s] Nossos clientes ja estao colhendo os resultados.`,
      `[CTA - 3s] Link na bio! Acesse agora.`,
    ].join('\n'),
    visualDirections: [
      'Abertura com texto grande na tela',
      'Cenas de escritorio/obra mostrando o produto',
      'Cliente satisfeito depondo',
      'Logo e CTA final',
    ],
    hashtags: ['#' + product.replace(/\s+/g, ''), '#apexglobal', '#dica', '#construcaocivil'],
    audioSuggestion: 'Musica animada e otimista, voz over masculina',
  }
}

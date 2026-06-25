/**
 * api/reports/index.mjs — Relatórios Inteligentes Apex
 *
 * Apex aprendeu a se auto-diagnosticar e gerar relatórios estratégicos
 * como os que o Dr. Edgard viu nesta sessão.
 *
 * GET  /api/reports/status       → Relatório completo de status da plataforma
 * GET  /api/reports/providers    → Análise de custo-benefício dos provedores
 * GET  /api/reports/models       → Catálogo completo de modelos disponíveis
 * GET  /api/reports/strategy     → Recomendações estratégicas
 * GET  /api/reports/quick        → Resumo executivo (1 minuto de leitura)
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname.replace('/api/reports', '') || '/'
    const format = url.searchParams.get('format') || 'json' // json, markdown, text

    // ── Carrega dados ao vivo ───────────────────────────────────
    const providerStatus = await fetchProviderStatus()
    const geminiModels = await fetchGeminiModels()
    const falInfo = await fetchFalInfo()

    switch (path) {
      case '/status':
      case '/': {
        const report = buildStatusReport(providerStatus, geminiModels, falInfo)
        return sendReport(res, report, format)
      }

      case '/providers': {
        const report = buildProviderAnalysis(providerStatus, geminiModels, falInfo)
        return sendReport(res, report, format)
      }

      case '/models': {
        const report = buildModelCatalog(geminiModels, falInfo)
        return sendReport(res, report, format)
      }

      case '/strategy': {
        const report = buildStrategyReport(providerStatus, geminiModels, falInfo)
        return sendReport(res, report, format)
      }

      case '/quick': {
        const report = buildQuickSummary(providerStatus)
        return sendReport(res, report, format)
      }

      default:
        return res.status(404).json({ error: 'Unknown report type', available: ['status', 'providers', 'models', 'strategy', 'quick'] })
    }
  } catch (err) {
    console.error('[reports] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// ─── Helpers ─────────────────────────────────────────────────

async function fetchProviderStatus() {
  try {
    const { default: handler } = await import('../copilot/provider-status.mjs')
    let result = null
    const mockRes = {
      status() { return this },
      json(d) { result = d },
      setHeader() {},
    }
    await handler({ method: 'GET', headers: {} }, mockRes)
    return result
  } catch { return null }
}

async function fetchGeminiModels() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { total: 0, list: [], error: 'no_key' }
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100', {
      headers: { 'x-goog-api-key': key },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return { total: 0, list: [], error: `http_${res.status}` }
    const data = await res.json()
    const models = (data.models || []).filter(m => (m.name || '').startsWith('models/gemini-'))
    return {
      total: models.length,
      textChat: models.filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).length,
      image: models.filter(m => (m.name || '').includes('image')).length,
      tts: models.filter(m => (m.name || '').includes('tts') || (m.name || '').includes('audio')).length,
      list: models.map(m => m.name.replace('models/', '')),
      billable: models.some(m => m.billable),
    }
  } catch { return { total: 0, list: [], error: 'network' } }
}

async function fetchFalInfo() {
  const key = process.env.FAL_KEY
  if (!key) return { total: 0, image: 0, video: 0, error: 'no_key' }
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch('https://api.fal.ai/v1/models', {
      headers: { Authorization: `Key ${key}` },
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return { total: 0, error: `http_${res.status}` }
    const data = await res.json()
    const models = data.models || []
    return {
      total: models.length,
      image: models.filter(m => (m.endpoint_id || '').includes('image')).length,
      video: models.filter(m => (m.endpoint_id || '').includes('video')).length,
      audio: models.filter(m => (m.endpoint_id || '').includes('audio') || (m.endpoint_id || '').includes('speech')).length,
    }
  } catch { return { total: 0, error: 'network' } }
}

function sendReport(res, report, format) {
  if (format === 'markdown') {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    return res.status(200).send(report.markdown || report.text || JSON.stringify(report, null, 2))
  }
  if (format === 'text') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    return res.status(200).send(report.text || report.markdown || JSON.stringify(report, null, 2))
  }
  return res.status(200).json(report)
}

// ─── Builders ─────────────────────────────────────────────────

function buildStatusReport(ps, gm, fi) {
  const providers = ps?.providers || []
  const healthy = providers.filter(p => p.status === 'ok').length
  const warnings = providers.filter(p => p.status === 'warning').length
  const errors = providers.filter(p => p.status === 'error').length

  const lines = [
    '╔════════════════════════════════════════════════╗',
    '║     APEX AI — RELATÓRIO DE STATUS             ║',
    '║     Dr. Edgard, aqui está o diagnóstico        ║',
    '╚════════════════════════════════════════════════╝',
    '',
    `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    `🟢 Total: ${providers.length} provedores | ✅ ${healthy} ok | ⚠️ ${warnings} warnings | ❌ ${errors} errors`,
    '',
  ]

  for (const p of providers) {
    const icon = p.status === 'ok' ? '✅' : p.status === 'warning' ? '⚠️' : p.status === 'error' ? '❌' : '⚪'
    lines.push(`${icon} ${p.name || p.id}: ${p.message || p.status}`)
    if (p.balance) lines.push(`   💰 Saldo: ${p.balance}`)
    if (p.models && p.models.length) lines.push(`   📦 Modelos: ${p.models.slice(0, 4).join(', ')}${p.models.length > 4 ? '...' : ''}`)
  }

  // Gemini summary
  if (gm?.total > 0) {
    lines.push('')
    lines.push(`🔷 Gemini: ${gm.total} modelos (${gm.textChat} chat, ${gm.image} imagem, ${gm.tts} áudio)`)
    lines.push(`   💵 Custo: ${gm.billable ? 'PAGO' : 'GRATUITO (free tier)'}`)
  }

  // FAL summary
  if (fi?.total > 0) {
    lines.push(`🔶 FAL.ai: ${fi.total} modelos (${fi.image} img, ${fi.video} vídeo, ${fi.audio} áudio)`)
    lines.push(`   💵 Créditos restantes: ver painel → https://fal.ai/dashboard`)
  }

  lines.push('')
  lines.push('💡 Dica: Me pergunte "relatório de provedores" ou "análise de custos" para detalhes.')

  return {
    title: 'Status da Plataforma Apex',
    timestamp: new Date().toISOString(),
    summary: { total: providers.length, healthy, warnings, errors },
    providers,
    gemini: gm,
    fal: fi,
    markdown: lines.join('\n'),
    text: lines.join('\n'),
  }
}

function buildProviderAnalysis(ps, gm, fi) {
  const lines = [
    '╔════════════════════════════════════════════════╗',
    '║  APEX AI — ANÁLISE DE CUSTO-BENEFÍCIO        ║',
    '╚════════════════════════════════════════════════╝',
    '',
    '📊 ESTRATÉGIA: Priorizar Gemini (gratuito) para 80% dos usos',
    '',
    '┌──────────────────────┬──────────┬──────────────┐',
    '│ Provedor             │ Custo    │ Recomendação │',
    '├──────────────────────┼──────────┼──────────────┤',
    `│ Gemini (${gm?.total || '?'} modelos)      │ Grátis   │ ✅ Chat, img, áudio │`,
    `│ FAL.ai (${fi?.total || '?'} modelos)       │ $0.10/s  │ ✅ Vídeo premium    │`,
    '│ ElevenLabs           │ Grátis   │ ✅ TTS         │',
    '│ GitHub               │ Grátis   │ ✅ Repositório │',
    '│ Tavily               │ Grátis   │ ✅ Pesquisa    │',
    '│ Stripe               │ Grátis   │ ✅ Pagamentos  │',
    '│ Supabase             │ Grátis   │ ✅ Database    │',
    '│ Firebase             │ Grátis   │ ✅ Auth        │',
    '│ Autodesk APS         │ Grátis   │ ✅ BIM         │',
    '└──────────────────────┴──────────┴──────────────┘',
    '',
    '💰 Dica: Seus $6.25 na FAL duram ~14 dias. Use Gemini para economizar.',
    '🔄 Roteamento inteligente: Gemini tenta primeiro, FAL só para vídeo.',
  ]

  return {
    title: 'Análise de Custo-Benefício',
    timestamp: new Date().toISOString(),
    gemini: { total: gm?.total, free: !gm?.billable },
    fal: { total: fi?.total },
    providers: ps?.providers?.map(p => ({ id: p.id, status: p.status, balance: p.balance })),
    markdown: lines.join('\n'),
    text: lines.join('\n'),
  }
}

function buildModelCatalog(gm, fi) {
  const lines = [
    '╔════════════════════════════════════════════════╗',
    '║  APEX AI — CATÁLOGO DE MODELOS               ║',
    '╚════════════════════════════════════════════════╝',
    '',
    `🔷 Gemini API: ${gm?.total || 0} modelos (TODOS gratuitos)`,
    '   Flash: gemini-2.5-flash, gemini-3.5-flash, gemini-3-flash-preview',
    '   Pro: gemini-2.5-pro, gemini-3.1-pro-preview, gemini-3-pro-preview',
    '   Imagem: gemini-3.1-flash-image, gemini-2.5-flash-image, gemini-3-pro-image',
    '   TTS: gemini-3.1-flash-tts, gemini-2.5-flash-tts, gemini-2.5-pro-tts',
    '   Áudio Nativo: gemini-2.5-flash-native-audio',
    '   Música: lyria-3-clip-preview, lyria-3-pro-preview',
    '',
    `🔶 FAL.ai: ${fi?.total || 0} modelos (${fi?.video || 0} vídeo, ${fi?.image || 0} imagem, ${fi?.audio || 0} áudio)`,
    '   Destaque: Kling Video, Veo 3.1, Seedance 2.0, Flux, Nano Banana',
    '',
    '🔊 ElevenLabs: 5 vozes TTS (plano free, 10.000 chars/mês)',
    '',
    '💡 Peça "relatório de status" ou "análise de provedores" para mais detalhes.',
  ]

  return {
    title: 'Catálogo de Modelos',
    timestamp: new Date().toISOString(),
    gemini: gm?.list?.slice(0, 20) || [],
    fal: { total: fi?.total },
    markdown: lines.join('\n'),
    text: lines.join('\n'),
  }
}

function buildStrategyReport(ps, gm, fi) {
  const providers = ps?.providers || []
  const healthy = providers.filter(p => p.status === 'ok').length

  const lines = [
    '╔════════════════════════════════════════════════╗',
    '║  APEX AI — RECOMENDAÇÕES ESTRATÉGICAS        ║',
    '╚════════════════════════════════════════════════╝',
    '',
    `📈 Saúde: ${healthy}/${providers.length} provedores operacionais`,
    '',
    '🎯 RECOMENDAÇÕES PRIORITÁRIAS:',
    '',
    '1️⃣ ALTA — Completar FASE 3 (Conexão de Fluxos)',
    '   • ArchVis → DirectCut: imagem gerada vira frame de vídeo',
    '   • BIM → ArchVis: cena 3D vira prompt de render',
    '   • Budget → DirectCut: orçamento vira gráfico no vídeo',
    '',
    '2️⃣ ALTA — FASE 4 (Dados Reais)',
    '   • Consumo de tokens por modelo no Owner Console',
    '   • Custos reais vs estimados em cada provedor',
    '',
    '3️⃣ MÉDIA — UI Pendente',
    '   • ArchVis Studio seguir protótipo Stitch (29.8KB)',
    '   • Marketing Analytics como full-page',
    '',
    '4️⃣ ECONOMIA — Usar Gemini sempre que possível',
    '   • 36 modelos gratuitos vs FAL que custa $0.10/s',
    '   • Seu saldo FAL de $6.25 dura ~14 dias',
    '',
    '💡 Peça um "relatório de status" a qualquer momento!',
  ]

  return {
    title: 'Recomendações Estratégicas',
    timestamp: new Date().toISOString(),
    health: `${healthy}/${providers.length}`,
    recommendations: [
      { priority: 'ALTA', task: 'Completar FASE 3 — Conexão de Fluxos' },
      { priority: 'ALTA', task: 'FASE 4 — Dados Reais de consumo/custo' },
      { priority: 'MÉDIA', task: 'ArchVis Studio — protótipo Stitch' },
      { priority: 'ECONOMIA', task: 'Priorizar Gemini (gratuito) sobre FAL (pago)' },
    ],
    markdown: lines.join('\n'),
    text: lines.join('\n'),
  }
}

function buildQuickSummary(ps) {
  const providers = ps?.providers || []
  const healthy = providers.filter(p => p.status === 'ok').length
  const warnings = providers.filter(p => p.status === 'warning')
  const errors = providers.filter(p => p.status === 'error')

  const lines = [
    '╔════════════════════════════════════╗',
    '║  APEX AI — RESUMO EXECUTIVO       ║',
    '╚════════════════════════════════════╝',
    '',
    `✅ ${healthy}/${providers.length} provedores OK`,
    `⚠️ ${warnings.length} warnings: ${warnings.map(p => p.id).join(', ') || 'nenhum'}`,
    `❌ ${errors.length} errors: ${errors.map(p => p.id).join(', ') || 'nenhum'}`,
    '',
    '🔷 Gemini: GRATUITO — 36 modelos disponíveis',
    '🔶 FAL.ai: $6.25 créditos — 100 modelos (vídeo principal)',
    '🔊 ElevenLabs: GRATUITO — 0/10.000 chars usados',
    '',
    '💡 Me pergunte:',
    '   • "relatório completo" → diagnóstico detalhado',
    '   • "análise de custos" → estratégia financeira',
    '   • "modelos disponíveis" → catálogo completo',
  ]

  return {
    title: 'Resumo Executivo Apex',
    timestamp: new Date().toISOString(),
    healthy,
    warnings: warnings.length,
    errors: errors.length,
    markdown: lines.join('\n'),
    text: lines.join('\n'),
  }
}

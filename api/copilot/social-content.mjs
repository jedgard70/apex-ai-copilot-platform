// Social Content Pipeline — platform-specific captions, hashtags, posting schedule, Reels timing
// Used by CampaignAutomationPanel to generate ready-to-publish social content

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function scrubError(value) {
  return String(value || 'Request failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/Key_[A-Za-z0-9_-]+/g, '[redacted]')
    .slice(0, 800)
}

async function callOpenAI(apiKey, apiBase, model, messages) {
  const resp = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2400,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(scrubError(data?.error?.message || `OpenAI HTTP ${resp.status}`))
  return data?.choices?.[0]?.message?.content || ''
}

async function callGemini(apiKey, model, prompt) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2400, responseMimeType: 'application/json' },
      }),
    }
  )
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(scrubError(data?.error?.message || `Gemini HTTP ${resp.status}`))
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

function parseResponse(text) {
  const clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(clean) } catch { return null }
}

function buildFallbackContent(offer, audience, channels) {
  const offerShort = String(offer || '').slice(0, 80) || 'our architecture service'
  const hasInstagram = channels.includes('instagram') || channels.includes('instagram-facebook')
  const hasFacebook = channels.includes('facebook') || channels.includes('instagram-facebook')
  const hasWhatsapp = channels.includes('whatsapp')

  const platforms = []

  if (hasInstagram) {
    platforms.push({
      platform: 'instagram',
      postCaption: `${offerShort} — do conceito ao resultado final com clareza e precisão. ✦\n\nSaiba mais no link da bio.`,
      reelsCaption: `${offerShort} em menos de 30 segundos. ▶️\n\nSalve e compartilhe com quem precisa.`,
      storiesText: `Swipe → para ver como funciona.`,
      bestPostingTimes: ['Terça 11h', 'Quarta 12h', 'Quinta 19h', 'Sexta 18h'],
      reelsTiming: {
        hook: '0–3s: imagem impactante ou pergunta direta',
        mainContent: '3–20s: mostrar processo ou resultado',
        cta: '20–28s: CTA direto + link na bio',
        totalDuration: '28–30s',
      },
    })
  }

  if (hasFacebook) {
    platforms.push({
      platform: 'facebook',
      postCaption: `${offerShort} — apresentamos um serviço completo pensado para facilitar cada etapa do seu projeto.\n\nEntre em contato para saber mais.`,
      reelsCaption: `Veja como ${offerShort} pode transformar seu projeto. ▶️`,
      storiesText: 'Toque para ver mais detalhes.',
      bestPostingTimes: ['Quarta 13h', 'Quinta 14h', 'Domingo 20h'],
      reelsTiming: {
        hook: '0–3s: destaque o benefício principal',
        mainContent: '3–22s: detalhe visual do serviço',
        cta: '22–30s: botão de contato ou link',
        totalDuration: '30s',
      },
    })
  }

  if (hasWhatsapp) {
    platforms.push({
      platform: 'whatsapp',
      postCaption: `Olá! Apresentamos ${offerShort}. Podemos conversar sobre como isso se aplica ao seu projeto? Responda aqui ou ligue diretamente.`,
      reelsCaption: `Confira o vídeo sobre ${offerShort} e me diga o que achou.`,
      storiesText: 'Status: novo serviço disponível!',
      bestPostingTimes: ['Terça 9h', 'Quinta 10h', 'Sábado 10h'],
      reelsTiming: {
        hook: '0–3s: nome do serviço e proposta de valor',
        mainContent: '3–18s: 2–3 benefícios claros',
        cta: '18–25s: "Responda com SIM para mais informações"',
        totalDuration: '25s',
      },
    })
  }

  const hashtagSets = {
    broad: ['#arquitetura', '#construção', '#design', '#engenharia', '#obra'],
    niche: ['#projetoarquitetonico', '#construçãocivil', '#designdeinteriores', '#renderização', '#bim'],
    brand: ['#apex', '#apexai', '#apexglobal', '#gestãodeprojetos', '#inovacaoconstrutiva'],
  }

  const contentCalendar = []
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  const types = ['Educativo', 'Bastidores', 'Prova social', 'Oferta direta', 'Entretenimento/Reel', 'Curadoria', 'Descanso']
  for (let i = 0; i < 7; i++) {
    contentCalendar.push({
      day: days[i],
      type: types[i],
      format: i === 4 ? 'Reel 30s' : i === 6 ? '—' : 'Post + Stories',
      suggestion: i === 6 ? 'Sem postagem ou repost simples' : `${types[i]}: relacionar com ${offerShort}`,
    })
  }

  return {
    providerStatus: 'LOCAL_SOCIAL_CONTENT',
    generatedAt: new Date().toISOString(),
    platforms,
    hashtagSets,
    contentCalendar,
    exportHints: [
      'Copie cada legenda para a plataforma de agendamento (Buffer, Later, Hootsuite).',
      'Use o calendário de 7 dias como base mensal repetindo o ciclo.',
      'Adapte os horários ao fuso horário do seu público principal.',
      'Teste 2 versões de legenda por semana e meça engajamento.',
    ],
  }
}

function buildSystemPrompt() {
  return `You are a senior social media strategist for architecture, construction, and real estate brands in Brazil and Latin America.

Create social media content packs that are ready to publish — captions in the correct format for each platform, proper hashtags, optimal posting times, and Reels timing guides.

Write all captions in Brazilian Portuguese unless the audience clearly indicates another language. Keep captions natural, direct, and platform-appropriate (Instagram is visual/emotional, Facebook is informative, WhatsApp is personal/direct).

Return ONLY valid JSON. No markdown, no extra text.`
}

function buildUserPrompt(goal, offer, audience, channels) {
  const channelList = Array.isArray(channels) ? channels.join(', ') : String(channels || 'instagram')
  return `Create a complete social content pack for:

PROJECT: ${String(goal || '').slice(0, 400)}
OFFER: ${String(offer || '').slice(0, 300)}
AUDIENCE: ${String(audience || '').slice(0, 200)}
CHANNELS: ${channelList}

Return this exact JSON structure:
{
  "platforms": [
    {
      "platform": "instagram",
      "postCaption": "ready-to-post feed caption with emojis, 150-220 chars, no hashtags here",
      "reelsCaption": "short punchy caption for Reels, 80-120 chars",
      "storiesText": "short stories overlay text, max 60 chars",
      "bestPostingTimes": ["Terça 11h", "Quarta 12h", "Quinta 19h"],
      "reelsTiming": {
        "hook": "0–3s: what to show/say",
        "mainContent": "3–22s: what to show/say",
        "cta": "22–29s: what to say/show",
        "totalDuration": "29s"
      }
    }
  ],
  "hashtagSets": {
    "broad": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
    "niche": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
    "brand": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  },
  "contentCalendar": [
    { "day": "Segunda", "type": "Educativo", "format": "Post + Stories", "suggestion": "specific content idea" },
    { "day": "Terça", "type": "Bastidores", "format": "Reel 30s", "suggestion": "specific content idea" },
    { "day": "Quarta", "type": "Prova social", "format": "Carrossel", "suggestion": "specific content idea" },
    { "day": "Quinta", "type": "Oferta direta", "format": "Post + Stories", "suggestion": "specific content idea" },
    { "day": "Sexta", "type": "Entretenimento", "format": "Reel 30s", "suggestion": "specific content idea" },
    { "day": "Sábado", "type": "Curadoria", "format": "Post", "suggestion": "specific content idea" },
    { "day": "Domingo", "type": "Descanso", "format": "—", "suggestion": "Sem postagem ou repost simples" }
  ],
  "exportHints": ["tip 1", "tip 2", "tip 3", "tip 4"]
}

Include a platform entry for each channel in CHANNELS. If "instagram-facebook" include both.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const goal = String(body.goal || '')
  const offer = String(body.offer || '')
  const audience = String(body.audience || '')
  const channel = String(body.channel || 'instagram-facebook')
  const channels = channel === 'instagram-facebook' ? ['instagram', 'facebook'] : [channel]

  const openaiKey = process.env.OPENAI_API_KEY
  const openaiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
  const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const geminiKey = process.env.GEMINI_API_KEY

  const fallback = buildFallbackContent(offer || goal, audience, channels)

  let rawText = ''
  try {
    if (openaiKey) {
      rawText = await callOpenAI(openaiKey, openaiBase, openaiModel, [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(goal, offer, audience, channel) },
      ])
    } else if (geminiKey) {
      rawText = await callGemini(geminiKey, 'gemini-3.5-flash', `${buildSystemPrompt()}\n\n${buildUserPrompt(goal, offer, audience, channel)}`)
    }
  } catch {
    return sendJson(res, 200, fallback)
  }

  if (!rawText) return sendJson(res, 200, fallback)

  const parsed = parseResponse(rawText)
  if (!parsed) return sendJson(res, 200, fallback)

  return sendJson(res, 200, {
    ...fallback,
    ...parsed,
    providerStatus: openaiKey ? 'openai' : 'gemini',
    generatedAt: new Date().toISOString(),
  })
}

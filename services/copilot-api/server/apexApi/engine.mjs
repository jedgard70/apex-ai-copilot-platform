function estimateTokens(text = '') {
  return Math.max(1, Math.ceil(String(text || '').length / 4))
}

export function countMessageTokens(messages = []) {
  return estimateTokens(messages.map(m => m?.content || m?.text || '').join('\n'))
}

export async function callApexOwnEngine({ messages = [], model = 'apex-ai', timeoutMs = 30000 }) {
  const urls = [
    process.env.APEX_OWN_ENGINE_URL,
    process.env.APEX_API_URL,
    process.env.LOCAL_WORKER_URL,
  ].filter(Boolean)

  for (const rawUrl of urls) {
    const baseUrl = String(rawUrl).replace(/\/$/, '')
    try {
      const headers = { 'Content-Type': 'application/json' }
      const token = process.env.APEX_API_TOKEN || process.env.LOCAL_WORKER_TOKEN || ''
      if (token) headers.Authorization = `Bearer ${token}`
      const response = await fetch(`${baseUrl}/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages }),
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok) continue
      const data = await response.json().catch(() => ({}))
      const text = data.reply || data.finalReply || data.choices?.[0]?.message?.content || ''
      if (text) {
        return {
          ok: true,
          provider: data.provider || 'apex-ai-own-engine',
          model: data.model || model,
          text,
          usage: data.usage || {
            prompt_tokens: countMessageTokens(messages),
            completion_tokens: estimateTokens(text),
            total_tokens: countMessageTokens(messages) + estimateTokens(text),
          },
        }
      }
    } catch {
      // Try next configured engine URL.
    }
  }

  return { ok: false, provider: 'apex-ai-own-engine', model, text: '', usage: null }
}

export async function callGeminiFallback({ messages = [], model = 'gemini-2.5-flash', timeoutMs = 30000 }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || !globalThis.fetch) return { ok: false, provider: 'gemini', model, text: '', usage: null }
  try {
    const prompt = messages
      .map(m => `${m.role || 'user'}: ${m.content || m.text || ''}`)
      .join('\n')
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const data = await response.json().catch(() => ({}))
    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || ''
    if (!response.ok || !text) return { ok: false, provider: 'gemini', model, text: '', usage: data?.usageMetadata || null }
    const usage = data?.usageMetadata || {}
    return {
      ok: true,
      provider: 'gemini-fallback',
      model,
      text,
      usage: {
        prompt_tokens: usage.promptTokenCount || countMessageTokens(messages),
        completion_tokens: usage.candidatesTokenCount || estimateTokens(text),
        total_tokens: usage.totalTokenCount || countMessageTokens(messages) + estimateTokens(text),
      },
    }
  } catch {
    return { ok: false, provider: 'gemini', model, text: '', usage: null }
  }
}

export async function runApexFirstCompletion({ messages = [], model = 'apex-ai', allowGeminiFallback = true }) {
  const apex = await callApexOwnEngine({ messages, model })
  if (apex.ok) return apex
  if (allowGeminiFallback) {
    const gemini = await callGeminiFallback({ messages, model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' })
    if (gemini.ok) return gemini
  }
  const lastUser = [...messages].reverse().find(m => m?.role === 'user')?.content || ''
  const controlledText = [
    'Apex AI 2.0 respondeu em modo controlado porque o motor próprio não retornou conteúdo neste runtime.',
    'Posso registrar a solicitação, preparar análise técnica, validar escopos e operar rotas conectadas conforme os escopos da API.',
    lastUser ? `Pedido recebido: ${String(lastUser).slice(0, 500)}` : '',
  ].filter(Boolean).join('\n')
  return {
    ok: true,
    provider: 'apex-controlled-fallback',
    model,
    text: controlledText,
    usage: {
      prompt_tokens: countMessageTokens(messages),
      completion_tokens: estimateTokens(controlledText),
      total_tokens: countMessageTokens(messages) + estimateTokens(controlledText),
    },
  }
}

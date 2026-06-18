function sendJson(res, status, body) {
  res.status(status).json(body)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  try {
    const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
    
    if (apiBase.includes('openrouter.ai')) {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        const formatted = (data.data || []).map(m => ({
          id: m.id,
          name: m.name || m.id
        }))
        return sendJson(res, 200, {
          ok: true,
          provider: 'openrouter',
          models: formatted
        })
      }
    }

    if (apiBase.includes('generativelanguage.googleapis.com')) {
      return sendJson(res, 200, {
        ok: true,
        provider: 'gemini',
        models: [
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
          { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro' },
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
        ]
      })
    }

    // Default OpenAI models fallback
    return sendJson(res, 200, {
      ok: true,
      provider: 'openai',
      models: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'o1-mini', name: 'o1-mini' },
        { id: 'o1-preview', name: 'o1-preview' }
      ]
    })
  } catch (error) {
    console.error('Fetch models failed:', error?.message || error)
    return sendJson(res, 200, {
      ok: false,
      error: 'failed_to_fetch_models',
      models: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4o', name: 'GPT-4o' }
      ]
    })
  }
}

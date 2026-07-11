// Adicionar ao final do arquivo chat.mjs (antes do export default)
// OU dentro da função callGeminiNative como caso especial

function isGemmaApexModel(model) {
  return model === 'gemma-4-31b-it-apex'
}

async function callGemmaApexVertex(messages, overrideConfig) {
  const startTime = Date.now()
  const projectId = process.env.VERTEX_AI_PROJECT_ID || 'apex-ai-copilot-platform'
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1'
  const endpointId = process.env.VERTEX_GEMMA_ENDPOINT_ID
  
  if (!endpointId) {
    return {
      provider: 'gemma-apex-no-endpoint',
      response: { ok: false, status: 0 },
      data: {},
      usedFallback: true,
    }
  }
  
  const { systemText, steps } = convertToInteractionInput(messages)
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`
  
  try {
    const body = {
      instances: [{
        content: steps.map(s => s.content?.[0]?.text || '').join('\n'),
      }],
      parameters: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
      },
    }
    
    if (systemText) {
      body.instances[0].systemInstruction = systemText
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON).access_token || '' : ''}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
    
    const data = await response.json().catch(() => ({}))
    const duration = Date.now() - startTime
    const success = response.ok && !data.error
    
    const text = data?.predictions?.[0]?.content || data?.predictions?.[0]?.text || data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
    
    recordCallSafe({
      provider: 'vertex-gemma-apex',
      model: 'gemma-4-31b-it-apex',
      latencyMs: duration,
      success,
      errorMsg: success ? null : (data?.error?.message || `HTTP ${response.status}`),
    })
    
    return {
      provider: 'vertex-gemma-apex',
      response: { ok: success, status: response.status },
      data: {
        choices: [{ message: { content: text }, index: 0, finish_reason: 'STOP' }],
        model: 'gemma-4-31b-it-apex',
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      },
      usedFallback: false,
    }
  } catch (err) {
    recordCallSafe({
      provider: 'vertex-gemma-apex',
      model: 'gemma-4-31b-it-apex',
      latencyMs: Date.now() - startTime,
      success: false,
      errorMsg: err.message,
    })
    return { provider: 'vertex-gemma-apex', response: { ok: false, status: 0 }, data: {}, usedFallback: true }
  }
}

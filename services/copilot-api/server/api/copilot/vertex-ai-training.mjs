/**
 * api/copilot/vertex-ai-training.mjs
 *
 * Vertex AI + Gemini Live endpoint para treinamento com modelo Gemma.
 * Usa o formato Gemini nativo (generateContent) — não OpenAI-compatible.
 *
 * Configuração necessária no .env.local:
 *   VERTEX_AI_PROJECT_ID=seu-project-id
 *   VERTEX_AI_LOCATION=us-central1
 *   GEMINI_API_KEY=sua-chave  (já configurada)
 *
 * Endpoint: POST /api/copilot/vertex-ai-training
 * Body: { goal: "treinar gemma para...", trainingData: [...], model: "gemma-4-31b-it" }
 */

import { recordCallSafe } from '../../service/rateLimitMonitor.mjs'

function sendJson(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

/**
 * Verifica se Vertex AI está configurado (project ID + location).
 * Se não estiver, usa o endpoint Gemini padrão como fallback.
 */
function getVertexConfig() {
    const projectId = process.env.VERTEX_AI_PROJECT_ID
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1'
    const geminiKey = process.env.GEMINI_API_KEY

    if (projectId) {
        return {
            mode: 'vertex-ai',
            endpoint: `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`,
            apiKey: null, // Vertex uses OAuth, not API key
            projectId,
            location,
        }
    }

    // Fallback: Google AI Studio (Gemini nativo)
    if (geminiKey) {
        return {
            mode: 'gemini-ai-studio',
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
            apiKey: geminiKey,
            projectId: null,
            location: null,
        }
    }

    return { mode: 'unconfigured', endpoint: null, apiKey: null }
}

/**
 * Lista modelos disponíveis para treinamento (Gemma + Gemini).
 */
async function listTrainingModels(config) {
    if (config.mode === 'unconfigured') return []

    try {
        const url = config.mode === 'vertex-ai'
            ? `${config.endpoint}`
            : `${config.endpoint}?key=${config.apiKey}`

        const res = await fetch(url, {
            headers: config.mode === 'vertex-ai'
                ? { Authorization: `Bearer ${await getVertexAccessToken()}` }
                : {},
            signal: AbortSignal.timeout(10000),
        })

        if (!res.ok) return []
        const data = await res.json()
        const models = data.models || []

        // Filtra apenas Gemma (treino aberto)
        return models
            .filter(m => (m.name || '').includes('gemma'))
            .map(m => ({
                id: (m.name || '').replace('models/', ''),
                name: m.displayName || m.name,
                supportedMethods: m.supportedGenerationMethods || [],
            }))
    } catch {
        return []
    }
}

/**
 * Obtém token OAuth para Vertex AI (se configurado).
 */
async function getVertexAccessToken() {
    try {
        const { GoogleAuth } = await import('google-auth-library')
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        })
        const client = await auth.getClient()
        const token = await client.getAccessToken()
        return token.token || ''
    } catch {
        return ''
    }
}

/**
 * Handler principal.
 */
export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST')
        return sendJson(res, 405, { error: 'Method not allowed' })
    }

    const config = getVertexConfig()

    // GET — status e modelos disponíveis
    if (req.method === 'GET') {
        const models = await listTrainingModels(config)
        return sendJson(res, 200, {
            mode: config.mode,
            vertexConfigured: Boolean(config.projectId),
            geminiConfigured: Boolean(config.apiKey),
            trainingModels: models,
            message: config.mode === 'vertex-ai'
                ? 'Vertex AI configurado — pronto para treinamento com Gemma.'
                : config.mode === 'gemini-ai-studio'
                    ? 'Usando Google AI Studio como fallback. Vertex AI não configurado (adicione VERTEX_AI_PROJECT_ID).'
                    : 'Nenhum provedor configurado. Configure GEMINI_API_KEY ou VERTEX_AI_PROJECT_ID.',
        })
    }

    // POST — executar treinamento
    try {
        const body = await new Promise((resolve, reject) => {
            let data = ''
            req.on('data', chunk => { data += chunk })
            req.on('end', () => {
                try { resolve(JSON.parse(data)) } catch { resolve({}) }
            })
            req.on('error', reject)
        })

        const model = body.model || 'gemma-4-31b-it'
        const goal = body.goal || 'Refinar modelo Gemma para domínio de arquitetura/construção'
        const trainingData = Array.isArray(body.trainingData) ? body.trainingData : []

        if (config.mode === 'unconfigured') {
            return sendJson(res, 200, {
                status: 'planning-only',
                message: 'Vertex AI e Google AI Studio não configurados. Configure GEMINI_API_KEY ou VERTEX_AI_PROJECT_ID no .env.local.',
                model,
                goal,
            })
        }

        // Monta prompt de treinamento no formato nativo Gemini
        const systemInstruction = `Você é um assistente de treinamento para o modelo ${model}. Seu objetivo é: ${goal}. Responda de forma técnica e detalhada.`

        const contents = trainingData.length > 0
            ? trainingData.map(item => ({
                role: 'user',
                parts: [{ text: typeof item === 'string' ? item : item.prompt || JSON.stringify(item) }],
            }))
            : [{ role: 'user', parts: [{ text: `Prepare um plano de treinamento para o modelo ${model} com o objetivo: ${goal}. Inclua: 1) dados necessários, 2) formato de fine-tuning, 3) hiperparâmetros sugeridos, 4) métricas de avaliação, 5) pipeline de deployment.` }] }

    const endpoint = config.mode === 'vertex-ai'
            ? `${config.endpoint}/${model}:generateContent`
            : `${config.endpoint}/${model}:generateContent?key=${config.apiKey}`

        const payload = {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048,
                topP: 0.95,
            },
        }

        const startTime = Date.now()
        const headers = config.mode === 'vertex-ai'
            ? {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await getVertexAccessToken()}`,
            }
            : { 'Content-Type': 'application/json' }

        const geminiRes = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000),
        })

        const geminiData = await geminiRes.json().catch(() => ({}))
        const duration = Date.now() - startTime
        const success = geminiRes.ok && !geminiData.error

        const replyText = geminiData?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
        const usage = geminiData?.usageMetadata || {}

        recordCallSafe({
            provider: config.mode,
            model,
            latencyMs: duration,
            success,
            tokensIn: usage.promptTokenCount || 0,
            tokensOut: usage.candidatesTokenCount || usage.totalTokenCount || 0,
            errorMsg: success ? null : (geminiData?.error?.message || `HTTP ${geminiRes.status}`),
        })

        return sendJson(res, 200, {
            status: success ? 'success' : 'error',
            mode: config.mode,
            model,
            reply: replyText || (success ? 'Resposta vazia do modelo.' : `Erro: ${geminiData?.error?.message || `HTTP ${geminiRes.status}`}`),
            usage,
            trainingPlan: {
                goal,
                model,
                provider: config.mode,
                vertexConfigured: Boolean(config.projectId),
                recommendation: config.mode === 'vertex-ai'
                    ? 'Vertex AI está configurado. Use o console do Vertex AI para fine-tuning supervisionado (SFT) do Gemma.'
                    : 'Configure VERTEX_AI_PROJECT_ID para habilitar fine-tuning via Vertex AI.',
            },
        })
    } catch (err) {
        return sendJson(res, 200, {
            status: 'error',
            message: `Erro: ${err.message}`,
        })
    }
}

export const config = { api: { bodyParser: false } }

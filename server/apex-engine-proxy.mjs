#!/usr/bin/env node
/**
 * Apex AI Engine Proxy — Bridge entre chat.mjs e Ollama (motor próprio)
 *
 * Escuta na porta 8888 e traduz o formato do chat.mjs para a API do Ollama.
 *
 * Formato de entrada (chat.mjs → proxy):
 *   POST /ai/chat
 *   { model: "apex-ai", messages: [{ role, content }, ...] }
 *
 * Formato de saída (proxy → chat.mjs):
 *   { reply: "...", provider: "apex-ai-own-engine", model: "apex-ai" }
 *
 * Uso:
 *   node server/apex-engine-proxy.mjs
 *   (ou: npm run engine-proxy)
 */

import { createServer } from 'node:http'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
const PROXY_PORT = Number(process.env.APEX_ENGINE_PROXY_PORT) || 8888
const OLLAMA_MODEL = process.env.APEX_ENGINE_MODEL || 'apex-ai'

const OLLAMA_TIMEOUT = 120_000 // 2 min para primeira inferência (carregar modelo)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readBody(req) {
    return new Promise((resolve) => {
        const chunks = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
            try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
            catch { resolve({}) }
        })
    })
}

function sendJson(res, status, data) {
    const json = JSON.stringify(data, null, 2)
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
    })
    res.end(json)
}

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) return []
    // Mantém só user/assistant, limpa conteúdo
    return messages
        .filter(m => m?.role === 'user' || m?.role === 'assistant' || m?.role === 'system')
        .map(m => ({
            role: m.role,
            content: String(m.content || m.text || '').slice(0, 8000),
        }))
        .filter(m => m.content.length > 0)
}

// ─── Servidor ─────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        })
        return res.end()
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const path = url.pathname

    // ── GET /health ──
    if (req.method === 'GET' && path === '/health') {
        return sendJson(res, 200, { status: 'ok', engine: 'ollama', model: OLLAMA_MODEL })
    }

    // ── POST /ai/chat ──
    if (req.method === 'POST' && path === '/ai/chat') {
        const body = await readBody(req)
        const model = String(body.model || OLLAMA_MODEL)
        const messages = sanitizeMessages(body.messages)

        if (messages.length === 0) {
            return sendJson(res, 400, { reply: 'Mensagem inválida ou vazia.', provider: 'apex-engine-proxy' })
        }

        // Se não tem system, adiciona um padrão
        const hasSystem = messages.some(m => m.role === 'system')
        if (!hasSystem) {
            messages.unshift({
                role: 'system',
                content: 'Você é a Apex AI — plataforma profissional global de arquitetura, construção, BIM, orçamentos, marketing e gestão. Responda em português, de forma técnica e direta, sem inventar dados ou integrações que não existem.',
            })
        }

        const ollamaPayload = {
            model,
            messages,
            stream: false,
            options: {
                temperature: Number(body.temperature) || 0.7,
                num_predict: Number(body.max_tokens || body.maxTokens) || 2048,
            },
        }

        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT)

            const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ollamaPayload),
                signal: controller.signal,
            })
            clearTimeout(timeout)

            if (!ollamaRes.ok) {
                const errText = await ollamaRes.text().catch(() => '')
                console.error(`[apex-engine-proxy] Ollama error ${ollamaRes.status}: ${errText.slice(0, 200)}`)
                return sendJson(res, 502, {
                    reply: '',
                    provider: 'apex-engine-proxy',
                    error: `Ollama retornou status ${ollamaRes.status}`,
                })
            }

            const ollamaData = await ollamaRes.json()
            const reply = ollamaData?.message?.content || ''

            return sendJson(res, 200, {
                reply,
                finalReply: reply,
                provider: 'apex-ai-own-engine',
                model,
                usage: {
                    prompt_tokens: ollamaData?.prompt_eval_count || 0,
                    completion_tokens: ollamaData?.eval_count || 0,
                    total_tokens: (ollamaData?.prompt_eval_count || 0) + (ollamaData?.eval_count || 0),
                },
            })
        } catch (err) {
            if (err.name === 'AbortError') {
                console.error('[apex-engine-proxy] Timeout ao chamar Ollama')
                return sendJson(res, 504, { reply: '', provider: 'apex-engine-proxy', error: 'Timeout ao contactar Ollama' })
            }
            console.error('[apex-engine-proxy] Erro ao chamar Ollama:', err.message?.slice(0, 120))
            return sendJson(res, 502, { reply: '', provider: 'apex-engine-proxy', error: 'Erro ao contactar Ollama' })
        }
    }

    // ── 404 ──
    sendJson(res, 404, { error: 'Rota não encontrada' })
})

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`[apex-engine-proxy] Porta ${PROXY_PORT} já está em uso. Mantendo serviço ativo no processo existente.`)
    } else {
        console.error('[apex-engine-proxy] Erro no servidor proxy:', err.message)
    }
})

server.listen(PROXY_PORT, () => {
    console.log(`\n🧠 Apex Engine Proxy rodando em http://127.0.0.1:${PROXY_PORT}`)
    console.log(`   Ollama → ${OLLAMA_URL}  |  Modelo → ${OLLAMA_MODEL}\n`)
})

// Graceful shutdown
process.on('SIGINT', () => { console.log('\nEncerrando...'); server.close(() => process.exit(0)) })
process.on('SIGTERM', () => { console.log('\nEncerrando...'); server.close(() => process.exit(0)) })

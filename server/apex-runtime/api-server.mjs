/**
 * server/apex-runtime/api-server.mjs
 *
 * Apex AI API Server — seu próprio servidor de IA
 *
 * Expõe uma API OpenAI-compatible na porta 8888 (ou APEX_API_PORT).
 * O site apexglobalai.com chama este servidor em vez do Gemini.
 *
 * DEPLOY:
 *   Opção A — PC do Dr. Edgard (já tem o modelo):
 *     node server/apex-runtime/api-server.mjs
 *     + cloudflare tunnel para expor na internet
 *
 *   Opção B — Oracle Cloud FREE (4 CPUs ARM, 24GB RAM):
 *     git clone → npm install → node server/apex-runtime/api-server.mjs
 *     (Gemma 2B roda perfeitamente em 24GB RAM)
 *
 *   Opção C — Qualquer VPS Linux ($5/mês):
 *     DigitalOcean, Linode, Hetzner — instala Node.js + baixa modelo
 *
 * PARA O SITE USAR ESTE SERVIDOR em vez do Gemini:
 *   No Vercel, adicione:
 *     LOCAL_WORKER_URL = https://seu-apex-api.ngrok.io  (ou domínio próprio)
 *     LOCAL_WORKER_TOKEN = seu-token-secreto
 *
 * ENDPOINTS:
 *   POST /v1/chat/completions   → OpenAI-compatible
 *   POST /ai/chat               → formato Apex interno
 *   GET  /health                → status do servidor
 *   GET  /v1/models             → lista modelos disponíveis
 */

import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { startEngine, chatWithEngine, isEngineRunning, APEX_ENGINE_URL, setupEngine } from './engine.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.APEX_API_PORT) || 8888
const TOKEN = process.env.APEX_API_TOKEN || process.env.LOCAL_WORKER_TOKEN || ''

const MODEL_ID = 'apex-ai-gemma-2b'
const SERVER_NAME = 'Apex AI API Server'

function log(msg) {
    console.log(`[apex-api ${new Date().toISOString().slice(11, 19)}] ${msg}`)
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
}

// ─── Auth (opcional — configurável) ──────────────────────────────────────────
function checkAuth(req) {
    if (!TOKEN) return true // Sem token configurado = aberto (use em rede local)
    const auth = (req.headers.authorization || '').replace('Bearer ', '').trim()
    return auth === TOKEN
}

// ─── Lê body JSON ─────────────────────────────────────────────────────────────
function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', chunk => data += chunk)
        req.on('end', () => {
            try { resolve(JSON.parse(data || '{}')) } catch (_) { resolve({}) }
        })
        req.on('error', reject)
    })
}

// ─── Handler principal ────────────────────────────────────────────────────────
async function handleRequest(req, res) {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`)
    const pathname = url.pathname

    setCors(res)

    if (req.method === 'OPTIONS') {
        res.writeHead(204); res.end(); return
    }

    // ── GET /health ─────────────────────────────────────────────────────────────
    if (pathname === '/health' || pathname === '/') {
        const engineOk = await isEngineRunning()
        res.writeHead(engineOk ? 200 : 503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            ok: engineOk,
            server: SERVER_NAME,
            model: MODEL_ID,
            engine: APEX_ENGINE_URL,
            status: engineOk ? 'ready' : 'starting',
            timestamp: new Date().toISOString(),
        }))
        return
    }

    // ── GET /v1/models ─────────────────────────────────────────────────────────
    if (pathname === '/v1/models') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            object: 'list',
            data: [{ id: MODEL_ID, object: 'model', owned_by: 'apex-ai', created: 1700000000 }],
        }))
        return
    }

    if (!checkAuth(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Unauthorized' }))
        return
    }

    const body = await readBody(req)

    // ── POST /v1/chat/completions  (OpenAI-compatible) ─────────────────────────
    // ── POST /ai/chat              (Apex interno) ──────────────────────────────
    if (req.method === 'POST' && (pathname === '/v1/chat/completions' || pathname === '/ai/chat')) {
        const messages = Array.isArray(body.messages) ? body.messages : [
            { role: 'user', content: body.message || body.prompt || '' }
        ]
        const temperature = Number(body.temperature) || 0.7
        const maxTokens = Number(body.max_tokens || body.maxTokens) || 1024

        if (!messages.length || !messages.some(m => m.content)) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'messages are required' }))
            return
        }

        const engineOk = await isEngineRunning()
        if (!engineOk) {
            res.writeHead(503, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
                error: 'Motor de IA não está pronto. Aguarde alguns segundos e tente novamente.',
                status: 'starting',
            }))
            return
        }

        try {
            const result = await chatWithEngine(messages, { temperature, maxTokens })
            const reply = result.reply || ''

            if (pathname === '/ai/chat') {
                // Formato Apex interno (compatível com local-worker)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                    ok: true,
                    reply,
                    finalReply: reply,
                    provider: 'apex-ai-own-engine',
                    model: MODEL_ID,
                    choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }],
                }))
            } else {
                // Formato OpenAI-compatible
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                    id: `apex-${Date.now()}`,
                    object: 'chat.completion',
                    created: Math.floor(Date.now() / 1000),
                    model: MODEL_ID,
                    choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }],
                    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
                }))
            }

            log(`✅ Resposta gerada (${reply.length} chars)`)
        } catch (err) {
            log(`❌ Erro: ${err.message}`)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
        }
        return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
}

// ─── Inicialização ────────────────────────────────────────────────────────────
async function main() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗')
    console.log('║          APEX AI — SERVIDOR DE IA PROPRIETÁRIO           ║')
    console.log('╚═══════════════════════════════════════════════════════════╝\n')

    // Verifica/baixa motor e modelo
    log('Verificando motor e modelo...')
    const setup = await setupEngine((label, downloaded, total) => {
        const pct = Math.floor(downloaded / total * 100)
        const mb = (downloaded / 1024 / 1024).toFixed(0)
        const totalMb = (total / 1024 / 1024).toFixed(0)
        process.stdout.write(`\r  ${label}: ${mb}MB / ${totalMb}MB (${pct}%)   `)
    })

    if (!setup.ok) {
        log('⚠️  Motor ou modelo não encontrado. Tente: npm run setup:runtime')
        log('O servidor vai aguardar o motor ficar disponível...')
    }

    // Inicia o motor de IA em background
    log('Iniciando motor de IA...')
    startEngine().then(ok => {
        if (ok) log('✅ Motor de IA pronto!')
        else log('⚠️  Motor não iniciou. Verifique os arquivos em: ' + process.env.APPDATA + '\\Apex AI\\engine')
    })

    // Inicia o servidor HTTP
    const server = http.createServer((req, res) => {
        handleRequest(req, res).catch(err => {
            log(`Erro não tratado: ${err.message}`)
            try {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Internal server error' }))
            } catch (_) { }
        })
    })

    server.listen(PORT, '0.0.0.0', () => {
        log(`\n✅ Apex AI API Server rodando na porta ${PORT}`)
        log(`   Local:    http://localhost:${PORT}`)
        log(`   Health:   http://localhost:${PORT}/health`)
        log(`   Chat API: POST http://localhost:${PORT}/v1/chat/completions`)
        log(`   Chat API: POST http://localhost:${PORT}/ai/chat`)
        if (TOKEN) log(`   Token:    configurado (requerido no header Authorization)`)
        else log(`   Token:    NÃO configurado (livre para rede local)`)
        log('')
        log('Para expor na internet (usar no site):')
        log('  npx cloudflared tunnel --url http://localhost:' + PORT)
        log('  Depois adicione no Vercel: LOCAL_WORKER_URL=https://xxx.trycloudflare.com')
        log('')
    })
}

main().catch(err => {
    console.error('Erro fatal:', err)
    process.exit(1)
})

/**
 * api/mcp/server.mjs
 *
 * Apex AI — MCP Server Remoto (Model Context Protocol)
 *
 * Expõe as capacidades da Apex AI como um servidor MCP via HTTP/SSE.
 * Qualquer aplicativo compatível com MCP pode se conectar:
 *   - VS Code (GitHub Copilot)
 *   - Claude Desktop
 *   - Cursor
 *   - n8n, Make, Zapier
 *   - Outros agentes de IA
 *
 * Endpoint: https://www.apexglobalai.com/api/mcp/server
 *
 * Para conectar no VS Code (.vscode/mcp.json):
 * {
 *   "servers": {
 *     "apex-ai": {
 *       "type": "http",
 *       "url": "https://www.apexglobalai.com/api/mcp/server",
 *       "headers": { "Authorization": "Bearer SEU_CRON_SECRET" }
 *     }
 *   }
 * }
 *
 * Ferramentas expostas:
 *   - apex_chat         → faz uma pergunta para a Apex AI
 *   - apex_search       → pesquisa no conhecimento da plataforma
 *   - apex_execute      → executa ação na plataforma (requer auth)
 *   - apex_teach        → ensina algo novo para a Apex AI
 *   - apex_status       → retorna status dos módulos da plataforma
 */

import '../../server/env.mjs'

const TOOL_DEFINITIONS = [
    {
        name: 'apex_chat',
        description: 'Faz uma pergunta ou pedido para a Apex AI. Use para qualquer tarefa: orçamentos, contratos, BIM, marketing, código, análise de documentos. A Apex AI responde em português ou no idioma da pergunta.',
        inputSchema: {
            type: 'object',
            properties: {
                message: { type: 'string', description: 'A pergunta ou tarefa para a Apex AI' },
                model: { type: 'string', description: 'Modelo a usar (padrão: gemini|gemini-3.5-flash)', default: 'gemini|gemini-3.5-flash' },
                context: { type: 'string', description: 'Contexto adicional (opcional)' },
            },
            required: ['message'],
        },
    },
    {
        name: 'apex_search',
        description: 'Pesquisa informações técnicas: normas de construção, SINAPI, NRs, preços, regulamentações. Retorna resultados com fontes.',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'O que pesquisar' },
                domain: { type: 'string', description: 'Domínio: construção, arquitetura, bim, marketing, gestao, juridico', default: 'construção' },
            },
            required: ['query'],
        },
    },
    {
        name: 'apex_teach',
        description: 'Ensina algo novo para a Apex AI. O conhecimento fica salvo permanentemente.',
        inputSchema: {
            type: 'object',
            properties: {
                topic: { type: 'string', description: 'Nome/ID do assunto (ex: preco_plano_basico)' },
                content: { type: 'string', description: 'O que a AI deve saber sobre este assunto' },
            },
            required: ['topic', 'content'],
        },
    },
    {
        name: 'apex_status',
        description: 'Retorna o status dos módulos da plataforma Apex AI (quais estão ativos, versão, etc.)',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
]

function sendJson(res, status, body) {
    if (res.headersSent) return
    res.status(status).json(body)
}

function checkAuth(req) {
    const auth = req.headers?.authorization || ''
    const token = auth.replace('Bearer ', '').trim()
    const validTokens = [
        process.env.CRON_SECRET || '',
        process.env.APEX_OWNER_KEY || '',
        process.env.LOCAL_WORKER_TOKEN || '',
    ].filter(Boolean)
    if (validTokens.length === 0) return true // Dev mode sem token configurado
    return validTokens.some(t => t === token)
}

async function callApexChat(message, model = 'gemini|gemini-3.5-flash', context = '') {
    const baseUrl = process.env.APEX_SELF_URL || 'https://www.apexglobalai.com'
    const fullMessage = context ? `${context}\n\n${message}` : message
    const res = await fetch(`${baseUrl}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullMessage, model, locale: 'pt-BR' }),
        signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) throw new Error(`Chat API error ${res.status}`)
    const data = await res.json()
    return data.finalReply || data.reply || 'Sem resposta'
}

async function executeTool(name, args) {
    switch (name) {
        case 'apex_chat': {
            const reply = await callApexChat(args.message, args.model, args.context)
            return { content: [{ type: 'text', text: reply }] }
        }

        case 'apex_search': {
            const searchPrompt = `Pesquise informações técnicas sobre: "${args.query}". Domínio: ${args.domain || 'construção'}. Forneça informações precisas, normas aplicáveis e fontes quando disponíveis.`
            const reply = await callApexChat(searchPrompt)
            return { content: [{ type: 'text', text: reply }] }
        }

        case 'apex_teach': {
            const baseUrl = process.env.APEX_SELF_URL || 'https://www.apexglobalai.com'
            const token = process.env.CRON_SECRET || process.env.APEX_OWNER_KEY || ''
            const res = await fetch(`${baseUrl}/api/copilot/teach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ type: 'teaching', topic: args.topic, content: args.content }),
                signal: AbortSignal.timeout(10000),
            })
            if (!res.ok) throw new Error(`Teach API error ${res.status}`)
            return { content: [{ type: 'text', text: `✅ Apex AI agora sabe: [${args.topic}] → ${args.content}` }] }
        }

        case 'apex_status': {
            const status = {
                platform: 'Apex AI Copilot Platform',
                version: '1.0.0',
                url: 'https://www.apexglobalai.com',
                modules: [
                    'Chat + Memória Persistente', 'ArchVis Studio (geração de imagens)',
                    'DirectCut Studio (vídeos)', 'BIM 3D Studio', 'Budget Studio (SINAPI)',
                    'Contracts Studio', 'Field Ops + RDO', 'EVM Scheduler',
                    'CRM Pipeline', 'Research Studio', 'WhatsApp/SMS',
                    'Stripe Payments', 'MS Project', 'NR Compliance',
                    'Local Worker (comandos PC)', 'Apex AI 2.0 Own Engine',
                ],
                providers: {
                    gemini: Boolean(process.env.GEMINI_API_KEY),
                    fal: Boolean(process.env.FAL_KEY),
                    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
                    apexOwnEngine: Boolean(process.env.APEX_OWN_ENGINE_URL || process.env.APEX_API_URL || process.env.APEX_RUNTIME_ENABLED),
                    localWorker: Boolean(process.env.LOCAL_WORKER_URL),
                },
            }
            return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] }
        }

        default:
            throw new Error(`Ferramenta desconhecida: ${name}`)
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

    if (req.method === 'OPTIONS') return res.status(200).end()

    if (!checkAuth(req)) return sendJson(res, 401, { error: 'Unauthorized' })

    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)

    // ── GET / → info do servidor MCP ────────────────────────────────────────────
    if (req.method === 'GET') {
        return sendJson(res, 200, {
            name: 'apex-ai-mcp',
            version: '1.0.0',
            description: 'Apex AI — MCP Server. Acesse capacidades da plataforma: chat, pesquisa, ensino e status.',
            tools: TOOL_DEFINITIONS.length,
            toolNames: TOOL_DEFINITIONS.map(t => t.name),
            endpoint: 'POST /api/mcp/server',
            docs: 'https://www.apexglobalai.com',
        })
    }

    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const { method, params, id } = body

    // ── JSON-RPC MCP Protocol ────────────────────────────────────────────────────
    function rpcOk(result) {
        return sendJson(res, 200, { jsonrpc: '2.0', id: id ?? null, result })
    }
    function rpcErr(code, message) {
        return sendJson(res, 200, { jsonrpc: '2.0', id: id ?? null, error: { code, message } })
    }

    try {
        switch (method) {
            // Handshake inicial
            case 'initialize':
                return rpcOk({
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: { listChanged: false } },
                    serverInfo: { name: 'apex-ai-mcp', version: '1.0.0' },
                })

            // Lista ferramentas disponíveis
            case 'tools/list':
                return rpcOk({ tools: TOOL_DEFINITIONS })

            // Executa uma ferramenta
            case 'tools/call': {
                const toolName = params?.name
                const toolArgs = params?.arguments || {}
                if (!toolName) return rpcErr(-32602, 'Missing tool name')
                const tool = TOOL_DEFINITIONS.find(t => t.name === toolName)
                if (!tool) return rpcErr(-32601, `Tool not found: ${toolName}`)
                const result = await executeTool(toolName, toolArgs)
                return rpcOk(result)
            }

            // Ping
            case 'ping':
                return rpcOk({})

            default:
                return rpcErr(-32601, `Method not found: ${method}`)
        }
    } catch (err) {
        console.error('[mcp] Error:', err?.message)
        return rpcErr(-32603, err?.message || 'Internal error')
    }
}

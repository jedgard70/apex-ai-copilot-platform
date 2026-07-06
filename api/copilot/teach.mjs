/**
 * api/copilot/teach.mjs
 *
 * Endpoint para o Owner ensinar a Apex AI explicitamente.
 * Tudo que você ensinar aqui fica salvo na memória persistente
 * e é incorporado no próximo treino do modelo.
 *
 * POST /api/copilot/teach
 * Body: { type, topic, content, triggerRetrain? }
 *
 * Types:
 *   "teaching"   → fato, regra ou instrução que a AI deve sempre lembrar
 *   "skill"      → confirma que uma skill está live e funcionando
 *   "business"   → adiciona serviço, preço ou contexto de negócio
 *   "research"   → resultado de pesquisa para memorizar
 *   "command"    → comando permitido para clientes pagantes
 *   "retrain"    → dispara o treino imediatamente
 */

import '../../server/env.mjs'
import { addTeaching, addResearchKnowledge, confirmSkill, readMemory, writeMemory } from '../../server/service/apexMemory.mjs'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

function sendJson(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

function isOwner(req) {
    const auth = req.headers?.authorization || ''
    const token = auth.replace('Bearer ', '').trim()
    // Usa a chave de API do Owner ou CRON_SECRET
    const validTokens = [
        process.env.APEX_OWNER_KEY || '',
        process.env.CRON_SECRET || '',
        process.env.LOCAL_WORKER_TOKEN || '',
    ].filter(Boolean)
    return validTokens.some(t => t === token)
}

function triggerRetrain() {
    return new Promise((resolve) => {
        const scriptPath = path.join(ROOT, 'scripts', 'train-apex-ai.mjs')
        const proc = execFile(
            process.execPath, // node
            [scriptPath],
            { cwd: ROOT, timeout: 120000 },
            (error, stdout, stderr) => {
                if (error) {
                    console.error('[teach] Retrain error:', error.message)
                    resolve({ ok: false, error: error.message, output: stdout + stderr })
                } else {
                    resolve({ ok: true, output: stdout })
                }
            }
        )
        proc.stdout?.on('data', d => process.stdout.write('[retrain] ' + d))
    })
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

    if (req.method === 'OPTIONS') return res.writeHead(200).end()

    // GET /api/copilot/teach → retorna o resumo da memória atual
    if (req.method === 'GET') {
        if (!isOwner(req)) return sendJson(res, 401, { error: 'Unauthorized' })
        const memory = readMemory()
        return sendJson(res, 200, {
            ok: true,
            summary: {
                teachings: memory.teachings?.length || 0,
                researchKnowledge: memory.researchKnowledge?.length || 0,
                confirmedSkills: memory.confirmedSkills?.length || 0,
                qualityConversations: memory.qualityConversations?.length || 0,
                updatedAt: memory.updatedAt,
            },
            teachings: memory.teachings?.slice(-20) || [],
            confirmedSkills: memory.confirmedSkills || [],
        })
    }

    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
    if (!isOwner(req)) return sendJson(res, 401, { error: 'Unauthorized — apenas o Owner pode ensinar a Apex AI' })

    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const { type, topic, content, triggerRetrain: shouldRetrain = false } = body

    try {
        switch (type) {
            case 'teaching': {
                if (!topic || !content) return sendJson(res, 400, { error: 'topic e content são obrigatórios' })
                const entry = addTeaching({ topic, content, source: 'owner' })
                console.log(`[teach] ✅ Ensinamento salvo: [${topic}]`)
                const retrainResult = shouldRetrain ? await triggerRetrain() : null
                return sendJson(res, 200, { ok: true, type: 'teaching', entry, retrain: retrainResult })
            }

            case 'skill': {
                if (!topic) return sendJson(res, 400, { error: 'topic (id da skill) é obrigatório' })
                const entry = confirmSkill({ id: topic, label: content || topic, endpoint: body.endpoint || '' })
                console.log(`[teach] ✅ Skill confirmada live: ${topic}`)
                return sendJson(res, 200, { ok: true, type: 'skill', entry })
            }

            case 'business': {
                if (!content) return sendJson(res, 400, { error: 'content é obrigatório' })
                const memory = readMemory()
                if (!memory.businessContext) memory.businessContext = { services: [], targetMarkets: [], pricingNotes: [] }
                const target = topic || 'services'
                if (!Array.isArray(memory.businessContext[target])) memory.businessContext[target] = []
                if (!memory.businessContext[target].includes(content)) {
                    memory.businessContext[target].push(content)
                }
                writeMemory(memory)
                console.log(`[teach] ✅ Contexto de negócio atualizado: ${target}`)
                return sendJson(res, 200, { ok: true, type: 'business', target, content })
            }

            case 'research': {
                if (!topic || !content) return sendJson(res, 400, { error: 'topic (query) e content (summary) são obrigatórios' })
                addResearchKnowledge({ query: topic, summary: content, sources: body.sources || [] })
                console.log(`[teach] ✅ Pesquisa memorizada: ${topic}`)
                return sendJson(res, 200, { ok: true, type: 'research', query: topic })
            }

            case 'command': {
                if (!content) return sendJson(res, 400, { error: 'content (comando) é obrigatório' })
                const memory = readMemory()
                if (!Array.isArray(memory.allowedClientCommands)) memory.allowedClientCommands = []
                if (!memory.allowedClientCommands.includes(content)) {
                    memory.allowedClientCommands.push(content)
                }
                writeMemory(memory)
                console.log(`[teach] ✅ Comando autorizado para clientes: ${content}`)
                return sendJson(res, 200, { ok: true, type: 'command', content })
            }

            case 'retrain': {
                console.log('[teach] 🔄 Disparando treino manual...')
                const result = await triggerRetrain()
                return sendJson(res, 200, { ok: result.ok, type: 'retrain', ...result })
            }

            default:
                return sendJson(res, 400, {
                    error: `Tipo inválido: "${type}". Use: teaching, skill, business, research, command, retrain`,
                })
        }
    } catch (err) {
        console.error('[teach] Erro:', err?.message)
        return sendJson(res, 500, { error: 'Erro interno', details: err?.message })
    }
}

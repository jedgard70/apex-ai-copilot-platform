/**
 * api/deploy-hook/trigger.mjs
 *
 * Endpoint da API Apex para disparar o Deploy Hook da Vercel.
 *
 * FLUXO:
 *   POST /api/deploy-hook/trigger
 *   Authorization: Bearer <DEPLOY_HOOK_SECRET>
 *
 *   Opcional: body { "description": "motivo do deploy" }
 *
 * USO EXTERNO:
 *   - Webhooks do Supabase (INSERT em tabela de conteúdo)
 *   - GitHub Actions de outros repositórios
 *   - Zapier / Make / n8n
 *   - Google Chat / Slack slash commands
 *   - Agendamentos (cron-job.org, etc.)
 *
 * ENV VARS necessárias:
 *   VERCEL_DEPLOY_HOOK — URL completa do Deploy Hook
 *   DEPLOY_HOOK_SECRET — token para autenticar chamadas
 */

import { triggerDeployHook, isDeployHookConfigured } from '../../server/service/deployHook.mjs'

export default async function handler(req, res) {
    // Apenas POST
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: 'Método não permitido. Use POST.' }))
    }

    // Validação de autorização
    const expectedSecret = process.env.DEPLOY_HOOK_SECRET
    if (expectedSecret) {
        const authHeader = req.headers['authorization'] || ''
        const token = authHeader.replace(/^Bearer\s+/i, '').trim()
        if (token !== expectedSecret) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: 'Não autorizado. Token inválido ou ausente.' }))
        }
    }

    // Verifica se o hook está configurado
    if (!isDeployHookConfigured()) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({
            error: 'Deploy Hook não configurado. Defina VERCEL_DEPLOY_HOOK no ambiente.',
        }))
    }

    // Lê body (descrição opcional)
    let description = ''
    try {
        const body = await new Promise((resolve, reject) => {
            let data = ''
            req.on('data', chunk => { data += chunk.toString() })
            req.on('end', () => {
                try { resolve(data ? JSON.parse(data) : {}) }
                catch { resolve({}) }
            })
            req.on('error', reject)
        })
        description = String(body.description || '').trim()
    } catch {
        // segue sem descrição
    }

    // Dispara o deploy
    const result = await triggerDeployHook({ description })

    if (result.ok) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({
            success: true,
            message: result.message,
            jobId: result.jobId,
            deployedAt: new Date().toISOString(),
        }))
    }

    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
        success: false,
        error: result.error,
    }))
}

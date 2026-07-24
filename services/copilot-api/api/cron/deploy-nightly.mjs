/**
 * api/cron/deploy-nightly.mjs
 *
 * Cron job noturno da Vercel — dispara deploy automático todo dia às 3h (BRT).
 *
 * Schedule: 0 6 * * * (06:00 UTC = 03:00 BRT)
 *
 * FLUXO:
 *   1. Verifica CRON_SECRET para autorização
 *   2. Chama o Deploy Hook da Vercel
 *   3. Registra resultado
 *
 * ENV VARS necessárias:
 *   VERCEL_DEPLOY_HOOK — URL do Deploy Hook
 *   CRON_SECRET — token de segurança (opcional, mas recomendado)
 */

import { triggerDeployHook, isDeployHookConfigured } from '../../server/service/deployHook.mjs'

export default async function handler(req, res) {
    // Apenas GET (Vercel Cron usa GET)
    if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: 'Método não permitido.' }))
    }

    // Segurança: validar CRON_SECRET se configurado
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
        const authHeader = req.headers['authorization'] || ''
        if (authHeader !== `Bearer ${cronSecret}`) {
            res.writeHead(401, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: 'Não autorizado.' }))
        }
    }

    // Verifica se o hook está configurado
    if (!isDeployHookConfigured()) {
        console.warn('[cron/deploy-nightly] VERCEL_DEPLOY_HOOK não configurado — deploy noturno ignorado')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({
            success: false,
            skipped: true,
            reason: 'VERCEL_DEPLOY_HOOK não configurado',
        }))
    }

    console.log('[cron/deploy-nightly] 🌙 Iniciando deploy noturno automático...')

    const result = await triggerDeployHook({ description: 'deploy noturno automático (cron)' })

    if (result.ok) {
        console.log(`[cron/deploy-nightly] ✅ Deploy noturno bem-sucedido${result.jobId ? ` (job: ${result.jobId})` : ''}`)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({
            success: true,
            message: 'Deploy noturno executado com sucesso.',
            jobId: result.jobId,
            timestamp: new Date().toISOString(),
        }))
    }

    console.error(`[cron/deploy-nightly] ❌ Falha no deploy noturno: ${result.error}`)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
        success: false,
        error: result.error,
    }))
}

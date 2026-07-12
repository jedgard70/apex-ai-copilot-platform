/**
 * api/copilot/deploy-model.mjs
 *
 * Endpoint do Owner
 * e cria/ativa um Inference Endpoint (serverless) para o modelo fine-tunado.
 *
 * POST /api/copilot/deploy-model
 * Body: {repoId? }
 *
 * GET  /api/copilot/deploy-model
 * Retorna: { status, endpoints } — lista de endpoints ativos
 */

import { recordCallSafe } from '../../server/service/rateLimitMonitor.mjs'

function sendJson(res, status, body) {
    res.status(status).json(body)
}

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST')
        return sendJson(res, 405, { error: 'Method not allowed' })
    }

    // GET — status e endpoints ativos
    if (req.method === 'GET') {
        return sendJson(res, 200, {
            status: 'ready',
            message: 'Deploy para criar endpoint.',
            defaultRepoId: 'jedgard70/gemma-2-2b-apex-ai',
            endpoints: [],
        })
    }

    // POST — cria/valida endpoint de inferência
    try {
        const body = await new Promise((resolve, reject) => {
            let data = ''
            req.on('data', chunk => data += chunk)
            req.on('end', () => {
                try { resolve(JSON.parse(data)) } catch { resolve({}) }
            })
            req.on('error', reject)
        })

        )
    }

        const targetRepo = repoId || 'jedgard70/gemma-2-2b-apex-ai'


})

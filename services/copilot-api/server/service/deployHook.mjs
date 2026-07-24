/**
 * server/service/deployHook.mjs
 *
 * Serviço central de Deploy Hook da Vercel.
 * Usado pelo chat, pelo cron e pelos webhooks externos.
 *
 * FLUXO:
 *   1. Chama a URL do Deploy Hook da Vercel via POST
 *   2. Retenta 1x em caso de falha de rede
 *   3. Retorna { ok, jobId, message, error }
 *
 * ENV VARS necessárias:
 *   VERCEL_DEPLOY_HOOK — URL completa do Deploy Hook
 *     (ex: https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy)
 *
 *   Opcional:
 *   DEPLOY_HOOK_SECRET — token para validar chamadas ao endpoint
 */

const VERCEL_DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK || ''
const DEPLOY_HOOK_TIMEOUT = 30_000 // 30s

/**
 * Dispara um deploy na Vercel chamando o Deploy Hook.
 * @param {object} [options]
 * @param {string} [options.description] — opcional, descrição para log
 * @returns {Promise<{ok: boolean, jobId?: string, message?: string, error?: string}>}
 */
export async function triggerDeployHook(options = {}) {
    const { description = '' } = options

    if (!VERCEL_DEPLOY_HOOK) {
        console.warn('[deployHook] VERCEL_DEPLOY_HOOK não configurado')
        return { ok: false, error: 'VERCEL_DEPLOY_HOOK não configurado' }
    }

    console.log(`[deployHook] 🚀 Disparando deploy${description ? ` — ${description}` : ''}`)

    // Tenta 2x (primária + retry)
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), DEPLOY_HOOK_TIMEOUT)

            const response = await fetch(VERCEL_DEPLOY_HOOK, {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
            })

            clearTimeout(timeout)

            // Vercel retorna 201/202 com { job } em caso de sucesso
            let body = {}
            try { body = await response.json() } catch { /* não é JSON */ }

            if (response.ok) {
                const jobId = body?.job?.id || body?.id || null
                console.log(`[deployHook] ✅ Deploy disparado com sucesso${jobId ? ` (job: ${jobId})` : ''}`)
                return {
                    ok: true,
                    jobId,
                    message: 'Deploy iniciado com sucesso na Vercel.',
                }
            }

            // Erro HTTP
            const errorMsg = body?.error?.message || body?.message || `HTTP ${response.status}`
            console.warn(`[deployHook] ⚠️ Tentativa ${attempt}: ${errorMsg}`)
            if (attempt === 2) {
                return { ok: false, error: `Falha ao disparar deploy: ${errorMsg}` }
            }
            // Aguarda 1s antes de retentar
            await new Promise(r => setTimeout(r, 1000))
        } catch (err) {
            console.warn(`[deployHook] ⚠️ Tentativa ${attempt} — exceção: ${err.message}`)
            if (attempt === 2) {
                return { ok: false, error: `Exceção ao chamar Deploy Hook: ${err.message}` }
            }
            await new Promise(r => setTimeout(r, 1000))
        }
    }

    return { ok: false, error: 'Número máximo de tentativas excedido' }
}

/**
 * Verifica se o Deploy Hook está configurado.
 * @returns {boolean}
 */
export function isDeployHookConfigured() {
    return !!VERCEL_DEPLOY_HOOK
}

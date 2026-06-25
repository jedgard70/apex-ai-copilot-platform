/**
 * server/agent/geminiAgentsConnector.mjs
 *
 * Gemini Interactions API — Managed Agents (Deep Research + Antigravity).
 * 
 * Deep Research: pesquisa web assincrona com citacoes.
 *   agent: 'deep-research-preview-04-2026' | 'deep-research-max-preview-04-2026'
 *   background: true → polling via client.interactions.get(id)
 *
 * Antigravity: agente com sandbox Linux remoto (codigo, arquivos, web).
 *   agent: 'antigravity-preview-05-2026'
 *   environment: 'remote'
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let genaiClient = null

function getClient() {
  if (genaiClient) return genaiClient
  try {
    const { GoogleGenAI } = require('@google/genai')
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return null
    genaiClient = new GoogleGenAI({ apiKey })
    return genaiClient
  } catch {
    return null
  }
}

const RESEARCH_AGENTS = ['deep-research-preview-04-2026', 'deep-research-max-preview-04-2026']
const ANTIGRAVITY_AGENT = 'antigravity-preview-05-2026'

/**
 * Dispara uma pesquisa Deep Research assincrona.
 * @param {string} query - O que pesquisar
 * @param {Object} [options]
 * @param {string} [options.agent] - 'deep-research-preview' (rapido) ou 'deep-research-max' (completo)
 * @param {boolean} [options.wait] - Se true, aguarda resultado (default: false)
 * @returns {Promise<{ ok: boolean, interactionId?: string, status?: string, text?: string, error?: string }>}
 */
export async function startDeepResearch(query, { agent = 'deep-research-preview-04-2026', wait = false } = {}) {
  const client = getClient()
  if (!client) return { ok: false, error: 'Gemini API key not configured' }

  try {
    const interaction = await client.interactions.create({
      agent,
      input: query,
      background: true,
    })

    if (!wait) {
      return {
        ok: true,
        interactionId: interaction.id,
        status: interaction.status || 'pending',
        note: 'Pesquisa em andamento. Use GET /api/copilot/deep-research?id=<id> para ver resultado.',
      }
    }

    // Poll ate completar
    let result = interaction
    const maxAttempts = 30
    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === 'completed') break
      if (result.status === 'failed' || result.status === 'cancelled') {
        return { ok: false, error: `Research failed: ${result.status}`, interactionId: result.id }
      }
      await new Promise(r => setTimeout(r, 5000))
      result = await client.interactions.get(result.id)
    }

    return {
      ok: result.status === 'completed',
      interactionId: result.id,
      status: result.status,
      text: result.output_text || '',
      usage: result.usage,
    }
  } catch (err) {
    return { ok: false, error: `Deep Research error: ${err.message}` }
  }
}

/**
 * Verifica status de uma pesquisa Deep Research.
 * @param {string} interactionId
 * @returns {Promise<{ ok: boolean, status?: string, text?: string, error?: string }>}
 */
export async function checkDeepResearch(interactionId) {
  const client = getClient()
  if (!client) return { ok: false, error: 'Gemini API key not configured' }

  try {
    const interaction = await client.interactions.get(interactionId)
    return {
      ok: interaction.status === 'completed',
      interactionId: interaction.id,
      status: interaction.status,
      text: interaction.output_text || '',
      usage: interaction.usage,
    }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Executa o Antigravity Agent (sandbox Linux remoto).
 * @param {string} task - Descricao da tarefa para executar no sandbox
 * @returns {Promise<{ ok: boolean, text?: string, environmentId?: string, error?: string }>}
 */
export async function runAntigravityAgent(task) {
  const client = getClient()
  if (!client) return { ok: false, error: 'Gemini API key not configured' }

  try {
    const interaction = await client.interactions.create({
      agent: ANTIGRAVITY_AGENT,
      input: task,
      environment: 'remote',
    })

    return {
      ok: Boolean(interaction.output_text),
      text: interaction.output_text || '',
      environmentId: interaction.environment_id || null,
      interactionId: interaction.id,
      status: interaction.status,
    }
  } catch (err) {
    return { ok: false, error: `Antigravity Agent error: ${err.message}` }
  }
}

export { RESEARCH_AGENTS, ANTIGRAVITY_AGENT }

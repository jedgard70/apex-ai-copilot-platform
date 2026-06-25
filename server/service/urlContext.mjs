/**
 * server/service/urlContext.mjs
 *
 * URL Context — Aprende o conteúdo de um site e analisa para integração.
 * Usa a Gemini Interactions API com URL Context tool.
 * Também tem fallback via fetch direto quando Interactions não disponível.
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

/**
 * Analisa uma URL e retorna informações estruturadas sobre o que encontrou.
 * @param {string} url - URL do site para analisar
 * @param {string} [question] - Pergunta específica sobre o site
 * @returns {Promise<{ ok: boolean, title?: string, summary?: string, libraries?: string[], services?: string[], integration?: string, error?: string }>}
 */
export async function analyzeUrl(url, question = '') {
  const client = getClient()

  try {
    // First try: Gemini Interactions API with URL Context tool
    if (client) {
      const prompt = question
        ? `Acesse esta URL e responda: ${question}\n\nForneça: 1) Resumo do que o site oferece 2) Bibliotecas/serviços disponíveis 3) Como instalar/configurar 4) Exemplo de código de integração.`
        : `Acesse esta URL e analise: o que este site oferece? Quais bibliotecas, SDKs, APIs ou serviços estão disponíveis? Como instalar e configurar? Forneça exemplos de código de integração.`

      const interaction = await client.interactions.create({
        model: 'gemini-3.5-flash',
        input: prompt,
        tools: [{ url: { url } }],
      })

      if (interaction?.output_text) {
        const text = interaction.output_text
        return {
          ok: true,
          title: extractTitle(text),
          summary: text.slice(0, 2000),
          fullAnalysis: text,
          source: 'gemini-interactions',
        }
      }
    }

    // Fallback: fetch direto + análise local
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'ApexAICopilot/1.0' },
    })
    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status} ao acessar ${url}` }

    const html = await resp.text()
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000)

    return {
      ok: true,
      title,
      content: textContent,
      source: 'direct-fetch',
      note: 'Conteúdo bruto extraído. Para análise mais rica, configure GEMINI_API_KEY para usar Interactions API.',
    }
  } catch (err) {
    return { ok: false, error: err.message || 'Falha ao acessar URL' }
  }
}

function extractTitle(text) {
  const match = text.match(/(?:#+|Título:|Site:|About:)\s*(.+)/i)
  return match?.[1]?.trim() || ''
}

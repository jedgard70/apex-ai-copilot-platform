/**
 * api/prompts/index.mjs — Biblioteca de Prompts Profissionais API
 *
 * GET  /api/prompts/categories      → Lista categorias
 * GET  /api/prompts/category/:id    → Detalhes + presets de uma categoria
 * GET  /api/prompts/module/:module  → Presets por módulo (archvis, directcut, chat)
 * GET  /api/prompts/search?q=       → Busca textual
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const path = req.url?.split('?')[0] || ''
    const url = new URL(req.url, 'http://localhost')
    const mod = await import('../../server/service/promptLibrary.mjs')

    // GET /api/prompts/categories
    if (path === '/api/prompts/categories' && req.method === 'GET') {
      return res.status(200).json({ providerStatus: 'connected', categories: mod.getPromptCategories() })
    }

    // GET /api/prompts/category/:id
    if (path?.startsWith('/api/prompts/category/') && req.method === 'GET') {
      const id = path.replace('/api/prompts/category/', '')
      const cat = mod.getCategoryById(id)
      if (!cat) return res.status(404).json({ error: 'Category not found' })
      return res.status(200).json({ providerStatus: 'connected', category: cat })
    }

    // GET /api/prompts/module/:module
    if (path?.startsWith('/api/prompts/module/') && req.method === 'GET') {
      const module = path.replace('/api/prompts/module/', '')
      return res.status(200).json({ providerStatus: 'connected', presets: mod.getPresetsByModule(module) })
    }

    // GET /api/prompts/search?q=
    if (path === '/api/prompts/search' && req.method === 'GET') {
      const q = url.searchParams.get('q') || ''
      return res.status(200).json({ providerStatus: 'connected', results: mod.searchPrompts(q) })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[prompts] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

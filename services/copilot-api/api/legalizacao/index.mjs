export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const body = (req.method === 'POST') ? (typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}')) : {}
    const path = req.url?.split('?')[0] || ''
    
    // Import do mock / DB layer
    const mod = await import('../../server/service/legalizacao.mjs')

    if (path === '/api/legalizacao/update-status' && req.method === 'POST') {
      const { processo_id, dbe_recibo, dbe_identificacao } = body
      if (!processo_id || !dbe_recibo || !dbe_identificacao) {
        return res.status(400).json({ error: 'Parâmetros processo_id, dbe_recibo e dbe_identificacao são obrigatórios.' })
      }
      
      const atualizado = mod.updateProcessoStatus(processo_id, dbe_recibo, dbe_identificacao)
      if (!atualizado) {
        return res.status(404).json({ error: 'Processo não encontrado.' })
      }

      return res.status(200).json({ success: true, processo: atualizado })
    }
    
    if (path === '/api/legalizacao/list' && req.method === 'GET') {
      return res.status(200).json({ processos: mod.listProcessos() })
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    console.error('[legalizacao] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

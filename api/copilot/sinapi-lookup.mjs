import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let sinapiData = null
function getSinapi() {
  if (!sinapiData) {
    const p = join(__dirname, '../../src/data/sinapi-2024.json')
    sinapiData = JSON.parse(readFileSync(p, 'utf8'))
  }
  return sinapiData
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' })
    res.end()
    return
  }
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const q = (url.searchParams.get('q') || '').toLowerCase().trim()
  const categoria = (url.searchParams.get('categoria') || '').toLowerCase().trim()
  const regiao = (url.searchParams.get('regiao') || 'SP').toUpperCase()
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)

  const data = getSinapi()
  const validRegioes = ['SP', 'RJ', 'MG']
  const regiaoKey = validRegioes.includes(regiao) ? regiao : 'SP'

  let items = data.items || []

  if (q) {
    const terms = q.split(/\s+/).filter(Boolean)
    items = items.filter(item =>
      terms.every(t =>
        item.descricao?.toLowerCase().includes(t) ||
        item.codigo?.toLowerCase().includes(t) ||
        item.categoria?.toLowerCase().includes(t) ||
        item.unidade?.toLowerCase().includes(t)
      )
    )
  }

  if (categoria) {
    items = items.filter(i => i.categoria?.toLowerCase().includes(categoria))
  }

  const results = items.slice(0, limit).map(item => ({
    codigo: item.codigo,
    descricao: item.descricao,
    unidade: item.unidade,
    categoria: item.categoria,
    preco: item.precos?.[regiaoKey] ?? null,
    regiao: regiaoKey,
    referencia: data.referencia || '2024',
  }))

  return sendJson(res, 200, {
    total: items.length,
    returned: results.length,
    regiao: regiaoKey,
    referencia: data.referencia || '2024',
    items: results,
  })
}

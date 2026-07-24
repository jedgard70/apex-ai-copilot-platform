// SINAPI lookup endpoint
// GET /api/sinapi-lookup?q=cimento&categoria=Materiais&regiao=SP&limit=20
// Returns SINAPI 2024 price data filtered by query, category, and region

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let _sinapi = null
export function getSinapi() {
  if (!_sinapi) {
    const dataPath = resolve(__dirname, '../src/data/sinapi-2024.json')
    _sinapi = JSON.parse(readFileSync(dataPath, 'utf-8'))
  }
  return _sinapi
}

export function lookup({ q, categoria, regiao = 'SP', limit = 20 }) {
  let results = getSinapi()

  if (q) {
    const ql = q.toLowerCase()
    results = results.filter(item =>
      item.descricao.toLowerCase().includes(ql) ||
      item.codigo.includes(ql) ||
      item.categoria.toLowerCase().includes(ql)
    )
  }

  if (categoria) {
    const cl = categoria.toLowerCase()
    results = results.filter(item => item.categoria.toLowerCase().includes(cl))
  }

  const precoKey = `preco_${regiao.toLowerCase()}`

  return results.slice(0, Number(limit)).map(item => ({
    codigo: item.codigo,
    descricao: item.descricao,
    unidade: item.unidade,
    preco: item[precoKey] ?? item.preco_sp,
    regiao,
    categoria: item.categoria,
  }))
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'public, max-age=86400')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { q, categoria, regiao, limit } = req.query
    const results = lookup({ q, categoria, regiao, limit })
    return res.status(200).json({
      results,
      total: results.length,
      regiao: regiao || 'SP',
      source: 'SINAPI-2024',
    })
  } catch (err) {
    console.error('[sinapi-lookup] Error:', err.message)
    return res.status(500).json({ error: err.message || 'sinapi_lookup_failed' })
  }
}

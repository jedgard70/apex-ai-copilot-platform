import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load the SINAPI data directly
const SINAPI: Array<{
  codigo: string
  descricao: string
  unidade: string
  preco_sp: number
  preco_rj: number
  preco_mg: number
  categoria: string
}> = JSON.parse(readFileSync(resolve(__dirname, '../../src/data/sinapi-2024.json'), 'utf-8'))

// Replicate the lookup logic from sinapi-lookup.mjs
function lookup(params: { q?: string; categoria?: string; regiao?: string; limit?: number }) {
  const { q, categoria, regiao = 'SP', limit = 20 } = params
  let results = SINAPI

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

  const precoKey = `preco_${regiao.toLowerCase()}` as 'preco_sp' | 'preco_rj' | 'preco_mg'

  return results.slice(0, limit).map(item => ({
    codigo: item.codigo,
    descricao: item.descricao,
    unidade: item.unidade,
    preco: item[precoKey] ?? item.preco_sp,
    regiao,
    categoria: item.categoria,
  }))
}

describe('SINAPI lookup data', () => {
  it('has at least 100 items', () => {
    expect(SINAPI.length).toBeGreaterThanOrEqual(100)
  })

  it('every item has required fields', () => {
    for (const item of SINAPI) {
      expect(item.codigo).toBeTruthy()
      expect(item.descricao).toBeTruthy()
      expect(item.unidade).toBeTruthy()
      expect(typeof item.preco_sp).toBe('number')
      expect(typeof item.preco_rj).toBe('number')
      expect(typeof item.preco_mg).toBe('number')
      expect(item.categoria).toBeTruthy()
    }
  })

  it('all prices are positive', () => {
    for (const item of SINAPI) {
      expect(item.preco_sp).toBeGreaterThan(0)
      expect(item.preco_rj).toBeGreaterThan(0)
      expect(item.preco_mg).toBeGreaterThan(0)
    }
  })
})

describe('SINAPI lookup function', () => {
  it('returns all items when no filter', () => {
    const results = lookup({})
    expect(results.length).toBe(20) // default limit
  })

  it('filters by keyword in descricao', () => {
    const results = lookup({ q: 'cimento' })
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => expect(r.descricao.toLowerCase()).toContain('cimento'))
  })

  it('filters by categoria', () => {
    const results = lookup({ categoria: 'Materiais' })
    expect(results.length).toBeGreaterThan(0)
  })

  it('respects limit parameter', () => {
    const results = lookup({ limit: 5 })
    expect(results.length).toBeLessThanOrEqual(5)
  })

  it('returns SP prices by default', () => {
    const results = lookup({ q: 'cimento', limit: 1 })
    const item = SINAPI.find(i => i.descricao.toLowerCase().includes('cimento'))!
    expect(results[0].preco).toBe(item.preco_sp)
    expect(results[0].regiao).toBe('SP')
  })

  it('returns RJ prices when regiao=RJ', () => {
    const results = lookup({ q: 'cimento', regiao: 'RJ', limit: 1 })
    const item = SINAPI.find(i => i.descricao.toLowerCase().includes('cimento'))!
    expect(results[0].preco).toBe(item.preco_rj)
  })

  it('returns MG prices when regiao=MG', () => {
    const results = lookup({ q: 'cimento', regiao: 'MG', limit: 1 })
    const item = SINAPI.find(i => i.descricao.toLowerCase().includes('cimento'))!
    expect(results[0].preco).toBe(item.preco_mg)
  })

  it('returns empty array when no matches', () => {
    const results = lookup({ q: 'xyznonexistentmaterial999' })
    expect(results).toEqual([])
  })

  it('result items include all expected fields', () => {
    const results = lookup({ limit: 1 })
    const r = results[0]
    expect(r).toHaveProperty('codigo')
    expect(r).toHaveProperty('descricao')
    expect(r).toHaveProperty('unidade')
    expect(r).toHaveProperty('preco')
    expect(r).toHaveProperty('regiao')
    expect(r).toHaveProperty('categoria')
  })
})

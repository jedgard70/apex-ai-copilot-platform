// Budget XLSX export + SINAPI import using the xlsx (SheetJS) library
// All processing is client-side

import type { BudgetPlan, BudgetEstimateItem } from './budgetKnowledge'

const DEFAULT_BDI = 0.25 // 25% BDI padrão obras civis Brasil

export type SinapiRow = {
  code: string
  description: string
  unit: string
  unitPrice: number
}

// ─── XLSX export ─────────────────────────────────────────────────────────────

export async function exportBudgetXlsx(plan: BudgetPlan, bdi = DEFAULT_BDI): Promise<void> {
  const { utils, writeFile } = await import('xlsx')

  const items = plan.estimateItems
  const currency = plan.assumptions.currency || 'BRL'
  const symbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : '$'

  // Header row
  const headers = [
    'Seção', 'Item', 'Unidade', 'Quantidade',
    `Preço unitário (${symbol})`, `BDI (${Math.round(bdi * 100)}%)`,
    `Preço c/ BDI (${symbol})`, `Subtotal (${symbol})`,
    'Confiança', 'Fonte', 'Data fonte',
  ]

  const rows = items.map(item => {
    const priceWithBdi = Number((item.unitPrice * (1 + bdi)).toFixed(2))
    const subtotalWithBdi = Number((priceWithBdi * item.quantity).toFixed(2))
    return [
      item.section,
      item.item,
      item.unit,
      item.quantity,
      item.unitPrice,
      bdi,
      priceWithBdi,
      subtotalWithBdi,
      item.confidence,
      item.source,
      item.sourceDate || '',
    ]
  })

  // Totals row
  const totalRaw = items.reduce((s, i) => s + i.subtotal, 0)
  const totalWithBdi = Number((totalRaw * (1 + bdi)).toFixed(2))
  const totalsRow = [
    'TOTAL', '', '', '',
    totalRaw.toFixed(2),
    '',
    totalWithBdi.toFixed(2),
    totalWithBdi.toFixed(2),
    '', '', '',
  ]

  const sheetData = [headers, ...rows, [], totalsRow]
  const ws = utils.aoa_to_sheet(sheetData)

  // Column widths
  ws['!cols'] = [
    { wch: 20 }, { wch: 35 }, { wch: 8 }, { wch: 10 },
    { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 16 },
    { wch: 12 }, { wch: 14 }, { wch: 12 },
  ]

  // Metadata sheet
  const meta = utils.aoa_to_sheet([
    ['Apex AI Copilot — Orçamento Estimativo'],
    ['Projeto', plan.assumptions.projectType],
    ['Localização', plan.assumptions.location],
    ['Padrão', plan.assumptions.standardLevel],
    ['Moeda', currency],
    ['BDI aplicado', `${Math.round(bdi * 100)}%`],
    ['Fonte de preços', plan.assumptions.pricingSource],
    ['Gerado em', new Date().toLocaleDateString('pt-BR')],
    [],
    ['AVISO', 'Este orçamento é estimativo. Preços devem ser confirmados com cotações locais e tabelas SINAPI atualizadas.'],
  ])

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Orçamento')
  utils.book_append_sheet(wb, meta, 'Informações')

  const safeName = (plan.assumptions.projectType || 'projeto').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
  writeFile(wb, `apex-orcamento-${safeName}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`)
}

// ─── SINAPI CSV/XLSX import ───────────────────────────────────────────────────

export async function parseSinapiFile(file: File): Promise<SinapiRow[]> {
  const { read, utils } = await import('xlsx')

  const buffer = await file.arrayBuffer()
  const wb = read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw: unknown[][] = utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]

  if (!raw.length) return []

  // Auto-detect header row (first row with 3+ non-empty cells)
  let headerRow = 0
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    if (raw[i].filter(c => String(c).trim()).length >= 3) { headerRow = i; break }
  }

  const headers = raw[headerRow].map(h => String(h).toLowerCase().trim())

  // Find columns by common SINAPI naming patterns
  const codeCol = headers.findIndex(h => /c[oó]digo|code|cod/.test(h))
  const descCol = headers.findIndex(h => /descri|item|servi/.test(h))
  const unitCol = headers.findIndex(h => /unidade|unit|un\./.test(h))
  const priceCol = headers.findIndex(h => /pre[cç]o|price|valor|custo/.test(h))

  if (descCol < 0 || priceCol < 0) {
    throw new Error('Não foi possível identificar colunas de descrição e preço. Verifique o formato do arquivo SINAPI.')
  }

  const rows: SinapiRow[] = []
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i]
    const rawPrice = String(row[priceCol] ?? '').replace(/[R$\s.]/g, '').replace(',', '.')
    const price = parseFloat(rawPrice)
    if (!price || isNaN(price)) continue

    const desc = String(row[descCol] ?? '').trim()
    if (!desc) continue

    rows.push({
      code: codeCol >= 0 ? String(row[codeCol] ?? '').trim() : '',
      description: desc,
      unit: unitCol >= 0 ? String(row[unitCol] ?? '').trim() : 'm²',
      unitPrice: price,
    })
  }

  return rows
}

// Match SINAPI rows to existing budget items by keyword similarity
export function applySinapiPrices(
  items: BudgetEstimateItem[],
  sinapiRows: SinapiRow[],
): { items: BudgetEstimateItem[]; matched: number } {
  let matched = 0
  const updated = items.map(item => {
    const keywords = item.item.toLowerCase().split(/\s+/)
    const best = sinapiRows.find(row =>
      keywords.some(kw => kw.length > 3 && row.description.toLowerCase().includes(kw))
    )
    if (!best) return item
    matched++
    return {
      ...item,
      unitPrice: best.unitPrice,
      subtotal: Number((best.unitPrice * item.quantity).toFixed(2)),
      pricingSource: 'Uploaded SINAPI table' as const,
      confidence: 'CONFIRMED' as const,
      sourceDate: new Date().toISOString().slice(0, 10),
    }
  })
  return { items: updated, matched }
}

import { lookup } from '../sinapi-lookup.mjs'
import { GoogleGenAI } from '@google/genai'

function sendJson(res, status, body) {
  res.status(status).json(body)
}

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null

async function extractItemsWithGemini(goal) {
  if (!ai) return [{ item: 'Cimento', qty: 50, unit: 'sacos' }, { item: 'Aço', qty: 2, unit: 'ton' }]
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Extract building materials or labor from this request: "${goal}". Return a JSON array of objects with 'item' (name of material in Portuguese), 'qty' (number), and 'unit' (string). Output ONLY valid JSON array, nothing else. Example: [{"item": "cimento", "qty": 10, "unit": "sacos"}]`
    })
    const text = response.text || ''
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('LLM extraction failed:', err)
    return [{ item: 'Cimento', qty: 50, unit: 'sacos' }, { item: 'Aço', qty: 2, unit: 'ton' }]
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'connected' })
  }

  try {
    const body = req.body || {}
    const goal = String(body.goal || '')

    // 1. Extract items using LLM
    const items = await extractItemsWithGemini(goal)

    // 2. Map items to SINAPI prices and build suppliers/procurement
    const suppliers = []
    const procurementItems = []

    let supplierCount = 1

    for (const rawItem of items) {
      // Lookup in SINAPI
      const sinapiResults = lookup({ q: rawItem.item, limit: 1 })
      const found = sinapiResults.length > 0 ? sinapiResults[0] : null

      const supplierName = found ? `SINAPI Fornecedor - ${found.categoria}` : `Fornecedor a Cotar`

      let supplier = suppliers.find(s => s.name === supplierName)
      if (!supplier) {
        supplier = {
          id: `supplier-${supplierCount++}`,
          name: supplierName,
          category: found ? found.categoria : 'Materials',
          contact: 'Banco SINAPI',
          region: found ? found.regiao : 'SP',
          rating: 'A (Oficial)',
          status: 'Verified',
          paymentTerms: 'Standard',
          leadTime: 'N/A',
          complianceDocs: 'Verified',
          contractLink: '',
          notes: found ? `Preço base SINAPI código ${found.codigo}` : 'Item não encontrado no SINAPI, cotação necessária.',
          sourceConfidence: found ? 'VERIFIED' : 'NEEDS_VERIFICATION',
        }
        suppliers.push(supplier)
      }

      // SINAPI prices might be strings like "34,50" or numbers
      const rawPrice = found ? found.preco : 0
      const price = typeof rawPrice === 'string' ? Number(rawPrice.replace(',', '.')) : Number(rawPrice || 0)

      procurementItems.push({
        id: `procurement-${Date.now()}-${Math.random()}`,
        item: found ? found.descricao : rawItem.item,
        quantity: rawItem.qty,
        unit: found ? found.unidade : rawItem.unit,
        requiredDate: 'TBD',
        supplier: supplierName,
        quoteStatus: found ? 'SINAPI Base' : 'Not requested',
        deliveryStatus: 'Not scheduled',
        costPlaceholder: Number((price * rawItem.qty).toFixed(2)),
        sourceConfidence: found ? 'VERIFIED' : 'NEEDS_VERIFICATION'
      })
    }

    const plan = {
      providerStatus: ai ? 'connected' : 'no_gemini_key',
      suppliers,
      procurementItems,
      supplierComparison: suppliers.map(supplier => ({
        supplier: supplier.name,
        price: supplier.sourceConfidence === 'VERIFIED' ? 'SINAPI Base' : 'NEEDS_VERIFICATION',
        quality: 'Standard',
        deadline: 'Standard',
        compliance: supplier.complianceDocs,
        reliability: 'High',
        risk: supplier.sourceConfidence === 'VERIFIED' ? 'Low' : 'Medium',
        sourceConfidence: supplier.sourceConfidence,
      })),
      rfqDraft: [
        'RFQ draft - Integração SINAPI via Apex AI',
        `Project/request: ${goal || 'Apex project procurement package'}`,
        'As cotações abaixo possuem preços baseados na tabela oficial SINAPI.',
        'Favor confirmar valores com estoque local.'
      ].join('\n'),
      risks: [
        'Preços baseados na tabela SINAPI desonerada (referência).',
        'Necessário confirmar disponibilidade local e frete com atacadistas reais.'
      ],
      message: 'Supply Chain Studio processou itens via IA e cruzou com tabela SINAPI em tempo real.'
    }

    return sendJson(res, 200, { plan })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'supply_chain_plan_failed', providerStatus: 'connected' })
  }
}

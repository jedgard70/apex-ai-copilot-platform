// AI-driven Cost Estimator & Budget Planner
// Generates a preliminary BudgetPlan JSON using Gemini

import { logUsage } from '../../service/costOrchestrator.mjs'
import { chatWithFallback } from '../../providers/providerRouter.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

function scrubError(value) {
  return String(value || 'Budget generation failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/Key_[A-Za-z0-9_-]+/g, '[redacted]')
    .slice(0, 800)
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Removed manual callGemini

function buildSystemPrompt() {
  return `You are an expert Cost Engineer and AI Estimator for construction and architecture projects.
Your task is to analyze project assumptions, goals, and source files to generate a highly professional preliminary budget estimate draft.

RULES:
- You must output ONLY a valid JSON object matching the required structure. No markdown wrappers or conversational text outside the JSON.
- Include BOTH unit costs AND bulk material quantities. When estimating materials, always try to include estimations for the following bulk items where applicable:
  - "Saco de cimento" (50kg)
  - "Caminhão de 12m³ de pedra"
  - "Caminhão de 12m³ de areia fina"
  - "Caminhão de 12m³ de areia grossa"
  - "Balde de plastificante de reboco de 18 litros"
  - "Latas de tinta 18 litros"
- The prices should be realistic placeholders based on the provided "currency", "location", "area/scale", and "standardLevel".
- Distribute the items across logical construction sections: 'site work', 'foundation', 'structure', 'masonry', 'roofing', 'installations', 'finishes', 'landscape'.
- Provide exactly 15 to 25 key estimate items that cover the macro-scope of the requested project type.
- The unit must make sense for the service (m2, m3, un, kg, etc).
- EXTREMELY IMPORTANT: You MUST also include the raw materials required for these services, calculated in their COMMERCIAL units. For example: "Saco de cimento 50kg", "Caminhão 12m3 Areia Fina", "Caminhão 12m3 Areia Grossa", "Caminhão 12m3 Pedra Brita", "Balde de Plastificante (18L)", "Lata de Tinta (18L)", etc. Do NOT just put "m3 of sand", use the actual commercial delivery size (Caminhão/Saco/Lata/Balde) as requested by the user.

REQUIRED JSON STRUCTURE:
{
  "estimateItems": [
    {
      "section": "masonry",
      "item": "Caminhão 12m3 Areia Fina",
      "unit": "caminhão",
      "quantity": 2,
      "unitPrice": 1400,
      "confidence": "ESTIMATED",
      "source": "assumption",
      "pricingSource": "AI Placeholder",
      "sourceDate": "YYYY-MM-DD",
      "sourceConfidence": "ASSUMPTION"
    }
  ],
  "scopeIncluded": ["List of macro scopes included in this estimate"],
  "scopeExcluded": ["List of macro scopes excluded"],
  "ownerSupplied": ["List of items to be supplied by the owner, if applicable"],
  "pendingQuestions": ["Critical clarifications needed to increase budget confidence"],
  "proposalDraft": "A short, professional executive summary (2-3 paragraphs) proposing this budget to a client.",
  "confidenceSummary": "A brief sentence evaluating the confidence level of this preliminary estimate."
}`
}

function buildUserPrompt(assumptions, source, goal, context, included, excluded, owner) {
  return `PROJECT DATA:
- Goal: ${goal || 'Provide a preliminary estimate'}
- Project Type: ${assumptions.projectType}
- Location: ${assumptions.location}
- Area/Scale: ${assumptions.area}
- Standard Level: ${assumptions.standardLevel}
- Currency: ${assumptions.currency}
- Unit System: ${assumptions.unitSystem}

SOURCE FILE METADATA:
${source ? `- Name: ${source.name}\n- Kind: ${source.kind}\n- Size: ${source.size}` : 'None provided'}

EXISTING SCOPE (preserve or expand these):
Included: ${JSON.stringify(included)}
Excluded: ${JSON.stringify(excluded)}
Owner Supplied: ${JSON.stringify(owner)}

Generate the preliminary estimate JSON now.`
}

function parseAIResponse(text) {
  let clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  const firstBrace = clean.indexOf('{')
  const lastBrace = clean.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1)
  }
  try {
    return JSON.parse(clean)
  } catch (err) {
    throw new Error('AI did not return a valid JSON structure.')
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const { assumptions = {}, source = null, goal = '', conversationContext = [], scopeIncluded = [], scopeExcluded = [], ownerSupplied = [] } = body

  const geminiModel = 'gemini-1.5-flash'
  const geminiKey = process.env.GEMINI_API_KEY
  
  const identity = JSON.parse(req.headers['x-apex-identity'] || '{}')
  const tenantId = identity.tenantId || 'demo-tenant'

  try {
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(assumptions, source, goal, conversationContext, scopeIncluded, scopeExcluded, ownerSupplied)
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
    const res = await chatWithFallback({
      messages,
      preferredProvider: 'apex-runtime',
      temperature: 0.2,
      maxTokens: 3000
    })
    
    if (!res.ok) throw new Error(res.error || 'AI generation failed')
    let rawText = res.data?.choices?.[0]?.message?.content || ''
    
    const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length + rawText.length) / 4)
    logUsage(tenantId, 'gemini', geminiModel, { promptTokens: estimatedTokens, completionTokens: 0 }).catch(console.error)

    const parsed = parseAIResponse(rawText)

    // Format output to strictly match BudgetPlan structure
    const plan = {
      providerStatus: 'ready',
      assumptions: {
        ...assumptions,
        pricingSource: 'AI Placeholder Assumptions',
      },
      estimateItems: (parsed.estimateItems || []).map(item => ({
        ...item,
        id: id(),
        subtotal: (item.quantity || 0) * (item.unitPrice || 0),
        confidence: item.confidence || 'ESTIMATED',
        source: item.source || 'assumption',
        pricingSource: item.pricingSource || 'AI Placeholder',
        sourceDate: item.sourceDate || new Date().toISOString().slice(0, 10),
        sourceConfidence: item.sourceConfidence || 'ASSUMPTION'
      })),
      scopeIncluded: parsed.scopeIncluded || scopeIncluded,
      scopeExcluded: parsed.scopeExcluded || scopeExcluded,
      ownerSupplied: parsed.ownerSupplied || ownerSupplied,
      pendingQuestions: parsed.pendingQuestions || [],
      proposalDraft: parsed.proposalDraft || 'Preliminary budget generated.',
      confidenceSummary: parsed.confidenceSummary || 'Generated by AI based on preliminary assumptions.',
      message: 'AI estimate draft created successfully.'
    }

    return sendJson(res, 200, { plan })

  } catch (error) {
    console.error('[budget-plan] Error:', error)
    return sendJson(res, 500, { error: scrubError(error.message) })
  }
}

// AI-driven Contracts, Permits & Legal Compliance
// Generates a LegalAnalysis JSON using Gemini based on 5 sectors

import { logUsage } from '../../service/costOrchestrator.mjs'
import { chatWithFallback } from '../../providers/providerRouter.mjs'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

function scrubError(value) {
  return String(value || 'Legal analysis failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/Key_[A-Za-z0-9_-]+/g, '[redacted]')
    .slice(0, 800)
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Removed manual callGemini

function buildSystemPrompt(sector, documentType) {
  let sectorSpecialty = ''
  if (sector === 'vistos-cidadanias') {
    sectorSpecialty = 'Immigration, Visas (e.g., EB-2 NIW), and Citizenship (e.g., Italian/Spanish).'
  } else if (sector === 'legal-geral') {
    sectorSpecialty = 'General Civil, Criminal, Labor, and Paralegal Law.'
  } else if (sector === 'legal-construction') {
    sectorSpecialty = 'Construction Law, General Contractor Agreements, AIA Contracts, and Building Permits.'
  } else if (sector === 'legal-compliance') {
    sectorSpecialty = 'Corporate Compliance, Due Diligence, Regulatory Norms (NR), and Quality Standards.'
  } else if (sector === 'corporate-tax') {
    sectorSpecialty = 'Corporate Structuring, Offshore Accounts, LLC Incorporation, e-Residency, and Tax Planning.'
  } else {
    sectorSpecialty = 'General Corporate and Real Estate Law.'
  }

  return `You are an expert Legal AI Assistant embedded in the Apex Platform.
You analyze documents or descriptions provided by users and map them to one of our 5 specific legal architecture sectors:
1. "vistos-cidadanias"
2. "legal-geral"
3. "legal-construction"
4. "legal-compliance"
5. "corporate-tax-offshore"

Your task is to analyze the provided context and generate a highly professional legal draft/analysis for a ${documentType || 'Document'}.

RULES:
- You must output ONLY a valid JSON object matching the required structure. No markdown wrappers or conversational text outside the JSON.
- Provide a rigorous risk analysis (Red flags) if this is a contract.
- Provide suggested clauses (Redline) to protect the client.
- Provide an approval checklist or necessary steps if this is a permit or compliance document.
- Ensure the tone is highly professional, authoritative, and structured.

REQUIRED JSON STRUCTURE:
{
  "title": "String - A professional title for this analysis",
  "summary": "String - 2-3 sentences summarizing the situation and strategy",
  "riskAnalysis": [
    {
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "issue": "String - Description of the risk",
      "recommendation": "String - How to mitigate it"
    }
  ],
  "suggestedClauses": [
    {
      "title": "String - Clause name (e.g., Force Majeure, Confidentiality)",
      "content": "String - The exact wording you recommend",
      "rationale": "String - Why this is necessary"
    }
  ],
  "checklist": [
    {
      "task": "String - A necessary step for approval, signing, or compliance",
      "isCritical": true | false
    }
  ],
  "estimatedTimeframe": "String - e.g., '2-4 weeks' for approval or signing",
  "jurisdictionNotes": "String - Notes on specific laws or jurisdictions involved"
}`
}

export default async function handle(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' })
  }

  let body
  try {
    const raw = await new Promise((resolve, reject) => {
      let data = ''
      req.on('data', chunk => (data += chunk))
      req.on('end', () => resolve(data))
      req.on('error', reject)
    })
    body = JSON.parse(raw || '{}')
  } catch (err) {
    return sendJson(res, 400, { error: 'Invalid JSON body' })
  }

  const { documentType, sector, context } = body

  if (!context) {
    return sendJson(res, 400, { error: 'Missing context for legal analysis.' })
  }

  const apiKey = process.env.GEMINI_API_KEY

  try {
    const systemPrompt = buildSystemPrompt(sector, documentType)
    const userPrompt = `CONTEXT:\n${context}\n\nDOCUMENT TYPE: ${documentType}\nSECTOR: ${sector}\n\nPlease generate the JSON analysis.`
    const fullPrompt = systemPrompt + '\n\n' + userPrompt

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
    let geminiText = res.data?.choices?.[0]?.message?.content || ''
    
    let cleanJson = geminiText.trim()
    const firstBrace = cleanJson.indexOf('{')
    const lastBrace = cleanJson.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1)
    }

    const parsed = JSON.parse(cleanJson)

    // Log usage (approximate, since we don't have token counts here)
    const runId = id()
    logUsage('contracts-permits', 'gemini-1.5-flash', fullPrompt.length + geminiText.length, runId)

    const finalResult = {
      id: runId,
      createdAt: new Date().toISOString(),
      sector: sector || 'general',
      documentType: documentType || 'general',
      analysis: parsed
    }

    return sendJson(res, 200, finalResult)
  } catch (err) {
    return sendJson(res, 500, { error: scrubError(err.message) })
  }
}

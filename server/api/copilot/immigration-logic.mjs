function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

function scrubError(value) {
  return String(value || 'Request failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/Key_[A-Za-z0-9_-]+/g, '[redacted]')
    .slice(0, 800)
}

async function callGemini(apiKey, model, prompt) {
  if (!model) model = 'gemini-3.5-flash'
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048, responseMimeType: 'application/json' },
      }),
    }
  )
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(scrubError(data?.error?.message || `Gemini HTTP ${resp.status}`))
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callApexOwnEngine(prompt) {
  const engineUrls = [
    process.env.APEX_OWN_ENGINE_URL,
    process.env.APEX_API_URL,
    process.env.LOCAL_WORKER_URL,
  ].filter(Boolean)

  for (const engineUrl of engineUrls) {
    try {
      const token = process.env.APEX_API_TOKEN || process.env.LOCAL_WORKER_TOKEN || ''
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const resp = await fetch(`${String(engineUrl).replace(/\/$/, '')}/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'apex-ai',
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          maxTokens: 2048,
        }),
        signal: AbortSignal.timeout(30000),
      })
      if (!resp.ok) continue
      const data = await resp.json().catch(() => ({}))
      const text = data.reply || data.finalReply || data.choices?.[0]?.message?.content || ''
      if (text) return text
    } catch (_) { /* try next Apex endpoint */ }
  }
  return ''
}

function parseAiResponse(text) {
  const clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(clean) } catch { return null }
}

function buildSystemPrompt() {
  return `You are Apex Legal Engine, a senior Global Legal Paralegal AI specializing in both U.S. Immigration and Offshore Corporate Structuring (Estonia, Panama, Uruguay, etc.). 
Your goal is to draft professional, factual, and legally sound documents (Cover Letters, Applicant Statements, Business Plans, KYC Forms, Foundation Summaries) based on the user's data and category. 

Your output MUST be valid JSON matching the exact structure requested. 
Tone: Objective, institutional, direct (no fluff or emotional pleas). Always write the drafted documents in ENGLISH (or the official language of the jurisdiction, if appropriate).`
}

function buildUserPrompt(visaId, formData) {
  return `Draft the required immigration documents for the following case:

VISA CATEGORY ID: ${visaId}
APPLICANT DATA:
- Full Name: ${formData.fullName || 'John Doe'}
- Overstayed: ${formData.overstayed || 'no'}
- Reason given for overstay: ${formData.overstayReason || 'N/A'}
- Sponsor Name: ${formData.sponsorName || 'N/A'}
- Sponsor Occupation: ${formData.sponsorJob || 'N/A'}

Based on the Visa Category ID, generate the appropriate documents.
If IR-5/Family: Generate a 'Statement of Applicant' addressing the relationship and addressing any overstay purely factually (voluntary departure).
If EB-2 NIW: Generate a 'Proposed Endeavor' summary based on the applicant's profile (make reasonable professional assumptions if data is lacking) and a 'Cover Letter' framework.
If Offshore (Estonia/Panama/Uruguay): Generate a 'Corporate Setup Summary' analyzing tax benefits and a 'KYC / Initial Filing Draft'.
If L-1A/E-2: Generate a short Executive Summary for a Business Plan.

Return ONLY this JSON structure, no markdown:
{
  "document1": {
    "title": "Title of the first document (e.g. Statement of Applicant)",
    "content": "The full drafted text of the document in English."
  },
  "document2": {
    "title": "Title of the second document (if applicable, else empty)",
    "content": "The full drafted text in English or empty string."
  },
  "legalRiskAnalysis": "A short paragraph in Portuguese analyzing the provided data against INA 212(a) (e.g. 3/10 year bars, sponsor requirements).",
  "formFillerGuide": {
    "formName": "Name of the main form (e.g. I-130 / DS-260)",
    "fields": [
      { "question": "Question from form (e.g. Have you ever overstayed?)", "suggestedAnswer": "Exact phrase the user should copy-paste (e.g. YES. Voluntarily departed in [Date])." },
      { "question": "Another tricky question", "suggestedAnswer": "Suggested answer" }
    ]
  },
  "protocolInstructions": {
    "department": "Where to submit (e.g. USCIS Online Portal or Dallas Lockbox)",
    "fee": "Estimated Government Fee (e.g. $675)",
    "steps": [
      "Step 1 to submit",
      "Step 2 to submit",
      "Step 3..."
    ]
  }
}`
}

function getLocalFallback(visaId) {
  if (visaId === 'eb2-niw') {
    return {
      document1: {
        title: "EB-2 NIW Proposed Endeavor Summary",
        content: "The applicant proposes to advance the field of [Industry] in the United States by implementing innovative methodologies. This endeavor holds substantial intrinsic merit and national importance."
      },
      document2: { title: "", content: "" },
      legalRiskAnalysis: "Verifique se o candidato possui as publicações ou experiência de 10 anos necessárias para o I-140.",
      formFillerGuide: {
        formName: "I-140 (Immigrant Petition for Alien Worker)",
        fields: [
          { question: "Part 4. Information About Your Proposed Employment - SOC Code", suggestedAnswer: "De acordo com a DOL (ex: 11-9041 para Eng. Manager)" },
          { question: "Part 6. Basic Information About the Proposed Employment", suggestedAnswer: "National Interest Waiver - Self Petition" }
        ]
      },
      protocolInstructions: {
        department: "USCIS (Texas ou Nebraska Service Center)",
        fee: "$715 (I-140) + opcional $2,805 (Premium Processing)",
        steps: [
          "Imprima e assine o I-140 em tinta preta.",
          "Anexe o cheque nominal ao U.S. Department of Homeland Security.",
          "Envie o pacote de evidências por FedEx/UPS com tracking."
        ]
      }
    }
  }
  return {
    document1: {
      title: "Statement of Applicant",
      content: "I respectfully submit this statement in support of my application. I acknowledge my previous travel history and affirm my intent to comply with all U.S. laws."
    },
    document2: { title: "", content: "" },
    legalRiskAnalysis: "O caso familiar exige a comprovação financeira do Sponsor (Formulário I-864) acompanhado do LES ou Tax Transcripts.",
    formFillerGuide: {
      formName: "I-130 & DS-260",
      fields: [
        { question: "Have you ever remained in the U.S. longer than permitted?", suggestedAnswer: "YES. Voluntarily departed in July 2008." },
        { question: "Class of Admission at Last Entry", suggestedAnswer: "B2 (Visitor for Pleasure)" },
        { question: "A-Number (if any)", suggestedAnswer: "Deixe em branco se nunca esteve em processo de deportação." }
      ]
    },
    protocolInstructions: {
      department: "USCIS Online Portal (my.uscis.gov)",
      fee: "$675 (I-130 Paper) ou $625 (Online)",
      steps: [
        "O Sponsor (Cidadão Americano) deve criar a conta no my.uscis.gov",
        "Preencher o I-130 online usando as respostas acima.",
        "Fazer o upload da Certidão de Casamento/Nascimento e Prova de Cidadania na aba Evidências.",
        "Pagar a taxa online com cartão de crédito."
      ]
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const visaId = String(body.visaId || 'ir5-military')
    const formData = body.formData || {}

    const geminiKey = process.env.GEMINI_API_KEY
    const fallback = getLocalFallback(visaId)
    const prompt = buildUserPrompt(visaId, formData)

    const apexText = await callApexOwnEngine(prompt)
    const apexData = apexText ? parseAiResponse(apexText) : null
    if (apexData) {
      return sendJson(res, 200, { documents: apexData, providerStatus: 'apex-ai-own-engine' })
    }

    if (geminiKey) {
      const rawText = await callGemini(geminiKey, 'gemini-3.5-flash', `${buildSystemPrompt()}\n\n${prompt}`)
      const aiData = parseAiResponse(rawText)
      if (aiData) {
        return sendJson(res, 200, { documents: aiData, providerStatus: 'gemini' })
      }
    }

    return sendJson(res, 200, { documents: fallback, providerStatus: 'LOCAL_FALLBACK' })
  } catch (error) {
    return sendJson(res, 500, { error: String(error) })
  }
}

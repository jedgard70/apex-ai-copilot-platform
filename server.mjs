import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname
const dist = path.join(root, 'dist')
const runtimeKnowledgePath = path.join(root, 'src', 'lib', 'runtimeKnowledge.json')

loadEnvLocal()

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}

function loadRuntimeKnowledge() {
  return JSON.parse(fs.readFileSync(runtimeKnowledgePath, 'utf8'))
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.json') return 'application/json; charset=utf-8'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 12 * 1024 * 1024) {
      const error = new Error('Request too large')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function scrubProviderError(value) {
  return String(value || 'Provider request failed.')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-api-key]')
    .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '[redacted-image-data]')
    .slice(0, 1200)
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.*)$/)
  if (!match) return null
  const [, mimeType, base64] = match
  return {
    mimeType,
    base64,
    buffer: Buffer.from(base64, 'base64'),
  }
}

function buildToolSummary(tools) {
  return tools.map(tool => `- ${tool.name}: ${tool.role}`).join('\n')
}

function buildFileContext(file) {
  if (!file) return 'No uploaded file.'
  return [
    'Uploaded file metadata:',
    `- name: ${file.name || 'unknown'}`,
    `- type: ${file.type || 'unknown'}`,
    `- kind: ${file.kind || 'unknown'}`,
    `- size: ${file.size || 'unknown'}`,
    file.dataUrl ? '- image content: supplied as data URL for vision analysis' : '- image/file content: not supplied; use metadata honestly',
  ].join('\n')
}

function detectLanguage(userText, conversation, preferredLanguage = '') {
  const latestUserText = [
    userText,
    ...conversation
      .filter(item => item?.role === 'user')
      .slice(-3)
      .map(item => String(item.text || '')),
  ].join(' ')
  const portuguesePattern = /\b(o que|vc|você|voce|sabe|fazer|fa[cç]a|crie|criar|gere|gerar|liste|lista|habilidades|capacidades|para mim|planta|projeto|quero|posso|opcoes|opções|mostre|portugu[eê]s|render|or[cç]amento|an[uú]ncio|cliente|contrato|programar|componente|traduza|traduzir)\b/i
  const englishSwitchPattern = /\b(answer in english|speak english|in english|english please)\b/i
  const hiddenUploadMessage = /^user uploaded this file\./i.test(String(userText || '').trim())
  if (englishSwitchPattern.test(userText)) return 'English'
  if ((!String(userText || '').trim() || hiddenUploadMessage) && /^pt\b/i.test(String(preferredLanguage || ''))) return 'Portuguese'
  if (portuguesePattern.test(latestUserText)) return 'Portuguese'
  return 'English'
}

function detectIntent(userText) {
  const normalized = String(userText || '').toLowerCase()
  return {
    isHiddenUpload: /^user uploaded this file\./i.test(String(userText || '').trim()),
    asksForList: /\b(liste|lista|listar|me mostre uma lista|quais op[cç][oõ]es|op[cç][oõ]es|list|show me a list|what options)\b/i.test(normalized),
    asksCapabilities: /\b(o que (vc|você|voce) sabe fazer|o que (vc|você|voce) sabe|o que pode fazer|liste todas as suas habilidades|suas habilidades|suas capacidades|o que você consegue fazer|o que voce consegue fazer|what can you do|what do you know how to do|your abilities|your capabilities)\b/i.test(normalized),
    asksExecution: /\b(criar|crie|gera|gerar|gere|montar|monte|preparar|prepare|fazer|fa[cç]a|escreva|me ajude a escrever|ajude a escrever|produza|create|generate|write|help me write|prepare|build|make)\b/i.test(normalized),
    asksRenderPrompt: /\b(prompt de render|render prompt|prompt.*render|renderiza|renderizar)\b/i.test(normalized),
    asksSalesOutput: /\b(vender|venda|sell|sales|comercial|cliente|apresenta[cç][aã]o|presentation)\b/i.test(normalized),
    asksContractDraft: /\b(contrato simples|contrato|contract draft|simple contract|agreement)\b/i.test(normalized),
    asksTranslation: /\b(traduza|traduzir|translate|translate this|to english|para ingl[eê]s|para portugu[eê]s)\b/i.test(normalized),
    asksCodeOutput: /\b(componente react|react component|c[oó]digo|codigo|code|programar|typescript|javascript|jsx|tsx)\b/i.test(normalized),
  }
}

function buildStyleInstruction(userText, file) {
  const intent = detectIntent(userText)
  if (intent.isHiddenUpload && file) {
    return [
      'Style for this first upload reply: answer in one short natural paragraph.',
      'Do not create a plan, checklist, bullet list or numbered list.',
      'Mention only 2 to 4 concrete things visible or inferable from the file.',
      'Ask one practical question at the end.',
    ].join('\n')
  }
  if (intent.asksExecution || (intent.asksSalesOutput && file)) {
    return [
      'Style for this reply: the user is asking for an output. Produce the output now.',
      'Do not explain the process.',
      'Do not answer with advice about how to create it.',
      'Do not ask another question if enough context exists.',
      'A short intro is fine, then provide the deliverable directly.',
      'If truly blocked by missing critical input, ask only the one missing question.',
      intent.asksTranslation ? 'For direct translation, output only the translation unless the user asks for notes.' : '',
      intent.asksCodeOutput ? 'For code requests, provide the code directly in the user language context, with only minimal usage note if helpful.' : '',
    ].filter(Boolean).join('\n')
  }
  const asksForStructuredOutput = /\b(report|relatorio|relat[oó]rio|checklist|lista|liste|bullet|tabela|table|format|formato|plano detalhado)\b/i.test(userText)
  if (intent.asksForList || asksForStructuredOutput) {
    return [
      'Style for this reply: the user asked for a list or structured answer, so provide a clear concise list.',
      'Start with the requested list. Do not answer with a general paragraph and a question instead.',
      'Do not add report headings unless the user asked for a formal report.',
      'If there is uploaded-file context and the user asks what you can do, list actions for this specific file/project, not generic platform capabilities.',
      'If the file is an image/plan, include practical actions such as humanized plan, render briefing, commercial board, sales copy, video/tour script, layout review, budget questions, and BIM/3D next files when relevant.',
      'Do not add an unnecessary question if the requested list is complete.',
    ].join('\n')
  }
  const fileContext = file
    ? 'There is active uploaded-file context. If the user asks what you can do, answer from this file/project, not from generic capabilities.'
    : 'There is no uploaded-file context. You may explain capabilities briefly, but keep it conversational.'
  return [
    'Style for this reply: answer like a live chat consultant.',
    'Use one or two natural paragraphs by default.',
    'Do not use markdown headings.',
    'Do not use bullet or numbered lists.',
    'Do not write "Here are a few observations", "Aqui estao algumas observacoes", "Observations", "Capabilities", or similar report framing.',
    'If an image is supplied, mention 2 to 4 concrete visible details in natural prose.',
    'Ask exactly one practical next-step question.',
    fileContext,
  ].join('\n')
}

function buildIntentInstruction(userText, file, conversation, preferredLanguage) {
  const language = detectLanguage(userText, conversation, preferredLanguage)
  const intent = detectIntent(userText)
  const instructions = [
    `Language rule: Always answer in ${language}. The user's latest message controls the response language. Keep ${language} until the user clearly switches language.`,
  ]
  if (intent.asksCapabilities && file) {
    instructions.push(
      'Intent rule: the user is asking what Apex AI Copilot can do with the current uploaded file. Execute that intent directly.',
      'Answer in the context of the uploaded file and visible image/content. Do not give a generic platform capability overview.',
    )
  }
  if (intent.asksCapabilities && !file) {
    instructions.push(
      'Capability rule: the user is asking for your abilities. List the full Apex AI Copilot capability set clearly, with no construction-only framing.',
      'Make clear that Apex AI Copilot is a full general AI copilot across topics and domains, while using Apex/project/file context when useful.',
      'Include general reasoning, planning, research, construction/architecture/engineering, BIM/CAD/3D/viewer, ArchVis/interior/room design, image/render/visual design, video/DirectCut, website/landing/portfolio, SQL/data analysis, coding/code copilot, academic research, negotiation, tech support, writing/humanizer, business strategy/sales/CRM/proposals, legal/contracts/permits support, field/RDO/quality/safety and exploration.',
      'Do not imply that topics outside construction are secondary or unsupported.',
    )
  }
  if (intent.isHiddenUpload && file) {
    instructions.push(
      'First upload rule: respond naturally in the selected language with a concise visual/context read.',
      'Do not generate a plan of action, checklist, numbered list, or capability list on first upload.',
      'Mention the visible project context briefly and ask one practical question.',
    )
  }
  if (intent.asksForList) {
    instructions.push(
      'Intent rule: the user explicitly asked for a list. Provide a numbered list, clear and practical.',
      'Do not answer with only a descriptive paragraph. Do not replace the requested list with a follow-up question.',
      'Do not apologize for using a list; the list is requested.',
    )
  }
  if (intent.asksExecution) {
    instructions.push(
      'Execution rule: The user is asking for an output. Produce the output now. Do not explain the process.',
      'Do not say what could be considered; create the deliverable directly.',
      'Do not ask a follow-up question when the uploaded file or current project context is enough to draft a useful first version.',
      'Only ask a question if the requested deliverable cannot be produced at all without one critical missing input.',
    )
  }
  if (intent.asksTranslation) {
    instructions.push(
      'Translation rule: translate directly. Do not add a follow-up question or extra commentary unless requested.',
    )
  }
  if (intent.asksCodeOutput) {
    instructions.push(
      'Code rule: produce code directly. Keep surrounding explanation minimal and in the user language.',
    )
  }
  if (language === 'Portuguese' && intent.asksExecution && intent.asksRenderPrompt && file) {
    instructions.push(
      'Required behavior for Portuguese render-prompt request with image/plan context:',
      'Start with: "Claro. Aqui está um prompt de render pronto para usar:"',
      'Then write a complete production-grade render prompt immediately, grounded in the visible plan/project context.',
      'Use a copy-ready "Prompt principal:" block, not only a list of attributes.',
      'The render prompt must include project type, view type, architecture style, materials, lighting, landscaping, furniture/interior cues, camera angle, image quality, and photorealism details.',
      'Use visible image details whenever present: pool, integrated living/kitchen/social area, bedrooms, landscaping, street/access at the top side, and irregular or sloped lot shape if visible.',
      'Include a negative prompt section that removes low quality, distorted geometry, wrong proportions, extra rooms, bad lighting, blurry textures, warped furniture, unreadable plan elements, people if not requested, and unrealistic materials.',
      'Include optional variants for facade, interior, humanized floor plan, and aerial sales image.',
      'Keep it usable for Midjourney/SDXL/DALL-E style image generation without overexplaining the process.',
      'End with one short optional adaptation line, such as: "Também posso adaptar esse prompt para fachada, interior, planta humanizada ou vídeo."',
      'Do not answer with "Para gerar um prompt..." or explain how prompt creation works.',
    )
  }
  if (language === 'Portuguese' && intent.asksSalesOutput && file) {
    instructions.push(
      'For a Portuguese sales/presentation request, produce the actual sales output immediately.',
      'Make the real estate marketing copy sharper and immediately usable.',
      'Include headline, short pitch, buyer profile, value proposition, recommended visuals, and next action.',
      'Ground it in visible project details such as pool, integrated social area, bedrooms, landscaping and street/access when present.',
      'Do not ask which step to prioritize before producing the first version.',
      'Start with a usable sales positioning, not advice about considering a portfolio.',
    )
  }
  if (language === 'Portuguese' && intent.asksExecution && intent.asksContractDraft) {
    instructions.push(
      'For a Portuguese simple-contract request, produce a usable simple contract draft immediately.',
      'Keep it practical and editable. Include parties, object, obligations, price/payment, term, termination, confidentiality if useful, liability limits, governing law/forum and signature lines.',
      'Add one short note that it is a draft for review and should be adapted by a qualified professional when legal risk matters.',
      'Do not ask which type of contract before giving a first simple model unless there is no possible generic draft.',
    )
  }
  if (language === 'Portuguese' && intent.asksCapabilities && intent.asksForList && file) {
    instructions.push(
      'Required Portuguese response shape for this request:',
      'Start exactly with: "Com essa planta, eu posso fazer principalmente isto:"',
      'Then provide a numbered list with practical items grounded in the visible plan, such as:',
      '1. Transformar em planta humanizada para apresentacao.',
      '2. Criar briefing de render externo ou interno.',
      '3. Montar roteiro de video/tour para venda.',
      '4. Preparar uma prancha comercial para cliente.',
      '5. Revisar layout: circulacao, integracao sala/cozinha, quartos, piscina e acesso pela rua.',
      '6. Criar texto de venda para anuncio, site ou proposta.',
      '7. Levantar duvidas tecnicas para orcamento.',
      '8. Separar proximos arquivos necessarios para BIM/3D.',
      'Do not ask a question before this list.',
    )
  }
  return instructions.join('\n')
}

async function handleChat(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return json(res, 200, {
        reply:
          'OPENAI_API_KEY is not configured in .env.local yet. I received the request, but the real AI runtime cannot call OpenAI until the local key is present.',
        mode: 'missing-key',
      })
    }

    const body = await readJson(req)
    const runtime = loadRuntimeKnowledge()
    const userText = String(body.message || '').slice(0, 12000)
    const file = body.file || null
    const conversation = Array.isArray(body.messages) ? body.messages.slice(-10) : []
    const preferredLanguage = String(body.language || body.locale || '').slice(0, 40)
    const intentInstruction = buildIntentInstruction(userText, file, conversation, preferredLanguage)
    const toolSummary = buildToolSummary(runtime.tools)
    const systemPrompt = [
      runtime.systemPrompt.join('\n'),
      '',
      'Connector registry summary. These are optional execution paths, not restrictions or required routing:',
      toolSummary,
      '',
      'Production memory summary:',
      runtime.memorySummary.join('\n'),
      '',
      buildFileContext(file),
      '',
      'If image content is supplied, analyze visible image content directly. If not, do not pretend to see pixels or file internals.',
      'Command-first rule: obey the user direct instruction first. Produce the answer or deliverable directly before considering connectors.',
      'General capability rule: Apex AI Copilot is not limited by topic or domain. It can reason, code, write, design, analyze, research, negotiate, troubleshoot and produce deliverables broadly.',
      'Use active Apex/project/file context when useful, but never refuse a normal general request because it is outside construction.',
      'Connectors are optional execution paths. They are invoked after understanding the user request, not before. Do not force every answer into a connector or service.',
      'Always answer in the same language as the user latest message.',
      'If the user has not typed a natural-language message yet, use the browser/session language when supplied.',
      'Execution priority: if the user asks to create, generate, write, build, prepare, montar, criar, gerar, fazer, escreva or produza, do the work now. Do not explain the process unless asked.',
      'Runtime response rule: Do not format the response as a report. Do not use markdown headings unless requested. Prefer natural paragraphs.',
      'Highest priority style rule: unless the user explicitly asks for a report/checklist/table, do not answer with headings, bullets, numbered lists, or "observations" sections.',
      'If the current or recent conversation includes an uploaded file, treat follow-up questions such as "o que vc sabe fazer" as referring to that file and project context.',
      'When image content is supplied, mention 2 to 4 concrete visible project details before suggesting paths.',
      'Do not ask unnecessary next-step questions. Ask only when truly blocked or when the user explicitly wants exploration.',
      '',
      intentInstruction,
    ].join('\n')

    const userContent = []
    userContent.push({
      type: 'text',
      text: [
        userText || 'The user uploaded a file and asks for guidance.',
        '',
        buildFileContext(file),
        '',
        buildStyleInstruction(userText, file),
        '',
        intentInstruction,
      ].join('\n'),
    })
    if (file?.dataUrl && String(file.type || '').startsWith('image/')) {
      userContent.push({
        type: 'image_url',
        image_url: { url: file.dataUrl },
      })
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation
        .filter(item => item?.role === 'user' || item?.role === 'assistant')
        .map(item => ({ role: item.role, content: String(item.text || '').slice(0, 4000) })),
      { role: 'user', content: userContent },
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.72,
        frequency_penalty: 0.2,
        max_tokens: 900,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return json(res, response.status, {
        error: data?.error?.message || 'OpenAI request failed.',
      })
    }
    return json(res, 200, {
      reply: data?.choices?.[0]?.message?.content || 'Apex AI Copilot did not return text.',
      model: data?.model,
      usage: data?.usage,
    })
  } catch (error) {
    return json(res, error.status || 500, {
      error: error.message || 'Apex AI Copilot runtime failed.',
    })
  }
}

async function handleImageEditPlan(req, res) {
  try {
    const body = await readJson(req)
    const file = body.file || {}
    const editInstruction = String(body.editInstruction || '').trim()
    const conversationContext = Array.isArray(body.conversationContext)
      ? body.conversationContext.slice(-8).map(item => String(item).slice(0, 1200))
      : []
    const hasImage = typeof body.image === 'string' && body.image.startsWith('data:image/')

    if (!hasImage) {
      return json(res, 400, {
        providerStatus: 'not-connected-yet',
        message: 'No image dataUrl was provided. Upload or paste an image before preparing an edit request.',
      })
    }

    const imageMeta = [
      `File: ${file.name || 'uploaded image'}`,
      `MIME: ${file.type || 'unknown'}`,
      `Size: ${file.size || 'unknown'}`,
      file.dimensions ? `Dimensions: ${file.dimensions.width}x${file.dimensions.height}` : 'Dimensions: unknown',
    ].join('\n')

    const imageEditPlan = [
      '1. Use the uploaded image as the source/reference image.',
      '2. Preserve the original layout, wall logic, circulation and proportions unless the instruction explicitly asks for changes.',
      '3. Apply the edit instruction as the creative direction.',
      '4. Keep the output sales-ready: clean materials, readable spaces, realistic lighting, landscaping and polished presentation.',
      '5. Return a generated image only after an image generation connector is connected.',
      '',
      'Source image metadata:',
      imageMeta,
      '',
      conversationContext.length ? `Conversation context:\n${conversationContext.join('\n')}` : 'Conversation context: none supplied.',
    ].join('\n')

    const recommendedPrompt = [
      editInstruction || 'Humanize this architectural floor plan with realistic materials, furniture, landscaping, lighting and sales-ready presentation.',
      'Preserve the original architectural layout and proportions.',
      'Improve visual clarity, material realism, furniture placement, landscaping and client-presentation quality.',
      'Avoid distorted geometry, extra rooms, unreadable labels, warped furniture, bad lighting, blurry textures and unrealistic materials.',
    ].join(' ')

    return json(res, 200, {
      imageEditPlan,
      recommendedPrompt,
      providerStatus: 'not-connected-yet',
      connectorReadiness: [
        { provider: 'OpenAI Images', status: 'not-connected-yet' },
        { provider: 'Gemini image', status: 'not-connected-yet' },
        { provider: 'Other image providers', status: 'not-connected-yet' },
      ],
      message: 'Image generation connector is not connected yet. This request is ready to send once the image tool is enabled.',
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'not-connected-yet',
      message: error.message || 'Could not prepare image edit plan.',
    })
  }
}

async function handleGenerateImage(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return json(res, 200, {
        providerStatus: 'not-connected',
        message: 'real connector not available yet: OPENAI_API_KEY is not configured.',
      })
    }

    const body = await readJson(req)
    const prompt = String(body.prompt || '').trim()
    const mode = String(body.mode || 'text-to-image')
    const file = body.file || {}
    const sourceImage = parseDataUrl(body.sourceImageDataUrl)
    const maxSourceBytes = Number(process.env.OPENAI_IMAGE_SOURCE_MAX_BYTES || 8 * 1024 * 1024)
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
    const size = process.env.OPENAI_IMAGE_SIZE || '1024x1024'
    const quality = process.env.OPENAI_IMAGE_QUALITY || 'medium'

    if (!prompt) {
      return json(res, 400, {
        providerStatus: 'not-connected',
        message: 'real connector not available yet: prompt is required.',
      })
    }

    if (sourceImage && sourceImage.buffer.length > maxSourceBytes) {
      return json(res, 413, {
        providerStatus: 'not-connected',
        message: `Source image is too large for this connector. Limit: ${Math.round(maxSourceBytes / 1024 / 1024)}MB.`,
      })
    }

    const safePrompt = [
      prompt.slice(0, 8000),
      '',
      'Apex ArchVis production intent: generate a polished, client-ready architectural visualization. Preserve the uploaded project logic where a source image is supplied. Do not add fake labels or unreadable text.',
      file?.name ? `Source file name: ${String(file.name).slice(0, 180)}` : '',
    ].filter(Boolean).join('\n')

    let response
    if (sourceImage && (mode === 'image-edit-plan' || mode === 'image-variation-plan')) {
      const form = new FormData()
      form.append('model', model)
      form.append('prompt', safePrompt)
      form.append('size', size)
      form.append('quality', quality)
      form.append('image', new Blob([sourceImage.buffer], { type: sourceImage.mimeType }), file?.name || 'source-image.png')
      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      })
    } else {
      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: safePrompt,
          size,
          quality,
          n: 1,
        }),
      })
    }

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return json(res, response.status, {
        providerStatus: 'not-connected',
        message: scrubProviderError(data?.error?.message || `OpenAI image request failed with HTTP ${response.status}.`),
      })
    }

    const image = data?.data?.[0] || {}
    const b64 = image.b64_json
    const url = image.url
    if (!b64 && !url) {
      return json(res, 502, {
        providerStatus: 'not-connected',
        message: 'OpenAI image connector returned no image payload.',
      })
    }

    return json(res, 200, {
      providerStatus: 'connected',
      message: 'Image generated by the real OpenAI image connector.',
      image: b64 ? `data:image/png;base64,${b64}` : undefined,
      imageUrl: url,
      revisedPrompt: image.revised_prompt,
      model: data?.model || model,
      mode,
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'not-connected',
      message: scrubProviderError(error.message || 'real connector not available yet'),
    })
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const safePath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  const requested = safePath ? path.join(dist, safePath) : path.join(dist, 'index.html')
  const resolved = path.resolve(requested)
  if (!resolved.startsWith(path.resolve(dist))) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  const filePath = fs.existsSync(resolved) && fs.statSync(resolved).isFile()
    ? resolved
    : path.join(dist, 'index.html')
  if (!fs.existsSync(filePath)) {
    res.writeHead(404)
    res.end('Run npm run build first.')
    return
  }
  res.writeHead(200, { 'Content-Type': contentType(filePath) })
  fs.createReadStream(filePath).pipe(res)
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/copilot/chat' && req.method === 'POST') {
    handleChat(req, res)
    return
  }
  if (req.url === '/api/copilot/image-edit-plan' && req.method === 'POST') {
    handleImageEditPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/generate-image' && req.method === 'POST') {
    handleGenerateImage(req, res)
    return
  }
  serveStatic(req, res)
})

const port = Number(process.env.PORT || 4177)
server.listen(port, () => {
  console.log(`Apex AI Copilot platform listening on http://127.0.0.1:${port}`)
})

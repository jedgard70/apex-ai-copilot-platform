import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname
const dist = path.join(root, 'dist')
const runtimeKnowledgePath = path.join(root, 'src', 'lib', 'runtimeKnowledge.json')
const skillUpdateLogPath = path.join(root, 'docs', 'SKILL_UPDATE_LOG.md')

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

function saveRuntimeKnowledge(runtime) {
  fs.writeFileSync(runtimeKnowledgePath, `${JSON.stringify(runtime, null, 2)}\n`, 'utf8')
}

function safeId(prefix = 'update') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function redactSensitiveText(value) {
  return String(value || '')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '[redacted-openai-key]')
    .replace(/\bghp_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-token]')
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, '[redacted-github-pat]')
    .replace(/\b[A-Za-z0-9_-]*service[_-]?role[A-Za-z0-9_:\-."= ]{8,}/gi, '[redacted-service-role-reference]')
    .replace(/\b(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s]{8,}/gi, '$1=[redacted-secret]')
}

function skillFileExtension(fileName = '') {
  return String(fileName).toLowerCase().split('.').pop() || ''
}

function classifySkillUpdate(file, text) {
  const name = String(file?.name || '')
  const ext = skillFileExtension(name)
  const lower = `${name}\n${text}`.toLowerCase()
  if (/(password|api[_-]?key|secret|token|service[_-]?role|private key|BEGIN RSA PRIVATE KEY)/i.test(text)) {
    return { category: 'obsolete-unsafe-ignore', targetDomain: 'security-review', riskLevel: 'high' }
  }
  if (/(deprecated|obsolete|superseded|não usar|nao usar|ignore this|old version)/i.test(lower)) {
    return { category: 'obsolete-unsafe-ignore', targetDomain: 'historical-reference', riskLevel: 'medium' }
  }
  if (/(archvis|render|planta humanizada|humanized floor plan|facade|interior|prompt negativo|negative prompt)/i.test(lower)) {
    return { category: 'archvis-skill', targetDomain: 'archvis', riskLevel: 'low' }
  }
  if (/(directcut|video|vídeo|roteiro|shot list|storyboard|reels|cinematic)/i.test(lower)) {
    return { category: 'directcut-skill', targetDomain: 'directcut', riskLevel: 'low' }
  }
  if (/(revit|dynamo|pyrevit|shared parameter|par[aâ]metro compartilhado|family|fam[ií]lia|view template|schedule|add-in|addin|ribbon|ifc export|glb export)/i.test(lower)) {
    return { category: 'revit-skill', targetDomain: 'revit-customization', riskLevel: 'low' }
  }
  if (/(windows|powershell|diagn[oó]stico|diagnostic|cleanup|limpeza|quarantine|quarentena|startup|inicializa[cç][aã]o|malware|performance|pc lento|computador lento)/i.test(lower)) {
    return { category: 'windows-coding-skill', targetDomain: 'windows-care-coding', riskLevel: 'medium' }
  }
  if (/(bim|ifc|revit|rvt|dwg|dxf|skp|clash|viewer|3d)/i.test(lower)) {
    return { category: 'bim-3d-skill', targetDomain: 'bim-3d', riskLevel: 'low' }
  }
  if (/(rdo|di[aá]rio de obra|relat[oó]rio de obra|field operations|jobsite|punch list|checklist de qualidade|checklist de seguran[cç]a|foto de obra|daily report)/i.test(lower)) {
    return { category: 'field-operations-skill', targetDomain: 'field-operations-rdo', riskLevel: 'low' }
  }
  if (/(sql|data|analytics|dashboard|metric|csv|query)/i.test(lower)) {
    return { category: 'data-sql', targetDomain: 'data-analysis', riskLevel: 'low' }
  }
  if (/(marketing|sales|crm|proposal|proposta|venda|copy|landing)/i.test(lower)) {
    return { category: 'business-marketing', targetDomain: 'business-marketing', riskLevel: 'low' }
  }
  if (/(negotiation|negociação|negociacao|humanizer|humanizar texto|writing|copywriting)/i.test(lower)) {
    return { category: 'writing-negotiation', targetDomain: 'writing-negotiation', riskLevel: 'low' }
  }
  if (['py', 'js', 'ts', 'tsx'].includes(ext) || /(react|typescript|javascript|python|component|api route|server)/i.test(lower)) {
    return { category: 'code-platform-pattern', targetDomain: 'platform-code', riskLevel: 'medium' }
  }
  if (/(system prompt|prompt template|template|instruções|instrucoes|instructions)/i.test(lower)) {
    return { category: 'prompt-template', targetDomain: 'prompt-systems', riskLevel: 'low' }
  }
  if (/(rule|regra|always|never|nunca|sempre|policy|hard rule)/i.test(lower)) {
    return { category: 'global-rule', targetDomain: 'copilot-behavior', riskLevel: 'medium' }
  }
  return { category: 'project-memory', targetDomain: 'project-memory', riskLevel: 'low' }
}

function summarizeSkillUpdate(file, text, classification) {
  const name = String(file?.name || 'uploaded file')
  const preview = text
    ? text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 6)
    : []
  const metadataOnly = !text
  const understood = [
    metadataOnly
      ? `Apex received ${name} as metadata-only content. It will not execute or unpack it in CP5.`
      : `Apex read sanitized text from ${name} without executing it.`,
    `Detected category: ${classification.category}.`,
    `Recommended target domain: ${classification.targetDomain}.`,
  ]
  const additions = preview.length
    ? preview.map(line => line.slice(0, 280))
    : [`Store ${name} as a reference item for ${classification.targetDomain}; text extraction is not available yet for this file type.`]
  const updates = classification.category === 'global-rule'
    ? ['Potential behavior rule update after Owner approval.']
    : [`Potential ${classification.targetDomain} knowledge update after Owner approval.`]
  const ignored = []
  if (metadataOnly) ignored.push('Binary/archive/PDF internals are not parsed in this checkpoint; only metadata is used.')
  if (classification.category === 'obsolete-unsafe-ignore') ignored.push('Unsafe or obsolete content should not be promoted to global skill brain.')
  return { understood, additions, updates, ignored }
}

function buildExportReference(domain, runtime) {
  const tools = Array.isArray(runtime.tools) ? runtime.tools : []
  const matchingTools = tools.filter(tool => {
    const haystack = `${tool.id} ${tool.name} ${tool.role} ${(tool.trigger || []).join(' ')}`.toLowerCase()
    return domain.toLowerCase().split(/[ /-]+/).some(part => part.length > 3 && haystack.includes(part))
  })
  const updates = Array.isArray(runtime.skillUpdates)
    ? runtime.skillUpdates.filter(update => String(update.targetDomain || '').toLowerCase().includes(domain.toLowerCase().split(' ')[0] || ''))
    : []
  return [
    `# ${domain}`,
    '',
    '## Runtime role',
    matchingTools.length
      ? matchingTools.map(tool => `- ${tool.name}: ${tool.role}`).join('\n')
      : '- Use Apex AI Copilot behavior and active project context for this domain.',
    '',
    '## Approved updates',
    updates.length
      ? updates.map(update => `- ${update.summary}`).join('\n')
      : '- No Owner-approved runtime updates for this exact domain yet.',
    '',
    '## Operating rule',
    'Chat remains the primary interface. Tools and modules are optional execution paths after understanding the user request.',
  ].join('\n')
}

function buildPortablePrompt(request, runtime) {
  const languageLine = request.language === 'PT'
    ? 'Responda em portugues por padrao, a menos que o usuario mude de idioma.'
    : request.language === 'EN'
      ? 'Answer in English by default unless the user switches language.'
      : 'Answer in the user language. Support EN and PT naturally.'
  const rules = Array.isArray(runtime.systemPrompt) ? runtime.systemPrompt.slice(0, 28) : []
  return sanitizePortableText([
    `# ${request.skillName}`,
    '',
    request.description,
    '',
    '## Core behavior',
    '- You are Apex AI Copilot, a chat-first command-following AI assistant.',
    '- Obey the user command first; route to tools only when useful.',
    '- Use active file/project context when relevant.',
    '- Do not fake file parsing, 3D viewers, renders, videos or external execution.',
    '- Produce the requested output directly when the user asks to create, write, build, generate or prepare.',
    `- ${languageLine}`,
    '',
    '## Included domains',
    ...request.domains.map(domain => `- ${domain}`),
    '',
    '## Runtime rules summary',
    ...rules.map(rule => `- ${rule}`),
  ].join('\n'))
}

function sanitizePortableText(value) {
  return redactSensitiveText(String(value || ''))
    .replace(/\.env\.local/gi, '[local-env-file-redacted]')
    .slice(0, 180000)
}

function makeJsonFile(pathName, value) {
  return {
    path: pathName,
    type: 'json',
    content: sanitizePortableText(JSON.stringify(value, null, 2)),
  }
}

function buildSkillExportPack(request, runtime) {
  const exportId = safeId('skill-export')
  const createdAt = new Date().toISOString()
  const skillName = String(request.skillName || 'Apex AI Copilot').slice(0, 120)
  const description = String(request.description || 'Portable Apex AI Copilot knowledge pack.').slice(0, 500)
  const domains = Array.isArray(request.domains) && request.domains.length ? request.domains.map(String) : ['Apex Copilot behavior']
  const language = ['EN', 'PT', 'bilingual'].includes(request.language) ? request.language : 'bilingual'
  const targetPlatform = String(request.targetPlatform || 'chatgpt')
  const outputFormat = String(request.outputFormat || 'zip-compatible')
  const baseRequest = { ...request, skillName, description, domains, language }
  const mainPrompt = buildPortablePrompt(baseRequest, runtime)
  const referenceFiles = domains.map(domain => ({
    path: `references/${domain.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'domain'}.md`,
    type: 'markdown',
    content: sanitizePortableText(buildExportReference(domain, runtime)),
  }))
  const toolRegistry = (Array.isArray(runtime.tools) ? runtime.tools : []).filter(tool => {
    const haystack = `${tool.id} ${tool.name} ${tool.role} ${(tool.trigger || []).join(' ')}`.toLowerCase()
    return domains.some(domain => domain.toLowerCase().split(/[ /-]+/).some(part => part.length > 3 && haystack.includes(part)))
  })
  const memoryIndex = {
    skillName,
    domains,
    includedReferences: Array.isArray(request.includedReferences) ? request.includedReferences : [],
    memorySummary: Array.isArray(runtime.memorySummary) ? runtime.memorySummary : [],
    approvedSkillUpdates: Array.isArray(runtime.skillUpdates) ? runtime.skillUpdates.map(update => ({
      updateId: update.updateId,
      sourceFilename: update.sourceFilename,
      summary: update.summary,
      targetDomain: update.targetDomain,
      category: update.category,
      timestamp: update.timestamp,
    })) : [],
  }
  let files = []
  if (targetPlatform === 'chatgpt') {
    files = [
      { path: 'SKILL.md', type: 'markdown', content: mainPrompt },
      { path: 'agents/openai.yaml', type: 'yaml', content: `name: ${skillName}\ndescription: ${description}\nmodel_behavior: chat-first command-following copilot\n` },
      { path: 'README_IMPORT.md', type: 'markdown', content: `# Import ${skillName}\n\nUpload this folder as a ChatGPT-compatible skill package. Keep references attached as knowledge files.\n` },
      ...referenceFiles,
    ]
  } else if (targetPlatform === 'gemini') {
    files = [
      { path: 'GEMINI_INSTRUCTIONS.md', type: 'markdown', content: mainPrompt },
      { path: 'GEMINI_REFERENCE_INDEX.md', type: 'markdown', content: `# Gemini Reference Index\n\n${domains.map(domain => `- ${domain}`).join('\n')}\n\nImport as Gem instructions plus attached reference files.` },
      { path: 'README_IMPORT.md', type: 'markdown', content: 'Create a Gemini Gem, paste GEMINI_INSTRUCTIONS.md, and attach the reference files.' },
      ...referenceFiles,
    ]
  } else if (targetPlatform === 'claude') {
    files = [
      { path: 'CLAUDE_PROJECT_INSTRUCTIONS.md', type: 'markdown', content: mainPrompt },
      { path: 'CLAUDE_PROJECT_KNOWLEDGE_INDEX.md', type: 'markdown', content: `# Claude Project Knowledge Index\n\n${domains.map(domain => `- ${domain}`).join('\n')}\n` },
      { path: 'README_IMPORT.md', type: 'markdown', content: 'Create a Claude Project, paste the instructions, and add references as project knowledge.' },
      ...referenceFiles,
    ]
  } else if (targetPlatform === 'api') {
    files = [
      { path: 'SYSTEM_PROMPT.md', type: 'markdown', content: mainPrompt },
      makeJsonFile('TOOL_REGISTRY.json', toolRegistry),
      makeJsonFile('MEMORY_INDEX.json', memoryIndex),
      { path: 'RUNTIME_RULES.md', type: 'markdown', content: mainPrompt },
    ]
  } else if (targetPlatform === 'cursor-codex') {
    files = [
      { path: 'CODEX_AGENT_PROMPT.md', type: 'markdown', content: mainPrompt },
      { path: 'REPO_RULES.md', type: 'markdown', content: '# Repo Rules\n\n- Work only in the active repo.\n- Do not expose secrets.\n- Do not fake connectors or generated outputs.\n- Build and verify before committing.\n' },
      { path: 'IMPLEMENTATION_CHECKLIST.md', type: 'markdown', content: '# Implementation Checklist\n\n- Understand user command.\n- Preserve chat-first behavior.\n- Use file/project context.\n- Keep tools secondary.\n- Validate build.\n' },
      ...referenceFiles,
    ]
  } else if (targetPlatform === 'generic-json') {
    files = [
      makeJsonFile('KNOWLEDGE_REGISTRY.json', { mainPrompt, memoryIndex, toolRegistry, references: referenceFiles }),
    ]
  } else {
    files = [
      { path: 'KNOWLEDGE_PACK.md', type: 'markdown', content: mainPrompt },
      makeJsonFile('KNOWLEDGE_REGISTRY.json', { memoryIndex, toolRegistry }),
      ...referenceFiles,
    ]
  }
  return {
    exportId,
    createdAt,
    skillName,
    description,
    targetPlatform,
    outputFormat,
    language,
    domains,
    files,
    mainPrompt,
    warnings: [
      'Secrets, API keys and .env.local references are redacted.',
      'This is a portable export package generated from Apex runtime knowledge only; unrelated local files are not included.',
      outputFormat === 'zip-compatible' ? 'Browser download is a zip-compatible JSON bundle containing file paths and contents.' : 'Use the listed files according to the target platform.',
    ],
    importInstructions: [
      'Review the generated prompt and references before uploading to another AI platform.',
      'Do not paste private keys, API keys or customer-confidential files into third-party platforms.',
      'Keep Apex Copilot chat-first and tool-aware; connectors remain optional execution paths.',
    ],
  }
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

function buildArchVisServerStylePrompt(promptStyle) {
  const style = String(promptStyle || 'humanized-floor-plan')
  const styles = {
    'humanized-floor-plan': [
      'Prompt style: Humanized floor plan.',
      'Strict image-to-image, top-down orthographic, preserve layout, walls, openings, room positions, labels where possible, no geometry change, no extra rooms, no invented gardens, high realism.',
    ].join('\n'),
    'photorealistic-facade': 'Prompt style: Photorealistic facade. Minimalist residence, realistic facade, accurate shadows, refined materials, urban or residential architecture, premium real estate presentation.',
    'interior-design': 'Prompt style: Interior design. Use coherent room function, furniture, materials, palette, lighting and realistic construction detail.',
    'futuristic-interior': 'Prompt style: Futuristic interior. Include budget/room intent, polished concrete, porcelain, dark matte walls, metal, leather, teak/freijo wood, LED linear lighting 4000-6500K, indirect lighting and minimal objects.',
    'cinematic-real-estate': 'Prompt style: Cinematic real estate. Include eye-level, low angle, high angle, bird eye/top-down, 3/4 angle, dolly in/out, orbit, flyover, top reveal, wide angle or telephoto camera language.',
    'technical-bim-mep': 'Prompt style: Technical BIM/MEP. Clean documentation style, BIM/MEP comparison, wireframe/hologram architecture, precise systems, readable technical overlays.',
    'topographic-hologram': 'Prompt style: Topographic hologram. Topographic terrain, GIS/neon linework, holographic contours, site levels and technical depth.',
    'masterplan-overlay': 'Prompt style: Masterplan overlay. Site planning, zones, circulation, roads, access logic, landscape areas and clean 3D text placement where useful.',
    'video-camera-movement': 'Prompt style: Video / camera movement. Shot sequence, dolly in/out, orbit, flyover, top reveal and cinematic presentation language.',
  }
  return styles[style] || styles['humanized-floor-plan']
}

function buildLocalSkillContext(userText, file) {
  const text = `${userText || ''} ${file?.name || ''} ${file?.kind || ''}`.toLowerCase()
  const contexts = []
  if (/(archvis|render|humaniz|planta|floor plan|fachada|facade|imagem|image)/.test(text)) {
    contexts.push('ArchVis: use prompt anatomy subject/style/details/materials/lighting/camera. Preserve mode is strict image-to-image, top-down orthographic, no geometry change, no extra rooms, no invented gardens, no boundary expansion. Creative redesign must be labeled as creative concept.')
    contexts.push('Image prompts: use style presets such as humanized floor plan, photorealistic facade, minimalist residence, sustainable/coastal/brutalist/futuristic, technical BIM/MEP, topographic hologram and masterplan overlay. Build negative prompts for changed geometry, altered walls, missing/extra rooms, moved pool/road, invented garden, cropped plan and perspective distortion.')
  }
  if (/(video|directcut|timelapse|roteiro|shot|camera|cinematic|cinema)/.test(text)) {
    contexts.push('Video/DirectCut: produce script, shot list, timeline prompt, voiceover, reveal/orbit/flyover/dolly/top-reveal movement and real estate sales pacing.')
    contexts.push('Cinematic camera: eye-level, low angle, high angle, bird-eye/top-down, front/side/rear/3-4 angle, dolly in/out, orbit, flyover, top reveal, wide angle and telephoto.')
  }
  if (/(interior|sala|quarto|cozinha|futurista|furniture|material|palette)/.test(text)) {
    contexts.push('Interior/futuristic: ask or infer budget, rooms, palette, polished concrete, porcelain, dark matte walls, metal, leather, teak/freijo wood, LED linear 4000-6500K, indirect lighting and minimal objects.')
  }
  if (/(ifc|rvt|dwg|dxf|skp|bim|cad|3d|viewer|clash)/.test(text)) {
    contexts.push('BIM/CAD: Apex-internal first. Never tell the user to leave the platform as the main solution. IFC/GLB/GLTF/OBJ/STL/FBX must open in Apex BIM / 3D Studio. RVT/DWG/DXF/SKP must open an Apex internal conversion/import workflow. For findings, do not say I think/probably/parece/talvez/pode conter/might/may contain. Separate claims into CONFIRMED, ASSUMPTION and UNKNOWN. Do not say use Revit/ArchiCAD/Solibri/Twinmotion/Blender unless Apex has opened the internal studio/import flow, identified a specific limitation, generated a report and produced correction instructions, or unless the user explicitly asks how to do it outside Apex. If parser/viewer fails, show the real error and offer internal next steps: retry viewer, convert to GLB/IFC, prepare import package, extract metadata if available, create technical review plan.')
  }
  if (/(revit|dynamo|pyrevit|add-?in|plugin|c#|csharp|ribbon|shared parameter|shared parameters|par[aâ]metro|par[aâ]metros compartilhados|view template|template bim|fam[ií]lia|families|ifc export|exportar ifc|glb|manifest|externalcommand|iexternalcommand|iexternalapplication|sheets|pranchas|schedules|quantitativos|qa\/qc|model checking)/.test(text)) {
    contexts.push('Revit customization: answer as a Revit/BIM automation consultant. Distinguish manual Revit setup, Dynamo automation, pyRevit scripts and full C# Revit API add-ins. Cover project setup, templates, families, shared/project parameters, view templates, filters, schedules, sheets/title blocks, BIM standards, IFC/GLB export workflows, model checks, QA/QC, preflight checks and Apex AI Copilot integration. Generate code when requested, show where files go, include .addin manifest/ribbon button structure for C# plugins, and warn that code must be tested inside the matching Revit version. Do not pretend a plugin/script was installed or tested.')
  }
  if (/(eua|usa|united states|mercado americano|american market|europa|europe|european market|mercado europeu|offshore|d[oó]lar|euro|clientes internacionais|international clients|permit set|permit sets|portfolio americano|linkedin em ingl[eê]s|linkedin|prospec[cç][aã]o|outreach|bim em d[oó]lar|revit em d[oó]lar|opera[cç][aã]o remota|remote operation|residential construction docs|construction documentation)/.test(text)) {
    contexts.push('International Market Strategy from Venda EUA Edgard PDF: the fastest entry path is not "architect in the US". Prioritize BIM Specialist, Revit Modeler, Permit Set Designer, Residential Construction Documentation Specialist and offshore BIM/CAD production partner positioning. High-value US/EU paths are permit sets, residential construction docs, Revit modeling, BIM coordination, estimating, technical documentation automation and AI-powered project delivery. Lower priority: render-only, Instagram-only and aesthetics-only positioning. Use Agency -> Platform -> SaaS: sell premium offshore technical production first, automate internally, then productize into AI BIM Operations Platform. For product strategy, do not build the whole enterprise platform first; start with BIM upload, AI issue analysis, permit checklist, issue tracking, executive reports, document intelligence and workflow approvals. Produce actionable business outputs: 90-day roadmap, LinkedIn headline/about, portfolio plan, outreach scripts, service menu, proposal copy and offshore production workflow. Connect Research, Contracts/Permits, BIM/3D, Revit, Budget, DirectCut and Marketing when useful. Do not invent current market data, code requirements, competitor facts or prices without source verification.')
  }
  if (/(github|repo|repository|branch|pr\b|pull request|supabase|sql|vercel|deploy|deployment|backend|frontend|database|schema|rls|policy|policies|security|seguran[cç]a|vulnerab|refactor|module|m[oó]dulo|code review|auditoria t[eé]cnica|build error|deploy error|secrets?|dependency|depend[eê]ncia|cors|auth|migra[cç][aã]o|migration)/.test(text)) {
    contexts.push('Platform Engineering / DevOps: act as a senior platform engineer. Review repository structure, frontend, backend, database/schema, Supabase SQL/RLS, Vercel deploy config, build/deploy errors, branch/PR plans, dependency risk and security. Always separate CONFIRMED, ASSUMPTION and NEEDS VERIFICATION. Do not claim GitHub/Vercel/Supabase access or success unless connector/URL/content/local clone/command output proves it. Do not expose secrets. Do not modify production config without explicit instruction. For Supabase, prefer migration-safe SQL and warn about RLS exposure. For Vercel, check env vars, build command, output dir, framework preset and runtime compatibility. For security, flag exposed keys, unsafe localStorage secrets, missing auth/RLS, open CORS, insecure uploads, unsanitized file parsing, dependency risk and broad admin/service-role usage.')
  }
  if (/(venda|cliente|crm|proposal|proposta|business|marketing|or[cç]amento|budget)/.test(text)) {
    contexts.push('Business/sales: produce positioning, client pitch, proposal outline, buyer profile, value proposition, recommended visuals and next commercial action directly.')
  }
  if (/(code|c[oó]digo|react|typescript|mcp|api|server|platform)/.test(text)) {
    contexts.push('Coding/platform: prefer small scoped changes, keep secrets server-side, separate protocol/validation/execution/evaluation, and produce code directly when requested.')
  }
  if (/(write|escreva|texto|copy|document|doc|humaniz)/.test(text)) {
    contexts.push('Writing: produce the requested artifact directly, match user language/tone and avoid generic boilerplate unless asked.')
  }
  if (/(negocia|counteroffer|proposta comercial|deal)/.test(text)) {
    contexts.push('Negotiation: clarify goal/leverage/constraints only when needed; otherwise produce scripts, counteroffers, email drafts and options.')
  }
  if (/(data|dados|sql|planilha|xlsx|csv|analytics|metric)/.test(text)) {
    contexts.push('Data: do not invent data values; state missing data clearly; produce analysis structure, SQL, spreadsheet logic or metric reasoning.')
  }
  if (/(rdo|di[aá]rio de obra|relat[oó]rio de obra|andamento da obra|progresso da obra|checklist de qualidade|checklist de seguran[cç]a|equipe de obra|materiais entregues|pend[eê]ncia de obra|punch list|foto de obra|field operations|daily report|jobsite|site report|quality checklist|safety checklist|field photo)/.test(text)) {
    contexts.push('Field Operations / RDO: produce daily reports, progress summaries, crew/material logs, safety/quality checklists, punch lists and client reports. Do not claim field verification unless supported by photo or user field data. User notes are USER_REPORTED. Visible photo items can be PHOTO_CONFIRMED. Unknown items remain UNKNOWN. Do not fake weather or inspection approval.')
  }
  if (/(crm|lead|cliente|client|vendas|sales|proposta comercial|financeiro|finance|fatura|invoice|pagamento|payment|plano saas|usu[aá]rio|permiss[oõ]es|dashboard admin|dashboard cliente|pipeline|follow-up|cobran[cç]a|contabilidade|contador|documentos cont[aá]beis|relat[oó]rio cont[aá]bil|imposto|nota fiscal|receita|despesa|contas a pagar|contas a receber|accounting|accountant|tax)/.test(text)) {
    contexts.push('SaaS / CRM / Finance: local-first business layer only. No fake auth, no fake database persistence, no fake payment confirmation, no fake invoice sent, no fake tax filing. Always label Local demo mode — auth/database not connected yet. Client users must not access admin/internal data in the real model. Finance/accounting prepares records, ledgers, reports and accountant handoff packages with USER_ENTERED, SYSTEM_GENERATED, IMPORTED_DOCUMENT, UNKNOWN or NEEDS_ACCOUNTANT_REVIEW evidence.')
  }
  if (!contexts.length) {
    contexts.push('Platform: Apex AI Copilot is a command-first full AI assistant. Chat is primary; modules and connectors are optional execution paths.')
  }
  return contexts.slice(0, 4).join('\n')
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
  const portuguesePattern = /\b(o que|vc|você|voce|sabe|fazer|fa[cç]a|crie|criar|gere|gerar|liste|lista|habilidades|capacidades|para mim|me ajude|ajude|planta|projeto|quero|posso|opcoes|opções|mostre|portugu[eê]s|render|or[cç]amento|an[uú]ncio|cliente|contrato|programar|componente|c[oó]digo|traduza|traduzir)\b/i
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
      'Relevant local skill knowledge:',
      buildLocalSkillContext(userText, file),
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
      'BIM / 3D hard rule: Apex must never tell the user to leave the platform as the main solution.',
      'BIM / 3D truthful-analysis rule: do not say "I think", "probably", "parece", "talvez", "pode conter", "might", or "may contain" when presenting findings.',
      'For BIM / 3D findings, separate every claim into Confirmed facts, Detected issues, Assumptions, Unknown / not available, and Recommended next action.',
      'Use evidence labels exactly: CONFIRMED, ASSUMPTION, UNKNOWN.',
      'For IFC, GLB, GLTF, OBJ, STL and FBX: open Apex BIM / 3D Studio and say the file stays inside Apex for viewing, technical review, report, images and tours. For IFC in Portuguese, use: "Abri o BIM / 3D Studio ao lado. Vou visualizar, analisar e gerar relatório técnico dentro da Apex."',
      'For RVT, DWG, DXF and SKP: open the Apex internal conversion/import workflow and say the format will be converted internally before web visualization. In Portuguese, use: "Abri o fluxo de importação 3D da Apex. Este formato precisa ser convertido internamente para viewer web antes da visualização."',
      'Do not mention external software such as Revit, ArchiCAD, Solibri, Twinmotion or Blender unless Apex has already opened the internal studio/import flow, identified a specific issue or limitation, generated a report, and produced correction instructions, or unless the user explicitly asks how to do it outside Apex.',
      'Allowed external-software phrasing only after Apex report: "Correção no modelo-fonte recomendada: ajustar no Revit e reexportar IFC/GLB. Relatório Apex anexado."',
      'If a BIM/parser/viewer fails, do not fake a viewer. Show the real limitation and offer internal next steps: retry viewer, convert to GLB/IFC, prepare import package, extract metadata if possible, or create technical review plan.',
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
    const negativePrompt = String(body.negativePrompt || '').trim()
    const lockBoundaries = body.lockBoundaries === true
    const preserveLabels = body.preserveLabels !== false
    const noInventedAreas = body.noInventedAreas !== false
    const referenceMode = String(body.referenceMode || 'original')
    const revisionConstraints = Array.isArray(body.revisionConstraints)
      ? body.revisionConstraints.map(item => String(item).slice(0, 600)).filter(Boolean).slice(0, 20)
      : []
    const outputType = String(body.outputType || (mode === 'preserve-layout' ? 'humanized-floor-plan' : 'creative-concept'))
    const promptStyle = String(body.promptStyle || 'humanized-floor-plan')
    const cameraPreset = String(body.cameraPreset || 'auto')
    const strength = Math.max(30, Math.min(100, Number(body.strength || 85)))
    const outputCount = Math.max(1, Math.min(4, Number(body.outputCount || 1)))
    const maxSourceBytes = Number(process.env.OPENAI_IMAGE_SOURCE_MAX_BYTES || 8 * 1024 * 1024)
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
    const size = process.env.OPENAI_IMAGE_SIZE || '1024x1024'
    const quality = process.env.OPENAI_IMAGE_QUALITY || 'medium'
    const requiresSourceImage = mode === 'preserve-layout' || mode === 'image-edit-plan' || mode === 'image-variation-plan'

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

    if (requiresSourceImage && !sourceImage) {
      return json(res, 400, {
        providerStatus: 'not-connected',
        message: 'A source image is required for layout-preserving ArchVis generation. Upload or paste the plan first.',
      })
    }

    const fidelityRules = mode === 'preserve-layout'
      ? [
          'STRICT FIDELITY MODE:',
          'Use the uploaded image as the strict reference/base image.',
          'Transform this exact uploaded architectural floor plan into a high-quality humanized floor plan visualization.',
          outputType === 'humanized-floor-plan' ? 'Keep strict top-down orthographic view. Do not convert into eye-level, side-view, room perspective, facade, or 3D interior camera. This is a floor plan humanization, not a perspective render.' : '',
          'Preserve the original geometry, walls, room positions, labels where possible, pool location, garage location, road/access, lot shape, proportions and top-down camera.',
          'Do not redesign the plan.',
          'Do not add/remove rooms.',
          'Do not change layout.',
          'Do not crop important parts.',
          'Do not create a perspective 3D house, exterior facade, or random architecture.',
          preserveLabels ? 'Preserve labels where possible and avoid misspelled labels.' : '',
          'Only improve materials, floor textures, furniture, landscaping, shadows, water, lighting and presentation quality.',
          'The output should look like a humanized/rendered version of the same uploaded top-down floor plan.',
        ].filter(Boolean).join('\n')
      : 'Creative variation mode: use the uploaded plan as source context, but allow more visual interpretation while keeping the project recognizable.'

    const outputTypeRules = {
      'humanized-floor-plan': 'Output type: Humanized floor plan / Top-down. Force top-down orthographic floor plan humanization. No side camera, no eye-level view, no 3D perspective room render, no facade/interior camera.',
      '3d-perspective': 'Output type: 3D perspective render. Perspective is allowed because the user explicitly requested 3D/perspective.',
      'facade-render': 'Output type: Facade render. Exterior facade camera is allowed.',
      'interior-render': 'Output type: Interior render. Interior camera is allowed.',
      'creative-concept': 'Output type: Creative concept. Redesign may be imaginative and must not be presented as faithful plan.',
    }

    const autoFloorPlanConstraints = outputType === 'humanized-floor-plan'
      ? [
          'Preserve 1 bathroom and 1 laundry/service room, do not create two bathrooms.',
          'Keep grass/green area only where it appears in the original plan.',
          'Do not extend grass beyond the original left strip/half.',
          'Keep all walls, openings and layout positions.',
        ]
      : []

    const boundaryRules = mode === 'preserve-layout' && (lockBoundaries || noInventedAreas)
      ? [
          'STRICT BOUNDARY LOCK:',
          lockBoundaries ? 'Preserve exact lot boundary.' : '',
          lockBoundaries ? 'Preserve exact building footprint.' : '',
          lockBoundaries ? 'Preserve exact exterior/service areas.' : '',
          noInventedAreas ? 'Do not extend garden/landscaping beyond the original garden/patio areas.' : '',
          noInventedAreas ? 'Do not create garden behind sauna, lavanderia, suite, pool, garage, or any area where it is not shown in the source image.' : '',
          noInventedAreas ? 'Do not fill blank/white/technical areas with invented landscaping.' : '',
          noInventedAreas ? 'Do not infer missing spaces outside the drawing.' : '',
          noInventedAreas ? 'Do not complete or continue any area beyond what is visible.' : '',
          noInventedAreas ? 'Treat unknown/blank areas as unchanged neutral surfaces.' : '',
          noInventedAreas ? 'Only enhance existing zones already present in the source image.' : '',
          noInventedAreas ? 'If an area is unclear, keep it neutral rather than inventing details.' : '',
          noInventedAreas ? 'No garden continuation, invented garden, extra landscaping, added patio, added deck, extended vegetation, filled blank area, new exterior area, invented service yard, changed backyard, added outdoor strip, or random plants outside original garden.' : '',
        ].filter(Boolean).join('\n')
      : ''

    const safePrompt = [
      prompt.slice(0, 8000),
      '',
      autoFloorPlanConstraints.length || revisionConstraints.length
        ? ['User correction constraints from previous failed outputs:', ...[...autoFloorPlanConstraints, ...revisionConstraints].map((constraint, index) => `${index + 1}. ${constraint}`)].join('\n')
        : '',
      '',
      outputTypeRules[outputType] || outputTypeRules['creative-concept'],
      fidelityRules,
      buildArchVisServerStylePrompt(promptStyle),
      boundaryRules,
      cameraPreset && cameraPreset !== 'auto' ? `Selected camera/movement preset: ${cameraPreset}.` : '',
      negativePrompt ? `Negative prompt: ${[
        negativePrompt.slice(0, 2000),
        outputType === 'humanized-floor-plan'
          ? 'eye-level view, side view, perspective room render, facade, interior photograph, camera inside room, 3D walkthrough, changed viewpoint'
          : '',
      ].filter(Boolean).join(', ')}` : '',
      '',
      'Apex ArchVis production intent: generate a polished, client-ready architectural visualization. Preserve the uploaded project logic where a source image is supplied. Do not add fake labels or unreadable text.',
      `Reference mode: ${referenceMode}.`,
      `Fidelity strength requested: ${strength}%.`,
      file?.name ? `Source file name: ${String(file.name).slice(0, 180)}` : '',
    ].filter(Boolean).join('\n')

    let response
    if (sourceImage && requiresSourceImage) {
      const form = new FormData()
      form.append('model', model)
      form.append('prompt', safePrompt)
      form.append('size', size)
      form.append('quality', quality)
      form.append('n', String(outputCount))
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
          n: outputCount,
        }),
      })
    }

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return json(res, response.status, {
        providerStatus: 'not-connected',
        message: scrubProviderError(data?.error?.message || `OpenAI image request failed with HTTP ${response.status}.`),
        warning: sourceImage
          ? 'The provider could not complete a layout-preserving image edit. No unrelated text-to-image fallback was used.'
          : undefined,
      })
    }

    const images = Array.isArray(data?.data)
      ? data.data.map(item => ({
          image: item?.b64_json ? `data:image/png;base64,${item.b64_json}` : undefined,
          imageUrl: item?.url,
          revisedPrompt: item?.revised_prompt,
        })).filter(item => item.image || item.imageUrl)
      : []
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
      images,
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

async function handleVideoPlan(req, res) {
  try {
    const body = await readJson(req)
    const goal = String(body.goal || 'Create a project video.').slice(0, 4000)
    const planEditor = String(body.planEditor || '').slice(0, 5000)
    const file = body.file || null
    const videoMode = String(body.videoMode || 'real-estate-sales-video')
    const duration = String(body.duration || '15s')
    const aspectRatio = String(body.aspectRatio || '16:9')
    const model = String(body.model || 'auto')
    const audio = String(body.audio || 'on')
    const voice = String(body.voice || 'narrator')
    const style = String(body.style || 'professional-real-estate')
    const lighting = String(body.lighting || 'keep-original')
    const cameraMovement = String(body.cameraMovement || 'dolly-in')
    const references = Array.isArray(body.references)
      ? body.references.map(item => ({
          role: String(item?.role || 'additional').slice(0, 40),
          name: String(item?.name || 'reference media').slice(0, 180),
          type: String(item?.type || 'unknown').slice(0, 80),
          size: Number(item?.size || 0),
          hasPreview: Boolean(item?.hasPreview),
        })).slice(0, 8)
      : []
    const lockedConstraints = Array.isArray(body.lockedConstraints)
      ? body.lockedConstraints.map(item => String(item).slice(0, 400)).filter(Boolean).slice(0, 12)
      : []
    const sourceLine = file?.name
      ? `Reference media: ${file.name} (${file.kind || file.type || 'unknown'}).`
      : 'Reference media: none supplied.'
    const referencesLine = references.length
      ? `References: ${references.map(item => `${item.role}=${item.name}`).join(' | ')}.`
      : 'References: no additional references.'
    const constraintLine = lockedConstraints.length
      ? `Locked constraints: ${lockedConstraints.join(' | ')}.`
      : 'Locked constraints: none.'

    const modeLabels = {
      'generate-videos': 'Generated video concept',
      'image-to-video': 'Image-to-video motion plan',
      'video-editor': 'Video editor plan',
      'clip-editor': 'Clip editor plan',
      'relight-video': 'Relight video plan',
      'add-voice': 'Voiceover video plan',
      'improve-video': 'Video improvement plan',
      'cinematic-effect': 'Cinematic effect plan',
      '3d-scenes-camera-movement': '3D scenes and camera movement plan',
      'construction-presentation': 'Construction presentation',
      'real-estate-sales-video': 'Real estate sales video',
      'technical-walkthrough': 'Technical construction walkthrough',
      'social-media-short': 'Short-form social video',
    }

    const styleLabel = style.replace(/-/g, ' ')
    const modeLabel = modeLabels[videoMode] || videoMode.replace(/-/g, ' ')
    const isSocial = videoMode === 'social-media-short' || aspectRatio === '9:16'
    const isRelight = videoMode === 'relight-video'
    const isVoice = videoMode === 'add-voice' || voice !== 'none'
    const isTechnical = videoMode === 'technical-walkthrough' || style === 'technical-bim'
    const isImageToVideo = videoMode === 'image-to-video'

    const title = modeLabel

    const objective = [
      `Create a ${duration} ${styleLabel} ${modeLabel.toLowerCase()} for: ${goal}`,
      `Model: ${model}.`,
      `Aspect: ${aspectRatio}.`,
      `Audio: ${audio}.`,
      `Voice: ${voice.replace(/-/g, ' ')}.`,
      `Lighting: ${lighting.replace(/-/g, ' ')}.`,
      `Camera movement: ${cameraMovement.replace(/-/g, ' ')}.`,
      sourceLine,
      referencesLine,
      constraintLine,
      planEditor ? `User prompt/plan editor: ${planEditor}` : '',
    ].filter(Boolean).join(' ')

    const sceneList = isSocial
      ? [
          'Hook frame: open with the strongest project image and a short sales phrase.',
          'Motion frame: create a vertical reveal with clean movement and readable project context.',
          'Lifestyle/value frame: show what the buyer/client gains from the project.',
          'Detail frame: highlight pool, facade, plan, material, BIM model or visual differentiator from the reference media.',
          'Closing frame: show CTA, project name and next action in a clean final composition.',
        ]
      : isRelight
        ? [
            'Reference frame: show the original media and preserve the subject, framing and timing.',
            'Lighting analysis frame: identify where the relight direction should change.',
            'Relight pass: apply the selected light mood without changing project geometry.',
            'Comparison beat: show before/after intent or visual continuity.',
            'Final hold: keep the best lit frame readable for approval.',
          ]
        : isTechnical
          ? [
              'Technical opening: show the plan/model/project context clearly.',
              'Layer reveal: introduce BIM/CAD/technical information with controlled overlays.',
              'Coordination beat: show circulation, clash, quantity or execution logic.',
              'Detail callout: focus on a critical construction or documentation point.',
              'Final overview: return to the full project for decision or technical review.',
            ]
          : [
              'Opening establishing shot: reveal the project context and strongest selling angle.',
              'Context shot: show the plan, facade, render or construction material as the project anchor.',
              'Value shot: highlight the main benefit, lifestyle, technical feature or delivery promise.',
              'Detail shot: focus on materials, space organization, BIM/technical clarity or commercial differentiator.',
              'Closing shot: call to action, project name, next step or premium final frame.',
            ]

    const movementPhrase = cameraMovement.replace(/-/g, ' ')
    const cameraMovements = isTechnical
      ? ['clean top reveal', 'slow pan across technical areas', 'layer comparison', 'callout zoom', 'final overview']
      : cameraMovement === 'static'
        ? ['static hold', 'subtle push-in only if needed', 'clean title-safe frame', 'detail crop', 'final hold']
        : [movementPhrase, 'controlled secondary pan', 'detail push-in', 'clean transition', 'final premium hold']

    const narrationScript = voice === 'none'
      ? 'No narration selected. Use visual pacing, text-safe frames and music-driven cuts.'
      : [
          isVoice ? 'Scene 1: Start with a confident narrator line that names the project value immediately.' : 'Scene 1: This project is presented as a clear, high-value opportunity.',
          isImageToVideo ? 'Scene 2: Transform the source image into motion while preserving the original composition.' : 'Scene 2: The layout and visual material reveal the strongest spatial and commercial qualities.',
          isRelight ? 'Scene 3: Explain the lighting mood change and why it improves the presentation.' : 'Scene 3: Materials, light, circulation and presentation details reinforce the project value.',
          'Scene 4: The final frame invites the client to approve the next step or request a full presentation package.',
        ].join('\n')

    const videoPrompt = [
      `Create a ${duration} ${aspectRatio} DirectCut ${modeLabel.toLowerCase()}.`,
      `Model: ${model}.`,
      `Style: ${styleLabel}.`,
      `Audio: ${audio}.`,
      `Voice: ${voice.replace(/-/g, ' ')}.`,
      `Lighting mode: ${lighting.replace(/-/g, ' ')}.`,
      `Primary camera movement: ${movementPhrase}.`,
      sourceLine,
      referencesLine,
      constraintLine,
      isRelight ? 'Relight the media without changing the subject, geometry, camera framing or project identity.' : '',
      isImageToVideo ? 'Use the initial image as the visual anchor and create motion from it without inventing unrelated architecture.' : '',
      isSocial ? 'Optimize pacing for social media: fast hook, clean rhythm, vertical-safe composition and clear CTA.' : '',
      'Use cinematic but controlled movement. Keep the project readable. Do not invent unsupported details.',
      `Goal: ${goal}`,
      planEditor ? `User editable plan/prompt:\n${planEditor}` : '',
    ].join('\n')

    const negativePrompt = [
      'fake generated video',
      'claiming video was generated',
      'unreadable text',
      'warped architecture',
      videoMode === 'add-voice' ? '' : 'random people',
      'fast chaotic camera',
      'low quality',
      'wrong project context',
      'distorted plan',
      isRelight ? 'changed subject, changed geometry, changed framing, new scene, different project' : '',
      isImageToVideo ? 'unrelated architecture, redesigned source image, missing original reference' : '',
      ...lockedConstraints.map(item => `violate constraint: ${item}`),
    ].filter(Boolean).join(', ')

    return json(res, 200, {
      providerStatus: 'planning-only',
      message: 'Planning only — video generation connector not connected yet.',
      title,
      objective,
      audience: videoMode.includes('sales') || videoMode.includes('social') ? 'prospective buyer / client' : 'project stakeholder / technical reviewer',
      sceneList,
      cameraMovements,
      narrationScript,
      videoPrompt,
      negativePrompt,
      recommendedAspectRatio: aspectRatio,
      recommendedDuration: duration,
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'planning-only',
      message: scrubProviderError(error.message || 'DirectCut planner failed.'),
    })
  }
}

function bimFileExtension(fileName = '') {
  return String(fileName).toLowerCase().split('.').pop() || 'unknown'
}

function bimStudioMode(ext) {
  if (['ifc', 'glb', 'gltf', 'obj', 'stl', 'fbx'].includes(ext)) return 'viewer'
  if (['rvt', 'dwg', 'dxf', 'skp'].includes(ext)) return 'import'
  return 'review'
}

function evidence(level, text) {
  return { level, text }
}

async function handleBimPlan(req, res) {
  try {
    const body = await readJson(req)
    const file = body.file || {}
    const ext = bimFileExtension(file.name)
    const mode = bimStudioMode(ext)
    const label = ext === 'unknown' ? 'UNKNOWN' : ext.toUpperCase()
    const providerStatus = mode === 'viewer' ? 'planning-only' : mode === 'import' ? 'import-required' : 'planning-only'
    const supportedStatus = mode === 'viewer'
      ? 'supported-web-viewer-format'
      : mode === 'import'
        ? 'internal-import-required'
        : 'accepted-for-technical-review'
    const viewerAction = mode === 'viewer'
      ? 'Open inside Apex BIM / 3D Studio internal viewer workflow.'
      : mode === 'import'
        ? 'Open Apex internal conversion/import workflow before web visualization.'
        : 'Open Apex internal technical review workflow.'
    const limitation = mode === 'viewer'
      ? 'Viewer/parser connector is not connected in this local foundation build, so geometry and model entities are not confirmed.'
      : mode === 'import'
        ? 'Internal converter is not connected in this local foundation build, so geometry, layers, blocks, families and views are not confirmed.'
        : 'No parser/viewer is mapped for this format in this local foundation build.'

    const confirmedFacts = [
      evidence('CONFIRMED', `File name: ${file.name || 'unknown'}`),
      evidence('CONFIRMED', `Extension: ${label}`),
      evidence('CONFIRMED', `Browser MIME type: ${file.type || 'not provided by browser'}`),
      evidence('CONFIRMED', `File size: ${file.size || 'unknown'}`),
      evidence('CONFIRMED', `Format support status: ${supportedStatus}`),
      evidence('CONFIRMED', `Viewer action: ${viewerAction}`),
    ]
    const detectedIssues = [
      evidence('CONFIRMED', limitation),
      evidence('CONFIRMED', 'No fake viewer, fake geometry, fake clash result or fake quantity was produced.'),
    ]
    const assumptions = [
      evidence('ASSUMPTION', mode === 'viewer'
        ? 'The uploaded file is intended for direct web visualization because its extension is supported by the Apex viewer workflow.'
        : mode === 'import'
          ? 'The uploaded file is intended for internal conversion/import because its extension is proprietary/CAD or requires conversion before web visualization.'
          : 'The uploaded file needs technical review because this extension is not mapped to a direct viewer/import connector.'),
      evidence('ASSUMPTION', 'After load/conversion, Apex can prepare orbit, walkthrough, section pass, flyover, saved views, tour path and animation path.'),
    ]
    const unknowns = [
      evidence('UNKNOWN', 'Geometry, levels/layers, materials, quantities, clashes and cameras are not confirmed until parser/viewer/converter succeeds.'),
      evidence('UNKNOWN', 'No BIM finding is presented as a fact unless detected by parser/viewer.'),
    ]
    const suggestedCorrections = mode === 'viewer'
      ? [
          evidence('CONFIRMED', 'Retry viewer inside Apex when the real loader/parser is connected.'),
          evidence('ASSUMPTION', 'If parser/viewer fails, convert internally to GLB/IFC and repeat the opening in BIM / 3D Studio.'),
          evidence('ASSUMPTION', 'Correction in source model recommended: adjust in Revit/authoring tool and re-export IFC/GLB. Apex report attached.'),
        ]
      : [
          evidence('CONFIRMED', 'Prepare Apex import package with original file, extension, size and technical objective.'),
          evidence('CONFIRMED', 'Convert internally to IFC or GLB before web visualization.'),
          evidence('ASSUMPTION', 'Correction in source model recommended: adjust in Revit/authoring tool and re-export IFC/GLB. Apex report attached.'),
        ]
    const tourScript = [
      evidence('ASSUMPTION', 'Start with full model overview after Apex load/conversion.'),
      evidence('ASSUMPTION', 'Add orbit around full model.'),
      evidence('ASSUMPTION', 'Add section box pass to reveal internal organization.'),
      evidence('ASSUMPTION', 'Add walkthrough route for scale, circulation and construction review.'),
      evidence('ASSUMPTION', 'Add final camera hold for presentation image/video export.'),
    ]
    const animationCameraPath = [
      evidence('ASSUMPTION', 'Camera 01: full model orbit.'),
      evidence('ASSUMPTION', 'Camera 02: flyover/top reveal.'),
      evidence('ASSUMPTION', 'Camera 03: section box sweep.'),
      evidence('ASSUMPTION', 'Camera 04: walkthrough entry path.'),
    ]
    const exportRecommendations = [
      evidence('ASSUMPTION', 'Prepare Twinmotion-style scene briefing after Apex model load/conversion.'),
      evidence('ASSUMPTION', 'Prepare Unreal/Blender export briefing only as planning until a real renderer/export connector exists.'),
    ]

    return json(res, 200, {
      providerStatus,
      modelSummary: `${label} file routed to ${viewerAction}`,
      supportedStatus,
      viewerAction,
      confirmedFacts,
      detectedIssues,
      assumptions,
      unknowns,
      suggestedCorrections,
      recommendedNextActions: mode === 'viewer'
        ? ['retry viewer', 'convert to GLB/IFC', 'prepare import package', 'extract metadata if available', 'create technical review plan']
        : ['prepare import package', 'convert to GLB/IFC', 'extract metadata if available', 'create technical review plan', 'retry viewer after conversion'],
      tourScript,
      animationCameraPath,
      exportRecommendations,
      message: mode === 'viewer'
        ? 'Abri o BIM / 3D Studio ao lado. Vou visualizar, analisar e gerar relatório técnico dentro da Apex.'
        : 'Abri o fluxo de importação 3D da Apex. Vou preparar a conversão interna e informar exatamente o que pode ou não ser lido.',
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'parser-error',
      message: scrubProviderError(error.message || 'Apex BIM / 3D planner failed.'),
    })
  }
}

async function handleBimTourPlan(req, res) {
  try {
    const body = await readJson(req)
    const modelMetadata = body.modelMetadata || {}
    const corrections = Array.isArray(body.corrections) ? body.corrections.slice(0, 40) : []
    const savedViews = Array.isArray(body.savedViews) ? body.savedViews.slice(0, 40) : []
    const tourSteps = Array.isArray(body.tourSteps) ? body.tourSteps.slice(0, 40) : []
    const animationSteps = Array.isArray(body.animationSteps) ? body.animationSteps.slice(0, 40) : []
    const target = String(body.target || 'report')
    const sourceName = String(modelMetadata.name || 'BIM model')
    const steps = (tourSteps.length ? tourSteps : savedViews).map((step, index) => ({
      index: index + 1,
      name: String(step?.name || `Scene ${index + 1}`),
      description: String(step?.description || 'Planning-only BIM scene.'),
      cameraMode: String(step?.cameraMode || 'Orbit'),
      purpose: String(step?.purpose || 'Presentation'),
    }))
    const orderedSteps = steps.length
      ? steps.map(step => `${step.index}. ${step.name} - ${step.description}`)
      : ['1. Model overview - Planning-only overview until Apex viewer/import connector loads geometry.']
    const cameraPath = animationSteps.length
      ? animationSteps.map((step, index) => `${index + 1}. ${step?.movementType || 'Orbit'} / ${step?.duration || '5s'} / ${step?.transition || 'Smooth'}`)
      : steps.map(step => `${step.index}. ${step.cameraMode} camera for ${step.purpose}`)
    const narration = steps.length
      ? steps.map(step => `Scene ${step.index}: Present ${step.name}. ${step.description}`)
      : ['Scene 1: Present the BIM model overview after Apex loads or converts the file.']
    const storyboard = steps.length
      ? steps.map(step => `Frame ${step.index}: ${step.cameraMode} view for ${step.purpose}.`)
      : ['Frame 1: Internal Apex model overview, planning-only.']
    const correctionSummary = corrections.map((item, index) => `${index + 1}. ${item?.evidenceLevel || 'ASSUMPTION'} - ${item?.title || 'Correction'}: ${item?.description || ''}`)

    const exportBrief = [
      `Target: ${target}`,
      `Source model: ${sourceName}`,
      `Format: ${modelMetadata.extension || 'UNKNOWN'}`,
      `Support status: ${modelMetadata.supportStatus || 'unknown'}`,
      `Provider status: ${modelMetadata.providerStatus || 'planning-only'}`,
      '',
      'Evidence rule: no BIM finding is invented. UNKNOWN remains UNKNOWN until parser/viewer/converter verifies it.',
      '',
      'Corrections:',
      ...(correctionSummary.length ? correctionSummary : ['No user corrections recorded yet.']),
      '',
      'Tour steps:',
      ...orderedSteps,
      '',
      'Camera path:',
      ...cameraPath,
      '',
      'Known limitations:',
      '- Planning-only until real BIM viewer/export connector is connected.',
      '- No fake video, fake render or fake 3D model generated.',
    ].join('\n')

    return json(res, 200, {
      providerStatus: 'planning-only',
      message: 'BIM tour/export planner generated a planning-only package. No fake 3D/video/render output was created.',
      structuredTourPlan: {
        tourTitle: `Apex BIM / 3D Tour - ${sourceName}`,
        objective: `Prepare ${target} planning package from BIM / 3D Studio state.`,
        audience: target === 'directcut' ? 'video production / project presentation team' : 'technical reviewer / client / production team',
        orderedSteps,
        cameraPath,
        narration,
        storyboard,
        durationEstimate: `${Math.max(10, orderedSteps.length * 6)}s planning estimate`,
        exportNotes: exportBrief,
      },
      cameraPath,
      narration,
      storyboard,
      exportBrief,
      target,
    })
  } catch (error) {
    return json(res, error.status || 500, {
      providerStatus: 'planning-only',
      message: scrubProviderError(error.message || 'Apex BIM tour planner failed.'),
    })
  }
}

function splitFieldList(value = '') {
  return String(value || '')
    .split(/\r?\n|,|;/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 30)
}

function fieldEvidenceFromSource(source, hasManualText) {
  if (source?.kind === 'image') return 'PHOTO_CONFIRMED'
  if (hasManualText) return 'USER_REPORTED'
  return 'UNKNOWN'
}

async function handleFieldOpsPlan(req, res) {
  try {
    const body = await readJson(req)
    const context = body.context || {}
    const source = body.source || null
    const action = String(body.action || 'rdo')
    const goal = String(body.goal || '')
    const project = String(context.project || 'Apex field project')
    const date = String(context.date || new Date().toISOString().slice(0, 10))
    const weather = String(context.weather || '')
    const crew = splitFieldList(context.crew)
    const materials = splitFieldList(context.materialsDeliveredUsed)
    const activitiesText = String(context.activitiesPerformed || goal || '')
    const delays = String(context.delays || '')
    const incidents = String(context.incidents || '')
    const safetyNotes = String(context.safetyNotes || '')
    const qualityNotes = String(context.qualityNotes || '')
    const hasManualText = Boolean(activitiesText || delays || incidents || safetyNotes || qualityNotes || crew.length || materials.length)
    const baseEvidence = fieldEvidenceFromSource(source, hasManualText)
    const photoEvidence = source?.kind === 'image' ? 'PHOTO_CONFIRMED' : 'UNKNOWN'
    const activityDescriptions = splitFieldList(activitiesText)
    const activities = activityDescriptions.length
      ? activityDescriptions.map((description, index) => ({
        id: `activity-${index + 1}`,
        description,
        responsibleParty: crew[0] || 'Field team',
        evidence: baseEvidence === 'PHOTO_CONFIRMED' ? 'USER_REPORTED' : baseEvidence,
        status: 'Completed',
      }))
      : [{
        id: 'activity-1',
        description: 'Daily field activities were not fully described yet.',
        responsibleParty: 'Field team',
        evidence: 'UNKNOWN',
        status: 'In Progress',
      }]
    const issues = []
    if (delays) {
      issues.push({
        id: 'issue-delay',
        issue: delays,
        location: 'Project schedule / field coordination',
        severity: 'Medium',
        evidence: 'USER_REPORTED',
        assignedTo: 'Project manager',
        dueDate: '',
        status: 'Open',
      })
    }
    if (incidents) {
      issues.push({
        id: 'issue-incident',
        issue: incidents,
        location: 'Jobsite',
        severity: 'High',
        evidence: 'USER_REPORTED',
        assignedTo: 'Safety / field lead',
        dueDate: '',
        status: 'Open',
      })
    }
    if (source?.kind === 'image') {
      issues.push({
        id: 'issue-photo-review',
        issue: 'Photo attached for field review. Only visible conditions in the photo can be marked PHOTO_CONFIRMED.',
        location: 'Photo log',
        severity: 'Low',
        evidence: 'PHOTO_CONFIRMED',
        assignedTo: 'Field reviewer',
        dueDate: '',
        status: 'Open',
      })
    }
    const safetyItems = [
      ['PPE / EPI', safetyNotes ? 'Needs review' : 'Unknown', safetyNotes ? 'Medium' : 'Medium', safetyNotes || 'No manual safety observation provided.'],
      ['fall protection', 'Unknown', 'Medium', 'Not verified from current data.'],
      ['electrical safety', 'Unknown', 'Medium', 'Not verified from current data.'],
      ['housekeeping', source?.kind === 'image' ? 'Needs review' : 'Unknown', 'Medium', source?.kind === 'image' ? 'Photo should be reviewed for visible access/cleanliness conditions.' : 'No photo evidence available.'],
      ['access/circulation', source?.kind === 'image' ? 'Needs review' : 'Unknown', 'Medium', source?.kind === 'image' ? 'Photo should be reviewed for visible circulation/access conditions.' : 'No photo evidence available.'],
      ['machinery/equipment', 'Unknown', 'Medium', String(context.equipment || 'No equipment status provided.')],
    ].map((item, index) => ({
      id: `safety-${index + 1}`,
      item: item[0],
      status: item[1],
      riskLevel: item[2],
      evidence: item[3] === 'Not verified from current data.' ? 'UNKNOWN' : (safetyNotes ? 'USER_REPORTED' : photoEvidence),
      notes: item[3],
    }))
    const qualityItems = [
      ['dimensions', 'Unknown', 'Not verified from current data.'],
      ['finishes', qualityNotes ? 'Needs review' : 'Unknown', qualityNotes || 'No finish quality note provided.'],
      ['waterproofing', 'Unknown', 'Not verified from current data.'],
      ['concrete/structure', 'Unknown', 'Not verified from current data.'],
      ['MEP', 'Unknown', 'Not verified from current data.'],
      ['rework items', qualityNotes ? 'Needs review' : 'Unknown', qualityNotes || 'No rework item reported.'],
    ].map((item, index) => ({
      id: `quality-${index + 1}`,
      item: item[0],
      status: item[1],
      riskLevel: 'Medium',
      evidence: qualityNotes ? 'USER_REPORTED' : 'UNKNOWN',
      notes: item[2],
    }))
    const photoLog = source ? [{
      id: 'photo-1',
      fileName: source.name || 'uploaded field file',
      caption: source.kind === 'image'
        ? 'Uploaded field photo. Use PHOTO_CONFIRMED only for visible items.'
        : 'Uploaded field file. Content is metadata-only unless manually described.',
      location: 'Unassigned location',
      relatedActivity: activityDescriptions[0] || 'General field progress',
      evidence: source.kind === 'image' ? 'PHOTO_CONFIRMED' : 'UNKNOWN',
    }] : []
    const rdoDraft = [
      `RDO / Daily Report - ${date}`,
      `Project: ${project}`,
      `Weather: ${weather || 'UNKNOWN - manual/weather connector data not provided'}`,
      '',
      'Crew / equipe:',
      ...(crew.length ? crew.map(item => `- ${item}`) : ['- UNKNOWN / not provided']),
      '',
      'Activities performed:',
      ...activities.map(item => `- ${item.description} [${item.evidence}]`),
      '',
      'Equipment:',
      `- ${String(context.equipment || 'UNKNOWN / not provided')}`,
      '',
      'Materials delivered/used:',
      ...(materials.length ? materials.map(item => `- ${item} [USER_REPORTED]`) : ['- UNKNOWN / not provided']),
      '',
      'Visitors:',
      `- ${String(context.visitors || 'None reported / UNKNOWN')}`,
      '',
      'Delays:',
      `- ${delays || 'None reported / UNKNOWN'}`,
      '',
      'Incidents:',
      `- ${incidents || 'None reported / UNKNOWN'}`,
      '',
      'Safety notes:',
      `- ${safetyNotes || 'No safety note provided. No inspection approval claimed.'}`,
      '',
      'Quality notes:',
      `- ${qualityNotes || 'No quality note provided. No inspection approval claimed.'}`,
    ].join('\n')
    const clientSummary = [
      `Client progress report for ${project} (${date}).`,
      activities.length ? `Progress reported: ${activities.map(item => item.description).join('; ')}.` : 'Progress detail is pending.',
      delays ? `Reported blocker/delay: ${delays}.` : 'No delay was reported in the provided notes.',
      'This summary does not claim independent site verification.',
    ].join(' ')
    const internalFieldReport = [
      rdoDraft,
      '',
      'Issues / punch list:',
      ...(issues.length ? issues.map(item => `- ${item.severity} | ${item.evidence} | ${item.issue}`) : ['- No issue recorded yet.']),
    ].join('\n')
    const safetyReport = [
      'Safety report draft:',
      ...safetyItems.map(item => `- ${item.item}: ${item.status} / ${item.riskLevel} / ${item.evidence}. ${item.notes}`),
      'No fake inspection approval. Confirm with qualified site/safety lead.',
    ].join('\n')
    const qualityPunchList = [
      'Quality punch list draft:',
      ...qualityItems.map(item => `- ${item.item}: ${item.status} / ${item.evidence}. ${item.notes}`),
      ...(issues.length ? issues.map(item => `- Issue: ${item.issue} (${item.status})`) : []),
    ].join('\n')
    const materialsLog = [
      'Materials log:',
      ...(materials.length ? materials.map(item => `- ${item} [USER_REPORTED]`) : ['- No material delivery/use was reported.']),
    ].join('\n')
    const nextDayPlan = [
      'Next-day plan:',
      '- Confirm weather manually or connect weather source before publishing.',
      delays ? `- Resolve blocker: ${delays}` : '- Continue planned activities and confirm next sequence.',
      incidents ? '- Follow up incident documentation and safety review.' : '- Complete safety toolbox/checklist before work starts.',
      qualityNotes ? '- Review quality notes and close punch items.' : '- Record quality checks with photo/user evidence.',
    ].join('\n')
    const confidenceSummary = [
      'Field report is a draft.',
      source?.kind === 'image' ? 'Photo log can support visible items as PHOTO_CONFIRMED.' : 'No image evidence provided.',
      hasManualText ? 'Manual notes are USER_REPORTED.' : 'Several fields remain UNKNOWN.',
      'Weather is not verified because no weather connector is connected and no weather field was provided.',
    ].join(' ')

    return json(res, 200, {
      plan: {
        providerStatus: 'report-draft',
        rdoDraft,
        activities,
        crew,
        materials,
        issues,
        safetyItems,
        qualityItems,
        photoLog,
        clientSummary,
        internalFieldReport,
        safetyReport,
        qualityPunchList,
        materialsLog,
        nextDayPlan,
        confidenceSummary,
        message: action === 'rdo'
          ? 'Field Operations Studio generated an RDO draft. Weather and inspection status are not faked.'
          : `Field Operations Studio generated a ${action} draft with evidence labels.`,
      },
    })
  } catch (error) {
    return json(res, error.status || 500, {
      error: scrubProviderError(error.message || 'Field Operations planner failed.'),
      providerStatus: 'report-draft',
    })
  }
}

function parseArea(areaText = '') {
  const match = String(areaText).replace(',', '.').match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : 0
}

function budgetCurrencySymbol(currency) {
  if (currency === 'BRL') return 'BRL'
  if (currency === 'EUR') return 'EUR'
  return 'USD'
}

function budgetItem(id, section, item, unit, quantity, unitPrice, confidence, source, pricingSource = 'Placeholder assumptions', sourceDate = '', sourceConfidence = 'PLACEHOLDER') {
  const safeQuantity = Number(quantity || 0)
  const safeUnitPrice = Number(unitPrice || 0)
  return {
    id,
    section,
    item,
    unit,
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    subtotal: Number((safeQuantity * safeUnitPrice).toFixed(2)),
    confidence,
    source,
    pricingSource,
    sourceDate,
    sourceConfidence,
  }
}

async function handleBudgetPlan(req, res) {
  try {
    const body = await readJson(req)
    const assumptions = body.assumptions || {}
    const source = body.source || null
    const goal = String(body.goal || '')
    const area = parseArea(assumptions.area)
    const currency = budgetCurrencySymbol(assumptions.currency)
    const pricingSource = String(assumptions.pricingSource || 'Placeholder assumptions')
    const sinapiStatus = String(assumptions.sinapiStatus || 'not-connected')
    const sourceConfidence = pricingSource === 'User provided prices'
      ? 'USER_PROVIDED'
      : pricingSource === 'Uploaded SINAPI table'
        ? 'USER_PROVIDED'
        : 'PLACEHOLDER'
    const hasArea = area > 0
    const sourceKind = String(source?.kind || '')
    const confidenceFromSource = sourceKind === 'bim-cad' ? 'UNKNOWN' : hasArea ? 'ESTIMATED' : 'UNKNOWN'
    const baseArea = hasArea ? area : 100
    const unitSystem = assumptions.unitSystem === 'imperial' ? 'imperial' : 'metric'
    const areaUnit = unitSystem === 'imperial' ? 'sf' : 'm2'
    const wallUnit = unitSystem === 'imperial' ? 'lf' : 'm2'
    const standard = String(assumptions.standardLevel || 'medium')
    const multiplier = standard === 'economical' ? 0.78 : standard === 'high-end' ? 1.35 : standard === 'luxury' ? 1.8 : 1

    const estimateItems = [
      budgetItem('budget-flooring', 'flooring', 'Flooring and base finish allowance', areaUnit, baseArea, 62 * multiplier, confidenceFromSource, hasArea ? 'user input' : 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-painting', 'painting', 'Interior/exterior painting allowance', wallUnit, Math.round(baseArea * 2.8), 14 * multiplier, hasArea ? 'ESTIMATED' : 'UNKNOWN', 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-electrical', 'electrical', 'Electrical rough-in and fixture allowance', 'allowance', 1, Math.round(baseArea * 48 * multiplier), 'ESTIMATED', 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-plumbing', 'plumbing', 'Plumbing rough-in and fixture allowance', 'allowance', 1, Math.round(baseArea * 42 * multiplier), 'ESTIMATED', 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-finishes', 'finishes', 'General finish package allowance', 'allowance', 1, Math.round(baseArea * 95 * multiplier), 'ESTIMATED', 'assumption', pricingSource, '', sourceConfidence),
      budgetItem('budget-external', 'pool/gourmet/external areas', 'External areas, pool/gourmet/landscaping allowance', 'allowance', 1, Math.round(baseArea * 55 * multiplier), 'ESTIMATED', 'assumption', pricingSource, '', sourceConfidence),
    ]

    const pendingQuestions = []
    if (!hasArea) pendingQuestions.push('Confirm total built area or drawing scale before converting this into a proposal price.')
    if (!assumptions.location) pendingQuestions.push('Confirm city/state/country to adapt labor, logistics and local pricing assumptions.')
    pendingQuestions.push('Confirm material brands, finish level, structural scope and whether pool/gourmet/external areas are included.')
    if (sourceKind === 'bim-cad') pendingQuestions.push('BIM quantities are not CONFIRMED until a parser/viewer extracts real quantities from the model.')

    const scopeIncluded = Array.isArray(body.scopeIncluded) && body.scopeIncluded.length
      ? body.scopeIncluded
      : [
          'Preliminary quantity structure',
          'Budget allowance by section',
          'Scope and exclusion draft',
          'Proposal text draft',
        ]
    const scopeExcluded = Array.isArray(body.scopeExcluded) && body.scopeExcluded.length
      ? body.scopeExcluded
      : [
          'Taxes, permit fees and authority charges',
          'Final supplier quotes',
          'Engineering stamps and third-party approvals',
          'Hidden conditions not visible in the current file/context',
        ]
    const ownerSupplied = Array.isArray(body.ownerSupplied) ? body.ownerSupplied : []

    const projectType = String(assumptions.projectType || 'construction project')
    const location = assumptions.location ? ` in ${assumptions.location}` : ''
    const areaCopy = hasArea ? `${area} ${areaUnit}` : 'area not confirmed'
    const proposalDraft = [
      `Preliminary proposal for ${projectType}${location}.`,
      `Current basis: ${areaCopy}, ${standard} standard, ${currency} placeholder pricing.`,
      'This draft is suitable for early decision-making only. It is not a final bid because quantities and unit prices require confirmed drawings, scale, local supplier pricing and technical review.',
      '',
      'Payment schedule draft: 20% mobilization, 30% after procurement confirmation, 30% at execution milestone, 20% at delivery and punch-list closeout.',
      'Timeline note: final timeline depends on scope confirmation, permits, procurement lead time and site constraints.',
    ].join('\n')

    const knownSources = [
      source ? `Source file: ${source.name} (${sourceKind || 'unknown kind'}).` : 'No source file; manual description/context only.',
      goal ? `User goal: ${goal}` : 'No explicit goal text.',
    ]

    json(res, 200, {
      plan: {
        providerStatus: hasArea || source ? 'estimate-draft' : 'planning-only',
        assumptions: {
          projectType,
          area: String(assumptions.area || ''),
          location: String(assumptions.location || ''),
          standardLevel: standard,
          currency,
          unitSystem,
          pricingSource,
          sinapiStatus,
        },
        estimateItems,
        scopeIncluded,
        scopeExcluded,
        ownerSupplied,
        pendingQuestions,
        proposalDraft,
        confidenceSummary: hasArea
          ? 'Quantities are ESTIMATED from user-provided area and assumptions. Prices are placeholders until a real pricing database or supplier quote is connected.'
          : 'No scale/area confirmed. Quantities are UNKNOWN or allowance-based assumptions only.',
        message: [
          'Budget Studio generated a preliminary estimate draft.',
          ...knownSources,
          sinapiStatus === 'not-connected'
            ? 'SINAPI source: not connected. No SINAPI or live pricing database is connected in this checkpoint.'
            : `SINAPI source: ${sinapiStatus}. Use only cited user-uploaded/connected source values.`,
        ].join(' '),
      },
    })
  } catch (error) {
    json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      providerStatus: 'planning-only',
    })
  }
}

function businessCurrency(value) {
  const normalized = String(value || '').toUpperCase()
  return ['BRL', 'USD', 'EUR'].includes(normalized) ? normalized : 'USD'
}

function createBusinessPlanPayload({ goal = '', focus = 'all', currency = 'USD' }) {
  const safeCurrency = businessCurrency(currency)
  const localNotice = 'Local demo mode — auth/database not connected yet'
  const paymentNotice = 'Payment connector not connected yet — no real payment was processed or confirmed.'
  const accountingNotice = 'NEEDS_ACCOUNTANT_REVIEW: Apex prepares documents and reports for accountant review. It does not file taxes or confirm accounting compliance.'
  const pipelineStages = ['New Lead', 'Qualified', 'Discovery', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'On Hold']
  const saasPlans = [
    ['Internal', 'Owner and internal production team', ['Apex Copilot', 'Project Workspace', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps']],
    ['Starter', 'Small clients needing guided project intake and deliverables', ['Client Workspace', 'Apex Copilot chat', 'file uploads', 'output viewer']],
    ['Pro', 'Design/build teams needing ArchVis, video and project package workflows', ['ArchVis Studio', 'DirectCut Studio', 'Project exports', 'CRM proposal support']],
    ['Business', 'AEC offices needing client portal, CRM, finance and operational modules', ['Admin dashboard', 'Client dashboards', 'CRM', 'Finance', 'Budget', 'Contracts', 'FieldOps']],
    ['Enterprise', 'Larger firms needing governance, integrations and custom workflows', ['All modules', 'advanced permissions', 'custom connectors', 'source confidence reporting']],
    ['Offshore Production Partner', 'US/EU firms outsourcing BIM/CAD/Revit/permit documentation to Apex', ['BIM/Revit production workflow', 'permit packages', 'estimating', 'project delivery dashboard', 'client reporting']],
    ['Custom AI/BIM Operations', 'AEC operations that need a custom AI-enabled production system', ['Custom Copilot workflows', 'BIM operations', 'document intelligence', 'automation roadmap']],
  ].map(([name, targetUser, includedModules]) => ({
    name,
    targetUser,
    includedModules,
    limits: ['Local-first scaffold in this checkpoint', 'Connector limits TBD'],
    suggestedPricePlaceholder: name === 'Internal' ? 'Internal cost center' : 'Placeholder until market research confirms',
    sourceConfidence: 'PLACEHOLDER',
  }))
  const accounting = {
    chartOfAccountsPlaceholder: ['Service revenue', 'SaaS subscription revenue', 'BIM/Revit production revenue', 'ArchVis/render revenue', 'DirectCut/video revenue', 'Contractor/subcontractor expense', 'Software/tools expense', 'Marketing/sales expense', 'Taxes payable placeholder', 'Accounts receivable', 'Accounts payable'],
    ledger: [
      { id: 'ledger-revenue-placeholder', type: 'revenue', date: '', description: 'Revenue record placeholder. Enter real invoice/payment data before accounting use.', clientOrSupplier: 'Client company', amount: 0, currency: safeCurrency, taxCategory: 'NEEDS_ACCOUNTANT_REVIEW', costCenter: 'Client project', evidence: 'SYSTEM_GENERATED' },
      { id: 'ledger-expense-placeholder', type: 'expense', date: '', description: 'Expense record placeholder. Attach receipts or imported documents before accountant export.', clientOrSupplier: 'Supplier not entered', amount: 0, currency: safeCurrency, taxCategory: 'NEEDS_ACCOUNTANT_REVIEW', costCenter: 'Client project', evidence: 'SYSTEM_GENERATED' },
    ],
    monthlyAccountingSummary: 'Monthly accounting summary is a preparation draft only. No tax filing, tax compliance or paid invoice is confirmed.',
    monthlyRevenueReport: 'Revenue report placeholder: no confirmed revenue records have been entered yet.',
    monthlyExpenseReport: 'Expense report placeholder: no confirmed expense records have been entered yet.',
    invoicesSummary: 'Invoice summary placeholder: draft invoices are not sent or paid.',
    paymentsSummary: 'Payment summary placeholder: payment connector is not connected and no payment is confirmed.',
    accountsReceivableReport: 'Accounts receivable placeholder: amounts require user-entered invoices or imported accounting documents.',
    accountsPayableReport: 'Accounts payable placeholder: supplier bills/expenses require user-entered or imported documents.',
    projectProfitLossReport: 'Project profit/loss placeholder: profit cannot be confirmed until revenue and expenses are entered or imported.',
    taxPreparationChecklist: ['Confirm jurisdiction, company type and accountant/tax advisor requirements.', 'Attach invoices, receipts and supplier documents.', 'Review tax categories with accountant before filing.', 'Do not treat Apex-generated tax fields as confirmed calculations.'],
    documentsPendingForAccountant: ['Client/company legal data', 'Supplier data and receipts', 'Issued invoices', 'Payment confirmations from real provider or bank records', 'Expense documents', 'Jurisdiction-specific tax guidance from accountant'],
    accountantHandoffPackage: 'Accountant handoff package includes ledger placeholders, invoices summary, payments summary, accounts receivable/payable, project P/L draft, tax prep checklist and pending documents list. It requires accountant review before filing.',
    reviewNotice: accountingNotice,
  }
  return {
    providerStatus: 'local-demo',
    modeNotice: localNotice,
    authStatus: 'not-connected',
    databaseStatus: 'not-connected',
    paymentProviderStatus: 'not-connected',
    focus,
    usersRoles: {
      roles: ['Owner/Admin', 'Internal Team', 'Client', 'Partner', 'Viewer', 'Contractor', 'Finance', 'Sales'],
      rule: 'Client users must not access admin/internal data. Real enforcement requires approved auth/database/RLS later.',
    },
    clientWorkspace: {
      clientName: 'Client workspace',
      projects: [{ name: 'Client project', status: 'New', uploadedFiles: 0, outputs: 0, proposals: 0, invoices: 0, messages: 0 }],
      visibleToClient: ['active projects', 'uploaded files', 'generated outputs', 'proposals', 'invoices', 'messages', 'project status', 'next actions'],
      hiddenFromClient: ['admin settings', 'internal finance controls', 'other clients', 'internal production notes unless shared'],
    },
    crm: {
      pipelineStages,
      leads: [{ id: 'lead-local-demo', name: 'New client lead', company: 'Client company', source: 'Manual / local demo', status: 'New', notes: goal, assignedOwner: 'Owner/Admin', expectedValue: 0, currency: safeCurrency, probability: 0, nextAction: 'Qualify need, project type, budget range, location and decision timeline.' }],
      contacts: [{ id: 'contact-local-demo', name: 'Client contact', company: 'Client company', role: 'Decision maker', email: 'not connected', phone: 'not connected', notes: 'Local scaffold only. No real CRM database is connected.' }],
      companies: ['Client company'],
      opportunities: [{ id: 'opportunity-local-demo', title: 'Apex service opportunity', company: 'Client company', stage: 'New Lead', expectedValue: 0, currency: safeCurrency, probability: 0, proposalLink: 'Not generated yet', followUpTask: 'Prepare discovery questions and proposal package.', nextAction: 'Build proposal with scope, deliverables, assumptions and next meeting CTA.' }],
      followUpTasks: ['Confirm client objective and project location.', 'Collect files, scope and deadline.', 'Prepare proposal package and presentation assets.', 'Schedule follow-up after proposal review.'],
      recommendations: ['Keep CRM data local until real database/auth is approved.', 'Separate client-visible project data from internal/admin data.', 'Use Research Studio before publishing market-based pricing.'],
    },
    sales: {
      title: 'Apex commercial proposal package',
      executiveSummary: 'Apex can organize project intake, production modules and client deliverables into a clear proposal package. Pricing remains placeholder until user-provided or source-verified.',
      serviceScope: ['Client intake and file review', 'Apex Copilot project guidance', 'Selected production module outputs', 'Project workspace/export package'],
      quotePackages: ['Starter: project intake and basic output package', 'Pro: ArchVis/DirectCut/Budget production package', 'Business: client workspace, CRM and finance workflow package', 'Offshore Production Partner: US/EU BIM/Revit/permit documentation support'],
      pricingTiers: saasPlans,
      salesScript: 'Lead with the client outcome, show the project workflow, define deliverables, label assumptions, then close with the next practical action.',
      emailDraft: 'Hi [Client], I prepared an Apex workflow for your project with intake, deliverables, timeline assumptions and next steps. I can send the package for review and adjust scope after your feedback.',
      followUpSequence: ['Day 1: send proposal package', 'Day 3: clarify scope/questions', 'Day 7: confirm decision path', 'Day 14: offer revised package or close as on hold'],
      objectionHandling: ['If price is high: separate must-have deliverables from optional add-ons.', 'If timing is uncertain: propose a discovery/preflight package first.', 'If trust is low: show sample outputs and source-confidence labels.'],
      clientPresentationPackage: ['project problem', 'Apex workflow', 'deliverables', 'timeline assumptions', 'investment placeholder', 'next action'],
      internationalPositioning: 'For US/EU clients, position Apex as an offshore BIM/CAD/Revit and permit documentation production partner first, with AI-powered delivery as leverage.',
    },
    finance: {
      invoices: [{ id: 'invoice-local-placeholder', client: 'Client company', project: 'Client project', amount: 0, currency: safeCurrency, status: 'Draft', dueDate: '', source: 'local placeholder' }],
      payments: [{ id: 'payment-local-placeholder', invoiceId: 'invoice-local-placeholder', amount: 0, currency: safeCurrency, status: 'UNKNOWN', evidence: 'UNKNOWN' }],
      expenses: [{ id: 'expense-local-placeholder', project: 'Client project', category: 'Production cost placeholder', amount: 0, currency: safeCurrency, status: 'Draft', taxCategory: 'NEEDS_ACCOUNTANT_REVIEW', costCenter: 'Client project', evidence: 'SYSTEM_GENERATED' }],
      summary: { currency: safeCurrency, revenueSummary: 'No real revenue connected. Enter values manually or connect a finance/payment provider later.', clientBalance: 'Unknown until invoices/payments are user-entered or provider-connected.', accountsReceivable: 'Placeholder only — no payment connector is connected.', accountsPayable: 'Placeholder only — supplier bills/expenses must be user-entered or imported.', projectCostProfit: 'Unknown until project costs and invoices are entered.', paymentConnectorStatus: 'not-connected', warnings: [paymentNotice, 'Do not treat draft invoices as sent or paid.'] },
      accounting,
    },
    saasPlans,
    adminDashboard: { usersCount: 3, clientsCount: 1, projectsCount: 1, leadsCount: 0, proposalsCount: 0, revenuePlaceholder: 'Revenue not connected — use Finance Studio with user-entered data only.', usageSummary: ['Local Project Workspace is active.', 'Auth/database/payment connectors are not connected.', 'Client data boundaries are modeled but not enforced by a backend yet.'], moduleUsage: ['Apex Copilot', 'ArchVis', 'DirectCut', 'BIM/3D', 'Budget', 'Contracts', 'FieldOps', 'CRM', 'Finance'], openTasks: ['Connect real auth before production client access.', 'Connect database/RLS before multi-client persistence.', 'Connect payment provider before invoices can be sent/paid.'] },
    clientDashboard: { activeProjects: 1, uploadedFiles: 0, generatedOutputs: 0, proposals: 0, invoices: 0, messages: 0, projectStatus: 'New', nextActions: ['Upload project files', 'Confirm scope', 'Review proposal package'] },
    recommendations: [focus === 'finance-accounting' ? 'Prepare accountant handoff package, but keep tax/compliance fields as NEEDS_ACCOUNTANT_REVIEW.' : 'Use local-first scaffolding until auth/database/payment connector is approved.', 'Do not expose admin/internal data to Client role in the future production model.', 'Use Export Center to package only real local project data.'],
    warnings: [localNotice, paymentNotice, accountingNotice, 'No fake login, fake database persistence, fake invoice sent status or fake payment confirmation.'],
    message: 'SaaS/CRM/Finance layer generated in local demo mode.',
  }
}

async function handleBusinessPlan(req, res) {
  try {
    const body = await readJson(req)
    const plan = createBusinessPlanPayload({
      goal: String(body.goal || ''),
      focus: String(body.focus || 'all'),
      currency: body.currency,
    })
    json(res, 200, { plan })
  } catch (error) {
    json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      providerStatus: 'local-demo',
    })
  }
}

function contractsRisk(id, clause, issue, severity, evidence, recommendation, ownerAction) {
  return {
    id,
    clause,
    issue,
    severity,
    evidence,
    recommendation,
    ownerAction,
    status: 'Open',
  }
}

function permitItem(id, category, requirement, evidence) {
  return {
    id,
    category,
    requirement,
    evidence,
    status: 'Open',
  }
}

function permitPackageDoc(id, documentName, group, responsibleParty, evidenceLevel, notes) {
  return {
    id,
    documentName,
    group,
    responsibleParty,
    status: 'Not started',
    evidenceLevel,
    dueDate: '',
    notes,
    sourceLink: '',
  }
}

function permitPackageForRegion(region, evidenceLevel, jurisdictionLabel) {
  const verifyNote = `Verify exact current requirement with ${jurisdictionLabel}.`
  if (region === 'EU') {
    return [
      permitPackageDoc('eu-planning', 'Planning permission / planning application package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General EU-style planning package item. ${verifyNote}`),
      permitPackageDoc('eu-building-control', 'Building control / building permit submission', 'required documents', 'architect/engineer-provided', evidenceLevel, `General building control package item. ${verifyNote}`),
      permitPackageDoc('eu-zoning', 'Zoning / land-use compliance summary', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm local land-use constraints. ${verifyNote}`),
      permitPackageDoc('eu-fire', 'Fire safety strategy and drawings', 'required documents', 'architect/engineer-provided', evidenceLevel, `Fire safety requirements vary by municipality/country. ${verifyNote}`),
      permitPackageDoc('eu-accessibility', 'Accessibility compliance checklist', 'required documents', 'architect/engineer-provided', evidenceLevel, `Use local accessibility standard only after source verification. ${verifyNote}`),
      permitPackageDoc('eu-energy', 'Energy performance / EPC-style documentation', 'required documents', 'architect/engineer-provided', evidenceLevel, `Energy documentation is jurisdiction-dependent. ${verifyNote}`),
      permitPackageDoc('eu-environmental', 'Environmental impact screening', 'unknown until jurisdiction verified', 'architect/engineer-provided', 'NEEDS_LOCAL_AUTHORITY', `May or may not be required. ${verifyNote}`),
      permitPackageDoc('eu-structural', 'Structural documentation / calculations', 'required documents', 'architect/engineer-provided', evidenceLevel, `Engineer-stamped requirements vary. ${verifyNote}`),
      permitPackageDoc('eu-mep', 'MEP documentation', 'optional documents', 'architect/engineer-provided', evidenceLevel, `May be required depending on scope. ${verifyNote}`),
      permitPackageDoc('eu-heritage', 'Heritage / conservation constraints check', 'unknown until jurisdiction verified', 'authority-provided', 'NEEDS_LOCAL_AUTHORITY', `Only confirm after local authority/source check. ${verifyNote}`),
      permitPackageDoc('eu-contractor', 'Contractor documentation and insurance', 'optional documents', 'contractor-provided', evidenceLevel, `Confirm contractor documentation locally. ${verifyNote}`),
      permitPackageDoc('eu-completion', 'Completion / occupancy certificate checklist', 'required documents', 'authority-provided', evidenceLevel, `General completion-stage package item. ${verifyNote}`),
    ]
  }
  if (region === 'UK') {
    return [
      permitPackageDoc('uk-planning', 'Planning permission application package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General UK planning package item. ${verifyNote}`),
      permitPackageDoc('uk-building-control', 'Building control application package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General building control package item. ${verifyNote}`),
      permitPackageDoc('uk-fire', 'Fire strategy / building safety notes', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm project-specific fire/building safety requirements. ${verifyNote}`),
      permitPackageDoc('uk-accessibility', 'Access statement / accessibility checklist', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm local and project-specific scope. ${verifyNote}`),
      permitPackageDoc('uk-energy', 'Energy / sustainability compliance documents', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm source-backed requirement. ${verifyNote}`),
      permitPackageDoc('uk-heritage', 'Conservation / listed building check', 'unknown until jurisdiction verified', 'authority-provided', 'NEEDS_LOCAL_AUTHORITY', `Only if site constraints apply. ${verifyNote}`),
      permitPackageDoc('uk-completion', 'Completion certificate checklist', 'required documents', 'authority-provided', evidenceLevel, `General completion-stage package item. ${verifyNote}`),
    ]
  }
  if (region === 'Brazil') {
    return [
      permitPackageDoc('br-aprovacao', 'Pacote de aprovação municipal / alvará', 'required documents', 'architect/engineer-provided', evidenceLevel, `Checklist geral; confirmar na prefeitura/local authority. ${verifyNote}`),
      permitPackageDoc('br-art-rrt', 'ART/RRT / responsabilidade técnica', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirmar responsável técnico e exigência local. ${verifyNote}`),
      permitPackageDoc('br-projeto', 'Projeto arquitetônico e complementares', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirmar escopo de pranchas exigidas. ${verifyNote}`),
      permitPackageDoc('br-bombeiros', 'Checklist Corpo de Bombeiros / fire safety', 'unknown until jurisdiction verified', 'architect/engineer-provided', 'NEEDS_LOCAL_AUTHORITY', `Pode depender de uso, área e estado. ${verifyNote}`),
      permitPackageDoc('br-habite-se', 'Habite-se / certificado de conclusão', 'required documents', 'authority-provided', evidenceLevel, `Checklist geral de fechamento. ${verifyNote}`),
    ]
  }
  return [
    permitPackageDoc('us-building-permit', 'Building permit application package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General US permit package item. ${verifyNote}`),
    permitPackageDoc('us-zoning', 'Zoning review / planning application', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm zoning and planning path with AHJ. ${verifyNote}`),
    permitPackageDoc('us-site-plan', 'Site plan review package', 'required documents', 'architect/engineer-provided', evidenceLevel, `General site plan package item. ${verifyNote}`),
    permitPackageDoc('us-fire-marshal', 'Fire marshal review package', 'unknown until jurisdiction verified', 'architect/engineer-provided', 'NEEDS_LOCAL_AUTHORITY', `Required scope varies by occupancy/AHJ. ${verifyNote}`),
    permitPackageDoc('us-ada', 'ADA / accessibility checklist', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm applicability and local amendments. ${verifyNote}`),
    permitPackageDoc('us-environmental', 'Environmental review / screening', 'unknown until jurisdiction verified', 'authority-provided', 'NEEDS_LOCAL_AUTHORITY', `May be required by site/scope. ${verifyNote}`),
    permitPackageDoc('us-stormwater', 'Stormwater / drainage package', 'unknown until jurisdiction verified', 'architect/engineer-provided', 'NEEDS_LOCAL_AUTHORITY', `Often site/scope dependent. ${verifyNote}`),
    permitPackageDoc('us-energy', 'Energy code compliance package', 'required documents', 'architect/engineer-provided', evidenceLevel, `Confirm applicable code edition locally. ${verifyNote}`),
    permitPackageDoc('us-structural', 'Structural calculations package', 'required documents', 'architect/engineer-provided', evidenceLevel, `Engineer requirements vary. ${verifyNote}`),
    permitPackageDoc('us-mep', 'MEP permit package', 'optional documents', 'architect/engineer-provided', evidenceLevel, `May be separate trade permits depending on AHJ. ${verifyNote}`),
    permitPackageDoc('us-contractor', 'Contractor licensing, insurance and bonds', 'required documents', 'contractor-provided', evidenceLevel, `Confirm local licensing and bond requirements. ${verifyNote}`),
    permitPackageDoc('us-co', 'Inspections and certificate of occupancy checklist', 'required documents', 'authority-provided', evidenceLevel, `General closeout/inspection package item. ${verifyNote}`),
  ]
}

async function handleContractsPlan(req, res) {
  try {
    const body = await readJson(req)
    const context = body.context || {}
    const source = body.source || null
    const action = String(body.action || 'draft')
    const goal = String(body.goal || '')
    const documentType = String(context.documentType || 'Contract')
    const location = String(context.location || '')
    const region = String(context.region || 'US')
    const country = String(context.country || '')
    const stateProvince = String(context.stateProvince || '')
    const cityMunicipality = String(context.cityMunicipality || '')
    const ahjLocalAuthority = String(context.ahjLocalAuthority || '')
    const jurisdictionParts = [cityMunicipality, stateProvince, country].filter(Boolean).join(', ')
    const jurisdictionLabel = ahjLocalAuthority || location || jurisdictionParts || 'local AHJ / authority'
    const hasJurisdictionDetail = Boolean(ahjLocalAuthority || location || jurisdictionParts)
    const jurisdictionStatus = hasJurisdictionDetail ? 'ASSUMPTION' : 'UNKNOWN'
    const permitEvidenceLevel = hasJurisdictionDetail ? 'GENERAL_GUIDANCE' : 'NEEDS_LOCAL_AUTHORITY'
    const detectedDocumentType = source ? documentType : documentType
    const highRiskEvidence = 'NEEDS LAWYER REVIEW'

    const riskItems = [
      contractsRisk(
        'risk-scope',
        'Scope of services',
        'Scope may be too broad or not tied to deliverables and acceptance criteria.',
        'High',
        source ? 'ASSUMPTION' : 'UNKNOWN',
        'Define included services, excluded services, deliverables, acceptance criteria and change-order trigger.',
        'Confirm exact scope and attach drawings/proposal/budget reference.'
      ),
      contractsRisk(
        'risk-payment',
        'Payment schedule',
        'Payment milestones may not protect cash flow or delivery risk.',
        'Medium',
        'ASSUMPTION',
        'Tie payments to mobilization, procurement, execution milestone and final delivery.',
        'Confirm deposit amount, milestone dates, late-payment consequences and retainage if any.'
      ),
      contractsRisk(
        'risk-change-orders',
        'Change orders',
        'Missing change-order process can create unpaid extra work.',
        'High',
        'ASSUMPTION',
        'Require written approval for scope, price and schedule impact before extra work starts.',
        'Add a simple change-order approval clause.'
      ),
      contractsRisk(
        'risk-lawyer',
        'Jurisdiction-specific enforceability',
        'Local legal enforceability cannot be confirmed without lawyer/local authority review.',
        'High',
        highRiskEvidence,
        'Send final draft to qualified lawyer for jurisdiction-specific review.',
        location ? `Confirm local rules for ${location}.` : 'Add jurisdiction/location before finalizing.'
      ),
    ]

    const permitCategories = [
      'zoning / land use',
      'building permit',
      'fire safety',
      'accessibility',
      'environmental',
      'HOA / condominium',
      'utility connections',
      'occupancy / habite-se',
      'engineering responsibility / ART/RRT equivalent',
      'local authority documents',
      'insurance / bonds if applicable',
    ]
    const permitChecklist = permitCategories.map((category, index) => permitItem(
      `permit-${index + 1}`,
      category,
      hasJurisdictionDetail
        ? `General ${region} package checklist item for ${category}; confirm exact current requirement with ${jurisdictionLabel}.`
        : `General checklist item for ${category}; jurisdiction is unknown.`,
      permitEvidenceLevel
    ))
    const permitPackage = permitPackageForRegion(region, permitEvidenceLevel, jurisdictionLabel)

    const projectName = String(context.projectName || 'the project')
    const parties = String(context.parties || 'Owner / Client / Contractor')
    const mode = String(context.reviewMode || 'Draft')
    const sourceCopy = source ? `Uploaded source: ${source.name}.` : 'No uploaded legal document; draft is based on typed context only.'
    const documentSummary = [
      `${mode} support for ${documentType} related to ${projectName}.`,
      sourceCopy,
      hasJurisdictionDetail ? `Jurisdiction context provided: ${jurisdictionLabel}. Region: ${region}.` : `Jurisdiction/location not provided. Region mode: ${region}.`,
      'This is planning/legal support, not licensed legal approval.',
    ].join(' ')

    const scopeDraft = {
      servicesIncluded: [
        'Project services described in approved proposal/scope.',
        'Coordination, delivery review and client communication as agreed.',
        'Documented deliverables listed in the contract/proposal.',
      ],
      materialsSpecs: [
        'Materials/specs must reference approved drawings, budget or memorial descritivo.',
        'Substitutions require written approval before procurement.',
      ],
      exclusions: [
        'Permit fees, taxes, third-party approvals and hidden conditions unless expressly included.',
        'Additional scope not documented in writing.',
      ],
      ownerSuppliedItems: [
        'Owner/client supplied items must be listed with deadlines and responsibility for defects/delays.',
      ],
      qualityStandards: [
        'Work should follow approved drawings, applicable codes and agreed finish standard.',
      ],
      deliverables: [
        'Approved proposal/scope, schedule note, payment milestones and acceptance criteria.',
      ],
      changeOrderRules: [
        'Any change in scope, cost or time requires written change-order approval before execution.',
      ],
      acceptanceCriteria: [
        'Delivery is accepted after review against agreed scope, punch-list closure and documented handover.',
      ],
    }

    const contractDraft = [
      'SIMPLE SERVICE AGREEMENT DRAFT',
      '',
      `Project: ${projectName}`,
      `Parties: ${parties}`,
      `Location/Jurisdiction: ${location || 'UNKNOWN - confirm before final use'}`,
      '',
      '1. Scope. The service provider will perform the services described in the attached proposal, drawings, budget and/or memorial descritivo.',
      '2. Exclusions. Permit fees, taxes, authority charges, hidden conditions and third-party approvals are excluded unless expressly written into the scope.',
      '3. Payment. Payment milestones must be confirmed in writing before work starts.',
      '4. Changes. Any change in scope, price or schedule requires written approval before execution.',
      '5. Deliverables and acceptance. Final acceptance occurs after delivery review, punch-list closure and documented approval.',
      '6. Legal review. This draft must be reviewed by a qualified lawyer before signature.',
    ].join('\n')

    const pendingQuestions = [
      'What is the exact jurisdiction/location?',
      'What is the AHJ / local authority name?',
      'Who are the legal parties and signatories?',
      'Which drawings, budget and memorial descritivo are attached as contract exhibits?',
      'What payment milestones, deadlines and penalties should apply?',
      'Which permits/approvals are required by local authority?',
    ]
    if (action === 'permits') pendingQuestions.unshift('Confirm property type, zoning, project size and authority having jurisdiction.')
    if (!hasJurisdictionDetail) pendingQuestions.unshift('Add country, state/province, city/municipality and AHJ/local authority before treating requirements as current.')

    const usChecklist = permitPackageForRegion('US', permitEvidenceLevel, jurisdictionLabel)
      .map(item => `- ${item.documentName} (${item.responsibleParty}; ${item.evidenceLevel})`)
      .join('\n')
    const euChecklist = permitPackageForRegion('EU', permitEvidenceLevel, jurisdictionLabel)
      .map(item => `- ${item.documentName} (${item.responsibleParty}; ${item.evidenceLevel})`)
      .join('\n')
    const architectDocs = permitPackage
      .filter(item => item.responsibleParty === 'architect/engineer-provided')
      .map(item => `- ${item.documentName}`)
      .join('\n') || '- Confirm architectural/engineering package with local authority.'
    const ownerDocs = permitPackage
      .filter(item => item.responsibleParty === 'owner-provided')
      .map(item => `- ${item.documentName}`)
      .join('\n') || '- Property address/APN or parcel reference\n- Proof of ownership or authorization\n- Owner contact and billing details\n- Existing survey/site information if available'
    const contractorDocs = permitPackage
      .filter(item => item.responsibleParty === 'contractor-provided')
      .map(item => `- ${item.documentName}`)
      .join('\n') || '- Contractor license/status\n- Insurance certificate\n- Bonds if required\n- Trade permit contacts'
    const missingDocs = permitPackage
      .filter(item => item.evidenceLevel === 'UNKNOWN' || item.evidenceLevel === 'NEEDS_LOCAL_AUTHORITY' || item.group === 'unknown until jurisdiction verified')
      .map(item => `- ${item.documentName}: ${item.notes}`)
      .join('\n') || '- No missing/unknown package item has been identified yet, but local authority verification is still required.'
    const packageOutputs = {
      usPermitPackageChecklist: `US permit package checklist (GENERAL GUIDANCE - verify with AHJ):\n${usChecklist}`,
      euPermitPackageChecklist: `EU permit package checklist (GENERAL GUIDANCE - verify with municipality/building authority):\n${euChecklist}`,
      ahjInquiryEmailDraft: [
        `Subject: Permit package requirements inquiry for ${projectName}`,
        '',
        `Hello ${ahjLocalAuthority || 'Permit Department'},`,
        '',
        `We are preparing a ${region} permit/document package for ${projectName}. Could you confirm the current submittal requirements, drawing sets, forms, fees, review path, inspection sequence, accessibility/fire/energy/stormwater requirements, and any local amendments for ${jurisdictionLabel}?`,
        '',
        'Please also confirm whether preliminary zoning/site plan review is required before building permit submission.',
        '',
        'Thank you,',
        'Apex AI Copilot / Project Team',
      ].join('\n'),
      architectEngineerDocumentRequestList: `Architect/engineer document request list:\n${architectDocs}`,
      ownerDocumentRequestList: `Owner document request list:\n${ownerDocs}`,
      contractorComplianceChecklist: `Contractor compliance checklist:\n${contractorDocs}`,
      permitSubmissionCoverLetter: [
        `Permit submission cover letter draft for ${projectName}`,
        '',
        `This package is submitted for preliminary authority review. The enclosed checklist is evidence-labeled and any item marked NEEDS_LOCAL_AUTHORITY remains subject to confirmation by ${jurisdictionLabel}.`,
      ].join('\n'),
      revisionResponseLetter: [
        `Revision response letter draft for ${projectName}`,
        '',
        'Thank you for the review comments. The project team will respond item-by-item, attach revised drawings/documents, and identify any remaining open items requiring authority confirmation.',
      ].join('\n'),
      missingDocumentsReport: `Missing / authority-dependent documents:\n${missingDocs}`,
    }

    json(res, 200, {
      plan: {
        providerStatus: source || goal ? 'review-draft' : 'planning-only',
        documentSummary,
        detectedDocumentType,
        jurisdictionStatus,
        sourceConfidence: 'NEEDS_WEB_VERIFICATION',
        needsVerification: true,
        riskItems,
        permitChecklist,
        permitPackage,
        packageOutputs,
        scopeDraft,
        contractDraft,
        clientFacingSummary: [
          `Prepared a ${documentType} draft/review for ${projectName}.`,
          'The next step is to confirm scope, price, schedule, permits and signatories before sending a client-facing version.',
        ].join(' '),
        lawyerReviewSummary: [
          'Lawyer review requested for jurisdiction-specific enforceability, liability, termination, dispute resolution, licensing/permit obligations and consumer/business compliance.',
          `Evidence status: ${jurisdictionStatus}. High-risk legal clauses are marked NEEDS LAWYER REVIEW.`,
        ].join(' '),
        pendingQuestions,
        message: 'Contracts Studio generated a planning/review draft. This is not legal approval and no permit database is connected.',
      },
    })
  } catch (error) {
    json(res, error.status || 500, {
      error: scrubProviderError(error.message || error),
      providerStatus: 'planning-only',
    })
  }
}

async function handleResearchPlan(req, res) {
  try {
    const body = await readJson(req)
    const researchType = String(body.researchType || 'Market research')
    const query = String(body.query || '')
    const region = String(body.region || '')
    const freshness = String(body.freshness || 'Current source required')
    const checked = new Date().toISOString()
    const sinapiIntent = /sinapi|construction cost source|pricing|pre[cç]o|custo/i.test(`${researchType} ${query}`)
    const sources = [
      {
        title: 'Live web connector',
        sourceName: 'Not connected in local runtime',
        url: '',
        dateChecked: checked,
        evidenceLevel: 'NEEDS_WEB_VERIFICATION',
        note: 'Apex did not browse the web or verify current sources in this request.',
      },
    ]
    if (sinapiIntent) {
      sources.push({
        title: 'SINAPI source',
        sourceName: 'not-connected',
        url: '',
        dateChecked: checked,
        evidenceLevel: 'NEEDS_WEB_VERIFICATION',
        note: 'No SINAPI table/API is connected. Do not use any SINAPI value until a source is uploaded or connected.',
      })
    }
    const findings = [
      {
        id: 'finding-source-status',
        claim: 'Current market/pricing/legal data was not verified live.',
        evidence: 'Local runtime has no configured web/source connector for this endpoint.',
        confidence: 'NEEDS_WEB_VERIFICATION',
        source: 'Apex local runtime status',
        date: checked,
      },
      {
        id: 'finding-research-plan',
        claim: `Research plan needed for: ${query || researchType}.`,
        evidence: 'User request and selected research type.',
        confidence: 'USER_PROVIDED',
        source: 'User prompt',
        date: checked,
      },
      {
        id: 'finding-assumption',
        claim: region ? `Region context: ${region}.` : 'Region/location is not confirmed.',
        evidence: region ? 'User-provided region field.' : 'Missing region field.',
        confidence: region ? 'USER_PROVIDED' : 'NEEDS_WEB_VERIFICATION',
        source: region ? 'User input' : 'missing input',
        date: checked,
      },
    ]
    const proposalBuilder = {
      executiveSummary: `Apex prepared a source-aware ${researchType.toLowerCase()} plan for "${query || 'the requested topic'}". This is a research plan, not verified live market intelligence.`,
      marketOpportunity: 'Define opportunity only after live web/source verification or user-provided evidence is attached.',
      clientPainPoints: [
        'Client needs credible current evidence before decisions.',
        'Pricing, competitors and regulations must be sourced before proposal claims.',
        'Apex should label assumptions separately from confirmed facts.',
      ],
      valueProposition: 'Apex can convert verified sources into a proposal, positioning, offer, pricing assumptions and next-step CTA.',
      competitivePositioning: 'Needs competitor/source verification before making current-market claims.',
      pricingAssumptions: sinapiIntent
        ? ['SINAPI source is not connected.', 'Use placeholder pricing only until uploaded SINAPI table or live source is connected.']
        : ['Pricing is not verified.', 'Use user-provided or placeholder assumptions until sources are connected.'],
      recommendedOffer: 'Prepare a source-backed proposal after collecting web/source evidence, competitor examples, pricing basis and regional constraints.',
      ctaNextStep: 'Connect web/source provider or upload source files, then rerun research with citations.',
    }
    json(res, 200, {
      plan: {
        providerStatus: 'web-not-connected',
        researchType,
        query,
        region,
        freshness,
        sinapiStatus: sinapiIntent ? 'not-connected' : 'not-connected',
        sources,
        findings,
        proposalBuilder,
        pendingVerification: [
          'Connect live web/source provider before claiming current market data.',
          'Attach user-provided source files for pricing, competitor or regulatory claims.',
          'For SINAPI, upload an official table or configure a real connector before using values.',
        ],
        message: 'Research Studio produced a connector-ready plan. No live web research, fake citations, fake SINAPI prices or current legal/regulatory claims were generated.',
      },
    })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error), providerStatus: 'web-not-connected' })
  }
}

async function handleSourceEvidence(req, res) {
  try {
    const body = await readJson(req)
    const title = String(body.title || 'Source evidence request')
    json(res, 200, {
      evidence: {
        title,
        sourceName: 'not-connected',
        url: '',
        dateChecked: new Date().toISOString(),
        evidenceLevel: 'NEEDS_WEB_VERIFICATION',
        note: 'Source evidence connector is not configured. Provide a URL/source file or connect a web provider.',
      },
    })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error) })
  }
}

function exportSafeSlug(value = 'apex-export') {
  return String(value || 'apex-export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'apex-export'
}

function exportRedact(value, summary = []) {
  if (Array.isArray(value)) return value.map(item => exportRedact(item, summary))
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value
    let next = value
    const patterns = [
      [/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED_OPENAI_KEY]', 'OpenAI-style API key redacted'],
      [/ghp_[A-Za-z0-9_]{12,}/g, '[REDACTED_GITHUB_TOKEN]', 'GitHub token redacted'],
      [/github_pat_[A-Za-z0-9_]{12,}/g, '[REDACTED_GITHUB_TOKEN]', 'GitHub PAT redacted'],
      [/(api[_-]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s,}]+/gi, '$1=[REDACTED]', 'Generic secret assignment redacted'],
      [/\.env\.local/gi, '[REDACTED_ENV_FILE]', '.env.local reference redacted'],
    ]
    for (const [pattern, replacement, note] of patterns) {
      if (pattern.test(next)) {
        next = next.replace(pattern, replacement)
        if (!summary.includes(note)) summary.push(note)
      }
    }
    return next
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/(api[_-]?key|token|secret|password|env)/i.test(key)) {
      const note = `Sensitive field redacted: ${key}`
      if (!summary.includes(note)) summary.push(note)
      return [key, '[REDACTED]']
    }
    return [key, exportRedact(item, summary)]
  }))
}

function exportStripImages(value, warnings = []) {
  if (Array.isArray(value)) return value.map(item => exportStripImages(item, warnings))
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      if (!warnings.includes('Image/dataUrl assets excluded by request.')) warnings.push('Image/dataUrl assets excluded by request.')
      return '[IMAGE_DATA_URL_EXCLUDED]'
    }
    return value
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (/dataUrl|url/i.test(key) && typeof item === 'string' && item.startsWith('data:image/')) {
      if (!warnings.includes('Image/dataUrl assets excluded by request.')) warnings.push('Image/dataUrl assets excluded by request.')
      return [key, '[IMAGE_DATA_URL_EXCLUDED]']
    }
    return [key, exportStripImages(item, warnings)]
  }))
}

function exportPickSections(project, scope, selectedSections, includeChat) {
  const sectionSet = new Set(selectedSections || [])
  const includeAll = scope === 'full-project'
  const should = section => includeAll || scope === section || sectionSet.has(section)
  const appState = project.appState || {}
  const savedExports = Array.isArray(project.exports) ? project.exports : []
  const byType = type => savedExports.filter(item => String(item?.type || '').includes(type))
  const output = {
    project: should('project') ? {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      language: project.language,
      activeTool: project.activeTool,
      activeStudio: project.activeStudio,
      files: project.files,
      chatMessages: includeChat ? project.chatMessages : '[CHAT_EXCLUDED]',
      revisionConstraints: project.revisionConstraints,
      preferences: project.preferences,
    } : undefined,
    archvis: should('archvis') ? {
      outputs: project.archVisOutputs,
      generatedImages: project.generatedImages,
      revisionConstraints: project.revisionConstraints,
      activeState: appState.archVisOutput || null,
    } : undefined,
    directcut: should('directcut') ? {
      plans: project.directCutPlans,
      activeState: appState.directCutOutput || null,
    } : undefined,
    bim3d: should('bim-3d') || should('bim3d') ? {
      items: project.bim3dItems,
      savedViews: project.savedViews,
      tours: project.tours,
      activeState: appState.bim3DActive || null,
    } : undefined,
    budget: should('budget') ? {
      exports: byType('budget'),
      activeState: appState.budgetOutput || null,
    } : undefined,
    contracts: should('contracts-permits') || should('contracts') ? {
      exports: byType('contracts'),
      activeState: appState.contractsOutput || null,
    } : undefined,
    fieldops: should('fieldops-rdo') || should('fieldops') ? {
      exports: byType('field-operations'),
      activeState: appState.fieldOpsOutput || null,
    } : undefined,
    research: should('research-market') || should('research') ? {
      exports: byType('research'),
      activeState: appState.researchOutput || null,
    } : undefined,
    skills: should('skill-package') || should('skills') ? {
      skillUpdates: project.skillUpdates,
      projectMemory: project.projectMemory,
    } : undefined,
  }
  return Object.fromEntries(Object.entries(output).filter(([, value]) => value !== undefined))
}

function exportToMarkdown(title, payload, warnings) {
  const lines = [`# ${title}`, '', '## Warnings', ...(warnings.length ? warnings.map(item => `- ${item}`) : ['- None.']), '']
  for (const [section, value] of Object.entries(payload)) {
    lines.push(`## ${section}`, '', '```json', JSON.stringify(value, null, 2), '```', '')
  }
  return lines.join('\n')
}

function exportToText(title, payload, warnings) {
  return [
    title,
    '',
    'Warnings:',
    ...(warnings.length ? warnings.map(item => `- ${item}`) : ['- None.']),
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n')
}

function exportToCsv(payload) {
  const files = payload.project?.files || []
  const exports = Object.entries(payload)
    .flatMap(([section, value]) => Array.isArray(value?.exports) ? value.exports.map(item => ({ section, type: item.type || '', timestamp: item.timestamp || '' })) : [])
  const rows = [
    ['section', 'name_or_type', 'kind_or_timestamp', 'size'].join(','),
    ...files.map(file => ['file', file.name, file.kind, file.size].map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')),
    ...exports.map(item => ['export', item.type, item.timestamp, ''].map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')),
  ]
  return rows.join('\n')
}

async function handleExportPackage(req, res) {
  try {
    const body = await readJson(req)
    const project = body.project || {}
    const exportScope = String(body.exportScope || 'full-project')
    const format = String(body.format || 'json')
    const includeImages = Boolean(body.includeImages)
    const includeChat = body.includeChat !== false
    const selectedSections = Array.isArray(body.selectedSections) ? body.selectedSections.map(String) : []
    const warnings = []
    const redactionSummary = []
    if (!project || typeof project !== 'object' || !project.name) {
      return json(res, 400, { error: 'Valid project state is required for export.' })
    }
    let payload = exportPickSections(project, exportScope, selectedSections, includeChat)
    if (!includeImages) payload = exportStripImages(payload, warnings)
    payload = exportRedact(payload, redactionSummary)
    if (!includeChat) warnings.push('Chat messages excluded by request.')
    if (includeImages) warnings.push('Image/dataUrl assets may make this export large.')
    warnings.push('Export includes only data/assets present in local project state. No external files were fetched.')
    const base = `${exportSafeSlug(project.name)}-${exportSafeSlug(exportScope)}`
    const title = `Apex Export - ${project.name} - ${exportScope}`
    let files = []
    if (format === 'markdown') {
      const content = exportToMarkdown(title, payload, warnings)
      files = [{ filename: `${base}.md`, mimeType: 'text/markdown;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    } else if (format === 'txt') {
      const content = exportToText(title, payload, warnings)
      files = [{ filename: `${base}.txt`, mimeType: 'text/plain;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    } else if (format === 'csv') {
      const content = exportToCsv(payload)
      files = [{ filename: `${base}.csv`, mimeType: 'text/csv;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    } else if (format === 'zip-json') {
      const bundle = {
        manifest: { projectName: project.name, exportScope, createdAt: new Date().toISOString(), format, includeImages, includeChat },
        files: {
          'project-package.json': payload,
          'README.md': exportToMarkdown(title, payload, warnings),
        },
      }
      const content = JSON.stringify(bundle, null, 2)
      files = [{ filename: `${base}.zip-compatible.json`, mimeType: 'application/json;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    } else {
      const content = JSON.stringify({ manifest: { projectName: project.name, exportScope, createdAt: new Date().toISOString(), includeImages, includeChat }, payload }, null, 2)
      files = [{ filename: `${base}.json`, mimeType: 'application/json;charset=utf-8', content, size: Buffer.byteLength(content, 'utf8') }]
    }
    return json(res, 200, {
      providerStatus: 'export-ready',
      files,
      warnings,
      redactionSummary: redactionSummary.length ? redactionSummary : ['No secrets detected in exported project state.'],
    })
  } catch (error) {
    return json(res, error.status || 500, { error: scrubProviderError(error.message || 'Export package failed.') })
  }
}

async function handleAnalyzeSkillUpdate(req, res) {
  try {
    const body = await readJson(req)
    const file = body.file || {}
    const ext = skillFileExtension(file.name)
    const supported = new Set(['txt', 'md', 'json', 'pdf', 'py', 'js', 'ts', 'tsx', 'zip'])
    if (!supported.has(ext)) {
      json(res, 400, { error: 'Unsupported skill update file type. Use TXT, MD, JSON, PDF, PY, JS, TS, TSX or ZIP.' })
      return
    }

    const sanitizedText = redactSensitiveText(String(file.text || '')).slice(0, 120000)
    const classification = classifySkillUpdate(file, sanitizedText)
    const summaryParts = summarizeSkillUpdate(file, sanitizedText, classification)
    const warnings = []
    const conflicts = []
    const duplicates = []

    if (!sanitizedText) warnings.push('Readable text was not extracted. Apex will treat this as metadata/reference until a parser is connected.')
    if (classification.riskLevel === 'high') warnings.push('Potential secrets, dangerous code or unsafe instructions were detected. Global update is blocked.')
    if (/\b(eval|exec|child_process|subprocess|os\.system|Invoke-Expression|curl\s+.*\|\s*sh)\b/i.test(sanitizedText)) {
      warnings.push('Executable or shell-like patterns detected. Apex will not execute uploaded code.')
      conflicts.push('Code may be useful only as reference after manual review.')
    }

    const runtime = loadRuntimeKnowledge()
    const existingUpdates = Array.isArray(runtime.skillUpdates) ? runtime.skillUpdates : []
    if (existingUpdates.some(update => update.sourceFilename === file.name && update.summary === summaryParts.additions[0])) {
      duplicates.push('A similar source filename and summary already exists in runtime knowledge.')
    }

    const recommendedTarget = classification.riskLevel === 'high'
      ? 'project-memory'
      : classification.category === 'project-memory'
        ? 'project-memory'
        : 'global-skill-update'

    const timestamp = new Date().toISOString()
    json(res, 200, {
      analysis: {
        updateId: safeId('skill-update'),
        timestamp,
        sourceFilename: String(file.name || 'uploaded-file'),
        category: classification.category,
        targetDomain: classification.targetDomain,
        summary: `Skill update proposal from ${file.name || 'uploaded file'} for ${classification.targetDomain}.`,
        understood: summaryParts.understood,
        additions: summaryParts.additions,
        updates: summaryParts.updates,
        ignored: summaryParts.ignored,
        warnings,
        duplicates,
        conflicts,
        riskLevel: classification.riskLevel,
        recommendedTarget,
        sanitizedText,
        rollbackNote: 'Remove this update entry from runtimeKnowledge.skillUpdates and revert the matching docs/SKILL_UPDATE_LOG.md entry.',
      },
    })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error) })
  }
}

async function handleApplySkillUpdate(req, res) {
  try {
    const body = await readJson(req)
    const analysis = body.analysis || {}
    const approvalType = body.approvalType
    const ownerApproved = body.ownerApproved === true
    if (approvalType !== 'global-skill-update') {
      json(res, 400, { error: 'This endpoint only applies global skill updates. Project memory is saved locally in the browser workspace.' })
      return
    }
    if (!ownerApproved) {
      json(res, 403, { error: 'Owner approval is required before applying a global skill update.' })
      return
    }
    if (analysis.riskLevel === 'high') {
      json(res, 409, { error: 'High-risk skill updates cannot be applied globally. Save as project memory or reject.' })
      return
    }

    const timestamp = new Date().toISOString()
    const editedContent = redactSensitiveText(String(body.editedContent || analysis.sanitizedText || '')).slice(0, 120000)
    const runtime = loadRuntimeKnowledge()
    const updateEntry = {
      updateId: String(analysis.updateId || safeId('skill-update')),
      timestamp,
      sourceFilename: String(analysis.sourceFilename || 'uploaded-file'),
      summary: String(analysis.summary || 'Global skill update approved by Owner.'),
      targetDomain: String(analysis.targetDomain || 'general'),
      category: String(analysis.category || 'project-memory'),
      approvalType: 'global-skill-update',
      content: editedContent,
      warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
      rollbackNote: String(analysis.rollbackNote || 'Remove this update from runtimeKnowledge.skillUpdates.'),
    }
    runtime.skillUpdates = Array.isArray(runtime.skillUpdates) ? runtime.skillUpdates : []
    runtime.skillUpdates.push(updateEntry)
    runtime.memorySummary = Array.isArray(runtime.memorySummary) ? runtime.memorySummary : []
    runtime.memorySummary.push(`Owner-approved skill update ${updateEntry.updateId}: ${updateEntry.summary}`)
    saveRuntimeKnowledge(runtime)

    fs.mkdirSync(path.dirname(skillUpdateLogPath), { recursive: true })
    const logEntry = [
      '',
      `## ${timestamp} - ${updateEntry.updateId}`,
      `- Source: ${updateEntry.sourceFilename}`,
      `- Approval: global skill update`,
      `- Domain: ${updateEntry.targetDomain}`,
      `- Category: ${updateEntry.category}`,
      `- Summary: ${updateEntry.summary}`,
      `- Affected files: src/lib/runtimeKnowledge.json, docs/SKILL_UPDATE_LOG.md`,
      `- Rollback: ${updateEntry.rollbackNote}`,
    ].join('\n')
    if (!fs.existsSync(skillUpdateLogPath)) {
      fs.writeFileSync(skillUpdateLogPath, '# Apex AI Copilot Skill Update Log\n', 'utf8')
    }
    fs.appendFileSync(skillUpdateLogPath, `${logEntry}\n`, 'utf8')

    json(res, 200, {
      result: {
        updateId: updateEntry.updateId,
        timestamp,
        approvalType: 'global-skill-update',
        sourceFilename: updateEntry.sourceFilename,
        summary: updateEntry.summary,
        targetDomain: updateEntry.targetDomain,
        affectedFiles: ['src/lib/runtimeKnowledge.json', 'docs/SKILL_UPDATE_LOG.md'],
        rollbackNote: updateEntry.rollbackNote,
        applied: true,
      },
    })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error) })
  }
}

async function handleExportSkillPack(req, res) {
  try {
    const body = await readJson(req)
    const runtime = loadRuntimeKnowledge()
    const allowedTargets = new Set(['chatgpt', 'gemini', 'claude', 'api', 'cursor-codex', 'generic-md', 'generic-json', 'zip-bundle'])
    if (!allowedTargets.has(String(body.targetPlatform || ''))) {
      json(res, 400, { error: 'Unsupported export target.' })
      return
    }
    const pack = buildSkillExportPack(body, runtime)
    json(res, 200, { pack })
  } catch (error) {
    json(res, error.status || 500, { error: scrubProviderError(error.message || error) })
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
  if (req.url === '/api/copilot/video-plan' && req.method === 'POST') {
    handleVideoPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/bim-plan' && req.method === 'POST') {
    handleBimPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/bim-tour-plan' && req.method === 'POST') {
    handleBimTourPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/fieldops-plan' && req.method === 'POST') {
    handleFieldOpsPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/budget-plan' && req.method === 'POST') {
    handleBudgetPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/contracts-plan' && req.method === 'POST') {
    handleContractsPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/research-plan' && req.method === 'POST') {
    handleResearchPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/source-evidence' && req.method === 'POST') {
    handleSourceEvidence(req, res)
    return
  }
  if (req.url === '/api/copilot/export-package' && req.method === 'POST') {
    handleExportPackage(req, res)
    return
  }
  if (req.url === '/api/copilot/business-plan' && req.method === 'POST') {
    handleBusinessPlan(req, res)
    return
  }
  if (req.url === '/api/copilot/analyze-skill-update' && req.method === 'POST') {
    handleAnalyzeSkillUpdate(req, res)
    return
  }
  if (req.url === '/api/copilot/apply-skill-update' && req.method === 'POST') {
    handleApplySkillUpdate(req, res)
    return
  }
  if (req.url === '/api/copilot/export-skill-pack' && req.method === 'POST') {
    handleExportSkillPack(req, res)
    return
  }
  serveStatic(req, res)
})

const port = Number(process.env.PORT || 4177)
server.listen(port, () => {
  console.log(`Apex AI Copilot platform listening on http://127.0.0.1:${port}`)
})

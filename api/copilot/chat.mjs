import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runApexOperatorProductionSafe } from '../../server/agent/apexOperatorRuntime.mjs'
import { collectProductionOperatorStatus } from '../../server/agent/productionStatus.mjs'
import { classifyToolExecutionRequest, routeToolExecution, routeH6ActionRequest } from '../../server/agent/toolExecutionRouter.mjs'
import { isConfirmationSignal, isCancelSignal, hasPendingAction } from '../../server/agent/confirmationStateMachine.mjs'
import { classifyProductionConversationIntent } from '../../server/agent/productionConversationRouter.mjs'

// PDF summary pattern — triggers local extraction-based summary
const PDF_SUMMARY_PATTERN = /\b(resuma|analise|analisa|resume|sumari[sz]|principais?|pontos?|extraia|extrair|o que (fala|diz|trata)|me (conta|diga|fale)|sobre o que|resumo|síntese|sinopse)\b/i

// H5.0D: action tools that must always bypass conversation/connector router
const H5_ACTION_TOOLS = new Set([
  'local_worker.status',
  'revit_mcp.status',
  'revit_model.status',
  'vercel.deploy',
  'supabase.migration',
])

const productionRouterIntents = new Set([
  'production_display_name_preference',
  'production_name_identity',
  'production_who_am_i',
  'production_user_confusion',
  'production_revit_bim_help',
  'production_computer_help',
  'production_multi_intent',
  'production_github_connector_status',
  'production_vercel_connector_status',
  'production_connector_status',
  'production_platform_position',
  'production_vercel_deploy',
  'production_supabase',
  'production_execute_recommended',
  'production_h7_confirmation',
  'production_next_step',
])

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const runtimeKnowledgePath = path.resolve(__dirname, '../../src/lib/runtimeKnowledge.json')

function loadRuntimeKnowledge() {
  return JSON.parse(fs.readFileSync(runtimeKnowledgePath, 'utf8'))
}

function prefersPortugueseText(text = '') {
  return /\b(vc|voce|você|quem sou|o que|serviços|servicos|orçamento|orcamento|consultoria|arquivo|anexar|construcao|construção|alvara|alvará|contrato|proposta|financeiro|campo|obra)\b|[ãõçáéíóú]/i.test(text)
}

function isCapabilitiesQuestionText(text = '') {
  return /\b(o que (vc|voce|você) sabe fazer|o que faz|quais servi[cç]os|servi[cç]os|capabilities|what can you do|what do you do|features)\b/i.test(text.trim())
}

function isContactQuestionText(text = '') {
  return /\b(or[cç]amento|consultoria|contato|falar com|proposal|quote|estimate|consultation|contact)\b/i.test(text.trim())
}

function isUploadQuestionText(text = '') {
  return /\b(upload|arquivo|anexar|mandar imagem|enviar arquivo|screenshot|planta|pdf|file|attach)\b/i.test(text.trim())
}

function isIdentityQuestionText(text) {
  return /\b(vc sabe quem sou eu|você sabe quem sou eu|voce sabe quem sou eu|quem sou eu|do you know who i am|who am i)\b/i.test(String(text || '').trim())
}

function buildIdentityReply(userText, identity) {
  if (!isIdentityQuestionText(userText)) return ''
  if (!identity.email && !identity.role && !identity.workspaceName && !identity.persistenceMode && !identity.tenantId && !identity.profileName) {
    return 'Ainda não tenho dados de sessão disponíveis nesta requisição. Não vou inventar nome, email, role ou workspace sem contexto real.'
  }
  const ownerLine = identity.isOwnerAdmin ? ' Você está marcado como owner_admin.' : ''
  const missing = []
  if (!identity.profileName) missing.push('nome completo/perfil')
  if (!identity.email) missing.push('email')
  if (!identity.role) missing.push('role')
  if (!identity.workspaceName) missing.push('workspace')
  if (!identity.persistenceMode) missing.push('persistence')
  if (!identity.tenantId) missing.push('tenant/workspace id')
  const missingLine = missing.length ? ` Dados não disponíveis na sessão: ${missing.join(', ')}.` : ''
  return `Sim. Você está logado como ${identity.email || 'email não disponível'}, com role ${identity.role || 'não disponível'}, no workspace ${identity.workspaceName || 'não disponível'}, usando persistence ${identity.persistenceMode || 'não disponível'}.${ownerLine}${missingLine} Ainda não vou inventar dados além do que está disponível na sessão.`
}

function buildChatFallbackReply(userText, identity, file = null) {
  const identityReply = buildIdentityReply(userText, identity)
  if (identityReply) return identityReply
  const pt = prefersPortugueseText(userText)
  if (file && file.extractedText && isCapabilitiesQuestionText(userText)) {
    return pt
      ? 'Com este arquivo ativo, posso resumir o PDF, extrair pontos principais, responder perguntas sobre o conteúdo, organizar os tópicos em lista, transformar trechos em briefing ou relatório e identificar próximos passos práticos.'
      : 'With this file active, I can summarize the PDF, extract key points, answer questions about the content, turn it into a list, convert passages into a briefing or report, and suggest practical next steps.'
  }
  if (isCapabilitiesQuestionText(userText)) {
    return pt
      ? 'A Apex AI Copilot ajuda em BIM 5D/6D/7D, visualização 3D e ArchViz, CFD e simulações, agentes de IA, DirectCut, vendas, marketing, contabilidade, financeiro, alvarás, contratos, jurídico, documentos, propostas, engenharia e operações de campo. Você pode conversar comigo, enviar arquivos, pedir análise de projeto e transformar isso em ações dentro da plataforma.'
      : 'Apex AI Copilot helps with BIM 5D/6D/7D, 3D and ArchViz, CFD and simulations, AI agents, DirectCut, sales, marketing, accounting, finance, permits, contracts, legal, documents, proposals, engineering and field operations. You can chat, upload files, request project analysis and turn that into platform actions.'
  }
  if (isContactQuestionText(userText)) {
    return pt
      ? 'Posso ajudar a preparar a consulta. Envie nome, email, telefone, cidade, tipo de projeto e o que precisa: BIM, 3D, contrato, alvará, proposta, financeiro, marketing ou operação de campo.'
      : 'I can help prepare the consultation. Send name, email, phone, city, project type and what you need: BIM, 3D, contract, permit, proposal, finance, marketing or field operations.'
  }
    if (isUploadQuestionText(userText)) {
      if (file && file.kind === 'pdf' && file.extractionStatus === 'ready' && String(file.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize)\b/i.test(userText || '')) {
      return buildLocalPdfSummary(file.name, file.pageCount || 0, file.extractedText || '')
    }
    return 'Pode enviar arquivo, PDF, imagem, planta ou screenshot pelo botão de anexar. Eu uso o arquivo como contexto da conversa e sigo com uma resposta direta.'
  }
  return pt
    ? 'Tive um problema ao gerar a resposta completa, mas posso continuar. Reformule o pedido ou envie um arquivo/screenshot para eu analisar.'
    : 'I had trouble generating the full response, but I can continue. Rephrase the request or upload a file/screenshot for me to analyze.'
}

function buildLocalPdfSummary(fileName, pageCount, extractedText) {
  const text = String(extractedText || '').trim()
  const snippet = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,6).join(' ').replace(/\s+/g, ' ').slice(0,800)
  const tipo = /certida/i.test(text) ? 'Certidão' : /relat/i.test(text) ? 'Relatório' : 'Documento'
  const numberMatch = text.match(/(?:Certid[aã]o\s*(?:n[oº]?\.?|n[oº]?|\:)?\s*([\w\-\/\.]+))/i) || text.match(/\b(n[oº]\s*[:\-]?\s*([\d\-\/\.]+))/i)
  const certNumber = numberMatch ? (numberMatch[1] || numberMatch[2]) : undefined
  const dateMatches = Array.from(new Set([...(text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) || []), ...(text.match(/\b\d{1,2}\s+de\s+[A-Za-zçãéíóú]+\s+de\s+\d{4}\b/gi) || [])])).slice(0,5)
  const nameFromFile = fileName ? fileName.replace(/\.pdf$/i,'').split('-').pop().trim() : null
  const orgMatch = text.match(/\b(Servi[cç]o P[uú]blico Federal|Servi[cç]o P[uú]blico|Prefeitura|Cart[oó]rio|Tribunal|Secretaria|Minist[eé]rio|Junta|Cartorio|Conselho|Registro)\b/i)
  const org = orgMatch ? orgMatch[0] : undefined

  const mainPoints = []
  if (snippet) mainPoints.push(snippet)
  if (certNumber) mainPoints.push(`Número: ${certNumber}`)
  if (dateMatches.length) mainPoints.push(`Datas relevantes: ${dateMatches.join(', ')}`)
  if (org) mainPoints.push(`Órgão emissor: ${org}`)

  const conclusion = /certida/i.test(text)
    ? 'Documento de natureza administrativa/registral. Recomenda-se verificar assinaturas e autenticidade no cartório/órgão emissor quando necessário.'
    : 'Resumo gerado a partir do texto extraído; revisar o documento completo para decisões finais.'

  const parts = []
  parts.push('Resumo do PDF:')
  parts.push('')
  parts.push('Tipo de documento:')
  parts.push(tipo)
  parts.push('')
  parts.push('Finalidade:')
  parts.push(/certida/i.test(text) ? 'Certificar/atestar informação legal registrada.' : 'Informar/registrar dados oficiais contidos no documento.')
  parts.push('')
  parts.push('Principais informações:')
  if (mainPoints.length) {
    mainPoints.forEach(p => parts.push(`- ${p}`))
  } else {
    parts.push('- Conteúdo extraído disponível, mas sem pontos claros identificáveis automaticamente.')
  }
  parts.push('')
  parts.push('Dados relevantes identificados:')
  parts.push(`- Nome: ${nameFromFile || 'Não identificado'}`)
  parts.push(`- Órgão: ${org || 'Não identificado'}`)
  parts.push(`- Número da certidão: ${certNumber || 'Não identificado'}`)
  parts.push(`- Datas: ${dateMatches.length ? dateMatches.join(', ') : 'Não identificadas'}`)
  parts.push(`- Registro / identificação profissional: Não identificado`)
  parts.push('')
  parts.push('Conclusão:')
  parts.push(conclusion)
  parts.push('')
  parts.push('Limitações:')
  parts.push('Resumo gerado a partir do texto extraído automaticamente.')

  return parts.join('\n')
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
      'Execution rule: build the output now. If user wants a proposal, contract, script, RDO or custom code, produce it.',
      '1. Draft/write the full output.',
      '2. Present it in a clean code block or paragraph structure.',
      '3. Make it ready to copy.',
      '4. Do not offer a blank template.',
    )
  }
  if (intent.asksRenderPrompt && file) {
    instructions.push(
      'Image rendering prompt rule: write the stable-diffusion/midjourney render prompt.',
      'Include structure, materials, lighting, camera and environment.',
      'Add negative prompt for modifications if applicable.',
    )
  }
  if (intent.asksSalesOutput && file) {
    instructions.push(
      'Sales copy rule: write the commercial pitch, client proposal, outreach copy, landing page section or ad copy.',
      'Focus on international offshore BIM modeling, Revit/permit design, tech documentation or offshore partner value.',
    )
  }
  if (intent.asksContractDraft) {
    instructions.push(
      'Contract draft rule: write the basic service agreement, client terms, NDA or offshore developer contract copy.',
    )
  }
  if (intent.asksCapabilities && !file) {
    instructions.push(
      'Do not use bullet points or headings to list abilities. Speak in fluid, warm, conversational paragraph style.',
      'Example of good introduction: Eu sou a Apex AI Copilot, sua parceira de IA. Posso ajudar você em tudo: desde planejamento BIM, orçamento e RDO no canteiro, até programação TypeScript, escrita criativa, tradução, prospecção e contratos de trabalho. O que quer resolver agora?',
    )
  }
  if (intent.isHiddenUpload && file && prefersPortugueseText(userText)) {
    instructions.push(
      'Para o primeiro upload de arquivo, use a seguinte estrutura de resposta:',
      '1. Dizer que recebeu o arquivo e fazer uma rápida leitura visual ou de metadados de 2 a 4 linhas.',
      '2. Dar 3 a 5 opções numeradas e práticas de próximas ações.',
      'Exemplo de ações recomendadas:',
      '1. Criar prompt de render ou briefing visual para ArchViz.',
      '2. Analisar o modelo BIM / 3D Studio ou fluxo de importação.',
      '3. Levantar quantitativos de custos para orçamento.',
      '4. Roteirizar timelapse, vídeo ou animação de câmera.',
      '5. Preparar proposta técnica ou contrato com base no escopo.',
      '6. Criar texto de venda para anuncio, site ou proposta.',
      '7. Levantar duvidas tecnicas para orcamento.',
      '8. Separar proximos arquivos necessarios para BIM/3D.',
      'Do not ask a question before this list.',
    )
  }
  return instructions.join('\n')
}

function buildToolSummary(tools) {
  return tools.map(tool => `- ${tool.name}: ${tool.role}`).join('\n')
}

function buildIdentityContextSummary(identity) {
  return [
    `email: ${identity.email || 'unknown'}`,
    `role: ${identity.role || 'unknown'}`,
    `workspaceName: ${identity.workspaceName || 'unknown'}`,
    `persistenceMode: ${identity.persistenceMode || 'unknown'}`,
    `tenantId: ${identity.tenantId || 'unknown'}`,
    `isOwnerAdmin: ${identity.isOwnerAdmin ? 'true' : 'false'}`,
    `profileName: ${identity.profileName || 'unknown'}`,
  ].join('\n')
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
  if (/(agentes|8 agentes|cognitive agents|maestro|bim manager|evm|nr compliance|cost controller|doc manager|scheduler|quality qa|agente cognitivo|agentes cognitivos)/.test(text)) {
    contexts.push('Cognitive Agents: expose the 8-agent Apex layer with honest status. Maestro AI orchestrates studios; BIM Manager connects BIM/3D; EVM Analyst has local-first CP11C support for CPI/SPI/EAC/VAC/TCPI/PV/EV/AC; NR Compliance has local-first CP11C support for NR-6/NR-10/NR-18/NR-33/NR-35; Cost Controller connects Budget/Finance/EVM/SINAPI source confidence; Doc Manager connects Project Workspace/Export Center/docs; Scheduler has local-first CP11C Gantt/milestones/critical path planning; Quality QA connects FieldOps/NR/punch list/NCIs/PBQP-H/ISO awareness. Do not fake external connectors or official completion.')
  }
  if (/(evm|cpi|spi|eac|vac|tcpi|planned value|earned value|actual cost|cronograma|gantt|caminho cr[ií]tico|atraso|lookahead|cronograma f[ií]sico-financeiro|nr-18|nr-35|nr-10|nr-6|nr-33|seguran[cç]a do trabalho|compliance nr)/.test(text)) {
    contexts.push('CP11C EVM/Scheduler/NR: run local analysis only. Calculate CPI=EV/AC, SPI=EV/PV, CV=EV-AC, SV=EV-PV, EAC/ETC/VAC/TCPI only when inputs exist. Missing PV/EV/AC/BAC stays UNKNOWN. Scheduler is local Gantt/milestone/lookahead planning only, no MS Project integration. NR compliance is GENERAL_GUIDANCE or NEEDS_SAFETY_REVIEW; no official compliance approval or safety certification.')
  }
  if (/(fornecedor|fornecedores|supply chain|cotação|cotacao|rfq|compra|material|materiais|subcontratado|procurement|supplier)/.test(text)) {
    contexts.push('CP11E Supply Chain: local supplier registry, procurement items, RFQs and comparisons only. Do not fake ERP, supplier price, availability or verification. Label data USER_ENTERED, PLACEHOLDER or NEEDS_VERIFICATION.')
  }
  if (/(alerta|notificação|notificacao|prazo|lembrete|pendência|pendencia|vencimento|atraso crítico|atraso critico|deadline|notification)/.test(text)) {
    contexts.push('CP11E Notifications: local alerts only. No push, email, SMS or calendar connector is connected unless explicitly verified. Label Local alert only - notification connector not connected yet.')
  }
  if (/(custo de ia|gasto com ia|tokens|observabilidade|custo openai|ai cost|billing|usage dashboard)/.test(text)) {
    contexts.push('CP11E AI Cost / Observability: local estimated usage and cost only. Do not claim provider billing accuracy. Use ESTIMATED_LOCAL until real billing/usage API is connected.')
  }
  if (!contexts.length) {
    contexts.push('Platform: Apex AI Copilot is a command-first full AI assistant. Chat is primary; modules and connectors are optional execution paths.')
  }
  return contexts.slice(0, 6).join('\n')
}

function buildFileContext(file) {
  if (!file) return 'No uploaded file.'
  const lines = [
    'Uploaded file metadata:',
    `- name: ${file.name || 'unknown'}`,
    `- type: ${file.type || 'unknown'}`,
    `- kind: ${file.kind || 'unknown'}`,
    `- size: ${file.size || 'unknown'}`,
    file.dataUrl ? '- image content: supplied as data URL for vision analysis' : '- image/file content: not supplied; use metadata honestly',
  ]
  if (file.pageCount) lines.push(`- pageCount: ${file.pageCount}`)
  if (file.extractedText) {
    lines.push('', 'Extracted text from the active file:', String(file.extractedText).slice(0, 3000))
  }
  return lines.join('\n')
}

function buildLiveAgentToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'run_safe_local_command',
        description: 'Run a safe allowlisted local Apex project command when live project evidence is needed. Use this naturally; the user does not need to know command names.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            commandId: {
              type: 'string',
              enum: ['git_status', 'git_diff_stat', 'build', 'validate_supabase_sql', 'check_server'],
              description: 'Safe command to execute in the authorized Apex repo.'
            },
            reason: {
              type: 'string',
              description: 'Brief natural reason why this command is needed.'
            }
          },
          required: ['commandId', 'reason']
        }
      }
    }
  ]
}

async function executeLiveAgentToolCall(toolCall) {
  const name = toolCall && toolCall.function ? String(toolCall.function.name || '') : ''
  if (name !== 'run_safe_local_command') {
    return { providerStatus: 'blocked', error: 'Unknown Apex live agent tool.' }
  }

  let args = {}
  try {
    args = JSON.parse(toolCall.function.arguments || '{}')
  } catch {
    return { providerStatus: 'blocked', error: 'Invalid tool arguments.' }
  }

  const commandId = String(args.commandId || '')
  const reason = String(args.reason || '').slice(0, 500)

  return {
    providerStatus: 'unavailable',
    commandId,
    reason,
    error: 'Local command execution is unavailable in the serverless cloud environment.'
  }
}

function sendJson(res, status, body) {
  res.status(status).json(body)
}

function normalizeIdentityContext(value = {}) {
  return {
    email: value.email || '',
    role: value.role || '',
    workspaceName: value.workspaceName || '',
    persistenceMode: value.persistenceMode || '',
    tenantId: value.tenantId || '',
    isOwnerAdmin: Boolean(value.isOwnerAdmin) || value.role === 'owner_admin',
    profileName: value.profileName || '',
  }
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

// Build confirmation UI metadata for frontend buttons
function buildConfirmationUi(result) {
  if (!result.requiresApproval) return null
  return {
    show: true,
    intent: result.intent,
    pendingAction: result.memoryPatch?.pendingH6Action || null,
    buttons: [
      { id: 'confirm', label: 'Sim, executar', variant: 'primary', message: 'sim' },
      { id: 'cancel',  label: 'Não, cancelar', variant: 'secondary', message: 'não' },
      { id: 'adjust',  label: 'Ajustar',        variant: 'ghost',     message: null },
    ],
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, {
      error: 'Method not allowed',
      finalReply: 'BLOCKED - esta rota aceita apenas POST JSON.',
      reply: 'BLOCKED - esta rota aceita apenas POST JSON.',
    })
  }

  try {
    const body = await readJsonBody(req)
    const userMessage = String(body.message || '').slice(0, 12000)
    // When PDF context is injected into body.message, extract only the actual user query
    // for intent routing — prevents PDF keywords from triggering unrelated production routes
    const pdfUserQueryMatch = userMessage.match(/Pedido do usu[aá]rio:\s*(.+?)(?:\n|$)/i)
    const routingMessage = pdfUserQueryMatch ? pdfUserQueryMatch[1].trim() : userMessage
    const clientMemory = body.clientMemory || {}
    const productionStatus = collectProductionOperatorStatus()
    const fileCandidate = body.file || null
    const hasReadyPdfText = Boolean(
      fileCandidate &&
      fileCandidate.kind === 'pdf' &&
      fileCandidate.extractionStatus === 'ready' &&
      String(fileCandidate.extractedText || '').trim().length >= 20
    )
    const looksLikePdfSummary = hasReadyPdfText && PDF_SUMMARY_PATTERN.test(routingMessage || '')

    // Fast-path: greeting in Portuguese — no file context needed
    if (/^\s*(ol[aá]|oi|ola)\s*$/i.test(userMessage)) {
      const name = clientMemory.displayName ? `, ${clientMemory.displayName}` : ''
      const greeting = `Olá${name}. Como posso ajudar agora?`
      return sendJson(res, 200, {
        finalReply: greeting,
        reply: greeting,
        memoryPatch: null,
        mode: 'apex-greeting-pt',
        operator: { intent: 'production_affirmation' },
        confirmation: null,
        productionStatus,
      })
    }

    // Fast-path: PDF summary when text is ready — use local extraction, bypass operator
    if (looksLikePdfSummary) {
      const summary = buildLocalPdfSummary(fileCandidate?.name || '', fileCandidate?.pageCount || 0, fileCandidate?.extractedText || '')
      if (summary) {
        return sendJson(res, 200, {
          finalReply: summary,
          reply: summary,
          memoryPatch: null,
          mode: 'apex-pdf-summary-local',
          operator: { intent: 'production_pdf_summary' },
          confirmation: null,
          productionStatus,
        })
      }
    }

    // H7: if user says "sim" and there's a pending action, skip H5 bypass and go straight to runtime
    const hasPending = hasPendingAction(clientMemory)
    const isConfirm = isConfirmationSignal(userMessage)
    const isCancel = isCancelSignal(userMessage)

    if (isCancel && hasPending) {
      const cancelReply = 'Ação cancelada. Nenhuma execução realizada. O que mais posso fazer?'
      return sendJson(res, 200, {
        finalReply: cancelReply,
        reply: cancelReply,
        memoryPatch: { pendingH6Action: null },
        mode: 'apex-h7-cancelled',
        operator: { intent: 'h7_cancelled' },
        confirmation: null,
        productionStatus,
      })
    }

    // H5.0D: hard override — but skip if user is confirming a pending H7 action or if it's a mutation tool
    if (!(isConfirm && hasPending)) {
      const h5ToolIds = classifyToolExecutionRequest(routingMessage)
      const MUTATION_TOOLS = new Set(['vercel.deploy', 'supabase.migration'])
      const hasMutationTool = h5ToolIds.some(id => MUTATION_TOOLS.has(id))

      if (h5ToolIds.length && h5ToolIds.some(id => H5_ACTION_TOOLS.has(id)) && !hasMutationTool) {
        const toolExecution = await routeToolExecution({ userMessage, requestedToolIds: h5ToolIds })
        return sendJson(res, 200, {
          finalReply: toolExecution.finalReply,
          reply: toolExecution.finalReply,
          memoryPatch: null,
          mode: 'apex-h5-tool-execution-direct',
          operator: { intent: 'tool_execution', toolExecution },
          confirmation: null,
          productionStatus,
        })
      }
    }

    const productionConversationIntent = classifyProductionConversationIntent(routingMessage)

    // Short-circuit: If the request includes an active PDF with ready extraction and
    // the user's latest message is a PDF-summary/analysis intent, bypass the production
    // conversation routing and proceed to the LLM conversational flow with the file
    // context attached. This prevents very short Portuguese inputs (eg. "resuma") from
    // being classified as ambiguous and returning "Pergunta incompleta".
    try {
      const innerFileCandidate = body.file || null
      const looksLikePdfSummary = Boolean(innerFileCandidate && innerFileCandidate.kind === 'pdf' && innerFileCandidate.extractionStatus === 'ready' && String(innerFileCandidate.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize)\b/i.test(routingMessage || ''))
 if (!looksLikePdfSummary && productionRouterIntents.has(productionConversationIntent)) {
        const pdfText = String(innerFileCandidate.extractedText || '')
        const pdfSummaryPattern = /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize)\b/i
        if (pdfSummaryPattern.test(userMessage || '')) {
          // Force a conversational path by ensuring productionConversationIntent does not
          // trigger the productionRouterIntents branch. We simply fall through to the
          // conversational LLM flow below with body.file present.
          // No further action required here; leaving this block documents the short-circuit.
        }
      }
    } catch (err) {
      // Non-fatal: continue normal routing
    }

    // If this message looks like an H6 action (git, npm, etc.), route it directly
    // to the operator runtime so it can prepare a confirmation and set pendingH6Action.
    const h6Route = routeH6ActionRequest({ userMessage: routingMessage })
    if (h6Route) {
      const result = await runApexOperatorProductionSafe({
        userMessage,
        identityContext: normalizeIdentityContext(body.identityContext || {}),
        workspaceContext: body.workspaceContext || {},
        repoPath: process.cwd(),
        permissions: {},
        productionStatus,
        clientMemory,
        messages: Array.isArray(body.messages) ? body.messages : [],
      })

      return sendJson(res, 200, {
        finalReply: result.finalReply,
        reply: result.finalReply,
        memoryPatch: result.memoryPatch || null,
        mode: 'apex-operator-production-safe',
        operator: result,
        confirmation: buildConfirmationUi(result),
        productionStatus,
      })
    }

    // If the message appears to be a short PDF-summary request and the request
    // included a ready PDF with extractedText, avoid routing through the production
    // operator which may classify very short inputs as ambiguous. Instead, allow the
    // conversational flow below to handle the request with file context.
    const fileCandidate2 = body.file || null
    const looksLikePdfSummary2 = Boolean(fileCandidate2 && fileCandidate2.kind === 'pdf' && fileCandidate2.extractionStatus === 'ready' && String(fileCandidate2.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize)\b/i.test(routingMessage || ''))
    if (!looksLikePdfSummary2 && productionRouterIntents.has(productionConversationIntent)) {
      const result = await runApexOperatorProductionSafe({
        userMessage,
        identityContext: normalizeIdentityContext(body.identityContext || {}),
        workspaceContext: body.workspaceContext || {},
        repoPath: process.cwd(),
        permissions: {},
        productionStatus,
        clientMemory,
        messages: Array.isArray(body.messages) ? body.messages : [],
      })

      return sendJson(res, 200, {
        finalReply: result.finalReply,
        reply: result.finalReply,
        memoryPatch: result.memoryPatch || null,
        mode: 'apex-operator-production-safe',
        operator: result,
        confirmation: buildConfirmationUi(result),
        productionStatus,
      })
    }

    // Conversational/Natural Flow: Fall through to OpenAI completions
    const identityContext = normalizeIdentityContext(body.identityContext || {})
    const identityReply = buildIdentityReply(userMessage, identityContext)
    if (identityReply) {
      return sendJson(res, 200, {
        finalReply: identityReply,
        reply: identityReply,
        mode: 'identity-context',
        confirmation: null,
        productionStatus,
      })
    }

    // Portuguese-only greeting short-circuit for 'ola'/'oi' single-word greetings.
    if (/^\s*(ola|oi|ol[aá])\s*[.!?]?\s*$/i.test(userMessage || '')) {
      const greeting = 'Olá, Dr Edgard. Como posso ajudar agora?'
      return sendJson(res, 200, {
        finalReply: greeting,
        reply: greeting,
        mode: 'greeting-short-circuit',
        confirmation: null,
        productionStatus,
      })
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    const apiKey = anthropicKey || openaiKey
    if (!apiKey) {
      const fallbackReply = buildChatFallbackReply(userMessage, identityContext, body.file || null)
      return sendJson(res, 200, {
        finalReply: fallbackReply,
        reply: fallbackReply,
        mode: 'local-fallback',
        confirmation: null,
        productionStatus,
      })
    }

    const useAnthropic = Boolean(anthropicKey)
    const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'
    const runtime = loadRuntimeKnowledge()
    const file = body.file || null
    const conversation = Array.isArray(body.messages) ? body.messages.slice(-10) : []
    const preferredLanguage = String(body.language || body.locale || '').slice(0, 40)
    
    const intentInstruction = buildIntentInstruction(userMessage, file, conversation, preferredLanguage)
    const toolSummary = buildToolSummary(runtime.tools)
        const looksLikePdfSummaryRequest = Boolean(file && file.kind === 'pdf' && file.extractionStatus === 'ready' && String(file.extractedText || '').trim().length >= 20 && /\b(resuma|resumir|resuma o pdf|resuma este pdf|resuma esse pdf|esuma|analise|analise o pdf|explique|o que tem neste documento|o que diz|pontos principais|sumarize)\b/i.test(routingMessage || ''))
        let specialIntentInstruction = intentInstruction
        if (looksLikePdfSummaryRequest) {
          specialIntentInstruction = 'Resuma o documento em português em 5 a 8 tópicos. Não copie o texto bruto. Identifique tipo do documento, partes envolvidas, finalidade, dados principais, datas, órgão emissor e conclusão.\n' + specialIntentInstruction
        }
    
    const systemPrompt = [
      runtime.systemPrompt.join('\n'),
      '',
      'Connector registry summary. These are optional execution paths, not restrictions or required routing:',
      toolSummary,
      '',
      'Production memory summary:',
      runtime.memorySummary.join('\n'),
      '',
      'Authenticated session context:',
      buildIdentityContextSummary(identityContext),
      'Use this context when the user asks who they are. Do not invent a full name if profileName is unknown.',
      '',
      'Relevant local skill knowledge:',
      buildLocalSkillContext(userMessage, file),
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
      specialIntentInstruction,
    ].join('\n')

    const userContent = []
    userContent.push({
      type: 'text',
      text: [
        userMessage || 'The user uploaded a file and asks for guidance.',
        '',
        'Authenticated session context:',
        buildIdentityContextSummary(identityContext),
        '',
        buildFileContext(file),
        '',
        buildStyleInstruction(userMessage, file),
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

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...conversation
        .filter(item => item?.role === 'user' || item?.role === 'assistant')
        .map(item => ({ role: item.role, content: String(item.text || '').slice(0, 4000) })),
      { role: 'user', content: userContent },
    ]

    const liveAgentMessages = [
      ...messagesPayload.slice(0, -1),
      {
        role: 'system',
        content: [
          'Apex Live Agent Runtime is enabled.',
          'The user can talk naturally, like with ChatGPT or Codex. Do not require exact command phrases.',
          'You are not a button router. You are a live project copilot: infer intent from context, decide whether evidence is needed, use safe tools when useful, then give a recommendation.',
          'When live evidence about this local repo is useful, decide by yourself whether to call run_safe_local_command.',
          'Use tools only when useful. Do not use tools for normal writing, explanation, strategy, design or business answers.',
          'Never call raw shell. Never deploy. Never migrate Supabase. Never push. Never modify files from this tool.',
          'Critical truth rule: never claim that you committed, pushed, deployed, migrated, edited files, installed packages, or changed production unless a tool result explicitly proves that exact action.',
          'The live tool can validate status/build/checks only. It cannot commit. If the user says faca, ok, pode, segue, continua, infer the next safe action from context. If the next action is commit, recommend it and provide the exact command or ask for an explicit approved commit tool; do not claim it was done.',
          'Do not end with vague questions like "what would you like to do next?" when evidence supports a clear next step. Give a decisive recommendation and one practical next action.',
          'Use status language: GREEN for proven OK, YELLOW for pending/review, BLOCKED for unsafe/unavailable. Be confident only when evidence exists.',
          'After tool results, answer naturally in the latest user language with clear status, what is proven, what is not proven, and the recommended next execution.'
        ].join(' ')
      },
      messagesPayload[messagesPayload.length - 1],
    ]

    // ── Anthropic Claude path ─────────────────────────────────────────────
    if (useAnthropic) {
      const claudeModel = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
      // Extract system message and build Anthropic-format messages
      const systemText = liveAgentMessages
        .filter(m => m.role === 'system')
        .map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
        .join('\n\n')
      const anthropicMessages = liveAgentMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }))

      // Anthropic tool format
      const anthropicTools = [
        {
          name: 'run_safe_local_command',
          description: 'Run a safe allowlisted local Apex project command when live project evidence is needed.',
          input_schema: {
            type: 'object',
            properties: {
              commandId: {
                type: 'string',
                enum: ['git_status', 'git_diff_stat', 'build', 'validate_supabase_sql', 'check_server'],
                description: 'Safe command to execute in the authorized Apex repo.',
              },
              reason: { type: 'string', description: 'Brief natural reason why this command is needed.' },
            },
            required: ['commandId', 'reason'],
          },
        },
      ]

      const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 1024,
          system: systemText,
          messages: anthropicMessages,
          tools: anthropicTools,
        }),
      })

      const claudeData = await claudeResp.json().catch(() => ({}))
      if (!claudeResp.ok) {
        console.error('[Anthropic] error', claudeData?.error)
        return sendJson(res, 200, {
          finalReply: buildChatFallbackReply(userMessage, identityContext, file),
          reply: buildChatFallbackReply(userMessage, identityContext, file),
          mode: 'local-fallback',
          confirmation: null,
          productionStatus,
        })
      }

      const contentBlocks = Array.isArray(claudeData.content) ? claudeData.content : []
      const toolUseBlocks = contentBlocks.filter(b => b.type === 'tool_use')

      if (toolUseBlocks.length && claudeData.stop_reason === 'tool_use') {
        // Execute tools and follow up
        const toolResultContents = []
        for (const block of toolUseBlocks) {
          const fakeToolCall = { function: { name: block.name }, id: block.id, arguments: JSON.stringify(block.input || {}) }
          const result = await executeLiveAgentToolCall(fakeToolCall)
          toolResultContents.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
        }

        const followUpMessages = [
          ...anthropicMessages,
          { role: 'assistant', content: contentBlocks },
          { role: 'user', content: toolResultContents },
        ]

        const finalResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: 1024,
            system: systemText,
            messages: followUpMessages,
          }),
        })
        const finalData = await finalResp.json().catch(() => ({}))
        const finalReply = (Array.isArray(finalData.content) ? finalData.content : []).filter(b => b.type === 'text').map(b => b.text).join('') || ''
        return sendJson(res, 200, {
          finalReply: finalReply || buildChatFallbackReply(userMessage, identityContext, file),
          reply: finalReply || buildChatFallbackReply(userMessage, identityContext, file),
          model: claudeModel,
          mode: 'apex-claude-tool-calling',
          toolCalls: toolUseBlocks.map(b => b.name),
          confirmation: null,
          productionStatus,
        })
      }

      const reply = contentBlocks.filter(b => b.type === 'text').map(b => b.text).join('') || ''
      return sendJson(res, 200, {
        finalReply: reply || buildChatFallbackReply(userMessage, identityContext, file),
        reply: reply || buildChatFallbackReply(userMessage, identityContext, file),
        model: claudeModel,
        mode: 'apex-claude-chat',
        confirmation: null,
        productionStatus,
      })
    }

    // ── OpenAI fallback path ──────────────────────────────────────────────
    const requestPayload = {
      model: process.env.OPENAI_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages: liveAgentMessages,
      tools: buildLiveAgentToolDefinitions(),
      tool_choice: 'auto',
      temperature: 0.72,
      frequency_penalty: 0.2,
      max_tokens: 900,
    }

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + openaiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return sendJson(res, 200, {
        finalReply: buildChatFallbackReply(userMessage, identityContext, file),
        reply: buildChatFallbackReply(userMessage, identityContext, file),
        mode: 'local-fallback',
        confirmation: null,
        productionStatus,
      })
    }

    const assistantMessage = data && data.choices && data.choices[0] ? data.choices[0].message || {} : {}
    const toolCalls = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : []

    if (toolCalls.length) {
      const followUpMessages = [
        ...liveAgentMessages,
        { role: 'assistant', content: assistantMessage.content || '', tool_calls: toolCalls },
      ]
      for (const toolCall of toolCalls) {
        const toolResult = await executeLiveAgentToolCall(toolCall)
        followUpMessages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(toolResult) })
      }
      const finalResponse = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + openaiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: followUpMessages, temperature: 0.45, max_tokens: 900 }),
      })
      const finalData = await finalResponse.json().catch(() => ({}))
      const finalReply = finalData?.choices?.[0]?.message?.content || ''
      return sendJson(res, 200, {
        finalReply: finalReply || buildChatFallbackReply(userMessage, identityContext, file),
        reply: finalReply || buildChatFallbackReply(userMessage, identityContext, file),
        model: finalData.model,
        mode: 'live-agent-tool-calling',
        toolCalls: toolCalls.map(c => c?.function?.name || 'unknown'),
        confirmation: null,
        productionStatus,
      })
    }

    const reply = assistantMessage.content || ''
    return sendJson(res, 200, {
      finalReply: reply || buildChatFallbackReply(userMessage, identityContext, file),
      reply: reply || buildChatFallbackReply(userMessage, identityContext, file),
      model: data.model,
      usage: data.usage,
      mode: 'live-agent-chat',
      confirmation: null,
      productionStatus,
    })

  } catch (error) {
    console.error('Apex production chat route failed safely:', error?.message || error)
    const finalReply = [
      'YELLOW - Apex Copilot esta em producao, mas a rota serverless encontrou uma falha segura.',
      'Nao executei acoes locais, deploy, push ou migration.',
      'O chat continua operacional em modo seguro; revisar logs da funcao Vercel para corrigir a causa.',
    ].join('\n')
    return sendJson(res, 200, {
      finalReply,
      reply: finalReply,
      mode: 'apex-operator-production-safe-error',
      error: 'production_safe_route_error',
      confirmation: null,
    })
  }
}

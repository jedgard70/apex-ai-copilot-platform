import React, { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowUp,
  Bot,
  Building2,
  File as FileIcon,
  ImageIcon,
  Paperclip,
  Sparkles,
  Upload,
} from 'lucide-react'
import { ArchVisPanel } from './components/ArchVisPanel'
import { Bim3DPanel, BimArchVisOutput, BimTourOutput } from './components/Bim3DPanel'
import { DirectCutInitialConfig, DirectCutPanel } from './components/DirectCutPanel'
import { classifyFile, formatSize, IntakeFile, isVisionReady, readFileAsDataUrl, readImageDimensions } from './lib/fileIntake'
import { selectTool, tools } from './lib/toolRegistry'
import './styles.css'

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  attachment?: IntakeFile
}

type ArchVisOutput = {
  source: IntakeFile
  output: string
  conversationContext: string[]
}

type DirectCutOutput = {
  source?: IntakeFile
  goal: string
  conversationContext: string[]
  initialConfig?: DirectCutInitialConfig
}

type Bim3DOutput = {
  source: IntakeFile
}

type BimCommand = {
  id: string
  text: string
}

function normalizeRevisionConstraint(text: string) {
  const normalized = text.trim()
  const lower = normalized.toLowerCase()
  if (/(não|nao).*(jardim|paisag|garden).*(atr[aá]s|behind).*(su[ií]te|suite)/i.test(lower)) {
    return 'Do not create garden, landscaping, patio, grass or exterior continuation behind the suite.'
  }
  if (/(lavanderia|laundry|service).*(canto direito|lado direito|right side|right corner)|não mude a lavanderia|nao mude a lavanderia/i.test(lower)) {
    return 'Preserve laundry/service area on the right side as shown in the original plan.'
  }
  if (/(piscina|pool).*((não|nao).*(muda|mover|altera|change|move)|não muda|nao muda)/i.test(lower)) {
    return 'Keep pool exactly in original location, size and proportion.'
  }
  if (/(piscina|pool).*(lugar errado|wrong place|wrong location|errado)/i.test(lower)) {
    return 'Keep pool exactly in original location, size and proportion.'
  }
  if (/(mantenha|preserve|keep).*(banheiro|bathroom)/i.test(lower)) {
    return 'Preserve the bathroom exactly as shown in the original plan.'
  }
  if (/(isso|isto).*(não|nao).*(existe|tem).*(planta|plan)/i.test(lower)) {
    return `Do not add this element because it does not exist in the original plan: ${normalized}`
  }
  if (/(não|nao).*(existe|tem|crie|criar|invent).*/i.test(lower)) {
    return `Do not invent this element or condition: ${normalized}`
  }
  if (/(fica|est[aá]|preserve|mantenha|manter|keep)/i.test(lower)) {
    return `Preserve this correction from the owner: ${normalized}`
  }
  return `Apply this locked revision constraint: ${normalized}`
}

function isRevisionIntent(text: string) {
  return /\b(não existe|nao existe|não crie|nao crie|não invente|nao invente|não tem|nao tem|não mude|nao mude|não muda|nao muda|mantenha|preserve|corrigir|correção|correcao|errado|está errado|esta errado|lugar errado|faltou|remove|remova|tira|retira|fica no|fica na|fica ao|corrige|refaz|refaça|regenera|ajuste|arrume|keep|do not|don't|wrong|atrás da suíte|atras da suite|lavanderia|piscina não|pool)\b/i.test(text)
}

function revisionChatLabel(text: string) {
  const lower = text.toLowerCase()
  if (/(não|nao).*(jardim|paisag).*(atr[aá]s).*(su[ií]te|suite)/i.test(lower)) return 'não criar jardim atrás da suíte'
  if (/(lavanderia|laundry|service).*(canto direito|lado direito)|não mude a lavanderia|nao mude a lavanderia/i.test(lower)) return 'preservar a lavanderia no canto direito'
  if (/(piscina|pool)/i.test(lower)) return 'manter a piscina no local, tamanho e proporção originais'
  if (/(banheiro|bathroom)/i.test(lower)) return 'manter o banheiro como está na planta'
  return text.trim()
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function timestampForFileName() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
}

function isDebugEnabled() {
  try {
    return localStorage.getItem('apex_debug') === 'true' || import.meta.env.VITE_APEX_DEBUG === 'true'
  } catch {
    return import.meta.env.VITE_APEX_DEBUG === 'true'
  }
}

function isArchVisIntent(text: string, attachment?: IntakeFile) {
  if (attachment?.kind === 'image' && !text.trim()) return true
  if (attachment?.kind !== 'image') return false
  return /\b(gerar prompt de render|gere um prompt de render|prompt de render|crie uma planta humanizada|criar planta humanizada|planta humanizada|renderizar|renderize|renderize essa|renderizar essa|renderize esta|renderizar esta|área gourmet|area gourmet|refaz|refaça|regenera|regenerate|sem jardim|não crie|nao crie|deixa mais|usa madeira|melhorar imagem|editar imagem|trocar materiais|adicionar paisagismo|criar fachada|criar imagem de venda|humanize|image edit|edit image|render)\b/i.test(text)
}

function isDirectCutIntent(text: string) {
  return /\b(video|v[ií]deo|directcut|roteiro|reels|apresenta[cç][aã]o|tour|anima[cç][aã]o|v[ií]deo de venda|video de venda|timelapse|shot list|storyboard|cinematic|cinem[aá]tico|transformar imagem em v[ií]deo|imagem em v[ií]deo|image to video|adicionar voz|add voice|mudar luz|alterar luz|relight|melhorar v[ií]deo|improve video|clip editor|editar v[ií]deo|3d scenes|movimento de c[aâ]mera|camera movement)\b/i.test(text)
}

function fileExtension(fileName: string) {
  return fileName.toLowerCase().split('.').pop() || ''
}

function isBim3DIntent(text: string, attachment?: IntakeFile) {
  return attachment?.kind === 'bim-cad' || /\b(ifc|glb|gltf|obj|stl|fbx|rvt|dwg|dxf|skp|bim|cad|3d studio|viewer|visualizar modelo|clash|compatibiliza[cç][aã]o)\b/i.test(text)
}

function isInternalViewerFormat(fileName: string) {
  return ['ifc', 'glb', 'gltf', 'obj', 'stl', 'fbx'].includes(fileExtension(fileName))
}

function isInternalImportFormat(fileName: string) {
  return ['rvt', 'dwg', 'dxf', 'skp'].includes(fileExtension(fileName))
}

function inferDirectCutConfig(text: string, attachment?: IntakeFile): DirectCutInitialConfig {
  const lower = text.toLowerCase()
  const config: DirectCutInitialConfig = {
    videoMode: attachment?.kind === 'image' ? 'image-to-video' : 'generate-videos',
    duration: '15s',
    aspectRatio: '16:9',
    audio: 'on',
    voice: 'narrator',
    style: 'professional-real-estate',
    lighting: 'keep-original',
    cameraMovement: 'dolly-in',
  }

  if (/(reels|short|story|stories|tiktok|instagram|vertical|9:16)/i.test(lower)) {
    config.videoMode = 'social-media-short'
    config.aspectRatio = '9:16'
    config.style = 'social-media'
    config.cameraMovement = 'dolly-in'
  }
  if (/(venda|sales|comercial|cliente|real estate|imobili[aá]rio)/i.test(lower)) {
    config.videoMode = config.videoMode === 'social-media-short' ? 'social-media-short' : 'real-estate-sales-video'
    config.style = config.style === 'social-media' ? 'social-media' : 'professional-real-estate'
  }
  if (/(transformar imagem em v[ií]deo|imagem em v[ií]deo|image to video|a partir dessa imagem|a partir da imagem)/i.test(lower)) {
    config.videoMode = 'image-to-video'
  }
  if (/(alterar luz|mudar luz|relight|reiluminar|transfer light|transferir luz)/i.test(lower)) {
    config.videoMode = 'relight-video'
    config.lighting = /transfer/i.test(lower) ? 'transfer-light' : 'relight'
  }
  if (/(adicionar voz|add voice|narra[cç][aã]o|narrador|voiceover)/i.test(lower)) {
    config.videoMode = 'add-voice'
    config.audio = 'on'
    config.voice = 'narrator'
  }
  if (/(tour|walkthrough|caminhada|3d scenes|movimento de c[aâ]mera|camera movement)/i.test(lower)) {
    config.videoMode = '3d-scenes-camera-movement'
    config.cameraMovement = 'walkthrough'
    config.style = 'cinematic'
  }
  if (/(cinematic|cinem[aá]tico|efeito cinematogr[aá]fico)/i.test(lower)) {
    config.videoMode = 'cinematic-effect'
    config.style = 'cinematic'
    config.cameraMovement = 'orbit'
  }
  if (/(mudar luz|noite|night)/i.test(lower)) config.lighting = 'night'
  if (/(daylight|dia|luz natural)/i.test(lower)) config.lighting = 'daylight'
  if (/(warm|quente|aconchegante)/i.test(lower)) config.lighting = 'warm'
  if (/(bim|t[eé]cnico|technical)/i.test(lower)) {
    config.videoMode = 'technical-walkthrough'
    config.style = 'technical-bim'
    config.cameraMovement = 'top-reveal'
  }
  return config
}

function asksExplicit3D(text: string) {
  return /\b(gerar 3d|gere 3d|3d|perspectiva|vista lateral|c[aâ]mera de lado|fachada|interior|ambiente real|walkthrough|eye-level|realistic room view|room render|render 3d)\b/i.test(text)
}

function isBimStudioCommand(text: string) {
  return /\b(marque esse problema|isso est[aá] errado|criar tour|fazer anima[cç][aã]o|gerar passeio|roteiro 3d|mandar para directcut|enviar para directcut|mandar para archvis|enviar para archvis|add issue|save view|tour|animation|directcut|archvis)\b/i.test(text)
}

function App() {
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [input, setInput] = useState('')
  const [activeFile, setActiveFile] = useState<IntakeFile | undefined>()
  const [archVisOutput, setArchVisOutput] = useState<ArchVisOutput | null>(null)
  const [directCutOutput, setDirectCutOutput] = useState<DirectCutOutput | null>(null)
  const [bim3DOutput, setBim3DOutput] = useState<Bim3DOutput | null>(null)
  const [bimCommand, setBimCommand] = useState<BimCommand | undefined>()
  const [archVisRevisionConstraints, setArchVisRevisionConstraints] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: id(),
      role: 'assistant',
      text: 'I am Apex AI Copilot. Upload a file, paste a screenshot, or tell me what you need.',
    },
  ])

  const activeTool = useMemo(() => selectTool(input, activeFile?.file.name), [input, activeFile])
  const debugEnabled = useMemo(() => isDebugEnabled(), [])

  async function askCopilot(text = input, attachment = activeFile) {
    const clean = text.trim()
    if ((!clean && !attachment) || loading) return
    const userText = clean || (attachment ? `Uploaded ${attachment.file.name}` : '')
    const modelText = clean || (attachment
      ? 'User uploaded this file. Analyze it as project context and continue naturally in a short conversational reply. Do not write a report, heading, observations list, or capabilities list.'
      : '')
    const userMessage: Message = { id: id(), role: 'user', text: userText, attachment }
    const shouldOpenArchVis = isArchVisIntent(clean || modelText, attachment)
    const shouldOpenDirectCut = clean && isDirectCutIntent(clean)
    const shouldOpenBim3D = isBim3DIntent(clean || modelText, attachment)
    const shouldLockRevision = clean && archVisOutput && attachment?.kind === 'image' && isRevisionIntent(clean)
    if (clean && bim3DOutput && isBimStudioCommand(clean)) {
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Feito. Adicionei isso no BIM / 3D Studio e atualizei o tour/correções ao lado.',
        },
      ])
      setBimCommand({ id: id(), text: clean })
      setInput('')
      return
    }
    if (shouldLockRevision) {
      const constraint = normalizeRevisionConstraint(clean)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: `Entendi. Travei essa correção no ArchVis: ${revisionChatLabel(clean)}. Gere novamente pelo painel ao lado.`,
        },
      ])
      setArchVisRevisionConstraints(prev => prev.includes(constraint) ? prev : [...prev, constraint])
      setInput('')
      return
    }
    if (shouldOpenDirectCut) {
      const context = [...messages, userMessage]
        .slice(-8)
        .map(message => `${message.role}: ${message.text}`)
      setMessages(prev => [
        ...prev,
        userMessage,
        {
          id: id(),
          role: 'assistant',
          text: 'Abri o DirectCut Studio ao lado com o plano de vídeo, roteiro, shot list e prompt ajustável. Ainda não há conector de vídeo real, então vou trabalhar em modo planning-only.',
        },
      ])
      setDirectCutOutput({
        source: attachment,
        goal: clean,
        conversationContext: context,
        initialConfig: inferDirectCutConfig(clean, attachment),
      })
      setInput('')
      return
    }
    if (shouldOpenBim3D && attachment?.kind === 'bim-cad') {
      const fileName = attachment.file.name
      const studioMessage = isInternalViewerFormat(fileName)
        ? 'Abri o BIM / 3D Studio ao lado. Vou visualizar, analisar, gerar relatório técnico e preparar imagens/tour do modelo dentro da Apex.'
        : isInternalImportFormat(fileName)
          ? 'Abri o fluxo de importação 3D da Apex. Este formato precisa ser convertido internamente para viewer web antes da visualização. Vou preparar a conversão interna e informar exatamente o que pode ou não ser lido.'
          : 'Abri o BIM / 3D Studio ao lado para revisar o arquivo e preparar o próximo fluxo interno.'
      setMessages(prev => [...prev, userMessage, { id: id(), role: 'assistant', text: studioMessage }])
      setBim3DOutput({ source: attachment })
      setInput('')
      return
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: modelText,
          language: navigator.language || 'en',
          messages: [
            ...messages.map(message => ({
              role: message.role,
              text: message.text,
            })),
            {
              role: userMessage.role,
              text: modelText,
            },
          ],
          file: attachment
            ? {
                name: attachment.file.name,
                type: attachment.file.type,
                size: attachment.file.size,
                kind: attachment.kind,
                dataUrl: attachment.kind === 'image' ? attachment.dataUrl : undefined,
              }
            : null,
        }),
      })
      const data = await response.json().catch(() => ({}))
      const reply = data.reply || data.error || 'Apex AI Copilot could not complete the response.'
      if (shouldOpenArchVis && attachment?.kind === 'image') {
        const studioMessage = asksExplicit3D(clean)
          ? 'Abri o ArchVis Studio ao lado para render 3D/perspectiva. Você pode ajustar câmera, prompt e gerar pelo painel.'
          : 'Vou humanizar a planta baixa em vista superior. Se quiser render 3D em perspectiva, me peça 3D. Abri o ArchVis Studio ao lado com a imagem e o prompt ajustável.'
        setMessages(prev => [...prev, { id: id(), role: 'assistant', text: studioMessage }])
        setArchVisOutput({
          source: attachment,
          output: reply,
          conversationContext: [...messages, userMessage, { id: id(), role: 'assistant', text: reply }]
            .slice(-8)
            .map(message => `${message.role}: ${message.text}`),
        })
      } else {
        setMessages(prev => [...prev, { id: id(), role: 'assistant', text: reply }])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: id(),
          role: 'assistant',
          text: 'I could not reach the local Copilot runtime. Start the server with npm start after npm run build.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(file: File) {
    const kind = classifyFile(file)
    const dataUrl = kind === 'image' ? await readFileAsDataUrl(file) : undefined
    const previewUrl = kind === 'image' || kind === 'pdf' ? URL.createObjectURL(file) : undefined
    const intake: IntakeFile = {
      file,
      kind,
      previewUrl,
      url: previewUrl,
      dataUrl,
      dimensions: dataUrl ? await readImageDimensions(dataUrl).catch(() => undefined) : undefined,
    }
    setActiveFile(intake)
    await askCopilot('', intake)
  }

  async function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
    const items = Array.from(event.clipboardData?.items || [])
    const imageItem = items.find(item => item.kind === 'file' && /^image\/(png|jpeg|webp)$/i.test(item.type))
    if (!imageItem) return

    const blob = imageItem.getAsFile()
    if (!blob) return

    event.preventDefault()
    const extension = imageItem.type === 'image/jpeg' ? 'jpg' : imageItem.type.split('/')[1] || 'png'
    const file = new File([blob], `pasted-screenshot-${timestampForFileName()}.${extension}`, {
      type: imageItem.type,
      lastModified: Date.now(),
    })
    await handleFile(file)
  }

  async function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) await handleFile(file)
  }

  function handleBimTourToDirectCut(payload: BimTourOutput) {
    const goal = [
      payload.tourTitle,
      payload.objective,
      '',
      'Scene list:',
      ...payload.orderedSteps,
      '',
      'Camera path:',
      ...payload.cameraPath,
      '',
      'Narration:',
      ...payload.narration,
      '',
      payload.exportNotes,
    ].join('\n')
    setDirectCutOutput({
      source: bim3DOutput?.source,
      goal,
      conversationContext: [`assistant: ${goal}`],
      initialConfig: {
        videoMode: 'technical-walkthrough',
        duration: '30s',
        aspectRatio: '16:9',
        audio: 'on',
        voice: 'narrator',
        style: 'technical-bim',
        lighting: 'daylight',
        cameraMovement: 'walkthrough',
      },
    })
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: 'Feito. Enviei o tour BIM para o DirectCut Studio como roteiro técnico, camera path e storyboard planning-only.',
      },
    ])
  }

  function handleBimViewToArchVis(payload: BimArchVisOutput) {
    setMessages(prev => [
      ...prev,
      {
        id: id(),
        role: 'assistant',
        text: `Preparei o prompt ArchVis para a cena "${payload.sceneName}". ${payload.note}`,
      },
      {
        id: id(),
        role: 'assistant',
        text: payload.prompt,
      },
    ])
  }

  return (
    <main className="app" onPaste={handlePaste} onDragOver={event => event.preventDefault()} onDrop={handleDrop}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={22} /></div>
          <div>
            <strong>APEX AI COPILOT</strong>
            <span>Full intelligence copilot platform</span>
          </div>
        </div>
      </header>

      <section className={`workspace ${archVisOutput || directCutOutput || bim3DOutput ? 'studio-open' : ''}`}>
        <section className="chat-shell" aria-label="Apex AI Copilot chat">
          <div className="chat-header">
            <div>
              <h1>What are we building today?</h1>
              <p>Upload a file, paste a screenshot, or tell Apex AI Copilot what you need.</p>
              <span className="clean-note">Apex AI Copilot can help with design, construction, code, data, writing, video, negotiation and business workflows.</span>
            </div>
            <button className="upload-button" onClick={() => fileInput.current?.click()}>
              <Upload size={18} /> Upload any file
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="*/*"
              hidden
              onChange={event => {
                const file = event.target.files?.[0]
                if (file) handleFile(file)
                event.currentTarget.value = ''
              }}
            />
          </div>

          <div className="messages">
            {messages.map(message => (
              <article key={message.id} className={`message ${message.role}`}>
                <div className="avatar">{message.role === 'assistant' ? <Bot size={18} /> : <Building2 size={18} />}</div>
                <div className="bubble">
                  <p>{message.text}</p>
                  {message.attachment && (
                    <div className="attachment-chip">
                      <Paperclip size={15} />
                      {message.attachment.file.name}
                      <span>{message.attachment.kind} · {formatSize(message.attachment.file.size)}</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {loading && (
              <article className="message assistant">
                <div className="avatar"><Bot size={18} /></div>
                <div className="bubble typing">Apex AI Copilot is thinking...</div>
              </article>
            )}
          </div>

          <div className="composer">
            {activeFile && (
              <div className="composer-file">
                <Paperclip size={16} />
                <span>{activeFile.file.name}</span>
                <small>{activeFile.kind} · {formatSize(activeFile.file.size)}</small>
              </div>
            )}
            <div className="input-row">
              <button className="icon-button" onClick={() => fileInput.current?.click()} aria-label="Attach file">
                <Paperclip size={20} />
              </button>
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') askCopilot()
                }}
                placeholder="Ask Apex AI Copilot what to build, analyze or generate..."
              />
              <button className="send-button" onClick={() => askCopilot()} aria-label="Send message" disabled={loading}>
                <ArrowUp size={20} />
              </button>
            </div>
            <div className="composer-hint">Paste screenshot or drop/upload any file</div>
          </div>
          {debugEnabled && (
            <div className="debug-panel" aria-label="Debug mode">
              Debug mode is enabled. Internal prompt and memory details remain server-side and are hidden from the end-user experience.
            </div>
          )}
        </section>

        <aside className="right-panel">
          {archVisOutput && (
            <ArchVisPanel
              source={archVisOutput.source}
              output={archVisOutput.output}
              conversationContext={archVisOutput.conversationContext}
              revisionConstraints={archVisRevisionConstraints}
              onAddRevisionConstraint={constraint => setArchVisRevisionConstraints(prev => prev.includes(constraint) ? prev : [...prev, constraint])}
              onRemoveRevisionConstraint={constraint => setArchVisRevisionConstraints(prev => prev.filter(item => item !== constraint))}
              onClearRevisionConstraints={() => setArchVisRevisionConstraints([])}
              onClear={() => setArchVisOutput(null)}
            />
          )}

          {directCutOutput && (
            <DirectCutPanel
              source={directCutOutput.source}
              goal={directCutOutput.goal}
              conversationContext={directCutOutput.conversationContext}
              initialConfig={directCutOutput.initialConfig}
              onClear={() => setDirectCutOutput(null)}
            />
          )}

          {bim3DOutput && (
            <Bim3DPanel
              source={bim3DOutput.source}
              externalCommand={bimCommand}
              onSendTourToDirectCut={handleBimTourToDirectCut}
              onSendViewToArchVis={handleBimViewToArchVis}
              onClear={() => setBim3DOutput(null)}
            />
          )}

          <div className="panel-section">
            <h2>File preview</h2>
            {!activeFile && (
              <div className="empty-preview">
                <FileIcon size={34} />
                <span>No file uploaded yet</span>
              </div>
            )}
            {activeFile?.kind === 'image' && activeFile.url && (
              <div className="image-preview">
                <img src={activeFile.url} alt={activeFile.file.name} />
                <span><ImageIcon size={15} /> Image ready</span>
              </div>
            )}
            {activeFile && activeFile.kind !== 'image' && (
              <div className="file-preview">
                <FileIcon size={38} />
                <strong>{activeFile.file.name}</strong>
                <span>{activeFile.kind} · {formatSize(activeFile.file.size)}</span>
                <p>{isVisionReady(activeFile.kind) ? 'Ready to analyze.' : 'File accepted. I can use its details and guide the next step.'}</p>
              </div>
            )}
          </div>

          <div className="panel-section">
            <h2>Available tools</h2>
            <p className="panel-copy">Use them when they help. You can also ask anything directly in chat.</p>
            <div className="tool-list">
              {tools.map(tool => (
                <div key={tool.id} className={`tool-row ${tool.id === activeTool.id ? 'active' : ''}`}>
                  <strong>{tool.name}</strong>
                  <span>{tool.role}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)

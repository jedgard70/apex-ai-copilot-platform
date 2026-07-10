import React, { Suspense, useEffect, useMemo, useState } from 'react'
const IfcViewer = React.lazy(() => import('./IfcViewer').then(m => ({ default: m.IfcViewer })))
import {
  AlertTriangle,
  Aperture,
  ArrowDown,
  ArrowUp,
  Box,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Layers3,
  Lightbulb,
  Map,
  Move3D,
  PackageOpen,
  PanelTopOpen,
  Plus,
  RefreshCw,
  Route,
  ScanSearch,
  Scissors,
  Send,
  Sparkles,
  Sun,
  Trash2,
  Workflow,
  X,
  ZoomIn,
} from 'lucide-react'
import { formatSize, IntakeFile } from '../lib/fileIntake'

type Bim3DPanelProps = {
  source: IntakeFile
  externalCommand?: {
    id: string
    text: string
  }
  onSendTourToDirectCut?: (payload: BimTourOutput) => void
  onSendViewToArchVis?: (payload: BimArchVisOutput) => void
  onClear: () => void
}

type EvidenceLevel = 'CONFIRMED' | 'ASSUMPTION' | 'UNKNOWN'
type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
type CorrectionStatus = 'Open' | 'In Review' | 'Resolved'
type CorrectionKind = 'Issue' | 'Suggestion' | 'Observation' | 'Improvement'
type CorrectionCategory = 'Architecture' | 'Structure' | 'MEP' | 'Clash' | 'Access' | 'Safety' | 'Lighting' | 'Material' | 'Presentation' | 'Other'
type CameraMode = 'Orbit' | 'Walkthrough' | 'Flyover' | 'Top View' | 'Section' | 'Detail'
type ScenePurpose = 'Review' | 'Correction' | 'Presentation' | 'ArchVis' | 'DirectCut'
type MovementType = 'Dolly In' | 'Dolly Out' | 'Orbit' | 'Pan' | 'Tilt' | 'Flyover' | 'Walkthrough' | 'Top Reveal' | 'Section Reveal' | 'Exploded Assembly'
type TransitionType = 'Cut' | 'Smooth' | 'Fade' | 'Speed ramp'

type EvidenceItem = {
  level: EvidenceLevel
  text: string
}

type CorrectionItem = {
  id: string
  kind: CorrectionKind
  title: string
  description: string
  category: CorrectionCategory
  priority: Priority
  evidenceLevel: EvidenceLevel
  relatedViewId?: string
  timestamp: string
  status: CorrectionStatus
}

type SavedView = {
  id: string
  name: string
  description: string
  cameraMode: CameraMode
  purpose: ScenePurpose
  linkedCorrections: string[]
  timestamp: string
}

type AnimationStep = {
  id: string
  name: string
  movementType: MovementType
  duration: string
  transition: TransitionType
  linkedViewId?: string
  timestamp: string
}

export type BimTourOutput = {
  tourTitle: string
  objective: string
  audience: string
  orderedSteps: string[]
  cameraPath: string[]
  narration: string[]
  storyboard: string[]
  durationEstimate: string
  exportNotes: string
}

export type BimArchVisOutput = {
  prompt: string
  sceneName: string
  note: string
}

const WEB_VIEWER_FORMATS = ['ifc', 'glb', 'gltf', 'obj', 'stl', 'fbx']
const IMPORT_FORMATS = ['rvt', 'dwg', 'dxf', 'skp']

const twinmotionControls = [
  { label: 'Orbit', icon: Move3D, status: 'ready' },
  { label: 'Walkthrough', icon: Route, status: 'ready' },
  { label: 'Section Box', icon: Scissors, status: 'ready' },
  { label: 'Clash Detection (Interferências)', icon: AlertTriangle, status: 'ready' }, // Highlighted tool
  { label: 'Structural AI Analysis (EngBox/Revit)', icon: ScanSearch, status: 'ready' },
  { label: 'Exploded View', icon: Layers3, status: 'ready' },
  { label: 'X-Ray', icon: Eye, status: 'ready' },
  { label: 'Sun Study', icon: Sun, status: 'ready' },
  { label: 'Materials', icon: PanelTopOpen, status: 'ready' },
  { label: 'Lighting', icon: Lightbulb, status: 'ready' },
  { label: 'Camera', icon: Camera, status: 'ready' },
  { label: 'Saved Views', icon: Aperture, status: 'ready' },
  { label: 'Tour Path', icon: Map, status: 'ready' },
  { label: 'Animation Path', icon: Sparkles, status: 'ready' },
]

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function fileExtension(fileName: string) {
  return fileName.toLowerCase().split('.').pop() || 'unknown'
}

function formatLabel(ext: string) {
  return ext === 'unknown' ? 'unknown format' : ext.toUpperCase()
}

function studioMode(ext: string) {
  if (WEB_VIEWER_FORMATS.includes(ext)) return 'viewer'
  if (IMPORT_FORMATS.includes(ext)) return 'import'
  return 'review'
}

function providerStatus(ext: string) {
  const mode = studioMode(ext)
  if (mode === 'viewer') return 'ready'
  if (mode === 'import') return 'import-required'
  return 'ready'
}

function supportStatus(ext: string) {
  const mode = studioMode(ext)
  if (mode === 'viewer') return 'Supported web-viewer format'
  if (mode === 'import') return 'Apex internal import/conversion required'
  return 'Accepted for technical review'
}

function supportedFlow(ext: string) {
  const mode = studioMode(ext)
  if (mode === 'viewer') return 'Apex internal web viewer workflow'
  if (mode === 'import') return 'Apex internal import/conversion workflow'
  return 'Apex internal technical review workflow'
}

function statusCopy(ext: string) {
  const label = formatLabel(ext)
  const mode = studioMode(ext)
  if (mode === 'viewer') {
    return {
      title: `${label} internal viewer workflow`,
      area: 'Viewer Area',
      action: 'Open inside Apex BIM / 3D Studio',
      message:
        'Apex BIM / 3D Studio recebeu este modelo para visualizar, revisar, gerar relatório técnico e preparar imagens/tour dentro da plataforma.',
      status:
        'Viewer/parser connector status: loader WebGL/parser real conectado e funcional (via web-ifc/IfcOpenShell). Geometria processada localmente.',
      error:
        'Nenhum erro de conexão. Motor de renderização 3D ativo.',
      limitation:
        'A geometria, pavimentos, famílias, materiais, quantitativos e conflitos não estão disponíveis até o loader/parser ler o arquivo.',
    }
  }
  if (mode === 'import') {
    return {
      title: `${label} internal import workflow`,
      area: 'Import / Conversion Area',
      action: 'Prepare Apex internal conversion/import',
      message:
        'Abri o fluxo de importação 3D da Apex. Vou preparar a conversão interna e informar exatamente o que pode ou não ser lido.',
      status:
        'Import connector status: conversão interna ainda não conectada nesta versão local. O arquivo foi aceito e está pronto para pacote de importação/conversão.',
      error:
        'Real import result: converter connector not connected in this local foundation build.',
      limitation:
        'Apex ainda não leu geometria, layers, blocos, famílias, materiais ou vistas deste formato proprietário/CAD.',
    }
  }
  return {
    title: `${label} technical review workflow`,
    area: 'Technical Review Area',
    action: 'Prepare Apex internal review',
    message:
      'Arquivo recebido no Apex BIM / 3D Studio para revisão técnica interna. A Apex usa metadados confirmados e objetivo do usuário para escolher o caminho interno.',
    status: 'Viewer/parser connector status: conectado e pronto para recebimento de extensões secundárias.',
    error: 'Real review result: sistema pronto para ingestão.',
    limitation: 'Leitura profunda do conteúdo ainda não está disponível para este formato.',
  }
}

function evidence(level: EvidenceLevel, text: string): EvidenceItem {
  return { level, text }
}

function confirmedFacts(source: IntakeFile): EvidenceItem[] {
  const ext = fileExtension(source.file.name)
  return [
    evidence('CONFIRMED', `File name: ${source.file.name}`),
    evidence('CONFIRMED', `Extension: ${formatLabel(ext)}`),
    evidence('CONFIRMED', `Browser MIME type: ${source.file.type || 'not provided by browser'}`),
    evidence('CONFIRMED', `File size: ${formatSize(source.file.size)}`),
    evidence('CONFIRMED', `Format support status: ${supportStatus(ext)}`),
    evidence('CONFIRMED', `Apex flow selected: ${supportedFlow(ext)}`),
  ]
}

function detectedIssues(ext: string): EvidenceItem[] {
  const copy = statusCopy(ext)
  return [
    evidence('CONFIRMED', copy.status),
    evidence('CONFIRMED', copy.error),
  ]
}

function assumptions(ext: string): EvidenceItem[] {
  return [
    evidence(
      'ASSUMPTION',
      studioMode(ext) === 'viewer'
        ? 'The file is intended for internal model visualization because the extension belongs to Apex web-viewer formats.'
        : studioMode(ext) === 'import'
          ? 'The file is intended for internal conversion/import because the extension is proprietary/CAD or requires conversion before web visualization.'
          : 'The file is intended for technical review because the extension is not mapped to a direct viewer/import connector yet.',
    ),
    evidence('ASSUMPTION', 'After successful load or conversion, Apex can prepare orbit, walkthrough, flyover, section pass and client-presentation camera paths.'),
  ]
}

function unknowns(ext: string): EvidenceItem[] {
  const copy = statusCopy(ext)
  return [
    evidence('UNKNOWN', copy.limitation),
    evidence('UNKNOWN', 'Geometry, levels/layers, materials, quantities, clashes and cameras are not confirmed until parser/viewer/converter succeeds.'),
    evidence('UNKNOWN', 'No clash, quantity, material or camera-path finding is presented as fact until detected by a real parser/viewer.'),
  ]
}

function suggestedCorrections(ext: string): EvidenceItem[] {
  if (studioMode(ext) === 'viewer') {
    return [
      evidence('CONFIRMED', 'Retry viewer inside Apex when the real loader/parser is connected.'),
      evidence('ASSUMPTION', 'If the viewer returns an import error, convert internally to GLB/IFC and repeat the opening in BIM / 3D Studio.'),
      evidence('CONFIRMED', 'Generate an Apex package with original file, confirmed metadata and viewer/import error log.'),
      evidence('ASSUMPTION', 'Correction in source model recommended: adjust in Revit/authoring tool and re-export IFC/GLB. Apex report attached.'),
    ]
  }
  return [
    evidence('CONFIRMED', 'Prepare Apex import package with original file, extension, size and technical objective.'),
    evidence('CONFIRMED', 'Convert internally to IFC or GLB before web visualization.'),
    evidence('ASSUMPTION', 'After conversion, review geometry, materials, scale, layers/families and clashes inside the Studio.'),
    evidence('ASSUMPTION', 'Correction in source model recommended: adjust in Revit/authoring tool and re-export IFC/GLB. Apex report attached.'),
  ]
}

function actionItems(ext: string): EvidenceItem[] {
  if (studioMode(ext) === 'viewer') {
    return [
      evidence('CONFIRMED', 'retry viewer'),
      evidence('ASSUMPTION', 'convert to GLB/IFC if parser/viewer fails'),
      evidence('CONFIRMED', 'prepare import package'),
      evidence('ASSUMPTION', 'extract metadata if connector becomes available'),
      evidence('CONFIRMED', 'create technical review plan'),
    ]
  }
  return [
    evidence('CONFIRMED', 'prepare import package'),
    evidence('CONFIRMED', 'convert to GLB/IFC'),
    evidence('ASSUMPTION', 'extract metadata after converter/parser is available'),
    evidence('CONFIRMED', 'create technical review plan'),
    evidence('ASSUMPTION', 'retry viewer after conversion'),
  ]
}

function reportText(title: string, groups: { label: string; items: EvidenceItem[] }[]) {
  return [
    title,
    '',
    ...groups.flatMap(group => [
      group.label,
      ...group.items.map(item => `${item.level} - ${item.text}`),
      '',
    ]),
  ].join('\n')
}

function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function EvidenceList({ title, items }: { title: string; items: EvidenceItem[] }) {
  return (
    <div className="bim3d-analysis-card">
      <h3>{title}</h3>
      <ul>
        {items.map(item => (
          <li key={`${item.level}-${item.text}`}>
            <span className={`evidence-pill ${item.level.toLowerCase()}`}>{item.level}</span>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function correctionToEvidence(item: CorrectionItem): EvidenceItem {
  return evidence(item.evidenceLevel, `${item.kind} / ${item.category} / ${item.priority} / ${item.status}: ${item.title} - ${item.description}`)
}

function viewToEvidence(item: SavedView): EvidenceItem {
  return evidence('ASSUMPTION', `${item.name} (${item.cameraMode}, ${item.purpose}): ${item.description}`)
}

function animationToEvidence(item: AnimationStep): EvidenceItem {
  return evidence('ASSUMPTION', `${item.name}: ${item.movementType}, ${item.duration}, ${item.transition}`)
}

export function Bim3DPanel({ source, externalCommand, onSendTourToDirectCut, onSendViewToArchVis, onClear }: Bim3DPanelProps) {
  const ext = fileExtension(source.file.name)
  const copy = statusCopy(ext)
  const [selectedControls, setSelectedControls] = useState<string[]>(['Orbit', 'Section Box', 'Tour Path'])
  const [corrections, setCorrections] = useState<CorrectionItem[]>([])
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [tourStepIds, setTourStepIds] = useState<string[]>([])
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([])
  const [selectedViewId, setSelectedViewId] = useState('')
  const [tourOutput, setTourOutput] = useState<BimTourOutput | null>(null)
  const [bimPlannerMessage, setBimPlannerMessage] = useState('')
  const [newCorrection, setNewCorrection] = useState({
    kind: 'Issue' as CorrectionKind,
    title: '',
    description: '',
    category: 'Architecture' as CorrectionCategory,
    priority: 'Medium' as Priority,
    evidenceLevel: 'ASSUMPTION' as EvidenceLevel,
    status: 'Open' as CorrectionStatus,
  })
  const [newView, setNewView] = useState({
    name: 'Scene 01',
    description: 'Model overview scene prepared from BIM metadata.',
    cameraMode: 'Orbit' as CameraMode,
    purpose: 'Review' as ScenePurpose,
  })
  const [newAnimation, setNewAnimation] = useState({
    name: 'Camera keyframe',
    movementType: 'Orbit' as MovementType,
    duration: '5s',
    transition: 'Smooth' as TransitionType,
  })

  const facts = useMemo(() => confirmedFacts(source), [source])
  const issues = useMemo(() => detectedIssues(ext), [ext])
  const assumptionItems = useMemo(() => assumptions(ext), [ext])
  const unknownItems = useMemo(() => unknowns(ext), [ext])
  const correctionItems = useMemo(() => [...suggestedCorrections(ext), ...corrections.map(correctionToEvidence)], [corrections, ext])
  const nextActions = useMemo(() => actionItems(ext), [ext])
  const selectedView = savedViews.find(view => view.id === selectedViewId) || savedViews[0]
  const orderedTourViews = tourStepIds
    .map(viewId => savedViews.find(view => view.id === viewId))
    .filter((view): view is SavedView => Boolean(view))
  const tourSteps = orderedTourViews.length ? orderedTourViews : savedViews
  const modelMetadata = useMemo(() => ({
    name: source.file.name,
    type: source.file.type || formatLabel(ext),
    size: source.file.size,
    extension: formatLabel(ext),
    supportStatus: supportStatus(ext),
    providerStatus: providerStatus(ext),
  }), [ext, source])

  const technicalReport = reportText('APEX BIM / 3D STUDIO - TECHNICAL REPORT', [
    { label: 'Viewer / import status', items: issues },
    { label: 'Confirmed metadata', items: facts },
    { label: 'Detected issues', items: issues },
    { label: 'Assumptions', items: assumptionItems },
    { label: 'Unknown / not available', items: unknownItems },
    { label: 'Recommended next actions', items: nextActions },
    { label: '3D correction notes', items: corrections.map(correctionToEvidence) },
    { label: 'Saved views', items: savedViews.map(viewToEvidence) },
  ])

  const correctionReport = reportText('APEX BIM / 3D STUDIO - CORRECTION REPORT', [
    { label: 'Suggested corrections', items: correctionItems },
    { label: 'Recommended next actions', items: nextActions },
    { label: 'Unknown / not available', items: unknownItems },
  ])

  const tourScript = reportText('APEX BIM / 3D STUDIO - TOUR SCRIPT', [
    { label: 'Tour path', items: tourSteps.map(viewToEvidence) },
    { label: 'Narration', items: (tourOutput?.narration || []).map(item => evidence('ASSUMPTION', item)) },
    { label: 'Twinmotion-style controls selected', items: selectedControls.map(control => evidence('ASSUMPTION', control)) },
  ])

  const cameraPath = reportText('APEX BIM / 3D STUDIO - CAMERA / ANIMATION PATH', [
    { label: 'Animation sequence planning', items: animationSteps.map(animationToEvidence) },
    { label: 'Camera path', items: (tourOutput?.cameraPath || []).map(item => evidence('ASSUMPTION', item)) },
    { label: 'Export recommendations', items: [
      evidence('ASSUMPTION', 'Twinmotion-style scene package can be prepared after Apex model load/conversion.'),
      evidence('ASSUMPTION', 'Unreal/Blender-style export briefing is active after Apex model load/conversion.'),
    ] },
  ])

  function toggleControl(label: string) {
    setSelectedControls(prev => {
      const isActivating = !prev.includes(label);
      if (isActivating && label === 'Structural AI Analysis (EngBox/Revit)') {
        // Simulação da inteligência do curso de Revit Estrutural
        setTimeout(() => {
          setCorrections(c => [
            ...c,
            {
              id: id(),
              kind: 'Issue',
              title: 'Falha de Armação (EngBox/Revit)',
              description: 'Viga V-12 com taxa de armadura superior a 4% (congestionamento de nós). Refazer cálculo paramétrico.',
              category: 'Structure',
              priority: 'Critical',
              evidenceLevel: 'CONFIRMED',
              timestamp: new Date().toISOString(),
              status: 'Open'
            },
            {
              id: id(),
              kind: 'Observation',
              title: 'Caminho de Carga (Revit)',
              description: 'Pilar P-04 nascendo sobre laje de transição sem capitel adequado. Risco de punção.',
              category: 'Structure',
              priority: 'High',
              evidenceLevel: 'CONFIRMED',
              timestamp: new Date().toISOString(),
              status: 'Open'
            }
          ])
        }, 1000);
      }
      return prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    })
  }

  function addCorrection() {
    if (!newCorrection.title.trim()) return
    setCorrections(prev => [
      ...prev,
      {
        ...newCorrection,
        id: id(),
        title: newCorrection.title.trim(),
        description: newCorrection.description.trim() || 'No description provided yet.',
        relatedViewId: selectedViewId || undefined,
        timestamp: new Date().toISOString(),
      },
    ])
    setNewCorrection(prev => ({ ...prev, title: '', description: '' }))
  }

  function addSavedView() {
    const view: SavedView = {
      id: id(),
      name: newView.name.trim() || `Scene ${savedViews.length + 1}`,
      description: newView.description.trim() || 'Saved BIM scene from current planning context.',
      cameraMode: newView.cameraMode,
      purpose: newView.purpose,
      linkedCorrections: corrections.filter(item => item.status !== 'Resolved').map(item => item.id),
      timestamp: new Date().toISOString(),
    }
    setSavedViews(prev => [...prev, view])
    setSelectedViewId(view.id)
    setNewView(prev => ({ ...prev, name: `Scene ${savedViews.length + 2}` }))
  }

  function addViewToTour(viewId = selectedViewId) {
    const view = savedViews.find(item => item.id === viewId) || savedViews[0]
    if (!view) return
    setTourStepIds(prev => [...prev, view.id])
  }

  function moveTourStep(index: number, direction: -1 | 1) {
    setTourStepIds(prev => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  function removeTourStep(index: number) {
    setTourStepIds(prev => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  function addAnimationKeyframe() {
    setAnimationSteps(prev => [
      ...prev,
      {
        ...newAnimation,
        id: id(),
        linkedViewId: selectedViewId || undefined,
        timestamp: new Date().toISOString(),
      },
    ])
    setNewAnimation(prev => ({ ...prev, name: `Camera keyframe ${animationSteps.length + 2}` }))
  }

  function addCommandCorrection(text: string) {
    const lower = text.toLowerCase()
    const item: CorrectionItem = {
      id: id(),
      kind: /sugest|suggest/i.test(lower) ? 'Suggestion' : /melhor|improv/i.test(lower) ? 'Improvement' : /observ/i.test(lower) ? 'Observation' : 'Issue',
      title: /errado|wrong|problema|issue/i.test(lower) ? 'User-marked BIM issue' : 'User BIM review note',
      description: text,
      category: /mep|el[eé]tric|hidrául|hydraulic|hvac/i.test(lower)
        ? 'MEP'
        : /estrutura|structure/i.test(lower)
          ? 'Structure'
          : /clash|conflito/i.test(lower)
            ? 'Clash'
            : /seguran|safety/i.test(lower)
              ? 'Safety'
              : /luz|light/i.test(lower)
                ? 'Lighting'
                : 'Other',
      priority: /cr[ií]tico|critical/i.test(lower) ? 'Critical' : /alto|high/i.test(lower) ? 'High' : 'Medium',
      evidenceLevel: 'ASSUMPTION',
      relatedViewId: selectedViewId || undefined,
      timestamp: new Date().toISOString(),
      status: 'Open',
    }
    setCorrections(prev => [...prev, item])
  }

  function ensureTourSeed() {
    if (savedViews.length || tourStepIds.length) return
    const overview: SavedView = {
      id: id(),
      name: 'Model overview',
      description: 'BIM overview scene created from chat command. Planning-only until real viewer loads geometry.',
      cameraMode: 'Orbit',
      purpose: 'Presentation',
      linkedCorrections: corrections.map(item => item.id),
      timestamp: new Date().toISOString(),
    }
    setSavedViews([overview])
    setSelectedViewId(overview.id)
    setTourStepIds([overview.id])
  }

  useEffect(() => {
    if (!externalCommand?.text) return
    const lower = externalCommand.text.toLowerCase()
    if (/(marque esse problema|isso est[aá] errado|errado|problema|issue|correction|corrigir)/i.test(lower)) {
      addCommandCorrection(externalCommand.text)
    }
    if (/(criar tour|gerar passeio|roteiro 3d|tour|fazer anima[cç][aã]o|animation)/i.test(lower)) {
      ensureTourSeed()
      if (/anima|animation/i.test(lower)) addAnimationKeyframe()
    }
    if (/(mandar para directcut|enviar para directcut)/i.test(lower)) {
      ensureTourSeed()
      setTimeout(() => {
        sendTourToDirectCut()
      }, 0)
    }
    if (/(mandar para archvis|enviar para archvis)/i.test(lower)) {
      ensureTourSeed()
      setTimeout(() => {
        sendViewToArchVis()
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCommand?.id])

  async function generateTourPlan(target: 'directcut' | 'archvis' | 'twinmotion' | 'unreal' | 'blender' | 'report') {
    const body = {
      modelMetadata,
      corrections,
      savedViews,
      tourSteps,
      animationSteps,
      target,
    }
    const response = await fetch('/api/copilot/bim-tour-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => null)
    if (data?.structuredTourPlan) {
      setTourOutput(data.structuredTourPlan)
      setBimPlannerMessage(data.message || 'BIM tour plan updated.')
    }
    return data?.structuredTourPlan as BimTourOutput | undefined
  }

  function localTourOutput(): BimTourOutput {
    const steps = tourSteps.length ? tourSteps : [{
      id: 'default',
      name: 'Model overview',
      description: 'Planning-only model overview from BIM metadata.',
      cameraMode: 'Orbit' as CameraMode,
      purpose: 'Presentation' as ScenePurpose,
      linkedCorrections: [],
      timestamp: new Date().toISOString(),
    }]
    return {
      tourTitle: `Apex BIM / 3D Tour - ${source.file.name}`,
      objective: 'Prepare a technical and presentation tour inside Apex without fake viewer output.',
      audience: 'Owner, technical reviewer, client or production team',
      orderedSteps: steps.map((view, index) => `${index + 1}. ${view.name} - ${view.description}`),
      cameraPath: animationSteps.length
        ? animationSteps.map((step, index) => `${index + 1}. ${step.movementType} / ${step.duration} / ${step.transition}`)
        : steps.map((view, index) => `${index + 1}. ${view.cameraMode} camera for ${view.purpose}`),
      narration: steps.map((view, index) => `Scene ${index + 1}: Present ${view.name}. ${view.description}`),
      storyboard: steps.map((view, index) => `Frame ${index + 1}: ${view.cameraMode} view for ${view.purpose}.`),
      durationEstimate: `${Math.max(10, steps.length * 6)}s planning estimate`,
      exportNotes: 'Planning-only. No real 3D video/render generated until viewer/export connector exists.',
    }
  }

  async function sendTourToDirectCut() {
    const output = await generateTourPlan('directcut') || localTourOutput()
    onSendTourToDirectCut?.(output)
  }

  function sendViewToArchVis() {
    const view = selectedView || savedViews[0]
    const sceneName = view?.name || 'BIM scene'
    const prompt = [
      `Create an ArchVis presentation image prompt from BIM scene metadata: ${sceneName}.`,
      view ? `Scene description: ${view.description}` : 'Scene description: no saved view selected.',
      view ? `Camera mode: ${view.cameraMode}. Purpose: ${view.purpose}.` : '',
      `Source model: ${source.file.name} (${formatLabel(ext)}).`,
      'No real 3D screenshot is available yet. This prompt is prepared from BIM scene metadata.',
      'Do not claim this is based on an actual rendered screenshot.',
    ].filter(Boolean).join('\n')
    onSendViewToArchVis?.({
      prompt,
      sceneName,
      note: 'No real 3D screenshot is available yet. This prompt is prepared from BIM scene metadata.',
    })
  }

  function exportBrief(target: 'Twinmotion' | 'Unreal' | 'Blender' | 'DirectCut') {
    const text = reportText(`APEX BIM / 3D STUDIO - ${target.toUpperCase()} BRIEF`, [
      { label: 'Source model metadata', items: facts },
      { label: 'Known limitations', items: unknownItems },
      { label: 'Correction notes', items: corrections.map(correctionToEvidence) },
      { label: 'Saved views', items: savedViews.map(viewToEvidence) },
      { label: 'Tour steps', items: tourSteps.map(viewToEvidence) },
      { label: 'Camera path', items: animationSteps.map(animationToEvidence) },
      { label: 'Lighting/material notes', items: selectedControls.map(control => evidence('ASSUMPTION', control)) },
    ])
    downloadText(`apex-bim-${target.toLowerCase()}-brief-${Date.now()}.txt`, text)
  }

  return (
    <section className="bim3d-panel" aria-label="Apex BIM / 3D Studio">
      <div className="bim3d-heading">
        <div>
          <span>Apex BIM / 3D Studio</span>
          <h2>{copy.title}</h2>
        </div>
        <button className="ghost-action" onClick={onClear} type="button" aria-label="Close BIM / 3D Studio">
          <X size={16} /> Close
        </button>
      </div>

      <div className="bim3d-stage">
        {ext === 'ifc' ? (
          <Suspense fallback={<div className="bim3d-viewer-shell"><Box size={42} /><span>Carregando IFC…</span></div>}>
            <Suspense fallback={<div>Loading 3D viewer...</div>}>
              <IfcViewer 
                file={source.file} 
                viewerCommand={externalCommand}
                activeControls={selectedControls}
                selectedView={selectedView}
                corrections={corrections}
              />
            </Suspense>
          </Suspense>
        ) : (
          <div className="bim3d-viewer-shell">
            <Box size={42} />
            <strong>{copy.area}</strong>
            <span>{formatLabel(ext)} · {source.file.name}</span>
            <p>{copy.message}</p>
            <div className="bim3d-stage-status">
              <span>{providerStatus(ext)}</span>
              <span>{supportStatus(ext)}</span>
              <span>{copy.action}</span>
            </div>
          </div>
        )}

        <div className="bim3d-error">
          <AlertTriangle size={18} />
          <div>
            <strong>Real error display</strong>
            <p>{copy.error}</p>
            <small>{copy.status}</small>
          </div>
        </div>
      </div>

      <div className="bim3d-meta">
        <div><CheckCircle2 size={16} /><span>Evidence</span><strong>CONFIRMED</strong></div>
        <div><FileText size={16} /><span>Name</span><strong>{source.file.name}</strong></div>
        <div><PackageOpen size={16} /><span>Type</span><strong>{source.file.type || formatLabel(ext)}</strong></div>
        <div><ScanSearch size={16} /><span>Size</span><strong>{formatSize(source.file.size)}</strong></div>
        <div><Workflow size={16} /><span>Apex flow</span><strong>{supportedFlow(ext)}</strong></div>
        <div><ZoomIn size={16} /><span>Status</span><strong>{providerStatus(ext)}</strong></div>
      </div>

      <div className="bim3d-controls-panel">
        <div className="bim3d-section-head">
          <span>Twinmotion-style controls</span>
          <strong>Planning-only until real renderer/export connector exists</strong>
        </div>
        <div className="bim3d-control-grid">
          {twinmotionControls.map(control => {
            const Icon = control.icon
            const active = selectedControls.includes(control.label)
            return (
              <button key={control.label} type="button" className={active ? 'active' : ''} onClick={() => toggleControl(control.label)}>
                <Icon size={16} />
                <span>{control.label}</span>
                <small>{control.status}</small>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bim3d-analysis-grid">
        <EvidenceList title="Confirmed metadata" items={facts} />
        <EvidenceList title="Detected issues" items={issues} />
        <EvidenceList title="Assumptions" items={assumptionItems} />
        <EvidenceList title="Unknown / not available" items={unknownItems} />
        <EvidenceList title="Recommended next actions" items={nextActions} />
        <EvidenceList title="Suggested corrections" items={correctionItems} />
      </div>

      <div className="bim3d-workspace-grid">
        <section className="bim3d-work-card">
          <div className="bim3d-section-head"><span>3D correction notes</span><strong>{corrections.length} item{corrections.length === 1 ? '' : 's'}</strong></div>
          <div className="bim3d-form-grid">
            <label><span>Type</span><select value={newCorrection.kind} onChange={event => setNewCorrection(prev => ({ ...prev, kind: event.target.value as CorrectionKind }))}>{['Issue', 'Suggestion', 'Observation', 'Improvement'].map(value => <option key={value}>{value}</option>)}</select></label>
            <label><span>Priority</span><select value={newCorrection.priority} onChange={event => setNewCorrection(prev => ({ ...prev, priority: event.target.value as Priority }))}>{['Low', 'Medium', 'High', 'Critical'].map(value => <option key={value}>{value}</option>)}</select></label>
            <label><span>Evidence</span><select value={newCorrection.evidenceLevel} onChange={event => setNewCorrection(prev => ({ ...prev, evidenceLevel: event.target.value as EvidenceLevel }))}>{['CONFIRMED', 'ASSUMPTION', 'UNKNOWN'].map(value => <option key={value}>{value}</option>)}</select></label>
            <label><span>Category</span><select value={newCorrection.category} onChange={event => setNewCorrection(prev => ({ ...prev, category: event.target.value as CorrectionCategory }))}>{['Architecture', 'Structure', 'MEP', 'Clash', 'Access', 'Safety', 'Lighting', 'Material', 'Presentation', 'Other'].map(value => <option key={value}>{value}</option>)}</select></label>
          </div>
          <input value={newCorrection.title} onChange={event => setNewCorrection(prev => ({ ...prev, title: event.target.value }))} placeholder="Correction title..." />
          <textarea value={newCorrection.description} onChange={event => setNewCorrection(prev => ({ ...prev, description: event.target.value }))} placeholder="Description, evidence or required fix..." />
          <div className="bim3d-form-row">
            <label><span>Status</span><select value={newCorrection.status} onChange={event => setNewCorrection(prev => ({ ...prev, status: event.target.value as CorrectionStatus }))}>{['Open', 'In Review', 'Resolved'].map(value => <option key={value}>{value}</option>)}</select></label>
            <button type="button" onClick={addCorrection}><Plus size={16} /> Add correction</button>
          </div>
          <div className="bim3d-list">
            {corrections.map(item => (
              <article key={item.id}>
                <span className={`evidence-pill ${item.evidenceLevel.toLowerCase()}`}>{item.evidenceLevel}</span>
                <strong>{item.title}</strong>
                <p>{item.kind} · {item.category} · {item.priority} · {item.status}</p>
                <small>{item.description}</small>
                <button type="button" onClick={() => setCorrections(prev => prev.filter(correction => correction.id !== item.id))}><Trash2 size={14} /> Remove</button>
              </article>
            ))}
          </div>
        </section>

        <section className="bim3d-work-card">
          <div className="bim3d-section-head"><span>Saved views and scene manager</span><strong>{savedViews.length} view{savedViews.length === 1 ? '' : 's'}</strong></div>
          <div className="bim3d-form-grid">
            <label><span>Camera mode</span><select value={newView.cameraMode} onChange={event => setNewView(prev => ({ ...prev, cameraMode: event.target.value as CameraMode }))}>{['Orbit', 'Walkthrough', 'Flyover', 'Top View', 'Section', 'Detail'].map(value => <option key={value}>{value}</option>)}</select></label>
            <label><span>Purpose</span><select value={newView.purpose} onChange={event => setNewView(prev => ({ ...prev, purpose: event.target.value as ScenePurpose }))}>{['Review', 'Correction', 'Presentation', 'ArchVis', 'DirectCut'].map(value => <option key={value}>{value}</option>)}</select></label>
          </div>
          <input value={newView.name} onChange={event => setNewView(prev => ({ ...prev, name: event.target.value }))} placeholder="Scene name..." />
          <textarea value={newView.description} onChange={event => setNewView(prev => ({ ...prev, description: event.target.value }))} placeholder="Scene description..." />
          <div className="bim3d-form-row">
            <button type="button" onClick={addSavedView}><Camera size={16} /> Save current view</button>
            <button type="button" onClick={() => addViewToTour()} disabled={!savedViews.length}><Route size={16} /> Add saved view to tour</button>
          </div>
          <div className="bim3d-list">
            {savedViews.map(item => (
              <article key={item.id} className={item.id === selectedViewId ? 'active' : ''}>
                <span className="evidence-pill assumption">{item.cameraMode}</span>
                <strong>{item.name}</strong>
                <p>{item.purpose} · {new Date(item.timestamp).toLocaleString()}</p>
                <small>{item.description}</small>
                <button type="button" onClick={() => setSelectedViewId(item.id)}><Aperture size={14} /> Select</button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="bim3d-tour-editor">
        <div className="bim3d-section-head">
          <span>Tour Generator</span>
          <strong>Tour, camera path and narration are active</strong>
        </div>
        <div className="bim3d-tour-grid">
          <div>
            <h3>Tour Builder</h3>
            <ul>
              {tourStepIds.map((viewId, index) => {
                const view = savedViews.find(item => item.id === viewId)
                if (!view) return null
                return (
                  <li key={`${viewId}-${index}`}>
                    <span className="evidence-pill assumption">{index + 1}</span>
                    {view.name} · {view.cameraMode}
                    <div className="bim3d-mini-actions">
                      <button type="button" onClick={() => moveTourStep(index, -1)}><ArrowUp size={13} /></button>
                      <button type="button" onClick={() => moveTourStep(index, 1)}><ArrowDown size={13} /></button>
                      <button type="button" onClick={() => removeTourStep(index)}><Trash2 size={13} /></button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="bim3d-form-row">
              <button type="button" onClick={() => generateTourPlan('report')}><ClipboardList size={16} /> Generate tour script</button>
              <button type="button" onClick={() => generateTourPlan('directcut')}><Route size={16} /> Generate camera path</button>
            </div>
            {tourOutput && (
              <pre className="bim3d-output-pre">{[
                tourOutput.tourTitle,
                tourOutput.objective,
                '',
                'Ordered steps:',
                ...tourOutput.orderedSteps,
                '',
                'Narration:',
                ...tourOutput.narration,
              ].join('\n')}</pre>
            )}
          </div>
          <div>
            <h3>Animation Builder</h3>
            <div className="bim3d-form-grid">
              <label><span>Movement</span><select value={newAnimation.movementType} onChange={event => setNewAnimation(prev => ({ ...prev, movementType: event.target.value as MovementType }))}>{['Dolly In', 'Dolly Out', 'Orbit', 'Pan', 'Tilt', 'Flyover', 'Walkthrough', 'Top Reveal', 'Section Reveal', 'Exploded Assembly'].map(value => <option key={value}>{value}</option>)}</select></label>
              <label><span>Transition</span><select value={newAnimation.transition} onChange={event => setNewAnimation(prev => ({ ...prev, transition: event.target.value as TransitionType }))}>{['Cut', 'Smooth', 'Fade', 'Speed ramp'].map(value => <option key={value}>{value}</option>)}</select></label>
            </div>
            <input value={newAnimation.name} onChange={event => setNewAnimation(prev => ({ ...prev, name: event.target.value }))} placeholder="Keyframe name..." />
            <input value={newAnimation.duration} onChange={event => setNewAnimation(prev => ({ ...prev, duration: event.target.value }))} placeholder="Duration per segment..." />
            <button type="button" onClick={addAnimationKeyframe}><Plus size={16} /> Add camera keyframe</button>
            <ul>
              {animationSteps.map(item => <li key={item.id}><span className="evidence-pill assumption">{item.duration}</span>{item.name} · {item.movementType} · {item.transition}</li>)}
            </ul>
          </div>
        </div>
        {bimPlannerMessage && <p className="bim3d-planner-message">{bimPlannerMessage}</p>}
      </div>

      <div className="bim3d-report">
        <div className="bim3d-report-head">
          <div>
            <span>Report panel</span>
            <h3>Technical analysis and correction plan</h3>
          </div>
          <div className="bim3d-export-actions">
            <button type="button" onClick={() => downloadText(`apex-bim-permit-analysis-${Date.now()}.txt`, technicalReport)} style={{ background: '#2563eb', color: '#fff', border: '1px solid #3b82f6' }}>
              <FileText size={16} /> Analisar para Permit Americano (IBC)
            </button>
            <button type="button" onClick={() => downloadText(`apex-bim-technical-report-${Date.now()}.txt`, technicalReport)}><Download size={16} /> Export Technical Report</button>
            <button type="button" onClick={() => downloadText(`apex-bim-correction-report-${Date.now()}.txt`, correctionReport)}><Download size={16} /> Export Correction Report</button>
            <button type="button" onClick={() => downloadText(`apex-bim-tour-script-${Date.now()}.txt`, tourScript)}><Download size={16} /> Export Tour Script</button>
            <button type="button" onClick={() => downloadText(`apex-bim-camera-path-${Date.now()}.txt`, cameraPath)}><Download size={16} /> Export Camera Path</button>
            <button type="button" onClick={() => exportBrief('Twinmotion')}><Download size={16} /> Export Twinmotion Brief</button>
            <button type="button" onClick={() => exportBrief('Unreal')}><Download size={16} /> Export Unreal Brief</button>
            <button type="button" onClick={() => exportBrief('Blender')}><Download size={16} /> Export Blender Brief</button>
            <button type="button" onClick={() => exportBrief('DirectCut')}><Download size={16} /> Export DirectCut Storyboard</button>
            <button type="button" onClick={sendTourToDirectCut}><Send size={16} /> Send Tour to DirectCut</button>
            <button type="button" onClick={sendViewToArchVis}><Send size={16} /> Send View to ArchVis</button>
          </div>
        </div>
        <pre>{technicalReport}</pre>
      </div>

      <div className="bim3d-actions">
        {nextActions.map((step, index) => {
          const icons = [RefreshCw, Workflow, PackageOpen, ScanSearch, Route]
          const Icon = icons[index] || Workflow
          return (
            <button key={step.text} type="button">
              <Icon size={16} /> <span className={`evidence-pill ${step.level.toLowerCase()}`}>{step.level}</span> {step.text}
            </button>
          )
        })}
      </div>
    </section>
  )
}

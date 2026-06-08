import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Aperture,
  Box,
  Camera,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Layers3,
  Lightbulb,
  Map,
  Move3D,
  PackageOpen,
  PanelTopOpen,
  RefreshCw,
  Route,
  ScanSearch,
  Scissors,
  Sparkles,
  Sun,
  Workflow,
  X,
  ZoomIn,
} from 'lucide-react'
import { formatSize, IntakeFile } from '../lib/fileIntake'

type Bim3DPanelProps = {
  source: IntakeFile
  onClear: () => void
}

type EvidenceLevel = 'CONFIRMED' | 'ASSUMPTION' | 'UNKNOWN'

type EvidenceItem = {
  level: EvidenceLevel
  text: string
}

const WEB_VIEWER_FORMATS = ['ifc', 'glb', 'gltf', 'obj', 'stl', 'fbx']
const IMPORT_FORMATS = ['rvt', 'dwg', 'dxf', 'skp']

const twinmotionControls = [
  { label: 'Orbit', icon: Move3D, status: 'planning-only' },
  { label: 'Walkthrough', icon: Route, status: 'planning-only' },
  { label: 'Section Box', icon: Scissors, status: 'planning-only' },
  { label: 'Exploded View', icon: Layers3, status: 'planning-only' },
  { label: 'X-Ray', icon: Eye, status: 'planning-only' },
  { label: 'Sun Study', icon: Sun, status: 'planning-only' },
  { label: 'Materials', icon: PanelTopOpen, status: 'planning-only' },
  { label: 'Lighting', icon: Lightbulb, status: 'planning-only' },
  { label: 'Camera', icon: Camera, status: 'planning-only' },
  { label: 'Saved Views', icon: Aperture, status: 'planning-only' },
  { label: 'Tour Path', icon: Map, status: 'planning-only' },
  { label: 'Animation Path', icon: Sparkles, status: 'planning-only' },
]

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
  if (mode === 'viewer') return 'planning-only'
  if (mode === 'import') return 'import-required'
  return 'planning-only'
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
        'Viewer/parser connector status: loader WebGL/parser real ainda não retornou geometria nesta versão local. Nenhum modelo falso foi renderizado.',
      error:
        'Real viewer result: parser/renderer connector not connected in this local foundation build.',
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
    status: 'Viewer/parser connector status: formato não mapeado para viewer direto nesta versão local.',
    error: 'Real review result: no parser mapped for this file extension in this local foundation build.',
    limitation: 'Leitura profunda do conteúdo ainda não está disponível para este formato.',
  }
}

function confirmedFacts(source: IntakeFile): EvidenceItem[] {
  const ext = fileExtension(source.file.name)
  return [
    { level: 'CONFIRMED', text: `File name: ${source.file.name}` },
    { level: 'CONFIRMED', text: `Extension: ${formatLabel(ext)}` },
    { level: 'CONFIRMED', text: `Browser MIME type: ${source.file.type || 'not provided by browser'}` },
    { level: 'CONFIRMED', text: `File size: ${formatSize(source.file.size)}` },
    { level: 'CONFIRMED', text: `Format support status: ${supportStatus(ext)}` },
    { level: 'CONFIRMED', text: `Apex flow selected: ${supportedFlow(ext)}` },
  ]
}

function detectedIssues(ext: string): EvidenceItem[] {
  const copy = statusCopy(ext)
  return [
    { level: 'CONFIRMED', text: copy.status },
    { level: 'CONFIRMED', text: copy.error },
  ]
}

function assumptions(ext: string): EvidenceItem[] {
  return [
    {
      level: 'ASSUMPTION',
      text: studioMode(ext) === 'viewer'
        ? 'The file is intended for internal model visualization because the extension belongs to Apex web-viewer formats.'
        : studioMode(ext) === 'import'
          ? 'The file is intended for internal conversion/import because the extension is proprietary/CAD or requires conversion before web visualization.'
          : 'The file is intended for technical review because the extension is not mapped to a direct viewer/import connector yet.',
    },
    {
      level: 'ASSUMPTION',
      text: 'After successful load or conversion, Apex can prepare orbit, walkthrough, flyover, section pass and client-presentation camera paths.',
    },
  ]
}

function unknowns(ext: string): EvidenceItem[] {
  const copy = statusCopy(ext)
  return [
    { level: 'UNKNOWN', text: copy.limitation },
    { level: 'UNKNOWN', text: 'Geometry, levels/layers, materials, quantities, clashes and cameras are not confirmed until parser/viewer/converter succeeds.' },
    { level: 'UNKNOWN', text: 'No clash, quantity, material or camera-path finding is presented as fact until detected by a real parser/viewer.' },
  ]
}

function suggestedCorrections(ext: string): EvidenceItem[] {
  if (studioMode(ext) === 'viewer') {
    return [
      { level: 'CONFIRMED', text: 'Retry viewer inside Apex when the real loader/parser is connected.' },
      { level: 'ASSUMPTION', text: 'If the viewer returns an import error, convert internally to GLB/IFC and repeat the opening in BIM / 3D Studio.' },
      { level: 'CONFIRMED', text: 'Generate an Apex package with original file, confirmed metadata and viewer/import error log.' },
      { level: 'ASSUMPTION', text: 'Correction in source model recommended: adjust in Revit/authoring tool and re-export IFC/GLB. Apex report attached.' },
    ]
  }
  return [
    { level: 'CONFIRMED', text: 'Prepare Apex import package with original file, extension, size and technical objective.' },
    { level: 'CONFIRMED', text: 'Convert internally to IFC or GLB before web visualization.' },
    { level: 'ASSUMPTION', text: 'After conversion, review geometry, materials, scale, layers/families and clashes inside the Studio.' },
    { level: 'ASSUMPTION', text: 'Correction in source model recommended: adjust in Revit/authoring tool and re-export IFC/GLB. Apex report attached.' },
  ]
}

function actionItems(ext: string): EvidenceItem[] {
  if (studioMode(ext) === 'viewer') {
    return [
      { level: 'CONFIRMED', text: 'retry viewer' },
      { level: 'ASSUMPTION', text: 'convert to GLB/IFC if parser/viewer fails' },
      { level: 'CONFIRMED', text: 'prepare import package' },
      { level: 'ASSUMPTION', text: 'extract metadata if connector becomes available' },
      { level: 'CONFIRMED', text: 'create technical review plan' },
    ]
  }
  return [
    { level: 'CONFIRMED', text: 'prepare import package' },
    { level: 'CONFIRMED', text: 'convert to GLB/IFC' },
    { level: 'ASSUMPTION', text: 'extract metadata after converter/parser is available' },
    { level: 'CONFIRMED', text: 'create technical review plan' },
    { level: 'ASSUMPTION', text: 'retry viewer after conversion' },
  ]
}

function tourSteps(ext: string): EvidenceItem[] {
  return [
    { level: 'ASSUMPTION', text: studioMode(ext) === 'viewer' ? 'Start with model overview after geometry loads.' : 'Start with converted model overview after Apex import finishes.' },
    { level: 'ASSUMPTION', text: 'Add orbit around full model for client orientation.' },
    { level: 'ASSUMPTION', text: 'Add section box pass to reveal internal organization.' },
    { level: 'ASSUMPTION', text: 'Add walkthrough route for scale, circulation and construction review.' },
    { level: 'ASSUMPTION', text: 'Add final camera hold for presentation image or video export.' },
  ]
}

function animationPath(ext: string): EvidenceItem[] {
  return [
    { level: 'ASSUMPTION', text: 'Camera 01: full model orbit.' },
    { level: 'ASSUMPTION', text: 'Camera 02: flyover/top reveal.' },
    { level: 'ASSUMPTION', text: 'Camera 03: section box sweep.' },
    { level: 'ASSUMPTION', text: 'Camera 04: walkthrough entry path.' },
    { level: 'ASSUMPTION', text: `Export briefing: ${studioMode(ext) === 'import' ? 'convert/import first, then prepare Twinmotion/Unreal/Blender style scene package from Apex report.' : 'after viewer/parser loads, prepare Twinmotion/Unreal/Blender style scene package from Apex report.'}` },
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

export function Bim3DPanel({ source, onClear }: Bim3DPanelProps) {
  const ext = fileExtension(source.file.name)
  const copy = statusCopy(ext)
  const mode = studioMode(ext)
  const [selectedControls, setSelectedControls] = useState<string[]>(['Orbit', 'Section Box', 'Tour Path'])
  const [manualTourStep, setManualTourStep] = useState('')
  const [customTourSteps, setCustomTourSteps] = useState<EvidenceItem[]>([])

  const facts = useMemo(() => confirmedFacts(source), [source])
  const issues = useMemo(() => detectedIssues(ext), [ext])
  const assumptionItems = useMemo(() => assumptions(ext), [ext])
  const unknownItems = useMemo(() => unknowns(ext), [ext])
  const correctionItems = useMemo(() => suggestedCorrections(ext), [ext])
  const nextActions = useMemo(() => actionItems(ext), [ext])
  const tourItems = useMemo(() => [...tourSteps(ext), ...customTourSteps], [customTourSteps, ext])
  const animationItems = useMemo(() => animationPath(ext), [ext])

  const technicalReport = reportText('APEX BIM / 3D STUDIO - TECHNICAL REPORT', [
    { label: 'Viewer / import status', items: issues },
    { label: 'Confirmed metadata', items: facts },
    { label: 'Detected issues', items: issues },
    { label: 'Assumptions', items: assumptionItems },
    { label: 'Unknown / not available', items: unknownItems },
    { label: 'Recommended next actions', items: nextActions },
  ])

  const correctionReport = reportText('APEX BIM / 3D STUDIO - CORRECTION REPORT', [
    { label: 'Suggested corrections', items: correctionItems },
    { label: 'Recommended next actions', items: nextActions },
    { label: 'Unknown / not available', items: unknownItems },
  ])

  const tourScript = reportText('APEX BIM / 3D STUDIO - TOUR SCRIPT', [
    { label: 'Tour path', items: tourItems },
    { label: 'Twinmotion-style controls selected', items: selectedControls.map(control => ({ level: 'ASSUMPTION', text: control })) },
  ])

  const cameraPath = reportText('APEX BIM / 3D STUDIO - CAMERA / ANIMATION PATH', [
    { label: 'Animation sequence planning', items: animationItems },
    { label: 'Export recommendations', items: [
      { level: 'ASSUMPTION', text: 'Twinmotion-style scene package can be prepared after Apex model load/conversion.' },
      { level: 'ASSUMPTION', text: 'Unreal/Blender-style export briefing remains planning-only until a real 3D renderer/export connector is connected.' },
    ] },
  ])

  function toggleControl(label: string) {
    setSelectedControls(prev => prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label])
  }

  function addCurrentViewToTour() {
    const text = manualTourStep.trim() || `Saved view using controls: ${selectedControls.join(', ') || 'no controls selected'}`
    setCustomTourSteps(prev => [...prev, { level: 'ASSUMPTION', text }])
    setManualTourStep('')
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
        <div>
          <CheckCircle2 size={16} />
          <span>Evidence</span>
          <strong>CONFIRMED</strong>
        </div>
        <div>
          <FileText size={16} />
          <span>Name</span>
          <strong>{source.file.name}</strong>
        </div>
        <div>
          <PackageOpen size={16} />
          <span>Type</span>
          <strong>{source.file.type || formatLabel(ext)}</strong>
        </div>
        <div>
          <ScanSearch size={16} />
          <span>Size</span>
          <strong>{formatSize(source.file.size)}</strong>
        </div>
        <div>
          <Workflow size={16} />
          <span>Apex flow</span>
          <strong>{supportedFlow(ext)}</strong>
        </div>
        <div>
          <ZoomIn size={16} />
          <span>Status</span>
          <strong>{providerStatus(ext)}</strong>
        </div>
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

      <div className="bim3d-tour-editor">
        <div className="bim3d-section-head">
          <span>Tour / animation workspace</span>
          <strong>Camera path and animation planning</strong>
        </div>
        <div className="bim3d-tour-grid">
          <div>
            <h3>Tour steps editor</h3>
            <ul>
              {tourItems.map(item => (
                <li key={item.text}><span className={`evidence-pill ${item.level.toLowerCase()}`}>{item.level}</span>{item.text}</li>
              ))}
            </ul>
            <div className="bim3d-tour-add">
              <input value={manualTourStep} onChange={event => setManualTourStep(event.target.value)} placeholder="Add current view note or tour step..." />
              <button type="button" onClick={addCurrentViewToTour}><Camera size={16} /> Add current view to tour</button>
            </div>
          </div>
          <div>
            <h3>Animation sequence planning</h3>
            <ul>
              {animationItems.map(item => (
                <li key={item.text}><span className={`evidence-pill ${item.level.toLowerCase()}`}>{item.level}</span>{item.text}</li>
              ))}
            </ul>
            <p>Twinmotion/Unreal/Blender export briefing is planning-only until a real 3D renderer/export connector is connected.</p>
          </div>
        </div>
      </div>

      <div className="bim3d-report">
        <div className="bim3d-report-head">
          <div>
            <span>Report panel</span>
            <h3>Technical analysis and correction plan</h3>
          </div>
          <div className="bim3d-export-actions">
            <button type="button" onClick={() => downloadText(`apex-bim-technical-report-${Date.now()}.txt`, technicalReport)}>
              <Download size={16} /> Export Technical Report
            </button>
            <button type="button" onClick={() => downloadText(`apex-bim-correction-report-${Date.now()}.txt`, correctionReport)}>
              <Download size={16} /> Export Correction Report
            </button>
            <button type="button" onClick={() => downloadText(`apex-bim-tour-script-${Date.now()}.txt`, tourScript)}>
              <Download size={16} /> Export Tour Script
            </button>
            <button type="button" onClick={() => downloadText(`apex-bim-camera-path-${Date.now()}.txt`, cameraPath)}>
              <Download size={16} /> Export Camera Path
            </button>
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

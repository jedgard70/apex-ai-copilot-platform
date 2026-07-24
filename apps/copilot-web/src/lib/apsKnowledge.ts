// APS (Autodesk Platform Services) Model Derivative knowledge and types

export type ApsAction = 'idle' | 'uploading' | 'uploaded' | 'translating' | 'ready' | 'error'
export type ApsStepStatus = 'pending' | 'active' | 'done' | 'error'

export type ApsStep = {
  id: string
  label: string
  status: ApsStepStatus
  detail?: string
}

export type ApsPlan = {
  providerStatus: 'aps-live' | 'aps-error' | 'local-only'
  action: ApsAction
  // Upload
  uploadUrl?: string
  uploadKey?: string
  objectKey?: string
  objectId?: string
  bucketKey?: string
  size?: number
  // Translation
  urn?: string
  translationResult?: string
  status?: string
  progress?: string
  derivatives?: unknown[]
  isReady?: boolean
  hasFailed?: boolean
  // Viewer
  viewerToken?: string
  // Meta
  supportedFormats?: string[]
  error?: string
  steps: ApsStep[]
  message: string
}

// Supported APS file formats (for file input accept attribute)
export const APS_ACCEPT = [
  '.rvt', '.rfa', '.rte',
  '.dwg', '.dwf', '.dwfx', '.dws',
  '.nwd', '.nwc',
  '.ipt', '.iam',
  '.ifc',
  '.fbx',
  '.dgn',
  '.3dm',
  '.skp',
  '.stp', '.step', '.stpz',
  '.obj', '.stl',
  '.sldprt', '.sldasm', '.slddrw',
  '.3ds',
  '.f3d', '.f2d',
  '.pdf',
].join(',')

export const APS_FORMAT_LABELS: Record<string, string> = {
  rvt: 'Revit', rfa: 'Revit Family', rte: 'Revit Template',
  dwg: 'AutoCAD', dwf: 'Design Web Format', dwfx: 'DWFx',
  nwd: 'Navisworks', nwc: 'Navisworks Cache',
  ipt: 'Inventor Part', iam: 'Inventor Assembly',
  ifc: 'IFC / BIM',
  fbx: 'FBX',
  dgn: 'MicroStation DGN',
  '3dm': 'Rhino 3DM',
  skp: 'SketchUp',
  stp: 'STEP', step: 'STEP', stpz: 'STEP (compressed)',
  obj: 'OBJ', stl: 'STL',
  sldprt: 'SolidWorks Part', sldasm: 'SolidWorks Assembly',
  '3ds': '3ds Max',
  f3d: 'Fusion 360 3D', f2d: 'Fusion 360 2D',
  pdf: 'PDF',
}

/** Detect if a message is asking for APS/Model Derivative/BIM Viewer functionality */
export function isApsIntent(text: string): boolean {
  return /\b(aps|autodesk|model.?derivative|revit|rvt|ifc|bim.?viewer|dwg|navisworks|nwd|viewer.?3d|3d.?viewer|upload.*modelo|carrega.*modelo|abrir.*modelo|traduz.*modelo|abre.*viewer|visualiz.*3d)\b/i.test(text)
}

/** Poll interval in ms — starts fast, backs off */
export function pollInterval(attempt: number): number {
  if (attempt < 3) return 3000
  if (attempt < 8) return 6000
  return 10000
}

export type IntakeFile = {
  file: File
  previewUrl?: string
  url?: string
  dataUrl?: string
  extractedText?: string
  pageCount?: number
  dimensions?: {
    width: number
    height: number
  }
  extractionStatus?: 'idle' | 'extracting' | 'ready' | 'failed'
  kind: 'image' | 'pdf' | 'bim-cad' | 'video' | 'spreadsheet' | 'document' | 'unknown'
}

export function classifyFile(file: File): IntakeFile['kind'] {
  const ext = file.name.toLowerCase().split('.').pop() || ''
  if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image'
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf'
  if (['ifc', 'rvt', 'dwg', 'dxf', 'skp', 'fbx', 'obj', 'stl', 'glb', 'gltf'].includes(ext)) return 'bim-cad'
  if (file.type.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(ext)) return 'video'
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet'
  if (['doc', 'docx', 'txt', 'md', 'json'].includes(ext)) return 'document'
  return 'unknown'
}

export function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} bytes`
}

export function isVisionReady(kind: IntakeFile['kind']) {
  return kind === 'image'
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })
}

export function readImageDimensions(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Could not read image dimensions.'))
    image.src = dataUrl
  })
}

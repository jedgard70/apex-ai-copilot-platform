// PDF text extraction using PDF.js (client-side, no server needed)
// Enhanced extraction with structure preservation, progress tracking, and metadata

const MAX_CHARS = 120_000 // keeps within typical context limits

export type PdfExtractResult = {
  text: string
  pageCount: number
  truncated: boolean
  metadata?: PdfMetadata
  isScanned?: boolean
}

export type PdfMetadata = {
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
}

export type ExtractProgress = {
  currentPage: number
  totalPages: number
  percent: number
}

let workerSrcSet = false

async function ensureWorker() {
  if (workerSrcSet) return
  const pdfjsLib = await import('pdfjs-dist')
  // Point worker to CDN to avoid bundling pdf.worker into the app
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js'
  workerSrcSet = true
}

/**
 * Extract text from PDF with structure preservation
 * Groups text items by Y position to reconstruct lines
 */
async function extractPageText(page: any): Promise<string> {
  const content = await page.getTextContent()
  const items = content.items.filter((item: any) => 'str' in item && item.str.trim())

  if (items.length === 0) return ''

  // Group items by Y position (with tolerance for slight variations)
  const tolerance = 2
  const lines: Map<number, Array<{ x: number; str: string }>> = new Map()

  for (const item of items) {
    const y = Math.round(item.transform[5] / tolerance) * tolerance
    if (!lines.has(y)) {
      lines.set(y, [])
    }
    lines.get(y)!.push({
      x: item.transform[4],
      str: item.str,
    })
  }

  // Sort lines by Y (descending - PDF coordinates start from bottom)
  const sortedYs = Array.from(lines.keys()).sort((a, b) => b - a)

  // Build text with proper line breaks
  const textLines: string[] = []
  for (const y of sortedYs) {
    const lineItems = lines.get(y)!
    // Sort items within line by X position
    lineItems.sort((a, b) => a.x - b.x)
    const lineText = lineItems.map((item) => item.str).join(' ')
    if (lineText.trim()) {
      textLines.push(lineText.trim())
    }
  }

  return textLines.join('\n')
}

/**
 * Extract metadata from PDF
 */
async function extractMetadata(pdf: any): Promise<PdfMetadata | undefined> {
  try {
    const metadata = await pdf.getMetadata()
    const info = metadata.info as any

    if (!info || Object.keys(info).length === 0) return undefined

    const result: PdfMetadata = {}

    if (info.Title) result.title = info.Title
    if (info.Author) result.author = info.Author
    if (info.Subject) result.subject = info.Subject
    if (info.Creator) result.creator = info.Creator
    if (info.Producer) result.producer = info.Producer
    if (info.CreationDate) result.creationDate = info.CreationDate
    if (info.ModDate) result.modificationDate = info.ModDate

    return Object.keys(result).length > 0 ? result : undefined
  } catch {
    return undefined
  }
}

/**
 * Detect if PDF is likely scanned (image-based) with no extractable text
 */
function detectScannedPdf(pagesWithText: number, totalPages: number): boolean {
  // If less than 10% of pages have text, likely scanned
  return pagesWithText < totalPages * 0.1
}

export async function extractPdfText(
  file: File,
  onProgress?: (progress: ExtractProgress) => void,
): Promise<PdfExtractResult> {
  await ensureWorker()
  const { getDocument } = await import('pdfjs-dist')

  const buffer = await file.arrayBuffer()

  let pdf
  try {
    pdf = await getDocument({ data: buffer }).promise
  } catch (error) {
    throw new Error(
      `Falha ao abrir PDF: ${error instanceof Error ? error.message : 'arquivo corrompido ou protegido'}`,
    )
  }

  const pageCount = pdf.numPages

  // Extract metadata
  const metadata = await extractMetadata(pdf)

  const parts: string[] = []
  let totalChars = 0
  let pagesWithText = 0

  for (let p = 1; p <= pageCount; p++) {
    // Report progress
    if (onProgress) {
      onProgress({
        currentPage: p,
        totalPages: pageCount,
        percent: Math.round((p / pageCount) * 100),
      })
    }

    if (totalChars >= MAX_CHARS) break

    const page = await pdf.getPage(p)
    const pageText = await extractPageText(page)

    if (pageText) {
      pagesWithText++
      parts.push(`[Página ${p}]\n${pageText}`)
      totalChars += pageText.length
    }
  }

  const joined = parts.join('\n\n')
  const truncated = totalChars >= MAX_CHARS
  const isScanned = detectScannedPdf(pagesWithText, pageCount)

  return {
    text: truncated ? joined.slice(0, MAX_CHARS) + '\n…[texto truncado]' : joined,
    pageCount,
    truncated,
    metadata,
    isScanned,
  }
}

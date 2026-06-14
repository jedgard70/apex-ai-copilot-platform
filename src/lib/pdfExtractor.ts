// PDF text extraction using PDF.js (client-side, no server needed)
// Extracted text is used as context for the AI operator

const MAX_CHARS = 12_000 // keeps within typical context limits

export type PdfExtractResult = {
  text: string
  pageCount: number
  truncated: boolean
}

let workerSrcSet = false

async function ensureWorker() {
  if (workerSrcSet) return
  const pdfjsLib = await import('pdfjs-dist')
  // Use the bundled legacy worker via CDN-like path; Vite copies it via optimizeDeps
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href
  workerSrcSet = true
}

export async function extractPdfText(file: File): Promise<PdfExtractResult> {
  await ensureWorker()
  const { getDocument } = await import('pdfjs-dist')

  const buffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: buffer }).promise
  const pageCount = pdf.numPages

  const parts: string[] = []
  let totalChars = 0

  for (let p = 1; p <= pageCount; p++) {
    if (totalChars >= MAX_CHARS) break
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s{3,}/g, '  ')
      .trim()

    if (pageText) {
      parts.push(`[Página ${p}]\n${pageText}`)
      totalChars += pageText.length
    }
  }

  const joined = parts.join('\n\n')
  const truncated = totalChars >= MAX_CHARS

  return {
    text: truncated ? joined.slice(0, MAX_CHARS) + '\n…[texto truncado]' : joined,
    pageCount,
    truncated,
  }
}

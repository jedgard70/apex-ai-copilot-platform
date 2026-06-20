/**
 * PDF Extraction Module using pdf.js
 * Handles PDF text extraction for the Universal File Intake
 */

import fetch from 'node-fetch'

const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

export async function extractPdfText(pdfBuffer, fileName = 'document.pdf') {
  try {
    const pdfParse = await import('pdf-parse').catch(() => null)
    
    if (!pdfParse) {
      return {
        text: `[PDF file detected: ${fileName}. Full text extraction requires pdf-parse npm package.]`,
        pageCount: 0,
        success: false,
        error: 'pdf-parse not installed. Install with: npm install pdf-parse',
        fallback: true
      }
    }

    const data = await pdfParse.default(pdfBuffer)
    const extractedText = data.text || ''
    const pageCount = data.numpages || 0

    return {
      text: extractedText.trim(),
      pageCount,
      success: true,
      error: null
    }
  } catch (err) {
    console.error(`[pdfExtractor] Error extracting PDF ${fileName}:`, err.message)
    return {
      text: `[PDF extraction failed: ${err.message}]`,
      pageCount: 0,
      success: false,
      error: err.message
    }
  }
}

export function isPdfFile(buffer) {
  if (!buffer || buffer.length < 4) return false
  return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
}

export async function getPdfMetadata(pdfBuffer) {
  try {
    const pdfParse = await import('pdf-parse').catch(() => null)
    
    if (!pdfParse) {
      return { pageCount: 0, error: 'pdf-parse not installed' }
    }

    const data = await pdfParse.default(pdfBuffer)
    return {
      pageCount: data.numpages || 0,
      title: data.info?.Title || undefined,
      author: data.info?.Author || undefined,
      creationDate: data.info?.CreationDate || undefined,
      subject: data.info?.Subject || undefined,
    }
  } catch (err) {
    console.error('[pdfExtractor] Error getting PDF metadata:', err.message)
    return { pageCount: 0, error: err.message }
  }
}

export async function preparePdfFileContext(buffer, fileName) {
  if (!isPdfFile(buffer)) {
    return {
      kind: 'unknown',
      extractionStatus: 'failed',
      error: 'Not a valid PDF file'
    }
  }

  const extraction = await extractPdfText(buffer, fileName)
  
  return {
    kind: 'pdf',
    extractionStatus: extraction.success ? 'ready' : 'failed',
    extractedText: extraction.text,
    pageCount: extraction.pageCount,
    error: extraction.error,
    fallback: extraction.fallback
  }
}

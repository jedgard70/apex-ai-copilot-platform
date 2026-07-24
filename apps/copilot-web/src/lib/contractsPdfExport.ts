import { jsPDF } from 'jspdf'
import type { ContractContext, ContractsPlan } from './contractsKnowledge'

const DISCLAIMER =
  'Gerado por Apex AI Copilot — este documento é um rascunho de planejamento. Não constitui aconselhamento jurídico.'

function normalizeLines(text: string) {
  return String(text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export function exportContractPdf(plan: ContractsPlan, context: ContractContext) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 42
  const maxWidth = pageWidth - margin * 2
  let y = margin

  const projectName = context.projectName || 'Projeto'
  const docType = plan.detectedDocumentType || context.documentType || 'Contrato'
  const date = new Date().toLocaleDateString('pt-BR')
  const safeName = projectName.replace(/[^a-zA-Z0-9\-_]/g, '_').slice(0, 40) || 'projeto'

  const ensureSpace = (nextHeight = 18) => {
    if (y + nextHeight <= pageHeight - margin) return
    doc.addPage()
    y = margin
  }

  const writeBlock = (title: string, text: string) => {
    if (!text?.trim()) return
    ensureSpace(26)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(title, margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const wrapped = doc.splitTextToSize(text, maxWidth) as string[]
    for (const line of wrapped) {
      ensureSpace(14)
      doc.text(line, margin, y)
      y += 13
    }
    y += 8
  }

  const writeList = (title: string, items: string[]) => {
    const rows = items.filter(Boolean)
    if (!rows.length) return
    ensureSpace(26)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(title, margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    for (const item of rows) {
      const wrapped = doc.splitTextToSize(`- ${item}`, maxWidth) as string[]
      for (const line of wrapped) {
        ensureSpace(14)
        doc.text(line, margin, y)
        y += 13
      }
    }
    y += 8
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(`${docType} — ${projectName}`, margin, y)
  y += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${context.parties ? `${context.parties} · ` : ''}${date}`, margin, y)
  y += 20

  writeBlock('Resumo do documento', plan.documentSummary)
  writeBlock('Resumo para o cliente', plan.clientFacingSummary)
  writeBlock('Parecer para revisão jurídica', plan.lawyerReviewSummary)
  writeBlock('Minuta do contrato', plan.contractDraft)

  writeList('Questões pendentes', plan.pendingQuestions)
  writeList('Escopo — serviços incluídos', plan.scopeDraft.servicesIncluded)
  writeList('Escopo — materiais/especificações', plan.scopeDraft.materialsSpecs)
  writeList('Escopo — exclusões', plan.scopeDraft.exclusions)
  writeList('Escopo — entregáveis', plan.scopeDraft.deliverables)

  if (plan.riskItems.length) {
    const riskLines = plan.riskItems.map(item =>
      `${item.clause} | ${item.issue} | ${item.severity} | ${item.recommendation}`,
    )
    writeList('Riscos contratuais (resumo)', riskLines)
  }

  if (plan.permitChecklist.length) {
    const permitLines = plan.permitChecklist.map(item =>
      `${item.category}: ${item.requirement} [${item.status} / ${item.evidence}]`,
    )
    writeList('Checklist de licenças/alvarás (resumo)', permitLines)
  }

  writeBlock('Disclaimer', DISCLAIMER)
  doc.save(`apex-${docType.toLowerCase().replace(/\s+/g, '-')}-${safeName}-${date.replace(/\//g, '-')}.pdf`)
}


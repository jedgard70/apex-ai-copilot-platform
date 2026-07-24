import type { ContractsPlan, ContractContext } from './contractsKnowledge'
import { generateDocx, downloadBlob, type DocxSection } from './docxGenerator'

const DISCLAIMER =
  'Gerado por Apex AI Copilot — este documento é um rascunho de planejamento. ' +
  'Não constitui aconselhamento jurídico. Revise com advogado habilitado antes de assinar.'

export async function exportContractDocx(plan: ContractsPlan, context: ContractContext): Promise<void> {
  const sections: DocxSection[] = []

  // Summary
  if (plan.documentSummary) {
    sections.push({ heading: 'Resumo do Documento', body: plan.documentSummary })
  }

  // Client-facing summary
  if (plan.clientFacingSummary) {
    sections.push({ heading: 'Resumo para o Cliente', body: plan.clientFacingSummary })
  }

  // Scope draft
  const scope = plan.scopeDraft
  if (scope.servicesIncluded.length || scope.deliverables.length) {
    sections.push({
      heading: 'Escopo de Serviços',
      body: '',
    })
    if (scope.servicesIncluded.length) {
      sections.push({ heading: 'Serviços Incluídos', items: scope.servicesIncluded })
    }
    if (scope.materialsSpecs.length) {
      sections.push({ heading: 'Materiais / Especificações', items: scope.materialsSpecs })
    }
    if (scope.exclusions.length) {
      sections.push({ heading: 'Exclusões', items: scope.exclusions })
    }
    if (scope.deliverables.length) {
      sections.push({ heading: 'Entregáveis', items: scope.deliverables })
    }
    if (scope.changeOrderRules.length) {
      sections.push({ heading: 'Regras de Aditivo', items: scope.changeOrderRules })
    }
    if (scope.acceptanceCriteria.length) {
      sections.push({ heading: 'Critérios de Aceite', items: scope.acceptanceCriteria })
    }
  }

  // Risk items table
  if (plan.riskItems.length) {
    sections.push({
      heading: 'Análise de Riscos Contratuais',
      table: {
        headers: ['Cláusula', 'Problema', 'Severidade', 'Recomendação'],
        rows: plan.riskItems.map(item => [
          item.clause || '',
          item.issue || '',
          item.severity || '',
          item.recommendation || '',
        ]),
      },
    })
  }

  // Contract draft full text
  if (plan.contractDraft) {
    sections.push({ heading: 'Minuta do Contrato', body: plan.contractDraft })
  }

  // Permit checklist
  if (plan.permitChecklist.length) {
    sections.push({
      heading: 'Checklist de Alvarás / Licenças',
      table: {
        headers: ['Categoria', 'Requisito', 'Status', 'Evidência'],
        rows: plan.permitChecklist.map(item => [
          item.category || '',
          item.requirement || '',
          item.status || '',
          item.evidence || '',
        ]),
      },
    })
  }

  // Lawyer review
  if (plan.lawyerReviewSummary) {
    sections.push({ heading: 'Parecer para Revisão Jurídica', body: plan.lawyerReviewSummary })
  }

  // Pending questions
  if (plan.pendingQuestions.length) {
    sections.push({ heading: 'Questões Pendentes', items: plan.pendingQuestions })
  }

  const projectName = context.projectName || 'Projeto'
  const docType = plan.detectedDocumentType || context.documentType || 'Contrato'
  const date = new Date().toLocaleDateString('pt-BR')

  const blob = await generateDocx({
    title: `${docType} — ${projectName}`,
    subtitle: `${context.parties ? context.parties + ' · ' : ''}${date}`,
    sections,
    footer: DISCLAIMER,
  })

  const safeName = projectName.replace(/[^a-zA-Z0-9\-_]/g, '_').slice(0, 40)
  downloadBlob(blob, `apex-${docType.toLowerCase().replace(/\s+/g, '-')}-${safeName}-${date.replace(/\//g, '-')}.docx`)
}

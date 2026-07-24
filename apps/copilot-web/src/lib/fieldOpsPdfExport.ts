import { jsPDF } from 'jspdf'
import type { FieldOpsPlan, FieldRdoContext } from './fieldOpsKnowledge'

const DISCLAIMER =
  'Gerado por Apex AI Copilot — rascunho de campo. Não substitui relatório técnico assinado por responsável habilitado (ART/RRT).'

// ─── helpers ────────────────────────────────────────────────────────────────

function safeName(s: string) {
  return String(s || '').replace(/[^a-zA-Z0-9\-_]/g, '_').slice(0, 40) || 'rdo'
}

function wrap(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH = 14): number {
  const lines = doc.splitTextToSize(String(text || '').trim(), maxW) as string[]
  lines.forEach(line => { doc.text(line, x, y); y += lineH })
  return y
}

function badge(doc: jsPDF, label: string, x: number, y: number, color: [number, number, number]) {
  doc.setFillColor(...color)
  doc.roundedRect(x, y - 9, doc.getStringUnitWidth(label) * 8 + 10, 13, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.text(label, x + 5, y)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
}

const SEVERITY_COLORS: Record<string, [number, number, number]> = {
  Critical: [200, 30, 30],
  High:     [220, 100, 0],
  Medium:   [180, 150, 0],
  Low:      [80, 160, 80],
}

// ─── main export ─────────────────────────────────────────────────────────────

export function exportFieldOpsPdf(plan: FieldOpsPlan, ctx: FieldRdoContext): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const M = 42
  const maxW = PW - M * 2
  let y = M

  const project = ctx.project || 'Projeto'
  const date = ctx.date || new Date().toISOString().slice(0, 10)
  const filename = `rdo_${safeName(project)}_${date.replace(/-/g, '')}.pdf`

  const newPage = () => {
    doc.addPage()
    y = M
    drawHeader()
  }

  const space = (needed = 20) => { if (y + needed > PH - M) newPage() }

  const heading = (text: string, size = 13) => {
    space(26)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.text(text, M, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setDrawColor(200, 200, 200)
    doc.line(M, y, PW - M, y)
    y += 8
  }

  const field = (label: string, value: string) => {
    if (!value?.trim()) return
    space(22)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(label.toUpperCase(), M, y)
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y = wrap(doc, value, M, y, maxW)
    y += 6
  }

  const drawHeader = () => {
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, PW, 38, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('APEX AI COPILOT', M, 22)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Relatório Diário de Obra (RDO)', M + 175, 22)
    doc.setTextColor(160, 160, 160)
    doc.text(`${project} · ${date}`, PW - M, 22, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
  }

  // ── Cover ────────────────────────────────────────────────────────────────
  drawHeader()
  y = 60

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(15, 23, 42)
  doc.text('RDO — Relatório Diário de Obra', M, y)
  y += 26

  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(`Projeto: ${project}`, M, y);  y += 16
  doc.text(`Data: ${date}`, M, y);         y += 16
  if (ctx.weather) { doc.text(`Tempo: ${ctx.weather}`, M, y); y += 16 }
  if (ctx.crew)    { doc.text(`Equipe: ${ctx.crew}`, M, y);   y += 16 }
  y += 8
  doc.setTextColor(0, 0, 0)

  // ── Context fields ───────────────────────────────────────────────────────
  heading('Contexto do dia')
  field('Atividades realizadas',   ctx.activitiesPerformed)
  field('Equipamentos',            ctx.equipment)
  field('Materiais entregues/usados', ctx.materialsDeliveredUsed)
  field('Visitantes',              ctx.visitors)
  field('Atrasos',                 ctx.delays)
  field('Incidentes',              ctx.incidents)
  field('Notas de segurança',      ctx.safetyNotes)
  field('Notas de qualidade',      ctx.qualityNotes)

  // ── RDO Draft ────────────────────────────────────────────────────────────
  if (plan.rdoDraft?.trim()) {
    heading('Rascunho do RDO')
    doc.setFontSize(10)
    y = wrap(doc, plan.rdoDraft, M, y, maxW)
    y += 8
  }

  // ── Activities ───────────────────────────────────────────────────────────
  if (plan.activities.length > 0) {
    heading('Atividades')
    for (const act of plan.activities) {
      space(30)
      const statusColor: [number, number, number] =
        act.status === 'Completed' ? [80, 160, 80] :
        act.status === 'In Progress' ? [0, 100, 200] :
        act.status === 'Blocked' ? [200, 30, 30] : [120, 120, 120]
      badge(doc, act.status, M, y, statusColor)
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(act.description, M + doc.getStringUnitWidth(act.status) * 8 + 18, y)
      y += 14
      if (act.responsibleParty) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`Responsável: ${act.responsibleParty}  ·  Evidência: ${act.evidence}`, M + 10, y)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        y += 12
      }
      y += 4
    }
  }

  // ── Issues ───────────────────────────────────────────────────────────────
  if (plan.issues.length > 0) {
    heading('Ocorrências / Punch List')
    for (const issue of plan.issues) {
      space(44)
      const col = SEVERITY_COLORS[issue.severity] ?? [120, 120, 120]
      badge(doc, issue.severity, M, y, col)
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      const labelW = doc.getStringUnitWidth(issue.severity) * 8 + 18
      doc.text(issue.issue, M + labelW, y, { maxWidth: maxW - labelW })
      y += 14
      const meta = [
        issue.location && `Local: ${issue.location}`,
        `Responsável: ${issue.assignedTo}`,
        `Status: ${issue.status}`,
        issue.dueDate && `Prazo: ${issue.dueDate}`,
        `Evidência: ${issue.evidence}`,
      ].filter(Boolean).join('  ·  ')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      y = wrap(doc, meta, M + 10, y, maxW - 10, 12)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      y += 6
    }
  }

  // ── Safety items ─────────────────────────────────────────────────────────
  if (plan.safetyItems.length > 0) {
    heading('Segurança / EPI')
    for (const s of plan.safetyItems) {
      space(22)
      const ok = s.status === 'Accepted'
      doc.setFontSize(10)
      doc.text(`${ok ? '✓' : '✗'} ${s.item}`, M, y)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`${s.status}  ·  Risco: ${s.riskLevel}  ·  ${s.evidence}${s.notes ? '  —  ' + s.notes : ''}`, M + 20, y)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      y += 16
    }
  }

  // ── Quality items ─────────────────────────────────────────────────────────
  if (plan.qualityItems.length > 0) {
    heading('Qualidade')
    for (const q of plan.qualityItems) {
      space(22)
      const ok = q.status === 'Accepted'
      doc.text(`${ok ? '✓' : '✗'} ${q.item}`, M, y)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`${q.status}  ·  ${q.riskLevel}  ·  ${q.evidence}${q.notes ? '  —  ' + q.notes : ''}`, M + 20, y)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      y += 16
    }
  }

  // ── Crew & Materials ─────────────────────────────────────────────────────
  if (plan.crew.length > 0) {
    heading('Equipe')
    doc.text(plan.crew.join('\n'), M, y)
    y += plan.crew.length * 14 + 8
  }

  if (plan.materials.length > 0) {
    heading('Materiais')
    doc.text(plan.materials.join('\n'), M, y)
    y += plan.materials.length * 14 + 8
  }

  // ── Photo log ────────────────────────────────────────────────────────────
  if (plan.photoLog.length > 0) {
    heading('Registro fotográfico')
    for (const ph of plan.photoLog) {
      space(26)
      doc.setFont('helvetica', 'bold')
      doc.text(`📷 ${ph.fileName}`, M, y)
      doc.setFont('helvetica', 'normal')
      y += 13
      if (ph.caption) { doc.text(`  Legenda: ${ph.caption}`, M, y); y += 12 }
      if (ph.location) { doc.text(`  Local: ${ph.location}`, M, y); y += 12 }
      if (ph.relatedActivity) { doc.text(`  Atividade: ${ph.relatedActivity}`, M, y); y += 12 }
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`Evidência: ${ph.evidence}`, M + 10, y)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      y += 12
    }
  }

  // ── Summaries ────────────────────────────────────────────────────────────
  if (plan.clientSummary?.trim()) { heading('Resumo para cliente'); y = wrap(doc, plan.clientSummary, M, y, maxW); y += 8 }
  if (plan.safetyReport?.trim())  { heading('Relatório de segurança'); y = wrap(doc, plan.safetyReport, M, y, maxW); y += 8 }
  if (plan.qualityPunchList?.trim()) { heading('Punch list de qualidade'); y = wrap(doc, plan.qualityPunchList, M, y, maxW); y += 8 }
  if (plan.materialsLog?.trim())  { heading('Log de materiais'); y = wrap(doc, plan.materialsLog, M, y, maxW); y += 8 }
  if (plan.nextDayPlan?.trim())   { heading('Plano para amanhã'); y = wrap(doc, plan.nextDayPlan, M, y, maxW); y += 8 }
  if (plan.confidenceSummary?.trim()) { heading('Confiança / evidências'); y = wrap(doc, plan.confidenceSummary, M, y, maxW); y += 8 }

  // ── Footer disclaimer ─────────────────────────────────────────────────────
  const totalPages = (doc.internal as unknown as { pages: unknown[] }).pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(DISCLAIMER, M, PH - 20)
    doc.text(`Pág. ${i} / ${totalPages}`, PW - M, PH - 20, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  doc.save(filename)
}

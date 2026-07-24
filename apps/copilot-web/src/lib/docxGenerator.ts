// DOCX generation for contracts/proposals using the docx library
// All processing is client-side — no server upload needed

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from 'docx'

export type DocxSection = {
  heading?: string
  body?: string
  items?: string[]
  table?: { headers: string[]; rows: string[][] }
}

export type DocxDocumentOptions = {
  title: string
  subtitle?: string
  sections: DocxSection[]
  footer?: string
}

function paragraphFromText(text: string, opts?: { bold?: boolean; size?: number; color?: string }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        size: opts?.size ?? 22,
        color: opts?.color,
        font: 'Calibri',
      }),
    ],
    spacing: { after: 120 },
  })
}

function buildTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    children: headers.map(h =>
      new TableCell({
        children: [paragraphFromText(h, { bold: true, size: 20 })],
        shading: { type: ShadingType.SOLID, color: '07183f', fill: '07183f' },
      })
    ),
  })

  const dataRows = rows.map(row =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          children: [paragraphFromText(cell, { size: 20 })],
        })
      ),
    })
  )

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'dfe7f2' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'dfe7f2' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'dfe7f2' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'dfe7f2' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'dfe7f2' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'dfe7f2' },
    },
  })
}

export async function generateDocx(options: DocxDocumentOptions): Promise<Blob> {
  const children: (Paragraph | Table)[] = []

  // Title
  children.push(
    new Paragraph({
      text: options.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: options.title, bold: true, size: 52, color: '07183f', font: 'Calibri' })],
    })
  )

  if (options.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: options.subtitle, size: 26, color: '666666', font: 'Calibri' })],
      })
    )
  }

  // Sections
  for (const section of options.sections) {
    if (section.heading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
          children: [new TextRun({ text: section.heading, bold: true, size: 28, color: '07183f', font: 'Calibri' })],
        })
      )
    }

    if (section.body) {
      for (const line of section.body.split('\n')) {
        children.push(paragraphFromText(line || ' '))
      }
    }

    if (section.items?.length) {
      for (const item of section.items) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [new TextRun({ text: item, size: 22, font: 'Calibri' })],
          })
        )
      }
    }

    if (section.table) {
      children.push(buildTable(section.table.headers, section.table.rows))
      children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
    }
  }

  // Footer disclaimer
  if (options.footer) {
    children.push(
      new Paragraph({
        spacing: { before: 600 },
        border: { top: { style: BorderStyle.SINGLE, size: 1, color: 'dfe7f2' } },
        children: [new TextRun({ text: options.footer, size: 18, color: '999999', font: 'Calibri' })],
      })
    )
  }

  const doc = new Document({
    sections: [{ children }],
    creator: 'Apex AI Copilot',
    description: options.title,
  })

  return Packer.toBlob(doc)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

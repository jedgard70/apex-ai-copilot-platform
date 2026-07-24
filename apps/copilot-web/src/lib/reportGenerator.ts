import { jsPDF } from 'jspdf'

export function exportGenericCsv(headers: string[], data: Record<string, any>[], filename: string): string {
  const csvRows: string[] = []
  
  // Header row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','))
  
  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === undefined || row[header] === null ? '' : String(row[header])
      return `"${val.replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }
  
  const csvString = csvRows.join('\n')
  return csvString
}

export function exportGenericPdf(title: string, headers: string[], data: Record<string, any>[], filename: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const margin = 40
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = margin
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, margin, y)
  y += 20
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Gerado por Apex AI Copilot em ${new Date().toLocaleDateString('pt-BR')}`, margin, y)
  y += 30
  
  // Very simple table rendering using basic text wrap (since jspdf-autotable is not in package.json)
  const colWidth = (pageWidth - margin * 2) / headers.length
  
  // Draw Headers
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y - 12, pageWidth - margin * 2, 20, 'F')
  
  headers.forEach((header, i) => {
    doc.text(header.substring(0, 30), margin + (i * colWidth) + 5, y)
  })
  y += 20
  
  // Draw Data
  doc.setFont('helvetica', 'normal')
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex]
    
    // Page break check
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, y - 12, pageWidth - margin * 2, 20, 'F')
      headers.forEach((header, i) => {
        doc.text(header.substring(0, 30), margin + (i * colWidth) + 5, y)
      })
      y += 20
      doc.setFont('helvetica', 'normal')
    }
    
    // Draw row background for alternate rows
    if (rowIndex % 2 === 1) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, y - 12, pageWidth - margin * 2, 20, 'F')
    }
    
    // Draw cells
    headers.forEach((header, i) => {
      const val = row[header] === undefined || row[header] === null ? '' : String(row[header])
      // truncate text to avoid overflow
      const truncated = val.length > 35 ? val.substring(0, 32) + '...' : val
      doc.text(truncated, margin + (i * colWidth) + 5, y)
    })
    
    y += 20
  }
  
  doc.save(filename)
}

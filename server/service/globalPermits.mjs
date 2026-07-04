/**
 * server/service/globalPermits.mjs
 *
 * Global Permits & Offshore — documentation for project approvals (USA) and Offshore setups (Estonia, Panama, Uruguay).
 */

import { GoogleGenAI } from '@google/genai'

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null

const PROJECTS = new Map()

// Inject a default project so the frontend's hardcoded 'form-global' PDF download works
PROJECTS.set('form-global', {
  id: 'form-global',
  status: 'draft',
  projectName: 'Global Offshore Setup',
  address: '123 Tech Hub Blvd',
  city: 'Global City',
  state: 'Jurisdiction',
  zipCode: '00000',
  buildingType: 'commercial',
  squareFootage: 0,
  floors: 1,
  permitTypes: ['offshore-estonia', 'offshore-panama'],
  hasFloorPlan: false,
  engineerName: 'Apex Legal Officer',
  engineerLicense: 'AL-9999',
  documents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  checklist: null,
  report: null,
})

export const PERMIT_TYPES = [
  { id: 'building-permit', name: 'Building Permit', description: 'Permissão para construção/ reforma (EUA)' },
  { id: 'planning-permission', name: 'Planning Permission', description: 'Aprovação de planejamento urbano (EUA)' },
  { id: 'zoning', name: 'Zoning Compliance', description: 'Conformidade com zoneamento (EUA)' },
  { id: 'fire-marshal', name: 'Fire Marshal Review', description: 'Aprovação do corpo de bombeiros (EUA)' },
  { id: 'ada', name: 'ADA Compliance', description: 'Acessibilidade (EUA)' },
  { id: 'structural', name: 'Structural Review', description: 'Revisão estrutural por engenheiro (EUA)' },
  { id: 'mep', name: 'MEP Permit', description: 'Permissão de sistemas MEP (EUA)' },
  { id: 'occupancy', name: 'Certificate of Occupancy', description: 'Certificado de ocupação (EUA)' },
  { id: 'offshore-estonia', name: 'Offshore e-Residency', description: 'Abertura de empresa e residência na Estônia' },
  { id: 'offshore-panama', name: 'Offshore Foundation/Corp', description: 'Estruturação empresarial e proteção no Panamá' },
  { id: 'offshore-uruguay', name: 'Offshore Free Zone', description: 'Zonas Francas e incentivos tributários no Uruguai' }
]

export function createPermitProject(data) {
  const id = `permit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const project = {
    id, status: 'draft',
    projectName: String(data.projectName || '').trim(),
    address: String(data.address || '').trim(),
    city: String(data.city || '').trim(),
    state: String(data.state || '').trim(),
    zipCode: String(data.zipCode || '').trim(),
    buildingType: data.buildingType || 'residential',
    squareFootage: Number(data.squareFootage) || 0,
    floors: Number(data.floors) || 1,
    permitTypes: Array.isArray(data.permitTypes) ? data.permitTypes : ['building-permit'],
    hasFloorPlan: Boolean(data.hasFloorPlan),
    engineerName: String(data.engineerName || 'Dr. Edgard').trim(),
    engineerLicense: String(data.engineerLicense || '').trim(),
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checklist: null, // To cache generated checklist
    report: null, // To cache generated report
  }
  PROJECTS.set(id, project)
  return project
}

export function getPermitProject(id) { return PROJECTS.get(id) || null }
export function listPermitProjects() {
  return Array.from(PROJECTS.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function generatePermitChecklist(projectId) {
  const p = PROJECTS.get(projectId)
  if (!p) return null
  
  if (p.checklist) return p.checklist

  const isOffshore = p.permitTypes.some(pt => pt.startsWith('offshore-'))
  
  // Use Gemini to generate dynamic checklist if AI is available and it involves offshore
  if (ai && isOffshore) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a legal compliance and setup checklist for a project named "${p.projectName}" in the following jurisdictions/types: ${p.permitTypes.join(', ')}. Return ONLY valid JSON array with objects having: 'permitType' (id), 'permitName', 'description', 'requiredDocs' (array of strings), 'estimatedFee' (number in USD), 'estimatedTimeline' (string), 'status' (set to 'pending').`
      })
      const text = response.text || ''
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
      p.checklist = {
        projectName: p.projectName,
        address: p.address,
        city: p.city,
        state: p.state,
        engineer: p.engineerName,
        license: p.engineerLicense,
        checklist: JSON.parse(cleaned),
        summary: 'Checklist Offshore Dinâmico Gerado via IA (Gemini).',
        generatedAt: new Date().toISOString(),
      }
      return p.checklist
    } catch (err) {
      console.error('LLM checklist generation failed:', err)
    }
  }

  // Fallback / Static logic
  const checklist = p.permitTypes.map(pid => {
    const info = PERMIT_TYPES.find(pt => pt.id === pid) || { id: pid, name: pid, description: '' }
    
    let requiredDocs = []
    if (pid.startsWith('offshore-')) {
      requiredDocs = ['Passaporte Válido', 'Comprovante de Residência Traduzido Juramentado', 'Business Plan', 'KYC Forms']
    } else {
      requiredDocs = [
        'Floor plan (planta baixa)',
        'Site plan (implantação)',
        'Elevations (fachadas)',
        'Sections (cortes)',
        p.buildingType === 'commercial' ? 'Fire protection plan' : null,
        p.floors > 2 ? 'Structural calculations' : null,
        p.squareFootage > 5000 ? 'MEP drawings' : null,
        'Energy compliance certificate',
        'Owner authorization letter',
      ].filter(Boolean)
    }
    
    return {
      permitType: info.id,
      permitName: info.name,
      description: info.description,
      requiredDocs,
      estimatedFee: pid.startsWith('offshore-') ? 2500 : (p.buildingType === 'commercial' ? 500 + p.squareFootage * 0.5 : 200 + p.squareFootage * 0.3),
      estimatedTimeline: pid.startsWith('offshore-') ? '2-6 weeks' : (p.permitTypes.length > 3 ? '8-16 weeks' : '4-8 weeks'),
      status: 'pending',
    }
  })

  p.checklist = {
    projectName: p.projectName,
    address: p.address,
    city: p.city,
    state: p.state,
    engineer: p.engineerName,
    license: p.engineerLicense,
    checklist,
    summary: `Total de ${checklist.length} processos necessários. Estimativa de custo base: $${checklist.reduce((s, c) => s + c.estimatedFee, 0).toFixed(2)}`,
    generatedAt: new Date().toISOString(),
  }

  return p.checklist
}

export async function generatePermitReport(projectId) {
  const p = PROJECTS.get(projectId)
  if (!p) return null

  if (p.report) return p.report

  const isOffshore = p.permitTypes.some(pt => pt.startsWith('offshore-'))
  
  let dynamicHtml = ''
  if (ai && isOffshore) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Draft a concise HTML corporate setup proposal for a client project "${p.projectName}" in the jurisdictions: ${p.permitTypes.join(', ')}. Include an overview of tax benefits, required capital, and timelines based on current laws for these regions. Do not include markdown \`\`\`html tags, just raw HTML.`
      })
      dynamicHtml = response.text?.replace(/```html/g, '').replace(/```/g, '').trim() || ''
    } catch (err) {
      console.error('LLM report generation failed:', err)
    }
  }

  p.report = {
    projectName: p.projectName,
    address: `${p.address}, ${p.city}, ${p.state} ${p.zipCode}`,
    buildingType: p.buildingType,
    squareFootage: p.squareFootage,
    floors: p.floors,
    responsibleEngineer: p.engineerName,
    licenseNumber: p.engineerLicense,
    permitRequirements: p.permitTypes.map(pid => {
      const info = PERMIT_TYPES.find(pt => pt.id === pid)
      return `- ${info?.name || pid}: ${info?.description || ''}`
    }).join('\n'),
    submittedBy: p.engineerName,
    signature: `[ASSINATURA DIGITAL - ${p.engineerName}]`,
    date: new Date().toISOString(),
    formHtml: dynamicHtml || `<form><h2>Permit Application - ${p.projectName}</h2><p><strong>Project:</strong> ${p.projectName}</p><p><strong>Address:</strong> ${p.address}, ${p.city}, ${p.state}</p><p><strong>Engineer:</strong> ${p.engineerName} | License: ${p.engineerLicense}</p><p><strong>Permits Required:</strong></p><ul>${p.permitTypes.map(pid => { const i = PERMIT_TYPES.find(pt => pt.id === pid); return `<li>${i?.name || pid}</li>`; }).join('')}</ul><hr/><p><em>Generated by Apex AI - ${new Date().toLocaleDateString('en-US')}</em></p></form>`,
  }
  return p.report
}

export async function generateRealPDF(projectId) {
  const p = PROJECTS.get(projectId)
  if (!p) throw new Error('Projeto não encontrado')

  // We must import pdf-lib dynamically or at the top
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  page.drawText('APEX GLOBAL PERMIT / OFFSHORE APPLICATION FORM', { x: 50, y: 750, size: 16, font: bold, color: rgb(0, 0, 0.5) })
  page.drawText(`Application ID: ${p.id}`, { x: 50, y: 720, size: 10, font })
  page.drawText(`Date: ${new Date().toISOString().split('T')[0]}`, { x: 400, y: 720, size: 10, font })
  
  page.drawLine({ start: { x: 50, y: 700 }, end: { x: 550, y: 700 }, thickness: 1 })

  // Applicant Info
  page.drawText('1. APPLICANT / PROJECT INFORMATION', { x: 50, y: 670, size: 14, font: bold })
  page.drawText(`Project Name: ${p.projectName}`, { x: 50, y: 640, size: 12, font })
  page.drawText(`Site Address: ${p.address}, ${p.city}, ${p.state} - ${p.zipCode}`, { x: 50, y: 620, size: 12, font })
  page.drawText(`Type: ${p.buildingType.toUpperCase()}`, { x: 50, y: 600, size: 12, font })

  // Engineer Info
  page.drawText('2. RESPONSIBLE OFFICER / ENGINEER', { x: 50, y: 560, size: 14, font: bold })
  page.drawText(`Name: ${p.engineerName}`, { x: 50, y: 530, size: 12, font })
  page.drawText(`License/ID: ${p.engineerLicense}`, { x: 300, y: 530, size: 12, font })

  // Permits Requested
  page.drawText('3. REGISTRATIONS / PERMITS REQUESTED', { x: 50, y: 490, size: 14, font: bold })
  let y = 460
  p.permitTypes.forEach(pid => {
    const info = PERMIT_TYPES.find(pt => pt.id === pid)
    page.drawText(`[ X ] ${info?.name || pid}`, { x: 50, y, size: 12, font })
    y -= 20
  })

  // Signatures
  page.drawLine({ start: { x: 50, y: y - 50 }, end: { x: 300, y: y - 50 }, thickness: 1 })
  page.drawText('Signature of Responsible Officer', { x: 50, y: y - 65, size: 10, font })
  page.drawText(p.engineerName, { x: 70, y: y - 45, size: 14, font: bold, color: rgb(0, 0.2, 0.8) }) // Simulate digital signature

  page.drawText('APEX AI AUTOMATED PROCESSING SYSTEM', { x: 50, y: 50, size: 8, font, color: rgb(0.5, 0.5, 0.5) })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

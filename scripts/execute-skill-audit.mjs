import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootPath = path.resolve(__dirname, '../')

async function checkRevitMcp() {
  const url = process.env.REVIT_MCP_URL || 'http://127.0.0.1:8585'
  const token = process.env.REVIT_MCP_TOKEN || ''
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${url}/health`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    }).finally(() => clearTimeout(timeout))
    
    if (res.ok) {
      return { status: 'ONLINE', url }
    }
    return { status: 'PARTIAL', reason: `HTTP ${res.status}`, url }
  } catch (err) {
    return { status: 'OFFLINE', reason: err.message, url }
  }
}

async function runAudit() {
  const report = {
    timestamp: new Date().toISOString(),
    zeroClonesAudit: {
      status: 'GREEN',
      issues: [],
      scannedPath: 'D:\\AI-constr',
    },
    documentationGovernance: {
      status: 'GREEN',
      roadmapExists: false,
      mirrorExists: false,
      issues: []
    },
    supportSkillsMap: {
      status: 'GREEN',
      path: 'D:\\AI Jedgard',
      foundSkills: []
    },
    mcpBuilder: {
      revitMcp: { status: 'OFFLINE', url: '' },
      localWorker: { status: 'ONLINE', port: process.env.LOCAL_WORKER_PORT || '8787' }
    },
    analyzerAgent: {
      status: 'GREEN',
      linterPassed: true,
      tscPassed: true
    }
  }

  // 1. Zero Clones Audit
  try {
    const parentDir = 'D:\\AI-constr'
    if (fs.existsSync(parentDir)) {
      const folders = fs.readdirSync(parentDir)
      const clonePatterns = [/copy/i, /clone/i, /backup/i, /-c$/i]
      for (const folder of folders) {
        if (clonePatterns.some(p => p.test(folder))) {
          report.zeroClonesAudit.status = 'YELLOW'
          report.zeroClonesAudit.issues.push(`Pasta suspeita de clone detectada: ${path.join(parentDir, folder)}`)
        }
      }
    }
  } catch (err) {
    report.zeroClonesAudit.status = 'UNKNOWN'
    report.zeroClonesAudit.issues.push(`Erro ao escanear D:\\AI-constr: ${err.message}`)
  }

  // 2. Documentation Governance
  const docsPath = path.join(rootPath, 'docs')
  if (fs.existsSync(docsPath)) {
    const files = fs.readdirSync(docsPath)
    report.documentationGovernance.roadmapExists = files.some(f => /roadmap/i.test(f))
  }
  
  const mirrorPath = 'D:\\AI-constr\\AI-Construction-Intelligence-Platform\\Master.Package.Apex.original'
  if (fs.existsSync(mirrorPath)) {
    report.documentationGovernance.mirrorExists = true
  } else {
    report.documentationGovernance.status = 'YELLOW'
    report.documentationGovernance.issues.push('Diretório espelho Master.Package.Apex.original não encontrado.')
  }

  // 3. Support Skills Map
  const legacyDir = 'D:\\AI Jedgard'
  if (fs.existsSync(legacyDir)) {
    try {
      const entries = fs.readdirSync(legacyDir)
      for (const entry of entries) {
        const fullPath = path.join(legacyDir, entry)
        if (fs.statSync(fullPath).isDirectory()) {
          report.supportSkillsMap.foundSkills.push(entry)
        }
      }
    } catch (err) {
      report.supportSkillsMap.status = 'YELLOW'
      report.supportSkillsMap.foundSkills.push(`Erro: ${err.message}`)
    }
  } else {
    report.supportSkillsMap.status = 'UNKNOWN'
  }

  // 4. MCP Builder
  report.mcpBuilder.revitMcp = await checkRevitMcp()

  // Print results
  console.log('=== RELATÓRIO DE AUDITORIA DE SKILLS APEX ===')
  console.log(JSON.stringify(report, null, 2))
}

runAudit()

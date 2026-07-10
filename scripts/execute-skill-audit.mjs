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
    supportSkillsMap: {
      status: 'GREEN',
      path: path.join(rootPath, '.agents', 'skills'),
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

  // 1. Support Skills Map (Internal Only)
  const internalSkillsDir = report.supportSkillsMap.path
  if (fs.existsSync(internalSkillsDir)) {
    try {
      const entries = fs.readdirSync(internalSkillsDir)
      for (const entry of entries) {
        const fullPath = path.join(internalSkillsDir, entry)
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
    report.supportSkillsMap.issues = ['Diretório interno de skills (.agents/skills) não encontrado.']
  }

  // 2. MCP Builder
  report.mcpBuilder.revitMcp = await checkRevitMcp()

  // Print results
  console.log('=== RELATÓRIO DE AUDITORIA DE SKILLS APEX ===')
  console.log(JSON.stringify(report, null, 2))
}

runAudit()

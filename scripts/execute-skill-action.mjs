import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootPath = path.resolve(__dirname, '../')

const action = process.argv[2]
const param1 = process.argv[3] || ''
const param2 = process.argv[4] || ''
const docsEdgardSkillRoot = 'D:\\AI Jedgard\\skill'
const docsEdgardManifestPath = path.join(rootPath, 'skill', 'DOCSEDGARD_SKILL_REINTEGRADA.md')
const docsEdgardExtensions = new Set(['.md', '.pdf', '.txt', '.py'])

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) return true
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}

async function handleRevitGenerate(scriptName) {
  if (!scriptName) {
    console.error('Erro: nome do script não fornecido.')
    process.exit(1)
  }
  const targetDir = path.join(rootPath, 'dist', 'revit-boilerplates', `${scriptName}.pushbutton`)
  const scriptPath = path.join(targetDir, 'script.py')
  const configPath = path.join(targetDir, 'config.json')

  ensureDirectoryExistence(scriptPath)

  const pyRevitContent = `"""
${scriptName} - pyRevit Extension
Gerado automaticamente pela Apex AI Copilot.
"""
from Autodesk.Revit.DB import *
from Autodesk.Revit.UI import *

doc = __revit__.ActiveUIDocument.Document
uidoc = __revit__.ActiveUIDocument

print("Iniciando execução do script pyRevit: ${scriptName}")
# Adicione sua lógica de automação BIM aqui
`
  fs.writeFileSync(scriptPath, pyRevitContent, 'utf8')
  fs.writeFileSync(configPath, JSON.stringify({ version: '1.0.0', author: 'Apex AI' }, null, 2), 'utf8')

  console.log(`=== REVIT GENERATE SUCCESS ===`)
  console.log(`Criado pushbutton pyRevit em: ${targetDir}`)
  console.log(`Script principal: ${scriptPath}`)
}

async function handleMarketingGenerate(campaignType) {
  if (!campaignType) {
    console.error('Erro: tipo de campanha não fornecido.')
    process.exit(1)
  }
  const targetDir = 'D:\\AI-constr\\EBOOK_APEX_HOTMART\\campaigns'
  const planPath = path.join(targetDir, `${campaignType}_plan.md`)

  try {
    ensureDirectoryExistence(planPath)
  } catch {
    // Fallback to local dist if D: drive is not writable or doesn't exist
    const localFallback = path.join(rootPath, 'dist', 'ebook-campaigns', `${campaignType}_plan.md`)
    ensureDirectoryExistence(localFallback)
    fs.writeFileSync(localFallback, `# Campanha: ${campaignType}\n\nLançamento do Ebook Apex Global.\n`, 'utf8')
    console.log(`=== MARKETING GENERATE FALLBACK ===`)
    console.log(`Criado plano local em: ${localFallback}`)
    return
  }

  const campaignContent = `# Campanha de Marketing: ${campaignType}
Gerado pela Apex AI Copilot.

## Checklist de Campanha:
- [ ] Definir a persona principal (Engenheiro BIM, Construtor, Orçamentista)
- [ ] Criar 3 variações de Headlines de Copy para Instagram
- [ ] Produzir roteiro de vídeo de 30 segundos com CTA para a Hotmart
- [ ] Monitorar cliques no link da Bio

## Modelo de Copy de Vendas (Ebook):
"Transforme a gestão de projetos de engenharia com a inteligência Apex. Acesse agora e saia na frente."
`
  fs.writeFileSync(planPath, campaignContent, 'utf8')

  console.log(`=== MARKETING GENERATE SUCCESS ===`)
  console.log(`Criado plano de campanha em: ${planPath}`)
}

async function handleLegacyImport(scriptName) {
  if (!scriptName) {
    console.error('Erro: nome do script legado não fornecido.')
    process.exit(1)
  }
  const sourceDir = path.join('D:\\AI Jedgard', scriptName)
  const targetDir = path.join(rootPath, 'skills', 'imported', scriptName)

  if (!fs.existsSync(sourceDir)) {
    console.log(`=== LEGACY IMPORT FAILED ===`)
    console.log(`Diretório de origem não encontrado em: ${sourceDir}`)
    console.log(`Dica: Verifique se a pasta existe no caminho indicado.`)
    return
  }

  ensureDirectoryExistence(path.join(targetDir, 'SKILL.md'))

  // Copy files
  const files = fs.readdirSync(sourceDir)
  for (const file of files) {
    const src = path.join(sourceDir, file)
    const dest = path.join(targetDir, file)
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest)
    }
  }

  console.log(`=== LEGACY IMPORT SUCCESS ===`)
  console.log(`Importado com sucesso de ${sourceDir} para ${targetDir}`)
}

async function handleMcpGenerate(serverName) {
  if (!serverName) {
    console.error('Erro: nome do servidor MCP não fornecido.')
    process.exit(1)
  }
  const targetDir = path.join(rootPath, 'local-worker', 'mcp-servers', serverName)
  const indexJs = path.join(targetDir, 'index.js')
  const pkgJson = path.join(targetDir, 'package.json')

  ensureDirectoryExistence(indexJs)

  const pkgContent = {
    name: `mcp-server-${serverName}`,
    version: '1.0.0',
    description: 'Servidor Model Context Protocol (MCP) autogerado',
    main: 'index.js',
    type: 'module',
    dependencies: {
      '@modelcontextprotocol/sdk': '^0.6.0'
    }
  }

  const jsContent = `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "mcp-server-${serverName}",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP Server ${serverName} rodando no stdio.");
`

  fs.writeFileSync(pkgJson, JSON.stringify(pkgContent, null, 2), 'utf8')
  fs.writeFileSync(indexJs, jsContent, 'utf8')

  console.log(`=== MCP GENERATE SUCCESS ===`)
  console.log(`Servidor MCP criado em: ${targetDir}`)
}

async function handleCodeAnalyze() {
  const srcDir = path.join(rootPath, 'server')
  const results = {
    totalFiles: 0,
    largeFiles: [],
    todoCount: 0
  }

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir)
    for (const entry of entries) {
      const fullPath = path.join(dir, entry)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        scanDir(fullPath)
      } else if (stat.isFile() && /\.(mjs|js|ts)$/.test(entry)) {
        results.totalFiles++
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')
        if (lines.length > 500) {
          results.largeFiles.push({ file: path.relative(rootPath, fullPath), lines: lines.length })
        }
        const todos = content.match(/\bTODO\b/gi)
        if (todos) results.todoCount += todos.length
      }
    }
  }

  scanDir(srcDir)

  console.log(`=== CODE ANALYZE SUCCESS ===`)
  console.log(JSON.stringify(results, null, 2))
}

function listDocsedgardFiles(rootDir) {
  const entries = []
  if (!fs.existsSync(rootDir)) return entries
  const stack = ['']
  while (stack.length) {
    const relDir = stack.pop()
    const absDir = path.join(rootDir, relDir)
    for (const item of fs.readdirSync(absDir, { withFileTypes: true })) {
      const relPath = relDir ? path.join(relDir, item.name) : item.name
      const absPath = path.join(rootDir, relPath)
      if (item.isDirectory()) {
        stack.push(relPath)
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase()
        if (docsEdgardExtensions.has(ext)) {
          entries.push({ relPath, absPath, ext })
        }
      }
    }
  }
  return entries.sort((a, b) => a.relPath.localeCompare(b.relPath))
}

function buildDocsedgardManifestMarkdown(files) {
  const groups = { '.md': [], '.pdf': [], '.txt': [], '.py': [] }
  for (const file of files) groups[file.ext].push(file.relPath)
  const lines = [
    '# DOCSEDGARD Skill Reintegrada',
    '',
    `Data de geração: ${new Date().toISOString()}`,
    `Fonte: \`${docsEdgardSkillRoot}\``,
    '',
    '## Objetivo',
    'Unificar os artefatos detectados na pasta original docsedgard/skill para reintegração operacional no repositório Apex.',
    '',
    '## Totais por extensão',
    `- \`.md\`: ${groups['.md'].length}`,
    `- \`.pdf\`: ${groups['.pdf'].length}`,
    `- \`.txt\`: ${groups['.txt'].length}`,
    `- \`.py\`: ${groups['.py'].length}`,
    '',
    '## Inventário completo',
    `Caminhos relativos à raiz \`${docsEdgardSkillRoot}\`:`,
    '',
  ]
  for (const ext of ['.md', '.pdf', '.txt', '.py']) {
    lines.push(`### ${ext}`)
    if (!groups[ext].length) {
      lines.push('- _(nenhum arquivo)_')
    } else {
      for (const relPath of groups[ext]) lines.push(`- \`${relPath.replace(/\\/g, '\\\\')}\``)
    }
    lines.push('')
  }
  return lines.join('\n')
}

function parseDocsedgardAction(raw) {
  const value = String(raw || '').trim()
  if (!value || value === 'summary') return { mode: 'summary', term: '' }
  if (value === 'sync-manifest') return { mode: 'sync-manifest', term: '' }
  if (value.startsWith('search:')) return { mode: 'search', term: value.slice('search:'.length).trim() }
  return { mode: 'search', term: value.trim() }
}

async function handleDocsedgardSkill(rawInstruction) {
  if (!fs.existsSync(docsEdgardSkillRoot)) {
    console.log('=== DOCSEDGARD SKILL FAILED ===')
    console.log(`Pasta de origem não encontrada: ${docsEdgardSkillRoot}`)
    process.exit(1)
  }

  const files = listDocsedgardFiles(docsEdgardSkillRoot)
  const grouped = {
    md: files.filter(item => item.ext === '.md').length,
    pdf: files.filter(item => item.ext === '.pdf').length,
    txt: files.filter(item => item.ext === '.txt').length,
    py: files.filter(item => item.ext === '.py').length,
  }
  const instruction = parseDocsedgardAction(rawInstruction)

  if (instruction.mode === 'sync-manifest') {
    ensureDirectoryExistence(docsEdgardManifestPath)
    const manifest = buildDocsedgardManifestMarkdown(files)
    fs.writeFileSync(docsEdgardManifestPath, manifest, 'utf8')
    console.log('=== DOCSEDGARD SKILL SYNC SUCCESS ===')
    console.log(`Manifesto atualizado em: ${docsEdgardManifestPath}`)
    console.log(JSON.stringify({ total: files.length, ...grouped }, null, 2))
    return
  }

  if (instruction.mode === 'search') {
    const term = instruction.term.toLowerCase()
    if (!term) {
      console.log('=== DOCSEDGARD SKILL SEARCH FAILED ===')
      console.log('Use: search:<termo> ou forneça um termo direto.')
      process.exit(1)
    }
    const matches = files.filter(item => item.relPath.toLowerCase().includes(term))
    console.log('=== DOCSEDGARD SKILL SEARCH SUCCESS ===')
    console.log(`Termo: ${instruction.term}`)
    console.log(`Matches: ${matches.length}`)
    const preview = matches.slice(0, 200).map(item => item.relPath)
    for (const relPath of preview) console.log(`- ${relPath}`)
    if (matches.length > preview.length) {
      console.log(`... ${matches.length - preview.length} resultados adicionais omitidos.`)
    }
    return
  }

  const topFolders = new Map()
  for (const file of files) {
    const firstPart = file.relPath.split(path.sep)[0] || '.'
    topFolders.set(firstPart, (topFolders.get(firstPart) || 0) + 1)
  }
  const topFolderRows = [...topFolders.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([folder, count]) => ({ folder, count }))
  console.log('=== DOCSEDGARD SKILL SUMMARY SUCCESS ===')
  console.log(JSON.stringify({
    source: docsEdgardSkillRoot,
    manifest: docsEdgardManifestPath,
    total: files.length,
    ...grouped,
    actions: ['summary', 'search:<termo>', 'sync-manifest'],
    topFolders: topFolderRows,
  }, null, 2))
}

async function run() {
  switch (action) {
    case 'revit-generate':
      await handleRevitGenerate(param1)
      break
    case 'marketing-generate':
      await handleMarketingGenerate(param1)
      break
    case 'legacy-import':
      await handleLegacyImport(param1)
      break
    case 'mcp-generate':
      await handleMcpGenerate(param1)
      break
    case 'code-analyze':
      await handleCodeAnalyze()
      break
    case 'docsedgard-skill':
      await handleDocsedgardSkill(param1)
      break
    default:
      console.error(`Erro: ação desconhecida "${action}"`)
      process.exit(1)
  }
}

run()

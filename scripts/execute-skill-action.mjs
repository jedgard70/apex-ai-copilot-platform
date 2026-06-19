import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootPath = path.resolve(__dirname, '../')

const action = process.argv[2]
const param1 = process.argv[3] || ''
const param2 = process.argv[4] || ''

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
    default:
      console.error(`Erro: ação desconhecida "${action}"`)
      process.exit(1)
  }
}

run()

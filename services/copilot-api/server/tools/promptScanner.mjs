import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CATALOG_FILE = path.join(__dirname, '..', 'data', 'prompts_catalog.json')

const TARGET_DIRECTORIES = [
  'D:\\apex-marketing-squads\\.agents\\skills',
  'd:\\APEX AI\\skills',
  'C:\\Users\\apexg\\.gemini\\config\\skills'
]

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function walkDirectory(dir, fileList = []) {
  try {
    const files = await fs.readdir(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = await fs.stat(filePath)
      
      if (stat.isDirectory()) {
        await walkDirectory(filePath, fileList)
      } else if (file.toLowerCase() === 'skill.md' || file.toLowerCase().endsWith('.prompt')) {
        fileList.push(filePath)
      }
    }
  } catch (error) {
    console.warn(`[PromptScanner] Erro ao ler pasta ${dir}: ${error.message}`)
  }
  return fileList
}

function parseFrontmatter(content) {
  let name = 'Desconhecido'
  let description = 'Nenhuma descrição fornecida.'
  
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (yamlMatch) {
    const yamlData = yamlMatch[1]
    const nameMatch = yamlData.match(/name:\s*(.+)/i)
    const descMatch = yamlData.match(/description:\s*(.+)/i)
    if (nameMatch) name = nameMatch[1].trim()
    if (descMatch) description = descMatch[1].trim()
  } else {
    // Tenta pegar o primeiro H1
    const h1Match = content.match(/^#\s+(.+)/m)
    if (h1Match) name = h1Match[1].trim()
  }
  
  // Clean quotes
  name = name.replace(/^["']|["']$/g, '')
  description = description.replace(/^["']|["']$/g, '')
  
  return { name, description }
}

const CATEGORY_HEURISTICS = {
  '🎨 Imagem & Arte Visuais': ['midjourney', 'stable diffusion', 'dall-e', 'photorealistic', 'logo', 'design gráfico', 'ilustração', 'vetor', 'prompt de imagem', 'sdxl', 'flux', 'ideogram'],
  '🎬 Vídeo & Motion': ['runway', 'sora', 'kling', 'framerate', 'animation', 'after effects', 'edição de vídeo', 'premiere', 'roteiro de vídeo', 'youtube', 'tiktok', 'reels', 'higgsfield', 'motion graphics'],
  '✨ Efeitos Visuais (VFX)': ['vfx', 'particle', 'transition', 'chroma key', 'cgi', 'efeitos especiais'],
  '⚖️ Jurídico & Direito': ['petição', 'contrato', 'lei', 'stf', 'recurso', 'advogado', 'jurisprudência', 'código civil', 'código penal', 'tribunal', 'legal', 'processo'],
  '📊 Contabilidade & Finanças': ['balanço', 'dre', 'imposto', 'fiscal', 'contábil', 'tributário', 'fluxo de caixa', 'investimento', 'planilha financeira', 'auditoria', 'imposto de renda'],
  '🏗️ Arquitetura & Urbanismo': ['planta baixa', 'bim', 'revit', 'fachada', 'interiores', 'urbanismo', 'autocad', 'sketchup', 'renderização 3d', 'maquete', 'archvis', 'humanização'],
  '⚙️ Engenharia': ['cálculo estrutural', 'fundação', 'engenharia civil', 'elétrica', 'hidráulica', 'orçamento de obra', 'sinapi', 'cronograma de obra'],
  '📢 Marketing & Copywriting': ['copy', 'funil', 'lead', 'anúncios', 'seo', 'facebook ads', 'google ads', 'landing page', 'email marketing', 'copywriting', 'blog post', 'cta', 'marketing'],
  '💼 Vendas & CRM': ['script de vendas', 'cold call', 'b2b', 'crm', 'fechamento', 'prospecção', 'outreach', 'linkedin outreach'],
  '💻 Código & Desenvolvimento': ['python', 'react', 'typescript', 'api', 'javascript', 'html', 'css', 'backend', 'frontend', 'github', 'sql', 'banco de dados', 'código', 'debug', 'git'],
  '🔬 Ciência & Saúde': ['artigo científico', 'medicina', 'saúde', 'pesquisa', 'clínico', 'biologia', 'química', 'genética', 'alphafold', 'uniprot', 'pubmed'],
  '👥 RH & Recrutamento': ['entrevista', 'vaga', 'rh', 'recursos humanos', 'onboarding', 'feedback', 'cultura', 'currículo'],
  '🏢 Gestão & Negócios': ['business plan', 'okr', 'kpi', 'reunião', 'gestão de projetos', 'scrum', 'agile', 'estratégia', 'swot'],
  '✍️ Escrita Criativa & Textos': ['romance', 'poesia', 'livro', 'ficção', 'artigo', 'resumo', 'tradução', 'gramática', 'redação'],
  '🎵 Música & Áudio': ['música', 'letra', 'composição', 'áudio', 'podcast', 'elevenlabs', 'tts', 'locução', 'suno'],
  '🏡 Mercado Imobiliário': ['corretor', 'imóveis', 'imobiliária', 'venda de imóveis', 'descrição de imóvel'],
  '🎮 Games & Criação': ['game design', 'unity', 'unreal', 'gdd', 'personagem', 'rpg', 'lore']
}

function determineCategory(filePath, content) {
  const text = (filePath + ' ' + content).toLowerCase()
  
  let bestCategory = 'Geral'
  let highestScore = 0
  
  for (const [category, keywords] of Object.entries(CATEGORY_HEURISTICS)) {
    let score = 0
    for (const kw of keywords) {
      // Conta quantas vezes a palavra aparece
      const regex = new RegExp(kw.toLowerCase(), 'g')
      const matches = text.match(regex)
      if (matches) {
        score += matches.length
      }
    }
    
    if (score > highestScore) {
      highestScore = score
      bestCategory = category
    }
  }
  
  // Se o score for muito baixo (menos de 2 matches), cai no Geral
  if (highestScore < 2) {
    return 'Geral'
  }
  
  return bestCategory
}

export async function buildCatalog() {
  console.log('[PromptScanner] Iniciando varredura massiva de Prompts e Skills...')
  const startTime = Date.now()
  
  const allFiles = []
  for (const dir of TARGET_DIRECTORIES) {
    if (await fileExists(dir)) {
      await walkDirectory(dir, allFiles)
    }
  }
  
  console.log(`[PromptScanner] Encontrados ${allFiles.length} arquivos potenciais. Parseando...`)
  
  const catalog = []
  
  for (const filePath of allFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const { name, description } = parseFrontmatter(content)
      const category = determineCategory(filePath, content)
      
      // Gera ID único
      const id = Buffer.from(filePath).toString('base64').substring(0, 20)
      
      catalog.push({
        id,
        name,
        description,
        category,
        path: filePath,
        type: filePath.toLowerCase().endsWith('skill.md') ? 'Skill Agent' : 'Prompt'
      })
    } catch (e) {
      console.warn(`[PromptScanner] Erro ao parsear ${filePath}: ${e.message}`)
    }
  }
  
  const finalData = {
    lastUpdated: new Date().toISOString(),
    totalCount: catalog.length,
    prompts: catalog
  }
  
  await fs.writeFile(CATALOG_FILE, JSON.stringify(finalData, null, 2), 'utf-8')
  const duration = (Date.now() - startTime) / 1000
  console.log(`[PromptScanner] Varredura concluída! ${catalog.length} itens indexados em ${duration}s. Salvo em data/prompts_catalog.json`)
  
  return finalData
}

export async function getCatalog() {
  try {
    if (await fileExists(CATALOG_FILE)) {
      const data = await fs.readFile(CATALOG_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('[PromptScanner] Erro ao ler catálogo existente:', e)
  }
  
  // Se não existir, constrói
  return await buildCatalog()
}

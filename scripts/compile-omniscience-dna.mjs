import fs from 'fs/promises'
import path from 'path'
import { pipeline } from '@huggingface/transformers'

const TARGET_DIRS = [
  '.agents/skills',
  '.agents/agents',
  'docs'
]

const DB_PATH = path.join(process.cwd(), 'runtime', 'omniscience.db.json')

async function getAllMarkdownFiles(dir) {
  let results = []
  try {
    const list = await fs.readdir(dir, { withFileTypes: true })
    for (const file of list) {
      const fullPath = path.join(dir, file.name)
      if (file.isDirectory()) {
        results = results.concat(await getAllMarkdownFiles(fullPath))
      } else if (fullPath.endsWith('.md') || fullPath.endsWith('.json')) {
        results.push(fullPath)
      }
    }
  } catch (err) {
    console.warn(`[WARN] Não foi possível ler o diretório: ${dir}`)
  }
  return results
}

function chunkText(text, maxChars = 800) {
  const chunks = []
  let current = ''
  const sentences = text.split(/(?<=[.?!])\s+/)
  
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars) {
      if (current.trim()) chunks.push(current.trim())
      current = sentence + ' '
    } else {
      current += sentence + ' '
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

async function compileDNA() {
  console.log('Iniciando compilação do DNA da Plataforma...')
  console.log('Carregando modelo de embeddings local (Xenova/all-MiniLM-L6-v2)...')
  
  // Usamos um pipeline leve e local
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  
  let allFiles = []
  for (const dir of TARGET_DIRS) {
    const files = await getAllMarkdownFiles(path.join(process.cwd(), dir))
    allFiles = allFiles.concat(files)
  }

  const database = []
  
  let processedFiles = 0
  for (const file of allFiles) {
    // Pula arquivos de regras que possam limitar a IA
    if (file.includes('AGENTS.md') || file.includes('CHECKPOINT_TRACKER.md')) {
      continue
    }

    const content = await fs.readFile(file, 'utf8')
    const chunks = chunkText(content)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (chunk.length < 50) continue // Ignora chunks muito curtos
      
      const output = await embedder(chunk, { pooling: 'mean', normalize: true })
      const vector = Array.from(output.data)
      
      database.push({
        id: `${file}-chunk-${i}`,
        source: file.replace(process.cwd(), ''),
        content: chunk,
        vector: vector
      })
    }
    processedFiles++
    if (processedFiles % 10 === 0) {
      console.log(`Processados ${processedFiles} de ${allFiles.length} arquivos...`)
    }
  }

  // Garante que o diretório runtime existe
  await fs.mkdir(path.join(process.cwd(), 'runtime'), { recursive: true })
  
  await fs.writeFile(DB_PATH, JSON.stringify(database), 'utf8')
  console.log(`DNA compilado com sucesso! ${database.length} fragmentos de conhecimento gerados em ${DB_PATH}`)
}

compileDNA().catch(console.error)

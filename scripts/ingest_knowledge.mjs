import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const CURSOS_DIR = 'F:\\Cursos'

async function findPdfs(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    console.warn(`Diretório não encontrado: ${dir}`)
    return fileList
  }
  
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file))
    if (stat.isDirectory()) {
      findPdfs(path.join(dir, file), fileList)
    } else if (file.toLowerCase().endsWith('.pdf') || file.toLowerCase().endsWith('.txt') || file.toLowerCase().endsWith('.csv')) {
      fileList.push(path.join(dir, file))
    }
  }
  return fileList
}

async function run() {
  console.log(`🔍 Procurando materiais na base de conhecimento: ${CURSOS_DIR}`)
  const files = await findPdfs(CURSOS_DIR)
  
  console.log(`Encontrados ${files.length} arquivos.`)
  
  // Para demonstração, vamos listar os arquivos e fazer o upload do primeiro lote
  for (let i = 0; i < Math.min(files.length, 5); i++) { // Limitando a 5 no teste inicial
    const filePath = files[i]
    console.log(`\n📤 Uploading: ${path.basename(filePath)}...`)
    try {
      const uploadResult = await ai.files.upload({
        file: filePath,
        mimeType: filePath.endsWith('.pdf') ? 'application/pdf' : 'text/plain',
        name: path.basename(filePath).replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().substring(0, 40)
      })
      console.log(`✅ Upload completo! URI: ${uploadResult.uri}`)
      
      // Checar o estado
      let fileData = await ai.files.get({ name: uploadResult.name })
      while (fileData.state === 'PROCESSING') {
        console.log('Processando arquivo no Google Cloud...')
        await new Promise(r => setTimeout(r, 2000))
        fileData = await ai.files.get({ name: uploadResult.name })
      }
      
      if (fileData.state === 'FAILED') {
        console.error(`❌ Falha no processamento: ${filePath}`)
      } else {
        console.log(`✅ Arquivo pronto para o RAG! State: ${fileData.state}`)
      }
    } catch (err) {
      console.error(`Erro ao subir ${path.basename(filePath)}:`, err.message)
    }
  }
  
  console.log('\n🚀 Ingestão inicial RAG concluída.')
}

run().catch(console.error)

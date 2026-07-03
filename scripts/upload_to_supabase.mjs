import { createClient } from '@supabase/supabase-js'
import { readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import dotenv from 'dotenv'

// Configura o .env baseado na raiz do projeto
const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
dotenv.config({ path: join(rootDir, '.env') })
dotenv.config({ path: join(rootDir, '.env.local') })

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurado no .env')
  process.exit(1)
}

const supabase = createClient(url, key)

async function subirParaNuvem(filePath) {
  const caminhoCompleto = resolve(rootDir, filePath)
  
  console.log(`☁️ Iniciando upload de ${filePath} para a nuvem...`)

  try {
    const stat = statSync(caminhoCompleto)
    if (!stat.isFile()) throw new Error('Não é um arquivo válido.')

    const arquivoBuffer = readFileSync(caminhoCompleto)
    const nomeBase = filePath.split('/').pop().split('\\').pop()
    const nomeUnico = `projeto_${Date.now()}_${nomeBase}`

    let contentType = 'application/octet-stream'
    if (nomeBase.endsWith('.glb')) contentType = 'model/gltf-binary'
    if (nomeBase.endsWith('.gltf')) contentType = 'model/gltf+json'

    const { data, error } = await supabase.storage
      .from('projetos-3d')
      .upload(nomeUnico, arquivoBuffer, {
        contentType,
        upsert: false
      })

    if (error) {
      if (error.message.includes('Bucket not found')) {
         console.error('❌ Erro: O bucket "projetos-3d" não existe no Supabase. Crie-o como Public.')
         process.exit(1)
      }
      throw error
    }

    const { data: publicData } = supabase.storage
      .from('projetos-3d')
      .getPublicUrl(nomeUnico)

    console.log(`✅ Upload concluído! Link: ${publicData.publicUrl}`)
    return publicData.publicUrl

  } catch (erro) {
    console.error("❌ Falha no upload:", erro.message)
    process.exit(1)
  }
}

const args = process.argv.slice(2)
if (args.length < 1) {
  console.error("Uso: node upload_to_supabase.mjs <caminho_do_arquivo>")
  process.exit(1)
}

subirParaNuvem(args[0])

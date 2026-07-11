import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERRO] VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não configurados.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parser simples de frontmatter YAML para os arquivos SKILL.md
function parseFrontmatter(content) {
  let metadata = {}
  let body = content
  
  if (content.startsWith('---')) {
    const endMatch = content.indexOf('---', 3)
    if (endMatch !== -1) {
      const fmText = content.slice(3, endMatch).trim()
      body = content.slice(endMatch + 3).trim()
      
      fmText.split('\n').forEach(line => {
        const colonIdx = line.indexOf(':')
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim()
          let val = line.slice(colonIdx + 1).trim()
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
          metadata[key] = val
        }
      })
    }
  }
  return { metadata, body }
}

async function syncSkills() {
  const root = path.join(process.cwd(), '.agents', 'skills')
  if (!fs.existsSync(root)) {
    console.error(`[ERRO] Diretório de skills não encontrado: ${root}`)
    process.exit(1)
  }

  const dirs = fs.readdirSync(root)
  console.log(`[SYNC] Iniciando sincronização de ${dirs.length} potenciais skills para o Supabase...`)

  let successCount = 0
  let errorCount = 0

  for (const dirName of dirs) {
    const skillDir = path.join(root, dirName)
    if (!fs.statSync(skillDir).isDirectory()) continue

    const mdPath = path.join(skillDir, 'SKILL.md')
    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, 'utf8')
      const { metadata, body } = parseFrontmatter(content)
      
      const title = metadata.title || metadata.name || dirName
      const description = metadata.description || ''
      const tags = metadata.tags ? metadata.tags.split(',').map(s => s.trim()) : [dirName]
      
      console.log(`[SYNC] Sincronizando: ${title}`)
      
      // Busca para ver se já existe pelo título
      const { data: existing, error: selectError } = await supabase
        .from('knowledge_items')
        .select('id')
        .eq('title', title)
        .maybeSingle()
        
      if (selectError && selectError.code !== 'PGRST116') {
        console.error(`  -> Erro ao verificar skill '${title}':`, selectError.message)
        errorCount++
        continue
      }
        
      const payload = {
        title,
        content: `Description: ${description}\n\n${body}`,
        tags,
        metadata: metadata,
        source_type: 'agent_skill',
        scope: 'global'
      }
      
      if (existing) {
        const { error } = await supabase
          .from('knowledge_items')
          .update(payload)
          .eq('id', existing.id)
        
        if (error) {
          console.error(`  -> Erro ao atualizar '${title}':`, error.message)
          errorCount++
        } else {
          successCount++
        }
      } else {
        const { error } = await supabase
          .from('knowledge_items')
          .insert(payload)
          
        if (error) {
          console.error(`  -> Erro ao inserir '${title}':`, error.message)
          errorCount++
        } else {
          successCount++
        }
      }
    }
  }
  console.log(`\n[SYNC COMPLETO] Skills atualizadas: ${successCount} | Erros: ${errorCount}`)
}

syncSkills().catch(err => {
  console.error('[ERRO FATAL]', err)
  process.exit(1)
})

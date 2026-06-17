import fs from 'node:fs'
import path from 'node:path'

loadEnvLocal()

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN
const projectRef = process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF

console.log('═══════════════════════════════════════════════════════════════')
console.log('SUPABASE LIVE DATABASE VALIDATION')
console.log('═══════════════════════════════════════════════════════════════')

if (!accessToken || !projectRef) {
  console.error('[SUPABASE ERROR] SUPABASE_ACCESS_TOKEN ou SUPABASE_PROJECT_REF ausente no ambiente.')
  console.log('Por favor, configure as variáveis SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF no .env.local.')
  process.exit(1)
}

try {
  const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`
  console.log(`Conectando na base Supabase [Ref: ${projectRef}] via Management API...`)

  // Query to select all user-defined public tables
  const sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error(`[SUPABASE ERROR] Supabase API retornou HTTP ${response.status}: ${data?.message || data?.error || 'erro desconhecido'}`)
    process.exit(1)
  }

  // Supabase returns rows in array format or error
  if (Array.isArray(data)) {
    console.log(`Conexão estabelecida com sucesso!`)
    console.log(`Tabelas públicas encontradas na base de dados (${data.length}):`)
    data.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name || JSON.stringify(row)}`)
    })
    console.log('\n[SUPABASE STATUS] Integração de banco/migration está 100% ATIVA.')
    process.exit(0)
  } else {
    console.error('[SUPABASE ERROR] Resposta inesperada da API:', data)
    process.exit(1)
  }
} catch (err) {
  console.error(`[SUPABASE ERROR] Falha ao conectar na Supabase API: ${err.message}`)
  process.exit(1)
}

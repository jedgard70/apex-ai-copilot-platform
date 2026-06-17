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

const token = process.env.VERCEL_TOKEN
const projectId = process.env.APEX_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID
const teamId = process.env.VERCEL_TEAM_ID

console.log('═══════════════════════════════════════════════════════════════')
console.log('TRIGGER VERCEL LIVE PREVIEW DEPLOYMENT')
console.log('═══════════════════════════════════════════════════════════════')

if (!token || !projectId) {
  console.error('[VERCEL ERROR] VERCEL_TOKEN ou APEX_VERCEL_PROJECT_ID ausente no ambiente.')
  process.exit(1)
}

try {
  const url = `https://api.vercel.com/v13/deployments${teamId ? `?teamId=${encodeURIComponent(teamId)}` : ''}`
  console.log(`Disparando deploy de Preview na Vercel para o projeto: ${projectId}...`)

  const body = {
    name: projectId,
    target: 'preview',
    source: 'api',
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error(`[VERCEL ERROR] Vercel API retornou HTTP ${response.status}: ${data?.error?.message || 'erro desconhecido'}`)
    process.exit(1)
  }

  console.log('🚀 Deployment criado com sucesso na Vercel!')
  console.log(`- ID: ${data.id}`)
  console.log(`- Target: PREVIEW`)
  console.log(`- Estado Inicial: ${data.readyState || 'QUEUED'}`)
  console.log(`- URL do Deploy: https://${data.url}`)
  console.log(`- URL do Inspetor/Logs: ${data.inspectorUrl || 'Indisponível no momento'}`)
  console.log('\n[VERCEL STATUS] Deploy disparado e sendo compilado em segundo plano.')
  process.exit(0)
} catch (err) {
  console.error(`[VERCEL ERROR] Falha ao disparar deploy: ${err.message}`)
  process.exit(1)
}

import { config } from 'dotenv'
import path from 'node:path'

// Load environment variables from .env.local if present
config({ path: path.join(process.cwd(), '.env.local') })

const token = process.env.VERCEL_TOKEN
const projectId = process.env.APEX_VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_ID
const teamId = process.env.VERCEL_TEAM_ID

console.log('═══════════════════════════════════════════════════════════════')
console.log('VERCEL LIVE STAGING/PRODUCTION VALIDATION')
console.log('═══════════════════════════════════════════════════════════════')

if (!token || !projectId) {
  console.error('[VERCEL ERROR] VERCEL_TOKEN ou APEX_VERCEL_PROJECT_ID ausente no ambiente.')
  console.log('Por favor, configure as chaves VERCEL_TOKEN e VERCEL_PROJECT_ID no seu painel ou .env.local.')
  process.exit(1)
}

try {
  const url = `https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=5${teamId ? `&teamId=${encodeURIComponent(teamId)}` : ''}`
  console.log(`Buscando últimos deployments para o projeto: ${projectId}...`)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error(`[VERCEL ERROR] Vercel API retornou HTTP ${response.status}: ${data?.error?.message || 'erro desconhecido'}`)
    process.exit(1)
  }

  const deployments = data.deployments || []
  if (!deployments.length) {
    console.log('[VERCEL STATUS] Nenhum deployment encontrado para este projeto.')
    process.exit(0)
  }

  console.log(`Encontrado(s) ${deployments.length} deployment(s) de staging/produção:\n`)
  deployments.forEach((dep, index) => {
    const isProduction = dep.target === 'production'
    const emoji = dep.state === 'READY' ? '🟢' : dep.state === 'BUILDING' ? '🔵' : '🔴'
    console.log(`${index + 1}. [${dep.state}] ${emoji} Target: ${dep.target ? dep.target.toUpperCase() : 'PREVIEW'}`)
    console.log(`   ID: ${dep.uid}`)
    console.log(`   URL: https://${dep.url}`)
    console.log(`   Criado em: ${new Date(dep.created).toLocaleString()}`)
    if (dep.meta?.githubCommitMessage) {
      console.log(`   Commit: "${dep.meta.githubCommitMessage}" (${dep.meta.githubCommitRef})`)
    }
    console.log('───────────────────────────────────────────────────────────────')
  })

  console.log('\n[VERCEL STATUS] Integração com Vercel está 100% ATIVA e validada.')
  process.exit(0)
} catch (err) {
  console.error(`[VERCEL ERROR] Falha ao conectar na Vercel API: ${err.message}`)
  process.exit(1)
}

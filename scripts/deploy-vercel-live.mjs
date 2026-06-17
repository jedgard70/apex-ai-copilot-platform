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

console.log('═══════════════════════════════════════════════════════════════')
console.log('TRIGGER VERCEL LIVE PREVIEW DEPLOYMENT')
console.log('═══════════════════════════════════════════════════════════════')

if (!token || !projectId) {
  console.error('[VERCEL ERROR] VERCEL_TOKEN ou APEX_VERCEL_PROJECT_ID ausente no ambiente.')
  process.exit(1)
}

try {
  console.log(`Buscando configurações do projeto Vercel: ${projectId}...`)
  const projectUrl = `https://api.vercel.com/v9/projects/${projectId}`
  const projectRes = await fetch(projectUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!projectRes.ok) {
    const errData = await projectRes.json().catch(() => ({}))
    console.error(`[VERCEL ERROR] Falha ao obter dados do projeto: ${errData?.error?.message || 'erro desconhecido'}`)
    process.exit(1)
  }

  const projectData = await projectRes.json()
  const projectName = projectData.name
  const teamId = projectData.accountId?.startsWith('team_') ? projectData.accountId : null

  const gitSource = projectData.link && projectData.link.repoId ? {
    type: projectData.link.type || 'github',
    repoId: String(projectData.link.repoId),
    ref: 'main',
  } : undefined

  if (!gitSource) {
    console.error(`[VERCEL ERROR] O projeto Vercel não possui integração Git configurada.`)
    process.exit(1)
  }

  const deployUrl = `https://api.vercel.com/v13/deployments${teamId ? `?teamId=${encodeURIComponent(teamId)}` : ''}`
  console.log(`Disparando deploy de Preview na Vercel para o projeto: ${projectName} (Team: ${teamId || 'nenhum'})...`)

  const body = {
    name: projectName,
    gitSource,
  }

  const response = await fetch(deployUrl, {
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

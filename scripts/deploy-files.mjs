#!/usr/bin/env node
/**
 * scripts/deploy-files.mjs
 *
 * Cria um Pull Request no GitHub com arquivos arbitrários.
 * Uso: node scripts/deploy-files.mjs <caminho-para-config.json>
 *
 * O config.json deve ter:
 * {
 *   "branch": "feat/meu-modulo",
 *   "message": "feat: mensagem do commit",
 *   "prTitle": "Título do PR",
 *   "prBody": "Descrição do PR",
 *   "files": [
 *     { "path": "api/meu-modulo/index.mjs", "content": "// conteudo..." },
 *     { "path": "docs/MEU_MODULO.md", "content": "# Documentação..." }
 *   ]
 * }
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env.local') })

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.PERSONAL_GITHUB_TOKEN
if (!GITHUB_TOKEN) {
  console.error('ERRO: GITHUB_TOKEN não encontrado no .env.local')
  console.error('Adicione GITHUB_TOKEN=ghp_xxx ou PERSONAL_GITHUB_TOKEN=ghp_xxx')
  process.exit(1)
}

const OWNER = 'jedgard70'
const REPO = 'apex-ai-copilot-platform'
const API = 'https://api.github.com'

async function gh(method, path, body) {
  const url = `${API}${path}`
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'deploy-files-script',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok) throw new Error(`GitHub API ${method} ${path}: ${res.status} — ${JSON.stringify(data).slice(0, 300)}`)
  return data
}

async function run(configPath) {
  const cfg = JSON.parse(readFileSync(resolve(process.cwd(), configPath), 'utf-8'))
  const branch = cfg.branch
  const message = cfg.message || 'feat: update via deploy-files'
  const prTitle = cfg.prTitle || message
  const prBody = cfg.prBody || 'PR gerado automaticamente por `scripts/deploy-files.mjs`'
  const files = cfg.files

  if (!files || !files.length) {
    console.error('ERRO: Nenhum arquivo definido no config')
    process.exit(1)
  }

  console.log(`📦 Criando branch "${branch}" com ${files.length} arquivo(s)...`)

  // 1. Pega o SHA da main
  const mainRef = await gh('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/main`)
  const baseSha = mainRef.object.sha
  console.log(`   Base commit: ${baseSha.slice(0, 7)}`)

  // 2. Cria a branch
  try {
    await gh('POST', `/repos/${OWNER}/${REPO}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    })
    console.log(`   Branch criada: ${branch}`)
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log(`   Branch já existe, reutilizando: ${branch}`)
    } else {
      throw e
    }
  }

  // 3. Cria blobs e tree
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await gh('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
        content: file.content,
        encoding: 'utf-8',
      })
      return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha }
    })
  )

  const branchRef = await gh('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/${branch}`)
  const currentTree = await gh('GET', `/repos/${OWNER}/${REPO}/git/commits/${branchRef.object.sha}`)

  const tree = await gh('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
    base_tree: currentTree.tree.sha,
    tree: blobs,
  })

  // 4. Cria commit
  const commit = await gh('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message,
    tree: tree.sha,
    parents: [branchRef.object.sha],
  })
  console.log(`   Commit criado: ${commit.sha.slice(0, 7)}`)

  // 5. Atualiza a branch
  await gh('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, {
    sha: commit.sha,
    force: true,
  })
  console.log(`   Branch atualizada para o novo commit`)

  // 6. Cria o PR
  try {
    const pr = await gh('POST', `/repos/${OWNER}/${REPO}/pulls`, {
      title: prTitle,
      head: branch,
      base: 'main',
      body: prBody,
    })
    console.log(`\n✅ PR criado: ${pr.html_url}`)
    console.log(`   Número: #${pr.number}`)
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log(`\n⚠️  PR já existe para essa branch. Atualizações foram commitadas.`)
    } else {
      throw e
    }
  }
}

const configArg = process.argv[2]
if (!configArg) {
  console.error('Uso: node scripts/deploy-files.mjs <caminho-para-config.json>')
  process.exit(1)
}

run(configArg).catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})

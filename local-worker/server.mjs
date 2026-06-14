/**
 * Apex AI Copilot — Local Worker (H5.2B)
 * Secure whitelist-only executor for controlled Windows PC operations.
 * Auto-discovers node/npm/git — no manual PATH config required.
 * Runs at localhost:8787 (or LOCAL_WORKER_PORT).
 * All routes require Bearer token auth.
 * No free shell. No destructive commands. No secrets in responses.
 */

import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { readFile, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { homedir, platform } from 'node:os'

// ─── Load .env at startup (no external deps) ──────────────────────────────────

const envRaw = await readFile(new URL('.env', import.meta.url), 'utf8').catch(() => '')
for (const line of envRaw.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq < 1) continue
  const key = trimmed.slice(0, eq).trim()
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (key && !process.env[key]) process.env[key] = val
}

const TOKEN = process.env.LOCAL_WORKER_TOKEN || ''
const PORT = Number(process.env.LOCAL_WORKER_PORT) || 8787
const PROJECT_PATH = resolve(process.env.APEX_PROJECT_PATH || process.cwd())
const IS_WINDOWS = platform() === 'win32'

if (!TOKEN) {
  console.error('[apex-worker] FATAL: LOCAL_WORKER_TOKEN is not set. Set it in .env before starting.')
  process.exit(1)
}

// ─── Tool auto-discovery ───────────────────────────────────────────────────────

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.X_OK)
    return true
  } catch (_) {
    try {
      await access(filePath, fsConstants.F_OK)
      return true
    } catch (_) {
      return false
    }
  }
}

function probeVersion(bin, timeoutMs = 4000) {
  return new Promise(res => {
    const proc = spawn(bin, ['--version'], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    let out = ''
    proc.stdout.on('data', d => { out += d.toString() })
    proc.stderr.on('data', d => { out += d.toString() })
    const timer = setTimeout(() => { proc.kill(); res(null) }, timeoutMs)
    proc.on('close', code => {
      clearTimeout(timer)
      res(code === 0 ? out.trim().split('\n')[0].trim() : null)
    })
    proc.on('error', () => { clearTimeout(timer); res(null) })
  })
}

function nodeDir() {
  return dirname(process.execPath)
}

function npmCandidates() {
  const candidates = []
  // .env override
  if (process.env.NPM_BIN) candidates.push(process.env.NPM_BIN)
  if (IS_WINDOWS) {
    const nd = nodeDir()
    // npm.cmd sits next to node.exe on Windows Node installs
    candidates.push(join(nd, 'npm.cmd'))
    candidates.push(join(nd, 'npm.exe'))
    candidates.push(join(nd, 'npm'))
    // Global fallbacks
    candidates.push('npm.cmd')
    candidates.push('npm.exe')
  }
  candidates.push('npm')
  return [...new Set(candidates)]
}

function gitCandidates() {
  const candidates = []
  // .env override
  if (process.env.GIT_BIN) candidates.push(process.env.GIT_BIN)
  if (IS_WINDOWS) {
    const home = homedir()
    // Git for Windows standard paths
    candidates.push('C:\\Program Files\\Git\\cmd\\git.exe')
    candidates.push('C:\\Program Files\\Git\\bin\\git.exe')
    candidates.push('C:\\Program Files (x86)\\Git\\cmd\\git.exe')
    candidates.push('C:\\Program Files (x86)\\Git\\bin\\git.exe')
    // GitHub Desktop bundled git — glob-like expansion
    const ghDesktopBase = join(home, 'AppData', 'Local', 'GitHubDesktop')
    // We'll check common version patterns; actual glob resolved at discovery time
    candidates.push(join(ghDesktopBase, 'app-*', 'resources', 'app', 'git', 'cmd', 'git.exe'))
    candidates.push('git.exe')
    candidates.push('git.cmd')
  }
  candidates.push('git')
  return [...new Set(candidates)]
}

function nodeCandidates() {
  const candidates = []
  if (process.env.NODE_BIN) candidates.push(process.env.NODE_BIN)
  // process.execPath is the running Node binary — always reliable
  candidates.push(process.execPath)
  if (IS_WINDOWS) {
    candidates.push('node.exe')
  }
  candidates.push('node')
  return [...new Set(candidates)]
}

async function expandGlob(pattern) {
  // Simple glob expansion for patterns like path/app-*/sub/git.exe
  // Only handles a single * segment
  const starIdx = pattern.indexOf('*')
  if (starIdx === -1) return [pattern]
  const dir = dirname(pattern.slice(0, starIdx + 1))
  const rest = pattern.slice(starIdx + 1)
  try {
    const { readdir } = await import('node:fs/promises')
    const entries = await readdir(dir)
    return entries.map(e => join(dir, e) + rest).sort().reverse() // newest version first
  } catch (_) {
    return []
  }
}

async function discoverBin(candidates) {
  for (const candidate of candidates) {
    const expanded = await expandGlob(candidate)
    for (const path of expanded) {
      const version = await probeVersion(path)
      if (version !== null) return { path, version }
    }
  }
  return null
}

// Run discovery once at startup
console.log('[apex-worker] Discovering tools...')
const [nodeDiscovered, npmDiscovered, gitDiscovered] = await Promise.all([
  discoverBin(nodeCandidates()),
  discoverBin(npmCandidates()),
  discoverBin(gitCandidates()),
])

const TOOLS = {
  node: nodeDiscovered ? { available: true, path: nodeDiscovered.path, version: nodeDiscovered.version } : { available: false, path: null, version: null },
  npm:  npmDiscovered  ? { available: true, path: npmDiscovered.path,  version: npmDiscovered.version  } : { available: false, path: null, version: null },
  git:  gitDiscovered  ? { available: true, path: gitDiscovered.path,  version: gitDiscovered.version  } : { available: false, path: null, version: null },
}

console.log(`[apex-worker] node: ${TOOLS.node.available ? `✓ ${TOOLS.node.path} (${TOOLS.node.version})` : '✗ not found'}`)
console.log(`[apex-worker] npm:  ${TOOLS.npm.available  ? `✓ ${TOOLS.npm.path}  (${TOOLS.npm.version})`  : '✗ not found — set NPM_BIN in .env'}`)
console.log(`[apex-worker] git:  ${TOOLS.git.available  ? `✓ ${TOOLS.git.path}  (${TOOLS.git.version})`  : '✗ not found — set GIT_BIN in .env or install Git for Windows'}`)

// ─── Command timeout ───────────────────────────────────────────────────────────

const COMMAND_TIMEOUT_MS = 30000

// ─── Whitelisted actions ───────────────────────────────────────────────────────

function requireTool(name) {
  const tool = TOOLS[name]
  if (!tool?.available) {
    const hints = {
      git: 'Instale Git for Windows (https://git-scm.com) ou defina GIT_BIN no .env.',
      npm: 'Reinstale Node.js (https://nodejs.org) ou defina NPM_BIN no .env.',
      node: 'Verifique a instalação do Node.js ou defina NODE_BIN no .env.',
    }
    return { ok: false, unavailable: true, reason: `"${name}" não encontrado automaticamente. ${hints[name] || ''}` }
  }
  return { ok: true, bin: tool.path }
}

function buildActionMap() {
  return {
    'system.info': {
      label: 'System info (Node/npm/git versions)',
      build: () => [
        { ...requireTool('node'), args: ['--version'], tag: 'node' },
        { ...requireTool('npm'),  args: ['--version'], tag: 'npm'  },
        { ...requireTool('git'),  args: ['--version'], tag: 'git'  },
      ],
    },
    'node.version': {
      label: 'Node.js version',
      build: () => [{ ...requireTool('node'), args: ['--version'], tag: 'node' }],
    },
    'npm.version': {
      label: 'npm version',
      build: () => [{ ...requireTool('npm'), args: ['--version'], tag: 'npm' }],
    },
    'git.version': {
      label: 'Git version',
      build: () => [{ ...requireTool('git'), args: ['--version'], tag: 'git' }],
    },
    'project.git_status': {
      label: 'Git status of project',
      build: () => [{ ...requireTool('git'), args: ['status', '--short'], tag: 'git' }],
    },
    'project.git_log': {
      label: 'Recent git log (last 5 commits)',
      build: () => [{ ...requireTool('git'), args: ['log', '--oneline', '-5'], tag: 'git' }],
    },
    'project.build_check': {
      label: 'npm run build (build check)',
      build: () => [{ ...requireTool('npm'), args: ['run', 'build'], tag: 'npm' }],
    },
    'project.validate_h44': {
      label: 'Validate CP15X-H4.4',
      build: () => [{ ...requireTool('node'), args: ['scripts/validate-cp15x-h44.mjs'], tag: 'node' }],
    },
    'project.validate_h5': {
      label: 'Validate CP15X-H5',
      build: () => [{ ...requireTool('node'), args: ['scripts/validate-cp15x-h5.mjs'], tag: 'node' }],
    },
  }
}

const ACTION_MAP = buildActionMap()
const ALLOWED_ACTION_IDS = new Set(Object.keys(ACTION_MAP))

// ─── Auth ─────────────────────────────────────────────────────────────────────

function checkAuth(req) {
  const auth = req.headers['authorization'] || ''
  if (!auth) return { ok: false, status: 401, reason: 'Authorization header missing.' }
  if (!auth.startsWith('Bearer ')) return { ok: false, status: 401, reason: 'Authorization must use Bearer scheme.' }
  const provided = auth.slice(7).trim()
  if (!provided) return { ok: false, status: 401, reason: 'Bearer token empty.' }
  if (!timingSafeEqual(provided, TOKEN)) return { ok: false, status: 403, reason: 'Invalid token.' }
  return { ok: true }
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    let diff = 0
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ─── Executor ─────────────────────────────────────────────────────────────────

function runCommand(bin, args, timeoutMs = COMMAND_TIMEOUT_MS) {
  return new Promise(res => {
    const start = Date.now()
    const proc = spawn(bin, args, {
      cwd: PROJECT_PATH,
      shell: false,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })

    const timer = setTimeout(() => {
      proc.kill('SIGTERM')
      res({ exitCode: -1, stdout, stderr: stderr + '\n[timeout]', durationMs: Date.now() - start })
    }, timeoutMs)

    proc.on('close', code => {
      clearTimeout(timer)
      res({ exitCode: code ?? -1, stdout, stderr, durationMs: Date.now() - start })
    })
    proc.on('error', err => {
      clearTimeout(timer)
      res({ exitCode: -1, stdout: '', stderr: err.message, durationMs: Date.now() - start })
    })
  })
}

async function executeAction(actionId) {
  if (!ALLOWED_ACTION_IDS.has(actionId)) {
    return {
      ok: false,
      action: actionId,
      blocked: true,
      reason: `Action "${actionId}" is not in the whitelist. Allowed: ${[...ALLOWED_ACTION_IDS].join(', ')}.`,
    }
  }

  const def = ACTION_MAP[actionId]
  const commands = def.build()
  const results = []

  for (const cmd of commands) {
    if (!cmd.ok) {
      results.push({
        tag: cmd.tag,
        bin: null,
        args: [],
        exitCode: -1,
        stdout: '',
        stderr: cmd.reason,
        durationMs: 0,
        unavailable: true,
      })
      continue
    }
    const r = await runCommand(cmd.bin, cmd.args)
    results.push({ tag: cmd.tag, bin: cmd.bin, args: cmd.args, ...r })
  }

  const allOk = results.every(r => r.exitCode === 0)
  const combined = results.map(r => {
    const label = r.bin ? `$ ${r.bin} ${r.args.join(' ')}` : `[${r.tag}: unavailable]`
    return `${label}\n${r.stdout || ''}${r.stderr ? `[stderr] ${r.stderr}` : ''}`.trim()
  }).join('\n\n')

  return {
    ok: allOk,
    action: actionId,
    label: def.label,
    exitCode: results[results.length - 1]?.exitCode ?? -1,
    stdout: combined,
    stderr: results.map(r => r.stderr).filter(Boolean).join('\n'),
    durationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
    results,
  }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(payload)
}

function readBody(req) {
  return new Promise((res, rej) => {
    let data = ''
    req.on('data', chunk => { data += chunk.toString() })
    req.on('end', () => {
      try { res(JSON.parse(data || '{}')) } catch (_) { res({}) }
    })
    req.on('error', rej)
  })
}

// ─── Request router ───────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const path = url.pathname

  res.setHeader('Access-Control-Allow-Origin', '127.0.0.1')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // ── GET /health ────────────────────────────────────────────────────────────
  if (req.method === 'GET' && path === '/health') {
    const auth = checkAuth(req)
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, reason: auth.reason })
    return sendJson(res, 200, {
      ok: true,
      service: 'apex-local-worker',
      version: '1.0.0',
      checkpoint: 'H5.2B',
      projectPath: PROJECT_PATH,
      platform: platform(),
      discoveredTools: TOOLS,
      allowedActions: [...ALLOWED_ACTION_IDS],
      port: PORT,
      secretsExposed: false,
    })
  }

  // ── POST /status ───────────────────────────────────────────────────────────
  if (req.method === 'POST' && path === '/status') {
    const auth = checkAuth(req)
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, reason: auth.reason })
    return sendJson(res, 200, {
      ok: true,
      service: 'apex-local-worker',
      projectPath: PROJECT_PATH,
      discoveredTools: TOOLS,
      allowedActions: [...ALLOWED_ACTION_IDS],
      secretsExposed: false,
    })
  }

  // ── POST /run ──────────────────────────────────────────────────────────────
  if (req.method === 'POST' && path === '/run') {
    const auth = checkAuth(req)
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, reason: auth.reason })

    const body = await readBody(req)
    const action = String(body.action || '').trim()

    if (!action) {
      return sendJson(res, 400, { ok: false, reason: 'Missing "action" field in request body.' })
    }

    const result = await executeAction(action)
    if (result.blocked) return sendJson(res, 403, result)
    return sendJson(res, result.ok ? 200 : 500, result)
  }

  // ── 404 ───────────────────────────────────────────────────────────────────
  sendJson(res, 404, { ok: false, reason: `Route ${req.method} ${path} not found.` })
}

// ─── Start server ─────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('[apex-worker] unhandled error:', err?.message || err)
    try {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, reason: 'Internal worker error. No secrets exposed.' }))
    } catch (_) { /* response already sent */ }
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[apex-worker] Apex Local Worker H5.2B running on http://127.0.0.1:${PORT}`)
  console.log(`[apex-worker] Project path: ${PROJECT_PATH}`)
  console.log(`[apex-worker] node: ${TOOLS.node.available ? TOOLS.node.version : 'NOT FOUND'}`)
  console.log(`[apex-worker] npm:  ${TOOLS.npm.available  ? TOOLS.npm.version  : 'NOT FOUND — set NPM_BIN in .env'}`)
  console.log(`[apex-worker] git:  ${TOOLS.git.available  ? TOOLS.git.version  : 'NOT FOUND — set GIT_BIN in .env'}`)
  console.log(`[apex-worker] Allowed actions: ${[...ALLOWED_ACTION_IDS].join(', ')}`)
  console.log('[apex-worker] Free shell: BLOCKED')
})

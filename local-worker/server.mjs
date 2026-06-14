/**
 * Apex AI Copilot — Local Worker (H5.2C)
 * Secure whitelist-only executor for controlled Windows PC operations.
 * Auto-discovers node/npm/git — no manual PATH config required (best effort).
 * Runs at localhost:8787 (or LOCAL_WORKER_PORT).
 * All routes require Bearer token auth.
 * No free shell. No destructive commands. No secrets in responses.
 */

import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { readFile, access, readdir, stat } from 'node:fs/promises'
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

// Returns version string or null — NEVER throws.
// Handles EINVAL/ENOENT from spawn() synchronously on Windows with invalid paths.
function probeVersion(bin, timeoutMs = 4000) {
  // Validate candidate before attempting spawn
  if (!bin || typeof bin !== 'string' || bin.trim() === '' || bin.includes('*')) {
    return Promise.resolve(null)
  }
  return new Promise(res => {
    let proc
    try {
      proc = spawn(bin.trim(), ['--version'], {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
    } catch (err) {
      // spawn() can throw synchronously on Windows: EINVAL for bad paths, etc.
      return res(null)
    }

    let out = ''
    let settled = false
    function settle(val) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      res(val)
    }

    proc.stdout.on('data', d => { out += d.toString() })
    proc.stderr.on('data', d => { out += d.toString() })

    const timer = setTimeout(() => {
      try { proc.kill() } catch (_) {}
      settle(null)
    }, timeoutMs)

    proc.on('close', code => settle(code === 0 ? out.trim().split('\n')[0].trim() || null : null))
    proc.on('error', () => settle(null))
  })
}

// Expand a single-wildcard path like path/app-*/sub/bin.exe into real paths.
// Never returns paths that still contain '*'.
async function expandGlob(pattern) {
  if (!pattern || pattern.trim() === '') return []
  const starIdx = pattern.indexOf('*')
  if (starIdx === -1) return [pattern]

  // dir = everything before the wildcard segment
  const beforeStar = pattern.slice(0, starIdx)
  const dir = dirname(beforeStar.endsWith('/') || beforeStar.endsWith('\\') ? beforeStar + '_' : beforeStar)
  const rest = pattern.slice(starIdx + 1) // everything after the first '*'

  // If rest still has '*', skip (nested globs not supported)
  if (rest.includes('*')) return []

  try {
    const entries = await readdir(dir)
    const expanded = []
    for (const entry of entries) {
      const candidate = join(dir, entry) + rest
      // Safety: skip if still has wildcard
      if (candidate.includes('*')) continue
      expanded.push(candidate)
    }
    // Sort reverse so newest app-3.5.x comes before older
    expanded.sort().reverse()
    return expanded
  } catch (_) {
    return []
  }
}

// Check that a path is a file (not directory) before spawning.
// Returns true even if stat fails — we let probeVersion handle the final check.
async function isLikelyExecutable(filePath) {
  if (!filePath || filePath.includes('*')) return false
  try {
    const s = await stat(filePath)
    return s.isFile()
  } catch (_) {
    // Path might still be on PATH; let spawn decide
    return true
  }
}

function nodeDir() {
  return dirname(process.execPath)
}

function nodeCandidates() {
  const raw = []
  if (process.env.NODE_BIN) raw.push(process.env.NODE_BIN)
  // process.execPath is the running Node binary — always reliable
  raw.push(process.execPath)
  if (IS_WINDOWS) raw.push('node.exe')
  raw.push('node')
  // Deduplicate, filter empty/null
  return [...new Set(raw.filter(c => c && c.trim()))]
}

function npmCandidates() {
  const raw = []
  if (process.env.NPM_BIN) raw.push(process.env.NPM_BIN)
  if (IS_WINDOWS) {
    const nd = nodeDir()
    raw.push(join(nd, 'npm.cmd'))
    raw.push(join(nd, 'npm.exe'))
    raw.push(join(nd, 'npm'))
    raw.push('npm.cmd')
    raw.push('npm.exe')
  }
  raw.push('npm')
  return [...new Set(raw.filter(c => c && c.trim()))]
}

function gitCandidates() {
  const raw = []
  if (process.env.GIT_BIN) raw.push(process.env.GIT_BIN)
  if (IS_WINDOWS) {
    const home = homedir()
    raw.push('C:\\Program Files\\Git\\cmd\\git.exe')
    raw.push('C:\\Program Files\\Git\\bin\\git.exe')
    raw.push('C:\\Program Files (x86)\\Git\\cmd\\git.exe')
    raw.push('C:\\Program Files (x86)\\Git\\bin\\git.exe')
    // GitHub Desktop bundled git — resolved via expandGlob at discovery time
    raw.push(join(home, 'AppData', 'Local', 'GitHubDesktop', 'app-*', 'resources', 'app', 'git', 'cmd', 'git.exe'))
    raw.push('git.exe')
    raw.push('git.cmd')
  }
  raw.push('git')
  return [...new Set(raw.filter(c => c && c.trim()))]
}

// Tries candidates in order, skipping any that fail. Never throws.
// Returns { path, version } for the first working candidate, or null.
async function discoverBin(candidates) {
  for (const candidate of candidates) {
    let paths
    try {
      paths = await expandGlob(candidate)
    } catch (_) {
      paths = candidate.includes('*') ? [] : [candidate]
    }

    for (const p of paths) {
      if (!p || p.includes('*')) continue
      // Optional pre-filter: skip if absolute path is known to be a directory
      if (!await isLikelyExecutable(p)) continue
      const version = await probeVersion(p)
      if (version !== null) return { path: p, version }
    }
  }
  return null
}

// Run discovery once at startup — never fatal
console.log('[apex-worker] Discovering tools...')
const [nodeDiscovered, npmDiscovered, gitDiscovered] = await Promise.all([
  discoverBin(nodeCandidates()).catch(() => null),
  discoverBin(npmCandidates()).catch(() => null),
  discoverBin(gitCandidates()).catch(() => null),
])

const TOOLS = {
  node: nodeDiscovered
    ? { available: true,  path: nodeDiscovered.path, version: nodeDiscovered.version, reason: null }
    : { available: false, path: null, version: null, reason: 'Not found. Set NODE_BIN in .env or reinstall Node.js.' },
  npm: npmDiscovered
    ? { available: true,  path: npmDiscovered.path, version: npmDiscovered.version, reason: null }
    : { available: false, path: null, version: null, reason: 'Not found. Set NPM_BIN=npm.cmd in .env or reinstall Node.js.' },
  git: gitDiscovered
    ? { available: true,  path: gitDiscovered.path, version: gitDiscovered.version, reason: null }
    : { available: false, path: null, version: null, reason: 'Not found. Set GIT_BIN in .env or install Git for Windows (https://git-scm.com).' },
}

console.log(`[apex-worker] node: ${TOOLS.node.available ? `✓ ${TOOLS.node.path} (${TOOLS.node.version})` : `✗ ${TOOLS.node.reason}`}`)
console.log(`[apex-worker] npm:  ${TOOLS.npm.available  ? `✓ ${TOOLS.npm.path} (${TOOLS.npm.version})`   : `✗ ${TOOLS.npm.reason}`}`)
console.log(`[apex-worker] git:  ${TOOLS.git.available  ? `✓ ${TOOLS.git.path} (${TOOLS.git.version})`   : `✗ ${TOOLS.git.reason}`}`)

// ─── Command timeout ───────────────────────────────────────────────────────────

const COMMAND_TIMEOUT_MS = 30000

// ─── Whitelisted actions ───────────────────────────────────────────────────────

function requireTool(name) {
  const tool = TOOLS[name]
  if (!tool?.available) {
    return { ok: false, unavailable: true, tag: name, reason: tool?.reason || `"${name}" not available.` }
  }
  return { ok: true, bin: tool.path, tag: name }
}

function buildActionMap() {
  return {
    'system.info': {
      label: 'System info (Node/npm/git versions)',
      build: () => [
        { ...requireTool('node'), args: ['--version'] },
        { ...requireTool('npm'),  args: ['--version'] },
        { ...requireTool('git'),  args: ['--version'] },
      ],
    },
    'node.version': {
      label: 'Node.js version',
      build: () => [{ ...requireTool('node'), args: ['--version'] }],
    },
    'npm.version': {
      label: 'npm version',
      build: () => [{ ...requireTool('npm'), args: ['--version'] }],
    },
    'git.version': {
      label: 'Git version',
      build: () => [{ ...requireTool('git'), args: ['--version'] }],
    },
    'project.git_status': {
      label: 'Git status of project',
      build: () => [{ ...requireTool('git'), args: ['status', '--short'] }],
    },
    'project.git_log': {
      label: 'Recent git log (last 5 commits)',
      build: () => [{ ...requireTool('git'), args: ['log', '--oneline', '-5'] }],
    },
    'project.build_check': {
      label: 'npm run build (build check)',
      build: () => [{ ...requireTool('npm'), args: ['run', 'build'] }],
    },
    'project.validate_h44': {
      label: 'Validate CP15X-H4.4',
      build: () => [{ ...requireTool('node'), args: ['scripts/validate-cp15x-h44.mjs'] }],
    },
    'project.validate_h5': {
      label: 'Validate CP15X-H5',
      build: () => [{ ...requireTool('node'), args: ['scripts/validate-cp15x-h5.mjs'] }],
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
  // Always iterate max length to prevent timing attacks even on length mismatch
  const len = Math.max(a.length, b.length)
  let diff = a.length !== b.length ? 1 : 0
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  return diff === 0
}

// ─── Executor ─────────────────────────────────────────────────────────────────

function runCommand(bin, args, timeoutMs = COMMAND_TIMEOUT_MS) {
  return new Promise(res => {
    let proc
    try {
      proc = spawn(bin, args, {
        cwd: PROJECT_PATH,
        shell: false,
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
    } catch (err) {
      return res({ exitCode: -1, stdout: '', stderr: err.message, durationMs: 0 })
    }

    const start = Date.now()
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })

    const timer = setTimeout(() => {
      try { proc.kill('SIGTERM') } catch (_) {}
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

  // ok = true if at least one command succeeded and none hard-failed (non-unavailable exit != 0)
  const ran = results.filter(r => !r.unavailable)
  const allOk = ran.length > 0 && ran.every(r => r.exitCode === 0)
  const partialOk = ran.some(r => r.exitCode === 0)

  const combined = results.map(r => {
    const label = r.bin ? `$ ${r.bin} ${r.args.join(' ')}` : `[${r.tag}: unavailable — ${r.stderr}]`
    const body = [r.stdout, r.stderr && !r.unavailable ? `[stderr] ${r.stderr}` : ''].filter(Boolean).join('\n')
    return body ? `${label}\n${body}`.trim() : label
  }).join('\n\n')

  return {
    ok: allOk,
    partial: !allOk && partialOk,
    action: actionId,
    label: def.label,
    exitCode: ran[ran.length - 1]?.exitCode ?? -1,
    stdout: combined,
    stderr: results.filter(r => r.stderr && !r.unavailable).map(r => r.stderr).join('\n'),
    durationMs: results.reduce((sum, r) => sum + r.durationMs, 0),
    results,
    secretsExposed: false,
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
      checkpoint: 'H5.2C',
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
    // Return 200 even for partial results so callers can inspect individual tool results
    return sendJson(res, result.ok || result.partial ? 200 : 500, result)
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
      res.end(JSON.stringify({ ok: false, reason: 'Internal worker error. No secrets exposed.', secretsExposed: false }))
    } catch (_) { /* response already sent */ }
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[apex-worker] Apex Local Worker H5.2C running on http://127.0.0.1:${PORT}`)
  console.log(`[apex-worker] Project path: ${PROJECT_PATH}`)
  console.log(`[apex-worker] node: ${TOOLS.node.available ? TOOLS.node.version : 'NOT FOUND'}`)
  console.log(`[apex-worker] npm:  ${TOOLS.npm.available  ? TOOLS.npm.version  : 'NOT FOUND — set NPM_BIN=npm.cmd in .env'}`)
  console.log(`[apex-worker] git:  ${TOOLS.git.available  ? TOOLS.git.version  : 'NOT FOUND — set GIT_BIN in .env'}`)
  console.log(`[apex-worker] Allowed actions: ${[...ALLOWED_ACTION_IDS].join(', ')}`)
  console.log('[apex-worker] Free shell: BLOCKED')
})

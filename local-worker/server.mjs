/**
 * Apex AI Copilot — Local Worker (H5.2A)
 * Secure whitelist-only executor for controlled Windows PC operations.
 * Runs at localhost:8787 (or LOCAL_WORKER_PORT).
 * All routes require Bearer token auth.
 * No free shell. No destructive commands. No secrets in responses.
 */

import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

// ─── Configuration ────────────────────────────────────────────────────────────

// Load .env at startup (no external deps)
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

if (!TOKEN) {
  console.error('[apex-worker] FATAL: LOCAL_WORKER_TOKEN is not set. Set it in .env before starting.')
  process.exit(1)
}

// ─── Whitelisted actions ───────────────────────────────────────────────────────

const COMMAND_TIMEOUT_MS = 15000

const ACTION_MAP = {
  'system.info': {
    label: 'System info (Node/npm/git versions)',
    commands: [
      { cmd: 'node', args: ['--version'] },
      { cmd: 'npm', args: ['--version'] },
      { cmd: 'git', args: ['--version'] },
    ],
    cwd: PROJECT_PATH,
  },
  'node.version': {
    label: 'Node.js version',
    commands: [{ cmd: 'node', args: ['--version'] }],
    cwd: PROJECT_PATH,
  },
  'npm.version': {
    label: 'npm version',
    commands: [{ cmd: 'npm', args: ['--version'] }],
    cwd: PROJECT_PATH,
  },
  'git.version': {
    label: 'Git version',
    commands: [{ cmd: 'git', args: ['--version'] }],
    cwd: PROJECT_PATH,
  },
  'project.git_status': {
    label: 'Git status of project',
    commands: [{ cmd: 'git', args: ['status', '--short'] }],
    cwd: PROJECT_PATH,
  },
  'project.git_log': {
    label: 'Recent git log (last 5 commits)',
    commands: [{ cmd: 'git', args: ['log', '--oneline', '-5'] }],
    cwd: PROJECT_PATH,
  },
  'project.build_check': {
    label: 'npm run build (build check)',
    commands: [{ cmd: 'npm', args: ['run', 'build'] }],
    cwd: PROJECT_PATH,
  },
  'project.validate_h44': {
    label: 'Validate CP15X-H4.4',
    commands: [{ cmd: 'node', args: ['scripts/validate-cp15x-h44.mjs'] }],
    cwd: PROJECT_PATH,
  },
  'project.validate_h5': {
    label: 'Validate CP15X-H5',
    commands: [{ cmd: 'node', args: ['scripts/validate-cp15x-h5.mjs'] }],
    cwd: PROJECT_PATH,
  },
}

const ALLOWED_ACTION_IDS = new Set(Object.keys(ACTION_MAP))

// ─── Auth ─────────────────────────────────────────────────────────────────────

function checkAuth(req) {
  const auth = req.headers['authorization'] || ''
  if (!auth) return { ok: false, status: 401, reason: 'Authorization header missing.' }
  if (!auth.startsWith('Bearer ')) return { ok: false, status: 401, reason: 'Authorization must use Bearer scheme.' }
  const provided = auth.slice(7).trim()
  if (!provided) return { ok: false, status: 401, reason: 'Bearer token empty.' }
  // Constant-time compare to avoid timing attacks
  if (!timingSafeEqual(provided, TOKEN)) return { ok: false, status: 403, reason: 'Invalid token.' }
  return { ok: true }
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    // still iterate to avoid timing leak
    let diff = 0
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
    return false
  }
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ─── Executor ─────────────────────────────────────────────────────────────────

function runCommand(cmd, args, cwd, timeoutMs = COMMAND_TIMEOUT_MS) {
  return new Promise(res => {
    const start = Date.now()
    const proc = spawn(cmd, args, {
      cwd,
      shell: false,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
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
  const results = []

  for (const { cmd, args } of def.commands) {
    const r = await runCommand(cmd, args, def.cwd)
    results.push({ cmd, args, ...r })
  }

  const allOk = results.every(r => r.exitCode === 0)
  const combined = results.map(r =>
    `$ ${r.cmd} ${r.args.join(' ')}\n${r.stdout}${r.stderr ? `[stderr] ${r.stderr}` : ''}`.trim()
  ).join('\n\n')

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

  // CORS for local use only
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
      checkpoint: 'H5.2A',
      projectPath: PROJECT_PATH,
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
  console.log(`[apex-worker] Apex Local Worker H5.2A running on http://127.0.0.1:${PORT}`)
  console.log(`[apex-worker] Project path: ${PROJECT_PATH}`)
  console.log(`[apex-worker] Allowed actions: ${[...ALLOWED_ACTION_IDS].join(', ')}`)
  console.log(`[apex-worker] Token configured: yes (not printed)`)
  console.log(`[apex-worker] Free shell: BLOCKED`)
})

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getApexTunnelSubdomain, getApexWorkerPort } from './apex-config.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const port = process.env.LOCAL_WORKER_PORT || String(getApexWorkerPort() || 8789)
const cliSubdomain = process.argv.find(arg => arg.startsWith('--subdomain='))
const subdomain = cliSubdomain
  ? cliSubdomain.split('=')[1]
  : (process.env.LOCAL_TUNNEL_SUBDOMAIN || process.env.APEX_TUNNEL_SUBDOMAIN || getApexTunnelSubdomain() || '').trim()

function withPrefix(prefix, data) {
  process.stdout.write(`[${prefix}] ${data}`)
}

function updateEnvLocal(url) {
  const envPath = path.resolve(root, '.env.local')
  let envContent = ''
  try { envContent = fs.readFileSync(envPath, 'utf8') } catch (_) { }
  const line = `LOCAL_WORKER_URL='${url}'`
  if (envContent.includes('LOCAL_WORKER_URL=')) {
    envContent = envContent.replace(/^LOCAL_WORKER_URL=.*$/m, line)
  } else {
    envContent += `\n${line}\n`
  }
  fs.writeFileSync(envPath, envContent)
  console.log(`[runtime] Updated .env.local with LOCAL_WORKER_URL=${url}`)
}

function extractTunnelUrl(chunk) {
  const text = String(chunk || '')
  const patterns = [
    /your url is:\s*(https:\/\/[^\s]+)/i,
    /your publicly accessible url is:\s*(https:\/\/[^\s]+)/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

function isPortOpen(host, targetPort, timeoutMs = 1200) {
  return new Promise(resolve => {
    const socket = new net.Socket()
    let settled = false

    const done = val => {
      if (settled) return
      settled = true
      try { socket.destroy() } catch { }
      resolve(val)
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
    socket.connect(Number(targetPort), host)
  })
}

console.log('[runtime] Starting Apex Runtime local stack...')

let worker = null
let reusingWorker = false

if (await isPortOpen('127.0.0.1', port)) {
  reusingWorker = true
  console.log(`[runtime] Detected active worker on port ${port}; reusing existing process.`)
} else {
  worker = spawn(process.execPath, ['server.mjs'], {
    cwd: path.resolve(root, 'local-worker'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
    windowsHide: true,
  })

  worker.stdout.on('data', data => withPrefix('worker', data))
  worker.stderr.on('data', data => withPrefix('worker', data))
  worker.on('exit', code => {
    console.log(`[runtime] Worker exited (${code})`)
    process.exit(code ?? 1)
  })
}

setTimeout(() => {
  const tunnelArgs = ['localtunnel', '--port', String(port)]
  if (subdomain) {
    tunnelArgs.push('--subdomain', subdomain)
  }

  console.log(`[runtime] Opening tunnel on port ${port}${subdomain ? ` (subdomain=${subdomain})` : ''}...`)
  const tunnelExe = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const tunnel = spawn(tunnelExe, tunnelArgs, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env, LOCAL_WORKER_PORT: String(port) },
    windowsHide: true,
  })

  let urlCaptured = false
  tunnel.stdout.on('data', data => {
    withPrefix('tunnel', data)
    if (urlCaptured) return
    const url = extractTunnelUrl(data)
    if (!url) return
    urlCaptured = true
    updateEnvLocal(url)
    console.log(`[runtime] Public URL active: ${url}`)
    console.log('[runtime] Stack ready: Apex Runtime local + tunnel online.')
  })

  tunnel.stderr.on('data', data => withPrefix('tunnel', data))
  tunnel.on('exit', code => {
    console.log(`[runtime] Tunnel exited (${code})`)
    if (worker && !reusingWorker) {
      try { worker.kill() } catch { }
    }
    process.exit(code ?? 1)
  })

  const shutdown = () => {
    console.log('\n[runtime] Shutting down...')
    try { tunnel.kill() } catch { }
    if (worker && !reusingWorker) {
      try { worker.kill() } catch { }
    }
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}, 1800)

import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

console.log('\n[dev-live] Starting Apex AI Copilot Live Dev Environment...\n')

// 1. Start Local Worker
const workerPath = resolve(root, 'local-worker', 'server.mjs')
const worker = spawn(process.execPath, [workerPath], {
  cwd: resolve(root, 'local-worker'),
  stdio: 'inherit',
  env: { ...process.env },
})

worker.on('exit', code => {
  console.log(`[worker] exited (${code})`)
  process.exit()
})

// 2. Start Backend API Server
const server = spawn('node', ['server.mjs'], { 
  cwd: root, 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
})

server.on('exit', code => {
  console.log(`[server] exited (${code})`)
  worker.kill()
  process.exit(code)
})

// 3. Start Vite UI Server for Hot Reloading
setTimeout(() => {
  console.log('\n[dev-live] Starting Vite UI Dev Server (Hot Reloading)...\n')
  const vite = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--host', '0.0.0.0', '--open'], { 
    cwd: root, 
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  })
  
  vite.on('exit', code => {
    console.log(`[vite] exited (${code})`)
    worker.kill()
    server.kill()
    process.exit(code)
  })
}, 1000)

process.on('SIGINT', () => { worker.kill(); server.kill(); process.exit() })
process.on('SIGTERM', () => { worker.kill(); server.kill(); process.exit() })

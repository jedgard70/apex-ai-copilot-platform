import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Start local worker
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

// Give worker a moment to start, then build + start main server
setTimeout(() => {
  console.log('\n[dev] Building and starting main server...\n')
  const build = spawn('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true })
  build.on('exit', buildCode => {
    if (buildCode !== 0) {
      console.error(`[dev] Build failed (${buildCode})`)
      worker.kill()
      process.exit(buildCode)
    }
    const server = spawn('node', ['server.mjs'], { cwd: root, stdio: 'inherit' })
    server.on('exit', code => { worker.kill(); process.exit(code) })
  })
}, 2000)

process.on('SIGINT', () => { worker.kill(); process.exit() })
process.on('SIGTERM', () => { worker.kill(); process.exit() })

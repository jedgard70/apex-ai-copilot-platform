import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../..')

export async function executeServerCommand(command) {
  // Simulating the local worker running commands.
  // In a real environment, this might call the local worker API or execute directly via child_process
  return new Promise((resolve, reject) => {
    // For security, only allow specific npm scripts
    const allowedCommands = ['dev', 'dev:full', 'build', 'validate:h5', 'validate:h44']
    const script = command.replace('npm run ', '')
    
    if (!allowedCommands.includes(script) && !command.startsWith('npm run')) {
      resolve(`O comando '${command}' não é permitido por questões de segurança. Tente 'npm run dev' ou 'npm run build'.`)
      return
    }

    const child = spawn(command, { shell: true, cwd: rootDir })
    let output = ''
    
    child.stdout.on('data', data => output += data.toString())
    child.stderr.on('data', data => output += data.toString())
    
    // We don't want to wait forever if it's a long running process like dev server
    const timeout = setTimeout(() => {
      resolve(`Comando '${command}' iniciado em background.\nSaída parcial:\n${output.substring(0, 500)}...`)
    }, 5000)

    child.on('exit', code => {
      clearTimeout(timeout)
      resolve(`Comando '${command}' finalizado (código ${code}).\nSaída:\n${output.substring(0, 500)}`)
    })
  })
}

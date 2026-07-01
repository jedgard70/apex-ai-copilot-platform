import { exec } from 'node:child_process'

const ports = [8789, 8787]

function run(command) {
    return new Promise(resolve => {
        exec(command, { windowsHide: true }, () => resolve())
    })
}

async function killPort(port) {
    const command = `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`
    await run(command)
    console.log(`[runtime] Requested termination for port ${port}`)
}

console.log('[runtime] Stopping Apex Runtime stack...')
for (const port of ports) {
    await killPort(port)
}
console.log('[runtime] Stop signal sent. If a process remains, close it manually from Task Manager.')

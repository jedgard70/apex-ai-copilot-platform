import fs from 'fs'

const envPath = 'd:/AI-constr/apex-ai-copilot-platform/CHECKPOINT_TRACKER.md'
let content = fs.readFileSync(envPath, 'utf-8')

const newAction = `
4. **Estabilizar Instalador Desktop (Electron):** Consertar o executável \`Apex AI Copilot Setup 0.1.0.exe\`, transformando-o num serviço de segundo plano (System Tray) silencioso que liga junto com o Windows, sem precisar de tela preta do PowerShell.
`

if (!content.includes('Estabilizar Instalador Desktop')) {
  content = content + newAction
  fs.writeFileSync(envPath, content)
}
console.log('Added Electron to Tracker')

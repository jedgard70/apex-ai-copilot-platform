import fs from 'fs'

const envPath = 'd:/AI-constr/apex-ai-copilot-platform/CHECKPOINT_TRACKER.md'
let content = fs.readFileSync(envPath, 'utf-8')

const newOtaAction = `
5. **Implementar Pipeline de Atualização OTA (Over-The-Air):** Configurar CI/CD para compilar novas versões do Instalador Desktop (\`.exe\`) e do App Mobile sempre que houver código novo, integrando com o \`electron-updater\` para atualizações automáticas e silenciosas nas máquinas dos usuários.
`

if (!content.includes('Pipeline de Atualização OTA')) {
  content = content + newOtaAction
  fs.writeFileSync(envPath, content)
}
console.log('Added OTA to Tracker')

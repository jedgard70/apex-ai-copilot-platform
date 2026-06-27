import fs from 'fs'

const content = `
# Atualizado com Client ID completo fornecido pelo Owner (2026-06-26)
GOOGLE_CLIENT_ID="429362775436-kcj30tca4ob1skjefv77u2j0774bsake.apps.googleusercontent.com"
`

fs.appendFileSync('d:/AI-constr/apex-ai-copilot-platform/.env.local', content)
console.log('Appended Client ID to .env.local')

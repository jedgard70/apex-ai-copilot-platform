import fs from 'fs'

const content = `
# Correção: O Client correto é o que possui os domínios do site de produção.
GOOGLE_CLIENT_ID="429362775436-6bgia3aqjmoc58f2n24i0hojh61ua212.apps.googleusercontent.com"
`

fs.appendFileSync('d:/AI-constr/apex-ai-copilot-platform/.env.local', content)
console.log('Appended Correct Client ID to .env.local')

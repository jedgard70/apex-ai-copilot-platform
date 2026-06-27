import fs from 'fs'

const content = `
# Injected via Google Cloud Console Dump (2026-06-26)
GOOGLE_PROJECT_ID="apex-ai-copilot-platform"
GOOGLE_PROJECT_NUMBER="429362775436"
# GOOGLE_CLIENT_ID="429362775436-kcj3..." # Preencher string inteira
# GOOGLE_CLIENT_SECRET="" # Preencher string inteira
GOOGLE_OAUTH_STATUS="configuring"
`

fs.appendFileSync('d:/AI-constr/apex-ai-copilot-platform/.env.local', content)
console.log('Appended to .env.local')

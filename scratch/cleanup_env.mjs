import fs from 'fs'

const envPath = 'd:/AI-constr/apex-ai-copilot-platform/.env.local'
let content = fs.readFileSync(envPath, 'utf-8')

// Clean up duplicate GOOGLE_CLIENT_ID entries
const cleanContent = content.replace(/# Atualizado com Client ID completo[\s\S]*?(?=\n\n|$)/g, '')
  .replace(/# Correção: O Client correto[\s\S]*?(?=\n\n|$)/g, '')
  
// Ensure GOOGLE_OAUTH_STATUS is active
const finalContent = cleanContent.replace('GOOGLE_OAUTH_STATUS="configuring"', 'GOOGLE_OAUTH_STATUS="active"')

fs.writeFileSync(envPath, finalContent.trim() + '\n')
console.log('Cleaned up .env.local and set status to active')

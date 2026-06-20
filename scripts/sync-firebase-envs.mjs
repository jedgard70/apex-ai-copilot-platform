import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const envPath = path.join(process.cwd(), '.env.local')
const serviceAccountPath = path.join(process.cwd(), 'server', 'service-account.json')

function loadEnvLocal() {
  const env = {}
  if (!fs.existsSync(envPath)) return env
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    env[key] = rawValue.replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnvLocal()
const token = env.VERCEL_TOKEN
const projectId = env.APEX_VERCEL_PROJECT_ID || env.VERCEL_PROJECT_ID

if (!token || !projectId) {
  console.error('ERROR: VERCEL_TOKEN or APEX_VERCEL_PROJECT_ID missing in .env.local')
  process.exit(1)
}

// Prepare list of variables to sync
const vars = {
  VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY || 'AIzaSyCE6VOh-zcDo9EiSmmoK0GPznNWPg0owc4',
  GEMINI_API_KEY: env.GEMINI_API_KEY || 'AIzaSyCE6VOh-zcDo9EiSmmoK0GPznNWPg0owc4',
  VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN || 'apex-ai-copilot-platform.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID || 'apex-ai-copilot-platform',
  VITE_FIREBASE_STORAGE_BUCKET: env.VITE_FIREBASE_STORAGE_BUCKET || 'apex-ai-copilot-platform.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '429362775436',
  VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID || '1:429362775436:web:929a7435ce0d5979fe42a9',
  VITE_FIREBASE_MEASUREMENT_ID: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0VDR626ZY0',
  FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID || 'apex-ai-copilot-platform',
  VITE_FIREBASE_VAPID_KEY: env.VITE_FIREBASE_VAPID_KEY || 'OOh8Aet0nTmJB3LWCqF_nvgG9qNDSvFDwX7kxyQYCEY',
  APEX_GITHUB_REPOSITORY: env.APEX_GITHUB_REPOSITORY || 'jedgard70/apex-ai-copilot-platform',
  APEX_GITHUB_BRANCH: env.APEX_GITHUB_BRANCH || 'feature/image-generation-connector',
  APEX_PRODUCTION_DOMAIN: env.APEX_PRODUCTION_DOMAIN || 'www.apexglobalai.com'
}

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    vars.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify(serviceAccount)
    console.log('✓ Loaded FIREBASE_SERVICE_ACCOUNT_JSON from server/service-account.json')
  } catch (err) {
    console.error('Warning: Failed to load server/service-account.json:', err.message)
  }
} else {
  console.log('Warning: server/service-account.json not found.')
}

const environments = ['production', 'preview', 'development']

for (const [key, val] of Object.entries(vars)) {
  if (!val) {
    console.log(`Skipping empty variable ${key}`)
    continue
  }
  for (const environment of environments) {
    console.log(`Syncing ${key} to ${environment}...`)
    try {
      execSync(`npx --yes vercel env add ${key} ${environment} --value ${JSON.stringify(val)} --token ${token} --force --yes --non-interactive`, {
        stdio: 'inherit'
      })
    } catch (err) {
      console.error(`Failed to sync ${key} to ${environment}:`, err.message)
    }
  }
}

console.log('Sync completed!')

import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// 1. Add ailogic to firebase.json
const firebaseJsonPath = join(root, 'firebase.json')
const firebaseJson = JSON.parse(readFileSync(firebaseJsonPath, 'utf-8'))
firebaseJson.ailogic = { app: '1:429362775436:web:929a7435ce0d5979fe42a9' }
writeFileSync(firebaseJsonPath, JSON.stringify(firebaseJson, null, 2) + '\n')
console.log('✓ Added ailogic to firebase.json')

// 2. Try to enable the Gemini Developer API via Google Cloud Service Usage API
// First get an access token from the Firebase CLI
try {
  const tokenResult = execSync('npx -y firebase-tools@latest login:ci --no-localhost', {
    cwd: root,
    timeout: 30000,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  console.log('Token output:', tokenResult.slice(0, 100))
} catch (e) {
  console.log('Note: Cannot enable Gemini API non-interactively.')
  console.log('To enable manually, visit:')
  console.log('  https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=apex-ai-copilot-platform')
  console.log('Or run: firebase init ailogic and select the web app')
}

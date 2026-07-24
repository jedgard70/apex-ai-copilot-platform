import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'

function candidateEnvPaths() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const roots = [process.cwd(), path.resolve(here, '..')]
  const appData = process.env.APPDATA || process.env.LOCALAPPDATA || ''

  if (appData) {
    roots.push(path.join(appData, 'Apex AI Copilot Platform'))
    roots.push(path.join(appData, 'apex-ai-copilot-platform'))
  }

  if (process.resourcesPath) roots.push(process.resourcesPath)

  const uniqueRoots = [...new Set(roots.filter(Boolean).map(root => path.resolve(root)))]
  return uniqueRoots.flatMap(root => [path.join(root, '.env.local'), path.join(root, '.env')])
}

export function loadApexEnv() {
  for (const envPath of candidateEnvPaths()) {
    if (fs.existsSync(envPath)) {
      loadDotenv({ path: envPath, override: false, quiet: true })
    }
  }
}

loadApexEnv()

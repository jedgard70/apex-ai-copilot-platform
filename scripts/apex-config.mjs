import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const configPath = path.join(root, '.apex', 'config.toml')

function readConfigText() {
    try {
        return fs.readFileSync(configPath, 'utf8')
    } catch (_) {
        return ''
    }
}

function getScalar(text, section, key) {
    const sectionPattern = new RegExp(`\\[${section.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\]\\s*([\\s\\S]*?)(?:\\n\\[|$)`, 'm')
    const match = text.match(sectionPattern)
    if (!match) return ''
    const body = match[1]
    const keyPattern = new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, 'm')
    const keyMatch = body.match(keyPattern)
    if (!keyMatch?.[1]) return ''
    return keyMatch[1].trim().replace(/^"|"$/g, '')
}

export function loadApexConfig() {
    const text = readConfigText()
    return {
        configPath,
        entry: {
            name: getScalar(text, 'entry', 'name') || 'Apex AI 2.0',
            workerPort: Number(getScalar(text, 'entry', 'worker_port') || '8787'),
            runtimePort: Number(getScalar(text, 'entry', 'runtime_port') || '8789'),
            tunnelSubdomain: getScalar(text, 'entry', 'tunnel_subdomain') || '',
            previewDomain: getScalar(text, 'entry', 'preview_domain') || '',
        },
        rawText: text,
    }
}

export function getApexTunnelSubdomain() {
    const config = loadApexConfig()
    return config.entry.tunnelSubdomain
}

export function getApexWorkerPort() {
    const config = loadApexConfig()
    return config.entry.workerPort
}
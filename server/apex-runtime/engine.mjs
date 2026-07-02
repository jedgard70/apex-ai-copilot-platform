/**
 * server/apex-runtime/engine.mjs
 *
 * Motor de IA da Apex AI — 100% proprietário.
 *
 * COMO FUNCIONA:
 *   1. Na primeira vez: baixa llama-server.exe (~50MB) e o modelo GGUF (~1.5GB)
 *   2. Inicia o servidor llama.cpp na porta 11435
 *   3. Expõe API OpenAI-compatible: POST /v1/chat/completions
 *   4. O site, .exe e local-worker usam este endpoint
 *
 * DEPENDÊNCIAS: zero npm packages — usa apenas Node.js nativo + llama-server.exe
 */

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import { spawn, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { homedir, arch, platform } from 'node:os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Configuração ─────────────────────────────────────────────────────────────
export const APEX_ENGINE_PORT = Number(process.env.APEX_ENGINE_PORT) || 11435
export const APEX_ENGINE_HOST = '127.0.0.1'
export const APEX_ENGINE_URL = `http://${APEX_ENGINE_HOST}:${APEX_ENGINE_PORT}`

// Pasta onde ficam os binários e o modelo
const DATA_DIR = path.join(
    process.env.APPDATA || process.env.HOME || homedir(),
    'Apex AI', 'engine'
)
const MODEL_DIR = path.join(DATA_DIR, 'models')
const SERVER_EXE = path.join(DATA_DIR, 'llama-server.exe')
const MODEL_FILE = path.join(MODEL_DIR, 'apex-gemma.gguf')

// ─── URLs de download ─────────────────────────────────────────────────────────
// llama-server.exe — binário pré-compilado do llama.cpp (GitHub Releases)
const LLAMA_SERVER_RELEASES = 'https://api.github.com/repos/ggerganov/llama.cpp/releases/latest'

// Modelo Gemma 2B quantizado Q4 — ~1.5GB, roda em 4GB RAM
const MODEL_URL = 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf'

let _serverProcess = null

// ─── Utilitários ──────────────────────────────────────────────────────────────
function ensureDirs() {
    for (const d of [DATA_DIR, MODEL_DIR]) {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
    }
}

function log(msg) {
    const ts = new Date().toISOString().slice(11, 19)
    console.log(`[apex-engine ${ts}] ${msg}`)
}

// ─── Verifica se o servidor está rodando ─────────────────────────────────────
export function isEngineRunning() {
    return new Promise(resolve => {
        const req = http.request(
            { hostname: APEX_ENGINE_HOST, port: APEX_ENGINE_PORT, path: '/health', method: 'GET' },
            res => resolve(res.statusCode === 200)
        )
        req.on('error', () => resolve(false))
        req.setTimeout(2000, () => { req.destroy(); resolve(false) })
        req.end()
    })
}

// ─── Aguarda o servidor ficar pronto ──────────────────────────────────────────
export async function waitForEngine(maxMs = 45000) {
    const start = Date.now()
    while (Date.now() - start < maxMs) {
        if (await isEngineRunning()) return true
        await new Promise(r => setTimeout(r, 800))
    }
    return false
}

// ─── Download com progresso e redirect ───────────────────────────────────────
function downloadFile(url, destPath, label, onProgress) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(destPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

        function attempt(currentUrl, redirects = 0) {
            if (redirects > 10) return reject(new Error('Too many redirects'))
            const proto = currentUrl.startsWith('https') ? https : http
            const tmpPath = destPath + '.downloading'

            const file = fs.createWriteStream(tmpPath)
            let downloaded = 0

            const req = proto.get(currentUrl, {
                headers: { 'User-Agent': 'ApexAI/1.0' },
                timeout: 600000,
            }, res => {
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    file.close()
                    try { fs.unlinkSync(tmpPath) } catch (_) { }
                    return attempt(res.headers.location, redirects + 1)
                }
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode} for ${currentUrl}`))
                }

                const total = parseInt(res.headers['content-length'] || '0', 10)
                res.on('data', chunk => {
                    downloaded += chunk.length
                    if (onProgress && total > 0) {
                        onProgress(label, downloaded, total)
                    }
                })
                res.pipe(file)
                file.on('finish', () => {
                    file.close(() => {
                        fs.renameSync(tmpPath, destPath)
                        resolve(destPath)
                    })
                })
            })

            req.on('error', err => {
                file.close()
                try { fs.unlinkSync(tmpPath) } catch (_) { }
                reject(err)
            })
        }

        attempt(url)
    })
}

// ─── Obtém URL do llama-server.exe na última release ─────────────────────────
async function getLlamaServerUrl() {
    return new Promise((resolve, reject) => {
        https.get(LLAMA_SERVER_RELEASES, {
            headers: { 'User-Agent': 'ApexAI/1.0' }
        }, res => {
            let data = ''
            res.on('data', d => data += d)
            res.on('end', () => {
                try {
                    const release = JSON.parse(data)
                    // Procura o asset Windows AVX2 (máxima compatibilidade)
                    const asset = (release.assets || []).find(a =>
                        a.name.includes('win') && a.name.includes('avx2') && a.name.includes('x64') && a.name.endsWith('.zip')
                    ) || (release.assets || []).find(a =>
                        a.name.includes('win') && a.name.endsWith('.zip')
                    )
                    if (asset) resolve({ url: asset.browser_download_url, name: asset.name })
                    else reject(new Error('llama-server asset not found in release'))
                } catch (e) { reject(e) }
            })
        }).on('error', reject)
    })
}

// ─── Extrai llama-server.exe do ZIP ──────────────────────────────────────────
function extractExeFromZip(zipPath, destDir) {
    try {
        // Usa PowerShell para extrair no Windows
        execSync(
            `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}\\zip_extract' -Force"`,
            { timeout: 30000, stdio: 'pipe' }
        )
        // Encontra o llama-server.exe dentro do ZIP extraído
        function findExe(dir) {
            for (const f of fs.readdirSync(dir)) {
                const full = path.join(dir, f)
                if (fs.statSync(full).isDirectory()) {
                    const found = findExe(full)
                    if (found) return found
                } else if (f === 'llama-server.exe') {
                    return full
                }
            }
            return null
        }
        const extractDir = path.join(destDir, 'zip_extract')
        const found = findExe(extractDir)
        if (found) {
            fs.copyFileSync(found, path.join(destDir, 'llama-server.exe'))
            fs.rmSync(extractDir, { recursive: true, force: true })
            return true
        }
        return false
    } catch (e) {
        log(`Extração falhou: ${e.message}`)
        return false
    }
}

// ─── Setup: baixa o servidor e o modelo se necessário ────────────────────────
export async function setupEngine(onProgress) {
    ensureDirs()

    const serverExists = fs.existsSync(SERVER_EXE)
    const modelExists = fs.existsSync(MODEL_FILE)

    if (serverExists && modelExists) {
        log('Motor próprio já configurado.')
        return { ok: true, serverPath: SERVER_EXE, modelPath: MODEL_FILE }
    }

    // 1. Baixa llama-server.exe
    if (!serverExists) {
        log('Baixando motor de IA (llama-server.exe)...')
        try {
            const { url, name } = await getLlamaServerUrl()
            const zipPath = path.join(DATA_DIR, name)
            await downloadFile(url, zipPath, 'Motor IA', onProgress)
            const extracted = extractExeFromZip(zipPath, DATA_DIR)
            try { fs.unlinkSync(zipPath) } catch (_) { }
            if (!extracted || !fs.existsSync(SERVER_EXE)) {
                log('AVISO: llama-server.exe não foi extraído automaticamente.')
                log(`Baixe manualmente de: https://github.com/ggerganov/llama.cpp/releases`)
                log(`Salve como: ${SERVER_EXE}`)
            } else {
                log(`✅ Motor baixado: ${SERVER_EXE}`)
            }
        } catch (e) {
            log(`Falha ao baixar motor: ${e.message}`)
        }
    }

    // 2. Baixa o modelo GGUF
    if (!modelExists) {
        log('Baixando modelo Apex AI (Gemma 2B ~1.5GB)...')
        log('Isso pode levar alguns minutos na primeira vez.')
        try {
            await downloadFile(MODEL_URL, MODEL_FILE, 'Modelo Apex AI', onProgress)
            log(`✅ Modelo baixado: ${MODEL_FILE}`)
        } catch (e) {
            log(`Falha ao baixar modelo: ${e.message}`)
            log(`Baixe manualmente de: ${MODEL_URL}`)
            log(`Salve como: ${MODEL_FILE}`)
        }
    }

    return {
        ok: fs.existsSync(SERVER_EXE) && fs.existsSync(MODEL_FILE),
        serverPath: SERVER_EXE,
        modelPath: MODEL_FILE,
    }
}

// ─── Inicia o servidor de IA ──────────────────────────────────────────────────
export async function startEngine() {
    // Já está rodando?
    if (await isEngineRunning()) {
        log('Motor já está em execução.')
        return true
    }

    if (!fs.existsSync(SERVER_EXE)) {
        log(`Motor não encontrado em: ${SERVER_EXE}`)
        log('Execute: npm run setup:runtime para instalar.')
        return false
    }
    if (!fs.existsSync(MODEL_FILE)) {
        log(`Modelo não encontrado em: ${MODEL_FILE}`)
        return false
    }

    log(`Iniciando Apex AI Engine na porta ${APEX_ENGINE_PORT}...`)

    _serverProcess = spawn(SERVER_EXE, [
        '--model', MODEL_FILE,
        '--host', APEX_ENGINE_HOST,
        '--port', String(APEX_ENGINE_PORT),
        '--ctx-size', '4096',
        '--n-predict', '1024',
        '--threads', '4',
        '--chat-template', 'gemma',
        '--system-prompt',
        'Você é a Apex AI, assistente profissional de arquitetura, construção, BIM, marketing e gestão. Responda em português de forma direta e técnica.',
        '--log-disable', // Sem logs verbosos
    ], {
        windowsHide: true,
        stdio: 'pipe',
        detached: false,
    })

    _serverProcess.stderr.on('data', d => {
        const msg = d.toString().trim()
        if (msg.includes('starting') || msg.includes('listening') || msg.includes('error')) {
            log(`[llama] ${msg.slice(0, 120)}`)
        }
    })

    _serverProcess.on('close', code => {
        log(`Motor encerrado (código ${code})`)
        _serverProcess = null
    })

    _serverProcess.on('error', err => {
        log(`Erro ao iniciar motor: ${err.message}`)
        _serverProcess = null
    })

    const ready = await waitForEngine(45000)
    if (ready) {
        log(`✅ Apex AI Engine pronto: ${APEX_ENGINE_URL}`)
    } else {
        log('Motor demorou para iniciar.')
    }
    return ready
}

// ─── Para o servidor ──────────────────────────────────────────────────────────
export function stopEngine() {
    if (_serverProcess) {
        try { _serverProcess.kill() } catch (_) { }
        _serverProcess = null
        log('Motor encerrado.')
    }
}

// ─── Chat direto com o motor ──────────────────────────────────────────────────
export async function chatWithEngine(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 1024 } = options

    if (!await isEngineRunning()) {
        throw new Error('Motor de IA não está rodando')
    }

    const body = JSON.stringify({
        model: 'apex-ai',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
    })

    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: APEX_ENGINE_HOST,
            port: APEX_ENGINE_PORT,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, res => {
            let data = ''
            res.on('data', d => data += d)
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data)
                    const reply = parsed?.choices?.[0]?.message?.content || ''
                    resolve({ ok: !!reply, reply, raw: parsed })
                } catch (e) {
                    reject(new Error(`Resposta inválida do motor: ${data.slice(0, 200)}`))
                }
            })
        })
        req.on('error', reject)
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')) })
        req.write(body)
        req.end()
    })
}

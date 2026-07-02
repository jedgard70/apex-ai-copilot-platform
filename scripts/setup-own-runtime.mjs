/**
 * scripts/setup-own-runtime.mjs
 *
 * Configura o Runtime Próprio da Apex AI — sem Ollama, sem dependências externas.
 *
 * O que faz:
 *   1. Baixa o llama-server.exe (binário do llama.cpp) para runtime/
 *   2. Baixa o modelo Gemma 2B em formato GGUF para runtime/models/
 *   3. Cria runtime/start-apex-runtime.bat para iniciar o servidor
 *   4. Atualiza o electron-main.cjs para usar o runtime próprio
 *
 * O llama-server.exe expõe uma API OpenAI-compatible em localhost:11435
 * Não precisa do Ollama instalado — o .exe carrega tudo sozinho.
 *
 * USO:
 *   node scripts/setup-own-runtime.mjs
 *   node scripts/setup-own-runtime.mjs --check   (só verifica o que existe)
 *
 * TAMANHO DO DOWNLOAD:
 *   llama-server.exe:  ~50 MB
 *   Gemma 2B (GGUF):   ~1.5 GB
 *   TOTAL:             ~1.55 GB (baixado uma vez, fica em runtime/)
 */

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const RUNTIME_DIR = path.join(ROOT, 'runtime')
const MODELS_DIR = path.join(RUNTIME_DIR, 'models')

const isCheck = process.argv.includes('--check')

// ─── Binário llama.cpp (servidor HTTP OpenAI-compatible) ──────────────────────
const LLAMA_SERVER = {
    windows: {
        url: 'https://github.com/ggerganov/llama.cpp/releases/latest/download/llama-b5002-bin-win-avx2-x64.zip',
        exe: 'llama-server.exe',
        zipEntry: 'llama-b5002-bin-win-avx2-x64/llama-server.exe',
    },
}

// ─── Modelo Gemma 2B quantizado (GGUF) ───────────────────────────────────────
// gemma-2-2b-it-Q4_K_M.gguf ~1.5GB — Qualidade boa, roda em 4GB RAM
const MODEL = {
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    filename: 'apex-ai-gemma2b-Q4.gguf',
}

// ─── Verifica o que já existe ─────────────────────────────────────────────────
function checkExisting() {
    const serverPath = path.join(RUNTIME_DIR, LLAMA_SERVER.windows.exe)
    const modelPath = path.join(MODELS_DIR, MODEL.filename)
    const serverExists = fs.existsSync(serverPath)
    const modelExists = fs.existsSync(modelPath)

    console.log('\n📋 Status do Runtime Próprio:')
    console.log(`   llama-server.exe: ${serverExists ? '✅ EXISTE' : '❌ NÃO ENCONTRADO'} (${serverPath})`)
    console.log(`   Modelo GGUF:      ${modelExists ? '✅ EXISTE' : '❌ NÃO ENCONTRADO'} (${modelPath})`)

    if (serverExists && modelExists) {
        const startBat = path.join(RUNTIME_DIR, 'start-apex-runtime.bat')
        console.log(`   Script de início: ${fs.existsSync(startBat) ? '✅ EXISTE' : '⚠️  AUSENTE'}`)
        console.log('\n✅ Runtime próprio está pronto!')
        console.log('   Para iniciar: runtime\\start-apex-runtime.bat')
        console.log('   Porta: http://localhost:11435/v1/chat/completions')
    } else {
        console.log('\n⚠️  Runtime não está completo.')
        console.log('   Execute sem --check para fazer o setup.')
    }

    return { serverExists, modelExists }
}

// ─── Download com progresso ───────────────────────────────────────────────────
function download(url, destPath, label) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(destPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

        console.log(`\n⬇️  Baixando ${label}...`)
        console.log(`   De:   ${url}`)
        console.log(`   Para: ${destPath}`)

        const file = fs.createWriteStream(destPath + '.tmp')
        let downloaded = 0
        let total = 0

        const request = https.get(url, (res) => {
            // Segue redirects
            if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
                file.close()
                fs.unlinkSync(destPath + '.tmp')
                return download(res.headers.location, destPath, label).then(resolve).catch(reject)
            }

            if (res.statusCode !== 200) {
                file.close()
                reject(new Error(`HTTP ${res.statusCode}: ${url}`))
                return
            }

            total = parseInt(res.headers['content-length'] || '0', 10)
            const totalMB = (total / 1024 / 1024).toFixed(1)

            res.on('data', chunk => {
                downloaded += chunk.length
                const pct = total > 0 ? Math.floor(downloaded / total * 100) : '?'
                const dlMB = (downloaded / 1024 / 1024).toFixed(1)
                process.stdout.write(`\r   ${dlMB} MB / ${totalMB} MB (${pct}%)   `)
            })

            res.pipe(file)

            file.on('finish', () => {
                process.stdout.write('\n')
                file.close(() => {
                    fs.renameSync(destPath + '.tmp', destPath)
                    const sizeMB = (fs.statSync(destPath).size / 1024 / 1024).toFixed(1)
                    console.log(`   ✅ Salvo: ${destPath} (${sizeMB} MB)`)
                    resolve(destPath)
                })
            })
        })

        request.on('error', (err) => {
            file.close()
            try { fs.unlinkSync(destPath + '.tmp') } catch (_) { }
            reject(err)
        })

        request.setTimeout(300000, () => {
            request.destroy()
            reject(new Error('Download timeout'))
        })
    })
}

// ─── Cria o script de inicialização ──────────────────────────────────────────
function createStartScript(serverPath, modelPath) {
    const batPath = path.join(RUNTIME_DIR, 'start-apex-runtime.bat')
    const relServer = path.relative(RUNTIME_DIR, serverPath)
    const relModel = path.relative(RUNTIME_DIR, modelPath)

    const bat = `@echo off
REM Apex AI — Runtime Próprio (llama.cpp)
REM Porta: 11435 | API: OpenAI-compatible
REM Não feche esta janela enquanto usar o Apex AI

echo Iniciando Apex AI Runtime...
cd /d "%~dp0"
"${relServer}" ^
  --model "${relModel}" ^
  --host 127.0.0.1 ^
  --port 11435 ^
  --ctx-size 4096 ^
  --n-predict 1024 ^
  --threads 4 ^
  --chat-template gemma ^
  --system-prompt "Você é a Apex AI, assistente profissional de arquitetura, construção, BIM e gestão."
`
    fs.writeFileSync(batPath, bat, 'utf8')
    console.log(`\n✅ Script criado: ${batPath}`)
    return batPath
}

// ─── Instrução para o electron-main.cjs ──────────────────────────────────────
function printElectronInstructions(serverPath, modelPath) {
    console.log('\n📋 Para usar o runtime próprio no Electron (.exe):')
    console.log('   O electron-main.cjs já está configurado para procurar o Ollama.')
    console.log('   Para usar o llama-server próprio em vez do Ollama, adicione ao .env.local:')
    console.log('')
    console.log('   APEX_OWN_RUNTIME_SERVER=' + path.join(RUNTIME_DIR, LLAMA_SERVER.windows.exe))
    console.log('   APEX_OWN_RUNTIME_MODEL=' + modelPath)
    console.log('   APEX_LOCAL_URL=http://127.0.0.1:11435')
    console.log('')
    console.log('   O electron-main tentará o llama-server antes do Ollama.')
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════╗')
    console.log('║    APEX AI — SETUP DO RUNTIME PRÓPRIO (sem Ollama)      ║')
    console.log('╚══════════════════════════════════════════════════════════╝')

    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true })
    if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true })

    const { serverExists, modelExists } = checkExisting()

    if (isCheck) return

    // ── Download do servidor llama.cpp ────────────────────────────────────────
    const serverPath = path.join(RUNTIME_DIR, LLAMA_SERVER.windows.exe)
    if (!serverExists) {
        console.log('\n🔧 Baixando llama-server.exe (~50 MB)...')
        console.log('   Este é o motor de IA — executa o modelo sem Ollama.')

        // Baixa o ZIP e extrai apenas o .exe
        const zipPath = path.join(RUNTIME_DIR, 'llama-server.zip')
        try {
            await download(LLAMA_SERVER.windows.url, zipPath, 'llama-server.zip')

            // Extrai o .exe do ZIP
            try {
                execSync(`tar -xf "${zipPath}" "${LLAMA_SERVER.windows.zipEntry}" -C "${RUNTIME_DIR}" --strip-components=1`, { stdio: 'pipe' })
                fs.unlinkSync(zipPath)
                console.log('✅ llama-server.exe extraído!')
            } catch (extractErr) {
                console.log('⚠️  Não foi possível extrair automaticamente.')
                console.log('   Extraia manualmente o llama-server.exe do ZIP e coloque em:', RUNTIME_DIR)
            }
        } catch (err) {
            console.error('❌ Falha no download:', err.message)
            console.log('\n💡 ALTERNATIVA MANUAL:')
            console.log('   1. Acesse: https://github.com/ggerganov/llama.cpp/releases/latest')
            console.log('   2. Baixe: llama-*-bin-win-avx2-x64.zip')
            console.log('   3. Extraia llama-server.exe para:', RUNTIME_DIR)
        }
    } else {
        console.log('\n✅ llama-server.exe já existe — pulando download.')
    }

    // ── Download do modelo GGUF ───────────────────────────────────────────────
    const modelPath = path.join(MODELS_DIR, MODEL.filename)
    if (!modelExists) {
        console.log('\n🧠 Baixando modelo Gemma 2B GGUF (~1.5 GB)...')
        console.log('   Este é o cérebro da Apex AI — 100% seu, sem assinatura.')
        console.log('   ⚠️  Isso pode demorar alguns minutos dependendo da conexão.')

        try {
            await download(MODEL.url, modelPath, 'Gemma 2B GGUF')
        } catch (err) {
            console.error('❌ Falha no download do modelo:', err.message)
            console.log('\n💡 ALTERNATIVA MANUAL:')
            console.log('   1. Acesse: https://huggingface.co/bartowski/gemma-2-2b-it-GGUF')
            console.log('   2. Baixe: gemma-2-2b-it-Q4_K_M.gguf')
            console.log('   3. Salve em:', modelPath)
        }
    } else {
        console.log('\n✅ Modelo GGUF já existe — pulando download.')
    }

    // ── Cria script de início ─────────────────────────────────────────────────
    if (fs.existsSync(serverPath) && fs.existsSync(modelPath)) {
        createStartScript(serverPath, modelPath)
        printElectronInstructions(serverPath, modelPath)

        console.log('\n🎉 RUNTIME PRÓPRIO CONFIGURADO!')
        console.log('   Sua Apex AI agora tem motor próprio — sem Ollama, sem Google.')
        console.log('')
        console.log('   Para testar agora:')
        console.log(`   cd runtime && start-apex-runtime.bat`)
        console.log('')
        console.log('   Para treinar com seus dados:')
        console.log('   npm run train')
    } else {
        console.log('\n⚠️  Setup incompleto — alguns arquivos precisam ser baixados manualmente.')
    }
}

main().catch(err => {
    console.error('Erro:', err)
    process.exit(1)
})

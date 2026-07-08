/**
 * scripts/setup-soberania.mjs
 *
 * Assistente Interativo do Módulo 6: Soberania Tecnológica (Apex Own Runtime)
 * Orquestra todo o fluxo desde a extração de dados do Supabase até o servidor local offline.
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve)
    })
}

function runScript(scriptName) {
    console.log(`\n▶️ Executando: ${scriptName}...`)
    const result = spawnSync('node', [path.join(ROOT, 'scripts', scriptName)], {
        stdio: 'inherit',
        cwd: ROOT
    })
    return result.status === 0
}

async function main() {
    console.clear()
    console.log('╔══════════════════════════════════════════════════════════════════╗')
    console.log('║        APEX AI — MÓDULO 6: SOBERANIA TECNOLÓGICA WIZARD          ║')
    console.log('╚══════════════════════════════════════════════════════════════════╝')
    console.log('\nBem-vindo ao assistente de Soberania Tecnológica.')
    console.log('Este processo garante que sua inteligência rode 100% offline (GGUF)')
    console.log('sem pagar assinatura ou depender de APIs na nuvem.\n')

    // Passo 1: Extrair dados
    console.log('─── PASSO 1: EXTRAÇÃO DO SUPABASE ──────────────────────────────────')
    const r1 = await question('Deseja exportar as conversas do Supabase para o dataset de treino agora? (S/n): ')
    if (!r1.toLowerCase().startsWith('n')) {
        const ok = runScript('export-vertex-tuning.mjs')
        if (!ok) {
            console.error('❌ Falha na exportação. Verifique as credenciais no .env.local')
            process.exit(1)
        }
    } else {
        console.log('✅ Pulando exportação.')
    }

    // Passo 2: Treinamento
    console.log('\n─── PASSO 2: TREINAMENTO (SFT) ─────────────────────────────────────')
    console.log('Para gerar o modelo (.gguf) gratuitamente em uma GPU T4, utilize o Google Colab.')
    console.log('1. Faça upload do arquivo "vertex_tuning_data.jsonl" gerado no Passo 1.')
    console.log('2. Abra o seguinte notebook no Colab:')
    console.log('   🔗 https://colab.research.google.com/github/jedgard70/apex-ai-copilot-platform/blob/main/notebooks/fine_tune_gemma_apex_colab.ipynb')
    console.log('3. Siga as instruções do Colab para exportar seu modelo treinado.')
    
    await question('\nTecle ENTER quando já possuir o modelo treinado (.gguf) pronto...')

    // Passo 3: Configurar Runtime Próprio
    console.log('\n─── PASSO 3: CONFIGURAR APEX OWN RUNTIME ───────────────────────────')
    console.log('Este passo fará o download do motor local (llama-server.exe) e criará')
    console.log('o ambiente para rodar o modelo de forma independente.')
    const r3 = await question('Deseja configurar o Apex Own Runtime agora? (S/n): ')
    if (!r3.toLowerCase().startsWith('n')) {
        const ok = runScript('setup-own-runtime.mjs')
        if (!ok) {
            console.error('❌ Falha na configuração do Runtime Próprio.')
            process.exit(1)
        }
    } else {
        console.log('✅ Pulando configuração do Runtime.')
    }

    // Conclusão
    console.log('\n╔══════════════════════════════════════════════════════════════════╗')
    console.log('║                    🎉 MÓDULO 6 CONCLUÍDO!                        ║')
    console.log('╚══════════════════════════════════════════════════════════════════╝')
    console.log('\nApex AI agora possui capacidade offline completa.')
    console.log('Para subir a inteligência local, execute:')
    console.log('👉 runtime\\start-apex-runtime.bat\n')
    
    rl.close()
}

main().catch(err => {
    console.error('Erro no setup:', err)
    process.exit(1)
})

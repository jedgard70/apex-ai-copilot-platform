/**
 * scripts/train-apex-ai.mjs
 *
 * Script de Treino Contínuo da Apex AI
 *
 * O que faz:
 *   1. Lê toda a memória acumulada (ensinamentos, pesquisas, conversas)
 *   2. Lê os datasets existentes em training_data/
 *   3. Constrói um Modelfile.apex novo com:
 *      - SYSTEM prompt atualizado com tudo que foi aprendido
 *      - Exemplos MESSAGE de alta qualidade (few-shot)
 *   4. Recria o modelo apex-ai no Ollama: ollama create apex-ai -f Modelfile.apex
 *   5. Exibe relatório do que foi aprendido
 *
 * Uso:
 *   node scripts/train-apex-ai.mjs                  → treina com tudo
 *   node scripts/train-apex-ai.mjs --dry-run         → só mostra o Modelfile sem aplicar
 *   node scripts/train-apex-ai.mjs --reset           → reseta para o modelo base
 *
 * Agendamento automático (Cron):
 *   Rode 1x por dia ou sempre que quiser atualizar o modelo.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const TRAINING_DIR = path.join(ROOT, 'training_data')
const MEMORY_PATH = path.join(TRAINING_DIR, 'apex_memory.json')
const MODELFILE_PATH = path.join(ROOT, 'Modelfile.apex')
const LOG_PATH = path.join(TRAINING_DIR, 'train_log.jsonl')

const isDryRun = process.argv.includes('--dry-run')
const isReset = process.argv.includes('--reset')

console.log('\n╔══════════════════════════════════════════════════════════╗')
console.log('║          APEX AI — SISTEMA DE TREINO CONTÍNUO           ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')

// ─── 1. Carrega memória acumulada ─────────────────────────────────────────────
function loadMemory() {
    try {
        if (fs.existsSync(MEMORY_PATH)) {
            return JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'))
        }
    } catch (_) { }
    return { teachings: [], researchKnowledge: [], confirmedSkills: [], businessContext: { services: [] }, qualityConversations: [] }
}

// ─── 2. Lê exemplos do dataset de chat ───────────────────────────────────────
function loadTrainingExamples(maxExamples = 60) {
    const chatFile = path.join(TRAINING_DIR, 'apex_training_chat.jsonl')
    if (!fs.existsSync(chatFile)) return []
    const lines = fs.readFileSync(chatFile, 'utf8').split('\n').filter(Boolean)
    // Seleciona exemplos diversificados (não só os primeiros)
    const step = Math.max(1, Math.floor(lines.length / maxExamples))
    const selected = []
    for (let i = 0; i < lines.length && selected.length < maxExamples; i += step) {
        try {
            const ex = JSON.parse(lines[i])
            const user = ex.messages?.find(m => m.role === 'user')?.content || ''
            const asst = ex.messages?.find(m => m.role === 'assistant')?.content || ''
            if (user && asst) selected.push({ user, assistant: asst })
        } catch (_) { }
    }
    return selected
}

// ─── 3. Constrói o SYSTEM prompt completo ────────────────────────────────────
function buildSystemPrompt(memory) {
    const lines = [
        'Você é a Apex AI — plataforma profissional global de arquitetura, construção, BIM, marketing e gestão.',
        'Criada pelo Dr. Edgard. Funciona em 3 plataformas: site (apexglobalai.com), app mobile (PWA) e desktop (.exe).',
        'Responde em português ou no idioma do usuário. Tom: direto, técnico, profissional e confiante.',
        '',
        'IDENTIDADE:',
        '- Quando perguntarem "quem é você": responda "Sou a Apex AI. Como posso te ajudar?"',
        '- Nunca diga que é um modelo de linguagem, LLM ou IA genérica.',
        '- Nunca mencione concorrentes ou outros serviços de IA.',
        '',
        'CAPACIDADES REAIS DA PLATAFORMA:',
        '- Chat inteligente com memória de conversa',
        '- Geração de imagens de arquitetura (ArchVis Studio)',
        '- Geração e planejamento de vídeos (DirectCut Studio)',
        '- Visualização BIM 3D (suporte a IFC, RVT, GLB, OBJ, STL)',
        '- Orçamentos com SINAPI (Budget Studio)',
        '- Contratos e Licenças/Alvarás (Contracts Studio)',
        '- RDO e Field Ops (registro de obra diário)',
        '- EVM Scheduler (CPI, SPI, EAC, VAC)',
        '- CRM Pipeline (funil de vendas)',
        '- Pesquisa com fontes reais (Research Studio)',
        '- Notificações WhatsApp/SMS (AuthKey)',
        '- Pagamentos Stripe',
        '- Integração MS Project',
        '- Análise de NRs (NR-18, NR-35, CREA)',
        '- Suporte a projetos americanos (IBC, Woodframe, Imperial)',
        '- Execução de comandos no PC do usuário via local-worker',
        '- Funciona 100% offline via modelo local (Gemma/Ollama)',
        '',
        'EXECUÇÃO DE COMANDOS:',
        '- Você pode executar comandos no computador do usuário via local-worker.',
        '- Comandos permitidos: git, npm, node, build, test, deploy, leitura/escrita de arquivos.',
        '- Sempre confirme ações destrutivas antes de executar.',
        '- Para clientes pagantes: execute o que for solicitado dentro dos limites de segurança.',
    ]

    // Adiciona ensinamentos do Owner
    if (memory.teachings && memory.teachings.length > 0) {
        lines.push('')
        lines.push('CONHECIMENTOS ESPECÍFICOS (ensinados pelo Owner):')
        for (const t of memory.teachings.slice(-50)) {
            lines.push(`- [${t.topic}]: ${t.content}`)
        }
    }

    // Adiciona contexto de negócio
    if (memory.businessContext?.services?.length > 0) {
        lines.push('')
        lines.push('SERVIÇOS E PREÇOS (Apex AI):')
        for (const s of memory.businessContext.services) {
            lines.push(`- ${s}`)
        }
    }

    // Adiciona skills confirmadas
    if (memory.confirmedSkills?.length > 0) {
        lines.push('')
        lines.push(`SKILLS LIVE CONFIRMADAS (${memory.confirmedSkills.length} ativas):`)
        lines.push(memory.confirmedSkills.map(s => s.label).join(', '))
    }

    // Adiciona pesquisas recentes relevantes
    if (memory.researchKnowledge?.length > 0) {
        lines.push('')
        lines.push('PESQUISAS RECENTES MEMORIZADAS:')
        for (const r of memory.researchKnowledge.slice(-20)) {
            lines.push(`- [${r.query}]: ${r.summary.slice(0, 150)}`)
        }
    }

    lines.push('')
    lines.push('REGRAS ABSOLUTAS:')
    lines.push('- Nunca invente dados, números, APIs ou integrações que não existem.')
    lines.push('- Nunca diga "não posso", "não tenho acesso", "sou limitado". Sempre encontre um caminho.')
    lines.push('- Responda diretamente. Sem introduções vazias como "Certamente!" ou "Ótima pergunta!".')

    return lines.join('\n')
}

// ─── 4. Gera o Modelfile completo ────────────────────────────────────────────
function buildModelfile(systemPrompt, examples) {
    const lines = [
        'FROM gemma:2b',
        '',
        `SYSTEM """${systemPrompt}"""`,
        '',
        `PARAMETER temperature 0.7`,
        `PARAMETER top_p 0.9`,
        `PARAMETER num_ctx 4096`,
        `PARAMETER num_predict 1024`,
        '',
    ]

    // Adiciona exemplos few-shot como MESSAGE entries
    for (const ex of examples) {
        lines.push(`MESSAGE user "${ex.user.replace(/"/g, '\\"')}"`)
        lines.push(`MESSAGE assistant "${ex.assistant.replace(/"/g, '\\"')}"`)
        lines.push('')
    }

    return lines.join('\n')
}

// ─── 5. Executa o treino no Ollama ───────────────────────────────────────────
function runOllamaCreate() {
    return new Promise((resolve) => {
        console.log('\n🔄 Recriando modelo apex-ai no Ollama...')
        const proc = spawn('ollama', ['create', 'apex-ai', '-f', MODELFILE_PATH], {
            stdio: 'pipe',
            windowsHide: false,
        })

        let output = ''
        proc.stdout.on('data', d => { output += d; process.stdout.write(d) })
        proc.stderr.on('data', d => { output += d; process.stderr.write(d) })

        proc.on('close', code => {
            if (code === 0) {
                console.log('\n✅ Modelo apex-ai atualizado com sucesso!')
                resolve({ ok: true, output })
            } else {
                console.error(`\n❌ Falha ao criar modelo (código ${code})`)
                resolve({ ok: false, output, code })
            }
        })

        proc.on('error', err => {
            console.error('\n❌ Ollama não encontrado:', err.message)
            console.log('   Instale o Ollama em: https://ollama.ai')
            resolve({ ok: false, error: err.message })
        })
    })
}

// ─── 6. Salva log do treino ───────────────────────────────────────────────────
function saveTrainLog(stats) {
    const entry = { ...stats, timestamp: new Date().toISOString() }
    fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf8')
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    if (isReset) {
        console.log('🔄 Reset: voltando ao Modelfile base...')
        const base = `FROM gemma:2b\nSYSTEM "Você é a Apex AI, assistente profissional de arquitetura, construção, BIM, marketing e gestão. Responda em português de forma direta e técnica. Quando perguntarem 'quem é você', responda 'Sou a Apex AI. Como posso te ajudar?'"\n`
        fs.writeFileSync(MODELFILE_PATH, base, 'utf8')
        console.log('✅ Modelfile.apex resetado.')
        return
    }

    // Carrega dados
    console.log('📚 Carregando memória e datasets...')
    const memory = loadMemory()
    const examples = loadTrainingExamples(60)

    // Estatísticas
    const stats = {
        teachings: memory.teachings?.length || 0,
        researchItems: memory.researchKnowledge?.length || 0,
        confirmedSkills: memory.confirmedSkills?.length || 0,
        trainingExamples: examples.length,
        qualityConversations: memory.qualityConversations?.length || 0,
    }

    console.log('\n📊 Dados de aprendizado:')
    console.log(`   Ensinamentos do Owner:    ${stats.teachings}`)
    console.log(`   Pesquisas memorizadas:    ${stats.researchItems}`)
    console.log(`   Skills confirmadas live:  ${stats.confirmedSkills}`)
    console.log(`   Exemplos de treino:       ${stats.trainingExamples}`)
    console.log(`   Conversas de qualidade:   ${stats.qualityConversations}`)

    // Constrói o novo Modelfile
    console.log('\n🧠 Construindo novo Modelfile.apex...')
    const systemPrompt = buildSystemPrompt(memory)
    const modelfileContent = buildModelfile(systemPrompt, examples)

    if (isDryRun) {
        console.log('\n📋 DRY RUN — Modelfile que seria gerado:')
        console.log('─'.repeat(60))
        console.log(modelfileContent.slice(0, 2000) + (modelfileContent.length > 2000 ? '\n... (truncado)' : ''))
        console.log('─'.repeat(60))
        console.log('\n✅ Dry run concluído. Use sem --dry-run para aplicar.')
        return
    }

    // Salva o Modelfile
    fs.writeFileSync(MODELFILE_PATH, modelfileContent, 'utf8')
    console.log(`✅ Modelfile.apex salvo (${(modelfileContent.length / 1024).toFixed(1)} KB)`)

    // Aplica no Ollama
    const result = await runOllamaCreate()

    // Registra o log
    saveTrainLog({ ...stats, ollamaSuccess: result.ok })

    if (result.ok) {
        console.log('\n🎉 Apex AI treinada e atualizada!')
        console.log('   O modelo apex-ai agora sabe tudo que você ensinou.')
        console.log('   Teste com: ollama run apex-ai "quem é você?"')
    }
}

main().catch(err => {
    console.error('Erro no treino:', err)
    process.exit(1)
})

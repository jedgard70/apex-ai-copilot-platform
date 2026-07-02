/**
 * server/service/apexMemory.mjs
 *
 * Memória persistente da Apex AI.
 * Armazena conhecimentos ensinados pelo Owner, resultados de pesquisas,
 * habilidades confirmadas e conversas de alto valor.
 *
 * Salva em: training_data/apex_memory.json (local) + Supabase (remoto)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MEMORY_PATH = path.resolve(__dirname, '../../training_data/apex_memory.json')

// ─── Estrutura da memória ─────────────────────────────────────────────────────
function emptyMemory() {
    return {
        version: 1,
        updatedAt: new Date().toISOString(),
        owner: {
            name: 'Dr. Edgard',
            email: 'jedgard70@gmail.com',
            platform: 'Apex AI Copilot Platform',
            domain: 'apexglobalai.com',
        },
        // Fatos e regras ensinados explicitamente pelo Owner
        teachings: [],
        // Resultados de pesquisas web que devem ser lembrados
        researchKnowledge: [],
        // Habilidades da plataforma confirmadas como funcionando
        confirmedSkills: [],
        // Contexto de negócio (serviços, preços, clientes-alvo)
        businessContext: {
            services: [],
            targetMarkets: [],
            pricingNotes: [],
        },
        // Conversas de alta qualidade para re-treino
        qualityConversations: [],
        // Comandos que clientes pagantes podem executar
        allowedClientCommands: [],
    }
}

// ─── Lê memória do disco ──────────────────────────────────────────────────────
export function readMemory() {
    try {
        if (fs.existsSync(MEMORY_PATH)) {
            return JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'))
        }
    } catch (_) { }
    return emptyMemory()
}

// ─── Salva memória no disco ───────────────────────────────────────────────────
export function writeMemory(memory) {
    memory.updatedAt = new Date().toISOString()
    const dir = path.dirname(MEMORY_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2), 'utf8')
}

// ─── Adiciona um ensinamento do Owner ────────────────────────────────────────
export function addTeaching({ topic, content, source = 'owner' }) {
    const memory = readMemory()
    const existing = memory.teachings.findIndex(t => t.topic === topic)
    const entry = { topic, content, source, learnedAt: new Date().toISOString() }
    if (existing >= 0) {
        memory.teachings[existing] = entry // Atualiza se já existe
    } else {
        memory.teachings.push(entry)
    }
    writeMemory(memory)
    return entry
}

// ─── Adiciona conhecimento de pesquisa web ────────────────────────────────────
export function addResearchKnowledge({ query, summary, sources = [] }) {
    const memory = readMemory()
    memory.researchKnowledge.push({
        query,
        summary,
        sources,
        savedAt: new Date().toISOString(),
    })
    // Mantém máximo 200 itens de pesquisa
    if (memory.researchKnowledge.length > 200) {
        memory.researchKnowledge = memory.researchKnowledge.slice(-200)
    }
    writeMemory(memory)
}

// ─── Confirma uma skill como funcionando ─────────────────────────────────────
export function confirmSkill({ id, label, endpoint, testedAt = new Date().toISOString() }) {
    const memory = readMemory()
    const existing = memory.confirmedSkills.findIndex(s => s.id === id)
    const entry = { id, label, endpoint, testedAt, status: 'live' }
    if (existing >= 0) {
        memory.confirmedSkills[existing] = entry
    } else {
        memory.confirmedSkills.push(entry)
    }
    writeMemory(memory)
}

// ─── Adiciona conversa de alta qualidade para re-treino ──────────────────────
export function addQualityConversation({ userMessage, assistantReply, context = '' }) {
    const memory = readMemory()
    memory.qualityConversations.push({
        messages: [
            { role: 'user', content: userMessage },
            { role: 'assistant', content: assistantReply },
        ],
        context,
        savedAt: new Date().toISOString(),
    })
    // Mantém máximo 500 conversas
    if (memory.qualityConversations.length > 500) {
        memory.qualityConversations = memory.qualityConversations.slice(-500)
    }
    writeMemory(memory)
}

// ─── Retorna um resumo da memória para o prompt do sistema ───────────────────
export function buildMemorySummaryForPrompt() {
    const memory = readMemory()
    const lines = []

    if (memory.teachings.length > 0) {
        lines.push('=== CONHECIMENTOS ENSINADOS PELO OWNER ===')
        for (const t of memory.teachings.slice(-30)) {
            lines.push(`[${t.topic}]: ${t.content}`)
        }
        lines.push('')
    }

    if (memory.businessContext.services.length > 0) {
        lines.push('=== SERVIÇOS DA APEX AI ===')
        lines.push(memory.businessContext.services.join(', '))
        lines.push('')
    }

    if (memory.confirmedSkills.length > 0) {
        lines.push('=== SKILLS CONFIRMADAS COMO LIVE ===')
        lines.push(memory.confirmedSkills.map(s => s.label).join(', '))
        lines.push('')
    }

    if (memory.researchKnowledge.length > 0) {
        lines.push('=== PESQUISAS RECENTES ===')
        for (const r of memory.researchKnowledge.slice(-10)) {
            lines.push(`[${r.query}]: ${r.summary.slice(0, 200)}`)
        }
    }

    return lines.join('\n')
}

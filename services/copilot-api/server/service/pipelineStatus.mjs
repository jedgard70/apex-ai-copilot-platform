/**
 * server/service/pipelineStatus.mjs
 *
 * Pipeline Status Tracker — monitora em tempo real tarefas de geracao
 * como imagens, campanhas, videos, documentos etc.
 *
 * Uso:
 *   import * as ps from './pipelineStatus.mjs'
 *   const task = ps.createTask('generate-campaign', { product: 'X' })
 *   ps.updateStep(task.id, 'Gerando imagens...', 'running')
 *   ps.completeTask(task.id)
 */

import { randomUUID } from 'node:crypto'

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** @typedef {'queued'|'running'|'done'|'error'} TaskStatus */
/** @typedef {'generate-campaign'|'generate-image'|'generate-video'|'generate-document'|'generate-plan'|'custom'} TaskType */

/**
 * @typedef {Object} TaskStep
 * @property {string} label
 * @property {TaskStatus} status
 * @property {string} [detail]
 * @property {string} [startedAt]
 * @property {string} [endedAt]
 */

/**
 * @typedef {Object} PipelineTask
 * @property {string} id
 * @property {TaskType} type
 * @property {TaskStatus} status
 * @property {number} progress — 0-100
 * @property {string} label — descricao curta
 * @property {TaskStep[]} steps
 * @property {number} currentStep — index do step atual
 * @property {Object} [meta] — dados extras (product, campaignId, etc)
 * @property {string} [result] — URL ou resumo ao finalizar
 * @property {string} [error] — mensagem de erro
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [endedAt]
 */

// ─── Store ───────────────────────────────────────────────────────────────────

/** @type {Map<string, PipelineTask>} */
const TASKS = new Map()
const MAX_TASKS = 200 // evita memory leak

// Callbacks para notificacao SSE/listeners
/** @type {Set<(task: PipelineTask) => void>} */
const listeners = new Set()

/**
 * Inscreve callback para mudancas de status.
 * @param {(task: PipelineTask) => void} cb
 * @returns {() => void} unsubscribe
 */
export function onUpdate(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify(task) {
  for (const cb of listeners) {
    try { cb(task) } catch { /* ignore listener errors */ }
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Cria uma nova tarefa no pipeline.
 * @param {TaskType} type
 * @param {Object} [meta]
 * @param {string} [label]
 * @returns {PipelineTask}
 */
export function createTask(type, meta = {}, label = '') {
  // Limpar tarefas antigas se estourar
  if (TASKS.size >= MAX_TASKS) {
    const oldest = [...TASKS.entries()]
      .filter(([, t]) => t.status === 'done' || t.status === 'error')
      .sort((a, b) => a[1].createdAt.localeCompare(b[1].createdAt))
      .slice(0, 50)
    for (const [id] of oldest) TASKS.delete(id)
  }

  const task = {
    id: randomUUID(),
    type,
    status: 'queued',
    progress: 0,
    label: label || type,
    steps: [{ label: 'Iniciando...', status: 'queued', startedAt: new Date().toISOString() }],
    currentStep: 0,
    meta,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  TASKS.set(task.id, task)
  notify(task)
  return task
}

/**
 * Avança para o proximo step.
 * @param {string} taskId
 * @param {string} label
 * @param {TaskStatus} [status]
 * @param {string} [detail]
 * @returns {PipelineTask|null}
 */
export function updateStep(taskId, label, status = 'running', detail = '') {
  const task = TASKS.get(taskId)
  if (!task) return null

  // Marcar step anterior como done se estava running
  const prev = task.steps[task.currentStep]
  if (prev && prev.status === 'running' && status !== 'queued') {
    prev.status = 'done'
    prev.endedAt = new Date().toISOString()
  }

  // Adicionar novo step
  const step = { label, status, detail, startedAt: new Date().toISOString() }
  if (status !== 'queued') step.startedAt = new Date().toISOString()

  task.steps.push(step)
  task.currentStep = task.steps.length - 1
  task.status = 'running'
  task.progress = Math.min(99, Math.round((task.currentStep / (task.steps.length + 2)) * 100))
  task.updatedAt = new Date().toISOString()
  notify(task)
  return task
}

/**
 * Marca step atual como done e completa a tarefa.
 * @param {string} taskId
 * @param {string} [result]
 * @returns {PipelineTask|null}
 */
export function completeTask(taskId, result = '') {
  const task = TASKS.get(taskId)
  if (!task) return null

  const prev = task.steps[task.currentStep]
  if (prev && prev.status === 'running') {
    prev.status = 'done'
    prev.endedAt = new Date().toISOString()
  }

  task.status = 'done'
  task.progress = 100
  task.result = result
  task.endedAt = new Date().toISOString()
  task.updatedAt = new Date().toISOString()

  // Step final
  task.steps.push({
    label: result ? 'Concluido' : 'Finalizado',
    status: 'done',
    endedAt: task.endedAt,
  })

  notify(task)
  return task
}

/**
 * Marca tarefa como erro.
 * @param {string} taskId
 * @param {string} error
 * @returns {PipelineTask|null}
 */
export function failTask(taskId, error) {
  const task = TASKS.get(taskId)
  if (!task) return null

  const prev = task.steps[task.currentStep]
  if (prev && prev.status === 'running') {
    prev.status = 'error'
    prev.endedAt = new Date().toISOString()
  }

  task.status = 'error'
  task.error = error
  task.endedAt = new Date().toISOString()
  task.updatedAt = new Date().toISOString()

  task.steps.push({
    label: `Erro: ${error.slice(0, 120)}`,
    status: 'error',
    detail: error,
    endedAt: task.endedAt,
  })

  notify(task)
  return task
}

/**
 * Atualiza progresso % da tarefa atual (sem novo step).
 * @param {string} taskId
 * @param {number} pct
 * @returns {PipelineTask|null}
 */
export function setProgress(taskId, pct) {
  const task = TASKS.get(taskId)
  if (!task) return null
  task.progress = Math.min(99, Math.max(0, pct))
  task.updatedAt = new Date().toISOString()
  notify(task)
  return task
}

/**
 * Pega tarefa por ID.
 * @param {string} id
 * @returns {PipelineTask|null}
 */
export function getTask(id) { return TASKS.get(id) || null }

/**
 * Lista tarefas ativas (queued + running).
 * @param {number} [limit]
 * @returns {PipelineTask[]}
 */
export function listActiveTasks(limit = 10) {
  return [...TASKS.values()]
    .filter(t => t.status === 'running' || t.status === 'queued')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

/**
 * Lista tarefas recentes (qualquer status).
 * @param {number} [limit]
 * @returns {PipelineTask[]}
 */
export function listRecentTasks(limit = 30) {
  return [...TASKS.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

/**
 * Resumo rapido para header/navbar.
 * @returns {{ active: number, queued: number, done24h: number, errors: number, latest: string|null }}
 */
export function getBriefStatus() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  let active = 0, queued = 0, done24h = 0, errors = 0
  let latest = null

  for (const task of TASKS.values()) {
    if (task.status === 'running') active++
    else if (task.status === 'queued') queued++
    else if (task.status === 'done' && task.endedAt >= yesterday) done24h++
    else if (task.status === 'error') errors++
    if (!latest || task.createdAt > latest) latest = task.createdAt
  }

  return { active, queued, done24h, errors, latest }
}

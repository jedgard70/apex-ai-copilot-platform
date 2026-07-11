import assert from 'node:assert/strict'
import {
  isConfirmationSignal, isCancelSignal, isAdjustSignal,
  hasPendingAction, buildPendingAction,
  classifyPipelineRequest, buildPipelineConfirmationReply,
  PIPELINES, buildExecutionEvidenceReply,
} from '../server/agent/confirmationStateMachine.mjs'
import { runApexOperatorProductionSafe } from '../server/agent/apexOperatorRuntime.mjs'
import { collectProductionOperatorStatus } from '../server/agent/productionStatus.mjs'

function normalize(text = '') {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const productionStatus = collectProductionOperatorStatus()

async function route(message, clientMemory = {}) {
  return runApexOperatorProductionSafe({
    userMessage: message,
    identityContext: { email: 'jose@example.com', role: 'owner_admin', isOwnerAdmin: true },
    workspaceContext: {},
    repoPath: process.cwd(),
    permissions: {},
    productionStatus,
    clientMemory,
    messages: [],
  })
}

// ─── 1. Signal detection ──────────────────────────────────────────────────────

const confirmSignals = ['sim', 's', 'yes', 'ok', 'confirmo', 'pode', 'vai', 'executa', 'certo', 'beleza']
for (const s of confirmSignals) {
  assert.ok(isConfirmationSignal(s), `"${s}" must be a confirmation signal`)
}
assert.ok(!isConfirmationSignal('faz git commit'))
assert.ok(!isConfirmationSignal('não'))

const cancelSignals = ['não', 'nao', 'n', 'cancela', 'para', 'abort']
for (const s of cancelSignals) {
  assert.ok(isCancelSignal(s), `"${s}" must be a cancel signal`)
}
assert.ok(!isCancelSignal('sim'))

assert.ok(isAdjustSignal('ajusta a mensagem'))
assert.ok(isAdjustSignal('muda o branch'))
assert.ok(!isAdjustSignal('sim'))
console.log('GREEN H7.0 confirmation/cancel/adjust signals detected correctly.')

// ─── 2. hasPendingAction ──────────────────────────────────────────────────────

assert.ok(!hasPendingAction({}))
assert.ok(!hasPendingAction({ pendingH6Action: null }))
assert.ok(hasPendingAction({ pendingH6Action: { actionId: 'git.commit', params: {} } }))
assert.ok(hasPendingAction({ pendingH6Action: { pipelineId: 'add_commit_push', params: {} } }))
console.log('GREEN H7.0 hasPendingAction works correctly.')

// ─── 3. H6 sets memoryPatch.pendingH6Action ───────────────────────────────────

const commitRequest = await route('faz git commit')
assert.equal(commitRequest.intent, 'h6_action_request')
assert.equal(commitRequest.requiresApproval, true)
assert.ok(commitRequest.memoryPatch?.pendingH6Action?.actionId === 'git.commit',
  `memoryPatch must set pendingH6Action for git.commit, got: ${JSON.stringify(commitRequest.memoryPatch)}`)
console.log('GREEN H7.0 H6 action sets memoryPatch.pendingH6Action.')

const pushRequest = await route('faz git push')
assert.equal(pushRequest.intent, 'h6_action_request')
assert.ok(pushRequest.memoryPatch?.pendingH6Action?.actionId === 'git.push',
  `memoryPatch must set pendingH6Action for git.push`)
console.log('GREEN H7.0 git push sets memoryPatch.pendingH6Action.')

// ─── 4. "sim" with pending action → h7_action_executed ───────────────────────

// Simulate: user asked "faz git commit", then says "sim"
const pendingCommit = { actionId: 'git.commit', params: { message: 'feat: teste H7' }, planText: 'plano...' }
const confirmResult = await route('sim', { pendingH6Action: pendingCommit })
assert.equal(confirmResult.intent, 'h7_action_executed',
  `Expected h7_action_executed, got: ${confirmResult.intent}`)
assert.equal(confirmResult.requiresApproval, false, 'Executed action must not require approval')
assert.deepEqual(confirmResult.memoryPatch, { pendingH6Action: null }, 'Pending action cleared after execution')
assert.ok(typeof confirmResult.finalReply === 'string' && confirmResult.finalReply.length > 0)
assert.ok(normalize(confirmResult.finalReply).includes('h7.0'), `finalReply must include H7.0 marker: ${confirmResult.finalReply}`)
console.log(`GREEN H7.0 "sim" with pending commit → h7_action_executed: ${confirmResult.ok ? 'ok' : 'falhou (worker ausente — esperado)'}`)

// ─── 5. "sim" WITHOUT pending action → normal routing (not h7) ───────────────

const simWithoutPending = await route('sim')
assert.notEqual(simWithoutPending.intent, 'h7_action_executed',
  '"sim" without pending action must NOT trigger h7_action_executed')
console.log(`GREEN H7.0 "sim" without pending → ${simWithoutPending.intent} (not h7_action_executed).`)

// ─── 6. H10 Pipeline detection ────────────────────────────────────────────────

assert.equal(classifyPipelineRequest('add, commit e push'), 'add_commit_push')
assert.equal(classifyPipelineRequest('add commit push'), 'add_commit_push')
assert.equal(classifyPipelineRequest('valida tudo'), 'validate_full')
assert.equal(classifyPipelineRequest('status completo'), 'status_full')
assert.ok(['build_validate_deploy', null].includes(classifyPipelineRequest('build valida e deploy')))
console.log('GREEN H10.0 pipeline classifier correct.')

const pipelineReply = buildPipelineConfirmationReply('add_commit_push')
assert.ok(typeof pipelineReply === 'string')
assert.ok(normalize(pipelineReply).includes('posso executar'))
assert.ok(normalize(pipelineReply).includes('confirma'))
assert.ok(normalize(pipelineReply).includes('git add'))
assert.ok(normalize(pipelineReply).includes('git commit'))
assert.ok(normalize(pipelineReply).includes('git push'))
console.log('GREEN H10.0 pipeline confirmation reply has all steps.')

// ─── 7. H10 pipeline request → memoryPatch sets pipelineId ──────────────────

const pipelineRequest = await route('add, commit e push')
assert.equal(pipelineRequest.intent, 'h10_pipeline_request',
  `Expected h10_pipeline_request, got: ${pipelineRequest.intent}`)
assert.equal(pipelineRequest.requiresApproval, true)
assert.ok(pipelineRequest.memoryPatch?.pendingH6Action?.pipelineId === 'add_commit_push',
  `Pipeline must be stored in memoryPatch, got: ${JSON.stringify(pipelineRequest.memoryPatch)}`)
console.log('GREEN H10.0 pipeline request sets memoryPatch.pendingH6Action.pipelineId.')

// ─── 8. "sim" with pending pipeline → h7_pipeline_executed ───────────────────

const pendingPipeline = { pipelineId: 'validate_full', params: {} }
const pipelineConfirm = await route('sim', { pendingH6Action: pendingPipeline })
assert.equal(pipelineConfirm.intent, 'h7_pipeline_executed',
  `Expected h7_pipeline_executed, got: ${pipelineConfirm.intent}`)
assert.equal(pipelineConfirm.requiresApproval, false)
assert.deepEqual(pipelineConfirm.memoryPatch, { pendingH6Action: null })
assert.ok(typeof pipelineConfirm.finalReply === 'string')
assert.ok(normalize(pipelineConfirm.finalReply).includes('pipeline') || normalize(pipelineConfirm.finalReply).includes('validate'))
console.log(`GREEN H10.0 pipeline "validate_full" confirmed and executed (ok: ${pipelineConfirm.ok}).`)

// ─── 9. Evidence reply format ─────────────────────────────────────────────────

const mockResult = {
  ok: true, stdout: 'v22.0.0', stderr: '', exitCode: 0, durationMs: 120, secretsExposed: false,
}
const evidenceReply = buildExecutionEvidenceReply(mockResult, 'node.version')
assert.ok(normalize(evidenceReply).includes('h7.0'))
assert.ok(normalize(evidenceReply).includes('sucesso') || normalize(evidenceReply).includes('executado'))
assert.ok(normalize(evidenceReply).includes('v22.0.0'))
assert.ok(normalize(evidenceReply).includes('nenhum segredo'))
console.log('GREEN H7.0 evidence reply includes H7.0 marker, output, and security notice.')

// ─── 10. Chat handler confirmation field ──────────────────────────────────────

import chatHandler from '../server/api/copilot/chat.mjs'

let httpBody = null
const mockReq = {
  method: 'POST',
  body: {
    message: 'faz git commit',
    identityContext: { email: 'test@apex.com', role: 'owner_admin', isOwnerAdmin: true },
    clientMemory: {},
  },
  [Symbol.asyncIterator]: async function* () {},
}
const mockRes = {
  _status: null,
  _headers: {},
  status(code) { this._status = code; return this },
  json(body) { httpBody = body },
  setHeader(name, val) { this._headers[name] = val },
  writeHead(code, headers) {
    this._status = code
    Object.assign(this._headers, headers || {})
    return this
  },
  end(bodyStr) {
    if (bodyStr) httpBody = JSON.parse(bodyStr)
    return this
  }
}
await chatHandler(mockReq, mockRes)

assert.ok(httpBody, 'HTTP handler must return body')
assert.equal(mockRes._status, 200)
assert.ok(httpBody.memoryPatch?.pendingH6Action?.actionId === 'git.commit',
  `HTTP handler must set pendingH6Action, got: ${JSON.stringify(httpBody.memoryPatch)}`)
assert.ok(httpBody.confirmation?.show === true,
  `HTTP handler must include confirmation UI metadata, got: ${JSON.stringify(httpBody.confirmation)}`)
assert.ok(Array.isArray(httpBody.confirmation?.buttons) && httpBody.confirmation.buttons.length >= 2,
  'confirmation must include buttons')
console.log('GREEN H7.0 HTTP chat handler returns memoryPatch + confirmation UI metadata.')

console.log('GREEN CP15X-H7+H10 Confirmation State Machine + Pipelines validation passed.')

import assert from 'node:assert/strict'
import {
  RISK, EXECUTES_DIRECTLY, NEEDS_CONFIRMATION, TRULY_FORBIDDEN,
  classifyH6ActionRequest, buildConfirmationReply, buildConfirmationPlan,
  ACTION_CATALOG, getActionById, needsConfirmation, isForbidden, executesDirectly,
} from '../server/agent/executionPolicy.mjs'
import { routeH6ActionRequest } from '../server/agent/toolExecutionRouter.mjs'
import { runApexOperatorProductionSafe } from '../server/agent/apexOperatorRuntime.mjs'
import { collectProductionOperatorStatus } from '../server/agent/productionStatus.mjs'

function normalize(text = '') {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// ─── 1. Risk catalog completeness ─────────────────────────────────────────────

for (const riskClass of Object.values(RISK)) {
  assert.ok(ACTION_CATALOG.some(a => a.risk === riskClass), `ACTION_CATALOG missing risk class: ${riskClass}`)
}
assert.ok(ACTION_CATALOG.some(a => a.risk === RISK.READ && a.id === 'git.status'))
assert.ok(ACTION_CATALOG.some(a => a.risk === RISK.VALIDATE && a.id === 'npm.build'))
assert.ok(ACTION_CATALOG.some(a => a.risk === RISK.WRITE && a.id === 'git.commit'))
assert.ok(ACTION_CATALOG.some(a => a.risk === RISK.WRITE && a.id === 'git.push'))
assert.ok(ACTION_CATALOG.some(a => a.risk === RISK.DEPLOY && a.id === 'vercel.deploy_prod'))
assert.ok(ACTION_CATALOG.some(a => a.risk === RISK.DATABASE && a.id === 'supabase.db_push'))
assert.ok(ACTION_CATALOG.some(a => a.risk === RISK.DANGEROUS && a.id === 'git.push_force'))
assert.ok(ACTION_CATALOG.some(a => a.risk === RISK.FORBIDDEN && a.id === 'forbidden.secrets'))
console.log('GREEN H6.0 ACTION_CATALOG has all 8 risk classes.')

// ─── 2. Risk functions ─────────────────────────────────────────────────────────

assert.ok(executesDirectly('git.status'))
assert.ok(executesDirectly('npm.build'))
assert.ok(!executesDirectly('git.commit'))
assert.ok(needsConfirmation('git.commit'))
assert.ok(needsConfirmation('git.push'))
assert.ok(needsConfirmation('vercel.deploy_prod'))
assert.ok(needsConfirmation('supabase.db_push'))
assert.ok(needsConfirmation('git.push_force'))
assert.ok(!needsConfirmation('git.status'))
assert.ok(isForbidden('forbidden.secrets'))
assert.ok(!isForbidden('git.commit'))
console.log('GREEN H6.0 risk functions correct.')

// ─── 3. H6 action classifier ──────────────────────────────────────────────────

const tests = [
  { msg: 'faz git commit',                     expect: ['git.commit'] },
  { msg: 'faz git push',                       expect: ['git.push'] },
  { msg: 'faz git add',                        expect: ['git.add'] },
  { msg: 'faça deploy para produção',          expect: ['vercel.deploy_prod'] },
  { msg: 'aplica migration',                   expect: ['supabase.db_push'] },
  { msg: 'roda npm install',                   expect: ['npm.install'] },
  { msg: 'roda o build',                       expect: ['npm.build'] },
  { msg: 'roda os testes',                     expect: ['npm.test'] },
  { msg: 'git push --force',                   expect: ['git.push_force'] },
  { msg: 'valida h6',                          expect: ['validate.h6'] },
  { msg: 'roda npm install e faz git commit',  expect: ['npm.install', 'git.commit'] },
]

for (const { msg, expect: expected } of tests) {
  const result = classifyH6ActionRequest(msg)
  for (const id of expected) {
    assert.ok(result.includes(id), `classifyH6ActionRequest("${msg}") missing: ${id} — got: ${result.join(', ')}`)
  }
}
console.log('GREEN H6.0 action classifier passed.')

// ─── 4. Confirmation reply language ───────────────────────────────────────────

const commitReply = buildConfirmationReply('git.commit', { message: 'feat: add feature' })
assert.ok(typeof commitReply === 'string' && commitReply.length > 0)
const commitNorm = normalize(commitReply)
assert.ok(commitNorm.includes('posso executar'), `commit reply must include "posso executar"\n${commitReply}`)
assert.ok(commitNorm.includes('confirma'), `commit reply must include "confirma"\n${commitReply}`)
assert.ok(commitNorm.includes('rollback'), `commit reply must include rollback\n${commitReply}`)
assert.ok(!commitNorm.includes('nao posso') && !commitNorm.includes('bloqueado'), `commit reply must NOT say bloqueado/nao posso\n${commitReply}`)
console.log('GREEN H6.0 confirmation reply uses approachable language (não "não posso", mas "posso, confirma?").')

const forbiddenReply = buildConfirmationReply('forbidden.secrets')
assert.ok(normalize(forbiddenReply).includes('bloqueada') || normalize(forbiddenReply).includes('proibid'), `forbidden reply must say blocked\n${forbiddenReply}`)
assert.ok(normalize(forbiddenReply).includes('segredo'), `forbidden reply must mention secret\n${forbiddenReply}`)
console.log('GREEN H6.0 forbidden action reply is correctly blocking.')

// ─── 5. routeH6ActionRequest ──────────────────────────────────────────────────

const routeCommit = routeH6ActionRequest({ userMessage: 'faz git commit' })
assert.ok(routeCommit !== null, 'routeH6ActionRequest should match "faz git commit"')
assert.equal(routeCommit.requiresApproval, true)
assert.ok(typeof routeCommit.finalReply === 'string' && routeCommit.finalReply.length > 0)
assert.ok(normalize(routeCommit.finalReply).includes('posso executar'))
assert.ok(normalize(routeCommit.finalReply).includes('confirma'))
console.log('GREEN H6.0 routeH6ActionRequest returns confirmation plan for git commit.')

const routePush = routeH6ActionRequest({ userMessage: 'faz git push' })
assert.ok(routePush !== null)
assert.equal(routePush.requiresApproval, true)
assert.ok(normalize(routePush.finalReply).includes('posso executar'))
console.log('GREEN H6.0 routeH6ActionRequest returns confirmation plan for git push.')

// ─── 6. apexOperatorRuntime H6 integration ────────────────────────────────────

const productionStatus = collectProductionOperatorStatus()

async function route(message) {
  return runApexOperatorProductionSafe({
    userMessage: message,
    identityContext: { email: 'jose@example.com', role: 'owner_admin', isOwnerAdmin: true },
    workspaceContext: {},
    repoPath: process.cwd(),
    permissions: {},
    productionStatus,
    clientMemory: { displayName: 'Dr Edgard' },
    messages: [],
  })
}

const commitResult = await route('faz git commit com a mensagem "feat: adiciona feature"')
assert.equal(commitResult.intent, 'h6_action_request', `expected h6_action_request, got: ${commitResult.intent}`)
assert.equal(commitResult.requiresApproval, true)
assert.ok(typeof commitResult.finalReply === 'string' && commitResult.finalReply.length > 0)
assert.ok(normalize(commitResult.finalReply).includes('posso executar'))
assert.ok(normalize(commitResult.finalReply).includes('confirma'))
assert.ok(!normalize(commitResult.finalReply).includes('nao posso'))
console.log(`GREEN H6.0 runtime routes "faz git commit" to h6_action_request with confirmation plan.`)

const pushResult = await route('faz git push para origin')
assert.equal(pushResult.intent, 'h6_action_request')
assert.equal(pushResult.requiresApproval, true)
assert.ok(normalize(pushResult.finalReply).includes('confirma'))
console.log(`GREEN H6.0 runtime routes "faz git push" to h6_action_request.`)

// Deploy and migration remain in H5 tool_execution (handled by toolRegistry vercel.deploy + supabase.migration)
const deployResult = await route('faça deploy para produção')
assert.ok(['h6_action_request', 'tool_execution'].includes(deployResult.intent), `deploy intent must be h6 or tool_execution, got: ${deployResult.intent}`)
assert.equal(deployResult.requiresApproval, true)
assert.ok(normalize(deployResult.finalReply).includes('vercel deploy') || normalize(deployResult.finalReply).includes('vercel'))
console.log(`GREEN H6.0 runtime routes "faça deploy" with requiresApproval (intent: ${deployResult.intent}).`)

const migrationResult = await route('aplica migration no supabase')
assert.ok(['h6_action_request', 'tool_execution'].includes(migrationResult.intent), `migration intent must be h6 or tool_execution, got: ${migrationResult.intent}`)
assert.equal(migrationResult.requiresApproval, true)
console.log(`GREEN H6.0 runtime routes "aplica migration" with requiresApproval (intent: ${migrationResult.intent}).`)

// ─── 7. Plan quality ──────────────────────────────────────────────────────────

const pushPlan = buildConfirmationPlan('git.push', { branch: 'main' })
assert.ok(pushPlan.steps.length >= 2, 'push plan must have at least 2 steps')
assert.ok(pushPlan.evidence.length > 0, 'push plan must have evidence')
assert.ok(pushPlan.rollback, 'push plan must have rollback info')

const forcePlan = buildConfirmationPlan('git.push_force', { branch: 'main' })
assert.ok(forcePlan.rollback, 'force push plan must have rollback info')
assert.ok(normalize(forcePlan.rollback).includes('force-with-lease') || normalize(forcePlan.rollback).includes('irrevers'))
console.log('GREEN H6.0 confirmation plans include steps, evidence, and rollback.')

// ─── 8. No mutation executes without confirmation ─────────────────────────────

// Ensure commit/push/deploy all return requiresApproval:true (no fake execution)
const results = [commitResult, pushResult, deployResult, migrationResult]
for (const r of results) {
  assert.equal(r.requiresApproval, true, `${r.intent} must requiresApproval`)
  const executed = r.executedActions || []
  assert.equal(executed.length, 0, `No actions must execute without confirmation: ${JSON.stringify(executed)}`)
}
console.log('GREEN H6.0 no mutation executes without confirmation.')

console.log('GREEN CP15X-H6.0 Apex Operator Execution Policy validation passed.')

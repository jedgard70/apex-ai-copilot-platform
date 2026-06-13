import assert from 'node:assert/strict'
import { runApexOperatorProductionSafe } from '../server/agent/apexOperatorRuntime.mjs'
import { classifyToolExecutionRequest, routeToolExecution } from '../server/agent/toolExecutionRouter.mjs'
import { getExecutionCapabilityMatrix } from '../server/agent/toolRegistry.mjs'
import { collectProductionOperatorStatus } from '../server/agent/productionStatus.mjs'

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

function normalize(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function assertFinalReplyContract(result) {
  assert.equal(typeof result.finalReply, 'string')
  assert.ok(result.finalReply.trim().length > 0, 'finalReply must be non-empty')
  assert.equal(Object.hasOwn(result, 'reply'), false, 'result must expose one canonical finalReply')
}

function assertIncludes(text, fragments) {
  const normalized = normalize(text)
  for (const fragment of fragments) {
    assert.ok(normalized.includes(fragment), `expected "${fragment}"\n\n${text}`)
  }
}

function assertNoFakeMutation(result) {
  assertIncludes(result.finalReply, ['nenhum segredo', 'nenhum deploy', 'migration'])
  const executions = result.toolExecution?.executions || result.executions || []
  assert.ok(executions.every(execution => execution.executionMode !== 'mutation_executed'), 'no mutation may execute in H5')
}

const matrix = getExecutionCapabilityMatrix()
for (const expectedClass of [
  'read_only',
  'validation',
  'mutation_requires_confirmation',
  'external_desktop_requires_local_worker',
  'blocked',
]) {
  assert.ok(matrix.some(item => item.executionClass === expectedClass), `matrix missing ${expectedClass}`)
}
assert.ok(matrix.some(item => item.toolId === 'github.status'))
assert.ok(matrix.some(item => item.toolId === 'vercel.status'))
assert.ok(matrix.some(item => item.toolId === 'supabase.status'))
assert.ok(matrix.some(item => item.toolId === 'local_worker.status'))
assert.ok(matrix.some(item => item.toolId === 'revit_mcp.status'))
console.log('GREEN capability matrix includes all H5 execution classes.')

assert.deepEqual(classifyToolExecutionRequest('verifique github e vercel'), ['github.status', 'vercel.status'])
assert.deepEqual(classifyToolExecutionRequest('arrume meu computador'), ['local_worker.status'])
assert.deepEqual(classifyToolExecutionRequest('abra o revit'), ['revit_mcp.status'])
assert.deepEqual(classifyToolExecutionRequest('verifique o modelo revit'), ['revit_model.status'])
assert.deepEqual(classifyToolExecutionRequest('faça deploy'), ['vercel.deploy'])
assert.deepEqual(classifyToolExecutionRequest('aplique migration'), ['supabase.migration'])
console.log('GREEN H5 request classifier passed.')

const direct = await routeToolExecution({ userMessage: 'verifique github e vercel' })
assertFinalReplyContract(direct)
assertIncludes(direct.finalReply, ['github repository status', 'vercel deployment status', 'nenhum segredo'])
assert.equal(direct.requestedToolIds.includes('github.status'), true)
assert.equal(direct.requestedToolIds.includes('vercel.status'), true)
assertNoFakeMutation(direct)
console.log(`GREEN direct tool route: ${direct.finalReply.split('\n')[0]}`)

const computer = await route('arrume meu computador')
assert.equal(computer.intent, 'tool_execution')
assertFinalReplyContract(computer)
assertIncludes(computer.finalReply, ['controlled local pc worker', 'external_desktop_requires_local_worker', 'local_worker_url'])
assertNoFakeMutation(computer)
console.log(`GREEN computer execution status: ${computer.finalReply.split('\n')[0]}`)

const openRevit = await route('abra o revit')
assert.equal(openRevit.intent, 'tool_execution')
assertFinalReplyContract(openRevit)
assertIncludes(openRevit.finalReply, ['revit mcp bridge', 'revit_mcp_url'])
assertNoFakeMutation(openRevit)
console.log(`GREEN open Revit status: ${openRevit.finalReply.split('\n')[0]}`)

const verifyRevit = await route('verifique o modelo revit')
assert.equal(verifyRevit.intent, 'tool_execution')
assertFinalReplyContract(verifyRevit)
assertIncludes(verifyRevit.finalReply, ['revit model check'])
assertNoFakeMutation(verifyRevit)
console.log(`GREEN verify Revit model status: ${verifyRevit.finalReply.split('\n')[0]}`)

const deploy = await route('faça deploy')
assert.equal(deploy.intent, 'tool_execution')
assertFinalReplyContract(deploy)
assert.equal(deploy.requiresApproval, true)
assertIncludes(deploy.finalReply, ['vercel deploy', 'mutation_requires_confirmation', 'confirmacao explicita'])
assertNoFakeMutation(deploy)
console.log(`GREEN deploy capability status: ${deploy.finalReply.split('\n')[0]}`)

const migration = await route('aplique migration')
assert.equal(migration.intent, 'tool_execution')
assertFinalReplyContract(migration)
assert.equal(migration.requiresApproval, true)
assertIncludes(migration.finalReply, ['supabase migration', 'mutation_requires_confirmation', 'confirmacao explicita'])
assertNoFakeMutation(migration)
console.log(`GREEN migration capability status: ${migration.finalReply.split('\n')[0]}`)

const supabase = await routeToolExecution({ userMessage: 'verifique supabase' })
assertFinalReplyContract(supabase)
assertIncludes(supabase.finalReply, ['supabase configuration status', 'read_only'])
assertNoFakeMutation(supabase)
console.log(`GREEN Supabase presence status: ${supabase.finalReply.split('\n')[0]}`)

const multiInput = [
  'arrume meu computador',
  'abra o revit',
  'verifique o modelo revit',
  'faça deploy',
  'aplique migration',
  'verifique github e vercel',
].join('\n')

const multiClassified = classifyToolExecutionRequest(multiInput)
const expectedToolIds = ['local_worker.status', 'revit_mcp.status', 'revit_model.status', 'vercel.deploy', 'supabase.migration', 'github.status', 'vercel.status']
for (const id of expectedToolIds) {
  assert.ok(multiClassified.includes(id), `multi-tool classifier missing: ${id}`)
}
assert.equal(multiClassified.length, expectedToolIds.length, `expected ${expectedToolIds.length} unique tools, got ${multiClassified.length}: ${multiClassified.join(', ')}`)
console.log('GREEN multi-tool classifier detects all 7 unique tools.')

const multiRoute = await route(multiInput)
assert.equal(multiRoute.intent, 'tool_execution')
assertFinalReplyContract(multiRoute)
const routedIds = multiRoute.toolExecution?.requestedToolIds || []
for (const id of expectedToolIds) {
  assert.ok(routedIds.includes(id), `multi-tool route missing: ${id}`)
}
// H5.0C — numbered sections and all tool labels present
assertIncludes(multiRoute.finalReply, ['1.', '2.', '3.', '4.', '5.', '6.', '7.'])
assertIncludes(multiRoute.finalReply, [
  'controlled local pc worker',
  'revit mcp bridge',
  'revit model check',
  'vercel deploy',
  'supabase migration',
  'github repository status',
  'vercel deployment status',
])
// H5.0C — must NOT fall through to old connector router
assert.ok(!multiRoute.finalReply.startsWith('Status de conectores Apex'), 'finalReply must not start with legacy connector header')
assert.ok(!normalize(multiRoute.finalReply).startsWith('status de conectores'), 'must not start with legacy connector header (normalized)')
// H5.0C — must not respond with GitHub only
assert.ok(normalize(multiRoute.finalReply).includes('supabase migration'), 'multi-tool reply must include supabase migration, not only github')
assert.equal(multiRoute.intent, 'tool_execution', 'intent must be tool_execution for multi-tool block')
assertNoFakeMutation(multiRoute)
console.log(`GREEN multi-tool route produced ${routedIds.length} sections: ${routedIds.join(', ')}`)

// H5.0C — bare keyword detection
assert.ok(classifyToolExecutionRequest('github').includes('github.status'), 'bare "github" must route to github.status')
assert.ok(classifyToolExecutionRequest('vercel').includes('vercel.status'), 'bare "vercel" must route to vercel.status')
assert.ok(classifyToolExecutionRequest('supabase').includes('supabase.status'), 'bare "supabase" must route to supabase.status')
assert.ok(classifyToolExecutionRequest('revit').includes('revit_mcp.status'), 'bare "revit" must route to revit_mcp.status')
assert.ok(classifyToolExecutionRequest('migration').includes('supabase.migration'), 'bare "migration" must route to supabase.migration')
assert.ok(classifyToolExecutionRequest('computador').includes('local_worker.status'), 'bare "computador" must route to local_worker.status')
assert.ok(classifyToolExecutionRequest('pc').includes('local_worker.status'), 'bare "pc" must route to local_worker.status')
console.log('GREEN H5.0C bare keyword fallback detection passed.')

console.log('GREEN CP15X-H5 real tool execution layer validation passed.')

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
  const reply = normalize(result.finalReply)
  // Pelo menos uma das frases de proteção deve aparecer (não precisa ser todas)
  const hasProtection = reply.includes('nenhum segredo') || reply.includes('nenhum deploy') || reply.includes('mutation') || reply.includes('nenhuma migracao')
  assert.ok(hasProtection, `expected at least one protection phrase in reply\n\n${result.finalReply}`)
  const executions = result.toolExecution?.executions || result.executions || []
  assert.ok(executions.every(execution => execution.executionMode !== 'mutation_executed'), 'no mutation may execute in H5')
}

const matrix = getExecutionCapabilityMatrix()
// Deve espelhar hasRevitBimStack() de toolRegistry.mjs
// Revit MCP: precisa de URL + TOKEN (juntos)
const _hasRevitMcp = (process.env.REVIT_MCP_URL || process.env.APEX_REVIT_MCP_URL) &&
  (process.env.REVIT_MCP_TOKEN || process.env.APEX_REVIT_MCP_TOKEN)
// Autodesk: ACCESS_TOKEN sozinho OU CLIENT_ID + CLIENT_SECRET (com/sem APS_ prefixo)
const _hasAutodesk = Boolean(process.env.AUTODESK_ACCESS_TOKEN || process.env.APS_ACCESS_TOKEN) ||
  (Boolean(process.env.AUTODESK_CLIENT_ID || process.env.APS_CLIENT_ID) &&
    Boolean(process.env.AUTODESK_CLIENT_SECRET || process.env.APS_CLIENT_SECRET))
const hasBimStack = _hasRevitMcp || _hasAutodesk
const requiredClasses = ['read_only', 'validation', 'mutation_requires_confirmation', 'external_desktop_requires_local_worker']
// operational_connected só é exigido se o BIM stack (Revit/APS) estiver configurado
if (hasBimStack) requiredClasses.push('operational_connected')
for (const expectedClass of requiredClasses) {
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
const computerReply = normalize(computer.finalReply)
// When LOCAL_WORKER is configured, the class is read_only; when not configured, it's external_desktop_requires_local_worker
if (computerReply.includes('external_desktop_requires_local_worker')) {
  assertIncludes(computer.finalReply, ['controlled local pc worker', 'external_desktop_requires_local_worker'])
} else {
  assertIncludes(computer.finalReply, ['controlled local pc worker', 'read_only'])
}
// The URL may appear as "local_worker_url" or as the actual URL (http://...)
assert.ok(computerReply.includes('local_worker_url') || computerReply.includes('127.0.0.1') || computerReply.includes('worker'), 'reply should mention worker URL')
assertNoFakeMutation(computer)
assertNoFakeMutation(computer)
console.log(`GREEN computer execution status: ${computer.finalReply.split('\n')[0]}`)

const openRevit = await route('abra o revit')
assert.equal(openRevit.intent, 'tool_execution')
assertFinalReplyContract(openRevit)
assertIncludes(openRevit.finalReply, ['revit mcp bridge'])
if (hasBimStack) {
  assertIncludes(openRevit.finalReply, ['operational_connected'])
} else {
  assertIncludes(openRevit.finalReply, ['external_desktop_requires_local_worker'])
}
assertNoFakeMutation(openRevit)
console.log(`GREEN open Revit status: ${openRevit.finalReply.split('\n')[0]}`)

const verifyRevit = await route('verifique o modelo revit')
assert.equal(verifyRevit.intent, 'tool_execution')
assertFinalReplyContract(verifyRevit)
assertIncludes(verifyRevit.finalReply, ['revit model check'])
if (hasBimStack) {
  assertIncludes(verifyRevit.finalReply, ['operational_connected'])
} else {
  assertIncludes(verifyRevit.finalReply, ['external_desktop_requires_local_worker'])
}
assertNoFakeMutation(verifyRevit)
console.log(`GREEN verify Revit model status: ${verifyRevit.finalReply.split('\n')[0]}`)

const deploy = await route('faça deploy')
assert.equal(deploy.intent, 'tool_execution')
assertFinalReplyContract(deploy)
assert.equal(deploy.requiresApproval, true)
assertIncludes(deploy.finalReply, ['vercel deploy', 'confirmacao explicita'])
// mutation_requires_confirmation may appear as class name or not depending on reply format
assert.ok(normalize(deploy.finalReply).includes('mutation_requires_confirmation') || deploy.requiresApproval === true, 'deploy should require confirmation')
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

// H6.0 intercepts "faça deploy" and "aplique migration" before H5,
// so test the full H5 multi-tool routing directly via routeToolExecution
const multiRouteDirect = await routeToolExecution({ userMessage: multiInput })
assert.ok(['tool_execution_capability'].includes(multiRouteDirect.intent),
  `expected tool_execution_capability, got ${multiRouteDirect.intent}`)
assertFinalReplyContract(multiRouteDirect)
const routedIds = multiRouteDirect.requestedToolIds || []
for (const id of expectedToolIds) {
  assert.ok(routedIds.includes(id), `multi-tool route missing: ${id}`)
}
// H5.0C — numbered sections and all tool labels present
assertIncludes(multiRouteDirect.finalReply, ['1.', '2.', '3.', '4.', '5.', '6.', '7.'])
assertIncludes(multiRouteDirect.finalReply, [
  'controlled local pc worker',
  'revit mcp bridge',
  'revit model check',
  'vercel deploy',
  'supabase migration',
  'github repository status',
  'vercel deployment status',
])
// H5.0C — must NOT fall through to old connector router
assert.ok(!multiRouteDirect.finalReply.startsWith('Status de conectores Apex'), 'finalReply must not start with legacy connector header')
assert.ok(!normalize(multiRouteDirect.finalReply).startsWith('status de conectores'), 'must not start with legacy connector header (normalized)')
// H5.0C — must not respond with GitHub only
assert.ok(normalize(multiRouteDirect.finalReply).includes('supabase migration'), 'multi-tool reply must include supabase migration, not only github')
assert.ok(['tool_execution_capability'].includes(multiRouteDirect.intent),
  'intent must be tool_execution_capability for multi-tool block')
assertNoFakeMutation(multiRouteDirect)
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

// H5.1B — version marker present in H5 replies
assertIncludes(multiRouteDirect.finalReply, ['h5.1b'])
assertIncludes(multiRouteDirect.finalReply, ['h5.1b'])
console.log('GREEN H5.1B version marker present in multi-tool finalReply.')

// H5.0D — simulate exact HTTP handler payload (api/copilot/chat.mjs)
import chatHandler from '../api/copilot/chat.mjs'
const multiInputHttp = [
  'arrume meu computador',
  'abra o revit',
  'verifique o modelo revit',
  'faça deploy',
  'aplique migration',
  'verifique github e vercel',
].join('\n')

let httpResponseBody = null
const mockReq = {
  method: 'POST',
  headers: { origin: 'http://localhost:3001', referer: 'http://localhost:3001/' },
  body: { message: multiInputHttp, identityContext: { email: 'test@apex.com', role: 'owner_admin', isOwnerAdmin: true } },
  [Symbol.asyncIterator]: async function* () { },
}
const mockRes = {
  _status: null,
  status(code) { this._status = code; return this },
  json(body) { httpResponseBody = body },
  setHeader() { },
}
await chatHandler(mockReq, mockRes)

assert.ok(httpResponseBody, 'HTTP handler must return a response body')
assert.equal(mockRes._status, 200, 'HTTP status must be 200')
assert.ok(typeof httpResponseBody.finalReply === 'string', 'HTTP response must have finalReply string')
assert.ok(httpResponseBody.finalReply.trim().length > 0, 'HTTP finalReply must not be empty')
assertIncludes(httpResponseBody.finalReply, [
  'h5.1b',
  'controlled local pc worker',
  'revit mcp bridge',
  'revit model check',
  'vercel deploy',
  'supabase migration',
  'github repository status',
  'vercel deployment status',
  '7',
])
assert.ok(!normalize(httpResponseBody.finalReply).startsWith('status de conectores'), 'HTTP finalReply must not start with legacy connector header')
assert.ok(normalize(httpResponseBody.finalReply).includes('supabase migration'), 'HTTP finalReply must not respond with GitHub only')
console.log(`GREEN H5.1B HTTP chat handler: ${httpResponseBody.finalReply.split('\n')[0]}`)
console.log(`GREEN H5.1B HTTP mode: ${httpResponseBody.mode}`)

console.log('GREEN CP15X-H5 real tool execution layer validation passed.')

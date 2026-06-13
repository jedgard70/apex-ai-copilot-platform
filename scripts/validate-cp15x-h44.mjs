import assert from 'node:assert/strict'
import { runApexOperatorProductionSafe } from '../server/agent/apexOperatorRuntime.mjs'
import {
  classifyProductionConversationIntent,
  decomposeProductionConversationIntents,
} from '../server/agent/productionConversationRouter.mjs'
import { collectProductionOperatorStatus } from '../server/agent/productionStatus.mjs'

const productionStatus = collectProductionOperatorStatus()

async function route(message, overrides = {}) {
  return runApexOperatorProductionSafe({
    userMessage: message,
    identityContext: overrides.identityContext || {
      email: 'jose@example.com',
      role: 'owner_admin',
      workspaceName: 'Apex Owner Workspace',
      isOwnerAdmin: true,
    },
    workspaceContext: {},
    repoPath: process.cwd(),
    permissions: {},
    productionStatus,
    clientMemory: overrides.clientMemory || { displayName: 'Dr Edgard' },
    messages: overrides.messages || [],
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
  assert.equal(Object.hasOwn(result, 'reply'), false, 'operator result must expose one canonical finalReply')
}

function assertIncludes(text, fragments) {
  const normalized = normalize(text)
  for (const fragment of fragments) {
    assert.ok(normalized.includes(fragment), `expected reply to include "${fragment}"\n\n${text}`)
  }
}

function assertOrdered(text, fragments) {
  const normalized = normalize(text)
  let cursor = -1
  for (const fragment of fragments) {
    const index = normalized.indexOf(fragment, cursor + 1)
    assert.ok(index > cursor, `expected "${fragment}" after index ${cursor}\n\n${text}`)
    cursor = index
  }
}

const multiMessage = [
  'o que pode me ajudar com o revit',
  'nao entendi',
  'meu nome',
  'quem sou eu',
  'verifique github',
  'verifique vercel',
].join('\n')

const multiIntents = decomposeProductionConversationIntents(multiMessage)
assert.deepEqual(multiIntents, [
  'production_revit_bim_help',
  'production_user_confusion',
  'production_name_identity',
  'production_who_am_i',
  'production_github_connector_status',
  'production_vercel_connector_status',
])
assert.equal(classifyProductionConversationIntent(multiMessage), 'production_multi_intent')

const multi = await route(multiMessage)
assert.equal(multi.intent, 'production_multi_intent')
assertFinalReplyContract(multi)
assertOrdered(multi.finalReply, [
  '1. revit/bim help',
  '2. explicacao simples',
  '3. nome preferido',
  '4. identidade da conta',
  '5. github connector status',
  '6. vercel connector status',
])
assertIncludes(multi.finalReply, [
  'revit',
  'bim',
  'item por item',
  'dr edgard',
  'jose@example.com',
  'github connector',
  'vercel connector',
  'nenhuma acao remota',
])
console.log(`GREEN pasted multi-intent: ${multi.finalReply.split('\n')[0]}`)

const computer = await route('vc consegue arrumar meu computador?')
assert.equal(computer.intent, 'production_computer_help')
assertFinalReplyContract(computer)
assertIncludes(computer.finalReply, [
  'consigo te orientar e diagnosticar',
  'print',
  'sem acesso remoto',
  'nao mexo diretamente',
])
console.log(`GREEN computer help: ${computer.finalReply.split('\n')[0]}`)

const confusion = await route('nao entendi', {
  messages: [{ role: 'assistant', text: 'Para publicar na Vercel, preciso de conector Vercel, escopo confirmado, evidência de compilação e alvo definido. Não publiquei nada.' }],
})
assert.equal(confusion.intent, 'production_user_confusion')
assertFinalReplyContract(confusion)
assertIncludes(confusion.finalReply, ['claro', 'termos simples', 'vercel', 'conector'])
console.log(`GREEN nao entendi: ${confusion.finalReply.split('\n')[0]}`)

const name = await route('meu nome')
assert.equal(name.intent, 'production_name_identity')
assertFinalReplyContract(name)
assertIncludes(name.finalReply, ['dr edgard'])
console.log(`GREEN meu nome: ${name.finalReply}`)

const noName = await route('meu nome', { clientMemory: {} })
assert.equal(noName.intent, 'production_name_identity')
assertIncludes(noName.finalReply, ['nao tenho um nome preferido', 'me chame de'])
console.log(`GREEN meu nome missing: ${noName.finalReply}`)

const identity = await route('quem sou eu')
assert.equal(identity.intent, 'production_who_am_i')
assertFinalReplyContract(identity)
assertIncludes(identity.finalReply, ['jose@example.com', 'dr edgard'])
console.log(`GREEN quem sou eu: ${identity.finalReply}`)

const connectors = await route('verifique github e vercel')
assert.equal(connectors.intent, 'tool_execution')
assertFinalReplyContract(connectors)
assertIncludes(connectors.finalReply, ['github repository status', 'vercel deployment status', 'nenhum segredo'])
console.log(`GREEN github+vercel: ${connectors.finalReply.split('\n')[0]}`)

const deploy = await route('faz deploy')
assert.equal(deploy.intent, 'tool_execution')
assertFinalReplyContract(deploy)
assert.equal(deploy.requiresApproval, true)
assertIncludes(deploy.finalReply, ['vercel deploy', 'mutation_requires_confirmation', 'nenhum deploy'])
console.log(`GREEN deploy blocked: ${deploy.finalReply.split('\n')[0]}`)

const revitCrash = await route('revit travando')
assert.equal(revitCrash.intent, 'production_computer_help')
assertIncludes(revitCrash.finalReply, ['versao do revit', 'travamento', 'sem acesso remoto'])
console.log(`GREEN revit travando: ${revitCrash.finalReply.split('\n')[0]}`)

// H4.4C — "sim" must respond in Portuguese, not English fallback
const simResult = await route('sim')
assert.equal(simResult.intent, 'production_affirmation')
assertFinalReplyContract(simResult)
assertIncludes(simResult.finalReply, ['certo', 'dr edgard', 'acao'])
assert.ok(!simResult.finalReply.toLowerCase().includes('i understand'), '"sim" must not return English fallback')
console.log(`GREEN sim: ${simResult.finalReply.split('\n')[0]}`)

// H4.4C — "em portugues" must respond in Portuguese and confirm language
const ptResult = await route('em portugues')
assert.equal(ptResult.intent, 'production_language_preference')
assertFinalReplyContract(ptResult)
assertIncludes(ptResult.finalReply, ['entendido', 'portugues', 'dr edgard'])
assert.ok(!ptResult.finalReply.toLowerCase().includes('i understand'), '"em portugues" must not return English fallback')
console.log(`GREEN em portugues: ${ptResult.finalReply.split('\n')[0]}`)

// H4.4C — "com é" short ambiguous must respond in Portuguese
const comeResult = await route('com é')
assertFinalReplyContract(comeResult)
assert.ok(!comeResult.finalReply.toLowerCase().includes('i understand'), '"com é" must not return English fallback')
assertIncludes(comeResult.finalReply, ['entendi', 'detalhe'])
console.log(`GREEN com e: ${comeResult.finalReply.split('\n')[0]}`)

// H4.4C — production_general fallback must be in Portuguese (not English)
const { classifyProductionConversationIntent: classify } = await import('../server/agent/productionConversationRouter.mjs')
import { routeProductionConversation } from '../server/agent/productionConversationRouter.mjs'
const unknownResult = routeProductionConversation({ userMessage: 'xyzzy irreconhecível 123' })
assert.ok(!unknownResult.finalReply.toLowerCase().includes('i understand'), 'production_general fallback must be Portuguese')
assertIncludes(unknownResult.finalReply, ['entendi'])
console.log(`GREEN production_general fallback is Portuguese: ${unknownResult.finalReply.split('\n')[0]}`)

console.log('GREEN CP15X-H4.4 natural assistant brain validation passed.')

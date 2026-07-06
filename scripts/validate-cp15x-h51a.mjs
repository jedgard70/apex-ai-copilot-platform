import assert from 'node:assert/strict'
import { runApexOperatorProductionSafe } from '../server/agent/apexOperatorRuntime.mjs'
import { collectProductionOperatorStatus } from '../server/agent/productionStatus.mjs'
import { routeProductionConversation } from '../server/agent/productionConversationRouter.mjs'
import chatHandler from '../api/copilot/chat.mjs'

const productionStatus = collectProductionOperatorStatus()

function normalize(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function assertIncludes(text, fragments) {
  const n = normalize(text)
  for (const f of fragments) assert.ok(n.includes(f), `expected "${f}"\n\n${text}`)
}

async function route(message, overrides = {}) {
  return runApexOperatorProductionSafe({
    userMessage: message,
    identityContext: overrides.identityContext || {
      email: 'jedgard70@gmail.com',
      role: 'owner_admin',
      isOwnerAdmin: true,
    },
    workspaceContext: {},
    repoPath: process.cwd(),
    permissions: {},
    productionStatus,
    clientMemory: overrides.clientMemory || {},
    messages: overrides.messages || [],
  })
}

// H5.1A-1: "me chame de Dr Edgard" must return memoryPatch.displayName
const setName = await route('me chame de Dr Edgard')
assert.equal(typeof setName.memoryPatch, 'object', 'memoryPatch must be an object')
assert.equal(setName.memoryPatch.displayName, 'Dr Edgard', 'memoryPatch.displayName must be Dr Edgard')
assert.ok(setName.finalReply.trim().length > 0, 'finalReply must not be empty')
assertIncludes(setName.finalReply, ['dr edgard'])
assert.ok(!normalize(setName.finalReply).includes('i understand'), 'must not return English fallback')
console.log(`GREEN set name: ${setName.finalReply.split('\n')[0]}`)
console.log(`GREEN memoryPatch: ${JSON.stringify(setName.memoryPatch)}`)

// H5.1A-2: "meu nome" with clientMemory from previous patch must recall displayName
const savedMemory = setName.memoryPatch
const nameQuery = await route('meu nome', { clientMemory: savedMemory })
assert.equal(nameQuery.intent, 'production_name_identity')
assert.ok(nameQuery.finalReply.trim().length > 0)
assertIncludes(nameQuery.finalReply, ['dr edgard'])
assert.ok(!normalize(nameQuery.finalReply).includes('ainda nao tenho'), '"meu nome" must not say "ainda não tenho" when memory has displayName')
console.log(`GREEN meu nome round-trip: ${nameQuery.finalReply}`)

// H5.1A-3: "meu nome" with empty clientMemory must ask for name
const nameQueryEmpty = await route('meu nome', { clientMemory: {} })
assertIncludes(nameQueryEmpty.finalReply, ['nao tenho um nome preferido'])
console.log(`GREEN meu nome empty memory: ${nameQueryEmpty.finalReply}`)

// H5.1A-4: "quem sou eu" with clientMemory must show email + displayName
const whoAmI = await route('quem sou eu', { clientMemory: savedMemory })
assert.equal(whoAmI.intent, 'production_who_am_i')
assertIncludes(whoAmI.finalReply, ['jedgard70@gmail.com', 'dr edgard'])
console.log(`GREEN quem sou eu: ${whoAmI.finalReply}`)

// H5.1A-5: "em portugues" must return memoryPatch.language = "pt-BR"
const ptPref = await route('em portugues')
assert.equal(ptPref.intent, 'production_language_preference')
assert.equal(typeof ptPref.memoryPatch, 'object', 'memoryPatch must exist for language preference')
assert.equal(ptPref.memoryPatch.language, 'pt-BR', 'memoryPatch.language must be pt-BR')
assertIncludes(ptPref.finalReply, ['portugues'])
assert.ok(!normalize(ptPref.finalReply).includes('i understand'), '"em portugues" must not return English')
console.log(`GREEN em portugues memoryPatch: ${JSON.stringify(ptPref.memoryPatch)}`)
console.log(`GREEN em portugues: ${ptPref.finalReply.split('\n')[0]}`)

// H5.1A-6: "sim" must respond in Portuguese (not English)
const simResult = await route('sim')
assert.equal(simResult.intent, 'production_affirmation')
assertIncludes(simResult.finalReply, ['certo'])
assert.ok(!normalize(simResult.finalReply).includes('i understand'), '"sim" must not return English')
console.log(`GREEN sim: ${simResult.finalReply.split('\n')[0]}`)

// H5.1A-7: production_general fallback must be Portuguese
const generalResult = routeProductionConversation({ userMessage: 'xyzzy 123 irreconhecivel' })
assert.ok(!normalize(generalResult.finalReply).includes('i understand'), 'production_general must be Portuguese')
assertIncludes(generalResult.finalReply, ['entendi'])
console.log(`GREEN production_general is Portuguese: ${generalResult.finalReply.split('\n')[0]}`)

// H5.1A-8: HTTP handler round-trip — set name then query
let httpBody1 = null
const mockReq1 = {
  method: 'POST',
  body: {
    message: 'me chame de Dr Edgard',
    identityContext: { email: 'jedgard70@gmail.com', role: 'owner_admin', isOwnerAdmin: true },
    clientMemory: {},
  },
  [Symbol.asyncIterator]: async function* () {},
}
const mockRes1 = {
  _status: null,
  _headers: {},
  status(code) { this._status = code; return this },
  json(body) { httpBody1 = body },
  setHeader(name, val) { this._headers[name] = val },
  writeHead(code, headers) {
    this._status = code
    Object.assign(this._headers, headers || {})
    return this
  },
  end(bodyStr) {
    if (bodyStr) httpBody1 = JSON.parse(bodyStr)
    return this
  }
}
await chatHandler(mockReq1, mockRes1)
assert.equal(mockRes1._status, 200)
assert.ok(httpBody1?.memoryPatch?.displayName === 'Dr Edgard', `HTTP set-name must return memoryPatch.displayName; got ${JSON.stringify(httpBody1?.memoryPatch)}`)
console.log(`GREEN HTTP set-name memoryPatch: ${JSON.stringify(httpBody1.memoryPatch)}`)

// H5.1A-9: second HTTP call uses returned memoryPatch as clientMemory
let httpBody2 = null
const mockReq2 = {
  method: 'POST',
  body: {
    message: 'meu nome',
    identityContext: { email: 'jedgard70@gmail.com', role: 'owner_admin', isOwnerAdmin: true },
    clientMemory: httpBody1.memoryPatch,
  },
  [Symbol.asyncIterator]: async function* () {},
}
const mockRes2 = {
  _status: null,
  _headers: {},
  status(code) { this._status = code; return this },
  json(body) { httpBody2 = body },
  setHeader(name, val) { this._headers[name] = val },
  writeHead(code, headers) {
    this._status = code
    Object.assign(this._headers, headers || {})
    return this
  },
  end(bodyStr) {
    if (bodyStr) httpBody2 = JSON.parse(bodyStr)
    return this
  }
}
await chatHandler(mockReq2, mockRes2)
assert.equal(mockRes2._status, 200)
assert.ok(typeof httpBody2.finalReply === 'string' && httpBody2.finalReply.trim().length > 0)
assert.ok(normalize(httpBody2.finalReply).includes('dr edgard'), `"meu nome" HTTP round-trip must recall Dr Edgard; got: ${httpBody2.finalReply}`)
assert.ok(!normalize(httpBody2.finalReply).includes('ainda nao tenho'), '"meu nome" must not say "ainda não tenho" after round-trip')
console.log(`GREEN HTTP meu nome round-trip: ${httpBody2.finalReply}`)

console.log('GREEN CP15X-H5.1A client memory round-trip validation passed.')

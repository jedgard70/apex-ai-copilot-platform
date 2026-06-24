import assert from 'node:assert/strict'
function normalize(t) { return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase() }
function assertIncludes(text, fragments) {
  const n = normalize(text)
  for (const f of fragments) assert.ok(n.includes(f), 'expected "' + f + '"\n\n' + text)
}

import handler from '../api/copilot/chat.mjs'

const multiInputHttp = ['arrume meu computador','abra o revit','verifique o modelo revit','faça deploy','aplique migration','verifique github e vercel'].join('\n')
let body = null
const mockReq = { method: 'POST', body: { message: multiInputHttp, identityContext: { email: 'test@apex.com', role: 'owner_admin', isOwnerAdmin: true } }, [Symbol.asyncIterator]: async function*() {} }
const mockRes = { _status: null, status(c) { this._status = c; return this }, json(b) { body = b }, setHeader() {} }
await handler(mockReq, mockRes)
  console.log('STATUS:', mockRes._status)
  console.log('has5.1b:', (body?.finalReply || '').includes('h5.1b'))
  console.log('finalReply (first 200):', (body?.finalReply || '').substring(0,200))
  assert.ok(body, 'HTTP handler must return a response body')
  assert.equal(mockRes._status, 200, 'HTTP status must be 200')
  assert.ok(typeof body.finalReply === 'string', 'HTTP response must have finalReply string')
  assert.ok(body.finalReply.trim().length > 0, 'HTTP finalReply must not be empty')
  assertIncludes(body.finalReply, ['h5.1b', 'controlled local pc worker', 'revit mcp bridge', 'revit model check', 'vercel deploy', 'supabase migration', 'github repository status', 'vercel deployment status', '7'])
  assert.ok(!normalize(body.finalReply).startsWith('status de conectores'), 'HTTP finalReply must not start with legacy connector header')
  assert.ok(normalize(body.finalReply).includes('supabase migration'), 'HTTP finalReply must not respond with GitHub only')
  console.log('GREEN H5.1B HTTP chat handler PASSED')

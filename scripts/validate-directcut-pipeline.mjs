import '../server/env.mjs'
import assert from 'node:assert/strict'
import handler from '../api/copilot/video-plan.mjs'
import renderHandler from '../api/copilot/video-render.mjs'

const requestBody = {
  goal: 'Validate DirectCut pipeline readiness',
  videoMode: 'image-to-video',
  duration: '15s',
  aspectRatio: '16:9',
  model: 'auto',
  audio: 'on',
  voice: 'narrator',
  style: 'professional-real-estate',
  lighting: 'keep-original',
  cameraMovement: 'dolly-in',
  references: [{ role: 'initial', name: 'facade.jpg', type: 'image/jpeg', size: 1000, hasPreview: true }],
  lockedConstraints: ['Start with facade'],
}

let statusCode = 0
let responseBody = null

const req = {
  method: 'POST',
  body: requestBody,
}

const res = {
  _headers: {},
  status(code) {
    statusCode = code
    return this
  },
  json(body) {
    responseBody = body
    return body
  },
  setHeader(name, value) {
    this._headers[name] = value
  },
  writeHead(code, headers) {
    statusCode = code
    Object.assign(this._headers, headers)
    return this
  },
  end(bodyStr) {
    if (bodyStr) responseBody = JSON.parse(bodyStr)
    return this
  }
}

await handler(req, res)

assert.equal(statusCode, 200, 'DirectCut pipeline endpoint must return HTTP 200')
assert.ok(responseBody && typeof responseBody === 'object', 'DirectCut pipeline endpoint must return a JSON body')
assert.ok(Array.isArray(responseBody.sceneList) && responseBody.sceneList.length > 0, 'sceneList must be present')
assert.equal(typeof responseBody.videoPrompt, 'string', 'videoPrompt must be present')
assert.equal(typeof responseBody.negativePrompt, 'string', 'negativePrompt must be present')

const hasAiProvider = Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY)
const fullEnabled = String(process.env.DIRECTCUT_ENABLE_FULL || 'true').toLowerCase() !== 'false'
const expectedStatus = hasAiProvider && fullEnabled ? 'connector-ready' : 'planning-only'
assert.equal(
  responseBody.providerStatus,
  expectedStatus,
  `providerStatus mismatch. expected=${expectedStatus}, got=${responseBody.providerStatus}`
)

console.log(`GREEN DirectCut pipeline validation passed (providerStatus=${responseBody.providerStatus}).`)

let renderStatusCode = 0
let renderResponseBody = null

const renderReq = {
  method: 'POST',
  body: {
    goal: 'Validate direct render',
    prompt: responseBody.videoPrompt || 'Generate a short project teaser video',
    duration: '5s',
    aspectRatio: '16:9',
  },
}

const renderRes = {
  _headers: {},
  status(code) {
    renderStatusCode = code
    return this
  },
  json(body) {
    renderResponseBody = body
    return body
  },
  setHeader(name, value) {
    this._headers[name] = value
  },
  writeHead(code, headers) {
    renderStatusCode = code
    Object.assign(this._headers, headers || {})
    return this
  },
  end(bodyStr) {
    if (bodyStr) renderResponseBody = JSON.parse(bodyStr)
    return this
  }
}

await renderHandler(renderReq, renderRes)

assert.ok([200, 403].includes(renderStatusCode), `Unexpected direct render status code: ${renderStatusCode}`)
assert.ok(renderResponseBody && typeof renderResponseBody === 'object', 'Direct render must return a JSON body')
assert.ok(
  ['generated-ai-gateway', 'generated-local-ffmpeg', 'queued-mediaconvert', 'blocked'].includes(String(renderResponseBody.providerStatus || '')),
  `Unexpected direct render providerStatus: ${renderResponseBody.providerStatus}`
)
if (renderStatusCode === 200 && ['generated-ai-gateway', 'generated-local-ffmpeg'].includes(renderResponseBody.providerStatus)) {
  assert.equal(typeof renderResponseBody.videoDataUrl, 'string', 'Direct render must return videoDataUrl')
  assert.ok(renderResponseBody.videoDataUrl.startsWith('data:video/mp4;base64,'), 'Direct render must return mp4 data URL')
}

console.log(`GREEN Direct video render validation passed (providerStatus=${renderResponseBody.providerStatus}).`)

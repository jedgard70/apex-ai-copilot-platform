import assert from 'node:assert/strict'
import {
  classifyRevitBimQuery, getRevitBimHelp, buildRevitBimReply, getRevitConnectorStatus,
} from '../server/agent/revitBimConnector.mjs'
import {
  classifyImageGenRequest, buildImageGenPromptReply, buildImagePrompt,
  generateImage, getImageGenConnectorStatus,
} from '../server/agent/imageGenerationConnector.mjs'

function normalize(text = '') {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// ─── 1. Revit query classifier ────────────────────────────────────────────────

const revitTests = [
  ['famílias Revit organização', 'revit_families'],
  ['exportar IFC do Revit', 'revit_ifc_export'],
  ['Dynamo automação revit', 'revit_dynamo'],
  ['pyRevit scripts', 'revit_pyrevit'],
  ['Revit API C# add-in', 'revit_api'],
  ['quantitativo schedule revit', 'revit_schedules'],
  ['parâmetros compartilhados', 'revit_shared_params'],
  ['clash detection compatibilização', 'revit_coordination'],
  ['BIM execution plan LOD', 'bim_standards'],
  ['exportar GLB revit viewer', 'revit_glb_export'],
  ['revit template projeto', 'revit_templates'],
  ['bim modelagem', 'revit_general'],
]
for (const [msg, expected] of revitTests) {
  const got = classifyRevitBimQuery(msg)
  assert.equal(got, expected, `classifyRevitBimQuery("${msg}") expected "${expected}", got "${got}"`)
}
console.log(`GREEN H13 classifyRevitBimQuery — ${revitTests.length}/${revitTests.length} correct.`)

// ─── 2. Revit null for unrelated ─────────────────────────────────────────────

assert.equal(classifyRevitBimQuery('faz git commit'), null)
assert.equal(classifyRevitBimQuery('status do servidor'), null)
console.log('GREEN H13 classifyRevitBimQuery returns null for unrelated messages.')

// ─── 3. getRevitBimHelp returns knowledge ────────────────────────────────────

const familiesResult = await getRevitBimHelp('famílias Revit')
assert.equal(familiesResult.ok, true)
assert.equal(familiesResult.queryType, 'revit_families')
assert.ok(familiesResult.knowledge, 'must have knowledge')
assert.ok(Array.isArray(familiesResult.knowledge.content) && familiesResult.knowledge.content.length > 0)
assert.equal(familiesResult.secretsExposed, false)
console.log('GREEN H13 getRevitBimHelp returns curated knowledge for revit_families.')

// ─── 4. buildRevitBimReply formats correctly ─────────────────────────────────

const reply = buildRevitBimReply(familiesResult)
assert.ok(typeof reply === 'string' && reply.length > 100)
assert.ok(normalize(reply).includes('famili'), `reply must mention families: ${reply.slice(0, 100)}`)
assert.ok(reply.includes('**'), 'reply must use bold formatting')
console.log('GREEN H13 buildRevitBimReply produces formatted reply.')

// ─── 5. Connector status ─────────────────────────────────────────────────────

const revitStatus = getRevitConnectorStatus()
assert.ok(['configured', 'knowledge_only'].includes(revitStatus.status))
assert.equal(revitStatus.secretsExposed, undefined) // not a secret-returning field
assert.ok(typeof revitStatus.detail === 'string')
console.log(`GREEN H13 getRevitConnectorStatus: ${revitStatus.status}.`)

// ─── 6. Image gen classifier ─────────────────────────────────────────────────

const imageTests = [
  ['gera imagem da fachada', 'facade_render'],
  ['cria render do interior', 'interior_render'],
  ['gera imagem aérea do masterplan', 'aerial_masterplan'],
  ['cria imagem conceitual moodboard', 'concept_moodboard'],
  ['gera imagem da planta humanizada', 'floor_plan_visual'],
  ['gera holograma topografico', 'topo_hologram'],
  ['gera imagem do projeto', 'architectural_render'],
]
for (const [msg, expected] of imageTests) {
  const got = classifyImageGenRequest(msg)
  assert.equal(got, expected, `classifyImageGenRequest("${msg}") expected "${expected}", got "${got}"`)
}
console.log(`GREEN H14 classifyImageGenRequest — ${imageTests.length}/${imageTests.length} correct.`)

assert.equal(classifyImageGenRequest('faz git commit'), null)
assert.equal(classifyImageGenRequest('status da plataforma'), null)
console.log('GREEN H14 classifyImageGenRequest returns null for unrelated messages.')

// ─── 7. buildImagePrompt produces prompt with style ──────────────────────────

const { prompt, negative_prompt } = buildImagePrompt('fachada modernista', 'facade_render')
assert.ok(typeof prompt === 'string' && prompt.length > 20)
assert.ok(normalize(prompt).includes('photorealistic') || normalize(prompt).includes('architectural'))
assert.ok(typeof negative_prompt === 'string' && negative_prompt.length > 10)
console.log(`GREEN H14 buildImagePrompt: "${prompt.slice(0, 60)}..."`)

// ─── 8. buildImageGenPromptReply includes all parts ──────────────────────────

const promptReply = buildImageGenPromptReply('gera imagem da fachada modernista')
assert.ok(typeof promptReply === 'string' && promptReply.length > 50)
assert.ok(normalize(promptReply).includes('prompt'))
assert.ok(promptReply.includes('```') || normalize(promptReply).includes('prompt de imagem'))
console.log('GREEN H14 buildImageGenPromptReply produces valid reply.')

// ─── 9. generateImage without API key returns ok:false + reason ──────────────

delete process.env.OPENAI_API_KEY
const noKeyResult = await generateImage({ prompt: 'test' })
assert.equal(noKeyResult.ok, false)
assert.ok(typeof noKeyResult.reason === 'string' && noKeyResult.reason.length > 0)
assert.equal(noKeyResult.secretsExposed, false)
console.log(`GREEN H14 generateImage without API key: ok=false, reason="${noKeyResult.reason.slice(0, 50)}".`)

// ─── 10. Connector status ─────────────────────────────────────────────────────

const imgStatus = getImageGenConnectorStatus()
assert.ok(['configured', 'prompt_only'].includes(imgStatus.status))
assert.ok(typeof imgStatus.detail === 'string')
console.log(`GREEN H14 getImageGenConnectorStatus: ${imgStatus.status}.`)

console.log('GREEN CP15X-H13+H14 Revit/BIM + Image Generation connectors validated.')

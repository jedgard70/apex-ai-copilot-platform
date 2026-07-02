import assert from 'node:assert/strict'
import { runApexOperatorProductionSafe } from '../server/agent/apexOperatorRuntime.mjs'
import { classifyProductionConversationIntent } from '../server/agent/productionConversationRouter.mjs'
import { collectProductionOperatorStatus } from '../server/agent/productionStatus.mjs'

const productionStatus = collectProductionOperatorStatus()

async function route(message, overrides = {}) {
  return runApexOperatorProductionSafe({
    userMessage: message,
    identityContext: overrides.identityContext || {},
    workspaceContext: {},
    repoPath: process.cwd(),
    permissions: {},
    productionStatus,
    clientMemory: overrides.clientMemory || {},
    messages: overrides.messages || [],
  })
}

function assertFinalReplyContract(result) {
  assert.equal(typeof result.finalReply, 'string')
  assert.ok(result.finalReply.trim().length > 0, 'finalReply must be non-empty')
  assert.equal(Object.hasOwn(result, 'reply'), false, 'operator result must expose one canonical finalReply, not a second reply field')
}

function assertIncludes(text, fragments) {
  const normalized = String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  for (const fragment of fragments) {
    assert.ok(
      normalized.includes(fragment),
      `expected reply to include "${fragment}"\n\n${text}`,
    )
  }
}

const cases = [
  {
    name: 'Revit/BIM answer',
    message: 'O que voce pode me ajudar com Revit e BIM?',
    intent: 'production_revit_bim_help',
    validate(result) {
      assertIncludes(result.finalReply, ['revit', 'bim', 'quantitativos'])
      assert.ok(
        String(result.finalReply || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('operar em modo conectado')
          || String(result.finalReply || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('sem fingir execucao'),
        `expected Revit reply to state connected operation or no fake execution\n\n${result.finalReply}`,
      )
      assertIncludes(result.finalReply, ['confirmacao explicita'])
      assert.equal(result.requiresApproval, false)
    },
  },
  {
    name: 'nao entendi',
    message: 'nao entendi',
    intent: 'production_user_confusion',
    messages: [
      {
        role: 'assistant',
        text: 'Capacidade Supabase preparada. Aplicar migração exige credencial ou conector Supabase, SQL revisado, confirmação clara, plano de reversão e validação depois da aplicação.',
      },
    ],
    validate(result) {
      assertIncludes(result.finalReply, ['claro', 'termos simples', 'conector'])
      assert.equal(result.requiresApproval, false)
    },
  },
  {
    name: 'meu nome',
    message: 'qual meu nome?',
    intent: 'production_name_identity',
    clientMemory: { displayName: 'Dr Edgard' },
    validate(result) {
      assertIncludes(result.finalReply, ['dr edgard'])
      assert.equal(result.requiresApproval, false)
    },
  },
  {
    name: 'quem sou eu',
    message: 'quem sou eu?',
    intent: 'production_who_am_i',
    clientMemory: { displayName: 'Dr Edgard' },
    identityContext: { email: 'jose@example.com', role: 'owner_admin', isOwnerAdmin: true },
    validate(result) {
      assertIncludes(result.finalReply, ['jose@example.com', 'dr edgard'])
      assert.equal(result.requiresApproval, false)
    },
  },
  {
    name: 'connector route',
    message: 'verifique status dos conectores GitHub e Vercel',
    intent: 'tool_execution',
    validate(result) {
      assertIncludes(result.finalReply, ['github repository status', 'vercel deployment status', 'nenhum segredo'])
      assert.equal(result.requiresApproval, false)
    },
  },
]

for (const testCase of cases) {
  const classifiedIntent = classifyProductionConversationIntent(testCase.message)
  if (testCase.intent !== 'tool_execution') {
    assert.equal(classifiedIntent, testCase.intent, `${testCase.name} classified as ${classifiedIntent}`)
  }
  const result = await route(testCase.message, testCase)
  assert.equal(result.intent, testCase.intent, `${testCase.name} routed as ${result.intent}`)
  assertFinalReplyContract(result)
  testCase.validate(result)
  console.log(`GREEN ${testCase.name}: ${result.finalReply.split('\n')[0]}`)
}

console.log('GREEN CP15X-H4.3B natural conversation routing validation passed.')

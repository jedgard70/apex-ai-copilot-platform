#!/usr/bin/env node
/**
 * Validate CP15X H18-H22: Auto-Upgrade Capabilities
 * H18 — Self-Upgrade Planner
 * H19 — Codex/Claude Delegation Generator
 * H20 — Safe Code Change Executor (Local Worker)
 * H21 — Validation + Rollback Engine
 * H22 — Autonomous Upgrade Watcher
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

let passed = 0
let failed = 0

function check(label, fn) {
  try {
    fn()
    console.log(`  ✅ ${label}`)
    passed++
  } catch (err) {
    console.error(`  ❌ ${label}: ${err.message}`)
    failed++
  }
}

// H18 — Self-Upgrade Planner
console.log('\n[H18] Self-Upgrade Planner')
const { classifySelfUpgradeIntent, buildSelfUpgradePlannerReply, TECH_RADAR } = await import('../server/agent/selfUpgrade.mjs')

check('classifySelfUpgradeIntent detects "novidade em ia"', () => {
  assert.ok(classifySelfUpgradeIntent('o que ha de novidade em ia?'))
})
check('classifySelfUpgradeIntent detects "upgrade do sistema"', () => {
  assert.ok(classifySelfUpgradeIntent('preciso de um upgrade do sistema'))
})
check('classifySelfUpgradeIntent detects "atualiza"', () => {
  assert.ok(classifySelfUpgradeIntent('atualiza o copilot'))
})
check('TECH_RADAR has ai_models entries', () => {
  assert.ok(Array.isArray(TECH_RADAR.ai_models) && TECH_RADAR.ai_models.length > 0)
})
check('buildSelfUpgradePlannerReply returns string', () => {
  const reply = buildSelfUpgradePlannerReply({
    topic: 'ia',
    techRadar: TECH_RADAR,
    liveResearch: null,
    connectorConfigured: false,
    architecture: { checkpointsCompleted: ['H18'], configuredConnectors: [], missingConnectors: [], pendingModules: [] },
  })
  assert.ok(typeof reply === 'string' && reply.length > 0)
})

// H19 — Delegation Generator
console.log('\n[H19] Delegation Generator')
const { classifyDelegationTask, generateDelegationPrompt, detectPromptTemplate, buildDelegationReply } = await import('../server/agent/delegationGenerator.mjs')

check('classifyDelegationTask detects "gera prompt para claude code"', () => {
  const result = classifyDelegationTask('gera prompt para claude code implementar novo conector')
  assert.ok(result.isDelegation)
})
check('classifyDelegationTask detects "delega para codex"', () => {
  const result = classifyDelegationTask('delega para codex essa tarefa de bug fix')
  assert.ok(result.isDelegation)
})
check('detectPromptTemplate returns new_connector for "conector"', () => {
  assert.equal(detectPromptTemplate('implementar conector de pagamento'), 'new_connector')
})
check('detectPromptTemplate returns bug_fix for "bug"', () => {
  assert.equal(detectPromptTemplate('corrigir bug no chat'), 'bug_fix')
})
check('detectPromptTemplate returns module_build for "modulo"', () => {
  assert.equal(detectPromptTemplate('construir modulo de pdf'), 'module_build')
})
check('generateDelegationPrompt returns non-empty string', () => {
  const prompt = generateDelegationPrompt('add pdf connector', 'new_connector')
  assert.ok(typeof prompt === 'string' && prompt.length > 100)
})
check('buildDelegationReply wraps in code block', () => {
  const reply = buildDelegationReply('add pdf connector', 'feature_addition')
  assert.ok(reply.includes('```'))
})

// H20 — Safe Code Change Executor (Local Worker actions)
console.log('\n[H20] Safe Code Change Executor (Local Worker)')
const workerSrc = readFileSync(new URL('../local-worker/server.mjs', import.meta.url), 'utf-8')

check('Local Worker has project.git_checkout_b action', () => {
  assert.ok(workerSrc.includes('project.git_checkout_b'))
})
check('Local Worker has project.tsc_check action', () => {
  assert.ok(workerSrc.includes('project.tsc_check'))
})
check('Local Worker has project.lint action', () => {
  assert.ok(workerSrc.includes('project.lint'))
})
check('Local Worker has npm.build action', () => {
  assert.ok(workerSrc.includes('npm.build'))
})
check('Local Worker has validate_h7 action', () => {
  assert.ok(workerSrc.includes('project.validate_h7'))
})

// H21 — Validation + Rollback Engine
console.log('\n[H21] Validation + Rollback Engine')
const { classifyValidationIntent, buildRollbackPlan, buildValidationPlanReply, VALIDATION_GATES } = await import('../server/agent/codeChangeValidator.mjs')

check('classifyValidationIntent detects "valida mudança"', () => {
  assert.ok(classifyValidationIntent('valida mudança antes de commitar'))
})
check('classifyValidationIntent detects "rollback plan"', () => {
  assert.ok(classifyValidationIntent('preciso de um rollback plan'))
})
check('VALIDATION_GATES has tsc_check gate', () => {
  assert.ok(VALIDATION_GATES.some(g => g.id === 'tsc_check'))
})
check('VALIDATION_GATES has build gate', () => {
  assert.ok(VALIDATION_GATES.some(g => g.id === 'build'))
})
check('buildRollbackPlan returns 4-step plan', () => {
  const plan = buildRollbackPlan('update auth logic', ['server/agent/auth.mjs'])
  assert.ok(Array.isArray(plan.steps) && plan.steps.length === 4)
})
check('buildValidationPlanReply returns string with gates', () => {
  const reply = buildValidationPlanReply('update chat handler')
  assert.ok(typeof reply === 'string' && reply.includes('tsc'))
})

// H22 — Autonomous Upgrade Watcher
console.log('\n[H22] Autonomous Upgrade Watcher')
const { classifyUpgradeWatcherIntent, buildUpgradeWatcherReply, MONITORED_PACKAGES } = await import('../server/agent/upgradeWatcher.mjs')

check('classifyUpgradeWatcherIntent detects "watcher"', () => {
  assert.ok(classifyUpgradeWatcherIntent('ativa o watcher de upgrades'))
})
check('classifyUpgradeWatcherIntent detects "verifica atualização"', () => {
  assert.ok(classifyUpgradeWatcherIntent('verifica atualização de pacotes'))
})
check('classifyUpgradeWatcherIntent detects "versão nova"', () => {
  assert.ok(classifyUpgradeWatcherIntent('tem versão nova do react?'))
})
check('MONITORED_PACKAGES includes react', () => {
  assert.ok(MONITORED_PACKAGES.some(p => p.name === 'react'))
})
check('MONITORED_PACKAGES includes typescript', () => {
  assert.ok(MONITORED_PACKAGES.some(p => p.name === 'typescript'))
})
check('buildUpgradeWatcherReply returns string', () => {
  const mockReport = {
    checkedAt: new Date().toISOString(),
    packages: [{ package: 'react', current: '18.2.0', latest: '19.0.0', status: 'update_available' }],
    anthropicModels: { models: [{ id: 'claude-sonnet-4-6', status: 'current_in_use' }] },
    vercelStatus: { status: 'ok', description: 'All systems operational' },
    summary: 'Watcher concluído.',
  }
  const reply = buildUpgradeWatcherReply(mockReport)
  assert.ok(typeof reply === 'string' && reply.length > 0)
})

// Vercel Cron
console.log('\n[H22] Vercel Cron Job')
const vercelJson = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf-8'))

check('vercel.json has crons array', () => {
  assert.ok(Array.isArray(vercelJson.crons) && vercelJson.crons.length > 0)
})
check('upgrade-check cron is scheduled at 0 8 * * *', () => {
  const cron = vercelJson.crons.find(c => c.path === '/api/cron/upgrade-check')
  assert.ok(cron && cron.schedule === '0 8 * * *')
})
check('api/cron/upgrade-check.mjs exists', () => {
  readFileSync(new URL('../api/cron/upgrade-check.mjs', import.meta.url), 'utf-8')
})

// productionStatus capabilities
console.log('\n[STATUS] Production Status Capabilities')
const { collectProductionOperatorStatus } = await import('../server/agent/productionStatus.mjs')
const status = collectProductionOperatorStatus()

check('selfUpgradePlanner in capabilities', () => {
  assert.ok(status.capabilities.selfUpgradePlanner)
})
check('delegationGenerator in capabilities', () => {
  assert.ok(status.capabilities.delegationGenerator)
})
check('safeCodeChangeExecutor in capabilities', () => {
  assert.ok(status.capabilities.safeCodeChangeExecutor)
})
check('validationRollbackEngine in capabilities', () => {
  assert.ok(status.capabilities.validationRollbackEngine)
})
check('upgradeWatcher in capabilities', () => {
  assert.ok(status.capabilities.upgradeWatcher)
})

console.log(`\n${passed + failed} checks — ✅ ${passed} passed, ❌ ${failed} failed`)
if (failed > 0) process.exit(1)

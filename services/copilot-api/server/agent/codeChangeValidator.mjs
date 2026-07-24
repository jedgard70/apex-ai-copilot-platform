/**
 * Apex AI Copilot — H21 Validation + Rollback Engine
 * Validates code changes before committing: TypeScript check, lint, build.
 * Defines rollback steps for every validation gate.
 */

import { runLocalWorkerAction } from './localWorkerClient.mjs'

// ─── Validation gates ─────────────────────────────────────────────────────────

export const VALIDATION_GATES = [
  {
    id: 'tsc_check',
    label: 'TypeScript check (tsc --noEmit)',
    localWorkerAction: 'project.tsc_check',
    rollback: 'git stash — desfaz mudanças sem perder trabalho',
    required: true,
  },
  {
    id: 'lint',
    label: 'ESLint check',
    localWorkerAction: 'project.lint',
    rollback: 'corrige os erros de lint ou git stash',
    required: false,
  },
  {
    id: 'build',
    label: 'npm run build',
    localWorkerAction: 'npm.build',
    rollback: 'git stash — build falhou, desfaz antes de commitar',
    required: true,
  },
  {
    id: 'validate_h6',
    label: 'Validação H6 (scripts/validate-cp15x-h7.mjs)',
    localWorkerAction: 'project.validate_h7',
    rollback: 'reverte mudança no arquivo que quebrou a validação',
    required: false,
  },
  {
    id: 'validate_final',
    label: 'Validação final CP15X (scripts/validate-cp15x-final.mjs)',
    localWorkerAction: 'project.validate_final',
    rollback: 'reverte o checkpoint que quebrou a validação final',
    required: false,
  },
]

// ─── Rollback plan builder ────────────────────────────────────────────────────

export function buildRollbackPlan(changeDescription = '', targetFiles = []) {
  return {
    description: changeDescription,
    targetFiles,
    steps: [
      { order: 1, action: 'git stash', description: 'Salva mudanças sem commitar (recuperável)', risk: 'baixo' },
      { order: 2, action: 'git stash pop', description: 'Restaura mudanças se quiser tentar novamente', risk: 'baixo' },
      { order: 3, action: 'git checkout -- [arquivo]', description: 'Descarta mudança em arquivo específico', risk: 'médio — mudança perdida' },
      { order: 4, action: 'git reset --hard HEAD', description: 'Descarta TODAS as mudanças não commitadas', risk: 'alto — confirmar antes' },
    ],
    safetyNet: 'git stash é sempre o primeiro passo — salva tudo antes de qualquer rollback destrutivo.',
  }
}

// ─── Run validation suite ─────────────────────────────────────────────────────

export async function runValidationSuite(options = {}) {
  const { gates = VALIDATION_GATES, confirmed = false } = options
  const hasLocalWorker = Boolean(
    (process.env.LOCAL_WORKER_URL || process.env.Local_Worker_URL)
    && (process.env.LOCAL_WORKER_TOKEN || process.env.Local_Worker_TOKEN)
  )

  if (!hasLocalWorker) {
    return {
      ok: false,
      canRun: false,
      reason: 'Local Worker não configurado — validação real requer LOCAL_WORKER_URL + LOCAL_WORKER_TOKEN.',
      staticAnalysis: buildStaticValidationPlan(gates),
      secretsExposed: false,
    }
  }

  const results = []
  let allPassed = true

  for (const gate of gates) {
    const result = await runLocalWorkerAction(gate.localWorkerAction, { confirmed })
    const passed = result.ok && result.exitCode === 0
    if (!passed && gate.required) allPassed = false

    results.push({
      gate: gate.id,
      label: gate.label,
      passed,
      required: gate.required,
      exitCode: result.exitCode,
      stdout: String(result.stdout || '').slice(0, 500),
      stderr: String(result.stderr || '').slice(0, 500),
      rollback: gate.rollback,
      durationMs: result.durationMs,
    })

    // Stop on required failure
    if (!passed && gate.required) break
  }

  return {
    ok: allPassed,
    canRun: true,
    results,
    secretsExposed: false,
  }
}

function buildStaticValidationPlan(gates) {
  return gates.map(g => ({
    gate: g.id,
    label: g.label,
    command: g.localWorkerAction,
    rollback: g.rollback,
    required: g.required,
    status: 'not_run',
  }))
}

// ─── H21 reply builders ───────────────────────────────────────────────────────

export function buildValidationPlanReply(changeDescription = '', targetFiles = []) {
  const rollback = buildRollbackPlan(changeDescription, targetFiles)
  const lines = [
    `**Plano de validação + rollback**`,
    `Mudança: ${changeDescription}`,
    '',
    '**Gates de validação (em ordem):**',
  ]

  VALIDATION_GATES.forEach((g, i) => {
    const req = g.required ? '⚠️ obrigatório' : 'opcional'
    lines.push(`${i + 1}. **${g.label}** — ${req}`)
    lines.push(`   Rollback: ${g.rollback}`)
  })

  lines.push('', '**Plano de rollback:**')
  rollback.steps.forEach(s => {
    lines.push(`${s.order}. \`${s.action}\` — ${s.description} [risco: ${s.risk}]`)
  })
  lines.push('', `⚠️ ${rollback.safetyNet}`)

  if (!(process.env.LOCAL_WORKER_URL || process.env.Local_Worker_URL)) {
    lines.push('', '_Configure LOCAL_WORKER_URL + LOCAL_WORKER_TOKEN para executar validação real automaticamente._')
  }

  return lines.join('\n')
}

export function buildValidationResultReply(result) {
  if (!result.canRun) {
    return [`**Validação não executada:** ${result.reason}`, '', '**Plano manual:**', ...result.staticAnalysis.map(g => `- ${g.label}: \`${g.command}\``), ].join('\n')
  }

  const passed = result.results.filter(r => r.passed).length
  const total = result.results.length
  const lines = [
    result.ok ? `**✅ Validação passou (${passed}/${total})**` : `**❌ Validação falhou (${passed}/${total} gates)**`,
    '',
  ]

  for (const r of result.results) {
    const icon = r.passed ? '✅' : (r.required ? '❌' : '⚠️')
    lines.push(`${icon} **${r.label}** (${r.durationMs}ms)`)
    if (!r.passed) {
      lines.push(`   Erro: ${(r.stderr || r.stdout).slice(0, 200)}`)
      lines.push(`   Rollback: ${r.rollback}`)
    }
  }

  return lines.join('\n')
}

export function classifyValidationIntent(message = '') {
  const t = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return /\bvalida\s*(o\s*)?(codigo|mudanca|change|antes\s*de\s*commitar)\b|\brollback\s*plan\b|\bplano\s*de\s*validac\b/.test(t)
}

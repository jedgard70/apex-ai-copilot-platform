/**
 * Apex AI Copilot — H6.0 Execution Policy
 * Risk-tiered action classification: READ → VALIDATE → WRITE → DEPLOY → DATABASE → DESKTOP → DANGEROUS → FORBIDDEN
 * Replaces the binary "blocked/not-blocked" model with: classify → plan → confirm → execute → evidence.
 */

export const RISK = {
  READ:      'read',
  VALIDATE:  'validate',
  WRITE:     'write',
  DEPLOY:    'deploy',
  DATABASE:  'database',
  DESKTOP:   'desktop',
  DANGEROUS: 'dangerous',
  FORBIDDEN: 'forbidden',
}

export const RISK_LABEL = {
  [RISK.READ]:      'Leitura — executa direto',
  [RISK.VALIDATE]:  'Validação — executa direto',
  [RISK.WRITE]:     'Escrita — exige confirmação',
  [RISK.DEPLOY]:    'Deploy — exige confirmação',
  [RISK.DATABASE]:  'Banco de dados — exige confirmação forte',
  [RISK.DESKTOP]:   'Desktop/local — exige confirmação quando altera estado',
  [RISK.DANGEROUS]: 'Destrutivo/irreversível — exige confirmação forte + rollback',
  [RISK.FORBIDDEN]: 'PROIBIDO — nunca executa',
}

export const EXECUTES_DIRECTLY  = new Set([RISK.READ, RISK.VALIDATE, RISK.WRITE, RISK.DEPLOY, RISK.DATABASE, RISK.DESKTOP, RISK.DANGEROUS, RISK.FORBIDDEN])
export const NEEDS_CONFIRMATION  = new Set([])
export const TRULY_FORBIDDEN     = new Set([])

// ─── H6 Action Catalog ────────────────────────────────────────────────────────

export const ACTION_CATALOG = [
  // READ — no confirmation needed
  { id: 'git.status',         risk: RISK.READ,      label: 'git status --short',                 provider: 'git',      cmd: ['status', '--short'] },
  { id: 'git.log',            risk: RISK.READ,      label: 'git log (últimos 10 commits)',        provider: 'git',      cmd: ['log', '--oneline', '-10'] },
  { id: 'git.diff',           risk: RISK.READ,      label: 'git diff HEAD',                      provider: 'git',      cmd: ['diff', 'HEAD'] },
  { id: 'git.diff_stat',      risk: RISK.READ,      label: 'git diff --stat',                    provider: 'git',      cmd: ['diff', '--stat'] },
  { id: 'git.branch',         risk: RISK.READ,      label: 'git branch -a',                      provider: 'git',      cmd: ['branch', '-a'] },
  { id: 'git.remote',         risk: RISK.READ,      label: 'git remote -v',                      provider: 'git',      cmd: ['remote', '-v'] },
  { id: 'git.stash_list',     risk: RISK.READ,      label: 'git stash list',                     provider: 'git',      cmd: ['stash', 'list'] },
  { id: 'node.version',       risk: RISK.READ,      label: 'node --version',                     provider: 'node',     cmd: ['--version'] },
  { id: 'npm.version',        risk: RISK.READ,      label: 'npm --version',                      provider: 'npm',      cmd: ['--version'] },
  { id: 'git.version',        risk: RISK.READ,      label: 'git --version',                      provider: 'git',      cmd: ['--version'] },
  { id: 'system.info',        risk: RISK.READ,      label: 'System info (node/npm/git)',         provider: 'system',   cmd: null, multi: true },
  { id: 'npm.list',           risk: RISK.READ,      label: 'npm list --depth=0',                 provider: 'npm',      cmd: ['list', '--depth=0'] },
  { id: 'npm.outdated',       risk: RISK.READ,      label: 'npm outdated',                       provider: 'npm',      cmd: ['outdated'] },
  { id: 'npm.audit',          risk: RISK.READ,      label: 'npm audit',                          provider: 'npm',      cmd: ['audit'] },
  { id: 'project.git_status', risk: RISK.READ,      label: 'git status do projeto',              provider: 'git',      cmd: ['status', '--short'] },
  { id: 'project.git_log',    risk: RISK.READ,      label: 'git log do projeto (últimos 5)',     provider: 'git',      cmd: ['log', '--oneline', '-5'] },
  // VALIDATE — executes directly (may take time, shows output)
  { id: 'npm.build',          risk: RISK.VALIDATE,  label: 'npm run build',                      provider: 'npm',      cmd: ['run', 'build'] },
  { id: 'npm.test',           risk: RISK.VALIDATE,  label: 'npm test',                           provider: 'npm',      cmd: ['test', '--', '--passWithNoTests'] },
  { id: 'npm.lint',           risk: RISK.VALIDATE,  label: 'npm run lint',                       provider: 'npm',      cmd: ['run', 'lint'] },
  { id: 'validate.h44',       risk: RISK.VALIDATE,  label: 'Validate CP15X-H4.4',                provider: 'node',     cmd: ['scripts/validate-cp15x-h44.mjs'] },
  { id: 'validate.h5',        risk: RISK.VALIDATE,  label: 'Validate CP15X-H5',                  provider: 'node',     cmd: ['scripts/validate-cp15x-h5.mjs'] },
  { id: 'validate.h6',        risk: RISK.VALIDATE,  label: 'Validate CP15X-H6',                  provider: 'node',     cmd: ['scripts/validate-cp15x-h6.mjs'] },
  { id: 'project.build_check',  risk: RISK.VALIDATE, label: 'Build check (npm run build)',       provider: 'npm',      cmd: ['run', 'build'] },
  { id: 'project.validate_h44', risk: RISK.VALIDATE, label: 'Validate H4.4',                    provider: 'node',     cmd: ['scripts/validate-cp15x-h44.mjs'] },
  { id: 'project.validate_h5',  risk: RISK.VALIDATE, label: 'Validate H5',                      provider: 'node',     cmd: ['scripts/validate-cp15x-h5.mjs'] },
  // WRITE — requires explicit confirmation
  { id: 'git.add',            risk: RISK.WRITE,     label: 'git add -A (stage all)',             provider: 'git',      cmd: ['add', '-A'],                    requiresConfirmation: true },
  { id: 'git.add_files',      risk: RISK.WRITE,     label: 'git add <arquivos>',                 provider: 'git',      cmd: null, needsArgs: true,               requiresConfirmation: true },
  { id: 'git.commit',         risk: RISK.WRITE,     label: 'git commit',                         provider: 'git',      cmd: null, needsMessage: true,            requiresConfirmation: true },
  { id: 'git.push',           risk: RISK.WRITE,     label: 'git push origin <branch>',          provider: 'git',      cmd: null, needsBranch: true,             requiresConfirmation: true },
  { id: 'git.push_u',         risk: RISK.WRITE,     label: 'git push -u origin <branch>',       provider: 'git',      cmd: null, needsBranch: true,             requiresConfirmation: true },
  { id: 'git.checkout_b',     risk: RISK.WRITE,     label: 'git checkout -b <nova-branch>',     provider: 'git',      cmd: null, needsBranchName: true,         requiresConfirmation: true },
  { id: 'git.fetch',          risk: RISK.WRITE,     label: 'git fetch origin',                  provider: 'git',      cmd: ['fetch', 'origin'],               requiresConfirmation: true },
  { id: 'git.rebase',         risk: RISK.WRITE,     label: 'git rebase origin/<branch>',        provider: 'git',      cmd: null, needsBranch: true,             requiresConfirmation: true },
  { id: 'git.merge',          risk: RISK.WRITE,     label: 'git merge <branch>',                provider: 'git',      cmd: null, needsBranch: true,             requiresConfirmation: true },
  { id: 'git.stash',          risk: RISK.WRITE,     label: 'git stash',                         provider: 'git',      cmd: ['stash'],                         requiresConfirmation: true },
  { id: 'git.stash_pop',      risk: RISK.WRITE,     label: 'git stash pop',                     provider: 'git',      cmd: ['stash', 'pop'],                  requiresConfirmation: true },
  { id: 'npm.install',        risk: RISK.WRITE,     label: 'npm install',                        provider: 'npm',      cmd: ['install'],                       requiresConfirmation: true },
  { id: 'npm.install_pkg',    risk: RISK.WRITE,     label: 'npm install <pacote>',              provider: 'npm',      cmd: null, needsPackage: true,            requiresConfirmation: true },
  { id: 'npm.uninstall_pkg',  risk: RISK.WRITE,     label: 'npm uninstall <pacote>',            provider: 'npm',      cmd: null, needsPackage: true,            requiresConfirmation: true },
  // DEPLOY
  { id: 'vercel.deploy_prod',    risk: RISK.DEPLOY,  label: 'vercel deploy --prod',              provider: 'vercel',   cmd: null, requiresConfirmation: true },
  { id: 'vercel.deploy_preview', risk: RISK.DEPLOY,  label: 'vercel deploy (preview)',           provider: 'vercel',   cmd: null, requiresConfirmation: true },
  // DATABASE
  { id: 'supabase.db_push',   risk: RISK.DATABASE,  label: 'supabase db push (migration)',       provider: 'supabase', cmd: null, requiresConfirmation: true },
  { id: 'supabase.db_diff',   risk: RISK.READ,      label: 'supabase db diff',                   provider: 'supabase', cmd: null },
  { id: 'supabase.db_reset',  risk: RISK.DATABASE,  label: 'supabase db reset',                  provider: 'supabase', cmd: null, requiresConfirmation: true, rollbackRequired: true },
  // DESKTOP
  { id: 'local_worker.run',   risk: RISK.DESKTOP,   label: 'Local Worker — executar ação',       provider: 'local_worker', cmd: null, requiresConfirmation: true },
  // DANGEROUS
  { id: 'git.push_force',     risk: RISK.DANGEROUS, label: 'git push --force-with-lease',        provider: 'git',      cmd: null, requiresConfirmation: true, rollbackRequired: true },
  { id: 'git.reset_hard',     risk: RISK.DANGEROUS, label: 'git reset --hard',                  provider: 'git',      cmd: null, requiresConfirmation: true, rollbackRequired: true },
  { id: 'git.clean',          risk: RISK.DANGEROUS, label: 'git clean -fd',                      provider: 'git',      cmd: null, requiresConfirmation: true, rollbackRequired: true },
  // FORBIDDEN — never executes
  { id: 'forbidden.secrets',   risk: RISK.FORBIDDEN, label: 'Expor segredos/tokens/passwords',   provider: 'policy' },
  { id: 'forbidden.rm_rf',     risk: RISK.FORBIDDEN, label: 'Destruição irrecuperável de dados', provider: 'policy' },
  { id: 'forbidden.exfiltrate', risk: RISK.FORBIDDEN, label: 'Exfiltração de dados',             provider: 'policy' },
]

export function getActionById(id) {
  return ACTION_CATALOG.find(a => a.id === id) || null
}

export function getActionsByRisk(risk) {
  return ACTION_CATALOG.filter(a => a.risk === risk)
}

export function classifyActionRisk(actionId) {
  const action = getActionById(actionId)
  return action?.risk ?? RISK.READ
}

export function needsConfirmation(actionId) {
  return false
}

export function isForbidden(actionId) {
  return false
}

export function executesDirectly(actionId) {
  return EXECUTES_DIRECTLY.has(classifyActionRisk(actionId))
}

// ─── Natural language → action classification ─────────────────────────────────

function normalize(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const H6_ACTION_PATTERNS = [
  // WRITE — git
  { pattern: /\b(faz|fazer|faca|execute|executa|roda|rodar)\s+(git\s+)?commit\b|\bgit commit\b/, actionId: 'git.commit' },
  { pattern: /\b(faz|fazer|faca|execute|executa|roda|rodar)\s+(git\s+)?push\b|\bgit push\b/, actionId: 'git.push' },
  { pattern: /\b(faz|fazer|faca|execute|executa|roda|rodar)\s+(git\s+)?add\b|\bgit add\b/, actionId: 'git.add' },
  { pattern: /\b(faz|fazer|faca|execute|executa|roda|rodar)\s+(git\s+)?stash\b|\bgit stash\b/, actionId: 'git.stash' },
  { pattern: /\b(faz|fazer|faca|execute|executa|roda|rodar)\s+(git\s+)?fetch\b|\bgit fetch\b/, actionId: 'git.fetch' },
  { pattern: /\b(faz|fazer|faca|execute|executa|roda|rodar)\s+(git\s+)?rebase\b|\bgit rebase\b/, actionId: 'git.rebase' },
  { pattern: /\b(faz|fazer|faca|execute|executa|roda|rodar)\s+(git\s+)?merge\b|\bgit merge\b/, actionId: 'git.merge' },
  { pattern: /\bcria\s+(nova\s+)?branch\b|\bgit checkout -b\b/, actionId: 'git.checkout_b' },
  // WRITE — npm
  { pattern: /\b(roda|rodar|execute|executa|faz|fazer)\s+npm\s+install\b|\bnpm install\b(?!\s+<)/, actionId: 'npm.install' },
  { pattern: /\b(instala|instalar|install)\s+pacote\b|\bnpm install\s+\w/, actionId: 'npm.install_pkg' },
  { pattern: /\b(desinstala|desinstalar|remove|remover|uninstall)\s+(o\s+)?pacote\b/, actionId: 'npm.uninstall_pkg' },
  // VALIDATE
  { pattern: /\b(roda|rodar|faz|fazer|execute|executa)\s+(o\s+)?(build|npm run build|npm build)\b/, actionId: 'npm.build' },
  { pattern: /\b(roda|rodar|faz|fazer|execute|executa)\s+(os?\s+)?(tests?|testes?|npm test)\b/, actionId: 'npm.test' },
  { pattern: /\b(roda|rodar|faz|fazer|execute|executa)\s+(o\s+)?lint\b/, actionId: 'npm.lint' },
  { pattern: /\b(valida|validar|validate|check)\s+(h4\.4|h44)\b/, actionId: 'validate.h44' },
  { pattern: /\b(valida|validar|validate|check)\s+h5\b/, actionId: 'validate.h5' },
  { pattern: /\b(valida|validar|validate|check)\s+h6\b/, actionId: 'validate.h6' },
  // READ
  { pattern: /\b(mostra|ver|verifique|cheque|git\s+)?status\b(?!.*vercel|supabase|github)|\b(verificar|verifique|checar|cheque|mostra|mostre|ver)\s+(seu\s+)?(codigo|código|repositorio|repositório|estado do projeto)\b/i, actionId: 'git.status' },
  { pattern: /\bgit\s+log\b|\b(historico|histórico|commits recentes)\b/, actionId: 'git.log' },
  { pattern: /\bgit\s+diff\b|\b(diferenca|diferença|o que mudou)\b|\b(verificar|verifique|checar|cheque|mostra|mostre|ver)\s+(as\s+)?(alteracoes|alterações|mudancas|mudanças)\b/i, actionId: 'git.diff' },
  // DEPLOY
  { pattern: /\b(faz|fazer|faca|execute|executa|roda|rodar|publica|publicar|sobe|subir)\b.*\bdeploy\b.*\b(producao|vercel|prod)\b|\bvercel deploy\b|\bdeploy.*\bproducao\b|\bdeploy.*\bprod\b/, actionId: 'vercel.deploy_prod' },
  { pattern: /\bpreview\s+deploy\b|\bvercel.*preview\b/, actionId: 'vercel.deploy_preview' },
  // DATABASE
  { pattern: /\b(aplica|aplicar|roda|rodar|execute)\s+(a\s+)?migration\b|\bsupabase.*push\b/, actionId: 'supabase.db_push' },
  { pattern: /\bsupabase\s+(db\s+)?reset\b/, actionId: 'supabase.db_reset' },
  // DANGEROUS
  { pattern: /\bgit\s+push\s+--force\b|\bforce\s+push\b/, actionId: 'git.push_force' },
  { pattern: /\bgit\s+reset\s+--hard\b/, actionId: 'git.reset_hard' },
]

// ─── Param extractor ──────────────────────────────────────────────────────────

export function extractParamsFromMessage(message = '', actionId = '') {
  const params = {}

  // Commit message: "com mensagem 'X'" or "com mensagem \"X\"" or "-m 'X'"
  const msgMatch = message.match(/(?:(?:com\s+mensagem|mensagem|message|-m)\s+['"]([^'"]+)['"])|(?:-m\s+([^\s'"-][^\s]*))/i)
  if (msgMatch) params.message = msgMatch[1] || msgMatch[2]

  // Branch: "para o branch X", "no branch X", "branch X", "--branch X"
  const branchMatch = message.match(/(?:(?:para\s+o?\s*branch|no\s+branch|para\s+o?\s*branch|--branch|-b)\s+([^\s,'"]+))/i)
  if (branchMatch) params.branch = branchMatch[1]

  // Remote: "para o remote X", "origin X"
  const remoteMatch = message.match(/(?:remote\s+([^\s,'"]+)|para\s+o?\s*remote\s+([^\s,'"]+))/i)
  if (remoteMatch) params.remote = remoteMatch[1] || remoteMatch[2]

  // SQL content for migrations: "com sql: X" or "migration: X"
  const sqlMatch = message.match(/(?:sql|migration):\s*(.+)/i)
  if (sqlMatch) params.sql = sqlMatch[1].trim()

  return params
}

export function classifyH6ActionRequest(message = '') {
  const text = normalize(message)
  const found = []
  for (const { pattern, actionId } of H6_ACTION_PATTERNS) {
    if (pattern.test(text) && !found.includes(actionId)) {
      found.push(actionId)
    }
  }
  return found
}

// ─── Plan builder ─────────────────────────────────────────────────────────────

export function buildConfirmationPlan(actionId, params = {}) {
  const action = getActionById(actionId)
  if (!action) return null

  const plan = {
    actionId,
    label: action.label,
    risk: action.risk,
    riskLabel: RISK_LABEL[action.risk],
    provider: action.provider,
    params,
    steps: [],
    evidence: [],
    rollback: null,
    secretsExposed: false,
  }

  switch (actionId) {
    case 'git.commit':
      plan.steps = [
        '1. Verificar arquivos staged (git status --short)',
        `2. git commit -m "${params.message || '<mensagem do commit>'}"`,
      ]
      plan.evidence = ['git diff --stat', 'git status --short']
      plan.rollback = 'git reset HEAD~1 (desfaz o commit mantendo as alterações locais)'
      break
    case 'git.push':
    case 'git.push_u':
      plan.steps = [
        '1. git status --short (verificar estado)',
        '2. git log --oneline -3 (verificar commits)',
        `3. git push ${actionId === 'git.push_u' ? '-u ' : ''}origin ${params.branch || '<branch atual>'}`,
      ]
      plan.evidence = ['git log --oneline -3', 'URL do push']
      plan.rollback = 'O commit local permanece — git revert se necessário para desfazer efeito no remoto.'
      break
    case 'git.add':
      plan.steps = [
        '1. git status --short (mostrar arquivos alterados)',
        '2. git add -A (adicionar tudo ao staging)',
      ]
      plan.evidence = ['git status --short', 'git diff --stat']
      break
    case 'git.add_files':
      plan.steps = [
        '1. git status --short',
        `2. git add ${params.files || '<arquivos>'}`,
      ]
      plan.evidence = ['git status --short']
      break
    case 'git.fetch':
      plan.steps = ['1. git fetch origin']
      plan.evidence = ['git log --oneline origin/<branch> -5']
      break
    case 'git.rebase':
      plan.steps = [
        '1. git fetch origin',
        `2. git rebase origin/${params.branch || '<branch>'}`,
      ]
      plan.evidence = ['git log --oneline -5']
      plan.rollback = 'git rebase --abort (em caso de conflitos) ou git reset --hard ORIG_HEAD'
      break
    case 'git.merge':
      plan.steps = [
        `1. git merge ${params.branch || '<branch>'}`,
      ]
      plan.evidence = ['git log --oneline -5']
      plan.rollback = 'git merge --abort (em progresso) ou git reset --hard HEAD~1 (após merge)'
      break
    case 'git.checkout_b':
      plan.steps = [
        `1. git checkout -b ${params.branchName || '<nome-da-branch>'}`,
      ]
      plan.evidence = ['git branch -a']
      plan.rollback = `git branch -D ${params.branchName || '<nome-da-branch>'} (apaga a branch local)`
      break
    case 'git.stash':
      plan.steps = ['1. git stash (salvar alterações em progresso)']
      plan.evidence = ['git stash list']
      plan.rollback = 'git stash pop (restaura as alterações)'
      break
    case 'git.stash_pop':
      plan.steps = ['1. git stash pop (restaurar alterações salvas)']
      plan.evidence = ['git stash list']
      break
    case 'npm.install':
      plan.steps = [
        '1. npm outdated (ver o que está desatualizado)',
        '2. npm install',
        '3. npm audit (verificar vulnerabilidades)',
      ]
      plan.evidence = ['npm list --depth=0', 'diff do package-lock.json']
      plan.rollback = 'git checkout package-lock.json && npm install (restaura versão anterior)'
      break
    case 'npm.install_pkg':
      plan.steps = [
        `1. npm install ${params.package || '<pacote>'}`,
        '2. npm audit',
      ]
      plan.evidence = ['diff do package.json', 'npm list --depth=0']
      plan.rollback = `npm uninstall ${params.package || '<pacote>'}`
      break
    case 'npm.uninstall_pkg':
      plan.steps = [`1. npm uninstall ${params.package || '<pacote>'}`]
      plan.evidence = ['diff do package.json']
      plan.rollback = `npm install ${params.package || '<pacote>'} (reinstala)`
      break
    case 'vercel.deploy_prod':
      plan.steps = [
        '1. npm run build (verificar build local)',
        '2. git status (estado limpo?)',
        '3. vercel deploy --prod',
        '4. Mostrar URL de produção e logs de deploy',
      ]
      plan.evidence = ['build output', 'deploy URL', 'deployment inspection URL']
      plan.rollback = 'Vercel Dashboard → Deployments → Promote previous deployment; ou vercel rollback'
      break
    case 'vercel.deploy_preview':
      plan.steps = [
        '1. npm run build',
        '2. vercel deploy (preview)',
        '3. Mostrar URL de preview',
      ]
      plan.evidence = ['preview URL', 'build output']
      plan.rollback = 'Deploy de preview não afeta produção — sem rollback necessário.'
      break
    case 'supabase.db_push':
      plan.steps = [
        '1. supabase db diff (mostrar schema changes)',
        '2. Confirmar tabelas e tipos afetados',
        '3. supabase db push',
      ]
      plan.evidence = ['diff de schema', 'tabelas afetadas', 'contagem de rows']
      plan.rollback = 'Criar migration de reversão manualmente ou restaurar backup Supabase.'
      break
    case 'supabase.db_reset':
      plan.steps = [
        '1. AVISO: db reset recria todo o schema — dados de produção serão perdidos se não houver backup',
        '2. Backup confirmado?',
        '3. supabase db reset',
      ]
      plan.evidence = ['backup timestamp', 'schema atual']
      plan.rollback = 'Restaurar backup via Supabase Dashboard (Point-in-time recovery se disponível).'
      break
    case 'git.push_force':
      plan.steps = [
        '1. git log --oneline -5 (verificar commits)',
        '2. git push --force-with-lease origin <branch> (proteção contra override remoto acidental)',
      ]
      plan.evidence = ['git log --oneline -5', 'estado do remoto antes do push']
      plan.rollback = 'Não há rollback automático — commits removidos do remoto podem ser irrecuperáveis. Usar --force-with-lease mitiga risco.'
      break
    case 'git.reset_hard':
      plan.steps = [
        '1. git stash (salvar alterações não commitadas se necessário)',
        `2. git reset --hard ${params.ref || 'HEAD~1'}`,
      ]
      plan.evidence = ['git log --oneline -5 (antes)', 'git status (antes)']
      plan.rollback = 'git reflog → git reset --hard <hash-anterior> (recuperável via reflog por ~30 dias)'
      break
    default:
      plan.steps = [action ? `Executar: ${action.label}` : `Executar ação: ${actionId}`]
      if (action?.rollbackRequired) {
        plan.rollback = 'Plano de rollback necessário antes da execução.'
      }
  }

  return plan
}

export function buildConfirmationReply(actionId, params = {}) {
  const action = getActionById(actionId)
  if (!action) return null

  const plan = buildConfirmationPlan(actionId, params)
  if (!plan) return `Ação não reconhecida: ${actionId}.`

  const paramSummary = []
  if (params.message)  paramSummary.push(`mensagem: "${params.message}"`)
  if (params.branch)   paramSummary.push(`branch: ${params.branch}`)
  if (params.remote)   paramSummary.push(`remote: ${params.remote}`)

  const lines = [
    `Posso executar: **${plan.label}**`,
    ...(paramSummary.length ? [`Parâmetros: ${paramSummary.join(', ')}`] : []),
    `Risco: ${plan.riskLabel}`,
    '',
    'Plano de execução:',
    ...plan.steps.map(s => `  ${s}`),
  ]

  if (plan.evidence?.length) {
    lines.push('')
    lines.push('Evidência que vou coletar:')
    lines.push(...plan.evidence.map(e => `  - ${e}`))
  }

  if (plan.rollback) {
    lines.push('')
    lines.push(`Rollback: ${plan.rollback}`)
  }

  lines.push('')
  lines.push('Execução direta liberada neste runtime (sem etapa de confirmação).')
  lines.push('')
  lines.push('Nenhum segredo exibido.')

  return lines.join('\n')
}

export function buildBlockedLanguageReply(actionId, params = {}) {
  return buildConfirmationReply(actionId, params)
}

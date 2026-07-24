/**
 * Apex AI Copilot — H19 Codex/Claude Delegation Generator
 * Generates structured prompts for Claude Code / OpenAI Codex with full repo context,
 * architecture constraints, acceptance criteria, and security boundaries.
 */

import { snapshotCurrentArchitecture } from './selfUpgrade.mjs'

// ─── Repo context builder ─────────────────────────────────────────────────────

function buildRepoContext() {
  const arch = snapshotCurrentArchitecture()
  const owner = process.env.APEX_GITHUB_OWNER || 'jedgard70'
  const configuredRepo = process.env.APEX_GITHUB_REPOSITORY || process.env.GITHUB_REPOSITORY || ''
  return {
    repo: configuredRepo || `${owner}/<select-repo-per-task>`,
    owner,
    stack: arch.stack,
    checkpoints: arch.checkpointsCompleted,
    keyFiles: {
      runtime: 'server/agent/apexOperatorRuntime.mjs',
      router: 'server/agent/productionConversationRouter.mjs',
      execution: 'server/agent/confirmationStateMachine.mjs',
      policy: 'server/agent/executionPolicy.mjs',
      frontend: 'src/main.tsx',
      localWorker: 'local-worker/server.mjs',
    },
    securityConstraints: [
      'Never expose secrets/tokens in code, logs, or responses.',
      'All WRITE/DEPLOY/DATABASE actions require explicit user confirmation (sim/não).',
      'Never execute FORBIDDEN actions: token leak, rm -rf, exfiltrate data.',
      'Local Worker whitelist only — no free shell.',
      'No fake execution — if a connector is missing, say so honestly.',
      'All mutations need rollback plan documented before execution.',
    ],
    testingRequirements: [
      'Add validation script in scripts/validate-*.mjs',
      'Run node scripts/validate-cp15x-final.mjs after changes',
      'New capabilities must declare in productionStatus.mjs capabilities object',
      'No TypeScript errors (npm run build must pass)',
    ],
  }
}

// ─── Prompt templates ─────────────────────────────────────────────────────────

const DELEGATION_TEMPLATES = {
  new_connector: (task, context) => `# Delegation Prompt — New Connector for Apex AI Copilot

## Task
${task}

## Repository Context
- Repo: ${context.repo}
- Stack: ${context.stack.frontend} / ${context.stack.backend}
- Completed checkpoints: ${context.checkpoints.join(', ')}

## Architecture Pattern (follow this exactly)
New connectors follow the pattern in \`server/agent/revitBimConnector.mjs\` and \`server/agent/imageGenerationConnector.mjs\`:
1. Create \`server/agent/[name]Connector.mjs\` with:
   - \`classify[Name]Query(message)\` — intent classifier
   - \`get[Name]Help(message)\` — async fetcher (live API or curated fallback)
   - \`build[Name]Reply(result)\` — reply formatter
   - \`get[Name]ConnectorStatus()\` — status object
2. Add to \`server/agent/apexOperatorRuntime.mjs\` imports + routing block
3. Register in \`server/agent/connectorsStatus.mjs\` → \`connectorsAsProductionList()\`
4. Add to \`productionStatus.mjs\` capabilities object
5. Write validation script \`scripts/validate-cp15x-[checkpoint].mjs\`

## Key Files to Modify
${Object.entries(context.keyFiles).map(([k, v]) => `- ${k}: \`${v}\``).join('\n')}

## Security Constraints (non-negotiable)
${context.securityConstraints.map(c => `- ${c}`).join('\n')}

## Testing Requirements
${context.testingRequirements.map(r => `- ${r}`).join('\n')}

## Acceptance Criteria
- [ ] All validation scripts GREEN
- [ ] npm run build passes (no TypeScript errors)
- [ ] Connector status appears in /api/copilot/operator-status
- [ ] Secrets never appear in responses or logs
- [ ] Reply in Portuguese when user writes in Portuguese

## What NOT to do
- Do not fake API calls — if connector unavailable, say so honestly
- Do not skip confirmation for WRITE/DEPLOY actions
- Do not add free shell commands to Local Worker
- Do not hardcode tokens in source files`,

  feature_addition: (task, context) => `# Delegation Prompt — Feature Addition for Apex AI Copilot

## Task
${task}

## Repository Context
- Repo: ${context.repo}
- Stack: ${context.stack.frontend} / ${context.stack.backend}
- Completed checkpoints: ${context.checkpoints.slice(-5).join(', ')} (last 5)

## Where to Start
1. Read \`server/agent/apexOperatorRuntime.mjs\` — main routing entry point
2. Read \`server/agent/productionConversationRouter.mjs\` — intent classification
3. Read relevant connector files for context

## Routing Pattern
\`\`\`js
// In apexOperatorRuntime.mjs, add BEFORE conversationalOnlyIntents block:
if (productionConversationIntent === 'your_new_intent') {
  const result = await yourNewFeature(userMessage)
  return { ok: true, status: 'GREEN', intent: 'h[N]_feature_name', finalReply: result.reply, ... }
}
\`\`\`

## Security Constraints
${context.securityConstraints.map(c => `- ${c}`).join('\n')}

## Testing
${context.testingRequirements.map(r => `- ${r}`).join('\n')}

## Acceptance Criteria
- [ ] Validation script GREEN
- [ ] Build passes
- [ ] No regressions in existing validate-cp15x-h7.mjs and validate-cp15x-final.mjs`,

  bug_fix: (task, context) => `# Delegation Prompt — Bug Fix for Apex AI Copilot

## Bug Description
${task}

## Repository
- Repo: ${context.repo}
- Key files: ${Object.values(context.keyFiles).join(', ')}

## Investigation Steps
1. Reproduce: identify the exact message/flow that triggers the bug
2. Trace: follow from \`api/copilot/chat.mjs\` → \`apexOperatorRuntime.mjs\` → connector
3. Fix: minimal change, no refactoring beyond what's needed
4. Validate: run \`node scripts/validate-cp15x-final.mjs\`

## Constraints
- Minimal change — only fix the bug, no cleanup or refactoring
- No new dependencies without explicit approval
${context.securityConstraints.slice(0, 3).map(c => `- ${c}`).join('\n')}

## Acceptance Criteria
- [ ] Bug no longer reproduces
- [ ] All validation scripts still GREEN
- [ ] Build passes`,

  module_build: (task, context) => `# Delegation Prompt — Module Build for Apex AI Copilot

## Module
${task}

## Apex Platform Context
- Stack: ${context.stack.frontend} | ${context.stack.backend}
- Completed: ${context.checkpoints.join(', ')}
- Existing components: AgentsPanel, ArchVisPanel, Bim3DPanel, BudgetPanel, ContractsPanel, FieldOpsPanel, FinancePanel, CrmPanel

## Module Architecture
Frontend:
- Create \`src/components/[Module]Panel.tsx\`
- Export from component file
- Import and wire in \`src/main.tsx\` (follow existing pattern)

Backend (if needed):
- Create \`api/[module]/route.mjs\` as Vercel Function
- Create \`server/agent/[module]Connector.mjs\` for business logic
- Wire into \`apexOperatorRuntime.mjs\`

## Security
${context.securityConstraints.map(c => `- ${c}`).join('\n')}

## Testing
- Write \`scripts/validate-cp15x-[module].mjs\`
- Run validate-cp15x-final.mjs as regression check

## Acceptance Criteria
- [ ] Module renders correctly in Apex UI
- [ ] API route returns valid JSON
- [ ] Validation GREEN
- [ ] Build passes`,
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function classifyDelegationTask(message = '') {
  const t = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  if (/\bgera\s+(prompt|delegac)\b|\bprompt\s+para\s+(codex|claude)\b|\bdelega\b/.test(t)) {
    // Extract task from message
    const taskMatch = message.match(/(?:gera\s+prompt\s+para|delega\s+para\s+(?:codex|claude)|cria\s+prompt)\s+(.+)/i)
    return { isDelegation: true, extractedTask: taskMatch?.[1]?.trim() || null }
  }
  return { isDelegation: false }
}

export function generateDelegationPrompt(task = '', templateType = 'feature_addition') {
  const context = buildRepoContext()
  const template = DELEGATION_TEMPLATES[templateType] || DELEGATION_TEMPLATES.feature_addition
  return template(task, context)
}

export function detectPromptTemplate(task = '') {
  const t = task.toLowerCase()
  if (/\bconector\b|\bconnector\b|\bintegrac\b/.test(t)) return 'new_connector'
  if (/\bbug\b|\berro\b|\bcorrig\b|\bfix\b/.test(t)) return 'bug_fix'
  if (/\bmodulo\b|\bpainel\b|\bmodule\b|\bpanel\b/.test(t)) return 'module_build'
  return 'feature_addition'
}

export function buildDelegationReply(task, templateType) {
  const prompt = generateDelegationPrompt(task, templateType)
  return [
    `**Prompt gerado para Claude Code / Codex:**`,
    `Template: \`${templateType}\``,
    '',
    '```',
    prompt,
    '```',
    '',
    '_Copie o prompt acima e cole no Claude Code (claude.ai/code) ou no Codex CLI._',
    '_O prompt inclui contexto do repo, padrões arquiteturais, constraints de segurança e critérios de aceite._',
  ].join('\n')
}

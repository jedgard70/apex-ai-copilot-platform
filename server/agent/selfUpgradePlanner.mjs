import { collectProductionOperatorStatus } from './productionStatus.mjs'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const CONNECTOR_TIMEOUT_MS = 30000

function hasAnthropicConfig() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

// ─── Tech radar (offline baseline) ───────────────────────────────────────────

export const TECH_RADAR = {
  ai_models: [
       { item: 'GPT-4o mini', status: 'DISPONÍVEL', relevance: 'barato para tarefas simples', action: 'avaliar para classificação de intents de baixo custo' },
  ],
  frameworks: [
    { item: 'Vite 6.x', status: 'MONITORAR', relevance: 'build mais rápido', action: 'verificar breaking changes antes de upgrade' },
    { item: 'React 19', status: 'MONITORAR', relevance: 'Server Components, use() hook', action: 'avaliar impacto em main.tsx antes de migrar' },
    { item: 'Node.js 22 LTS', status: 'ATUAL', relevance: 'versão atual em uso', action: 'manter — suporte até 2027' },
  ],
  integrations: [
    { item: 'Autodesk Platform Services (APS) — Model Derivative API', status: 'PENDENTE', relevance: 'viewer IFC/RVT/DWG nativo', action: 'implementar para M6 BIM Viewer real' },
    { item: 'Vercel AI SDK 4.x', status: 'DISPONÍVEL', relevance: 'streaming, tool use, structured outputs', action: 'avaliar para substituir fetch manual à API Anthropic' },
    { item: 'IfcOpenShell WASM', status: 'PENDENTE', relevance: 'parse IFC no browser sem servidor', action: 'implementar como fallback do BIM Viewer' },
    { item: 'pdf.js (Mozilla)', status: 'PENDENTE', relevance: 'extração de texto PDF no browser', action: 'implementar para M2 File Intake — PDF text extraction' },
  ],
  security: [
    { item: 'Secrets scanning (GitHub)', status: 'CONFIGURAR', relevance: 'detecta tokens vazados em commits', action: 'ativar no repo Settings → Code security' },
    { item: 'Vercel Environment Variables (encrypted)', status: 'CONFIGURAR', relevance: 'tokens não devem estar em código', action: 'mover todos os tokens para Vercel env vars' },
  ],
}

// ─── Architecture snapshot ────────────────────────────────────────────────────

export function snapshotCurrentArchitecture() {
  const status = collectProductionOperatorStatus()
  return {
    checkpointsCompleted: ['H5.x', 'H6.0', 'H7', 'H8', 'H9', 'H10', 'H11', 'H12', 'H13', 'H14', 'H15', 'H16', 'H17'],
    capabilityCount: Object.keys(status.capabilities || {}).length,
    connectorCount: (status.connectors || []).length,
    configuredConnectors: (status.connectors || []).filter(c => c.configured).map(c => c.id),
    missingConnectors: (status.connectors || []).filter(c => !c.configured).map(c => c.id),
    pendingModules: [
      'M2: PDF text extraction',
      'M3: Document generation (DOCX/PDF)',
      'M5: Budget spreadsheet + SINAPI live',
      'M6: BIM Viewer (IFC/RVT/DWG)',
      'H18: Self-Upgrade Planner',
      'H19: Codex/Claude Delegation Generator',
      'H20: Safe Code Change Executor',
      'H21: Validation + Rollback Engine',
      'H22: Autonomous Upgrade Watcher',
    ],
    stack: { frontend: 'React 18 + Vite + TypeScript', backend: 'Vercel Functions (Node ESM)', db: 'Supabase', deploy: 'Vercel' },
  }
}

// ─── Anthropic research call ──────────────────────────────────────────────────

async function researchWithAnthropic(topic, architectureSnapshot) {
  if (!hasAnthropicConfig() || !globalThis.fetch) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONNECTOR_TIMEOUT_MS)

  try {
    const systemPrompt = `You are an expert technical advisor for the Apex AI Copilot Platform.
Current architecture: ${JSON.stringify(architectureSnapshot, null, 2)}
Your job: research the given topic, compare with current state, and propose concrete upgrade actions.
Always respond in Portuguese (Brazilian). Be specific and actionable. Maximum 600 words.`

    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Pesquise e analise: ${topic}. Forneça: 1) O que há de novo relevante, 2) Como se compara com nossa arquitetura atual, 3) Vale a pena implementar? Por quê?, 4) Plano de upgrade com 3-5 passos concretos, 5) Risco e rollback se der errado.` }],
      }),
      signal: controller.signal,
    })

    if (!response.ok) return null
    const data = await response.json().catch(() => null)
    return data?.content?.[0]?.text || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Main planner ─────────────────────────────────────────────────────────────

export async function runSelfUpgradePlanner(topic = 'novidades em IA para engenharia e construção') {
  const architecture = snapshotCurrentArchitecture()
  let liveResearch = null

  if (hasAnthropicConfig()) {
    liveResearch = await researchWithAnthropic(topic, architecture)
  }

  return {
    ok: true,
    topic,
    architecture,
    liveResearch,
    techRadar: TECH_RADAR,
    connectorConfigured: hasAnthropicConfig(),
    secretsExposed: false,
  }
}

export function buildSelfUpgradePlannerReply(result) {
  const { topic, architecture, liveResearch, techRadar, connectorConfigured } = result
  const lines = [`**Self-Upgrade Planner — ${topic}**`, '']

  if (liveResearch) {
    lines.push('**Análise ao vivo (Anthropic API):**', '', liveResearch)
  } else {
    lines.push('**Tech Radar atual (base curada):**', '')

    if (techRadar.ai_models?.length) {
      lines.push('**Modelos de IA:**')
      for (const { item, status, action } of techRadar.ai_models) {
        lines.push(`- \`${status}\` **${item}** → ${action}`)
      }
    }
    if (techRadar.integrations?.length) {
      lines.push('', '**Integrações pendentes:**')
      for (const { item, status, action } of techRadar.integrations) {
        lines.push(`- \`${status}\` **${item}** → ${action}`)
      }
    }

    if (!connectorConfigured) {
      lines.push('', '_Configure `ANTHROPIC_API_KEY` para pesquisa ao vivo e análise contextual._')
    }
  }

  lines.push('', '**Arquitetura atual:**')
  lines.push(`- Checkpoints completos: ${architecture.checkpointsCompleted.join(', ')}`)
  lines.push(`- Conectores configurados: ${architecture.configuredConnectors.join(', ') || 'nenhum'}`)
  lines.push(`- Conectores pendentes: ${architecture.missingConnectors.join(', ') || 'nenhum'}`)
  lines.push('', '**Próximos módulos a implementar:**')
  architecture.pendingModules.forEach(m => lines.push(`  - ${m}`))

  return lines.join('\n')
}

export function classifySelfUpgradeIntent(message = '') {
  const t = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return /\b(novidade|upgrade|atualiza|novo em ia|tecnologia nova|melhora a plataforma|self.upgrade|plano de upgrade|o que ha de novo|h18|auto-upgrade|auto upgrade|self-upgrade|planejador de auto-upgrade|vamos para h18|execute h18|executar h18|comece pelo h18)\b/.test(t)
}

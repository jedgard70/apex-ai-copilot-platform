import { collectProductionOperatorStatus } from './productionStatus.mjs'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const CONNECTOR_TIMEOUT_MS = 30000

function hasAnthropicConfig() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

// ─── Execution radar (current runtime state) ─────────────────────────────────

export const TECH_RADAR = {
  ai_models: [
    { item: 'AI Gateway text/image/video', status: 'OPERACIONAL', relevance: 'texto, imagem e vídeo por provedor centralizado', action: 'usar agora quando AI_GATEWAY_API_KEY estiver configurada e saldo disponível' },
    { item: 'OpenRouter free routing', status: 'OPERACIONAL', relevance: 'roteamento multi-modelo com fallback sem crédito pago', action: 'usar openrouter/free por padrão e modelos pagos só com crédito' },
    { item: 'Gemini 2.5 Flash', status: 'OPERACIONAL', relevance: 'modelo alternativo para texto/raciocínio', action: 'usar como fallback configurado' },
  ],
  frameworks: [
    { item: 'Vite 6.x', status: 'OPERACIONAL', relevance: 'build atual validado por vite build', action: 'manter validação em cada mudança' },
    { item: 'React 19', status: 'OPERACIONAL', relevance: 'versão atual instalada no app', action: 'usar padrões React 19 sem migração pendente' },
    { item: 'Node.js runtime', status: 'OPERACIONAL', relevance: 'runtime Node ESM para server/local/serverless', action: 'validar com node --check e build' },
  ],
  integrations: [
    { item: 'AI Gateway image/video generation', status: 'OPERACIONAL', relevance: 'texto, imagem e vídeo por provedor centralizado', action: 'monitorar saldo/créditos e manter fallback por provedor' },
    { item: 'OpenRouter model routing', status: 'OPERACIONAL', relevance: 'roteamento multi-modelo com opção free', action: 'usar modelos pagos somente quando houver créditos configurados' },
    { item: 'Gemini connector', status: 'OPERACIONAL', relevance: 'modelo alternativo para texto e raciocínio', action: 'manter modelo atual suportado e fallback seguro' },
    { item: 'Authkey SMS/OTP/WhatsApp/campaigns', status: 'EXECUTÁVEL_COM_CREDENCIAL', relevance: 'comunicação com clientes, leads e campanhas Brasil/global', action: 'conector implementado; env vars e SIDs/templates aprovados liberam envio real' },
    { item: 'Firebase Cloud Messaging', status: 'EXECUTÁVEL_COM_CREDENCIAL', relevance: 'push notification dentro do app web/desktop/mobile', action: 'conector de status implementado; env Firebase client/VAPID/service-account liberam push real' },
    { item: 'Autodesk Platform Services / Revit BIM connector', status: 'EXECUTÁVEL_COM_CREDENCIAL', relevance: 'busca técnica Autodesk e caminho para viewer/conversão', action: 'knowledge connector já existe; AUTODESK_ACCESS_TOKEN libera busca ao vivo' },
    { item: 'pdf.js text extraction', status: 'OPERACIONAL', relevance: 'extração/visualização PDF no browser', action: 'usar src/lib/pdfExtractor.ts e worker copiado no build' },
    { item: 'DOCX generation', status: 'OPERACIONAL', relevance: 'documentos e contratos exportáveis', action: 'usar src/lib/docxGenerator.ts e contractsDocxExport.ts' },
    { item: 'XLSX budget import/export', status: 'OPERACIONAL', relevance: 'orçamento, planilhas e importação SINAPI manual', action: 'usar src/lib/budgetXlsx.ts' },
    { item: 'web-ifc / BIM browser dependency', status: 'OPERACIONAL', relevance: 'base instalada para leitura IFC no browser', action: 'usar no viewer/import workflow existente' },
  ],
  security: [
    { item: 'Secrets scanning (GitHub)', status: 'EXECUTÁVEL_FORA_DO_CÓDIGO', relevance: 'detecta tokens vazados em commits', action: 'ativar no repo Settings quando GitHub estiver autorizado' },
    { item: 'Vercel Environment Variables (encrypted)', status: 'EXECUTÁVEL_FORA_DO_CÓDIGO', relevance: 'tokens não devem estar em código', action: 'configurar no painel/CLI autorizado sem expor segredo' },
  ],
}

// ─── Architecture snapshot ────────────────────────────────────────────────────

export function snapshotCurrentArchitecture() {
  const status = collectProductionOperatorStatus()
  return {
    checkpointsCompleted: ['H5.x', 'H6.0', 'H7', 'H8', 'H9', 'H10', 'H11', 'H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'H19', 'H20', 'H21', 'H22'],
    capabilityCount: Object.keys(status.capabilities || {}).length,
    connectorCount: (status.connectors || []).length,
    configuredConnectors: (status.connectors || []).filter(c => c.configured).map(c => c.id),
    missingConnectors: (status.connectors || []).filter(c => !c.configured).map(c => c.id),
    pendingModules: [],
    executedNow: [
      'AI Gateway text/image/video connector active',
      'OpenRouter free routing active',
      'Gemini 2.5 Flash connector active',
      'Authkey SMS/OTP connector implemented and guarded by env/confirmation',
      'Firebase Cloud Messaging status connector implemented',
      'PDF extraction via pdf.js present',
      'DOCX generation present',
      'XLSX budget import/export present',
      'web-ifc dependency present for BIM browser workflows',
      'Autodesk/Revit BIM knowledge connector present with live mode gated by token',
    ],
    blockedByCredentials: [
      'Authkey real SMS/OTP/WhatsApp/campaign sending requires AUTHKEY_AUTHKEY and approved SIDs/templates',
      'Firebase push sending requires Firebase client config, VAPID key and service account env vars',
      'GitHub/Vercel remote security/deploy actions require authorized tokens',
      'Autodesk live API access requires AUTODESK_ACCESS_TOKEN or APS credentials',
    ],
    providerArchitecture: {
      auth: ['Auth0/Supabase/Google OAuth'],
      appPush: ['Firebase Cloud Messaging'],
      communications: ['Authkey SMS/OTP/WhatsApp/campaigns/leads'],
      aiModels: ['AI Gateway', 'OpenRouter', 'Gemini'],
      operatingModes: ['web/serverless', 'local backend', 'desktop Electron'],
    },
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
Respect the architecture boundary: Auth0/Supabase/Google OAuth are login/auth, Firebase Cloud Messaging is app push, Authkey is customer communications/campaigns, and AI Gateway/OpenRouter/Gemini are AI model providers.
Design communication/campaign upgrades for Brazil and international/global use, not Brazil-only.
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
        messages: [{ role: 'user', content: `Pesquise e analise: ${topic}. Forneça: 1) O que há de novo relevante, 2) Como se compara com nossa arquitetura atual, 3) O que pode ser executado agora, 4) A menor mudança concreta para aplicar, 5) Risco e rollback se der errado.` }],
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

// ─── Main self-upgrade execution context ─────────────────────────────────────

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
  const lines = [`**Self-Upgrade Execution Context — ${topic}**`, '']
  lines.push('Registro de execução: o que já está operacional foi removido da fila futura; o que depende de serviço externo aparece como bloqueado por credencial, não como plano.', '')

  if (liveResearch) {
    lines.push('**Análise ao vivo (Anthropic API):**', '', liveResearch)
  } else {
    lines.push('**Matriz executada agora:**', '')

    if (techRadar.ai_models?.length) {
      lines.push('**Modelos de IA:**')
      for (const { item, status, action } of techRadar.ai_models) {
        lines.push(`- \`${status}\` **${item}** → ${action}`)
      }
    }
    if (techRadar.integrations?.length) {
      lines.push('', '**Integrações executáveis:**')
      for (const { item, status, action } of techRadar.integrations) {
        lines.push(`- \`${status}\` **${item}** → ${action}`)
      }
    }

    if (!connectorConfigured) {
      lines.push('', '_Configure `ANTHROPIC_API_KEY` para pesquisa ao vivo e análise contextual._')
    }
  }

  lines.push('', '**Arquitetura atual executável:**')
  lines.push(`- Checkpoints completos: ${architecture.checkpointsCompleted.join(', ')}`)
  lines.push(`- Conectores configurados: ${architecture.configuredConnectors.join(', ') || 'nenhum'}`)
  lines.push(`- Conectores bloqueados por credencial/configuração: ${architecture.missingConnectors.join(', ') || 'nenhum'}`)
  lines.push('', '**Executado/agora disponível:**')
  const executedNow = architecture.executedNow || []
  executedNow.forEach(m => lines.push(`- ${m}`))
  const blockedByCredentials = architecture.blockedByCredentials || []
  if (blockedByCredentials.length) {
    lines.push('', '**Não está em espera; depende só de credencial externa:**')
    blockedByCredentials.forEach(m => lines.push(`- ${m}`))
  }

  return lines.join('\n')
}

export function classifySelfUpgradeIntent(message = '') {
  const t = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return /\b(novidade|upgrade|atualiza|novo em ia|tecnologia nova|melhora a plataforma|self.upgrade|plano de upgrade|o que ha de novo|h18|auto-upgrade|auto upgrade|self-upgrade|planejador de auto-upgrade|vamos para h18|execute h18|executar h18|comece pelo h18)\b/.test(t)
}

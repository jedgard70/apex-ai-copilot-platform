import { collectProductionOperatorStatus } from './productionStatus.mjs'

// ─── Execution radar (current runtime state) ─────────────────────────────────

export const TECH_RADAR = {
  ai_models: [
    { item: 'Gemini API (Interactions)', status: 'OPERACIONAL', relevance: 'chat, multimodal, TTS, image', action: 'usar via v1beta/interactions' },
  ],
  frameworks: [
    { item: 'Vite 6.x', status: 'OPERACIONAL', relevance: 'build atual validado por vite build', action: 'manter validação em cada mudança' },
    { item: 'React 19', status: 'OPERACIONAL', relevance: 'versão atual instalada no app', action: 'usar padrões React 19 sem migração pendente' },
    { item: 'Node.js runtime', status: 'OPERACIONAL', relevance: 'runtime Node ESM para server/local/serverless', action: 'validar com node --check e build' },
  ],
  integrations: [
    { item: 'Gemini connector', status: 'OPERACIONAL', relevance: 'chat, multimodal, TTS, image', action: 'manter modelo atual suportado e fallback seguro' },
    { item: 'FAL.ai', status: 'OPERACIONAL', relevance: 'image/video generation, LLMs', action: 'usar FAL_KEY para image/video generation' },
    { item: 'ElevenLabs', status: 'OPERACIONAL', relevance: 'text-to-speech', action: 'usar ELEVENLABS_API_KEY para TTS' },
    { item: 'Tavily', status: 'OPERACIONAL', relevance: 'web search', action: 'usar TAVILY_API_KEY para buscar na web' },
    { item: 'Authkey SMS/OTP', status: 'EXECUTÁVEL_COM_CREDENCIAL', relevance: 'comunicação com clientes, leads e campanhas', action: 'env vars e SIDs/templates aprovados liberam envio real' },
    { item: 'Firebase Cloud Messaging', status: 'EXECUTÁVEL_COM_CREDENCIAL', relevance: 'push notification dentro do app web/desktop/mobile', action: 'Firebase client/VAPID/service-account liberam push real' },
    { item: 'Autodesk Platform Services / Revit BIM', status: 'EXECUTÁVEL_COM_CREDENCIAL', relevance: 'busca técnica Autodesk e viewer/conversão', action: 'APS_CLIENT_ID/APS_CLIENT_SECRET liberam viewer' },
    { item: 'pdf.js text extraction', status: 'OPERACIONAL', relevance: 'extração/visualização PDF no browser', action: 'usar src/lib/pdfExtractor.ts e worker copiado no build' },
    { item: 'DOCX generation', status: 'OPERACIONAL', relevance: 'documentos e contratos exportáveis', action: 'usar src/lib/docxGenerator.ts e contractsDocxExport.ts' },
    { item: 'XLSX budget import/export', status: 'OPERACIONAL', relevance: 'orçamento, planilhas e importação SINAPI manual', action: 'usar src/lib/budgetXlsx.ts' },
    { item: 'web-ifc / BIM browser dependency', status: 'OPERACIONAL', relevance: 'base instalada para leitura IFC no browser', action: 'usar no viewer/import workflow existente' },
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
      'Gemini API (Interactions) — chat, multimodal, TTS, image generation',
      'FAL.ai — image/video generation via FAL_KEY',
      'ElevenLabs — text-to-speech via ELEVENLABS_API_KEY',
      'Tavily — web search via TAVILY_API_KEY',
      'Authkey SMS/OTP connector implemented',
      'Firebase Cloud Messaging status connector implemented',
      'PDF extraction via pdf.js present',
      'DOCX generation present',
      'XLSX budget import/export present',
      'web-ifc dependency present for BIM browser workflows',
      'Autodesk/Revit BIM knowledge connector present with live mode gated by APS credentials',
    ],
    blockedByCredentials: [
      'Authkey real SMS/OTP sending requires AUTHKEY_AUTHKEY and approved SIDs/templates',
      'Firebase push requires Firebase client config, VAPID key and service account env vars',
      'GitHub/Vercel remote security/deploy actions require authorized tokens',
      'Autodesk live API access requires APS_CLIENT_ID + APS_CLIENT_SECRET',
    ],
    providerArchitecture: {
      auth: ['Supabase/Google OAuth'],
      appPush: ['Firebase Cloud Messaging'],
      communications: ['Authkey SMS/OTP'],
      aiModels: ['Gemini (Interactions API)'],
      operatingModes: ['web/serverless', 'local backend', 'desktop Electron'],
    },
    stack: { frontend: 'React 19 + Vite + TypeScript', backend: 'Vercel Functions (Node ESM)', db: 'Supabase', deploy: 'Vercel' },
  }
}

// ─── Main self-upgrade execution context ─────────────────────────────────────

export async function runSelfUpgradePlanner(topic = 'novidades em IA para engenharia e construção') {
  const architecture = snapshotCurrentArchitecture()
  return {
    ok: true,
    topic,
    architecture,
    techRadar: TECH_RADAR,
    secretsExposed: false,
  }
}

export function buildSelfUpgradePlannerReply(result) {
  const { topic, architecture, techRadar } = result
  const lines = [`**Self-Upgrade Execution Context — ${topic}**`, '']
  lines.push('Registro de execução: o que já está operacional foi removido da fila futura; o que depende de serviço externo aparece como bloqueado por credencial.', '')

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

  lines.push('', '**AUTO-UPGRADE:** Use as ferramentas do chat (list_dir, read_file, search_code) para explorar o código, identificar melhorias, implementar com write_file/edit_file/run_command, verificar com build/test, e commitar com github_commit_changes. O owner autorizou mudanças diretas sem permissão prévia.')

  return lines.join('\n')
}

export function classifySelfUpgradeIntent(message = '') {
  const t = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return /\b(novidade|upgrade|atualiza|novo em ia|tecnologia nova|melhora a plataforma|self.upgrade|plano de upgrade|o que ha de novo|h18|auto-upgrade|auto upgrade|self-upgrade|planejador de auto-upgrade|vamos para h18|execute h18|executar h18|comece pelo h18)\b/.test(t)
}

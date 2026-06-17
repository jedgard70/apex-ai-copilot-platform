import { classifyConnectorStatusIntent } from './connectorsStatus.mjs'

export function classifyOperatorIntent(message = '') {
  const text = String(message || '').toLowerCase()
  if (/^\s*(ol[aá]|oi|bom dia|boa tarde|boa noite|hello|hi|hey)(?:[\s!.,?]|$)/i.test(text)) return 'greeting_request'
  if (/\b(drop\s+(database|schema|table)|delete\s+from|truncate|rm\s+-rf|rmdir\s+\/s|git\s+reset\s+--hard|push\s+--force|force\s+push)\b/i.test(text)) return 'destructive_request'
  if (/\b(aplica|aplicar|roda|rodar|executa|executar|faz|fazer).*\b(migration|migracao|migra[cç][aã]o|supabase)\b|\bsupabase\s+db\s+(push|reset)\b/i.test(text)) return 'supabase_migration_request'
  if (classifyConnectorStatusIntent(message)) return 'connector_status_request'
  if (/\b(verifique|verificar|validar|valide|status|conector|conectores).*\b(vercel|github)\b|\b(vercel|github).*\b(status|conector|conectores)\b/i.test(text)) return 'validation_request'
  if (/\b(deploy|faz deploy|fazer deploy|publica|publicar|subir para vercel|produ[cç][aã]o|production)\b/i.test(text)) return 'deploy_request'
  if (/\b(git\s+push|push|subir\s+branch|manda\s+pro\s+github|github)\b/i.test(text)) return 'push_request'
  if (/\b(aprovado,\s*commita|sim,\s*pode\s+commitar|commit\s+aprovado|pode\s+fazer\s+o\s+commit|pode\s+commitar|commita|faz\s+o\s+commit|fecha\s+com\s+commit)\b/i.test(text)) return 'approved_commit_request'
  if (/\b(shell livre|raw shell|terminal livre|comando livre|executar shell|executa(?:r)?\s+(?:esse|este|o)?\s*comando)\b/i.test(text)) return 'raw_shell_request'
  if (/\b(h18|h19|h20|h21|h22|auto-?upgrade|self-?upgrade|upgrade planner|planejador de auto-?upgrade|atualizar o apex|vamos para h18|vamos para o h18|execute h18|executar h18|comece pelo h18|start h18|start with h18)\b/i.test(text)) return 'code_implementation_request'
  if (/\b(status|plataforma|como est[aá]|tudo certo|ficou certo|git status|diff|log)\b/i.test(text)) return 'status_request'
  if (/\b(valida|validar|build|check|teste|testar|verifica|verificar)\b/i.test(text)) return 'validation_request'
  if (/\b(executa|execute|faz|fazer|segue|seguir|continua|continuar).*\b(pr[oó]ximo|proximo|passo|checkpoint)\b/i.test(text)) return 'natural_execution_request'
  if (/\b(pr[oó]ximo|proximo|e agora|o que fazemos|o que fazer|qual.*passo|pode seguir|segue|seguir|continua|continuar)\b/i.test(text)) return 'next_step_request'
  if (/\b(fecha|fechar|finaliza|finalizar).*checkpoint|checkpoint/i.test(text)) return 'checkpoint_close_request'
  if (/\b(implementar|corrigir|modificar|editar|alterar|criar|fa[cç]a|execute|executa|gerar documento|documento)\b/i.test(text)) return 'code_implementation_request'
  return 'unclear_general_request'
}

export function isOperatorIntent(message = '') {
  return classifyOperatorIntent(message) !== 'unclear_general_request'
}

export function selectEvidenceCommands(intent) {
  if (intent === 'greeting_request') return []
  const base = ['git_status', 'git_diff_stat', 'git_diff_name_only', 'git_log_recent', 'check_server', 'check_reasoning_core']
  if (intent === 'connector_status_request') return []
  if (intent === 'raw_shell_request') return ['git_status', 'git_diff_stat']
  if (['validation_request', 'natural_execution_request', 'checkpoint_close_request', 'approved_commit_request'].includes(intent)) {
    base.push(
      'check_operator_runtime',
      'check_executor',
      'check_memory',
      'check_planner',
      'check_policy',
      'check_verifier',
      'check_build_tools',
      'check_file_tools',
      'check_git_tools',
      'build',
    )
  }
  return base
}

export function inferConcreteShellCommand(message = '') {
  const text = String(message || '').trim()
  const fenced = text.match(/```(?:powershell|pwsh|bash|sh|cmd)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const quoted = text.match(/[“"]([^”"]{2,240})[”"]/)
  if (quoted?.[1]) return quoted[1].trim()
  const afterColon = text.match(/(?:comando|command)\s*[:：]\s*(.+)$/i)
  if (afterColon?.[1]) return afterColon[1].trim()
  const inline = text.match(/\b((?:git|node|npm\.cmd|npm|npx)\s+[^\r\n]{2,220})$/i)
  return inline?.[1]?.trim() || ''
}

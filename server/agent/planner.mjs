export function classifyOperatorIntent(message = '') {
  const text = String(message || '').toLowerCase()
  if (/\b(shell livre|raw shell|terminal livre|comando livre|executar shell)\b/i.test(text)) return 'raw_shell_request'
  if (/\b(aprovado,\s*commita|sim,\s*pode\s+commitar|commit\s+aprovado|pode\s+fazer\s+o\s+commit)\b/i.test(text)) return 'approved_commit_request'
  if (/\b(status|plataforma|como est[aá]|tudo certo|ficou certo)\b/i.test(text)) return 'status_request'
  if (/\b(pr[oó]ximo|proximo|e agora|o que fazemos|o que fazer|qual.*passo|pode seguir|segue|seguir|continua|continuar)\b/i.test(text)) return 'next_step_request'
  if (/\b(valida|validar|build|check|teste|testar)\b/i.test(text)) return 'validation_request'
  if (/\b(fecha|fechar|finaliza|finalizar).*checkpoint|checkpoint/i.test(text)) return 'checkpoint_close_request'
  if (/\b(implementar|corrigir|modificar|editar|alterar|criar|fa[cç]a|execute|executa)\b/i.test(text)) return 'code_implementation_request'
  return 'unclear_general_request'
}

export function isOperatorIntent(message = '') {
  return classifyOperatorIntent(message) !== 'unclear_general_request'
}

export function selectEvidenceCommands(intent) {
  const base = ['git_status', 'git_diff_stat', 'git_diff_name_only', 'git_log_recent', 'check_server', 'check_reasoning_core']
  if (intent === 'raw_shell_request') return ['git_status', 'git_diff_stat']
  if (['validation_request', 'checkpoint_close_request', 'approved_commit_request'].includes(intent)) {
    base.push('build')
  }
  return base
}

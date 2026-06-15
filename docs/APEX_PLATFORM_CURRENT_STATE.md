APEX Platform — Current State (honest snapshot)
===============================================

Checkpoint: CP-LIVE-1

Platform general status: YELLOW

Details:
- Build: GREEN (tsc + vite build passed locally in this workspace)
- Validações locais: GREEN (parciais — veja lista abaixo)
- Produto em browser / produção: NÃO COMPROVADO para múltiplos módulos (ver APEX_REALITY_AUDIT.md)
- PR #24: mantém Draft (não marcar Ready)

Validações locais executadas com sucesso:
- validate-cp15x-h5: GREEN
- validate-cp15x-h6: GREEN
- validate-cp15x-final: GREEN
- validate-cp15x-h43b: GREEN

Validações que precisam de ambiente / corrigir:
- validate-cp15x-h44: precisou de correção no fallback/idioma
- validate-vercel: QUEBRADO por falta de dotenv / chaves
- validate-supabase-live: QUEBRADO por falta de dotenv / chaves
- validate-cp15x-h7: HTTP path não comprovado em ambiente sem provider key

Resumo dos riscos e próximos passos imediatos:
1. Corrigir build/preview do PR #24 se ainda estiver quebrado.
2. Fornecer variáveis de ambiente e segredos para validar integrações live (Vercel, Supabase, Local Worker).
3. Provar flow crítico: Upload PDF → extração → resuma (M2).
4. Provar DOCX/XLSX/IFC flows em ambiente real antes de marcar qualquer PR como Ready.

Notas:
- "Feito" no código não é sinônimo de "Comprovado". Muitos módulos têm implementação mas falta prova de preview/produção.
- Documentos de auditoria devem acompanhar evidências (logs, HTTP responses, screenshots) quando as provas forem feitas.

Referências:
- docs/APEX_REALITY_AUDIT.md
- docs/APEX_MODULE_AUDIT.md
- docs/APEX_OPEN_BUGS_AND_NEXT_ACTIONS.md

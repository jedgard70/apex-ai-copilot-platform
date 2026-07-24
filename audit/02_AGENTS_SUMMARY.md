# 02 — Resumo dos agentes

| Domínio heurístico | Registros |
|---|---:|
| Geral | 580 |
| Software/UI | 508 |
| IA/agentes | 268 |
| Segurança/compliance | 208 |
| Arquitetura/construção/BIM | 196 |
| Plataforma/backend/cloud | 180 |
| Marketing/vendas | 115 |
| Finanças/contabilidade | 32 |

api/copilot/chat.mjs carrega skills por tags/título e injeta texto: prova uso como prompt, não execução. execute-skill-action cobre poucas ações. toolRegistry é catálogo separado.

Conclusão: skill, tool e agent/runtime não têm identidade única. Recomenda-se fonte canônica geradora de espelhos com owner, versão, domínio, custo, criticidade, executor, permissões e testes. Confiança alta para arquitetura; domínios têm confiança média.
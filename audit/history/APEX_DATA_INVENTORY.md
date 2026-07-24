# Inventário de Dados Apex

- Versão: 1.0.0
- Status: modelo auditado; aplicação remota não verificada
- Data: 2026-07-22

## Stores atuais

| Store | Entidades | Tecnologia | Tenancy/RLS | Retenção/backup | Estado |
|---|---|---|---|---|---|
| Memória do processo | sessões, pedidos, projetos, share tokens | Maps Node | checagens de token/identity no handler | perde no restart; sem backup | PROTOTYPE |
| Filesystem soberano | imagens geradas e fixtures | diretório `public/assets/sovereign` | validação de nome/path; arquivo público por URL | política não implementada | FUNCTIONAL_LOCAL |
| Supabase knowledge | assets, locations, relationships, docs, chunks, embeddings, tags, sources, ingestion jobs | migrations `0001` e `0015` | RLS declarada | aplicação/backup UNKNOWN | INTEGRATED_PARTIAL |
| Supabase behaviors | skill, agent, prompt, workflow registries | migration `0016` | RLS não evidenciada no arquivo auditado | UNKNOWN | BACKEND_ONLY |
| Supabase AI assets | assets, relações, versões, fontes, dependências, execuções, steps, usage, conflicts | migration `0017` | RLS não evidenciada no trecho estrutural | UNKNOWN | BACKEND_ONLY |
| Supabase API | api keys, requests, usage, jobs/events, webhooks/deliveries | migration `0018` | RLS em keys/requests/jobs/webhooks | UNKNOWN | BACKEND_ONLY |

## Problemas estruturais encontrados

1. `0001_knowledge_registry.sql` e `0015_knowledge_registry.sql` repetem a mesma família de tabelas; a estratégia de versionamento precisa ser saneada antes de aplicar em ambiente novo.
2. Policies de `0018` comparam `organization_id` a `auth.uid()`; isso presume que organização e usuário compartilham UUID, contrariando a separação constitucional entre identity e organization.
3. Tabelas de comportamento e AI assets não têm evidência suficiente de RLS/ownership nesta auditoria.
4. A existência de `supabase/.temp/linked-project.json` prova vínculo local da CLI, não aplicação das migrations nem saúde do banco.
5. Pedidos e projetos comerciais não têm tabelas canônicas no runtime atual.

## Dados sensíveis e LGPD

E-mail, identidade, organização, arquivos de projeto, prompts, resultados e billing são dados pessoais ou empresariais. Antes de produção: finalidade, base legal, minimização, criptografia, prazo de retenção, exclusão/exportação, região, DPA, trilha de acesso e plano de incidente devem ser aceitos. Nenhum segredo ou valor de `.env` foi lido para este relatório.

## Decisão

Não considerar nenhuma migration “aplicada” sem histórico remoto verificável. O Customer Journey precisa de schema mínimo para identities/memberships, orders/payments, projects/uploads, executions/artifacts e audit events, alinhado aos contratos do Core.

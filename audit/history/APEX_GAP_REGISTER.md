# Registro de Gaps Apex

- Versão: 1.0.0
- Status: aberto
- Data: 2026-07-22

| ID | Gap | Evidência | Severidade | Bloqueia | Ação mínima |
|---|---|---|---|---|---|
| G-001 | fontes canônicas do ACIP estão fora do repo oficial e se contradizem | 62/65/67/~78 e estados incompatíveis | crítica | verdade operacional | adotar esta matriz e arquivar alegações não repetíveis |
| G-002 | login/magic link dependem de env server-side não validado E2E | `AuthService.ts` | crítica | login/workspace | teste de staging e UX de configuração |
| G-003 | sessões são Map em memória | `AuthService.ts` | crítica | produção/escala | sessão persistente/segura ou JWT verificado por request |
| G-004 | checkout e pagamento são simulação local | `OrderManager.confirmPayment` | crítica | contratar serviço | Stripe/payment adapter + webhook/idempotência |
| G-005 | pedidos e projetos desaparecem no restart | Maps no server/OrderManager | crítica | entrega/recuperação | repositories persistentes e migrations |
| G-006 | uploads aceitam apenas imagem em payload, sem storage de origem governado | `server.ts:354` | alta | intake real | multipart/presigned upload, limites, AV e metadata |
| G-007 | resultado fica no filesystem local | `GeneratedAssetCustodian.ts` | crítica | download durável | object storage com ownership/retention |
| G-008 | ArchVis exige chamada paga e aceite real ainda não está automatizado | fal adapter | alta | geração | staging budgetado + mock contratual em CI + smoke autorizado |
| G-009 | catálogo vende capabilities planejadas | `ServiceCatalog.ts` | alta | confiança/comercial | impedir compra ou rotular oferta sob proposta |
| G-010 | policies API confundem organization com user UUID | migration `0018:110-113` | crítica | tenancy | corrigir modelo/policies após ADR |
| G-011 | migrations 0001 e 0015 duplicam knowledge schema | arquivos SQL | alta | bootstrap DB | consolidar baseline sem reescrever histórico aplicado |
| G-012 | RLS incompleta/não comprovada nos registries | migrations 0016/0017 | crítica | segurança/LGPD | ownership + policies + testes multi-tenant |
| G-013 | 102 entradas Stitch, 100 HTML e rotas conectadas muito menores | manifest/server | média | UX/governança | registry tela→rota→produto→capability |
| G-014 | `/vsl` possui condições duplicadas no servidor | `server.ts:129` e `174` | média | previsibilidade | consolidar após teste de regressão |
| G-015 | API sem schemas/rate limits consistentes | handlers manuais | alta | API pública | validation middleware e quotas |
| G-016 | nenhum agente atende estado operational | padrões vs executores | alta | promessa de agentes | catálogo validado e promotion gate |
| G-017 | 4.114 skill files brutos não deduplicados/licenciados | censo físico | alta | migração cognitiva | hash/licença/proveniência/dedupe |
| G-018 | Accounting e Legal misturados em alegações do copilot | projetos/fontes distintos | alta | produtos verticais | auditorias independentes |
| G-019 | ausência de CI/CD próprio do OS | censo repo | alta | release | pipeline com gates e staging |
| G-020 | produção, backups, custos e SLA não foram comprovados | sem acesso externo autorizado | alta | LIVE_PRODUCTION | checklist e evidência externa em rodada autorizada |

## Ordem de ataque

P0: G-002–G-007, G-010, G-012. P1: G-009, G-011, G-015, G-019, G-020. P2: design, legado cognitivo e expansão vertical. Nenhuma Fase 4 ou nova capacidade de IA deve ultrapassar os P0 do Customer Journey.

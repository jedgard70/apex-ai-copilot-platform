# Auditoria de Encerramento — Customer Journey

- Versão: 1.0.0
- Status: encerramento técnico condicionado; piloto fechado não autorizado
- Data: 2026-07-22
- Regra: nenhuma nova chamada paga, commit, deploy ou nova fase

## 1. Arquitetura fal.ai

| Verificação | Resultado | Evidência |
|---|---|---|
| `@fal-ai/client` importado somente no adapter | yes | `src/providers/adapters/fal/FalProviderAdapter.ts:10`; nenhuma outra importação no código |
| ProviderRouter utilizado | yes | `ExecutionOrchestrator.ts:89` |
| ExecutionOrchestrator utilizado | yes | `server.ts:364`; `CoreFoundation.ts:47` |
| PolicyEnforcer utilizado | yes | `ExecutionOrchestrator.ts:56` |
| ExecutionLedger utilizado | yes | `ExecutionOrchestrator.ts:99` |
| UsageLedger utilizado | yes, em memória | `ExecutionOrchestrator.ts:155` |
| Quality Gate utilizado | yes | `FalProviderAdapter.ts:169` |
| GeneratedAssetCustodian utilizado | yes | `FalProviderAdapter.ts:160` |
| SDK types vazam para o domínio | no | contrato público é `AIProviderAdapter`; tipos fal ficam no adapter/HTTP client |
| Provider URL exposta | no na resposta do produto | output usa `custodyResult.apexUrl` em `FalProviderAdapter.ts:195` |
| Substituição do provider continua possível | parcialmente | contrato/Router permitem; Orchestrator injeta e chama concretamente `FalProviderAdapter` |

### Regressão encontrada

O ramo real com credencial chama `fal.storage.upload` e `fal.subscribe` diretamente (`FalProviderAdapter.ts:120-125`). Com isso ele contorna o `FalHttpClient`, que concentra os headers `X-Fal-Store-IO: 0`, `X-Fal-No-Retry`, `X-Idempotency-Key` e a captura de `request_id`. A idempotência local anterior à chamada continua existindo, mas não há prova de idempotência/retenção no transporte SDK, nem `providerRequestId` persistido. A arquitetura de domínio segue isolada; a governança do provider não está integralmente preservada.

**Provider architecture preserved: FAIL.**

## 2. Auditoria financeira

Não foi feita chamada externa nesta auditoria. A reconstrução abaixo usa somente arquivos e timestamps locais.

| executionId | providerRequestId | timestamp UTC | resultado | custo estimado | custo reportado | retry externo | motivo |
|---|---|---|---|---:|---:|---|---|
| `exec-b25bc021-8584-4c31-a0f4-8dae599db399` | UNKNOWN | 2026-07-22 13:33:19 | JPEG 512×512, 53.898 bytes | US$ 0,03 | UNKNOWN | UNKNOWN | smoke real ArchVis, inferido pela sequência e ativo válido |
| `exec-c5174472-5b53-409e-939d-e746e10a13f5` | UNKNOWN | 2026-07-22 13:36:19 | JPEG 512×512, 54.635 bytes | US$ 0,03 | UNKNOWN | UNKNOWN | Customer Journey ArchVis |

Existe ainda `exec-a5f06431-4fe9-44d7-b140-ca5b3a2f1be1`, JPEG 1248×400 criado às 13:56:29 UTC. Sem ledger/log/vínculo, ele permanece **UNATTRIBUTED** e não é somado como submissão real confirmada. O JPEG 64×64 anterior também não prova inferência paga.

```text
Total real submissions: 2 confirmadas; 1 ativo adicional não atribuível
Total estimated provider cost: US$ 0,06 confirmado; teto conservador US$ 0,09 incluindo o não atribuído
Total provider-reported cost: UNKNOWN / não persistido
Request IDs: UNKNOWN / ramo SDK não os registra
Retries externos: UNKNOWN / fal.subscribe é opaco e logs=false
APEX_ALLOW_PAID_SMOKE_TEST estava ativo: missing na configuração atual
```

O script `smoke-fal-archvis.ts` possui gate pago, mas `smoke-customer-journey.mjs` não o verifica: ele chama a rota oficial, que executa quando `APEX_FAL_ARCHVIS_ENABLED=true` e a chave está carregada. Logo, o controle pago não é global.

**Real cost fully audited: FAIL.** O valor estimado foi limitado; custo reportado, request IDs e retries são irrecuperáveis pelas evidências locais atuais.

## 3. Persistência comercial

Não havia listener em 3010 no início. O Apex OS foi iniciado, identificado como Node PID `22116` e reiniciado exclusivamente para PID `18068`. Após o restart, `/health` retornou 200. Nenhum outro processo foi parado.

| Dado | Após restart | Evidência |
|---|---|---|
| Sessão | exige novo login | `AuthService.ts`: Map em memória |
| Pedido | não persiste | `OrderManager.ts`: Map em memória |
| Projeto | não persiste | `server.ts:41-42`: Maps em memória |
| Upload | não persiste como entidade vinculada | bytes existem apenas no objeto Project em memória |
| Execution | ledgers/pending não persistem nesse fluxo | singletons/Maps em memória |
| Artifact físico | persiste | JPEG permanece em `public/assets/sovereign` após restart |
| Download oficial | não continua | rota exige sessão + Project Map; chamada direta do asset sem sessão retornou 401 |

**Commercial persistence: FAIL.**

## 4. Jornada oficial pela interface

| Etapa | Rota/serviço | Official application flow | Direct test-only insertion |
|---|---|---|---|
| Login/magic link | Supabase admin `generateLink` + `verifyOtp`; depois POST `/api/auth/session` | partial/no para solicitação do e-mail | yes |
| Sessão/workspace | GET `/workspace`, mesma proteção/cookie do produto | yes | no |
| Pedido | POST `/api/checkout` → `OrderManager.create` | yes | no |
| Pagamento | POST `/api/checkout/:id/pay` → confirmação sandbox | yes, mas mock comercial | no |
| Upload/projeto | POST `/api/projects`, mesmo payload da UI | yes | no |
| Execução | `foundation.executionOrchestrator.execute` chamado pelo handler | yes | no |
| Entrega | GET `/api/projects/:id/result` | yes | no |

O script automatizado usa as mesmas rotas de order/project/upload/execution/delivery que `WorkspacePage.ts`. Contudo, ele não comprovou entrega real de e-mail: criou e verificou o magic link diretamente por APIs administrativas do Supabase.

## 5. Resultado visual de 54.635 bytes

```text
Caminho Apex: D:/AI-constr/apex-os/public/assets/sovereign/exec-c5174472-5b53-409e-939d-e746e10a13f5-ad6d9669dcfd.jpg
Dimensões: 512 × 512
Formato: JPEG, 24 bpp RGB
Tamanho: 54.635 bytes
SHA-256: AD6D9669DCFD458E81828074E5C8BBE816A022BE702064627B172BFD06E70303
executionId: exec-c5174472-5b53-409e-939d-e746e10a13f5
artifactId: não existe/persistido; checksum prefixo ad6d9669dcfd
orderId: UNKNOWN após restart
projectId: UNKNOWN após restart
workspaceId: UNKNOWN após restart
```

Os vínculos foram perdidos com os Maps. Nenhuma URL temporária do provider foi registrada neste relatório.

## 6. Status final

```text
Owner magic-link validation: PENDING OWNER
Technical customer journey: PASS (automação técnica; e-mail real excluído)
Commercial persistence: FAIL
Provider architecture preserved: FAIL
Real cost fully audited: FAIL
Ready for closed pilot: NO
Ready for public production: NO
```

## Gate do Owner

O Owner deve responder, sem enviar link ou token:

```text
E-mail recebido:
Host/porta do link:
Login concluído:
Workspace abriu:
Projeto apareceu:
Imagem apareceu:
Download funcionou:
```

## STOP

Nenhuma correção está autorizada por este documento. Persistência, governança do SDK e ledger financeiro precisam de uma sprint corretiva aprovada antes do piloto fechado.

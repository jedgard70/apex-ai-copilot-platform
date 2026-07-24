# Constituição de Organization
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Lei central

Organization é entidade responsável por objetos, memberships e finalidade. Nenhum objeto governado existe sem Organization responsável. Objetos internos compartilhados pertencem à Organization operacional Apex Global.

Uma Organization ativa é a Organization responsável por si mesma; isso encerra a cadeia sem regressão. Sua criação é patrocinada por Apex Global ou outra autoridade aprovada até a ativação, quando passa a responder por seu próprio lifecycle. Holding/parent não recebe ownership automático.

## Vocabulário estrutural

| Termo | Definição e pertencimento |
|---|---|
| Organization | raiz responsável com identidade jurídica/operacional e lifecycle |
| Holding | Organization que possui ou governa outras Organizations por relação explícita |
| Business Unit | unidade organizacional subordinada; não é tenant ou produto automaticamente |
| Department | agrupamento funcional interno de uma Organization |
| Workspace | espaço de colaboração pertencente a uma Organization e protegido por Tenant/Scope |
| Tenant | fronteira de isolamento que atende exatamente uma Organization responsável; uma Organization pode ter um ou mais tenants aprovados |
| Project | agregado de trabalho pertencente a Organization, Workspace e Product context definidos |
| Vendor | relação na qual outra Organization fornece bens/serviços |
| Partner | relação cooperativa entre Organizations |
| Customer | relação comercial de uma Organization com Apex Global ou outra oferta |

Vendor, Partner e Customer são relações/tipos contextuais de Organization, não Identities. “Owner” de Organization é uma relação de governança, não posse informal.

## Membership

Membership liga Identity a Organization com status, roles, scopes, validade e provenance. Não concede acesso por existir; autorização ainda avalia permission, capability grant, policy e contexto.

## Hierarquia e isolamento

Holding não recebe automaticamente dados/acessos de subsidiárias. Business Unit e Department não atravessam tenants por herança implícita. Workspace não é fronteira suficiente sem Tenant e policies. Project não é Organization.

## Ownership e lifecycle

Organization: `proposed`, `active`, `suspended`, `closing`, `archived`. Encerramento exige transferência/retenção de objetos e preservação de Audit. Todo objeto tem Organization responsável e owner accountable; transferências emitem fatos auditáveis.

**Riscos:** hierarquia conceder privilégio, tenant compartilhado sem finalidade, objetos órfãos e mistura de relações comerciais.

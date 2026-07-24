# Constituição de Identity
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Lei central

Identity responde somente “quem/qual sujeito é?”. Não representa Produto, Organization, acesso, plano ou cargo. Autenticação comprova uma Identity em determinado assurance; autorização decide o que ela pode fazer.

## Tipos e sujeitos

| Termo | Definição |
|---|---|
| Identity | identificador estável de sujeito com lifecycle e credenciais separadas |
| Human Identity | sujeito pessoa natural, independentemente de vínculos organizacionais |
| Machine Identity | sujeito não humano autenticável para execução controlada |
| Agent Identity | Machine Identity atribuída a agente registrado; não é a definição do agente |
| API Identity | Machine Identity de cliente/integração que chama contrato |
| Worker Identity | Machine Identity de executor assíncrono ou job |
| System Account | conta técnica restrita a função interna do Apex OS |
| Service Account | conta técnica delegada a serviço, integração ou automação com owner |
| User | perfil/apresentação associado a Human Identity; pode variar por contexto |

API e Worker não são necessariamente contas distintas: são categorias de uso de Machine Identity. Credencial não é Identity; uma Identity pode rotacionar credenciais sem mudar de ID.

## Relações e papéis

Owner, Administrator, Customer, Partner, Consultant e Guest são papéis ou relações contextuais entre Identity, Organization e Scope. Não são tipos de Identity. Uma mesma Human Identity pode ser Administrator em uma Organization, Consultant em outra e Guest em Workspace específico.

## Lifecycle

`proposed`, `active`, `suspended`, `disabled`, `archived`. Ativação requer owner/Organization para Machine Identity e vínculo verificável para Human Identity. Desativação revoga sessões/credenciais conforme política sem apagar evidência.

## Sessão e delegação

AI Session e sessão autenticada são contextos temporários, não identidades. Delegação registra delegante, delegado, escopo, finalidade, validade e cadeia; nunca amplia privilégio além do delegante/policy.

## Invariantes

- Identity é globalmente distinguível, mas dados exibidos são minimizados por contexto.
- Organization membership não é armazenado como propriedade intrínseca da Identity.
- Agente não herda automaticamente permissões do usuário que o invoca.
- Contas técnicas não compartilham credenciais nem têm owner implícito.

**Riscos:** account takeover, identidade duplicada, service account órfã e confusão entre autenticação/autorização.

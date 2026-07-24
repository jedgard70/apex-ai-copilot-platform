# ADR-0022 — Everything Has an Owner
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto
Objetos sem responsabilidade explícita acumulam risco, dados órfãos e dependências sem manutenção.

## Decisão
Todo objeto governado possui domínio, Organization responsável, owner accountable, responsibility, visibility, lifecycle, dependencies, events e audit policy. Objetos compartilhados pertencem à Organization operacional Apex Global; “global” não significa sem dono. Ownership pode ser transferido apenas por evento auditável e autorização.

## Alternativas
Owner opcional; ownership por pasta/equipe implícita; objetos globais sem Organization.

## Consequências positivas
Accountability, retenção, autorização e depreciação verificáveis.

## Consequências negativas
Metadados e processos de transferência obrigatórios.

## Riscos
Owner nominal sem capacidade; mitigar com validação e substituto organizacional.

## Critérios de revisão
Entidade legítima cuja responsabilidade não possa ser atribuída sem artificialidade comprovada.

## Documentos afetados
Object Ownership, Organization, registries, módulos e Definition of Done.

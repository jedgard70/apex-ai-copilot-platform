# Arquitetura de segurança

**Status:** Baseline proposta
**Versão:** 1.0.0
**Data:** 2026-07-20

Zero trust contextual, menor privilégio, deny by default, defense in depth e segregação de funções. Tenant é aplicado em identidade, autorização, banco, storage, cache, jobs, search, telemetry e IA.

Segredos ficam em vault aprovado, nunca em repositório/log. Criptografia em trânsito e repouso; chaves com rotação e owner. Ações sensíveis exigem aprovação explícita, step-up auth quando adequado, idempotência e evento de auditoria.

Threat modeling e privacy review precedem dados sensíveis, integrações e agentes mutáveis. Incidentes têm severidade, contenção, comunicação, evidência e postmortem.

Autorização combina RBAC, capability grant, context policy e scope, sempre deny by default. Capability não é Permission; Entitlement não autoriza segurança. Consulte a [Constituição de Autorização](../kernel/AUTHORIZATION_CONSTITUTION.md).

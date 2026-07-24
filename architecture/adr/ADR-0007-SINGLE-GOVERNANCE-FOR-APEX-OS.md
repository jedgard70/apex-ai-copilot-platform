# ADR-0007 — Governança única para o Apex OS

**Versão:** 1.0.0
**Status:** aceito
**Data:** 2026-07-20

## Contexto

A Apex Global possui projetos, skills, políticas e arquiteturas anteriores distribuídos em diferentes workspaces. Essas fontes foram criadas para contextos distintos e contêm regras que podem conflitar com a fundação limpa do Apex OS, inclusive sobre workspace oficial, reaproveitamento obrigatório e restrições à criação de um novo repositório.

Manter autoridades paralelas criaria ambiguidade operacional e permitiria que decisões antigas condicionassem indevidamente a nova arquitetura.

## Decisão

A Apex Global manterá uma única governança oficial para a nova geração: [`apex-os-genesis-governance`](../../.agents/skills/apex-os-genesis-governance/SKILL.md).

Skills, políticas, arquiteturas, pastas e projetos anteriores serão tratados exclusivamente como legado. Não terão autoridade operacional ou arquitetural sobre o Apex OS. O único workspace oficial da nova geração é `D:\AI-constr\apex-os`.

A hierarquia de autoridade passa a ser:

1. Constituição e ADRs do Apex OS.
2. Especificação aprovada da sprint atual.
3. Documentos de governança do novo repositório.
4. Decisões explícitas do proprietário.
5. Evidências legadas, apenas como insumo não vinculante.

## Motivos

- Evitar conflito de regras.
- Impedir contaminação arquitetural.
- Reduzir complexidade e eliminar dupla autoridade.
- Permitir reconstrução limpa.
- Preservar o legado apenas como fonte de conhecimento e evidência.
- Garantir rastreabilidade das decisões futuras.

## Consequências

- Regras antigas não serão herdadas automaticamente.
- Cada componente legado exigirá avaliação e aprovação individual.
- Capacidades existentes poderão ser reescritas.
- O novo sistema adotará padrões próprios.
- A migração poderá ser mais lenta no início, porém será mais segura e sustentável.
- A regra legada de “zero clones” não pode bloquear o repositório expressamente autorizado.
- Nenhuma compatibilidade arquitetural será preservada apenas por conveniência.

## Controles

- Consultar o legado somente em modo leitura durante a Sprint 0.
- Não copiar automaticamente skills, prompts, agentes, configurações ou estruturas.
- Registrar origem, evidência, custo, segurança e decisão de cada candidato à migração.
- Interromper a execução se uma instrução tentar restabelecer autoridade legada.

## Riscos

- **Reimplementação desnecessária:** mitigar com auditoria e scorecard antes de decidir.
- **Perda de conhecimento histórico:** mitigar com referências de proveniência, sem copiar estruturas inteiras.
- **Migração inicial mais lenta:** aceitar como custo de redução de risco e dívida técnica.
- **Dependências ocultas no legado:** identificar por análise específica antes de qualquer incorporação.

## Regra final

Não existem dois Apex oficiais. Existe uma única nova plataforma oficial: Apex OS. Todo o restante permanece legado até ser formalmente reavaliado e incorporado.

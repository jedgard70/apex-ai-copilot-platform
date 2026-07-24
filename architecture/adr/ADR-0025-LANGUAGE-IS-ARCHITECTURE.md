# ADR-0025 — Language Is Architecture
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto
Termos ambíguos produzem módulos duplicados e contratos incompatíveis antes mesmo do código.

## Decisão
`kernel/DOMAIN_LANGUAGE.md` é o vocabulário técnico canônico. Cada termo possui uma definição; sinônimos informais não criam entidades. Todo elemento novo responde primeiro “a que domínio pertence?”. Se não houver domínio claro, não será implementado. Mudança semântica estrutural exige ADR.

## Alternativas
Glossários locais; nomes definidos pelo framework; linguagem livre por equipe.

## Consequências positivas
Modelagem consistente, comunicação verificável e menos duplicação.

## Consequências negativas
Renomeações e novos conceitos exigem disciplina.

## Riscos
Vocabulário congelado impedir aprendizado; mitigar com extensão governada e ADR substituta.

## Critérios de revisão
Ambiguidade comprovada, evolução legítima do domínio ou conflito regulatório.

## Documentos afetados
Domain Language, glossário, módulos, produtos, registries e documentação.

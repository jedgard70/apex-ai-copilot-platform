# ADR-0030 — IDs e Tempo por Portas Injetáveis
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto
IDs estáveis e timestamps testáveis não podem depender implicitamente de ambiente global.

## Decisão
Usar IDs opacos gerados por porta `IdGenerator`; adapter inicial usa UUID aleatório do runtime. Tempo usa `Clock` e instantes UTC ISO-8601. Testes usam sequências/clock fixo. Domínio não interpreta conteúdo de ID nem chama relógio global.

## Alternativas
IDs incrementais; timestamps/UUID diretamente nas entidades; IDs semanticamente compostos.

## Consequências positivas
Determinismo, portabilidade e menos colisão/acoplamento.

## Consequências negativas
Dependências explícitas nos casos de uso.

## Riscos
Ordenação não derivável do ID e clock skew futuro; usar occurredAt e políticas específicas.

## Critérios de revisão
Requisitos de ordenação, localização ou interoperabilidade comprovados.

## Documentos afetados
shared ids/time, eventos, Audit e testes.

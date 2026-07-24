# Auditoria da Classificação de Conhecimento
**Versão:** 1.0.0 | **Status:** taxonomia aprovada | **Data:** 2026-07-20

## Mapeamento inicial

| Classe | Local canônico atual | Observação |
|---|---|---|
| Vision | `vision/`, `company/VISION.md` | Master Vision é fonte detalhada única |
| Constitution | `company/APEX_CHARTER.md`, decisões explícitas | limites máximos |
| Architecture | `architecture/`, ADRs, governance técnico | fronteiras e padrões |
| Business | `business/`, marketing estratégico | economics e operação empresarial |
| Products | `products/` | ofertas e domínios |
| Knowledge | referências/auditorias/migration | evidência, análise e legado |
| Implementation | código/testes/manifests futuros | inexistente nesta Sprint |

## Regras verificadas

- Legado não foi elevado a Constituição ou Implementation.
- Visão não afirma operação.
- Auditorias preservam histórico sem se tornarem autoridade arquitetural.
- Persona, Studio e estratégia internacional receberam classificação conceitual correta.
- Documentation Standard referencia ADR-0018.

## Pendências

O schema executável de metadados, registry, retenção e controle de acesso será definido antes de implementar Knowledge. Documentos existentes herdam classificação por fonte canônica; migração para frontmatter estruturado requer decisão futura.

**Riscos:** classificação por pasta insuficiente e múltiplas classes primárias.

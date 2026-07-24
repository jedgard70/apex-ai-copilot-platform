# ADR-0020 — Kernel Constitution
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto
O Apex OS precisa de invariantes anteriores a tecnologia para impedir que implementações redefinam identidade, ownership, autorização ou linguagem por conveniência.

## Decisão
Adotar `kernel/KERNEL_CONSTITUTION.md` e as constituições especializadas como autoridade técnica fundamental. Toda entidade pertence a domínio, Organization e owner; possui responsibility e lifecycle; opera por contratos, políticas e fatos auditáveis. Contradição futura exige ADR substituta aprovada.

## Alternativas
Regras dispersas; decisões por framework; arquitetura emergente sem Constituição.

## Consequências positivas
Coerência duradoura, revisão objetiva e implementação derivável.

## Consequências negativas
Mudanças estruturais exigem processo explícito.

## Riscos
Kernel amplo virar dogma; mitigar com invariantes mínimos e critérios de revisão.

## Critérios de revisão
Evidência de contradição interna, requisito legal ou incapacidade de representar domínio legítimo.

## Documentos afetados
`kernel/*`, arquitetura, governança, glossário e roadmaps.

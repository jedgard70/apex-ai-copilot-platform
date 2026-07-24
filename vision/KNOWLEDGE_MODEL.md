# Modelo Corporativo de Conhecimento
**Versão:** 1.0.0 | **Status:** classificação oficial | **Data:** 2026-07-20

Todo artefato futuro recebe exatamente uma classe primária e pode referenciar classes relacionadas:

| Classe | Pergunta respondida | Autoridade típica |
|---|---|---|
| Vision | por que e para onde? | `vision/`, direção não operacional |
| Constitution | quais princípios e limites máximos? | Charter e decisões do proprietário |
| Architecture | como responsabilidades e dependências são estruturadas? | ADRs e `architecture/` |
| Business | como valor, receita, custo e operação empresarial funcionam? | `business/` |
| Products | que problema/cliente/domínio cada oferta atende? | `products/` |
| Knowledge | quais fatos, referências e aprendizados sustentam decisões? | fontes com proveniência |
| Implementation | o que existe executavelmente e com qual evidência? | código, testes, manifests e operação validada |

Campos mínimos: ID/caminho, classe, título, owner quando definido, versão, status, data, origem, sensibilidade, validade/revisão e relações. Legado entra como Knowledge candidato, nunca como Constitution ou Implementation atual por presunção.

Conflitos seguem a hierarquia de autoridade; a classe não eleva um documento automaticamente. Consulte [ADR-0018](../architecture/adr/ADR-0018-KNOWLEDGE-IS-A-CORPORATE-ASSET.md).

**Riscos:** classificação ornamental, duplicação e conhecimento sensível sem acesso controlado.

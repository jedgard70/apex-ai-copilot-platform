# Consolidação patrimonial como estratégia padrão

**Status:** Aceito pelo Owner  
**Versão:** 1.0.0  
**Data:** 2026-07-22

## Contexto

A Apex possui anos de patrimônio tecnológico distribuído entre repositórios, aplicações, executáveis, interfaces, APIs, serviços, integrações, workflows, prompts, skills, agentes e ativos de conhecimento. Tratar o Apex OS como projeto greenfield cria duplicação, descarta conhecimento acumulado e posterga a entrega comercial.

A [matriz de consolidação corporativa](../../legacy_inventory/22_CORPORATE_ASSET_CONSOLIDATION_MATRIX.md) registra as fontes já localizadas e o nível atual de evidência. A presença de um ativo, isoladamente, não prova maturidade nem autoriza cópia em massa.

## Decisão

O Apex OS será finalizado por **consolidação patrimonial**. Para toda capability, módulo, tela, backend, workflow, integração, prompt, skill ou agente, a sequência obrigatória é:

```text
LOCALIZAR → AVALIAR MATURIDADE → SELECIONAR → MIGRAR → CORRIGIR
→ INTEGRAR AO RUNTIME → MODERNIZAR COM STITCH → VALIDAR → ENTREGAR
```

Antes de produzir código novo, deve existir busca documentada no ACIP e nos repositórios inventariados, cobrindo ao menos:

- implementação e módulo de origem;
- UI e referência Stitch;
- backend, APIs, serviços e providers;
- workflows, prompts, skills e agentes;
- dependências, configuração por nome e evidência de funcionamento;
- duplicatas e comparação de maturidade.

Quando houver capacidade equivalente, selecionar a implementação mais madura e migrá-la para contratos do Apex OS. É proibido manter duplicatas, reinventar comportamento já disponível ou substituir patrimônio apenas por preferência técnica.

Código novo é exceção. Ele somente é permitido quando a busca estiver registrada e demonstrar que:

1. não existe capacidade equivalente; ou
2. todas as candidatas são tecnicamente inviáveis por segurança, licença, custo, incompatibilidade ou ausência de comportamento aproveitável.

No segundo caso, a inviabilidade e a decisão devem constar no scorecard e na RFC. Reescrita deixa de ser uma alternativa comum de migração e passa a exigir essa prova explícita.

Arquivos `.env`, credenciais e valores sensíveis nunca são copiados. O ambiente legado serve apenas para inventariar nomes, consumidores e estado das integrações. Qualquer migração usa configuração segura do ambiente de destino.

## Relação com decisões anteriores

Este ADR **refina** o [ADR-0003](./ADR-0003-CONTROLLED-LEGACY-MIGRATION.md): preserva proveniência, scorecard, segurança, testes e aprovação, mas torna a consolidação a regra e a reescrita uma exceção comprovada.

Também preserva o [ADR-0001](./ADR-0001-NEW-CLEAN-REPOSITORY.md): o repositório de destino continua limpo e governado; “limpo” não significa ignorar ou recriar o patrimônio existente.

## Consequências positivas

- preserva investimento e conhecimento acumulados;
- reduz duplicação e tempo até valor comercial;
- força seleção explícita entre implementações concorrentes;
- mantém adaptação aos contratos, segurança e governança do Apex OS;
- torna “migrado”, “integrado” e “pronto” declarações verificáveis.

## Consequências negativas

- exige descoberta e validação antes de cada migração;
- ativos heterogêneos podem demandar adapters e correções;
- algumas candidatas serão descartadas após análise, apesar do investimento histórico;
- o inventário e a matriz precisam permanecer atualizados.

## Evidência e critérios de aceitação

Uma consolidação somente pode ser declarada concluída quando houver:

1. origem e versão identificadas;
2. comparação entre candidatas registrada;
3. contrato de destino definido;
4. segurança, licença, custo e configuração avaliados;
5. migração e correções rastreáveis;
6. integração ao Runtime sem acoplamento direto a provider;
7. fidelidade ao Stitch para interfaces;
8. testes e execução reproduzível;
9. validação do Owner para uso comercial.

## Regra para RFCs e backlog

RFCs de capacidades conhecidas devem usar verbos de consolidação, por exemplo “Migrar”, “Integrar” ou “Corrigir”. Toda RFC começa pela localização da implementação existente. “Implementar” só pode aparecer após a prova de exceção definida neste ADR.

## Critérios de revisão

Revisar se evidência operacional demonstrar que a consolidação aumenta de forma sistemática o risco, o custo total ou o tempo de entrega, sem reduzir os controles de proveniência, segurança, contrato, teste e aceitação.

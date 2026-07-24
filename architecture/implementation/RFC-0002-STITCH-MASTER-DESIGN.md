# RFC-0002 — Stitch Master Design e Consolidação da Aplicação

**Status:** implementação inicial em validação do Owner
**Objetivo:** transformar o projeto Stitch `5352378353941222376` na fonte de
implementação visual do Apex OS.

## Escopo executado

1. Catalogar todas as telas do projeto, não somente as URLs inicialmente
   fornecidas.
2. Preservar HTML exportado e screenshots por ID original.
3. Servir as telas em uma aplicação única, com navegação e busca.
4. Encaminhar ações de entrada para o runtime Apex existente.
5. Não criar layouts paralelos nem modificar o legado.

## Ordem de produto

A consolidação visual seguirá:

```text
Landing/VSL consolidada
  → Login
  → Cadastro e recuperação
  → Dashboard
  → Workspace
  → Roadmap
  → Módulos
  → Fluxos
  → Demais telas Stitch
```

A Landing não será escolhida de uma variante única. Os melhores blocos das
variantes aprovadas serão combinados em uma página oficial e submetidos à
validação do Owner.

## Critério de conclusão

Uma tela só recebe `READY FOR OWNER VALIDATION` quando o HTML/screenshot está
fiel ao Stitch, o CTA/fluxo correspondente funciona no Apex OS, a tela foi
testada e o resultado foi comparado visualmente.

Este RFC não declara as 104 telas de origem (99 entradas únicas após deduplicação) como funcionalmente concluídas; ele registra
a fundação executável para ligá-las uma a uma.

# ADR-0017 — Intelligent Intake First
**Versão:** 1.0.0 | **Status:** Accepted | **Data:** 2026-07-20

## Contexto

Usuários podem chegar com intenção ou ativos em estágios variados; obrigá-los a escolher módulos transfere a complexidade interna para a experiência.

## Decisão

Adotar como experiência oficial: “Mostre o que você tem ou diga o que deseja fazer.” O Intelligent Intake recebe intenção ou ativo, mostra o que recebeu, explica entendimento e incerteza, pergunta o objetivo, sugere rota e abre o Produto/Shared Service correto com contexto. Não promete visualização, conversão ou análise sem capability validada.

## Alternativas

Menu de módulos; formulário extenso; dashboard como primeira tela; roteamento determinístico apresentado como IA.

## Consequências positivas

Menor carga cognitiva, entrada flexível e continuidade de contexto.

## Consequências negativas

Classificação, segurança de arquivos e explicação de incerteza elevam complexidade futura.

## Riscos

Rota errada, arquivos maliciosos, claims falsos e custo antes do consentimento; mitigar com preview seguro, confirmação e gates.

## Critérios de revisão

Revisar com evidência de pesquisa/telemetria de que a abordagem prejudica descoberta ou confiança.

## Documentos afetados

`vision/USER_EXPERIENCE_VISION.md`, `vision/INTELLIGENT_INTAKE.md`, produtos, AI Strategy e roadmap.

# ADR-0008 — Isolamento de Domínios entre Produtos Verticais

**Versão:** 1.0.0
**Status:** Accepted
**Data:** 2026-07-20

## Contexto

Engenharia, Contabilidade, Jurídico, Investimentos, Viagens e Studio possuem regras, dados, workflows, agentes e ciclos comerciais próprios. Sem isolamento explícito, regras verticais contaminariam o Core e surgiriam dependências circulares.

## Decisão

Cada Produto Vertical é um domínio isolado. Produtos não importam código interno nem acessam bancos, tabelas, arquivos ou estados de outros produtos. Colaboração ocorre somente por contratos versionados, APIs internas, eventos, mensagens, workflows orquestrados ou interfaces públicas formalizadas.

Capacidades genuinamente transversais pertencem ao Core, a Shared Services ou a Platform Services. O Core não contém regras verticais; Shared Services não absorvem regras exclusivas por conveniência. Dados e eventos têm autoridade explícita. Exceções exigem ADR, prazo e estratégia de remoção.

Exemplo permitido: Apex Accounting publica `accounting.invoice.created`; Apex Growth o consome por contrato, consentimento e LGPD. Exemplo proibido: importar `products/accounting/internal/invoice-service` ou consultar tabelas contábeis.

## Alternativas

Monólito multidomínio; acesso direto entre produtos; banco compartilhado sem autoridades; duplicação integral.

## Consequências positivas

Baixo acoplamento, segurança, testabilidade, autonomia, comercialização separada, substituição tecnológica e crescimento organizado.

## Consequências negativas

Contratos e adapters exigem manutenção; comunicação indireta aumenta disciplina e planejamento inicial.

## Riscos e mitigações

- Shared Services excessivos ou Core como depósito: revisar ownership e exigir ADR.
- Contratos genéricos e eventos sem owner: registrar schemas, versões e responsáveis.
- Banco compartilhado como atalho: proibir acesso cruzado e prever testes arquiteturais.

## Critérios de revisão

Revisar somente por requisito empresarial, regulatório ou operacional comprovado, ou extração transversal formalizada por ADR substituta.

## Documentos afetados

`architecture/APEX_OS.md`, `architecture/DOMAIN_BOUNDARIES.md`, `architecture/PRODUCT_ARCHITECTURE.md`, `architecture/SHARED_SERVICES.md`, `architecture/CORE_MODULES.md`, `products/PRODUCT_CREATION_STANDARD.md`, `governance/MODULE_STANDARD.md`, `governance/API_STANDARD.md`, `governance/DEFINITION_OF_DONE.md`, `docs/GLOSSARY.md` e `roadmap/SPRINT_1_CORE_FOUNDATION.md`.

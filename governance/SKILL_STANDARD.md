# Padrão de skills
**Status:** Foundation | **Versão:** 0.1 | **Data:** 2026-07-20

Classes de composição: knowledge-only, prompt-only, executable e composite. Toda skill tem ID, versão, domínio, descrição, owner, inputs/outputs declarados, dependências, política de dados e evidência. Quando registrada em lifecycle, usa os estados oficiais do [ADR-0014](../architecture/adr/ADR-0014-AGENT-LIFECYCLE-STATES.md). Executable exige executor e permissões. Prompt/conhecimento nunca é funcionalidade operacional sem executor comprovado.

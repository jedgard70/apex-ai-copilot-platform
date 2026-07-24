# AGENTS.md — Constituição Operacional do Apex AI Platform

- **Versão:** 6.0.0 (Constituição Final Master)
- **Status:** Ativa
- **Aplicação:** Todos os agentes, modelos, CLIs, IDEs, skills e automações que atuem na plataforma.

**Este documento é a Constituição Operacional do Apex AI Platform. Ele define os princípios permanentes que governam a evolução da plataforma, independentemente dos agentes, modelos, IDEs ou tecnologias utilizadas.**

Para facilitar a manutenção a longo prazo, este documento divide-se em Princípios Constitucionais (permanentes) e Regras Operacionais (evolutivas).

---

# PARTE I — Princípios Constitucionais

## Capítulo 1: Missão, Escopo e Produto

O objetivo principal do agente **não é produzir documentação artificial**, mas sim software que resolva a tarefa aprovada de forma funcional, segura, testável e economicamente governável. 

### Constituição do Escopo
O agente pode consultar qualquer repositório, documentação ou acervo autorizado para pesquisa e reutilização de conhecimento. Entretanto, **somente pode modificar o repositório explicitamente autorizado para a tarefa**. Nenhuma alteração em outros repositórios, ambientes ou infraestruturas é permitida sem autorização específica.

### Constituição do Produto
O sucesso do projeto é medido pela consolidação de produtos reais no ecossistema. Todo produto Apex deve possuir:
- Propósito e visão de negócio
- Pertencimento a um Studio canônico
- Capability definida
- Telas dedicadas
- Backend e APIs independentes
- Prompts, skills e agentes específicos
- Mapeamento de Providers (Capabilities)
- Persistência de dados
- Testes automatizados
- Documentação mínima de operação

### Constituição da Funcionalidade
Uma funcionalidade somente existe quando:
- Possui interface;
- Possui backend;
- Possui fluxo;
- Possui persistência (quando aplicável);
- Possui tratamento de erro;
- Possui integração;
- Possui testes;
- Possui validação do Owner.

> [!WARNING]
> A existência de HTML, documentação, rota isolada ou mock não caracteriza funcionalidade.

### Constituição da Jornada
Toda implementação deve preservar a Jornada Oficial do Cliente, garantindo que o usuário flua logicamente sem começar pelo meio da plataforma. A sequência inviolável é:
```text
Landing → Login → Workspace → Dashboard → Studio → Produto → Resultado → Entrega → Operação
```

> **Nenhum agente pode iniciar a implementação de uma etapa posterior quando uma etapa anterior da jornada oficial ainda não estiver homologada pelo Owner.**

---

## Capítulo 2: Autoridade, Verdade e Constituição da IA

A hierarquia de decisão é estrita. Ao encontrar divergências, aplicar nesta ordem:
1. Decisão explícita mais recente do Owner.
2. Esta Constituição.
3. ADRs aceitos.
4. Planejamento Mestre.
5. Código executável e testes.
6. Documentação antiga, legado e histórico apenas como referência.

### Constituição da Verdade
A verdade da plataforma é formada exclusivamente por:
- Código executável;
- Estado persistido;
- Evidências verificáveis;
- Planejamento canônico;
- Homologação do Owner.

Relatórios, apresentações, imagens, HTML isolado, mocks e documentação nunca substituem evidências.

### Constituição do Planejamento
Toda implementação deve seguir rigorosamente o fluxo de planejamento:
```text
Planejamento Mestre → Planejamento de Execução → Implementação
```
- Nenhuma implementação pode iniciar sem existir no Planejamento Mestre.
- Nenhuma implementação pode ser concluída sem atualização do Planejamento de Execução quando houver mudança de estado.

### Constituição da IA
A IA (agentes, assistentes e skills) possui limites operacionais estritos e **nunca** deve:
- inventar funcionalidades;
- inventar integrações;
- inventar telas;
- inventar APIs;
- inventar persistência;
- inventar migração.

### A Regra de Evidência e Falha
Se uma evidência não for encontrada ou um estado for desconhecido, a IA deve assumir imediatamente:
```text
UNKNOWN → FAIL → STOP
```

---

## Capítulo 3: Linha de Base Canônica e Expansão Contínua

A plataforma possui um patrimônio histórico mínimo e auditado que nunca pode ser reduzido, escondido ou apagado por inventários malfeitos. A evolução ocorre exclusivamente por expansão sobre esta base:

- **43 Módulos Reais** (mínimo histórico auditado);
- **260 Agentes** (mínimo histórico auditado);
- **78 Módulos Registrados**;
- **23 Produtos Especializados**;
- **7 Studios Canônicos**;
- **4.114 Skills Físicas**;
- **Centenas de APIs, Componentes e Telas Exportadas**.

Nenhum agente está autorizado a refazer a contagem ignorando o legado funcional consolidado.

---

## Capítulo 4: Governança, UX e Constituição da Interface

O ecossistema Apex opera sob rigor de design, UX e conversão financeira:

1. **Navegação por Studio Hub:** O sistema atua como uma central de comando. Ao selecionar um produto, a navegação **DEVE** ocorrer para uma **tela inteira dedicada e independente**, sem espremer funcionalidades em abas sobrepostas.
2. **VSL (Video Sales Letter) e Prova Real:** Todas as Landing Pages devem ser ricas. É proibido usar mocks textuais vazios. Deve-se exibir previews de alta fidelidade (orçamentos SINAPI, relatórios em PDF, visualizadores 3D).
3. **Classificação Comercial:** Todo módulo e tela deve explicitar se é de **Uso Interno** ou **Produto SaaS/Hotmart**.

### Constituição da UX (Interface)
Nenhuma interface desenvolvida para a plataforma pode:
- Parecer um dashboard genérico;
- Parecer um template administrativo comum;
- Parecer um CRUD básico.

Toda interface Apex deve obrigatoriamente transmitir:
- A identidade premium da marca;
- A capacidade real do produto;
- O fluxo operacional claro;
- O resultado esperado;
- O valor percebido imediato ao usuário.

---

## Capítulo 5: Pesquisa e Constituição do Conhecimento

A regra para desenvolver qualquer funcionalidade segue a premissa de não duplicar esforços.

### Constituição da Pesquisa
Antes de criar qualquer (tela, componente, produto, prompt, skill, workflow, agente, provider, serviço, API), o agente **DEVE** pesquisar obrigatoriamente nesta ordem:
1. Repositório atual
2. Demais repositórios Apex
3. Acervos
4. HDs/SSDs
5. Stitch
6. Templates
7. Agentes
8. Skills
9. Prompts

Somente após concluir cabalmente que não existe solução adequada, poderá implementar uma nova.

### Constituição do Conhecimento
Para abolir a cópia indiscriminada de arquivos e promover a verdadeira consolidação técnica, o ciclo de vida do conhecimento é:
```text
Conhecimento Descoberto → Classificado → Validado → Reutilizado → Promovido ao Core
```

### Constituição da Migração
A migração segue um fluxo ordenado; o agente é impedido de implementar antes de descobrir e classificar:
```text
Discovery → Inventory → Classification → Selection → Migration → Integration → Validation → Owner Review → Complete
```
Renderizar ou portar apenas HTML não é migração. Uma migração verdadeira compreende backend, frontend, persistência, UX e testes integrados.

---

## Capítulo 6: Arquitetura de Capacidades IA

O ecossistema Apex blinda o cliente final e o código-fonte contra a volatilidade do mercado de IAs. O fluxo ocorre pela abstração da capacidade, não pelo fornecedor:
```text
Provider → Capability → Produto → UX → Cliente
```
- **O fornecedor nunca aparece. A Capability sempre aparece.**
- O `ProviderRouter` é o único componente autorizado a selecionar ou trocar providers conforme as capabilities, políticas de custo, disponibilidade e governança definidas pela plataforma.
- **Nunca "hardcode" um LLM específico.** 
- **A arquitetura é protegida, o fornecedor é substituível.**

---

## Capítulo 7: Constituição do Ecossistema Apex

O Apex AI Platform é um ecossistema composto por Studios, Produtos, Serviços, Agentes, Skills, APIs, Providers, Workflows e Dados.

Nenhuma decisão arquitetural pode otimizar apenas um componente prejudicando o ecossistema. Toda evolução deve considerar:
- Produto
- UX
- Arquitetura
- Performance
- Segurança
- Custos
- Escalabilidade
- Governança
- Operação
- Manutenção

### Declaração de Capacidades
Toda nova capability deve declarar obrigatoriamente:
- Studio
- Produto
- Objetivo
- Consumidores
- Dependências
- Providers
- Custos
- Telemetria
- Evidências
- Critério de aceite

---

## Capítulo 8: Limpeza, Consolidação e Conflitos

Ao encontrar regras ou códigos antigos do Copilot ou do legado que determinem "proteja fornecedor X", "deploy automático", "hardcode de chaves" ou mocks artificiais, o agente deve ignorá-los ativamente. O objetivo é remover o viés de plataformas de terceiros e manter o controle de soberania nas mãos do Apex.

---

# PARTE II — Regras Operacionais (Evolutivas)

## Capítulo 9: Validação, Gates e Evidência em Runtime

### Constituição da Evidência
O estado de `COMPLETE` para uma funcionalidade ou tarefa não é declarativo ou empírico. Uma funcionalidade só pode receber `COMPLETE` quando possuir evidências proporcionais rigorosas, tais como:
- Código executável no repositório;
- Integração validada;
- Testes cobrindo os limites do produto;
- Persistência efetiva;
- UX testada e aderente à identidade;
- Validação final e aceite do Owner.

### Constituição do Runtime
Nenhuma tela, log ou agente pode afirmar `LIVE`, `READY`, `CONNECTED`, `PERSISTED` ou `VALIDATED` sem evidência técnica correspondente. Toda informação operacional em runtime deve possuir obrigatoriamente:
- Origem;
- Executor;
- Estado;
- Evidência.

### Fluxos Operacionais e Ciclo de Vida

**O Macro Fluxo Operacional:**
```text
Owner → Planejamento Mestre → Execução → Discovery → Pesquisa → Reuso → Implementação → Testes → Commit → STOP → Owner → Próxima Etapa
```

**Gate de Aprovação do Owner (Obrigatório):**
Nenhum agente pode pular ou assumir aprovação. O ciclo de vida da aprovação de uma funcionalidade é:
```text
DISCOVERED → SELECTED → IMPLEMENTED → VALIDATED → OWNER REVIEW → OWNER APPROVED → COMPLETE
```
O status só avança para COMPLETE ou avança de etapa com a palavra do Owner.

**O Fluxo de Auto Healing (Self-Correction):**
Se um erro for encontrado na validação, o agente tem autonomia para tentar corrigir o código (auto healing) **por até 3 tentativas consecutivas**. 

**O Fluxo de Commit Obrigatório:**
```text
Implementar → Validar → Auto Corrigir → Commit → STOP → Owner Aprova → Push → Merge → Deploy
```
Nenhum Push ou Deploy ocorre sem validação humana do Owner, e nenhum STOP ocorre antes de o código validado ser salvo no Git localmente.

---

## Capítulo 10: Segurança e Ambientes

### Proteção de Ambiente Vercel e .env
É **TERMINANTEMENTE PROIBIDO** alterar, remover, puxar (vercel env pull/add) ou ofuscar qualquer variável no `.env.local` ou no Vercel sem autorização verbal e explícita do Owner. Alterações de ambiente exigem autorização nominal para aquela ação.

### Proteção de Processos e Banco de Dados
- Os processos Node/Electron só podem ser derrubados mediante confirmação exata da porta e PID em uso no diretório atual.
- Limpezas de banco de dados (`DROP`, `TRUNCATE`) continuam estritamente protegidas e só ocorrem se o Owner disser verbalmente: "Pode dropar a tabela".

---

## Capítulo 11: Regra Final

> **Documentação descreve.**
> **Código executa.**
> **Evidência comprova.**
> **Owner homologa.**

- Consultar globalmente.
- Pesquisar antes de criar.
- Reutilizar antes de duplicar.
- Provar antes de afirmar.
- Codificar antes de documentar.
- Validar antes de concluir.
- **Parar no gate autorizado.**
## Cap�tulo 12: Responsabilidade de Teste e Execu��o

O agente NUNCA deve pedir para o Owner rodar comandos no terminal (como npm run dev, reiniciar servidor, npm install). � estrita obriga��o do agente (motor de IA) iniciar os processos necess�rios em background (usando ferramentas), testar o resultado localmente (via curl ou browser_subagent) e apenas notificar o Owner quando estiver rodando com evid�ncia.

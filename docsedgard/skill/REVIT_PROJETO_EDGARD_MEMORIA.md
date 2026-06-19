# Memoria do Projeto Edgard Automatico

Objetivo: transformar o Revit em uma linha de producao de projeto, onde Edgard desenha e personaliza a planta, e o sistema automatiza configuracao, documentacao, apresentacao, quantitativos, exportacao e integracao com plataforma.

## Template Principal

Arquivo base: `D:\Revit\codex\templates\principal.rte`

Base desejada:
- parecido com o template comprado do Castanhari/Jedi;
- usando filtros;
- com padrao Edgard proprio;
- organizado por etapas da obra;
- com vistas, folhas, tabelas, legendas e familias prontas para uso.

Status em 2026-05-27:
- Revit ativo com documento `principal`;
- criadas e salvas pranchas base A01 a A06 sem carimbo, para deixar escolha/importacao/limpeza de carimbo para o final;
- posicionadas 14 vistas principais nas pranchas:
  - A01: SITUACAO;
  - A02: PLANTA BAIXA TERREO, PLANTA BAIXA 2 PAVIMENTO;
  - A03: TERREO PLANTA HUMANIZADA, 2 PAVIMENTO PLANTA HUMANIZADA;
  - A04: ELEVACAO FRONTAL, ELEVACAO POSTERIOR, ELEVACAO ESQUERDA, ELEVACAO DIREITA;
  - A05: CALCULO DE AREAS TERREO, CALCULO DE AREAS 2 PAVIMENTO;
  - A06: {3D}, TERREO - PONTOS ELETRICOS, TERREO - PONTOS HIDRAULICOS;
- aplicados templates EDGARD nas vistas principais;
- criados templates complementares:
  - EDGARD - ANOTACOES PRINCIPAIS;
  - EDGARD - COTAS;
  - EDGARD - AMBIENTES;
  - EDGARD - MOBILIARIO;
- criadas vistas base de legenda:
  - LEGENDA - SIMBOLOS E ANOTACOES;
  - LEGENDA - PAREDES E ACABAMENTOS;
  - LEGENDA - ESQUADRIAS;
  - LEGENDA - ELETRICA;
  - LEGENDA - HIDRAULICA;
  - LEGENDA - MATERIAIS;
- criadas tabelas EDGARD iniciais:
  - EDGARD - AREAS POR PAVIMENTO;
  - EDGARD - PAREDES QUANTITATIVO;
  - EDGARD - PISOS QUANTITATIVO;
  - EDGARD - TELHADOS QUANTITATIVO;
  - EDGARD - PORTAS QUANTITATIVO;
  - EDGARD - JANELAS QUANTITATIVO;
  - EDGARD - PILARES QUANTITATIVO;
  - EDGARD - VIGAS QUANTITATIVO.

Observacao:
- tabelas de quantitativo foram criadas como base inicial e ainda precisam de refinamento de campos, formulas e validacao dos insumos;
- exclusao de familias, limpeza pesada e carimbo definitivo ficaram para o final, conforme combinado.

Status checklist em 2026-05-27:
- [feito] Filtros configurados de verdade:
  - templates EDGARD receberam filtros por disciplina;
  - `_Remover` ficou oculto nos templates EDGARD;
  - filtros de paredes, lajes, fases/deslocamento, transparencia, niveis auxiliares e mobiliario foram aplicados conforme o uso de cada template;
  - aplicados overrides basicos de cor, halftone e transparencia;
  - configuradas opcoes de exibicao grafica nos templates EDGARD:
    - arquitetura, planta baixa, estrutura, eletrica, hidraulica, ambientes, anotacoes e cotas em `Hidden Line/HLR` com detalhe fino;
    - planta humanizada em `RealisticWithEdges` com detalhe fino;
    - mobiliario em `ShadingWithEdges` com detalhe fino;
    - disciplinas ajustadas para arquitetura, estrutura e coordenacao conforme o template;
  - vistas 3D de percurso e estudo solar configuradas diretamente em `RealisticWithEdges` com detalhe fino;
  - usuario pediu para liberar a opcao manual de exibicao grafica nas vistas;
  - liberados nos templates EDGARD os controles:
    - Exibir modelo;
    - Exibicao do modelo;
    - Sombras;
    - Linhas de esboco;
    - Iluminacao;
    - Exposicao fotografica;
  - assim as vistas continuam com templates EDGARD, mas a janela/opcoes de exibicao grafica podem ser ajustadas manualmente por vista.
  - arquivo `principal.rte` salvo apos a configuracao.
- [feito] Conteudo das legendas:
  - preenchidas as vistas `LEGENDA - SIMBOLOS E ANOTACOES`, `LEGENDA - PAREDES E ACABAMENTOS`, `LEGENDA - ESQUADRIAS`, `LEGENDA - ELETRICA`, `LEGENDA - HIDRAULICA` e `LEGENDA - MATERIAIS`;
  - cada legenda recebeu texto base com grupos e itens principais;
  - conteudo criado como base textual, ainda podendo ser substituido por simbolos graficos e familias definitivas;
  - arquivo `principal.rte` salvo apos a configuracao.
- [feito/parcial] Tabelas com formulas de insumos:
  - criado arquivo de parametros compartilhados `D:\Revit\codex\edgard_shared_parameters.txt`;
  - criados 15 parametros EDGARD de saida de insumos:
    - EDGARD_CONCRETO_M3;
    - EDGARD_CIMENTO_SACOS;
    - EDGARD_AREIA_M3;
    - EDGARD_AREIA_CAMINHAO_12M3;
    - EDGARD_PEDRA_M3;
    - EDGARD_PEDRA_CAMINHAO_12M3;
    - EDGARD_PLASTIFICANTE_BALDE_18L;
    - EDGARD_BLOCO_6F_19X11_5X24_UN;
    - EDGARD_REBOCO_M2;
    - EDGARD_FERRAGEM_KG;
    - EDGARD_MASSA_CORRIDA_LATA;
    - EDGARD_TINTA_LATA;
    - EDGARD_LAJE_M3;
    - EDGARD_MADEIRAMENTO_M3;
    - EDGARD_TELHAS_UN;
  - parametros adicionados nas tabelas EDGARD de paredes, pisos, telhados, pilares e vigas;
  - criada vista `EDGARD - FORMULAS DE INSUMOS` com formulas base e constantes;
  - observacao tecnica: a API/ponte atual nao permitiu gravar campo calculado nativo do Revit diretamente. A solucao adotada foi preparar campos de saida para serem preenchidos por automacao pyRevit, que sera feita no item de automacoes.
  - arquivo `principal.rte` salvo apos a configuracao.
- [feito/parcial] Paredes/telhados parametrizados:
  - criados parametros de configuracao por tipo para paredes e telhados:
    - EDGARD_QTO_USAR;
    - EDGARD_QTO_CLASSE;
    - EDGARD_QTO_SISTEMA;
    - EDGARD_QTO_OBSERVACAO;
    - EDGARD_QTO_LADOS_REBOCO;
    - EDGARD_QTO_BLOCO_6F_UN_M2;
    - EDGARD_QTO_FATOR_PERDA_BLOCO;
    - EDGARD_QTO_MASSA_CORRIDA_DEMAOS;
    - EDGARD_QTO_TINTA_DEMAOS;
    - EDGARD_QTO_TELHA_UN_M2;
    - EDGARD_QTO_FATOR_PERDA_TELHA;
    - EDGARD_QTO_MADEIRA_M3_M2;
  - parametros adicionados nas tabelas `EDGARD - PAREDES QUANTITATIVO` e `EDGARD - TELHADOS QUANTITATIVO`;
  - 35 tipos de parede auditados/classificados:
    - 12 ALVENARIA / BLOCO;
    - 1 DIVISORIA / DRYWALL;
    - 21 PAREDE CORTINA;
    - 1 parede empilhada sem sistema direto (`---`), revisar manualmente se precisar;
  - 27 tipos de telhado auditados/classificados:
    - 18 MADEIRAMENTO;
    - 3 TELHAMENTO;
    - 4 FORRO / LAJE;
    - 2 VIDRACA INCLINADA;
  - defaults aplicados para bloco 6 furos, lados de reboco, perdas, telha/m2 e madeira/m2 como base de trabalho;
  - observacao: consumos ainda precisam validacao antes de orcamento final;
  - arquivo `principal.rte` salvo apos a configuracao.
- [feito/parcial] Planta humanizada visualmente ajustada:
  - template `EDGARD - PLANTA HUMANIZADA` ajustado para `RealisticWithEdges`;
  - detalhe fino, disciplina arquitetura e escala 1:50 configurados no template;
  - vistas `TERREO PLANTA HUMANIZADA` e `2 PAVIMENTO PLANTA HUMANIZADA` mantidas vinculadas ao template;
  - crop ativado e oculto nas vistas humanizadas;
  - observacao: ajuste final visual depende de materiais/texturas/familias e deve ser conferido em vista aberta no Revit.
- [feito/parcial] Cortes automaticos:
  - criados 4 cortes base:
    - CORTE A-A - LONGITUDINAL EDGARD;
    - CORTE B-B - TRANSVERSAL EDGARD;
    - CORTE C-C - LONGITUDINAL 2 EDGARD;
    - CORTE D-D - TRANSVERSAL 2 EDGARD;
  - cortes criados com caixa ampla ao redor da origem para servir como padrao inicial;
  - aplicado template `EDGARD - ARQUITETURA`;
  - criada prancha `A07 - CORTES` sem carimbo;
  - 4 cortes posicionados na prancha A07;
  - observacao: automacao pyRevit futura devera reposicionar/ajustar os cortes automaticamente conforme o tamanho real do projeto.
- [feito/parcial] Percurso animado:
  - a API/ponte atual nao expos criacao direta de walkthrough nativo;
  - criadas 4 cameras 3D perspectivadas como base de percurso:
    - PERCURSO 01 - ENTRADA EDGARD;
    - PERCURSO 02 - SALA / SOCIAL EDGARD;
    - PERCURSO 03 - LATERAL EDGARD;
    - PERCURSO 04 - AEREA FINAL EDGARD;
  - cameras ajustadas para `RealisticWithEdges`, detalhe fino e crop oculto;
  - criada prancha `A08 - PERCURSO ANIMADO / CAMERAS 3D` sem carimbo;
  - 4 cameras posicionadas na prancha A08;
  - criada vista `EDGARD - ROTEIRO PERCURSO ANIMADO` com sequencia do percurso;
  - observacao: automacao pyRevit futura deve ajustar caminho/cameras conforme tamanho real do projeto e exportar imagens/video.
- [feito/parcial] Estudo solar:
  - criadas 4 vistas 3D/cameras para estudo solar:
    - SOLAR 01 - MANHA 09H EDGARD;
    - SOLAR 02 - MEIO DIA 12H EDGARD;
    - SOLAR 03 - TARDE 15H EDGARD;
    - SOLAR 04 - ESTUDO DIA TODO EDGARD;
  - configuradas em `RealisticWithEdges`, detalhe fino e crop oculto;
  - horarios solares validados para 21/06/2026:
    - 09:00;
    - 12:00;
    - 15:00;
    - estudo de dia inteiro das 09:00 as 17:00;
  - criada prancha `A09 - ESTUDO SOLAR` sem carimbo;
  - vistas solares posicionadas na prancha A09;
  - criada vista `EDGARD - ROTEIRO ESTUDO SOLAR` com checklist de localizacao, norte verdadeiro, datas e exportacao;
  - observacao: antes de entregar ao cliente, conferir localizacao real do projeto, norte verdadeiro e sombras com terreno/vizinhos.
- [em andamento] Automacoes pyRevit:
  - criado botao pyRevit `Atualizar Insumos` em:
    - `D:\Revit\codex\BIM Coder.extension\PluginAula.tab\Materiais.panel\Atualizar Insumos.pushbutton\script.py`;
  - funcao do botao:
    - processar paredes, pisos/lajes, telhados, pilares e vigas;
    - preencher parametros EDGARD de concreto, cimento, areia, caminhao de areia, pedra, caminhao de pedra, plastificante, blocos, reboco, ferragem, massa corrida, tinta, laje, madeiramento e telhas;
    - usar coeficientes-base editaveis dentro do script;
    - nao excluir familias, materiais, vistas ou tabelas;
  - validacao realizada:
    - sintaxe do script conferida sem gerar `__pycache__`;
    - verificacao somente leitura no Revit confirmou que o template `principal` esta sem instancias de paredes/pisos/telhados/pilares/vigas no momento, entao o calculo deve ser testado depois em projeto com elementos modelados.
  - criado botao pyRevit `Preparar Projeto` em:
    - `D:\Revit\codex\BIM Coder.extension\PluginAula.tab\Materiais.panel\Preparar Projeto.pushbutton\script.py`;
  - funcao do botao:
    - conferir/criar pranchas A01 a A09 sem alterar carimbo;
    - conferir/criar vistas principais;
    - aplicar templates EDGARD nas vistas quando existirem;
    - conferir/criar cortes base;
    - conferir/criar cameras 3D de percurso;
    - configurar estudo solar 09h, 12h, 15h e dia inteiro;
    - criar/conferir roteiros de percurso e estudo solar;
    - posicionar vistas nas pranchas quando ainda nao estiverem colocadas;
    - nao excluir familias, materiais, vistas ou carimbos.
  - validacao realizada:
    - sintaxe do script conferida;
    - templates EDGARD encontrados no Revit: arquitetura, planta baixa padrao, planta humanizada, ambientes, eletrica e hidraulica.
  - criado botao pyRevit `Gerar Planta Humanizada` em:
    - `D:\Revit\codex\BIM Coder.extension\PluginAula.tab\Materiais.panel\Gerar Planta Humanizada.pushbutton\script.py`;
  - funcao do botao:
    - criar/conferir `TERREO PLANTA HUMANIZADA` e `2 PAVIMENTO PLANTA HUMANIZADA`;
    - duplicar plantas baixas existentes quando precisar criar a vista;
    - aplicar template `EDGARD - PLANTA HUMANIZADA`;
    - ajustar visual para realista com arestas, detalhe fino, escala 1:50 e crop oculto quando a API permitir;
    - conferir/criar prancha `A03 - PLANTAS HUMANIZADAS`;
    - posicionar as plantas humanizadas na A03 quando ainda nao estiverem colocadas;
    - criar/conferir `EDGARD - ROTEIRO PLANTA HUMANIZADA`;
    - nao excluir familias, materiais, vistas ou carimbos.
  - validacao realizada:
    - sintaxe do script conferida.
  - criado botao pyRevit `Exportar Pranchas PDF` em:
    - `D:\Revit\codex\BIM Coder.extension\PluginAula.tab\Materiais.panel\Exportar Pranchas PDF.pushbutton\script.py`;
  - funcao do botao:
    - listar pranchas com numeracao iniciada por `A`;
    - permitir selecionar as pranchas a exportar;
    - permitir escolher pasta de saida;
    - exportar em PDF unico combinado ou um PDF por prancha;
    - usar exportacao PDF nativa do Revit;
    - nao alterar familias, materiais, vistas ou carimbos.
  - validacao realizada:
    - sintaxe do script conferida;
    - Revit `principal` confirmou suporte a `PDFExportOptions`, `ExportPaperFormat` e `ZoomType`.
  - criado botao pyRevit `Gerar Estudo Solar` em:
    - `D:\Revit\codex\BIM Coder.extension\PluginAula.tab\Materiais.panel\Gerar Estudo Solar.pushbutton\script.py`;
  - funcao do botao:
    - criar/conferir as vistas `SOLAR 01 - MANHA 09H EDGARD`, `SOLAR 02 - MEIO DIA 12H EDGARD`, `SOLAR 03 - TARDE 15H EDGARD` e `SOLAR 04 - ESTUDO DIA TODO EDGARD`;
    - configurar 21/06/2026 as 09h, 12h, 15h e estudo 09h-17h;
    - aplicar visual realista com arestas, detalhe fino e crop oculto;
    - criar/conferir prancha `A09 - ESTUDO SOLAR`;
    - posicionar as vistas solares na A09 quando ainda nao estiverem colocadas;
    - criar/conferir `EDGARD - ROTEIRO ESTUDO SOLAR`;
    - nao excluir familias, materiais, vistas ou carimbos.
  - validacao realizada:
    - sintaxe do script conferida.
  - criado botao pyRevit `Gerar Cortes` em:
    - `D:\Revit\codex\BIM Coder.extension\PluginAula.tab\Materiais.panel\Gerar Cortes.pushbutton\script.py`;
  - funcao do botao:
    - criar/conferir os cortes `CORTE A-A - LONGITUDINAL EDGARD`, `CORTE B-B - TRANSVERSAL EDGARD`, `CORTE C-C - LONGITUDINAL 2 EDGARD` e `CORTE D-D - TRANSVERSAL 2 EDGARD`;
    - aplicar template `EDGARD - ARQUITETURA`;
    - criar/conferir prancha `A07 - CORTES`;
    - posicionar os cortes na A07 quando ainda nao estiverem colocados;
    - criar/conferir `EDGARD - ROTEIRO CORTES`;
    - nao excluir familias, materiais, vistas ou carimbos.
  - validacao realizada:
    - sintaxe do script conferida.
- [feito/parcial] Carimbo Edgard definitivo:
  - usuario criou/salvou uma prancha modelo `A10 - Nao nomeada`;
  - a A10 foi usada como referencia de apresentacao/impressao;
  - carimbo encontrado na A10:
    - familia original: `A1 metrico_ABNT- Sydor`;
    - tipo original: `A1 metrico_ABNT- Sydor`;
  - tipo do carimbo renomeado para `A1metricoEdgard`;
  - carimbo `A1metricoEdgard` aplicado nas pranchas A01 a A09;
  - verificacao confirmou A01 a A10 com o mesmo tipo `A1metricoEdgard`;
  - arquivo `principal.rte` salvo apos aplicacao;
  - observacao: ainda falta o usuario conferir visualmente/imprimir uma folha teste antes de considerar 100% definitivo.
- [pendente] Limpeza final com aprovacao.

## Padrao De Pranchas

- A01 - Implantacao / Situacao
- A02 - Plantas Baixas
- A03 - Plantas Humanizadas
- A04 - Fachadas
- A05 - Areas
- A06 - Estrutural / Hidraulica / Eletrica / 3D

Carimbo desejado: Edgard.

## Templates De Vista

Criar/configurar templates para:
- arquitetura;
- estrutura;
- eletrica;
- hidraulica;
- planta baixa padrao;
- planta humanizada;
- anotacoes principais;
- cotas;
- ambientes;
- mobiliario;
- vista combinada arq/est/ele/hid.

## Automacoes Revit/PyRevit

Criar botoes ou rotinas para:
- Preparar Projeto;
- Gerar Pranchas;
- Gerar Planta Humanizada;
- Gerar Cortes e Fachadas;
- Gerar 3D e Percurso;
- Gerar Estudo Solar;
- Gerar Quantitativos;
- Exportar Pacote;
- Gerar Memorial e Contrato.

## Planta Humanizada E Apresentacao

Desejo:
- ao desenhar a primeira planta terreo, a planta humanizada ja ficar com visual bonito;
- usar modo realista, materiais, sombras, estilos graficos e familias prontas;
- evitar render pesado dentro do Revit;
- exportar imagens automaticamente para IA/render externo quando necessario.

## Norte Verdadeiro E Estudo Solar

Automatizar:
- configuracao de norte verdadeiro;
- norte do projeto quando necessario;
- estudo solar;
- vistas solares padrao;
- imagens para analise/apresentacao.

## Cortes, Fachadas, 3D E Percursos

Automatizar:
- cortes padrao de arquitetura;
- fachadas frontal, posterior, esquerda e direita;
- vistas 3D padrao;
- 3D estrutural;
- 3D por ambiente ou por projeto;
- percursos animados/caminhamentos automaticos.

## Quantitativos E Tabelas

Criar tabela de areas:
- area quadrada por pavimento;
- Planta Calculo de Area terreo;
- Planta Calculo de Area 2 pavimento;
- outros pavimentos se existirem.

Criar tabela geral de materiais brutos e insumos:
- ferragem de alicerce;
- ferragem de colunas e vigas;
- concreto para alicerce e vigas baldrame;
- cimento por saco;
- areia por m3 e por caminhao de 12 m3;
- pedra por m3 e por caminhao;
- plastificante/liquido de liga por balde de 18 litros;
- reboco com cimento, areia e plastificante;
- blocos de 6 furos 19 x 11,5 x 24;
- outros tipos de bloco;
- massa corrida por lata;
- tinta por lata;
- laje em m3;
- madeiramento conforme telhado;
- telhas;
- estrutura metalica;
- steel frame;
- outros insumos que forem lembrados.

Antes de finalizar tabelas, perguntar ao usuario se falta algum item.

## Familias, Materiais, Paredes E Telhados

Revisar:
- familias com nome mas sem imagem/preview;
- materiais sem imagem/textura/aparencia;
- tentar associar imagem correta quando fizer sentido;
- marcar para exclusao o que nao servir;
- configurar tipos de parede para alimentar quantitativos;
- configurar tipos de telhado para alimentar quantitativos.

## BIM Coder Extension

Pasta analisada: `D:\Revit\codex\BIM Coder.extension`

Scripts uteis encontrados:
- Criar Vistas 2D e 3D por ambiente;
- Modelar Pisos Automatico;
- Modelar Familias no centro dos ambientes;
- Colorir Familias por Tipo;
- Snippets de geometria de paredes para futuras cotas automaticas.

Nao foram encontrados arquivos `.dyn` nessa pasta. Ela parece ser uma extensao pyRevit com scripts Python.

## Estrategia

Template guarda padrao fixo:
- filtros;
- templates de vista;
- materiais;
- paredes;
- telhados;
- folhas;
- tabelas;
- legendas.

Botoes pyRevit fazem acoes repetitivas:
- cotar;
- criar vistas;
- conferir familias;
- gerar tabelas;
- revisar materiais;
- organizar pranchas;
- exportar pacote;
- gerar documentacao.

Dynamo fica como apoio/prototipo. Se o fluxo ficar bom, transformar em pyRevit.

## Plataforma Em Paralelo

O usuario esta trabalhando em uma plataforma em paralelo usando:
- GitHub;
- Supabase;
- Vercel.

Repositorio analisado:
- `https://github.com/jedgard70/AI-Construction-Intelligence-Platform`
- copia local oficial em `D:\AI-constr\AI-Construction-Intelligence-Platform`
- pasta principal de trabalho e observacoes da plataforma: `D:\AI-constr`
- nao usar copias em `D:\AI Jedgard` para a plataforma; esta pasta deve ficar apenas como apoio temporario quando necessario.

Ideia futura:
- Revit exporta dados, imagens, PDFs, tabelas e modelo;
- plataforma recebe o produto pronto;
- IA/render externo melhora imagens;
- plataforma gera projeto, proposta, contrato, memoriais e documentacao.

Direcao desejada da plataforma:
- hoje muitos agentes analisam e retornam texto;
- transformar cada botao/agente em uma janela de IA operacional;
- a janela deve analisar, conversar, propor acoes, gerar artefatos e modificar dados aprovados;
- depois de importar/validar um arquivo, gerar toda a sequencia automaticamente;
- incluir fluxo para clash no 3D, RFI, correcao guiada, documentacao, memorial, contrato e pacote final.

Pontos encontrados no repositorio:
- `pages/plantas.js`: analise de planta com achados, chat e upload de PDF/imagem.
- `pages/bim-3d.tsx`: viewer Three.js/WebIFC com painel de analise BIM.
- `pages/bim-ops.tsx`: centro de BIM operations, clash, upload, quantitativos, relatorios e botoes de IA.
- `pages/api/chat.js`: proxy principal para modelo Anthropic.
- `pages/api/agents/orchestrator.ts`: orquestrador multiagente por grafo.
- `pages/api/actions/execute.ts`: camada de execucao de acoes com dry-run, auditoria e aprovacao humana.
- `pages/api/digital-twin/state.ts`: estado/simulacao de digital twin em memoria.
- `pages/api/agent-loop.ts`: loop autonomo para tarefas, alertas e monitoramento via Supabase.
- `pages/api/plantas/analisar.js`: agente BIM_Coordinator_AI para achados estruturados.
- `pages/api/plantas/memorial.js`: geracao de memorial descritivo a partir de planta/achados.

Arquitetura recomendada para a plataforma:
- criar componente reutilizavel `AgentWindow`;
- criar um registro unico de agentes com capacidades;
- cada agente deve ter modos: analisar, gerar, modificar, exportar;
- respostas devem poder retornar `message`, `artifacts`, `findings` e `actions`;
- toda acao modificadora deve passar por preview/dry-run e aprovacao quando tiver risco;
- usar `/api/actions/execute` como motor de execucao, mas expandir para Supabase, documentos, RFI e revisoes BIM;
- persistir conversas, achados, acoes e artefatos no Supabase por projeto.

Nota de prioridade do usuario em 2026-05-26:
- nao mexer mais na plataforma por enquanto;
- guardar ideias e guiar depois;
- terminar primeiro o trabalho do Revit/template principal;
- depois voltar para a plataforma com calma.

Mudanca desejada na plataforma para depois:
- hoje existem entradas separadas de arquivo em documentos, plantas e BIM;
- transformar tudo em uma unica entrada/importacao de arquivo;
- a partir dessa entrada unica, a plataforma decide o fluxo: planta, documento, BIM/3D, memoriais, contrato, quantitativos, clash, RFI e exportacao;
- evitar o usuario ter que enviar o mesmo arquivo em tres lugares diferentes.

Arquivo de auditoria indicado pelo usuario para consultar depois:
- `D:\AI-constr\AI-Construction-Intelligence-Platform\docs\IMPLEMENTATION_AUDIT.md`

Status validado pelo usuario em 2026-05-26:
- Sprint 0 — Governanca: concluida.
- Sprint 1A — Projeto real: validada em `/projeto/[id]`.
- Sprint 1B — Cliente real: validada em `/cliente/[id]`.
- Supabase/RLS: corrigido para o fluxo testado.
- Producao: READY para essas rotas.
- `/cliente/[id]` provou leitura real da tabela `clients`, UUID real, sem demo/localStorage, com `created_by`, `created_at` e `updated_at` vindos do banco.
- Cliente testado:
  - id: `a1443265-5722-4e77-b327-422f8e4a7b93`
  - nome: `teste novo Comendador, Embaixador Dr Edgard De Oliveira`
  - URL: `https://ai-construction-intelligence-platfo.vercel.app/cliente/a1443265-5722-4e77-b327-422f8e4a7b93`
- Proximo passo natural da plataforma, quando voltar a ela: Sprint 1C — Dashboard real.
- Sprint 1C objetivo:
  - listar clientes reais;
  - listar projetos reais;
  - clicar no cliente e abrir `/cliente/[id]`;
  - clicar no projeto e abrir `/projeto/[id]`;
  - transformar dados reais em ERP navegavel real.

## Como Continuar Em Outro Chat

Ao abrir novo chat, informar:

`Leia o arquivo D:\AI Jedgard\REVIT_PROJETO_EDGARD_MEMORIA.md e continue o Projeto Edgard Automatico no Revit.`

Se necessario, tambem informar:

`O template principal fica em D:\Revit\codex\templates\principal.rte.`

## Fila Depois Do Revit: Ebook E Marketing

Prioridade definida pelo usuario:
- terminar primeiro a sequencia do Revit/template principal;
- deixar a exclusao, carimbo e limpeza pesada para o final do Revit;
- depois entrar no plano de marketing e venda do ebook.

Arquivo base do ebook:
- `D:\ebook\Ebook Guia Imoveis\Ebook\Seu Imovel sem Arrependimento.pdf`

Trabalho solicitado para o ebook:
- melhorar a pagina da Hotmart;
- criar HTML de pagina de vendas;
- criar copy completa da pagina de vendas;
- montar checklist personalizado para o caso do usuario;
- calcular custo total de cada opcao de venda/funil com base no preco e volume de vendas;
- comparar Hotmart, Kiwify e Systeme.io quando necessario;
- gerar guia em Word ou PDF para consulta offline;
- preparar divulgacao com Instagram, WhatsApp, videos curtos e possivel trafego pago.

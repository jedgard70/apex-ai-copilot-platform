# ArchVis — Discovery Report

**Status:** localizado; não migrado.

**Modo:** somente leitura sobre o patrimônio legado. Nenhum repositório de
origem foi alterado e nenhum segredo foi registrado.

## Resultado executivo

**Encontrei o ArchVis.** Ele existe como um conjunto de aplicações, APIs,
bibliotecas de prompts, workflows e persistência. A RFC correta não é
`Implementar Humanização`; é:

> Localizar e migrar o ArchVis existente para o Runtime do Apex OS.

Não há evidência de que ele esteja migrado para o Apex OS. O runtime atual do
Apex OS possui uma rasterização local própria, mas ela não é integração do
ArchVis legado.

## Fontes primárias

### AI-PLATAFORM — implementação ArchVis mais completa

Repositório: `D:\AI-PLATAFORM\AI-Construction-Intelligence-Platform`

Frontend:

- `pages/archvis.tsx` — dashboard, projetos, criação, análise de projeto,
  geração de imagens, galeria, editor e materiais.
- `archvis-pro/app/page.tsx` — workstation dashboard.
- `archvis-pro/app/editor/page.tsx` — viewport, preview, timeline, ambiente,
  câmera e qualidade.
- `archvis-pro/app/gallery/page.tsx` — galeria.
- `archvis-pro/app/materials/page.tsx` — biblioteca de materiais.
- `archvis-pro/app/login/page.tsx` e `archvis-pro/components/navigation.tsx`.

Backend:

- `pages/api/archvis/generate-image.ts` — geração real; FAL primário e rota
  alternativa configurada por `AI_GATEWAY_API_KEY`.
- `pages/api/archvis/status.ts` — status de provider e endpoints.
- `pages/api/archvis/prompts.ts` — presets.
- `pages/api/archvis/generate-brief.ts` — brief arquitetônico.
- `pages/api/director-cut/render.ts` — integração imagem → vídeo/DirectCut.

Domínio:

- `lib/archvis/prompts.ts` — dez templates de fachada, render, refinamento,
  iluminação noturna, paisagismo, vídeo e prancha A1.
- `lib/archvis/guided-flow.ts` — seis estilos, campos e construtor de prompt.
- `lib/archvis/a1-template.ts` — pacote/render com prancha A1.
- `docs/PR_ARCHVIS_AI_FOUNDATION.md`;
- `docs/PR_ARCHVIS_GUIDED_FLOW.md`;
- `docs/PR_ARCHVIS_PROMPT_LIBRARY.md`;
- `docs/PR_ARCHVIS_A1_COMMERCIAL_PACKAGE.md`;
- `docs/ARCHVIS_AI_OPERATING_SYSTEM.md`.

Persistência:

- `supabase/migrations/20260602141910_qa_real_003_archvis_rls_hardening.sql`;
- `pages/archvis.tsx` usa `archvis_projects` e `archvis_renders`.

Dependências observadas em `package.json`: Next/React/TypeScript, cliente FAL,
Supabase, Tailwind, Lucide, Recharts, Three.js e web-ifc.

### Apex AI Copilot Platform — implementação integrada

Repositório: `D:\AI-constr\apex-ai-copilot-platform`

Frontend e integração:

- `src/components/ArchVisPanel.tsx` — upload/contexto, estilos, presets,
  prompt editável, geração, galeria e envio ao DirectCut.
- `src/components/MainPanelsRouter.tsx` — rota `archvis`.
- `src/components/AppLayout.tsx` — entrada `ArchVis Studio`.
- `src/main.tsx` — estado, callbacks e contexto do Copilot.
- `src/styles.css` — estilos do ArchVis.

Backend e domínio:

- `api/copilot/generate-image.mjs` — geração, preservação de layout,
  restrições, modos e tipos de saída.
- `api/v1/apex/images/generate.mjs` — wrapper do conector de imagem.
- `server/agent/imageGenerationConnector.mjs` — classificação de intenção e
  construção de prompt.
- `api/prompts/index.mjs` — presets por módulo.
- `src/lib/archvisPromptLibrary.ts` — estilos, câmera, prompts e negativos.
- `src/lib/CopilotEngine.ts` — reconhecimento de intenção ArchVis.
- `src/lib/projectWorkspace.ts` — outputs, imagens e studio ativo.
- `src/lib/generationHistory.ts` e `src/lib/exportCenter.ts`.

Persistência e contratos:

- `scripts/validate-supabase-sql.mjs` referencia
  `archvis_sessions`, `archvis_outputs`, `archvis_prompts`,
  `archvis_revision_constraints`, `archvis_gallery_items` e o bucket
  `archvis-images`.

Conhecimento:

- `.agents/skills/apex-ai-copilot/references/archvis-production.md`;
- referências de render e humanização nas skills do Copilot;
- datasets de treinamento relacionados à geração visual.

### Apex Marketing Squads — conhecimento

Repositório: `D:\apex-marketing-squads`

Foram localizados `.agents/skills/apex-copilot-construction-intelligence/references/archvis.md`
e `3d-render-studio`. Nesta investigação não foi localizada uma aplicação
ArchVis completa nesse repositório. Classificação: conhecimento/skill de apoio.

### Stitch e referências visuais

- `D:\AI-constr\stitch_apex_intelligence_design_system` contém HTMLs e telas,
  incluindo `archvis_pro_direct_cut_studio_apex_global`.
- `D:\AI-PLATAFORM\AI-Construction-Intelligence-Platform\stitch_apex_intelligence_design_constrution`
  contém cópia do conjunto visual do ACIP.
- `D:\AI-PLATAFORM\AI-Construction-Intelligence-Platform\archvis-pro` é uma
  implementação Next/React visualmente alinhada ao pacote.

Essas fontes comprovam UI e referência de design, não backend operacional.

## Matriz de capacidade

| Capacidade | Evidência encontrada | Classificação |
|---|---|---|
| Dashboard de workstation | `archvis-pro/app/page.tsx`, `pages/archvis.tsx` | UI implementada |
| Projetos ArchVis | `pages/archvis.tsx`, `archvis_projects` | Implementação parcial |
| Editor/viewport | `archvis-pro/app/editor/page.tsx`, `ArchVisPanel.tsx` | UI; validar operação |
| Galeria | `archvis-pro/app/gallery/page.tsx`, `archvis_renders` | Implementação parcial |
| Biblioteca de materiais | `archvis-pro/app/materials/page.tsx` | UI/protótipo a validar |
| Upload de imagem | `ArchVisPanel.tsx` e file intake | Implementação integrada |
| Humanização de planta | prompts, constraints e endpoint de imagem | Backend a validar |
| Fachada/interior | presets e estilos ArchVis | Implementação parcial |
| Prompt engineering | `lib/archvis/prompts.ts`, `archvisPromptLibrary.ts` | Biblioteca existente |
| Brief profissional | `guided-flow.ts`, `generate-brief.ts` | Implementação encontrada |
| Prancha A1 | `a1-template.ts` e documentação A1 | Template; validar execução |
| Geração de imagem | endpoints FAL no ACIP e Copilot | Implementação duplicada |
| Revisões do usuário | `revisionConstraints` e negativos | Implementação parcial |
| Envio para vídeo | callback ArchVis → DirectCut | Integração candidata |
| Persistência | Supabase `archvis_*` e workspace | Implementação parcial |

## Melhor candidato de migração

Não existe um único vencedor para todos os aspectos.

### Comportamento e runtime visual

O conjunto mais maduro para comportamento é:

- `D:\AI-constr\apex-ai-copilot-platform\src\components\ArchVisPanel.tsx`;
- `D:\AI-constr\apex-ai-copilot-platform\api\copilot\generate-image.mjs`;
- `D:\AI-constr\apex-ai-copilot-platform\src\lib\archvisPromptLibrary.ts`;
- `D:\AI-constr\apex-ai-copilot-platform\src\lib\projectWorkspace.ts`.

Ele já participa do produto Copilot, recebe contexto de arquivo, mantém
restrições de revisão e possui ligação com DirectCut.

### UX e experiência

O candidato visual é:

- projeto Stitch aprovado;
- `D:\AI-PLATAFORM\AI-Construction-Intelligence-Platform\archvis-pro`;
- `D:\AI-PLATAFORM\AI-Construction-Intelligence-Platform\pages\archvis.tsx`.

O `archvis-pro` tem hierarquia de produto mais completa, mas vários controles do
editor aparentam ser demonstrativos. É UI aprovada a ser conectada, não prova de
execução real.

### Conhecimento e prompts

Consolidar, sem copiar automaticamente:

- `lib/archvis/prompts.ts`;
- `lib/archvis/guided-flow.ts`;
- `lib/archvis/a1-template.ts`;
- `src/lib/archvisPromptLibrary.ts`;
- referências de render e humanização das skills.

## Lacunas e riscos

### Duplicação de providers e endpoints

Há pelo menos dois endpoints de geração visual independentes e um conector
genérico adicional. Eles usam contratos, nomes de campos e fallback distintos.
Antes da migração é necessário escolher um contrato canônico.

### Entrada image-to-image

O `ArchVisPanel.tsx` envia um objeto `file` para
`api/copilot/generate-image.mjs`, enquanto o endpoint analisa
`sourceImageDataUrl`. Isso é evidência de possível incompatibilidade entre UI e
backend. Deve ser reproduzido com arquivo real antes de qualquer correção.

### Editor visual parcialmente demonstrativo

`archvis-pro/app/editor/page.tsx` contém viewport, timeline e controles de
ambiente/câmera/qualidade, mas a leitura mostra valores estáticos e ausência de
handlers de execução para parte dos controles. A UI é valiosa; o comportamento
precisa de validação separada.

### Status não prova produção

`pages/api/archvis/status.ts` infere configuração pela presença de variável de
ambiente. Isso não prova que uma geração real foi concluída. O critério correto
é entrada real, resposta do provider e artefato persistido.

### Políticas de provider

Alguns conectores legados contêm ramificações de providers que não podem entrar
automaticamente no Apex OS. O código é fonte de comportamento e evidência, não
autorização para copiar todos os providers.

### Assets de demonstração

Os dashboards usam imagens remotas de apresentação. Elas comprovam a UI, mas
não comprovam geração, persistência ou propriedade de assets de produção.

## Dependências e ambiente

No ACIP, o pacote ArchVis depende de Next/React, Supabase, cliente FAL,
Tailwind, Lucide, Recharts, Three.js e componentes de visualização 3D. No
Copilot, depende também de file intake, API serverless, prompt registry,
workspace state, export center e DirectCut.

Variáveis observadas apenas por nome — valores deliberadamente omitidos:

- `FAL_KEY` / `FAL_API_KEY`;
- `AI_GATEWAY_API_KEY` e `AI_GATEWAY_IMAGE_MODEL` em conectores legados;
- variáveis Supabase usadas pelas aplicações;
- variáveis de runtime local do Copilot.

Nenhum valor de chave, token ou segredo foi registrado neste relatório.

## Próxima RFC recomendada

### RFC-0002 — Migrar ArchVis para Apex Engineering

Ela deve começar por:

1. selecionar a implementação comportamental de referência;
2. selecionar a tela Stitch aprovada correspondente;
3. definir contrato canônico de entrada e saída;
4. mapear prompt registry, estilos e constraints;
5. mapear aprovação, revisão, persistência e artefatos;
6. definir adapter de provider compatível com o Apex OS;
7. executar testes de compatibilidade sem modificar os legados;
8. migrar individualmente para `apex-os` somente após aprovação.

### Critérios de não duplicação

- não criar outra biblioteca de prompts sem matriz de consolidação;
- não criar outro editor visual enquanto `archvis-pro` não for avaliado;
- não criar outro endpoint de imagem antes do contrato canônico;
- não marcar a capability como pronta com base apenas em dashboard ou status;
- não copiar `.env`, segredos ou configurações automaticamente.

## Conclusão

**Encontrei o ArchVis.**

**Encontrei o módulo responsável.** Existem implementações em ACIP e no Apex AI
Copilot, com UI, backend, prompts, workflows, persistência e integrações
candidatas.

**Ainda não está migrado para o novo Runtime.** Isso não deve ser confundido
com a existência de código legado nem com a rasterização local do Apex OS.

O próximo trabalho correto é uma RFC de migração, com validação de
compatibilidade e seleção explícita das fontes. Nenhum código novo foi criado
nesta investigação, nenhum repositório legado foi alterado e nenhuma credencial
foi exposta.

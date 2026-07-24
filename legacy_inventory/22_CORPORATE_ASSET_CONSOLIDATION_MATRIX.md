# 22 — Corporate Asset Consolidation Matrix

**Versão:** 1.0.0  
**Status:** baseline de descoberta para validação de ativos  
**Data:** 2026-07-21  
**Modo:** somente leitura nos repositórios de origem; escrita permitida apenas
em `D:\AI-constr\apex-os\legacy_inventory\`.

## 1. Decisão de trabalho

O Apex OS não será tratado como um projeto greenfield. A regra operacional
passa a ser:

```text
LOCALIZAR → VALIDAR → MIGRAR → CORRIGIR → INTEGRAR → MODERNIZAR (Stitch)
→ VALIDAR COM O OWNER → ENTREGAR
```

Desenvolvimento novo é exceção e só pode ocorrer depois de demonstrada a
ausência de uma implementação reutilizável. Este documento não migra, copia,
renomeia ou refatora código; ele seleciona fontes candidatas e registra os
próximos gates de validação.

## 2. Níveis de evidência

| Nível | Significado | O que não prova |
|---|---|---|
| Implementação observada | Arquivo de código, rota, componente, script ou binário localizado | Que está em produção ou operacional hoje |
| Interface observada | Tela, rota de UI, pacote desktop ou projeto Stitch localizado | Que o fluxo completo funciona |
| Documentação/knowledge | README, prompt, skill, ADR, plano, catálogo ou apresentação | Que existe executor compatível |
| Operacional | Execução reproduzida, teste verde ou endpoint respondendo em ambiente autorizado | Disponibilidade comercial contínua |
| Inferência | Relação provável baseada em nomes, imports ou estrutura | Integração já realizada |
| Não verificável | Sem evidência suficiente nesta rodada | Qualquer afirmação de “pronto” |

As palavras **migrado**, **integrado** e **pronto para uso** exigem evidência
de código, contrato, execução e validação do Owner. Documentação isolada não
é prova de implementação.

## 3. Fontes corporativas localizadas

| Fonte | Evidência observada | Patrimônio candidato | Destino Apex OS | Ação recomendada | Estado atual |
|---|---|---|---|---|---|
| `D:\AI-PLATAFORM\AI-Construction-Intelligence-Platform` | Next/pages, `archvis-pro`, APIs, Supabase migrations, BIM/engenharia e painéis | Engenharia, BIM, ArchVis, documentos, Growth e integrações | `products/engineering`, `shared-services/document-processing`, `shared-services/growth` | Selecionar implementações maduras; migrar por contratos; consolidar rotas duplicadas | Parcial; operação global não comprovada |
| `D:\APEX AI` | `backend/server.py`, `training_agent.py`, `studio/`, `prompts/`, `skills/`, GGUF/model blobs e manifests | Apex Intelligence, treinamento, modelos locais, Studio/Desktop e knowledge | `core/knowledge`, `shared-services/intelligence`, `platform-services/provider-adapters` | Preservar provenance, licenças, hashes e contratos; validar antes de transporte | Forte evidência técnica; operação e licenças a validar |
| `D:\Apex-Accounting` | `contabilapex/`, `erp-contabil-automation/`, APIs, Electron, PDFs e planos | ERP, contabilidade e automação fiscal | `products/accounting` | Escolher uma base; testar dados e integrações; não manter equivalentes | Implementação observada; prontidão comercial não comprovada |
| `D:\apex-marketing-squads` | `.agents/` e catálogo de skills; amostras coincidentes com skills R03 | Growth, conteúdo, marketing e conhecimento | `shared-services/growth`, `core/knowledge` | Deduplicar por hash/proveniência; separar skill de executor e material editorial | Knowledge/skills observados; aplicação não comprovada |
| `D:\Prompts J Edgard` | Bibliotecas de prompts e pastas de ArchVis, geometria e paredes | Prompt/knowledge para Engenharia e Intelligence | `core/knowledge`, registries e capabilities | Catalogar versão, origem, licença e testes; não incorporar conteúdo sensível em massa | Knowledge observado; execução não comprovada |
| `D:\SKILLS_APEX` | `apex-global-orchestrator-unificada` | Artefato de governança legado | Nenhum destino oficial automático | Consultar como histórico; sem autoridade sobre Apex OS | Legado; não governante |
| `D:\AI-constr\apex-ai-copilot-platform` | React/Vite, `server.mjs`, `api/`, `server/`, Supabase, Electron e runtime | Plataforma integrada, conectores, chat, ArchVis, BIM, billing e Growth candidates | Core/Shared Services/Produtos, após alinhamento | Usar como fonte de integração comprovável; não assumir que docs representam código | Parcial; há alterações preexistentes no worktree |

Os repositórios de origem permanecem somente leitura. Não foi feita alteração,
commit, push ou deploy neles nesta missão.

## 4. Matriz de consolidação por patrimônio

| Patrimônio | Fontes candidatas | Evidência de código/interface | Destino no Apex OS | Ação | Maturidade factual |
|---|---|---|---|---|---|
| Engenharia, BIM, IFC e Revit | AI-PLATAFORM; `apex-ai-copilot-platform` | Viewers, rotas BIM/IFC/Revit e integrações no inventário | `products/engineering`; `platform-services/provider-adapters` | Consolidar contratos, selecionar viewer e migrar adaptadores | Parcial; validar execução e licenças |
| ArchVis, humanização e mídia | AI-PLATAFORM; R01; prompts; Stitch | `pages/archvis.tsx`, `archvis-pro/*`, `ArchVisPanel.tsx`, APIs e prompt libs | `products/engineering` + `shared-services/intelligence`/media | Migrar a implementação mais completa; UI apenas do Stitch aprovado | Implementações múltiplas; não integrada ao Apex OS |
| DirectCut/renderização | AI-PLATAFORM; R01 | APIs e painéis de render e mídia | `shared-services/intelligence` ou Studio | Validar providerStatus, fila, storage e entrega | Parcial; conector não comprovado |
| OCR, ingestão e documentos | AI-PLATAFORM; R01; prompts | Rotas/utilitários de PDF, OCR, upload e classificação no censo | `shared-services/document-processing` | Consolidar pipeline por contrato; medir MIME, limites e segurança | Parcial; formatos a testar |
| Apex Intelligence, modelos e treinamento | `D:\APEX AI\backend`, `studio`, `prompts`, `skills`, GGUF/manifests | Servidor Python, agente de treinamento, Studio Electron, blobs e catálogos | `shared-services/intelligence`; `core/knowledge`; model registry | Preservar ativos, hashes/licenças, runtime e custo; não copiar pesos automaticamente | Forte evidência técnica; operação pendente |
| Vertex/training dashboard | APEX AI; inventário de UI R01 | Painéis/componentes e referências a endpoint | `shared-services/intelligence` | Validar datasets, métricas, autenticação e autorização | Parcial; operação pendente |
| Prompts, skills, agentes e MCPs | APEX AI; Prompts J Edgard; R01/R03/W03 | 2.021 `SKILL.md` R03/W03, catálogo de prompts, registries e MCPs | `core/knowledge`, `core/registries`, capabilities | Deduplicar por hash/proveniência; separar persona/prompt/skill/tool/workflow/agente | Grande volume; execução individual não presumida |

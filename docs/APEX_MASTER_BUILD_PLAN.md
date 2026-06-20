# APEX Master Build Plan

Checkpoint: CP-LIVE-2  
Audit date: 2026-06-19  
Branch baseline: `feature/image-generation-connector`

## Objetivo final

Transformar a Apex em uma plataforma comprovada, não apenas documentada:

1. Chat/Copilot funcionando em produção.
2. Upload e análise de arquivos funcionando com prova real.
3. Skills reais indexadas corretamente.
4. Módulos separados entre real, simulado, parcial e quebrado.
5. Supabase/Auth/RLS/storage validados.
6. Vercel/GitHub com fluxo disciplinado de PR, preview, merge e monitoramento.
7. Documentação sempre atualizada junto com cada correção.
8. Nada marcado como pronto sem evidência.

## Regra oficial de execução

Para cada etapa crítica:

1. Auditar arquivos reais antes de alterar.
2. Corrigir código e documentação no mesmo checkpoint.
3. Rodar somente validações que já existem no repositório.
4. Criar branch e Pull Request escopados.
5. Checar PR no GitHub.
6. Verificar se o Vercel criou Preview.
7. Se o Preview cancelar: revalidar build, corrigir erro, reenviar commit pequeno e não avançar para etapa crítica seguinte sem status claro.
8. Quando o Preview estiver OK: fazer merge, monitorar deploy de produção, executar smoke test e atualizar os documentos de status.

## Taxonomia oficial de status

| Status | Definição operacional |
| --- | --- |
| **REAL 100%** | Implementado e com evidência local ou remota verificável neste checkpoint. |
| **IMPLEMENTADO MAS NÃO COMPROVADO** | Código e wiring existem, mas o fluxo real ainda não foi provado em preview/produção ou no runtime alvo. |
| **SIMULADO** | Demonstração, stub ou UX sem backend real equivalente comprovado. |
| **QUEBRADO** | Há falha conhecida de execução, caminho, runtime ou contrato. |
| **FALTANDO INTEGRAÇÃO** | Arquivo/skill existe, mas ainda não está ligado ao runtime/catálogo operacional principal. |
| **DEPENDE DE CREDENCIAL** | O fluxo precisa de segredo, conector ou ambiente externo que não foi comprovado neste checkpoint. |

## Fase 0 — Baseline real e documentação-mãe

### Entregáveis obrigatórios

- `docs/APEX_MASTER_BUILD_PLAN.md`
- `docs/APEX_REALITY_AUDIT.md`
- `docs/APEX_PLATFORM_CURRENT_STATE.md`
- `docs/APEX_MODULE_AUDIT.md`
- `docs/APEX_OPEN_BUGS_AND_NEXT_ACTIONS.md`
- `skills/index.json`

### Critérios de aceite

- Estado real documentado sem módulos ambíguos.
- `skills/index.json` apontando apenas para caminhos existentes.
- Status oficiais aplicados de forma consistente.
- Evidências locais registradas antes de abrir PR.

## Fase 1 — Limpeza e integração real das skills

### Regra de catalogação

- O caminho canônico de uma skill deve apontar para um wrapper válido em `skills\...` ou para uma skill documental válida em `docs\...`.
- Artefatos em `skill\...` continuam válidos como **source assets** e devem ser referenciados pelo catálogo oficial.
- Arquivos `.py`, `.md`, `.txt` e `.pdf` entram como insumo de skill, mas não podem ser marcados como integrados ao runtime sem wiring comprovado.

### Entregáveis obrigatórios

1. Reindexar todas as skills existentes no repositório.
2. Separar explicitamente:
   - skill de conhecimento;
   - skill com script;
   - skill apenas de inventário/referência;
   - skill com runtime real.
3. Marcar quais itens já têm evidência de execução local.
4. Marcar quais itens ainda dependem de wiring, credencial ou conectores.

### Critérios de aceite

- Nenhum path quebrado no catálogo.
- Cada item do catálogo com status oficial e tipo.
- Pelo menos uma skill operacional comprovada com execução local registrada em auditoria.

## Checklist obrigatório por PR

1. **Escopo**: uma fase ou subfase clara.
2. **Auditoria**: arquivos lidos e estado anterior registrado.
3. **Docs**: atualizar status, auditoria e plano mestre junto com o código.
4. **Validação**: build, typecheck, testes e scripts existentes relevantes.
5. **GitHub**: branch criada, PR aberto, checks observados.
6. **Vercel Preview**: status observado; se falhar, corrigir antes de seguir.
7. **Produção**: merge, monitoramento e smoke test após Preview verde.
8. **Fechamento**: atualizar `APEX_PLATFORM_CURRENT_STATE.md` e `APEX_REALITY_AUDIT.md` com evidência.

## Regra de parada

Não marcar etapa como concluída quando faltar qualquer um destes itens:

- evidência de execução;
- status claro do Preview/deploy;
- documentação atualizada;
- classificação oficial do módulo/skill.

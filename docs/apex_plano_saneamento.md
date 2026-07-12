# Plano de saneamento e consolidação — Plataforma Apex

Documento de acompanhamento. Marque `[x]` conforme for concluindo. Não avance de fase
sem fechar a anterior — cada fase existe para que a próxima não seja construída em cima
de areia.

**Última atualização:** chave do Google Maps já rotacionada pelo Owner.

---

## Fase 0 — Contenção (esta semana)

Prioridade: parar o sangramento antes de organizar qualquer coisa.

- [x] Rotacionar a chave do Google Maps Platform exposta publicamente
  (`CHAVE_OCULTADA_EM_ENV_LOCAL`, em `AGENTS.md` e
  `src/components/MapPlacePicker.tsx` do repo1)
- [ ] Restringir a nova chave por domínio/referrer no Google Cloud Console
  (se ainda não fez isso na hora de gerar a nova — API Key sem restrição de referrer
  pode ser usada por qualquer site que a copiar)
- [ ] Atualizar `.env.local` com a nova chave e remover o valor hardcoded de
  `src/components/MapPlacePicker.tsx` e `AGENTS.md` — a chave deve vir de
  `import.meta.env.VITE_MAPS_API_KEY` (ou equivalente), nunca escrita direto no código
- [ ] Purgar a chave antiga do histórico do git (comandos na seção "Execução" abaixo —
  opcional agora que ela já está revogada, mas recomendado para não deixar rastro)
- [ ] Revisar se há outras chaves reais coladas em `.md` de sessões antigas
  (`docs/CP15D_PRODUCTION_READINESS_REPORT.md`, `docs/CP15F_VERCEL_PRODUCTION_DEPLOYMENT_REPORT.md`)
- [ ] Revogar a Regra Absoluta 8 do `AGENTS.md` (autonomia total de deploy em produção
  sem revisão humana) — substituir pelo fluxo: agente abre PR → CI roda
  `build`+`test`+`validate:*` → aprovação humana → merge → deploy
- [ ] Remover `runtime/*.exe` e `runtime/*.dll` do HEAD do repo1 (90 MB de binários
  commitados que deveriam ser baixados via `npm run setup:runtime`)
- [ ] Remover `.agents/skills/` genéricas sem relação com construção civil (1889 pastas,
  24 MB) — manter só `apex-ai-copilot`, `apex-copilot-construction-intelligence`,
  `apex-global-orchestrator`

## Fase 1 — Verdade única (semana 2–3)

Prioridade: parar de ter duas respostas diferentes para "o que já está pronto".

- [ ] Apagar `docs/APEX_PLATFORM_CURRENT_STATE copy.md` (duplicata divergente:
  62 vs 67 capacidades declaradas)
- [ ] Apagar `docs/apex_acip_master_architecture2.md` (duplicata divergente do master doc)
- [ ] Criar `docs/archive/` com data no nome para qualquer checkpoint antigo — nunca editável,
  só histórico. Mover para lá: `CP15D_PRODUCTION_READINESS_REPORT.md`,
  `CP15F_VERCEL_PRODUCTION_DEPLOYMENT_REPORT.md`, `CHANGELOG_2026-06-23.md` e qualquer
  outro checkpoint antigo que não seja um dos 3 documentos canônicos
- [ ] Reescrever a tabela de módulos do zero: cada linha só pode dizer "LIVE" se o arquivo
  de código referenciado existir de verdade e passar em teste. Sugestão de processo:
  rodar um script simples que lê a tabela, verifica `fs.existsSync` de cada arquivo
  referenciado, e falha o CI se algum link estiver quebrado — transforma a Regra
  Absoluta 6 de promessa em verificação automática
- [ ] Reclassificar como "planejado" (não "LIVE"): Market Intel & Competitor Radar,
  Occupational Health & Wellness, Growth & SEO Command Center, IT Cost & Infra Orchestrator,
  Global Legal & Due Diligence — nenhum dos arquivos apontados
  (`api/market/intelligence.mjs`, `api/health/index.mjs`, `api/growth/seo.mjs`,
  `api/infra/index.mjs`, `api/legal/global.mjs`) existe no repositório hoje
- [ ] Consolidar os 33+ arquivos de `docs/` do repo1 em uma estrutura clara:
  `docs/canonical/` (os 3 documentos-fonte), `docs/archive/` (histórico), `docs/domain/`
  (skills técnicas específicas tipo Revit/Windows Care que não são sobre status)

## Fase 2 — Portão de qualidade real (semana 3–5)

Prioridade: garantir que "LIVE" no documento signifique "LIVE" no código, para sempre,
automaticamente — não por boa vontade.

- [ ] Confirmar que `.github/workflows/apex-sync.yml` de fato **bloqueia** merge no `main`
  se `build`, `test` ou `validate:*` falharem (hoje a regra existe em texto no `AGENTS.md`,
  falta confirmar se o workflow aplica de verdade — verificar `branch protection rules`
  em Settings do GitHub, exigindo status checks obrigatórios antes de merge)
- [ ] Adicionar ao CI o script de verificação de links de código descrito na Fase 1
  (documentação que aponta para arquivo inexistente = build quebrado)
- [ ] Priorizar código real (não doc) do IT Cost & Infra Orchestrator — sem isso não há
  visibilidade de margem por cliente antes de vender como SaaS. Estrutura mínima:
  tabela de custo por chamada de API (Gemini, FAL.ai, ElevenLabs) associada a
  tenant_id, agregada por módulo
- [ ] Persistir billing/usage em Supabase/Stripe (não em memória) antes de qualquer
  cliente externo pagante
- [ ] Feature flags por módulo e por tenant usando Stripe + Supabase RLS, para permitir
  vender módulos separadamente (ex: só ArchVis, só BIM Studio) e fazer rollout gradual

## Fase 3 — Migração módulo a módulo do repo2 (mês 2 em diante)

Prioridade: aproveitar o catálogo de funcionalidades do repo2 sem herdar sua falta de testes.

Para cada módulo abaixo: reescrever como serviço real em `server/service/` do repo1,
com teste automatizado, e só depois apontar a UI para ele. Nunca copiar a pasta inteira.
Ordem sugerida por valor de negócio / risco:

- [ ] Due Diligence (jurídico) — prioridade alta, é módulo sensível e ainda protótipo
- [ ] RDO — Relatório Diário de Obra — uso operacional diário, alto valor percebido
- [ ] Orçamento SINAPI — depende de dados de preço confiáveis, testar bem os cálculos
- [ ] Supply Chain Studio
- [ ] Revenue Engine
- [ ] Project Package Pipeline — consolidador, deixar por último porque depende dos anteriores

## Fase 4 — Auto-upgrade seguro (mês 3+, depois que as fases 0-3 estiverem sólidas)

Prioridade: só automatizar mais depois que o portão de qualidade for confiável de verdade.

- [ ] Agente de IA pode abrir PR e rodar o pipeline de validação sozinho
- [ ] Merge em produção continua exigindo aprovação humana, sempre, sem exceção documentada
- [ ] Rollout gradual por feature flag em vez de deploy completo de uma vez
- [ ] Métrica de "tempo até detectar divergência entre doc e código" — se voltar a
  acontecer o que encontramos nas Fases 0/1, isso precisa aparecer rápido, não meses depois

---

## Execução — comandos de referência

### Purgar a chave antiga do histórico do git (opcional, recomendado)

Mesmo já revogada, a chave antiga continua visível em qualquer commit antigo se alguém
olhar o histórico. Limpar isso é higiene, não mais urgência:

```bash
pip install git-filter-repo --break-system-packages

git clone --mirror https://github.com/Apex-Global-LLC/apex-ai-copilot-platform.git repo1-mirror
cd repo1-mirror

echo "CHAVE_OCULTADA_EM_ENV_LOCAL==>CHAVE_REVOGADA_REMOVIDA" > /tmp/replacements.txt
git filter-repo --replace-text /tmp/replacements.txt --force

git push --force --all
git push --force --tags
```

Depois disso todo mundo (você incluído, em outras máquinas) precisa re-clonar do zero —
`git pull` normal não reconcilia histórico reescrito.

### Revogar a Regra Absoluta 8 do AGENTS.md

Trocar o trecho de autonomia total de deploy por uma versão com portão humano:

```markdown
## 🚨 REGRA ABSOLUTA 8 — Deploy em produção requer aprovação humana

Nenhum agente pode fazer merge direto em `main` nem deploy direto em produção.
Fluxo obrigatório:

1. Agente cria branch e abre Pull Request.
2. CI (`apex-sync.yml`) roda `build` + `test` + `validate:*` — PR só fica elegível
   para merge se todos os checks passarem em verde.
3. Owner (Dr. Edgard) revisa e aprova o PR manualmente.
4. Só então o merge em `main` dispara o deploy automático.

Exceção: nenhuma. Mesmo correções urgentes passam por este fluxo — a urgência não
justifica pular revisão humana em um sistema que lida com dados jurídicos e financeiros
de clientes.
```

### Remover binários e skills genéricas do HEAD

```bash
cd apex-ai-copilot-platform

git rm -r --cached runtime/*.exe runtime/*.dll
echo "runtime/*.exe" >> .gitignore
echo "runtime/*.dll" >> .gitignore

git rm -r --cached .agents/skills
# depois disso, edite .agents/skills/ manualmente para manter só:
#   apex-ai-copilot, apex-copilot-construction-intelligence, apex-global-orchestrator
git add .agents/skills

git commit -m "chore: remove binaries and unrelated skill marketplace from repo history"
git push origin main
```

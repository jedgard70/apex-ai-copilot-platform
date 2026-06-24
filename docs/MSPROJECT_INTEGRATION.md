# MS Project Integration — Apex AI Copilot

Módulo de integração com Microsoft Project via formato MSPDI XML.

## Visão Geral

O MS Project Integration permite que a Apex AI Copilot:

1. **Parseie** arquivos XML do MS Project (formato MSPDI)
2. **Analise** cronogramas: caminho crítico, baseline, variações, marcos atrasados
3. **Gere relatórios** markdown de saúde do planejamento
4. **Sincronize** tarefas, recursos e custos via API REST
5. **Exporte** dados para uso em dashboards e relatórios

## Arquitetura

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────┐
│  MSPDI XML      │────▶│  api/msproject/parse  │────▶│  JSON          │
│  (upload/cola)  │     │  (Vercel serverless)  │     │  estruturado   │
└─────────────────┘     └──────────────────────┘     └────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────┐
│  server/service/msproject.mjs                            │
│  • parseMsProjectXml()    — parser XML completo          │
│  • analyzeProject()       — análise de scheduling        │
│  • generateSchedulingReport() — relatório markdown       │
│  • projectToSimplifiedJson() — JSON para frontend        │
│  • storeProject() / getProject() — armazenamento em memória │
└──────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────┐
│  server/agent/msprojectConnector.mjs                      │
│  • Ferramentas para o live agent (parse/analyze/report)   │
│  • Integração com o sistema de tool calling da Apex       │
└──────────────────────────────────────────────────────────┘
```

## Endpoints da API

### `POST /api/msproject/parse`

Parseia XML do MS Project e retorna dados estruturados.

**Body:**

```json
{
  "xml": "<?xml version='1.0'?> <Project> ... </Project>"
}
```

**Response:**

```json
{
  "providerStatus": "connected",
  "project": { "name": "...", "startDate": "...", "finishDate": "..." },
  "analysis": {
    "totalTasks": 42,
    "completedTasks": 15,
    "inProgress": 8,
    "notStarted": 19,
    "percentComplete": 36,
    "milestones": 3
  },
  "tasks": [...],
  "resources": [...]
}
```

### `POST /api/msproject/analyze`

Análise mais detalhada com caminho crítico, baseline e alertas.

### `GET /api/msproject/projects`

Lista projetos armazenados em memória.

## Formato MSPDI

O MSPDI (Microsoft Project Data Interchange) é o formato XML padrão para intercâmbio do MS Project.
Estrutura básica:

```xml
<Project>
  <Name>Nome do Projeto</Name>
  <StartDate>2026-06-01T08:00:00</StartDate>
  <Tasks>
    <Task>
      <UID>1</UID>
      <Name>Fundação</Name>
      <Duration>PT240H</Duration>
      <Start>2026-06-01T08:00:00</Start>
      <Finish>2026-06-30T17:00:00</Finish>
      <PercentComplete>100</PercentComplete>
      <WBS>1</WBS>
      <OutlineLevel>1</OutlineLevel>
      <PredecessorLinks>
        <PredecessorLink><PredecessorUID>1</PredecessorUID></PredecessorLink>
      </PredecessorLinks>
    </Task>
  </Tasks>
  <Resources>
    <Resource>
      <UID>1</UID>
      <Name>Equipe A</Name>
      <Type>0</Type>
      <MaxUnits>100</MaxUnits>
    </Resource>
  </Resources>
</Project>
```

**Para exportar do MS Project:**

1. Abra o arquivo `.mpp` no MS Project
2. File → Save As → XML Format (.xml)
3. Copie o conteúdo do XML

## Uso com o Live Agent

O live agent da Apex AI Copilot agora reconhece comandos como:

- "Analyze this MS Project schedule"
- "Parse este XML do MS Project"
- "Generate a scheduling report"
- "Mostre o caminho crítico"
- "Quais tarefas estão atrasadas?"

## Dependências

- `fast-xml-parser` — parsing XML (já instalado)

## Testando

```bash
# Via API
curl -X POST https://www.apexglobalai.com/api/msproject/parse \
  -H "Content-Type: application/json" \
  -d '{"xml": "<?xml...><Project>...</Project>"}'

# Obter XML de exemplo
curl https://www.apexglobalai.com/api/msproject/parse?sample=1

# Servidor local
curl -X POST http://localhost:4177/api/msproject/parse \
  -H "Content-Type: application/json" \
  -d @sample-project.json
```

## Próximos Passos

- [ ] Persistência em Supabase (tabela `msproject_projects`)
- [ ] Upload de arquivo `.mpp` com conversão para XML
- [ ] Integração com EVM (Earned Value Management)
- [ ] Exportação para Gantt chart no frontend
- [ ] Suporte a recursos com calendário

/**
 * Apex AI Copilot — H13 Revit/BIM MCP Connector
 * Integrates Autodesk Product Help API for real Revit help content.
 * Falls back to curated knowledge when API is unavailable.
 */

const AUTODESK_HELP_BASE = 'https://help.autodesk.com/cloudhelp'
const AUTODESK_SEARCH_API = 'https://help.autodesk.com/api/search'
const CONNECTOR_TIMEOUT_MS = 8000

function hasAutodeskConfig() {
  return Boolean(
    process.env.AUTODESK_CLIENT_ID && process.env.AUTODESK_CLIENT_SECRET
    || process.env.AUTODESK_ACCESS_TOKEN
  )
}

function getAutodeskToken() {
  return process.env.AUTODESK_ACCESS_TOKEN || ''
}

export function classifyRevitBimQuery(message = '') {
  const text = String(message || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  if (/\bfamili[ao]s?\b.*\brevit\b|\brevit\b.*\bfamili[ao]s?\b/.test(text)) return 'revit_families'
  if (/\bparametros?\b.*\bcompartilhados?\b|\bcompartilhados?\b.*\bparametros?\b|\bshared\s+param/.test(text)) return 'revit_shared_params'
  if (/\bquantitativo\b|\bschedule\b|\bquantidade\b.*\brevit\b/.test(text)) return 'revit_schedules'
  if (/\bifc\b.*\bexport|\bexport.*\bifc\b/.test(text)) return 'revit_ifc_export'
  if (/\bdynamo\b/.test(text)) return 'revit_dynamo'
  if (/\bpyrevit\b|py\s*revit/.test(text)) return 'revit_pyrevit'
  if (/\brevit\s*api\b|c#.*\brevit\b|\badd.?in\b/.test(text)) return 'revit_api'
  if (/\btemplate\b.*\brevit\b|\brevit\b.*\btemplate\b/.test(text)) return 'revit_templates'
  if (/\bcompatibili[zs]a\b|\bclash\b|\bnavisworks\b/.test(text)) return 'revit_coordination'
  if (/\bglb\b|\bgltf\b|\bwebgl\b.*\brvt\b|\brvt\b.*\bviewer\b/.test(text)) return 'revit_glb_export'
  if (/\blod\b|\bloi\b|\bbim\s+execution\b|\bbep\b/.test(text)) return 'bim_standards'
  if (/\brevit\b|\bbim\b/.test(text)) return 'revit_general'

  return null
}

async function searchAutodeskHelp(query, productLine = 'RVT', version = '2025') {
  if (!globalThis.fetch) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONNECTOR_TIMEOUT_MS)

  try {
    const token = getAutodeskToken()
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const searchUrl = `${AUTODESK_SEARCH_API}?query=${encodeURIComponent(query)}&products=${productLine}&versions=${version}&lang=ENU&limit=5`
    const response = await fetch(searchUrl, { method: 'GET', headers, signal: controller.signal })

    if (!response.ok) return null
    const data = await response.json().catch(() => null)
    return data
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ─── Curated knowledge base (offline fallback) ────────────────────────────────

const CURATED_KNOWLEDGE = {
  revit_families: {
    title: 'Famílias Revit — organização e boas práticas',
    content: [
      '**Tipos de família**: Sistema (paredes, lajes, telhados — editadas no projeto), Carregáveis (rvt separados) e In-place (uso pontual).',
      '**Nomenclatura recomendada**: [Disciplina]-[Categoria]-[Descrição]-[Variação]. Ex: ARQ-JAN-Corrediça-2F.',
      '**Parâmetros**: use parâmetros de instância para valores únicos por elemento; tipo para valores compartilhados entre elementos iguais.',
      '**Biblioteca**: organize por disciplina (ARQ/EST/HID/ELE/HVAC) e mantenha uma pasta "Aprovadas" versionada.',
      '**Exportação GLB/IFC**: famílias com geometria limpa (sem referências desnecessárias) exportam melhor.',
      '**Próximos passos**: posso gerar checklist de auditoria de família, template de nomenclatura ou plano de organização de biblioteca.',
    ],
    links: [`${AUTODESK_HELP_BASE}/ENU/Revit-UserGuide/files/GUID-7AEC5D66-C2E0-40E2-AB5B-4E8B972E29AD.htm`],
  },
  revit_shared_params: {
    title: 'Parâmetros compartilhados — configuração e uso',
    content: [
      '**Arquivo de parâmetros**: um único .txt por empresa, versionado e controlado.',
      '**Grupos**: separe por disciplina (Geral, ARQ, EST, MEP) e função (Identificação, Quantidade, Custo, BIM).',
      '**GUID único**: cada parâmetro tem GUID que nunca muda — evita duplicidade entre projetos.',
      '**Exportação IFC**: parâmetros compartilhados mapeiam para propriedades IFC (IfcPropertySet).',
      '**Quantitativos**: associe parâmetros calculados às tabelas (Schedules) para extração automática.',
      '**Próximos passos**: posso criar template de arquivo de parâmetros ou mapear campos para exportação COBie/IFC.',
    ],
    links: [],
  },
  revit_schedules: {
    title: 'Quantitativos e tabelas Revit',
    content: [
      '**Schedule por categoria**: crie uma tabela por categoria (Doors, Walls, Rooms, etc.).',
      '**Campos calculados**: use fórmulas para área líquida, custo unitário, volume de concreto.',
      '**Agrupamento/subtotal**: agrupe por nível, bloco ou disciplina para relatórios parciais.',
      '**Exportação**: exporte como .xlsx ou .txt para integração com orçamento (SINAPI, Sienge, etc.).',
      '**Parâmetros de projeto**: adicione campos de custo, prazo e responsável para BIM 5D/6D.',
      '**Próximos passos**: posso montar template de quantitativo por disciplina ou critérios de medição SINAPI.',
    ],
    links: [],
  },
  revit_ifc_export: {
    title: 'Exportação IFC do Revit',
    content: [
      '**Versão IFC**: use IFC 2x3 para compatibilidade máxima; IFC 4 para projetos modernos com suporte confirmado.',
      '**Configuração de exportação**: salve um .ifcexportcfg por projeto com mapeamento de categorias e propriedades.',
      '**Mapeamento de propriedades**: configure IfcPropertySet para incluir parâmetros compartilhados relevantes.',
      '**Coordenação**: defina ponto de projeto compartilhado antes de exportar para alinhamento entre disciplinas.',
      '**Validação**: verifique no BIM Collab, Solibri ou viewer IFC antes de entregar.',
      '**GLB/GLTF**: para viewer web, exporte via Autodesk Platform Services (Forge) ou converta IFC→GLB com IfcOpenShell.',
    ],
    links: [],
  },
  revit_dynamo: {
    title: 'Dynamo — automação no Revit',
    content: [
      '**Player Dynamo**: scripts aprovados rodam pelo Dynamo Player sem abrir o editor — ideal para usuários de campo.',
      '**Nós essenciais**: Element.GetParameterValueByName, Element.SetParameterByName, Select.AllElementsOfCategory.',
      '**Renomeação em lote**: use List.Map + String.Replace para renomear famílias, vistas ou folhas em massa.',
      '**Criação de vistas**: automatize criação de plantas por nível com Set Category, bounding box e escala.',
      '**Exportação de dados**: Dynamo→Excel via Data.ExportExcel para quantitativos ou validação.',
      '**Próximos passos**: posso escrever um script Dynamo completo para renomeação, criação de vistas ou extração de dados.',
    ],
    links: [],
  },
  revit_pyrevit: {
    title: 'pyRevit — scripts Python no Revit',
    content: [
      '**Instalação**: pyRevit instala como extensão Revit; scripts ficam em pastas .extension.',
      '**Script básico**: `from revit import doc, uidoc` + `FilteredElementCollector` para coletar elementos.',
      '**Comandos de ribbon**: crie botões personalizados com `script.get_button()` e ícone PNG 32×32.',
      '**Transações**: toda modificação precisa de `Transaction(doc, "nome")` com commit/rollback.',
      '**Forms**: use `forms.alert()`, `forms.ask_for_string()` ou WPF para UI rápida.',
      '**Próximos passos**: posso escrever script pyRevit completo para qualquer automação: renomear, exportar, validar.',
    ],
    links: [],
  },
  revit_api: {
    title: 'Revit API / C# add-in',
    content: [
      '**IExternalCommand**: ponto de entrada de todo add-in; implementa `Execute(ExternalCommandData, ref string, ElementSet)`.',
      '**FilteredElementCollector**: coleta elementos por categoria, classe ou parâmetro — base de 90% das operações.',
      '**Transaction**: toda escrita no modelo precisa de Transaction; use `using` para garantir commit/rollback.',
      '**Events**: `DocumentOpened`, `DocumentSaved`, `ApplicationInitialized` para hooks automáticos.',
      '**Ribbon UI**: `RibbonPanel` + `PushButton` para criar botões com ícone e tooltip.',
      '**Próximos passos**: posso gerar scaffold C# de add-in completo, incluindo .addin manifest e estrutura de projeto.',
    ],
    links: [],
  },
  revit_coordination: {
    title: 'Compatibilização e clash detection',
    content: [
      '**Modelo federado**: cada disciplina exporta NWC (Navisworks Cache) ou IFC; coordenador abre tudo junto.',
      '**Clash rules**: defina regras por par de disciplinas (ARQ×EST, EST×HID, HID×ELE) com tolerância em mm.',
      '**Relatório de clash**: exporte XML/HTML do Navisworks ou BIM Collab para registro e distribuição.',
      '**Resolução**: cada clash recebe status (Novo, Em análise, Resolvido, Aceito) com responsável e prazo.',
      '**Revisão de modelo**: use Revit Section Box para isolar área e validar in-loco após correção.',
      '**Próximos passos**: posso montar protocolo de compatibilização, template de relatório ou checklist de revisão.',
    ],
    links: [],
  },
  revit_glb_export: {
    title: 'Exportação GLB/GLTF para viewer web',
    content: [
      '**Via Autodesk Platform Services (APS/Forge)**: faça upload do RVT, converta com Model Derivative API, baixe como SVF2 ou OBJ, converta para GLB.',
      '**Via IFC+IfcOpenShell**: RVT→IFC (Revit nativo) → GLB (IfcOpenShell + Blender).',
      '**Via Enscape/Twinmotion**: exporta GLB/GLTF diretamente com materiais PBR.',
      '**Three.js/Babylon.js**: GLB abre nativamente com `GLTFLoader`; adicione orbit controls para visualização web.',
      '**Apex BIM Viewer**: posso preparar o fluxo completo de importação para o viewer interno.',
      '**Próximos passos**: qual é o ponto de partida? RVT, IFC ou já tem GLB?',
    ],
    links: [],
  },
  bim_standards: {
    title: 'Padrões BIM — LOD, LOI, BEP',
    content: [
      '**LOD (Level of Development)**: LOD 100→500 define detalhamento geométrico; use AIA G202 ou ABNT NBR 15965.',
      '**LOI (Level of Information)**: define quais parâmetros/atributos cada elemento deve conter em cada fase.',
      '**BEP (BIM Execution Plan)**: documento contratual com responsabilidades, software, formatos, LOD por disciplina e entregáveis.',
      '**CDE (Common Data Environment)**: repositório centralizado (ACC, BIM 360, SharePoint) com estrutura de pastas por status (WIP/Shared/Published/Archived).',
      '**Entregáveis mínimos**: modelo nativo, IFC coordenado, relatório de clash, quantitativo e validação de LOD.',
      '**Próximos passos**: posso redigir BEP completo, definir LOD por disciplina ou criar template de CDE para seu projeto.',
    ],
    links: [],
  },
  revit_templates: {
    title: 'Templates Revit — configuração e padronização',
    content: [
      '**Template de projeto (.rte)**: contém unidades, tipos de vista, filtros, tabelas, famílias carregadas e configurações de exportação.',
      '**View Templates**: capture configurações de visibilidade, gráficos, filtros e escala em templates de vista reutilizáveis.',
      '**Families padrão**: pré-carregue apenas famílias aprovadas; exclua temporárias antes de salvar o template.',
      '**Coordenação**: defina Survey Point e Project Base Point no template para garantir georreferenciamento consistente.',
      '**Distribuição**: mantenha template no servidor/CDE com controle de versão; projetos importam como "Transfer Project Standards".',
      '**Próximos passos**: posso criar checklist de auditoria de template ou roteiro de padronização por disciplina.',
    ],
    links: [],
  },
  revit_general: {
    title: 'Revit e BIM — ajuda geral',
    content: [
      'Posso ajudar com Revit e BIM em vários níveis:',
      '- **Famílias**: organização, nomenclatura, parâmetros, biblioteca.',
      '- **Templates**: padronização de projeto, view templates, filtros.',
      '- **Quantitativos**: schedules, parâmetros calculados, exportação Excel.',
      '- **IFC/GLB**: configuração de exportação, mapeamento de propriedades, viewer web.',
      '- **Coordenação**: clash detection, BEP, LOD/LOI, CDE.',
      '- **Automação**: Dynamo, pyRevit, Revit API/C# add-ins.',
      '',
      'Por enquanto, eu preparo o plano, checklist e documentação sem fingir execução no Revit.',
      '',
      'Me diga qual área ou desafio específico você quer resolver.',
    ],
    links: [],
  },
}

export async function getRevitBimHelp(message = '') {
  const queryType = classifyRevitBimQuery(message)
  const knowledge = queryType ? CURATED_KNOWLEDGE[queryType] : CURATED_KNOWLEDGE.revit_general

  // Try to enrich with live Autodesk help if configured
  let liveResults = null
  if (hasAutodeskConfig() && queryType) {
    const searchQuery = `Revit ${queryType.replace(/_/g, ' ')}`
    liveResults = await searchAutodeskHelp(searchQuery)
  }

  return {
    ok: true,
    queryType: queryType || 'revit_general',
    knowledge,
    liveResults,
    connectorConfigured: hasAutodeskConfig(),
    secretsExposed: false,
  }
}

export function buildRevitBimReply(result) {
  const { knowledge, liveResults, connectorConfigured, queryType } = result

  const lines = [
    `**${knowledge.title}**`,
    '',
    ...knowledge.content,
  ]

  if (liveResults?.results?.length) {
    lines.push('')
    lines.push('**Artigos da Autodesk Help:**')
    for (const r of liveResults.results.slice(0, 3)) {
      lines.push(`- [${r.title || r.heading}](${r.url || r.link})`)
    }
  } else if (!connectorConfigured && queryType !== 'revit_general') {
    lines.push('')
    lines.push('_Para conteúdo ao vivo da Autodesk Help, configure `AUTODESK_ACCESS_TOKEN` no backend._')
  }

  return lines.join('\n')
}

export function getRevitConnectorStatus() {
  return {
    id: 'revit_bim_mcp',
    label: 'Revit/BIM MCP connector',
    status: hasAutodeskConfig() ? 'configured' : 'knowledge_only',
    configured: hasAutodeskConfig(),
    detail: hasAutodeskConfig()
      ? 'Autodesk Platform Services configurado — busca ao vivo disponível.'
      : 'Operando com base de conhecimento curada. Configure AUTODESK_ACCESS_TOKEN para busca ao vivo.',
  }
}

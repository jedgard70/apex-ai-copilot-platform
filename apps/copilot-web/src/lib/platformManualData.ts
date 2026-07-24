/**
 * lib/platformManualData.ts
 *
 * Dados do Manual do Usuário — descrições em linguagem natural
 * para cada funcionalidade da plataforma.
 * Usado pelo PlatformMapPanel > ManualTab.
 */

export type ManualSection = {
  id: string
  title: string
  icon: string
  summary: string
  items: ManualItem[]
}

export type ManualItem = {
  name: string
  description: string
  howToUse: string
  example: string
  availableTo: 'todos' | 'clientes' | 'owner'
}

const SECTIONS: ManualSection[] = [
  {
    id: 'chat-copilot',
    title: '🤖 Chat / Copilot',
    icon: '💬',
    summary: 'O coração da plataforma. Um assistente de IA que entende linguagem natural e executa tarefas.',
    items: [
      {
        name: 'Chat com IA',
        description: 'Converse com a Apex AI como se fosse um especialista. Ela entende português, inglês e responde na mesma língua. Pode pesquisar arquivos, executar comandos, gerar imagens, analisar documentos e muito mais.',
        howToUse: 'Apenas digite no chat o que você precisa. Seja específico: "gere um orçamento para uma casa de 200m²", "analise este contrato", "crie um vídeo de vendas para este produto".',
        example: '"faça um orçamento para reforma de banheiro"',
        availableTo: 'todos',
      },
      {
        name: 'Upload de Arquivos',
        description: 'Envie imagens, PDFs, planilhas, documentos Word, arquivos BIM/IFC, plantas CAD. A IA lê o conteúdo e trabalha em cima dele.',
        howToUse: 'Clique no ícone de clip ao lado do chat ou arraste o arquivo para a janela.',
        example: 'Enviar uma planta PDF e pedir "extraia as medidas e faça um orçamento"',
        availableTo: 'todos',
      },
      {
        name: 'Execução de Comandos',
        description: 'Peça para rodar comandos no servidor: git status, build, testes, scripts. A IA executa direto e mostra o resultado no chat.',
        howToUse: 'Simplesmente peça: "roda git status", "executa npm build", "roda os testes".',
        example: '"executa npm run build para ver se está compilando"',
        availableTo: 'owner',
      },
    ],
  },
  {
    id: 'archvis-render',
    title: '🎨 ArchVis — Renderização de Imagens',
    icon: '🏗️',
    summary: 'Gere imagens fotorrealistas de arquitetura e interiores usando IA.',
    items: [
      {
        name: 'Render de Imagem',
        description: 'Crie renders profissionais de fachadas, interiores, plantas humanizadas e visuais 3D. 8 estilos diferentes: realista, conceitual, aquarela, noturno, etc.',
        howToUse: 'Descreva o que quer renderizar. Ex: "fachada de casa moderna com iluminação noturna", "cozinha industrial estilo loft".',
        example: '"renderizar fachada de sobrado com vidro e concreto, estilo moderno, pôr do sol"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'directcut-video',
    title: '🎬 DirectCut — Vídeos Profissionais',
    icon: '🎥',
    summary: 'Criação de vídeos de vendas, apresentações e conteúdo para redes sociais.',
    items: [
      {
        name: 'Vídeo de Vendas (VSL)',
        description: 'Gera roteiro, storyboard e vídeo completo para vendas. Ideal para lançamentos, apresentações de projetos e marketing imobiliário.',
        howToUse: 'Peça: "crie um vídeo de vendas para este produto" ou "faça uma VSL para o empreendimento X".',
        example: '"quero um vídeo de vendas para meu curso de engenharia"',
        availableTo: 'todos',
      },
      {
        name: 'Conteúdo para Redes',
        description: 'Gera carrosséis para Instagram, posts para LinkedIn, roteiros para Reels e anúncios para Google Ads.',
        howToUse: 'Peça: "crie um carrossel para Instagram sobre este produto", "gere posts para LinkedIn".',
        example: '"gerar 5 posts para LinkedIn sobre BIM"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'bim-3d',
    title: '🏗️ BIM / 3D Studio',
    icon: '🏛️',
    summary: 'Visualização e análise de modelos BIM e arquivos 3D.',
    items: [
      {
        name: 'Visualizador 3D',
        description: 'Abra e visualize arquivos IFC, GLB, GLTF, OBJ. Faça medições, análises técnicas, relatórios e tours virtuais.',
        howToUse: 'Envie um arquivo IFC ou 3D e peça: "visualize este modelo", "analise a estrutura", "gere um relatório técnico".',
        example: '"abra este arquivo IFC e me mostre os conflitos"',
        availableTo: 'todos',
      },
      {
        name: 'Conversão de Formatos',
        description: 'Arquivos RVT (Revit), DWG, DXF e SKP são convertidos internamente para visualização web.',
        howToUse: 'Envie o arquivo e peça: "converta este RVT para visualização".',
        example: '"importe este arquivo do Revit"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'orcamento',
    title: '📊 Orçamento / Quantitativo',
    icon: '💰',
    summary: 'Elaboração de orçamentos com base no SINAPI e composições próprias.',
    items: [
      {
        name: 'Orçamento de Obras',
        description: 'Crie orçamentos detalhados com insumos, composições, BDI e curva ABC. Importa planilhas SINAPI em CSV/XLSX.',
        howToUse: 'Descreva o escopo: "faça um orçamento para construir 100m²", ou importe uma planilha existente.',
        example: '"orçamento para reforma de apartamento 80m² com materiais médios"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'contratos',
    title: '📝 Contratos / Legal',
    icon: '⚖️',
    summary: 'Elaboração e revisão de contratos, documentos legais e packages de permits.',
    items: [
      {
        name: 'Contratos de Construção',
        description: 'Gera contratos de empreitada, prestação de serviços, fornecimento. Exporta em DOCX e PDF.',
        howToUse: 'Peça: "crie um contrato de empreitada para obra de 200m²", "revise este contrato".',
        example: '"gerar contrato de prestação de serviços para engenheiro"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'obras-campo',
    title: '👷 FieldOps / Diário de Obra',
    icon: '📋',
    summary: 'Acompanhamento de obras com diário de obra, checklists e relatórios.',
    items: [
      {
        name: 'RDO — Diário de Obra',
        description: 'Registre o andamento da obra: equipe, materiais, atividades, clima, fotos. Gera relatório profissional.',
        howToUse: 'Descreva o dia de obra ou envie fotos: "registre o RDO de hoje com as atividades realizadas".',
        example: '"criar RDO do dia com equipe de 5 pedreiros e entrega de material"',
        availableTo: 'todos',
      },
      {
        name: 'Checklists de Qualidade e Segurança',
        description: 'Checklists de NRs, qualidade, segurança do trabalho. Gera relatórios de conformidade.',
        howToUse: 'Peça: "checklist de segurança NR-18", "relatório de qualidade da obra".',
        example: '"fazer checklist de segurança para obra vertical"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'financeiro',
    title: '💵 Financeiro / Controle',
    icon: '📈',
    summary: 'Gestão financeira da empresa com receitas, despesas e relatórios.',
    items: [
      {
        name: 'Controle Financeiro',
        description: 'Registre receitas e despesas, acompanhe MRR, ARR, DRE, fluxo de caixa. Painel completo.',
        howToUse: 'Peça: "adicione uma receita de R$ 5.000", "mostre o DRE do mês", "relatório financeiro".',
        example: '"qual foi meu lucro no mês passado?"',
        availableTo: 'todos',
      },
      {
        name: 'Faturamento / Invoices',
        description: 'Gere faturas para clientes, vincule a pagamentos Stripe, acompanhe recibos.',
        howToUse: 'Peça: "gere uma invoice para o cliente X no valor de Y".',
        example: '"criar nota fiscal para o cliente João"',
        availableTo: 'clientes',
      },
    ],
  },
  {
    id: 'nr-compliance',
    title: '🦺 NR Compliance (CREA/OE)',
    icon: '📑',
    summary: 'Documentação técnica de Normas Regulamentadoras com assinatura CREA e OE.',
    items: [
      {
        name: 'Documentos NR',
        description: 'Gera documentos de NR-6 (EPI), NR-10 (Elétrica), NR-12 (Máquinas), NR-18 (Construção Civil), NR-33 (Espaço Confinado), NR-35 (Altura). Com campos para CREA e OE.',
        howToUse: 'Peça: "gere documento NR-18 para obra", "abrir NR compliance", "documento de segurança NR-35".',
        example: '"criar documento NR-10 para instalação elétrica"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'accounting',
    title: '📒 Contabilidade CRC (PJ + PF)',
    icon: '🧾',
    summary: 'Contabilidade completa para empresas e pessoa física: IRPJ, DRE, balanço, livro diário, obrigações fiscais, IRPF, Carnê-Leão, deduções e assessoria.',
    items: [
      {
        name: 'Relatórios Contábeis PJ',
        description: 'Gera DRE, balanço patrimonial, IRPJ, fluxo de caixa, DLPA. Cadastre empresas com CNPJ, CNAE e regime tributário (Simples Nacional, Lucro Presumido, Lucro Real).',
        howToUse: 'Peça: "abrir contabilidade", "gerar DRE", "calcular IRPJ". Cadastre a empresa primeiro e depois gere relatórios.',
        example: '"DRE da minha empresa do trimestre"',
        availableTo: 'todos',
      },
      {
        name: 'Obrigações Fiscais PJ (18 itens)',
        description: 'Lista completa de todas as obrigações fiscais de uma empresa: DCTFWeb, EFD-Reinf, eSocial, ECD, ECF, IRPJ, CSLL, PIS, COFINS, ICMS, ISS, GFIP, Simples Nacional, Livro Caixa, Alvará, Licença Sanitária, AVCB, Certidões Conjuntas. Cada item mostra período, órgão, prazo e multa por atraso.',
        howToUse: 'Abra o painel de contabilidade e clique em "Empresa (PJ)". A tabela completa aparece automaticamente.',
        example: '"quais obrigações fiscais minha empresa precisa entregar este mês?"',
        availableTo: 'todos',
      },
      {
        name: 'Planejamento IRPF (Pessoa Física)',
        description: 'Cadastre pessoas físicas com CPF e receba planejamento completo do Imposto de Renda: tabela de alíquotas 2026, deduções possíveis (saúde, educação, PGBL, dependentes), Carnê-Leão, ISS autônomo, GCAP, bens e direitos, ITCMD, IPTU, IPVA, certidões. Ideal para profissionais autônomos e MEI.',
        howToUse: 'Peça: "abrir contabilidade", clique em "Pessoa Física (PF)", cadastre seu CPF e gere o planejamento IRPF.',
        example: '"quanto vou pagar de IRPF este ano?" ou "quais deduções posso declarar no IR?"',
        availableTo: 'todos',
      },
      {
        name: 'Obrigações PF (14 itens)',
        description: 'Tabela completa de obrigações de pessoa física: IRPF, Carnê-Leão, ISS Autônomo, DAS-MEI, DIRF, Informes Bancários, Gastos Saúde, Gastos Educação, Bens e Direitos, GCAP, ITCMD, IPTU, IPVA, Certidão PF.',
        howToUse: 'No painel de contabilidade, aba "Pessoa Física (PF)", a tabela aparece automaticamente.',
        example: '"preciso declarar Carnê-Leão este mês?"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'permits',
    title: '🏛️ American Permits',
    icon: '🇺🇸',
    summary: 'Documentação para obtenção de permits de construção nos EUA.',
    items: [
      {
        name: 'Building Permits',
        description: 'Gera checklists, fee estimates e formulários para 8 tipos de permit americano (residential, commercial, structural, electrical, plumbing, etc.).',
        howToUse: 'Peça: "abrir american permits", "gerar checklist para permit residencial na Flórida".',
        example: '"preciso de um building permit para reforma comercial em Miami"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'marketing',
    title: '📣 Marketing / Redes',
    icon: '📱',
    summary: 'Automação de marketing com campanhas, conteúdo para redes e anúncios.',
    items: [
      {
        name: 'Campanhas de Marketing',
        description: 'Crie campanhas completas: plano, imagens (via FAL.ai), carrosséis, posts para LinkedIn e Google Ads.',
        howToUse: 'Peça: "criar campanha de marketing para meu produto", "gerar conteúdo para Instagram".',
        example: '"campanha de lançamento para novo serviço de BIM"',
        availableTo: 'todos',
      },
      {
        name: 'Pipeline de Conteúdo',
        description: 'Acompanhe o progresso da geração de conteúdo em tempo real: imagens sendo criadas, posts sendo gerados.',
        howToUse: 'Peça: "abrir pipeline", "mostrar andamento das tarefas".',
        example: '"como está o progresso da minha campanha?"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'mercado',
    title: '📈 Mercado Financeiro',
    icon: '📊',
    summary: 'Acompanhamento de bolsa de valores, B3, ações e criptomoedas.',
    items: [
      {
        name: 'Bolsa de Valores',
        description: 'Cotações ao vivo da B3, Nasdaq, S&P 500, criptomoedas. Watchlist personalizada.',
        howToUse: 'Peça: "abrir bolsa de valores", "mostrar cotações", "como está o IBOVESPA hoje?".',
        example: '"qual a cotação da PETR4 hoje?"',
        availableTo: 'todos',
      },
      {
        name: 'Trip Planner',
        description: 'Planejamento de viagens com cálculo de orçamento, destinos e roteiro.',
        howToUse: 'Peça: "planejar viagem", "abrir trip planner", "roteiro para Orlando".',
        example: '"quanto custa uma viagem para Nova York para 2 pessoas?"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'agentes-cognitivos',
    title: '🧠 Agentes Cognitivos ACIP',
    icon: '🤖',
    summary: '13 agentes especializados em construção civil que trabalham de forma coordenada. Cada agente tem um domínio específico.',
    items: [
      {
        name: 'Os 13 Agentes',
        description: 'Engenheiro Civil, Arquiteto, Analista Estrutural, Orçamentista, Gestor de Obra, Agente de Mercado, Agente de Vendas, Agente de Investidores, Compliance Officer, Agente de Automação, Conselho Executivo, Simulação e Construction AGI. Cada um executa tarefas específicas e pode ser coordenado em 4 modos diferentes.',
        howToUse: 'Peça: "abrir agentes cognitivos", "executar análise estrutural", "coordenar todos os agentes para análise de viabilidade".',
        example: '"executar análise completa com todos os agentes para este projeto"',
        availableTo: 'todos',
      },
      {
        name: 'Modos de Coordenação',
        description: '4 modos: Execução Paralela, Coordenação Hierárquica, Orquestração por Eventos, Self-Healing Workflows.',
        howToUse: 'No painel de Agentes Cognitivos, selecione o modelo e digite a tarefa.',
        example: '"coordenar análise de viabilidade em modo paralelo"',
        availableTo: 'todos',
      },
      {
        name: 'Log e Status',
        description: 'Cada execução é registrada com status, duração e resultados. O painel mostra agentes ativos, taxa de sucesso e distribuição por role.',
        howToUse: 'Abra o painel e veja as abas Log e Status.',
        example: '"qual o status dos agentes agora?"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'dashboard-by-role',
    title: '📊 Dashboard Executivo ACIP',
    icon: '📈',
    summary: 'Dashboard personalizado para cada perfil: Diretor, Engenheiro, Arquiteto, Investidor, Gestor de Obra, Vendas e Compliance.',
    items: [
      {
        name: 'Dashboard por Perfil',
        description: '7 dashboards diferentes: Diretor Executivo (VGV, margem, pipeline), Engenheiro (NCIs, projetos), Arquiteto (plantas, renders), Investidor (ROI, payback), Gestor de Obra (cronograma, equipe), Vendas (pipeline, leads), Compliance (conformidade, licenças, NRs). Cada um com KPIs, alertas e tabelas específicas.',
        howToUse: 'Peça: "abrir dashboard", "dashboard diretor", "dashboard vendas". Selecione o perfil no painel.',
        example: '"mostrar dashboard do diretor executivo"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'crm-pipeline',
    title: '🤝 CRM Pipeline ACIP',
    icon: '📊',
    summary: 'Pipeline de vendas completo com 5 estágios, leads, KPIs e VGL ponderado.',
    items: [
      {
        name: 'Pipeline de Vendas',
        description: '5 estágios: Prospecção, Qualificação, Proposta, Negociação e Fechamento. Cada lead tem valor, probabilidade, responsável, origem e tags. KPIs em tempo real: VGL total, ticket médio, taxa de conversão, VGL ponderado.',
        howToUse: 'Peça: "abrir pipeline crm", "pipeline de vendas", "mostrar leads". Crie leads, avance entre estágios e acompanhe o funil.',
        example: '"quais leads estão em negociação?"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'bim-clash',
    title: '🏗️ BIM Clash Detection ACIP',
    icon: '🔍',
    summary: 'Detecção de conflitos entre disciplinas BIM (Estrutural, Arquitetura, MEP). Revit, Navisworks, Tekla, ArchiCAD, Solibri.',
    items: [
      {
        name: 'Detecção de Conflitos',
        description: 'Registre conflitos com severidade, localização, disciplinas envolvidas e origem. Acompanhe status de resolução.',
        howToUse: 'Peça: "abrir clash detection", "conflitos BIM".',
        example: '"mostrar conflitos críticos do modelo Park Avenue"',
        availableTo: 'todos',
      },
      {
        name: 'KPIs e Métricas',
        description: 'Total de conflitos, críticos abertos, média de dias, distribuição por severidade.',
        howToUse: 'KPIs aparecem automaticamente no painel.',
        example: '"quantos conflitos críticos ainda estão abertos?"',
        availableTo: 'todos',
      },
      {
        name: 'Integrações BIM',
        description: 'Revit, Navisworks, Tekla, ArchiCAD, Solibri, ACC.',
        howToUse: 'Conectores via APS e IFC.',
        example: '"importar clash do Navisworks"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'notificacoes',
    title: '🔔 Notificações / Alertas',
    icon: '📨',
    summary: 'Notificações por WhatsApp e SMS para clientes e equipe.',
    items: [
      {
        name: 'Notificações WhatsApp/SMS',
        description: 'Envia notificações automáticas de pagamentos, alertas de obra, lembretes. Usa AuthKey.',
        howToUse: 'Configure o número no .env.local. As notificações são enviadas automaticamente após pagamentos.',
        example: 'Cliente paga → recebe WhatsApp automático de confirmação',
        availableTo: 'clientes',
      },
    ],
  },
  {
    id: 'predictive-analytics',
    title: '🔮 Predictive Analytics ACIP',
    icon: '📊',
    summary: 'Inteligência preditiva para antecipar atrasos, riscos financeiros, gargalos e retrabalho.',
    items: [
      {
        name: 'Predição de Atrasos',
        description: 'Analisa fatores como clima, fornecedores, mão de obra e licenciamento para estimar probabilidade e dias de atraso.',
        howToUse: 'Peça: "abrir analytics preditivo", "prever atrasos", "riscos do projeto".',
        example: '"qual a chance de atraso na obra?"',
        availableTo: 'todos',
      },
      {
        name: 'Risco Financeiro',
        description: 'Estoura de orçamento, multas contratuais, variação cambial, retrabalho e inadimplência são calculados com impacto estimado.',
        howToUse: 'No painel, veja o valor em risco e as recomendações automáticas.',
        example: '"quanto dinheiro está em risco?"',
        availableTo: 'todos',
      },
      {
        name: 'Detecção de Gargalos',
        description: 'Identifica recursos sobrecarregados: equipamentos, mão de obra e processos com ocupação crítica.',
        howToUse: 'O painel mostra gargalos e recomenda ações corretivas.',
        example: '"quais são os gargalos da obra?"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'digital-twin-iot',
    title: '🏭 Digital Twin IoT ACIP',
    icon: '📡',
    summary: 'Gêmeo digital da obra com sensores IoT em tempo real: temperatura, umidade, inclinação, vibração, energia e pressão.',
    items: [
      {
        name: 'Sensores em Tempo Real',
        description: '6 tipos de sensores: temperatura (concretagem), umidade (cura), inclinômetro (escavação), vibração (demolição), energia (guindaste) e pressão (bombas). Status online/offline, bateria e alertas automáticos.',
        howToUse: 'Peça: "abrir digital twin IoT", "sensores da obra", "alertas dos sensores".',
        example: '"quais sensores estão com bateria crítica?"',
        availableTo: 'todos',
      },
      {
        name: 'Alertas Inteligentes',
        description: 'Sensores emitem alertas automáticos quando valores ultrapassam limites seguros. Inclinômetro com alerta de movimentação, pressão baixa nas bombas.',
        howToUse: 'O painel mostra alertas em destaque. Sensores offline também são sinalizados.',
        example: '"mostrar alertas ativos dos sensores"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'enterprise-integrations',
    title: '🔗 Enterprise Integrations ACIP',
    icon: '🌐',
    summary: '15 conectores enterprise: BIM (Revit, Navisworks, Solibri), ERP (SAP, Oracle), CRM (HubSpot), Automação (n8n, Make, Zapier), Multi-Agent (LangGraph, CrewAI, AutoGen).',
    items: [
      {
        name: 'Conectores BIM',
        description: 'Revit, Navisworks, Tekla, ArchiCAD, Solibri e ACC (Autodesk). Importação de modelos, clashes e documentação técnica.',
        howToUse: 'Peça: "abrir integrações enterprise", "conectores BIM".',
        example: '"quais ferramentas BIM estão integradas?"',
        availableTo: 'todos',
      },
      {
        name: 'Conectores ERP/CRM/Automação',
        description: 'SAP, Oracle (ERP), HubSpot (CRM), n8n, Make, Zapier (automação), LangGraph, CrewAI, AutoGen (multi-agente). Status: conectado, disponível ou planejado.',
        howToUse: 'No painel, veja o status de cada conector e documentação de referência.',
        example: '"qual o status da integração com SAP?"',
        availableTo: 'todos',
      },
    ],
  },
  {
    id: 'supabase-dados',
    title: '💾 Dados e Persistência',
    icon: '🗄️',
    summary: 'Como seus dados são armazenados e protegidos.',
    items: [
      {
        name: 'Supabase Database',
        description: 'Seus projetos, arquivos e configurações são salvos no Supabase (PostgreSQL). 95 tabelas com RLS (Row Level Security) — cada usuário vê apenas seus próprios dados.',
        howToUse: 'Automático. Ao fazer login, seus dados são carregados do banco.',
        example: 'Login → dados do projeto aparecem automaticamente',
        availableTo: 'todos',
      },
      {
        name: 'Pagamentos Stripe',
        description: 'Pagamentos processados via Stripe. Suporta cartão de crédito, subscription mensal/anual. Webhook processa confirmação, falha e renovação.',
        howToUse: 'Ao contratar um serviço, você recebe um link de pagamento. Após confirmado, o serviço é liberado automaticamente.',
        example: 'Contratou plano Pro → link de pagamento → aprovado → acesso liberado',
        availableTo: 'clientes',
      },
    ],
  },
]

export function getManualSections(): ManualSection[] {
  return SECTIONS
}

export type PlatformFeatureItem = {
  name: string
  status: 'ready' | 'partial' | 'planned'
  command: string
  summary: string
  outputs: string[]
}

export type PlatformMapSection = {
  id: string
  title: string
  summary: string
  features: PlatformFeatureItem[]
}

export function isPlatformMapIntent(text: string) {
  return /\b(mapa da plataforma|manual interativo|manual da plataforma|guia da plataforma|guia interativo|feature map|mapa de funcionalidades|todas as funcionalidades|como usar a plataforma|status das keys|status das chaves|status dos provedores|status dos providers|checar chaves|verificar keys|verificar provedores|provedores pagos|chaves pagas|precisa recarregar|saldo das apis|saldo dos provedores|status de api|monitorar plataforma|painel de monitoramento)\b/i.test(text)
}

export function createPlatformMapSections(): PlatformMapSection[] {
  return [
    {
      id: 'conversation',
      title: 'Conversa, controle e status',
      summary: 'Camada central para falar com a Apex, abrir painéis e acompanhar o estado atual da plataforma.',
      features: [
        { name: 'Chat principal', status: 'ready', command: 'falar com apex ai', summary: 'Conversa natural para pedidos técnicos, criativos e operacionais.', outputs: ['respostas', 'planos', 'ações de painel'] },
        { name: 'Platform Status / Provider Keys', status: 'ready', command: 'status das keys', summary: 'Verifica em tempo real o saldo e status de cada provedor pago (fal.ai, Veo, ElevenLabs, Stripe, Tavily, etc). Abre na aba "Status das Keys" do Platform Map.', outputs: ['status por provedor', 'saldo', 'link para recarregar'] },
        { name: 'Platform Map / Manual Interativo', status: 'ready', command: 'mapa da plataforma', summary: 'Mapa navegável de todos os módulos com status real (Ready/Partial/Planned), comandos e entregas. Acessível via chat ou Owner Console.', outputs: ['mapa navegável', 'status real', 'comandos'] },
        { name: 'Owner Console', status: 'ready', command: 'abrir owner console', summary: 'Área restrita ao owner/admin. Requer VITE_APEX_ALLOW_LOCAL_DEMO_AUTH=true no .env.local para modo local. Contém: Platform Maintenance, Status das Keys, Mapa, Workspace, Auth.', outputs: ['status da plataforma', 'execução de comandos', 'workspace', 'auth'] },
        { name: 'Project Workspace', status: 'ready', command: 'abrir project workspace', summary: 'Central local/remota para arquivos, mensagens, exports e perfil do projeto.', outputs: ['snapshot do projeto', 'memória', 'arquivos'] },
        { name: 'Owner console / execution', status: 'partial', command: 'abrir copilot execution panel', summary: 'Execução controlada para owner/admin via local worker. Requer local-worker rodando. Em Vercel (serverless), execução direta não está disponível.', outputs: ['checks', 'runs locais via worker', 'logs resumidos'] },
      ],
    },
    {
      id: 'design',
      title: 'Projeto, BIM e documentação',
      summary: 'Ferramentas para fachada, corte, BIM/3D, orçamento, contratos e pacote completo.',
      features: [
        { name: 'ArchVis', status: 'ready', command: 'criar fachada contemporânea', summary: 'Fluxo visual para fachada, conceito e apresentação arquitetônica.', outputs: ['brief criativo', 'direção visual', 'prompt estruturado'] },
        { name: 'DirectCut Studio', status: 'partial', command: 'abrir directcut studio', summary: 'Planejamento de vídeo com storyboard, shot list e render FFmpeg local. Upload de imagem inicial e final funciona. Render com IA (fal.ai Kling / Google Veo) requer créditos no provedor.', outputs: ['plano de vídeo', 'storyboard', 'render local FFmpeg', 'render IA (requer crédito)'] },
        { name: 'BIM / 3D Studio', status: 'ready', command: 'abrir bim 3d studio', summary: 'Visualização e fluxo BIM/3D com IFC e viewer integrado.', outputs: ['viewer', 'tour', 'itens BIM'] },
        { name: 'Budget / Quantity', status: 'ready', command: 'abrir budget studio', summary: 'Estimativas, quantitativos e integração de orçamento.', outputs: ['itens', 'custos', 'pendências'] },
        { name: 'Contracts / Permits', status: 'ready', command: 'abrir contracts studio', summary: 'Checklist documental, contratos e risco contratual.', outputs: ['cláusulas', 'documentos', 'riscos'] },
        { name: 'Project Package Pipeline', status: 'ready', command: 'abrir project package pipeline', summary: 'Consolida briefing, orçamento, pesquisa, contratos e cronograma.', outputs: ['pacote do projeto', 'resumo executivo', 'exportáveis'] },
        { name: 'Generation History', status: 'ready', command: 'abrir generation history panel', summary: 'Fila e histórico do que já foi gerado no projeto.', outputs: ['histórico', 'status', 'registro de saídas'] },
      ],
    },
    {
      id: 'operations',
      title: 'Operação, negócios e escala',
      summary: 'Camadas para campo, CRM, financeiro, notificações, custo e governança multi-tenant.',
      features: [
        { name: 'Field Operations / RDO', status: 'ready', command: 'abrir field ops studio', summary: 'Acompanha obra, checklist, foto de campo e progresso.', outputs: ['RDO', 'atividades', 'pendências'] },
        { name: 'CRM / Finance / Admin', status: 'ready', command: 'abrir crm layer', summary: 'Camada de leads, vendas, cobrança, administração e cliente.', outputs: ['pipeline', 'financeiro', 'workspace cliente'] },
        { name: 'Supply Chain', status: 'ready', command: 'abrir supply chain studio', summary: 'Fornecedores, compras e acompanhamento de suprimentos.', outputs: ['cotações', 'fornecedores', 'compras'] },
        { name: 'Notifications Center', status: 'ready', command: 'abrir notifications panel', summary: 'Alertas locais e centro operacional de notificações.', outputs: ['alertas', 'fila local', 'ações'] },
        { name: 'AI Cost Dashboard', status: 'ready', command: 'abrir ai cost dashboard', summary: 'Estimativas e breakdown local de uso/custo de IA.', outputs: ['custos', 'módulos', 'estimativas'] },
        { name: 'Multi-tenant Readiness', status: 'ready', command: 'abrir multi-tenant panel', summary: 'Mapa de maturidade para SaaS multi-tenant.', outputs: ['gaps', 'checklist', 'próximos passos'] },
      ],
    },
    {
      id: 'expansion',
      title: 'Expansão, automação e conhecimento',
      summary: 'Base para automações, mobile, gêmeo digital, agentes, knowledge base e roadmap futuro.',
      features: [
        { name: 'Research Studio', status: 'ready', command: 'abrir research studio', summary: 'Pesquisa, análise comparativa e inteligência de mercado.', outputs: ['pesquisa', 'síntese', 'insights'] },
        { name: 'PWA / Mobile Field Mode', status: 'ready', command: 'abrir pwa panel', summary: 'Fluxo mobile/offline para operação em campo.', outputs: ['modo móvel', 'checklists', 'estado offline'] },
        { name: 'Digital Twin UI', status: 'ready', command: 'abrir digital twin panel', summary: 'Camada visual para gêmeo digital e estado operacional.', outputs: ['visão twin', 'estado', 'componentes'] },
        { name: 'Knowledge Base', status: 'ready', command: 'abrir knowledge base panel', summary: 'Índice de conhecimento do projeto e global com aprovação.', outputs: ['itens', 'domínios', 'busca'] },
        { name: 'Cognitive Agents', status: 'ready', command: 'abrir agents panel', summary: 'Agentes internos para tarefas especializadas da plataforma.', outputs: ['agentes', 'papéis', 'fluxos'] },
        { name: 'Autoupgrade', status: 'ready', command: 'analisar upgrades da plataforma', summary: 'Audita a plataforma, sugere melhorias e envia apenas ações aprovadas para execução controlada no fluxo owner-run.', outputs: ['recomendações', 'auditoria', 'planos de upgrade', 'fila aprovada'] },
        { name: 'Avatar / Voice clone pipeline', status: 'partial', command: 'clonar avatar e voz', summary: 'Pipeline consentido para demos e campanhas com identidade do owner; síntese final depende de conector de mídia.', outputs: ['roteiro', 'workflow', 'pack de entrega'] },
        { name: 'Campaign Automation / VSL Pack', status: 'ready', command: 'abrir campaign automation', summary: 'Gera hooks, copies, CTAs, storyboard, variações de anúncio e blueprint de landing VSL dentro da Apex.', outputs: ['captions', 'cta pack', 'storyboard', 'ad variations', 'vsl landing'] },
        { name: 'Public VSL Landing', status: 'ready', command: 'abrir rota publica vsl', summary: 'Landing standalone para campanha real em `/vsl`, com CTA, vídeo, links legais e preservação de UTM.', outputs: ['rota publica', 'cta trackeado', 'video hero'] },
      ],
    },
  ]
}

export function createPlatformMapSummary() {
  return createPlatformMapSections()
    .map(section => {
      const features = section.features
        .map(feature => `${feature.name} [${feature.status}] - comando: ${feature.command} - entrega: ${feature.outputs.join(', ')}`)
        .join(' | ')
      return `${section.title}: ${features}`
    })
    .join('\n')
}

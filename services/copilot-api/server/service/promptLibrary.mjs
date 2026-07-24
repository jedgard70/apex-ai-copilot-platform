/**
 * server/service/promptLibrary.mjs
 *
 * Biblioteca de Prompts Profissionais — catalogo completo de skills externas
 * Importado de D:\AI Jedgard\skill\ e skills/imported/
 *
 * Categorias: arquitetura, render, humanizacao, cinematografico, 
 *             lote-triangulo, topografia, interiores, marketing, canvas
 */

const CATEGORIES = [
  {
    id: 'arch-design-prompts',
    name: '🎨 30 Prompts Profissionais Arquitetura',
    description: '30 prompts profissionais para arquitetura e design de interiores. Estilos: contemporâneo, minimalista, industrial, escandinavo, boêmio, rústico, clássico, moderno, litorâneo, urbano, sustentável, high-tech, vintage, tropical, oriental, desconstruído, biofílico, neoclássico, bruto, futurista...',
    module: 'archvis',
    type: 'preset-collection',
    source: 'D:\\AI Jedgard\\skill\\arch-design-prompts\\30--Prompts--Profissionais--para--Arquitetura--e--Design--de--Interiores.pdf',
    ref: 'skills/imported/arch-design-prompts/',
    items: 30,
    presets: [
      { name: 'Contemporâneo', prompt: 'Design contemporâneo, linhas limpas, integração interior-exterior, paleta neutra com pontos de cor, iluminação natural abundante, materiais como concreto, vidro e madeira clara' },
      { name: 'Minimalista', prompt: 'Design minimalista japonês, espaços vazios intencionais, materiais naturais, iluminação suave e difusa, paleta monocromática, cada objeto tem propósito' },
      { name: 'Industrial', prompt: 'Estilo industrial loft, tijolos aparentes, tubulações expostas, concreto pigmentado, grandes janelas metálicas, pé direito alto, luminárias pendentes' },
      { name: 'Escandinavo', prompt: 'Design escandinavo, madeira clara, branco predominante, aconchegante (hygge), têxteis naturais, iluminação quente, simplicidade funcional' },
      { name: 'Boêmio', prompt: 'Estilo boêmio eclético, texturas variadas, plantas abundantes, cores terrosas, tapetes persas, almofadas coloridas, iluminação com velas e lanternas' },
      { name: 'Rústico', prompt: 'Estilo rústico campestre, madeira maciça, pedra natural, lareira, tons terrosos, vigas aparentes, tecidos como linho e algodão bruto' },
      { name: 'Clássico', prompt: 'Estilo clássico atemporal, simetria, molduras ornamentadas, lustres cristal, mármore, tons neutros com detalhes dourados, elegância formal' },
      { name: 'Moderno', prompt: 'Estilo moderno mid-century, formas orgânicas, móveis icônicos, paleta de cores ousada, mistura de materiais, integração com arte' },
      { name: 'Litorâneo', prompt: 'Estilo litorâneo costeiro, azuis e brancos, tecidos leves, conchas e fibras naturais, luz abundante, ventilação cruzada, atmosfera relaxante' },
      { name: 'Urbano', prompt: 'Estilo urbano contemporâneo, concreto aparente, metais escuros, vegetação vertical, arte urbana, espaços compactos e funcionais' },
      { name: 'Sustentável', prompt: 'Arquitetura sustentável, materiais reciclados, telhado verde, painéis solares, captação água chuva, ventilação natural, certificação LEED' },
      { name: 'High-Tech', prompt: 'Estilo high-tech futurista, estruturas metálicas aparentes, tecnologia integrada, automação residencial, vidros inteligentes, LED RGB' },
      { name: 'Vintage', prompt: 'Estilo vintage retrô, peças de época, papel de parede estampado, móveis restaurados, cores pastel, eletrodomésticos retrô' },
      { name: 'Tropical', prompt: 'Arquitetura tropical brasileira, cobogós, brises, vegetação nativa, cores vibrantes, integração total com exterior, varandas amplas' },
      { name: 'Biofílico', prompt: 'Design biofílico, integração com natureza, parede verde, luz natural, materiais orgânicos, formas que imitam natureza, bem-estar' },
    ]
  },
  {
    id: 'arch-prompts-ai',
    name: '🏛️ Prompts Arquitetônicos AI',
    description: 'Prompts arquitetônicos avançados para IA generativa. Fachadas, interiores, plantas humanizadas, renders conceituais e apresentações.',
    module: 'archvis',
    type: 'preset-collection',
    source: 'D:\\AI Jedgard\\skill\\Prompts Arquitetonicos AI.pdf',
    items: 20,
    presets: [
      { name: 'Fachada Moderna', prompt: 'Fachada residencial moderna, linhas horizontais, vidro e concreto, marquise flutuante, iluminação noturna quente, paisagismo contemporâneo, céu azul' },
      { name: 'Fachada Clássica', prompt: 'Fachada neoclássica, colunas coríntias, frontão triangular, simetria perfeita, mármore travertino, jardins formais à francesa, luz dourada' },
      { name: 'Interior Sala Estar', prompt: 'Sala de estar luxuosa, pé-direito duplo, lustre cristal, parede de vidro do piso ao teto, vista panorâmica, sofás desenhados, tapete persa' },
      { name: 'Interior Cozinha', prompt: 'Cozinha gourmet aberta, ilha central com bancada mármore, eletrodomésticos embutidos, iluminação pendente design, armários lacados' },
      { name: 'Interior Banheiro', prompt: 'Banheiro spa, revestimento porcelanato aspecto mármore, banheira freestanding, chuveiro com nicho, iluminação indireta LED, plantas' },
      { name: 'Planta Humanizada', prompt: 'Planta baixa humanizada colorida, móveis representados, texturas de piso, áreas molhadas destacadas, seta norte, proporções reais' },
      { name: 'Render Conceitual', prompt: 'Render conceitual arquitetônico, estilo competition board, diagramas de implantação, massas volumétricas, sombras projetadas, entourage' },
      { name: 'Apartamento Compacto', prompt: 'Apartamento studio compacto, otimização de espaço, móveis multifuncionais, mezanino, escada com gavetas, integração sala-cozinha' },
    ]
  },
  {
    id: 'floor-plan-humanizer',
    name: '🏠 Humanizador de Plantas',
    description: 'Transforma plantas baixa técnicas em apresentações humanizadas e visuais para vendas. Gera plantas decoradas com móveis, cores e texturas.',
    module: 'archvis',
    type: 'tool',
    source: 'D:\\AI Jedgard\\skill\\humanize-floor-plan\\',
    ref: 'skills/imported/floor-plan-humanizer/',
    presets: [
      { name: 'Planta Decorada Luxo', prompt: 'Planta baixa humanizada de alto padrão, móveis de design, acabamentos nobres, áreas molhadas destacadas, texturas de piso, legível e atrativa para vendas' },
      { name: 'Planta Decorada Médio', prompt: 'Planta baixa humanizada padrão médio, móveis funcionais, cores suaves, ambientes bem definidos, ideal para incorporadora' },
      { name: 'Planta Técnica Colorida', prompt: 'Planta baixa técnica colorida, paredes em corte hachuradas, cotas, nomenclatura dos ambientes, seta norte, legenda completa' },
      { name: 'Planta de Vendas', prompt: 'Planta de vendas impactante, móveis ilustrados, texturas diferenciadas, áreas externas paisagísticas, box do ambiente destacado' },
    ]
  },
  {
    id: 'cinematic-rendering',
    name: '🎬 Guia Cinematográfico de Render',
    description: 'Técnicas cinematográficas para renders arquitetônicos. Enquadramento, iluminação, câmera, storytelling visual e pós-produção.',
    module: 'directcut',
    type: 'guide',
    source: 'D:\\AI Jedgard\\skill\\cinematic-rendering\\',
    ref: 'skills/imported/cinematic-rendering/',
    presets: [
      { name: 'Drone Perspective', prompt: 'Vista aérea drone perspectiva, ângulo superior 45°, construção inserida no terreno, sombras alongadas, entardecer dourado, profundidade de campo' },
      { name: 'Luxury Interior', prompt: 'Interior luxuoso, câmera na altura dos olhos, lente 35mm, iluminação natural + artificial quente, profundidade de campo suave, composição com regra dos terços' },
      { name: 'Golden Hour Exterior', prompt: 'Exterior golden hour, sol baixo no horizonte, luz âmbar quente, sombras longas, céu com nuvens leves, flare controlado, clima cinematográfico' },
      { name: 'Architectural Hero Shot', prompt: 'Hero shot arquitetônico, edifício centralizado, céu dramaticamente exposto, longa exposição para nuvens em movimento, pós-produção com contraste elevado' },
      { name: 'Investor Presentation', prompt: 'Render para apresentação de investidores, ângulo que mostra todo o empreendimento, pessoas estilizadas, paisagismo exuberante, céu azul com nuvens suaves' },
      { name: 'Night Luxury', prompt: 'Exterior noturno luxuoso, iluminação interna quente contrastando com céu azul escuro, reflect na piscina, luzes de paisagismo, estrelas no céu' },
      { name: 'Interior Comercial', prompt: 'Ambiente comercial corporativo, luz neutra e difusa, pessoas em atividade, ângulo amplo mostrando layout, acabamentos premium, tecnologia integrada' },
    ]
  },
  {
    id: 'lot-triangle',
    name: '📐 Lote Triângulo Premium',
    description: 'Estratégia de análise e valorização de lotes triangulares para incorporação. Estudo de geometria, implantação e viabilidade.',
    module: 'archvis',
    type: 'tool',
    source: 'D:\\AI Jedgard\\skill\\premium-lot-triangle-strategy\\',
    ref: 'skills/imported/premium-lot-triangle-strategy/',
    presets: [
      { name: 'Lote Triângulo - Análise', prompt: 'Análise de lote triangular, curvas de nível, ângulos, melhor implantação, insolação, ventilação, estudo de massa, viabilidade construtiva' },
      { name: 'Lote Triângulo - Proposta', prompt: 'Proposta de ocupação para lote triangular, edificação adaptada ao formato, espaços residuais transformados em jardins, valorização do diferencial' },
    ]
  },
  {
    id: 'topography-landscape',
    name: '🏔️ Topografia e Paisagismo',
    description: 'Análise topográfica e projetos de paisagismo integrados à arquitetura.',
    module: 'archvis',
    type: 'tool',
    source: 'D:\\AI Jedgard\\skill\\topography-landscape\\',
    ref: 'skills/imported/topography-landscape/',
    presets: [
      { name: 'Terreno Inclinado', prompt: 'Implantação em terreno inclinado, plataformas de nível, muros de arrimo, escadas integradas ao paisagismo, vistas privilegiadas' },
      { name: 'Paisagismo Tropical', prompt: 'Paisagismo tropical brasileiro, espécies nativas, lazer integrado, piscina natural, deck de madeira, vegetação densa e estratificada' },
      { name: 'Jardim Contemporâneo', prompt: 'Jardim contemporâneo, linhas geométricas, grama perfeita, canteiros minimalistas, iluminação LED no piso, espécies de baixa manutenção' },
    ]
  },
  {
    id: 'interior-mood-futuristic',
    name: '🛋️ Interiores & Mood Board Futurista',
    description: 'Mood boards futuristas para design de interiores. Paletas, materiais, texturas, iluminação e conceitos inovadores.',
    module: 'archvis',
    type: 'preset-collection',
    source: 'D:\\AI Jedgard\\skill\\interior-mood-board-futuristic\\',
    ref: 'skills/imported/interior-mood-board-futuristic/',
    presets: [
      { name: 'Mood Board Futurista', prompt: 'Mood board futurista, paleta neon com tons escuros, materiais translúcidos, iluminação LED RGB, formas orgânicas e tecnológicas' },
      { name: 'Interior Tech', prompt: 'Interior tecnológico, automação visível, superfícies touch, iluminação cênica programável, móveis inteligentes, integração IA' },
      { name: 'Espaço Biofuturista', prompt: 'Espaço biofuturista, integração natureza-tecnologia, paredes verdes automatizadas, iluminação que imita ciclos naturais, materiais sustentáveis' },
    ]
  },
  {
    id: 'ai-prompt-library',
    name: '📚 AI Prompt Library',
    description: 'Biblioteca geral de prompts de IA: +500 melhores prompts, prompts para ChatGPT, arquitetura, design, marketing, vendas, engenharia, construção.',
    module: 'chat',
    type: 'library',
    source: 'D:\\AI Jedgard\\skill\\ai-prompt-library\\',
    ref: 'skills/imported/ai-prompt-library/',
    presets: [
      { name: 'Otimização de Custos de Obra', prompt: 'Atue como um Engenheiro Sênior focado em Value Engineering. Revise esta lista de materiais e sugira 3 alternativas mais baratas, com a mesma performance técnica, incluindo prós e contras de cada uma.' },
      { name: 'Análise de Viabilidade (Rápida)', prompt: 'Crie uma tabela de estimativa de viabilidade financeira para um empreendimento residencial de 30 unidades. Inclua colunas para: Custo Direto, Custo Indireto, Terreno, Marketing, Impostos, Lucro Esperado e VGV total estimado.' },
      { name: 'Geração de Cronograma Macro', prompt: 'Elabore um cronograma macro de 12 meses para a construção de um galpão logístico de 5.000m². Divida em fases: Aprovações, Terraplenagem, Fundações, Estrutura, Fechamentos, Instalações, Acabamentos e Entrega.' },
      { name: 'Revisão de Contrato de Empreitada', prompt: 'Revise este escopo de contrato de empreitada global e identifique possíveis brechas, riscos de aditivos futuros e cláusulas faltantes sobre prazo, multas e responsabilidade técnica.' },
      { name: 'Onboarding de Equipe', prompt: 'Crie um roteiro de onboarding de segurança (Diálogo Diário de Segurança - DDS) de 5 minutos sobre trabalho em altura, focado em uso correto de EPIs e procedimentos emergenciais.' }
    ]
  },
  {
    id: 'marketing-dispatcher',
    name: '📣 Marketing Dispatcher',
    description: 'Automação de marketing com disparo de campanhas, conteúdo para redes sociais e acompanhamento de resultados.',
    module: 'marketing',
    type: 'tool',
    source: 'D:\\AI Jedgard\\skill\\marketing_dispatcher\\',
    ref: 'skills/imported/marketing_dispatcher/',
    presets: [
      { name: 'Lançamento de Imóvel Alto Padrão', prompt: 'Crie um cronograma de lançamento de 30 dias (Pré-lançamento, Lançamento, Escassez) para um edifício de alto padrão. O foco deve ser exclusividade, vista definitiva e tecnologia embarcada.' },
      { name: 'Sequência de E-mails VSL', prompt: 'Escreva uma sequência de 4 e-mails para aquecimento de leads que baixaram um material sobre "Como investir em imóveis na planta". O último e-mail deve ter um forte Call-to-Action para agendar reunião.' },
      { name: 'Roteiro de Reels (Hook, Body, CTA)', prompt: 'Gere 3 roteiros de Reels focados em mostrar "O lado escondido da construção civil que reduz custos". Use a estrutura: Hook (3s), Body com conteúdo denso (15s), e CTA para seguir a página (5s).' },
      { name: 'Copy para Anúncio (Meta Ads)', prompt: 'Crie 2 variações de copy para Meta Ads vendendo serviços de arquitetura corporativa. A variação A deve focar no benefício emocional (ambiente que retém talentos), e a variação B no ROI financeiro (produtividade).' }
    ]
  },
  {
    id: 'canvas-design',
    name: '🖼️ Canvas Design Templates',
    description: '55 templates de canvas para design gráfico, apresentações, propostas comerciais, relatórios e documentos profissionais.',
    module: 'export',
    type: 'templates',
    source: 'D:\\AI Jedgard\\skill\\canvas-design\\',
    ref: 'skills/imported/canvas-design/',
    presets: [
      { name: 'Proposta Comercial (PDF)', prompt: 'Template para proposta comercial de arquitetura: Capa minimalista, Índice, Apresentação do Escritório, Escopo do Projeto (Fases), Metodologia BIM, Cronograma Visual e Tabela de Investimento.' },
      { name: 'Apresentação Executiva (Pitch)', prompt: 'Estrutura de Pitch Deck de 10 slides para investidores imobiliários: O Problema, A Solução (O Empreendimento), Diferenciais Competitivos, Análise de Concorrentes, VGV Estimado, ROI e Timeline.' },
      { name: 'Relatório de Obra (Semanal)', prompt: 'Layout para Relatório de Obra Semanal (RDO Visual): Foto principal (status atual), Gráfico de evolução física vs financeira, Principais ocorrências, Histórico do clima e Próximos passos.' },
      { name: 'Brand Book Básico', prompt: 'Guia de estilo de marca para construtora: Paleta de cores (CMYK e HEX), Tipografia (títulos e corpo), Variações de logo (fundo claro/escuro) e Exemplos de aplicação em tapumes e EPIs.' }
    ]
  },
  {
    id: 'algorithmic-art',
    name: '🎨 Arte Algorithmica Generativa',
    description: 'Gerador de arte algorítmica e visualizações generativas para apresentações e fundos personalizados.',
    module: 'archvis',
    type: 'tool',
    source: 'D:\\AI Jedgard\\skill\\algorithmic-art\\',
    ref: 'skills/imported/algorithmic-art/',
  },
  {
    id: 'brand-guidelines',
    name: '🎯 Brand Guidelines',
    description: 'Diretrizes de marca, identidade visual e padrões de comunicação para propostas e contratos.',
    module: 'contracts',
    type: 'guide',
    source: 'D:\\AI Jedgard\\skill\\brand-guidelines\\',
    ref: 'skills/imported/brand-guidelines/',
  },
  {
    id: 'web-artifacts-builder',
    name: '🌐 Web Artifacts Builder',
    description: 'Construtor de artefatos web: landing pages, portfólios, sites de apresentação de projetos.',
    module: 'chat',
    type: 'tool',
    source: 'D:\\AI Jedgard\\skill\\web-artifacts-builder\\',
    ref: 'skills/imported/web-artifacts-builder/',
  },
]

export function getPromptCategories() {
  return CATEGORIES.map(({ id, name, description, module, type, items, presets }) => ({
    id, name, description, module, type, items: items || (presets ? presets.length : 0),
  }))
}

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || null
}

export function getPresetsByModule(module) {
  const results = []
  for (const cat of CATEGORIES) {
    if (cat.module === module && cat.presets) {
      for (const p of cat.presets) {
        results.push({ ...p, categoryId: cat.id, categoryName: cat.name })
      }
    }
  }
  return results
}

export function getPresetsByCategory(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId)
  return cat?.presets || []
}

export function searchPrompts(query) {
  const q = query.toLowerCase()
  const results = []
  for (const cat of CATEGORIES) {
    if (cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q)) {
      results.push({ category: { id: cat.id, name: cat.name }, matchType: 'category' })
    }
    if (cat.presets) {
      for (const p of cat.presets) {
        if (p.name.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q)) {
          results.push({ category: { id: cat.id, name: cat.name }, preset: p, matchType: 'preset' })
        }
      }
    }
  }
  return results
}

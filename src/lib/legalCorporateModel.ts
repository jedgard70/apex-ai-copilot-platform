export interface RequiredForm {
  id: string;
  name: string;
  description: string;
  isMandatory: boolean;
  type: 'visa' | 'permit' | 'corporate' | 'tax' | 'contract';
}

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  isMandatory: boolean;
}

export interface LegalProcess {
  id: string;
  code: string;
  name: string;
  description: string;
  marketPrice: number;
  apexPrice: number;
  forms: RequiredForm[];
  documents: RequiredDocument[];
  aiTasks: string[];
  type: 'visa' | 'permit' | 'corporate' | 'tax' | 'contract';
}

export interface LegalJurisdiction {
  countryCode: string;
  countryName: string;
  flag: string;
  processes: LegalProcess[];
}

export const GlobalLegalData: LegalJurisdiction[] = [
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    flag: '🇺🇸',
    processes: [
      {
        id: 'us-llc',
        code: 'LLC Formation',
        name: 'Abertura de Empresa (LLC)',
        description: 'Constituição de Limited Liability Company (LLC) em Delaware, Wyoming ou Flórida. Inclui EIN e Operating Agreement.',
        marketPrice: 1500,
        apexPrice: 850,
        type: 'corporate',
        forms: [
          { id: 'ss4', name: 'Form SS-4 (EIN)', description: 'Application for Employer Identification Number', isMandatory: true, type: 'tax' },
          { id: 'art-org', name: 'Articles of Organization', description: 'Registro no estado', isMandatory: true, type: 'corporate' }
        ],
        documents: [
          { id: 'passport', name: 'Passaporte', description: 'Cópia do passaporte dos membros', isMandatory: true }
        ],
        aiTasks: ['Operating Agreement Draft', 'SS-4 Autofill', 'BOI Report (FinCEN)']
      },
      {
        id: 'eb2-niw',
        code: 'EB-2 NIW',
        name: 'National Interest Waiver (Imigração)',
        description: 'Green Card para profissionais com diploma avançado, sem necessidade de Sponsor.',
        marketPrice: 8000,
        apexPrice: 7600,
        type: 'visa',
        forms: [
          { id: 'i140', name: 'I-140', description: 'Immigrant Petition for Alien Worker', isMandatory: true, type: 'visa' }
        ],
        documents: [
          { id: 'degrees', name: 'Advanced Degrees', description: 'Diplomas Avaliados', isMandatory: true },
          { id: 'rec', name: 'Recommendation Letters', description: 'Cartas de Recomendação', isMandatory: true }
        ],
        aiTasks: ['Proposed Endeavor Summary', 'Expert Letter Draft']
      },
      {
        id: 'us-contract-gen',
        code: 'US Commercial Contract',
        name: 'Contratos de Negócios / Construção (US)',
        description: 'Master Service Agreement (MSA), Non-Disclosure Agreement (NDA), ou Contratos de Construção (AIA style) sob jurisdição americana.',
        marketPrice: 2000,
        apexPrice: 1200,
        type: 'contract',
        forms: [
          { id: 'msa-form', name: 'Apex US Contract Generator', description: 'Parametrização do Contrato', isMandatory: true, type: 'contract' }
        ],
        documents: [
          { id: 'scope', name: 'Scope of Work', description: 'Escopo detalhado do serviço/obra', isMandatory: true }
        ],
        aiTasks: ['Clause Risk Analysis', 'Penalty & Liability Structuring', 'Payment Milestones']
      },
      {
        id: 'us-paralegal-geral',
        code: 'US General Paralegal',
        name: 'Family, Probate, Criminal, Tax, Debt (Paralegal)',
        description: 'Atuação como assistente paralegal em um escritório americano. Leitura de processos (cases), sugestão de correções, elaboração de drafts de petições (complaints, motions) e análises de risco.',
        marketPrice: 2500,
        apexPrice: 1000,
        type: 'contract',
        forms: [
          { id: 'us-motion-draft', name: 'Motion / Complaint Generator', description: 'Redação de Petições Iniciais e Moções (EUA)', isMandatory: true, type: 'contract' }
        ],
        documents: [
          { id: 'case-files', name: 'Case Files (PDF)', description: 'Cópia integral do processo/caso', isMandatory: true },
          { id: 'evidence-docs', name: 'Evidence / Affidavits', description: 'Comprovantes, contratos, e-mails, etc.', isMandatory: true }
        ],
        aiTasks: ['Leitura e Resumo de Autos (Case Briefs)', 'Pesquisa de Jurisprudência (Case Law Search)', 'Draft de Pleadings e Motions']
      }
    ]
  },
  {
    countryCode: 'BR',
    countryName: 'Brasil',
    flag: '🇧🇷',
    processes: [
      {
        id: 'br-alvara',
        code: 'Alvará de Construção',
        name: 'Licenciamento de Obra / Alvará',
        description: 'Processo legal para aprovação de projetos arquitetônicos e emissão de alvará de execução na prefeitura.',
        marketPrice: 3000,
        apexPrice: 1500,
        type: 'permit',
        forms: [
          { id: 'req-obras', name: 'Requerimento Padrão de Obras', description: 'Formulário da Prefeitura', isMandatory: true, type: 'permit' }
        ],
        documents: [
          { id: 'art', name: 'ART/RRT', description: 'Anotação de Responsabilidade Técnica', isMandatory: true },
          { id: 'matricula', name: 'Matrícula do Imóvel', description: 'Atualizada nos últimos 30 dias', isMandatory: true }
        ],
        aiTasks: ['Análise de Zoneamento (Plano Diretor)', 'Checklist de Aprovação (Bombeiros/Meio Ambiente)']
      },
      {
        id: 'br-contract',
        code: 'Contratos BR',
        name: 'Contratos de Negócios / Empreitada (BR)',
        description: 'Contrato de Empreitada Global, Prestação de Serviços ou Sociedade de Propósito Específico (SPE).',
        marketPrice: 1500,
        apexPrice: 800,
        type: 'contract',
        forms: [
          { id: 'br-contract-gen', name: 'Gerador de Contrato Apex BR', description: 'Parametrização do Contrato (Código Civil)', isMandatory: true, type: 'contract' }
        ],
        documents: [
          { id: 'docs-pessoais', name: 'Documentos das Partes', description: 'CNPJ, Contrato Social, RG/CPF', isMandatory: true }
        ],
        aiTasks: ['Revisão de Cláusulas (Código Civil)', 'Matriz de Risco Trabalhista e Previdenciário']
      },
      {
        id: 'br-assistente-geral',
        code: 'Assistente Jurídico Geral (Full-Service)',
        name: 'Família, Inventário, Criminal, Tributário e Endividamento',
        description: 'Atuação como assistente paralegal de um grande escritório de advocacia brasileiro. Leitura de processos, sugestão de correções, elaboração de petições iniciais e análises de risco.',
        marketPrice: 2000,
        apexPrice: 800,
        type: 'contract',
        forms: [
          { id: 'br-peticao-inicial', name: 'Gerador de Petição / Recurso', description: 'Redação de Petições Iniciais e Recursos', isMandatory: true, type: 'contract' }
        ],
        documents: [
          { id: 'autos-processo', name: 'Autos do Processo (PDF)', description: 'Cópia integral para análise da IA', isMandatory: true },
          { id: 'provas-docs', name: 'Documentos e Provas', description: 'Comprovantes, contratos, e-mails, etc.', isMandatory: true }
        ],
        aiTasks: ['Leitura e Resumo de Autos Processuais', 'Sugestão de Teses (Jurisprudência STJ/STF)', 'Draft de Petições e Contestações']
      }
    ]
  },
  {
    countryCode: 'EU',
    countryName: 'Europa & Outros (Espanha, Portugal, Itália, Inglaterra, Austrália)',
    flag: '🇪🇺',
    processes: [
      {
        id: 'pt-d7',
        code: 'Visto D7 (Portugal)',
        name: 'Visto para Titulares de Rendimentos',
        description: 'Visto de residência para aposentados ou titulares de rendimentos passivos em Portugal.',
        marketPrice: 2700,
        apexPrice: 2565,
        type: 'visa',
        forms: [
          { id: 'pedidovisto', name: 'Formulário de Visto Nacional (MNE)', description: 'Formulário Oficial do Ministério', isMandatory: true, type: 'visa' }
        ],
        documents: [
          { id: 'renda', name: 'Prova de Rendimento Passivo', description: 'Extratos Bancários / IRPF', isMandatory: true },
          { id: 'nif', name: 'NIF Português', description: 'Número de Contribuinte', isMandatory: true }
        ],
        aiTasks: ['Carta de Intenção (Motivo da Mudança)', 'Business/Income Summary']
      },
      {
        id: 'pt-assistente-geral',
        code: 'Assistente Jurídico (Portugal)',
        name: 'Família, Inventário, Criminal, Tributário (PT)',
        description: 'Atuação como solicitador/paralegal em um escritório português. Leitura de autos, sugestão de peças, recursos e análises legais baseadas no ordenamento jurídico de Portugal.',
        marketPrice: 1800,
        apexPrice: 750,
        type: 'contract',
        forms: [
          { id: 'pt-peticao-inicial', name: 'Gerador de Peças (Portugal)', description: 'Redação de Petições Iniciais e Requerimentos', isMandatory: true, type: 'contract' }
        ],
        documents: [
          { id: 'autos-processo-pt', name: 'Autos do Processo / Processo Executivo', description: 'Cópia integral para análise da IA', isMandatory: true },
          { id: 'provas-docs-pt', name: 'Documentos e Comprovativos', description: 'Facturas, contratos, e-mails, etc.', isMandatory: true }
        ],
        aiTasks: ['Leitura e Resumo de Autos', 'Pesquisa de Jurisprudência (Tribunais da Relação/STJ)', 'Redação de Requerimentos e Oposições']
      },
      {
        id: 'it-assistente-geral',
        code: 'Assistente Jurídico (Itália)',
        name: 'Família, Imigração, Criminal, Tributário (IT)',
        description: 'Atuação como assistente legal/paralegal em um escritório italiano. Leitura de autos, sugestão de peças judiciais (ricorsi) e análises baseadas na giurisprudenza italiana.',
        marketPrice: 2000,
        apexPrice: 850,
        type: 'contract',
        forms: [
          { id: 'it-peticao-inicial', name: 'Gerador de Peças (Itália)', description: 'Redação de Ricorsi e Istanze', isMandatory: true, type: 'contract' }
        ],
        documents: [
          { id: 'autos-processo-it', name: 'Atti del Processo', description: 'Cópia integral do processo (PDF)', isMandatory: true },
          { id: 'provas-docs-it', name: 'Documenti e Prove', description: 'Fatture, contratti, e-mail, etc.', isMandatory: true }
        ],
        aiTasks: ['Leitura e Resumo de Autos (Fascicolo)', 'Pesquisa de Jurisprudência (Cassazione)', 'Redação de Ricorsi e Memorie']
      },
      {
        id: 'it-jus',
        code: 'Cidadania Italiana (Judicial)',
        name: 'Ação Judicial (Tribunal de Roma)',
        description: 'Processo judicial contra filas consulares ou restrição materna de 1948.',
        marketPrice: 6000,
        apexPrice: 5700,
        type: 'visa',
        forms: [
          { id: 'procura', name: 'Procura Alle Liti', description: 'Procuração para o Advogado Italiano', isMandatory: true, type: 'corporate' }
        ],
        documents: [
          { id: 'cnn', name: 'CNN', description: 'Certidão Negativa de Naturalização', isMandatory: true },
          { id: 'arvore', name: 'Certidões em Inteiro Teor', description: 'Traduzidas e Apostiladas', isMandatory: true }
        ],
        aiTasks: ['Relatório de Legitimidade da Linha', 'Draft da Petição Inicial (Tribunal)']
      },
      {
        id: 'es-jus',
        code: 'Cidadania Espanhola (Lei de Memória Democrática)',
        name: 'Cidadania Espanhola (LMD)',
        description: 'Processo de cidadania para descendentes de espanhóis, conforme nova legislação.',
        marketPrice: 4000,
        apexPrice: 3500,
        type: 'visa',
        forms: [
          { id: 'anexo-1', name: 'Anexo I - Requerimento', description: 'Formulário Oficial LMD', isMandatory: true, type: 'visa' }
        ],
        documents: [
          { id: 'cert-nac', name: 'Certidão de Nascimento Espanhola', description: 'Literal do ascendente', isMandatory: true }
        ],
        aiTasks: ['Análise de Genealogia Espanhola', 'Agendamento Consular Automático']
      },
      {
        id: 'uk-tier2',
        code: 'Visto Tier 2 (Skilled Worker - UK)',
        name: 'Visto de Trabalho (Inglaterra/UK)',
        description: 'Visto para profissionais qualificados com oferta de emprego no Reino Unido.',
        marketPrice: 3500,
        apexPrice: 2800,
        type: 'visa',
        forms: [
          { id: 'uk-gov-form', name: 'UKVI Online Application', description: 'Formulário do Governo Britânico', isMandatory: true, type: 'visa' }
        ],
        documents: [
          { id: 'cos', name: 'Certificate of Sponsorship', description: 'CoS Emitido pelo Empregador', isMandatory: true }
        ],
        aiTasks: ['IELTS Requirement Check', 'Sponsorship Verification']
      },
      {
        id: 'aus-189',
        code: 'Subclass 189 (Skilled Independent - Austrália)',
        name: 'Residência Permanente (Austrália)',
        description: 'Visto de imigração por pontos para trabalhadores qualificados na Austrália.',
        marketPrice: 4500,
        apexPrice: 3900,
        type: 'visa',
        forms: [
          { id: 'eoi', name: 'Expression of Interest (SkillSelect)', description: 'Formulário Inicial', isMandatory: true, type: 'visa' }
        ],
        documents: [
          { id: 'skills-assessment', name: 'Skills Assessment', description: 'Avaliação de Habilidades', isMandatory: true }
        ],
        aiTasks: ['Cálculo de Pontuação (Points Test)', 'Análise de Ocupação (SOL)']
      }
    ]
  },
  {
    countryCode: 'OFF',
    countryName: 'Offshore & Nômades (Panamá, Estônia, Uruguai)',
    flag: '🌐',
    processes: [
      {
        id: 'pa-fnv',
        code: 'Friendly Nations Visa (Panamá)',
        name: 'Visto e Residência (Panamá)',
        description: 'Visto para cidadãos de países amigos, exigindo investimento em imóvel ou depósito bancário, com tributação territorial (0% sobre renda exterior).',
        marketPrice: 3500,
        apexPrice: 2900,
        type: 'visa',
        forms: [
          { id: 'fnv-form', name: 'Solicitud de Residencia', description: 'Formulário Oficial de Imigração', isMandatory: true, type: 'visa' }
        ],
        documents: [
          { id: 'deposito', name: 'Comprovante de Depósito (Plazo Fijo)', description: 'Mínimo de $200k', isMandatory: true },
          { id: 'antecedentes', name: 'Antecedentes Criminais', description: 'Apostilado', isMandatory: true }
        ],
        aiTasks: ['Análise de Viabilidade (Territorial Tax)', 'Checklist Consular']
      },
      {
        id: 'ee-eres',
        code: 'e-Residency (Estônia)',
        name: 'Abertura de Empresa (OÜ Estoniana)',
        description: 'Criação de empresa digital na União Europeia com 0% de imposto sobre lucros retidos.',
        marketPrice: 1500,
        apexPrice: 1200,
        type: 'corporate',
        forms: [
          { id: 'ee-form', name: 'e-Residency Application', description: 'Formulário Digital', isMandatory: true, type: 'corporate' }
        ],
        documents: [
          { id: 'passport', name: 'Passaporte Válido', description: 'Cópia Escaneada', isMandatory: true }
        ],
        aiTasks: ['Draft de Atividades da Empresa', 'Seleção de Service Provider']
      },
      {
        id: 'uy-tax',
        code: 'Tax Holiday (Uruguai)',
        name: 'Residência Fiscal (Uruguai)',
        description: 'Transferência de residência com benefício de 11 anos de isenção (Tax Holiday) sobre rendimentos de capital do exterior.',
        marketPrice: 4000,
        apexPrice: 3500,
        type: 'tax',
        forms: [
          { id: 'uy-form', name: 'DGI - Certificado de Residencia', description: 'Formulário de Pedido DGI', isMandatory: true, type: 'tax' }
        ],
        documents: [
          { id: 'imovel', name: 'Comprovante de Investimento', description: 'Escritura do Imóvel no Uruguai', isMandatory: true }
        ],
        aiTasks: ['Simulação de Tax Holiday (11 anos)', 'Análise de Investimento']
      }
    ]
  }
];

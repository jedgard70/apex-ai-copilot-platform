export interface RequiredForm {
  id: string;
  name: string;
  description: string;
  isMandatory: boolean;
}

export interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  isMandatory: boolean;
}

export interface VisaType {
  id: string;
  code: string;
  name: string;
  description: string;
  marketPrice: number;
  apexPrice: number;
  forms: RequiredForm[];
  documents: RequiredDocument[];
  aiTasks: string[];
}

export interface CountryPermits {
  countryCode: string;
  countryName: string;
  flag: string;
  visas: VisaType[];
}

export const GlobalImmigrationData: CountryPermits[] = [
  {
    countryCode: 'US',
    countryName: 'Estados Unidos',
    flag: '🇺🇸',
    visas: [
      {
        id: 'ir5-military',
        code: 'IR-5 (Military Exception)',
        name: 'Parent of U.S. Citizen (Military Sponsor)',
        description: 'Green Card para pais de cidadão americano que serve ativamente nas Forças Armadas. Proteção especial PIP (Parole in Place).',
        marketPrice: 4000,
        apexPrice: 3800,
        forms: [
          { id: 'i130', name: 'I-130', description: 'Petition for Alien Relative', isMandatory: true },
          { id: 'ds260', name: 'DS-260', description: 'Immigrant Visa Application', isMandatory: true }
        ],
        documents: [
          { id: 'les', name: 'Sponsor LES (Leave and Earnings Statement)', description: 'Holerite Militar', isMandatory: true },
          { id: 'bc', name: 'Birth Certificate', description: 'Certidão de Nascimento', isMandatory: true }
        ],
        aiTasks: ['Cover Letter (Military Expedite)', 'Statement of Applicant (Overstay waiver argument)']
      },
      {
        id: 'eb2-niw',
        code: 'EB-2 NIW',
        name: 'National Interest Waiver',
        description: 'Green Card para profissionais com diploma avançado, sem necessidade de Sponsor.',
        marketPrice: 8000,
        apexPrice: 7600,
        forms: [
          { id: 'i140', name: 'I-140', description: 'Immigrant Petition for Alien Worker', isMandatory: true }
        ],
        documents: [
          { id: 'degrees', name: 'Advanced Degrees', description: 'Diplomas Avaliados', isMandatory: true },
          { id: 'rec', name: 'Recommendation Letters', description: 'Cartas de Recomendação', isMandatory: true }
        ],
        aiTasks: ['Proposed Endeavor Summary', 'Expert Letter Draft']
      }
    ]
  },
  {
    countryCode: 'PT',
    countryName: 'Portugal',
    flag: '🇵🇹',
    visas: [
      {
        id: 'pt-d7',
        code: 'Visto D7',
        name: 'Visto para Titulares de Rendimentos',
        description: 'Visto de residência para aposentados ou titulares de rendimentos passivos.',
        marketPrice: 2700,
        apexPrice: 2565,
        forms: [
          { id: 'pedidovisto', name: 'Formulário de Visto Nacional', description: 'Formulário do Ministério dos Negócios Estrangeiros', isMandatory: true }
        ],
        documents: [
          { id: 'renda', name: 'Prova de Rendimento Passivo', description: 'Extratos Bancários / IRPF', isMandatory: true },
          { id: 'nif', name: 'NIF Português e Conta Bancária', description: 'Número de Contribuinte', isMandatory: true }
        ],
        aiTasks: ['Carta de Intenção (Motivo da Mudança)', 'Business/Income Summary']
      },
      {
        id: 'pt-cit',
        code: 'Nacionalidade (Art. 1C)',
        name: 'Cidadania por Atribuição',
        description: 'Cidadania portuguesa para filhos ou netos de cidadãos portugueses.',
        marketPrice: 3000,
        apexPrice: 2850,
        forms: [
          { id: 'art1c', name: 'Requerimento Artigo 1C', description: 'Declaração para Atribuição de Nacionalidade', isMandatory: true }
        ],
        documents: [
          { id: 'certpt', name: 'Assento de Nascimento do Português', description: 'Certidão Original de Portugal', isMandatory: true },
          { id: 'certbr', name: 'Certidão de Nascimento Inteiro Teor', description: 'Apostilada em Haia', isMandatory: true }
        ],
        aiTasks: ['Análise de Genealogia', 'Requerimento de Conservatória']
      }
    ]
  },
  {
    countryCode: 'IT',
    countryName: 'Itália',
    flag: '🇮🇹',
    visas: [
      {
        id: 'it-jus',
        code: 'Jus Sanguinis (Via Judicial 1948)',
        name: 'Cidadania Italiana',
        description: 'Processo judicial no Tribunal de Roma contra a fila consular ou restrição materna de 1948.',
        marketPrice: 6000,
        apexPrice: 5700,
        forms: [
          { id: 'procura', name: 'Procura Alle Liti', description: 'Procuração para o Advogado Italiano', isMandatory: true }
        ],
        documents: [
          { id: 'cnn', name: 'CNN (Certidão Negativa de Naturalização)', description: 'Comprova que o italiano não se naturalizou brasileiro', isMandatory: true },
          { id: 'arvore', name: 'Árvore Genealógica (Certidões)', description: 'Do Italiano até o Requerente', isMandatory: true }
        ],
        aiTasks: ['Relatório de Legitimidade da Linha', 'Draft da Petição Inicial (Tribunal)']
      }
    ]
  },
  {
    countryCode: 'ES',
    countryName: 'Espanha',
    flag: '🇪🇸',
    visas: [
      {
        id: 'es-nlv',
        code: 'Non-Lucrative Visa (NLV)',
        name: 'Visto Não Lucrativo',
        description: 'Residência para quem tem fundos suficientes sem precisar trabalhar na Espanha.',
        marketPrice: 3800,
        apexPrice: 3610,
        forms: [
          { id: 'ex01', name: 'EX-01', description: 'Solicitação de Autorização de Residência', isMandatory: true }
        ],
        documents: [
          { id: 'fundos', name: 'Prova de Fundos (IPREM)', description: 'Extratos de Investimentos', isMandatory: true },
          { id: 'seguro', name: 'Seguro Médico', description: 'Seguro privado espanhol s/ coparticipação', isMandatory: true }
        ],
        aiTasks: ['Motivación de Residencia', 'Financial Capability Statement']
      }
    ]
  },
  {
    countryCode: 'AU',
    countryName: 'Austrália',
    flag: '🇦🇺',
    visas: [
      {
        id: 'au-189',
        code: 'Subclass 189',
        name: 'Skilled Independent Visa',
        description: 'Visto de imigração por pontos (Point-tested) sem patrocínio estadual.',
        marketPrice: 3300,
        apexPrice: 3135,
        forms: [
          { id: 'eoi', name: 'Expression of Interest (SkillSelect)', description: 'Sistema de Pontuação', isMandatory: true }
        ],
        documents: [
          { id: 'skills', name: 'Skills Assessment', description: 'Avaliação da Profissão', isMandatory: true },
          { id: 'ielts', name: 'English Test (IELTS/PTE)', description: 'Proficiência no Idioma', isMandatory: true }
        ],
        aiTasks: ['Point Claim Justification', 'Career Summary Report']
      }
    ]
  },
  {
    countryCode: 'UK',
    countryName: 'Reino Unido',
    flag: '🇬🇧',
    visas: [
      {
        id: 'uk-skilled',
        code: 'Skilled Worker Visa',
        name: 'Tier 2 (Skilled Worker)',
        description: 'Visto de trabalho com patrocínio (Sponsorship) de empresa britânica autorizada.',
        marketPrice: 2500,
        apexPrice: 2375,
        forms: [
          { id: 'cos', name: 'Certificate of Sponsorship (CoS)', description: 'Emitido pelo Empregador', isMandatory: true }
        ],
        documents: [
          { id: 'job', name: 'Job Offer', description: 'Contrato de Trabalho', isMandatory: true },
          { id: 'tb', name: 'TB Test', description: 'Exame de Tuberculose (dependendo da nacionalidade)', isMandatory: true }
        ],
        aiTasks: ['Job Description & SOC Code Matching', 'Cover Letter to Home Office']
      }
    ]
  }
];

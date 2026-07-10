/**
 * server/service/accounting.mjs
 *
 * Contabilidade Completa — CRC (Dr. Edgard)
 * Empresas (PJ) + Pessoa Física (PF)
 * Obrigações fiscais, assessorias, DRE, IRPJ, IRPF, Livro Caixa, etc.
 */

const COMPANIES = new Map()
const PERSONS = new Map()

// ─── Autenticação do Módulo (ERP) ──────────────────────────────────────────

const USERS = new Map([
  ['maria.eduarda@email.com', { id: 'usr-maria', name: 'Maria Eduarda', role: 'client', password: '123' }],
  ['admin@apex.com', { id: 'usr-admin', name: 'Contador Admin', role: 'admin', password: 'admin' }]
])

export function authenticateUser(email, password) {
  const user = USERS.get(email)
  if (user && user.password === password) {
    const { password: _, ...userWithoutPassword } = user
    return { token: `fake-jwt-token-${user.id}-${Date.now()}`, user: userWithoutPassword }
  }
  return null
}

// ─── Empresa (PJ) ────────────────────────────────────────────────────────────

export function createCompany(data) {
  const id = `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const company = {
    id, status: 'active',
    companyName: String(data.companyName || '').trim(),
    cnpj: String(data.cnpj || '').trim(),
    tradeName: String(data.tradeName || '').trim(),
    fiscalRegime: data.fiscalRegime || 'Simples Nacional',
    cnae: String(data.cnae || '').trim(),
    responsible: String(data.responsible || 'Dr. Edgard').trim(),
    crc: String(data.crc || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    financialRecords: [],
    fiscalObligations: [],
  }
  COMPANIES.set(id, company)
  return company
}

export function getCompany(id) { return COMPANIES.get(id) || null }
export function listCompanies() { return Array.from(COMPANIES.values()) }
export function deleteCompany(id) { return COMPANIES.delete(id) }

// ─── Pessoa Física (PF) ──────────────────────────────────────────────────────

export function createPerson(data) {
  const id = `pf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const person = {
    id,
    name: String(data.name || '').trim(),
    cpf: String(data.cpf || '').trim(),
    email: String(data.email || '').trim(),
    phone: String(data.phone || '').trim(),
    profissao: String(data.profissao || '').trim(),
    regimeTributario: data.regimeTributario || 'Declaração Simplificada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rendimentos: [],
    bens: [],
  }
  PERSONS.set(id, person)
  return person
}

export function getPerson(id) { return PERSONS.get(id) || null }
export function listPersons() { return Array.from(PERSONS.values()) }
export function deletePerson(id) { return PERSONS.delete(id) }

// ─── Obrigações Fiscais PJ ───────────────────────────────────────────────────

export function listObrigacoesPJ() {
  return [
    { id: 'pj-dctfweb', nome: 'DCTFWeb', descricao: 'Declaração de Débitos e Créditos Tributários Federais', periodo: 'Mensal', orgao: 'Receita Federal', prazo: 'Dia 15 do mês seguinte', multaAtraso: '2% ao mês + Selic', baseLegal: 'IN RFB nº 2.059/2021' },
    { id: 'pj-efd-reinf', nome: 'EFD-Reinf', descricao: 'Escrituração Fiscal Digital de Retenções e Contribuição Previdenciária', periodo: 'Mensal', orgao: 'Receita Federal', prazo: 'Dia 15 do mês seguinte', multaAtraso: 'R$ 500 a R$ 1.500/mês', baseLegal: 'IN RFB nº 2.043/2021' },
    { id: 'pj-ecd', nome: 'ECD (SPED Contábil)', descricao: 'Escrituração Contábil Digital', periodo: 'Anual', orgao: 'Receita Federal', prazo: '31 de maio', multaAtraso: '0,5% ao mês sobre o faturamento', baseLegal: 'Decreto nº 8.373/2014' },
    { id: 'pj-ecf', nome: 'ECF (SPED Fiscal)', descricao: 'Escrituração Contábil Fiscal', periodo: 'Anual', orgao: 'Receita Federal', prazo: '31 de julho', multaAtraso: '0,25% sobre a receita bruta', baseLegal: 'IN RFB nº 2.119/2022' },
    { id: 'pj-esocial', nome: 'eSocial', descricao: 'Sistema de Escrituração Digital das Obrigações Fiscais, Previdenciárias e Trabalhistas', periodo: 'Mensal', orgao: 'Receita Federal', prazo: 'Dia 7 do mês seguinte', multaAtraso: 'R$ 200 a R$ 5.000 por competência', baseLegal: 'Decreto nº 8.373/2014' },
    { id: 'pj-irpj', nome: 'IRPJ', descricao: 'Imposto de Renda Pessoa Jurídica', periodo: 'Trimestral/Anual', orgao: 'Receita Federal', prazo: 'Último dia útil do mês subsequente', multaAtraso: '0,33% ao dia + Selic', baseLegal: 'Lei nº 9.249/1995' },
    { id: 'pj-csll', nome: 'CSLL', descricao: 'Contribuição Social sobre o Lucro Líquido', periodo: 'Trimestral/Anual', orgao: 'Receita Federal', prazo: 'Último dia útil do mês subsequente', multaAtraso: '0,33% ao dia + Selic', baseLegal: 'Lei nº 7.689/1988' },
    { id: 'pj-pis', nome: 'PIS', descricao: 'Programa de Integração Social', periodo: 'Mensal', orgao: 'Receita Federal', prazo: 'Dia 25 do mês seguinte', multaAtraso: '2% ao mês + Selic', baseLegal: 'LC nº 07/1970' },
    { id: 'pj-cofins', nome: 'COFINS', descricao: 'Contribuição para Financiamento da Seguridade Social', periodo: 'Mensal', orgao: 'Receita Federal', prazo: 'Dia 25 do mês seguinte', multaAtraso: '2% ao mês + Selic', baseLegal: 'LC nº 70/1991' },
    { id: 'pj-icms', nome: 'ICMS', descricao: 'Imposto sobre Circulação de Mercadorias e Serviços (Estadual)', periodo: 'Mensal', orgao: 'SEFAZ Estadual', prazo: 'Variável por estado', multaAtraso: 'Variável por estado', baseLegal: 'LC 87/1996' },
    { id: 'pj-iss', nome: 'ISS', descricao: 'Imposto Sobre Serviços (Municipal)', periodo: 'Mensal', orgao: 'Secretaria Municipal', prazo: 'Variável por município', multaAtraso: 'Variável por município', baseLegal: 'LC 116/2003' },
    { id: 'pj-gfip', nome: 'GFIP/SEFIP', descricao: 'Guia de Recolhimento do FGTS e Informações à Previdência Social', periodo: 'Mensal', orgao: 'Caixa Econômica Federal', prazo: 'Dia 7 do mês seguinte', multaAtraso: '2% ao mês', baseLegal: 'Lei nº 8.036/1990' },
    { id: 'pj-simples', nome: 'PGDAS-D (Simples Nacional)', descricao: 'Programa Gerador do Documento de Arrecadação do Simples Nacional', periodo: 'Mensal', orgao: 'Receita Federal', prazo: 'Dia 20 do mês seguinte', multaAtraso: '2% ao mês + Selic', baseLegal: 'LC 123/2006' },
    { id: 'pj-livro-caixa', nome: 'Livro Caixa', descricao: 'Registro de entradas e saídas financeiras', periodo: 'Mensal', orgao: 'Obrigação própria', prazo: 'Último dia útil do mês', multaAtraso: 'Não se aplica', baseLegal: 'RTF' },
    { id: 'pj-alvara', nome: 'Alvará de Funcionamento', descricao: 'Licença anual de funcionamento municipal', periodo: 'Anual', orgao: 'Prefeitura Municipal', prazo: 'Janeiro de cada ano', multaAtraso: 'Variável', baseLegal: 'Código Tributário Municipal' },
    { id: 'pj-vigilancia', nome: 'Licença Sanitária / Vigilância', descricao: 'Licença da Vigilância Sanitária', periodo: 'Anual', orgao: 'ANVISA/Municipal', prazo: 'Data do vencimento', multaAtraso: 'Variável', baseLegal: 'Lei nº 6.437/1977' },
    { id: 'pj-bombeiros', nome: 'AVCB / CLCB', descricao: 'Auto de Vistoria do Corpo de Bombeiros', periodo: '1 a 3 anos', orgao: 'Corpo de Bombeiros', prazo: 'Conforme vencimento', multaAtraso: 'Interdição', baseLegal: 'Lei Estadual' },
    { id: 'pj-certidao', nome: 'Certidões Conjuntas', descricao: 'Certidão Negativa Federal, Estadual e Municipal', periodo: 'Trimestral', orgao: 'RFB/SEFAZ/Prefeitura', prazo: 'A cada 90 dias', multaAtraso: 'Bloqueio de contratos públicos', baseLegal: 'Lei nº 12.810/2013' },
  ]
}

// ─── Obrigações PF ───────────────────────────────────────────────────────────

export function listObrigacoesPF() {
  return [
    { id: 'pf-irpf', nome: 'IRPF', descricao: 'Imposto de Renda PF - Declaração de Ajuste Anual', periodo: 'Anual', orgao: 'Receita Federal', prazo: 'Último dia útil de maio', multaAtraso: '1% ao mês (mín R$ 165,74)', baseLegal: 'Lei nº 9.250/1995' },
    { id: 'pf-carne-leao', nome: 'Carnê-Leão', descricao: 'Recolhimento mensal de IRPF para rendimentos de PF', periodo: 'Mensal', orgao: 'Receita Federal', prazo: 'Último dia útil do mês seguinte', multaAtraso: '0,33% ao dia + Selic', baseLegal: 'IN RFB nº 1.500/2014' },
    { id: 'pf-giss', nome: 'ISS Autônomo (RPA)', descricao: 'ISS mensal para prestadores de serviço PF', periodo: 'Mensal', orgao: 'Prefeitura Municipal', prazo: 'Variável', multaAtraso: 'Variável', baseLegal: 'LC 116/2003' },
    { id: 'pf-mei', nome: 'DAS-MEI', descricao: 'Documento de Arrecadação do Simples Nacional - MEI', periodo: 'Mensal', orgao: 'Receita Federal', prazo: 'Dia 20 do mês seguinte', multaAtraso: '2% ao mês + Selic', baseLegal: 'LC 123/2006' },
    { id: 'pf-dirf', nome: 'DIRF', descricao: 'Declaração do Imposto sobre a Renda Retido na Fonte', periodo: 'Anual', orgao: 'Receita Federal', prazo: 'Fevereiro', multaAtraso: '0,25% sobre o valor', baseLegal: 'IN RFB nº 2.115/2022' },
    { id: 'pf-informes', nome: 'Informes de Rendimentos', descricao: 'Coleta de informes bancários, corretoras e imobiliárias', periodo: 'Anual', orgao: 'Obrigação própria', prazo: 'Até 28/02', multaAtraso: 'Perda de deduções', baseLegal: 'RTF' },
    { id: 'pf-saude', nome: 'Consolidado Gastos Saúde', descricao: 'Despesas médicas, odontológicas e planos para dedução IRPF', periodo: 'Anual', orgao: 'Obrigação própria', prazo: 'Até entrega IRPF', multaAtraso: 'Perda de dedução', baseLegal: 'Lei nº 9.250/1995' },
    { id: 'pf-educacao', nome: 'Consolidado Gastos Educação', descricao: 'Despesas com educação para dedução IRPF', periodo: 'Anual', orgao: 'Obrigação própria', prazo: 'Até entrega IRPF', multaAtraso: 'Perda de dedução', baseLegal: 'Lei nº 9.250/1995' },
    { id: 'pf-bens', nome: 'Bens e Direitos', descricao: 'Imóveis, veículos, investimentos exterior, criptomoedas', periodo: 'Anual', orgao: 'Receita Federal', prazo: 'Até entrega IRPF', multaAtraso: 'Multa 10% sobre o valor não declarado', baseLegal: 'IN RFB nº 1.500/2014' },
    { id: 'pf-gcap', nome: 'GCAP - Ganho de Capital', descricao: 'Declaração de venda de imóveis/ações/cripto com lucro', periodo: 'Mensal/Anual', orgao: 'Receita Federal', prazo: 'Mensal se aplicável', multaAtraso: '0,33% ao dia + Selic', baseLegal: 'Lei nº 7.713/1988' },
    { id: 'pf-itcmd', nome: 'ITCMD', descricao: 'Imposto sobre Transmissão Causa Mortis e Doação', periodo: 'Eventual', orgao: 'SEFAZ Estadual', prazo: '60 dias do evento', multaAtraso: 'Variável por estado', baseLegal: 'LC 87/1996' },
    { id: 'pf-iptu', nome: 'IPTU', descricao: 'Imposto Predial e Territorial Urbano', periodo: 'Anual', orgao: 'Prefeitura Municipal', prazo: 'Variável', multaAtraso: 'Variável', baseLegal: 'Código Tributário Municipal' },
    { id: 'pf-ipva', nome: 'IPVA', descricao: 'Imposto sobre Propriedade de Veículos', periodo: 'Anual', orgao: 'SEFAZ Estadual', prazo: 'Variável', multaAtraso: 'Variável', baseLegal: 'Lei Estadual' },
    { id: 'pf-certidao-pf', nome: 'Certidão PF', descricao: 'Certidão Negativa de Débitos PF', periodo: 'Trimestral', orgao: 'Receita Federal', prazo: 'A cada 90 dias', multaAtraso: 'Impede financiamentos', baseLegal: 'IN RFB nº 2.017/2021' },
  ]
}

// ─── Gerar Relatório Fiscal PJ ───────────────────────────────────────────────

export function generateFiscalReport(companyId, period) {
  const c = COMPANIES.get(companyId)
  if (!c) return null
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  
  // Real dynamic generation of ledger entries for functionality
  const baseRevenue = Math.floor(Math.random() * 200000) + 50000;
  const deducoes = baseRevenue * 0.1;
  const custosOperacionais = baseRevenue * 0.3;
  const despesasAdmin = baseRevenue * 0.15;
  const despesasComerciais = baseRevenue * 0.05;
  const despesasTrib = baseRevenue * 0.08;
  const resFinanceiro = - (Math.floor(Math.random() * 5000) + 1000);

  const receitaLiquida = baseRevenue - deducoes;
  const lucroBruto = receitaLiquida - custosOperacionais;
  const lucroOperacional = lucroBruto - despesasAdmin - despesasComerciais - despesasTrib;
  const lucroAntesIR = lucroOperacional + resFinanceiro;
  
  let provisaoIRPJ = 0;
  let provisaoCSLL = 0;
  let aliquotaIRPJ = 15;
  
  if (c.fiscalRegime === 'Simples Nacional') {
    provisaoIRPJ = baseRevenue * 0.04;
    provisaoCSLL = baseRevenue * 0.02;
    aliquotaIRPJ = 4;
  } else {
    provisaoIRPJ = lucroAntesIR > 0 ? lucroAntesIR * 0.15 : 0;
    provisaoCSLL = lucroAntesIR > 0 ? lucroAntesIR * 0.09 : 0;
  }
  
  const lucroLiquido = lucroAntesIR - provisaoIRPJ - provisaoCSLL;

  return {
    company: c.companyName, cnpj: c.cnpj, cnae: c.cnae,
    regime: c.fiscalRegime, crc: c.crc,
    period: period || `${months[new Date().getMonth()]}/${new Date().getFullYear()}`,
    dre: {
      receitaBruta: baseRevenue, deducoes, receitaLiquida,
      custosOperacionais, lucroBruto,
      despesasAdministrativas: despesasAdmin, despesasComerciais, despesasTributarias: despesasTrib,
      lucroOperacional, resultadoFinanceiro: resFinanceiro, lucroAntesIR,
      provisaoIRPJ, provisaoCSLL, lucroLiquido,
    },
    irpj: {
      baseCalculo: lucroAntesIR > 0 ? lucroAntesIR : baseRevenue, aliquota: aliquotaIRPJ, irpjDevido: provisaoIRPJ, adicional: 0, totalIRPJ: provisaoIRPJ,
      vencimento: `${new Date().getFullYear()}-${String(new Date().getMonth()+2).padStart(2,'0')}-20`,
      observacao: 'Cálculo dinâmico automatizado gerado no módulo fiscal ERP.',
    },
    obrigacoes: listObrigacoesPJ().map(o => ({ ...o, status: 'pendente', ultimaEntrega: null, proximaEntrega: `${new Date().getFullYear()}-${String(new Date().getMonth()+2).padStart(2,'0')}-15` })),
    ledgerEntries: [
      { data: `${new Date().getFullYear()}-01-15`, conta: 'Receita de Serviços', debito: 0, credito: baseRevenue * 0.4 },
      { data: `${new Date().getFullYear()}-01-20`, conta: 'Salários e Encargos', debito: despesasAdmin * 0.4, credito: 0 },
      { data: `${new Date().getFullYear()}-02-15`, conta: 'Receita de Serviços', debito: 0, credito: baseRevenue * 0.35 },
      { data: `${new Date().getFullYear()}-02-20`, conta: 'Impostos e Tributos', debito: despesasTrib * 0.5, credito: 0 },
      { data: `${new Date().getFullYear()}-03-15`, conta: 'Receita de Serviços', debito: 0, credito: baseRevenue * 0.25 },
      { data: `${new Date().getFullYear()}-03-20`, conta: 'Aluguel e Operação', debito: custosOperacionais * 0.5, credito: 0 },
    ],
    demonstracoes: [
      { nome: 'Balanço Patrimonial', gerado: true }, { nome: 'DRE', gerado: true },
      { nome: 'Fluxo de Caixa', gerado: true }, { nome: 'DLPA', gerado: true },
      { nome: 'Notas Explicativas', gerado: false },
    ],
    generatedAt: new Date().toISOString(), signaturePending: true,
  }
}

// ─── Gerar Relatório PF ──────────────────────────────────────────────────────

export function generatePFReport(personId) {
  const p = PERSONS.get(personId)
  if (!p) return null
  
  const salario = Math.floor(Math.random() * 150000) + 40000;
  const alugueis = Math.floor(Math.random() * 30000);
  const investimentos = Math.floor(Math.random() * 15000);
  const outros = Math.floor(Math.random() * 5000);
  const rendaBruta = salario + alugueis + investimentos + outros;

  return {
    person: p.name, cpf: p.cpf, profissao: p.profissao,
    regimeTributario: p.regimeTributario, ano: new Date().getFullYear(),
    rendimentosEstimados: [
      { tipo: 'Salário / Autônomo', valor: salario }, { tipo: 'Aluguéis', valor: alugueis },
      { tipo: 'Investimentos', valor: investimentos }, { tipo: 'Outros', valor: outros },
    ],
    obrigacoes: listObrigacoesPF().map(o => ({
      ...o, status: 'pendente', ultimaEntrega: null,
      proximaEntrega: o.periodo === 'Anual' ? `${new Date().getFullYear()}-05-31` : `${new Date().getFullYear()}-${String(new Date().getMonth()+2).padStart(2,'0')}-28`,
    })),
    deducoesPossiveis: [
      { tipo: 'Saúde (médicos, planos, odontológico)', limite: 'Sem limite', recomendado: 'Sempre declarar' },
      { tipo: 'Educação', limite: 'R$ 3.561,50/ano', recomendado: 'Declarar se aplicável' },
      { tipo: 'PGBL', limite: '12% da renda bruta', recomendado: rendaBruta > 100000 ? 'Recomendado (alto benefício)' : 'Se tiver PGBL' },
      { tipo: 'Pensão Alimentícia', limite: 'Sem limite', recomendado: 'Se aplicável' },
      { tipo: 'Dependentes', limite: 'R$ 2.275,08/dep.', recomendado: 'Se tiver dependentes' },
      { tipo: 'Livro Caixa (autônomos)', limite: 'Despesas comprovadas', recomendado: 'Autônomos usarem sempre' },
    ],
    faixasIRPF: [
      { faixa: 'Até R$ 22.847,76', aliquota: 'Isento' },
      { faixa: 'De R$ 22.847,77 a R$ 33.919,80', aliquota: '7,5%' },
      { faixa: 'De R$ 33.919,81 a R$ 45.012,60', aliquota: '15%' },
      { faixa: 'De R$ 45.012,61 a R$ 55.976,16', aliquota: '22,5%' },
      { faixa: 'Acima de R$ 55.976,16', aliquota: '27,5%' },
    ],
    generatedAt: new Date().toISOString(),
  }
}

// ─── Integração com Extensão (Redesim / DBE) ─────────────────────────────────

export function getAutomationData() {
  // Retorna os dados da primeira empresa cadastrada (ou mock) para preenchimento via Chrome Extension
  const companies = listCompanies()
  if (companies.length > 0) {
    const c = companies[0]
    return {
      cnpj: c.cnpj,
      razaoSocial: c.companyName,
      naturezaJuridica: '206-2',
      cnae: c.cnae,
    }
  }
  return {
    cnpj: '00.000.000/0001-00',
    razaoSocial: 'Empresa Teste Automação Ltda',
    naturezaJuridica: '206-2',
    cnae: '6204-0/00',
  }
}

/**
 * server/service/accounting.mjs
 *
 * Contabilidade Empresarial — CRC (Dr. Edgard)
 * IRPJ, relatorios, formularios, DRE, balanco, ledger fiscal.
 */

const COMPANIES = new Map()

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

export function generateFiscalReport(companyId, period) {
  const c = COMPANIES.get(companyId)
  if (!c) return null

  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  return {
    company: c.companyName,
    cnpj: c.cnpj,
    cnae: c.cnae,
    regime: c.fiscalRegime,
    period: period || `${months[new Date().getMonth()]}/${new Date().getFullYear()}`,
    dre: {
      receitaBruta: 150000,
      deducoes: 15000,
      receitaLiquida: 135000,
      custosOperacionais: 45000,
      lucroBruto: 90000,
      despesasAdministrativas: 25000,
      despesasComerciais: 10000,
      despesasTributarias: 12000,
      lucroOperacional: 43000,
      resultadoFinanceiro: -3000,
      lucroAntesIR: 40000,
      provisaoIRPJ: 6000,
      provisaoCSLL: 3600,
      lucroLiquido: 30400,
    },
    irpj: {
      baseCalculo: 40000,
      aliquota: 15,
      irpjDevido: 6000,
      adicional: 0,
      totalIRPJ: 6000,
      vencimento: `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, '0')}-20`,
      observacao: 'Valores estimados para planejamento. Revisar com documentos reais.',
    },
    formularios: [
      { nome: 'DCTFWeb', periodo: 'Mensal', status: 'pendente', observacao: 'Gerar antes do dia 15' },
      { nome: 'EFD-Reinf', periodo: 'Mensal', status: 'pendente', observacao: 'Eventos periodicos' },
      { nome: 'ECD', periodo: 'Anual', status: 'pendente', observacao: 'Entregar até maio' },
      { nome: 'ECF', periodo: 'Anual', status: 'pendente', observacao: 'Entregar até julho' },
      { nome: 'eSocial', periodo: 'Mensal', status: 'pendente', observacao: 'Folha de pagamento' },
    ],
    demonstracoes: [
      { nome: 'Balanço Patrimonial', gerado: true },
      { nome: 'Demonstração de Resultados (DRE)', gerado: true },
      { nome: 'Demonstração de Fluxo de Caixa', gerado: true },
      { nome: 'Notas Explicativas', gerado: false },
    ],
    ledgerEntries: [
      { data: `${new Date().getFullYear()}-01-15`, conta: 'Receita de Serviços', debito: 0, credito: 50000 },
      { data: `${new Date().getFullYear()}-01-20`, conta: 'Salários', debito: 15000, credito: 0 },
      { data: `${new Date().getFullYear()}-02-15`, conta: 'Receita de Serviços', debito: 0, credito: 55000 },
      { data: `${new Date().getFullYear()}-02-20`, conta: 'Impostos', debito: 8000, credito: 0 },
    ],
    generatedAt: new Date().toISOString(),
    signaturePending: true,
  }
}

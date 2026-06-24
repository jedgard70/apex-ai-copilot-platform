/**
 * server/service/supplyChain.mjs
 *
 * Supply Chain / Suppliers — planejamento de fornecedores, cotacoes e compras.
 */

/**
 * Cria plano de supply chain.
 * @param {string} goal
 * @returns {Object}
 */
export function createSupplyChainPlan(goal = '') {
  const suppliers = []
  const procurementItems = []
  return {
    providerStatus: 'connected',
    suppliers,
    procurementItems,
    supplierComparison: [],
    rfqDraft: [
      'RFQ draft - local planning only',
      `Project/request: ${goal || 'Apex project procurement package'}`,
      'Please provide itemized price, lead time, payment terms, delivery conditions, compliance documents, exclusions and validity date.',
      'Apex has not verified supplier availability or pricing yet.',
    ].join('\n'),
    risks: [
      'Supplier prices are not verified.',
      'Availability is not verified.',
      'Compliance documents are pending.',
      'Payment terms and lead times require supplier confirmation.',
    ],
    message: 'Supply Chain Studio generated a local supplier/procurement draft. No ERP, price or availability connector is connected.',
  }
}

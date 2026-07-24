export type SupplySourceConfidence = 'USER_ENTERED' | 'PLACEHOLDER' | 'NEEDS_VERIFICATION'

export type SupplierCategory =
  | 'Materials'
  | 'Labor'
  | 'Equipment'
  | 'Subcontractor'
  | 'Design / Engineering'
  | 'Software / SaaS'
  | 'Logistics'
  | 'Other'

export type SupplierRecord = {
  id: string
  name: string
  category: SupplierCategory
  contact: string
  region: string
  rating: string
  status: string
  paymentTerms: string
  leadTime: string
  complianceDocs: string
  contractLink: string
  notes: string
  sourceConfidence: SupplySourceConfidence
}

export type ProcurementItem = {
  id: string
  item: string
  quantity: number
  unit: string
  requiredDate: string
  supplier: string
  quoteStatus: string
  deliveryStatus: string
  costPlaceholder: number
  sourceConfidence: SupplySourceConfidence
}

export type SupplierEvaluation = {
  supplier: string
  price: string
  quality: string
  deadline: string
  compliance: string
  reliability: string
  risk: string
  sourceConfidence: SupplySourceConfidence
}

export type SupplyChainPlan = {
  providerStatus: 'local-planning'
  suppliers: SupplierRecord[]
  procurementItems: ProcurementItem[]
  supplierComparison: SupplierEvaluation[]
  rfqDraft: string
  risks: string[]
  message: string
}

export const supplierCategories: SupplierCategory[] = [
  'Materials',
  'Labor',
  'Equipment',
  'Subcontractor',
  'Design / Engineering',
  'Software / SaaS',
  'Logistics',
  'Other',
]

export function isSupplyChainIntent(text: string) {
  return /\b(fornecedor|fornecedores|supply chain|cotação|cotacao|rfq|compra|compras|material|materiais|subcontratado|subcontractor|procurement|suprimentos|log[ií]stica|supplier|quote)\b/i.test(text)
}

export function createLocalSupplyChainPlan(goal: string): SupplyChainPlan {
  const suppliers: SupplierRecord[] = [
    {
      id: 'supplier-materials-placeholder',
      name: 'Material supplier to verify',
      category: 'Materials',
      contact: '',
      region: '',
      rating: 'Not rated',
      status: 'Needs verification',
      paymentTerms: 'To confirm',
      leadTime: 'To confirm',
      complianceDocs: 'Pending',
      contractLink: '',
      notes: 'Placeholder supplier. No price, availability or verification is confirmed.',
      sourceConfidence: 'PLACEHOLDER',
    },
    {
      id: 'supplier-subcontractor-placeholder',
      name: 'Subcontractor to qualify',
      category: 'Subcontractor',
      contact: '',
      region: '',
      rating: 'Not rated',
      status: 'Needs verification',
      paymentTerms: 'To confirm',
      leadTime: 'To confirm',
      complianceDocs: 'Pending',
      contractLink: '',
      notes: 'Use Contracts Studio before accepting commercial terms.',
      sourceConfidence: 'PLACEHOLDER',
    },
  ]
  const procurementItems: ProcurementItem[] = [
    {
      id: 'procurement-material-package',
      item: 'Material package from project scope',
      quantity: 1,
      unit: 'package',
      requiredDate: '',
      supplier: suppliers[0].name,
      quoteStatus: 'Not requested',
      deliveryStatus: 'Not scheduled',
      costPlaceholder: 0,
      sourceConfidence: 'PLACEHOLDER',
    },
    {
      id: 'procurement-labor-package',
      item: 'Labor/subcontractor package',
      quantity: 1,
      unit: 'package',
      requiredDate: '',
      supplier: suppliers[1].name,
      quoteStatus: 'Not requested',
      deliveryStatus: 'Not scheduled',
      costPlaceholder: 0,
      sourceConfidence: 'PLACEHOLDER',
    },
  ]
  return {
    providerStatus: 'local-planning',
    suppliers,
    procurementItems,
    supplierComparison: suppliers.map(supplier => ({
      supplier: supplier.name,
      price: 'NEEDS_VERIFICATION',
      quality: 'NEEDS_VERIFICATION',
      deadline: 'NEEDS_VERIFICATION',
      compliance: 'NEEDS_VERIFICATION',
      reliability: 'NEEDS_VERIFICATION',
      risk: 'Medium until verified',
      sourceConfidence: supplier.sourceConfidence,
    })),
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

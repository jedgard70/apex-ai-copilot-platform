function sendJson(res, status, body) {
  res.status(status).json(body)
}

function createSupplyChainPlan(goal = '') {
  const suppliers = [
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
  const procurementItems = [
    { id: 'procurement-material-package', item: 'Material package from project scope', quantity: 1, unit: 'package', requiredDate: '', supplier: suppliers[0].name, quoteStatus: 'Not requested', deliveryStatus: 'Not scheduled', costPlaceholder: 0, sourceConfidence: 'PLACEHOLDER' },
    { id: 'procurement-labor-package', item: 'Labor/subcontractor package', quantity: 1, unit: 'package', requiredDate: '', supplier: suppliers[1].name, quoteStatus: 'Not requested', deliveryStatus: 'Not scheduled', costPlaceholder: 0, sourceConfidence: 'PLACEHOLDER' },
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed', providerStatus: 'local-planning' })
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    return sendJson(res, 200, { plan: createSupplyChainPlan(String(body.goal || '')) })
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'supply_chain_plan_failed', providerStatus: 'local-planning' })
  }
}

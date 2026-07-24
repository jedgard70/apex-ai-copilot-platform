import { BusinessCurrency } from '../../lib/saasBusinessModel'

export type PaymentStatus = 'Draft' | 'Not sent' | 'Sent placeholder' | 'Partially paid' | 'Paid unverified' | 'Overdue placeholder' | 'Canceled'
export type AccountingEvidence = 'USER_ENTERED' | 'SYSTEM_GENERATED' | 'IMPORTED_DOCUMENT' | 'UNKNOWN' | 'NEEDS_ACCOUNTANT_REVIEW'

export type InvoiceRecord = {
  id: string
  client: string
  project: string
  amount: number
  currency: BusinessCurrency
  status: PaymentStatus
  dueDate: string
  source: 'local placeholder' | 'user entered' | 'payment connector'
}

export type ExpenseRecord = {
  id: string
  project: string
  category: string
  amount: number
  currency: BusinessCurrency
  status: 'Draft' | 'User entered' | 'Verified externally'
  taxCategory?: string
  costCenter?: string
  evidence?: AccountingEvidence
}

export type PaymentRecord = {
  id: string
  invoiceId: string
  amount: number
  currency: BusinessCurrency
  status: 'UNKNOWN' | 'USER_ENTERED' | 'IMPORTED_DOCUMENT' | 'CONNECTOR_CONFIRMED'
  evidence: AccountingEvidence
}

export type FinanceSummary = {
  currency: BusinessCurrency
  revenueSummary: string
  clientBalance: string
  accountsReceivable: string
  projectCostProfit: string
  paymentConnectorStatus: 'not-connected'
  warnings: string[]
}

export type AccountingLedgerRecord = {
  id: string
  type: 'revenue' | 'expense' | 'invoice' | 'payment' | 'accounts receivable' | 'accounts payable'
  date: string
  description: string
  clientOrSupplier: string
  amount: number
  currency: BusinessCurrency
  taxCategory: string
  costCenter: string
  evidence: AccountingEvidence
  documentAttachment?: {
    fileName: string
    mimeType: string
    size: number
  }
}

export type AccountingPackage = {
  chartOfAccountsPlaceholder: string[]
  ledger: AccountingLedgerRecord[]
  monthlyAccountingSummary: string
  monthlyRevenueReport: string
  monthlyExpenseReport: string
  invoicesSummary: string
  paymentsSummary: string
  accountsReceivableReport: string
  accountsPayableReport: string
  projectProfitLossReport: string
  taxPreparationChecklist: string[]
  documentsPendingForAccountant: string[]
  accountantHandoffPackage: string
  reviewNotice: string
}

export const accountingEvidenceLevels: AccountingEvidence[] = [
  'USER_ENTERED',
  'SYSTEM_GENERATED',
  'IMPORTED_DOCUMENT',
  'UNKNOWN',
  'NEEDS_ACCOUNTANT_REVIEW',
]

export const chartOfAccountsPlaceholder = [
  'Service revenue',
  'SaaS subscription revenue',
  'BIM/Revit production revenue',
  'ArchVis/render revenue',
  'DirectCut/video revenue',
  'Contractor/subcontractor expense',
  'Software/tools expense',
  'Marketing/sales expense',
  'Taxes payable placeholder',
  'Accounts receivable',
  'Accounts payable',
]

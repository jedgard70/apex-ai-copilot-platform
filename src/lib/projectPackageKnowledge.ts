export type ProjectPackageStatus = 'READY' | 'PARTIAL' | 'BLOCKED'

export type ProjectPackageArtifact = {
  id: string
  title: string
  status: ProjectPackageStatus
  summary: string
  evidence: string[]
  nextAction: string
}

export type ProjectPackageOutputs = {
  designReview: string
  boardPackage: string
  quantityAndBudget: string
  clientPresentation: string
  executionDocs: string
  contractAndFinance: string
  physicalFinancialSchedule: string
}

export type ProjectPackagePlan = {
  providerStatus: 'package-draft'
  goal: string
  projectName: string
  clientName: string
  packageStatus: ProjectPackageStatus
  executiveSummary: string
  outputs: ProjectPackageOutputs
  artifacts: ProjectPackageArtifact[]
  missingInputs: string[]
  nextActions: string[]
  message: string
}

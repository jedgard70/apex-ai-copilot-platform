/**
 * server/service/projectPackage.mjs
 *
 * Project Package Pipeline — consolida dados do projeto em pacote unico.
 */

/**
 * Constroi artefato de pacote.
 * @param {Object} params
 * @returns {Object}
 */
function buildArtifact({ id, title, checks, summary = '', nextAction = '' }) {
  return { id, title, checks, summary, nextAction, createdAt: new Date().toISOString() }
}

/**
 * Constroi pacote do projeto a partir de dados pre-processados.
 * @param {Object} data
 * @returns {Object}
 */
export function buildProjectPackage(data) {
  const {
    projectName = 'Apex Project',
    goal = 'Complete project package',
    files = [],
    exportsList = [],
    budgetTotal = 0,
    budgetCurrency = 'BRL',
    researchSources = 0,
    permitItems = 0,
    pendingContractQuestions = 0,
    profile = {},
  } = data

  const checksMapped = [
    `Briefing: ${profile.brief ? 'saved' : 'missing'}`,
    `Project type: ${profile.projectType || 'missing'}`,
    `Files: ${files.length}`
  ]

  const designArtifact = buildArtifact({
    id: 'design-review',
    title: 'Design review and board package',
    checks: checksMapped,
    summary: files.length
      ? 'Apex can structure the review package, board narrative and drawing handoff from the current workspace evidence.'
      : 'No source files are attached yet, so the board package cannot move past planning status.',
    nextAction: files.length
      ? 'Confirm which drawing should become the main presentation board and lock the revision constraints.'
      : 'Upload the base plan, facade, BIM or reference files first.',
  })

  // Transforma checks[] em evidence[] para bater com o front
  designArtifact.evidence = designArtifact.checks

  const packageStatus = exportsList.length > 0 ? 'READY' : 'PARTIAL'

  return {
    providerStatus: 'connected',
    goal,
    projectName,
    clientName: profile.clientName || 'Not Set',
    packageStatus,
    executiveSummary: `Project package contains ${exportsList.length} exports and ${files.length} files.`,
    outputs: {
      designReview: files.length ? 'Ready for review' : 'Missing files',
      boardPackage: exportsList.length ? 'Boards available' : 'No exports available',
      quantityAndBudget: budgetTotal > 0 ? `Budget: ${budgetTotal} ${budgetCurrency}` : 'No budget data',
      clientPresentation: 'Draft',
      executionDocs: permitItems > 0 ? `${permitItems} permit items` : 'No execution docs',
      contractAndFinance: 'Draft',
      physicalFinancialSchedule: 'Not available'
    },
    artifacts: [designArtifact],
    missingInputs: files.length === 0 ? ['Source files'] : [],
    nextActions: ['Review the generated package', 'Export the ZIP bundle'],
    message: exportsList.length > 0
      ? `Package built with ${exportsList.length} export(s) and ${files.length} file(s).`
      : 'No exports yet — generate something first (ArchVis, Budget, Research, etc).',
  }
}
